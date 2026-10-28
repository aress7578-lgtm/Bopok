import { formatRange, type Condition, type JudgeResult } from './judge'

// 확정된 일정을 다시 판정한 결과에서 위반마다 경고 한 줄을 만든다. 위반이 없으면 빈 배열.
export function buildWarnings(result: JudgeResult, condition: Condition): string[] {
  const lines: string[] = []
  for (const v of result.violations) {
    if (v.kind === 'continuous') {
      lines.push(`⚠ 쉬지 않고 걷는 시간이 조건(${condition.continuousMin}분)을 넘어요 (${formatRange(result.longest)})`)
    }
  }
  for (const v of result.violations) {
    if (v.kind === 'day') {
      lines.push(`⚠ 하루 총 걷는 시간이 조건(${condition.dayMin}분)을 넘어요 (${formatRange(result.day)})`)
    }
  }
  for (const v of result.violations) {
    if (v.kind === 'stairs') {
      lines.push(`⚠ 계단 구간이 남아 있어요 (${v.place} ${v.count}곳)`)
    }
  }
  return lines
}
