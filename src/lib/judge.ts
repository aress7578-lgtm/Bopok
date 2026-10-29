export type Speed = 'slow' | 'normal'

export type Condition = {
  continuousMin: number
  dayMin: number
  restMin: number
  avoidStairs: boolean
  speed: Speed
}

// S5 "조건 바꿔 보기"에서 부모님이 고른 조건 위에 덮어쓰는 값
export type TunedCondition = Partial<Pick<Condition, 'continuousMin' | 'dayMin' | 'avoidStairs'>>

export type Segment = {
  id: string
  label: string
  distanceM: number
  stairs?: number
  slope?: boolean
  note?: string
  shelterName?: string
  restMin?: number
  // 출처 문자열과 확인 날짜("YYYY-MM" 또는 "YYYY-MM-DD"). 비어 있으면 "출처 확인 중"으로 표시한다.
  source?: string
  checkedAt?: string
  ramp?: Segment
}

export type Stop = { name: string; known: boolean; segments: Segment[] }

export type Verdict = 'ok' | 'info' | 'adjust'

export type Minutes = { base: number; high: number }

export type SegmentResult = {
  segment: Segment
  time: Minutes
  status: 'ok' | 'warn'
}

export type StopResult = {
  name: string
  known: boolean
  walk: Minutes
  segments: SegmentResult[]
}

export type Violation =
  | { kind: 'stairs'; place: string; count: number }
  | { kind: 'continuous'; place: string; over: number }
  | { kind: 'day'; over: number }

export type JudgeResult = {
  verdict: Verdict
  reason: string
  day: Minutes
  longest: Minutes & { place: string }
  stops: StopResult[]
  violations: Violation[]
  unknown: string[]
  focus: number
  selectedSegmentId: string | null
}

// 걷는 속도(m/분)
const SPEED: Record<Speed, number> = { slow: 40, normal: 60 }
// 구간 걷는 시간의 범위: [값, 값 × 1.1]
const HIGH_FACTOR = 1.1
const EPS = 1e-9

const CONTINUOUS_BY_ANSWER = [10, 20, 30, 20]
const DAY_BY_ANSWER = [30, 60, 90, 60]
const REST_BY_ANSWER = [5, 10, 20, 10]
const AVOID_BY_ANSWER = [true, false, true]
const SPEED_BY_ANSWER: Speed[] = ['slow', 'normal', 'slow']

// "잘 모르겠어요"(마지막 선택지) 또는 미응답은 기본값으로 계산한다.
export function conditionFromAnswers(answers: (number | undefined | null)[]): Condition {
  const pick = <T,>(list: T[], i: number | undefined | null) =>
    list[typeof i === 'number' && i >= 0 && i < list.length ? i : list.length - 1]
  return {
    continuousMin: pick(CONTINUOUS_BY_ANSWER, answers[0]),
    dayMin: pick(DAY_BY_ANSWER, answers[1]),
    restMin: pick(REST_BY_ANSWER, answers[2]),
    avoidStairs: pick(AVOID_BY_ANSWER, answers[3]),
    speed: pick(SPEED_BY_ANSWER, answers[4]),
  }
}

export function round(n: number) {
  return Math.round(n + EPS)
}

export function formatRange(m: Minutes) {
  return `약 ${round(m.base)}~${round(m.high)}분`
}

function weight(s: Segment) {
  if (s.stairs && s.stairs > 0) return 2
  if (s.slope) return 1.5
  return 1
}

function walkMinutes(s: Segment, speed: Speed) {
  return (s.distanceM / SPEED[speed]) * weight(s)
}

function range(base: number): Minutes {
  return { base, high: base * HIGH_FACTOR }
}

export function unknownLabel(name: string) {
  return name.startsWith('점심') ? '점심 장소' : name
}

export function judge(stops: Stop[], condition: Condition): JudgeResult {
  const violations: Violation[] = []
  const stopResults: StopResult[] = []
  let day = 0
  let longest = { base: 0, place: '', stopIndex: -1 }
  let stairsStop = -1

  stops.forEach((stop, stopIndex) => {
    // 장소를 바꾸면 연속 걷기는 끊긴다(관람·식사 등으로 앉는다고 본다).
    let run = 0
    let stopTotal = 0
    let stairsCount = 0
    const segments: SegmentResult[] = stop.segments.map(segment => {
      const base = walkMinutes(segment, condition.speed)
      run += base
      stopTotal += base
      day += base
      const stairsViolation = condition.avoidStairs && !!segment.stairs && segment.stairs > 0
      const continuousViolation = run * HIGH_FACTOR > condition.continuousMin + EPS
      if (stairsViolation) stairsCount += 1
      if (run > longest.base) longest = { base: run, place: stop.name, stopIndex }
      // 쉼터에서 쉬면 연속 걷기가 끊긴다.
      if (segment.restMin && segment.restMin > 0) run = 0
      return { segment, time: range(base), status: stairsViolation || continuousViolation ? 'warn' : 'ok' }
    })
    if (stairsCount > 0) {
      if (stairsStop < 0) stairsStop = stopIndex
      violations.push({ kind: 'stairs', place: stop.name, count: stairsCount })
    }
    stopResults.push({ name: stop.name, known: stop.known, walk: range(stopTotal), segments })
  })

  const longestRange = range(longest.base)
  const dayRange = range(day)
  const continuousOver = longestRange.high - condition.continuousMin
  const dayOver = dayRange.high - condition.dayMin
  if (continuousOver > EPS) violations.push({ kind: 'continuous', place: longest.place, over: continuousOver })
  if (dayOver > EPS) violations.push({ kind: 'day', over: dayOver })

  const unknown = stops.filter(s => !s.known).map(s => s.name)
  const verdict: Verdict = violations.length > 0 ? 'adjust' : unknown.length > 0 ? 'info' : 'ok'

  // 판정 이유: 계단 위반을 먼저, 없으면 가장 많이 넘은 위반을 장소 이름과 숫자로
  let reason: string
  const stairs = violations.find(v => v.kind === 'stairs')
  if (stairs) {
    reason = `${stairs.place} 안에 계단 구간이 있어요`
  } else if (verdict === 'adjust') {
    reason = continuousOver >= dayOver
      ? `${longest.place}에서 쉬지 않고 걷는 시간이 ${formatRange(longestRange)}라 조건 ${condition.continuousMin}분을 넘어요`
      : `하루 총 걷는 시간이 ${formatRange(dayRange)}라 조건 ${condition.dayMin}분을 넘어요`
  } else if (unknown.length > 0) {
    reason = `${unknownLabel(unknown[0])}의 길 정보가 아직 없어서 판정이 완전하지 않아요`
  } else {
    reason = '모든 구간이 부모님 조건에 맞아요'
  }

  const firstWithSegments = stopResults.findIndex(s => s.segments.length > 0)
  const focus = stairsStop >= 0 ? stairsStop : longest.stopIndex >= 0 ? longest.stopIndex : Math.max(firstWithSegments, 0)
  const selected = stopResults[focus]?.segments.find(s => s.status === 'warn')

  return {
    verdict,
    reason,
    day: dayRange,
    longest: { ...longestRange, place: longest.place },
    stops: stopResults,
    violations,
    unknown,
    focus,
    selectedSegmentId: selected ? selected.segment.id : null,
  }
}

function longestRunOfStop(stop: Stop, speed: Speed) {
  let run = 0
  let best = 0
  for (const s of stop.segments) {
    run += walkMinutes(s, speed)
    best = Math.max(best, run)
    if (s.restMin && s.restMin > 0) run = 0
  }
  return best
}

export type OptionKey = 0 | 1 | 2

// 수정안은 앞의 변경을 포함해 쌓인다. 0 = 원래 일정, 1 = A 동선 조정, 2 = B 휴식 추가
export function applyOption(stops: Stop[], option: OptionKey, condition: Condition): Stop[] {
  if (option === 0) return stops
  const withRamp = stops.map(stop => ({
    ...stop,
    segments: stop.segments.map(s => (s.stairs && s.ramp ? s.ramp : s)),
  }))
  if (option === 1) return withRamp

  // B: 가장 길게 걷는 장소에서, 쉬었을 때 최장 연속 걷기가 가장 짧아지는 쉼터(없으면 아무 구간 뒤)에서 쉰다.
  let target = -1
  let targetRun = 0
  withRamp.forEach((stop, i) => {
    const run = longestRunOfStop(stop, condition.speed)
    if (run > targetRun) {
      target = i
      targetRun = run
    }
  })
  if (target < 0) return withRamp

  const segments = withRamp[target].segments
  const inner = segments.slice(0, -1).map((_, i) => i)
  const shelters = inner.filter(i => segments[i].shelterName)
  const candidates = shelters.length > 0 ? shelters : inner
  let bestIndex = -1
  let bestRun = Infinity
  for (const i of candidates) {
    const trial = segments.map((s, j) => (j === i ? { ...s, restMin: condition.restMin } : s))
    const run = longestRunOfStop({ ...withRamp[target], segments: trial }, condition.speed)
    if (run < bestRun) {
      bestRun = run
      bestIndex = i
    }
  }
  if (bestIndex < 0) return withRamp
  return withRamp.map((stop, i) =>
    i === target
      ? { ...stop, segments: stop.segments.map((s, j) => (j === bestIndex ? { ...s, restMin: condition.restMin } : s)) }
      : stop,
  )
}
