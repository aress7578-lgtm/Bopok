// S1 시작 화면 연출 값. 시간은 모두 ms, 거리는 m, 각도는 도

// ───────── 글자 애니메이션 ─────────
export const TITLE_LINES = ['부모님 보폭에 맞춘', '하루 여행']
export const TITLE_TEXT = TITLE_LINES.join(' ')
export const GLYPH_DURATION_MS = 1100        // 글자 하나가 내려오는 시간
export const GLYPH_STAGGER_MS = 70           // 글자마다 늦게 시작하는 간격
export const GLYPH_STAGGER_SEEN_MS = 25      // 다시 들어온 경우(sessionStorage)
export const GLYPH_DROP_PX = -48
export const GLYPH_BLUR_PX = 8
export const GLYPH_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)'
export const GLYPH_TILT_DEG = -3             // 내려온 뒤 살짝 흔들리며 자리 잡는 각도
export const LINE2_OVERLAP_MS = 500          // 첫 줄이 끝나기 이 시간 전에 둘째 줄이 이어서 시작
export const LEAD_FADE_MS = 600
export const ACTIONS_FADE_MS = 600
export const ACTIONS_STAGGER_MS = 150
export const SEEN_KEY = 'bobok-landing-seen'

// ───────── 둘러보기 전환 ─────────
export const TEXT_OUT_MS = 500               // 제목·설명·버튼이 위로 사라짐
export const TEXT_OUT_RISE_PX = -24
export const CLOUD_CLEAR_MS = 2500           // 두꺼운 구름이 흩어짐
export const FLY_DELAY_MS = 300              // 구름·글자가 움직이기 시작하고 나서 카메라가 내려앉기 시작
export const FLY_MS = 4000
export const RISE_MS = 1800                  // 건물 높이 배율 0 → 1 (카메라가 기울기 시작할 때부터)
export const HINT_MS = 2500                  // "끌어서 둘러보세요" 안내
export const BACK_FLY_MS = 2500              // "처음으로" 복귀 카메라 이동
export const PIN_FADE_MS = 600

// ───────── 카메라 ─────────
export type LandingView = { center: [number, number]; zoom: number; pitch: number; bearing: number }
// 단계 A: 시연 권역 중심에서 위에서 내려다본 평면
export const INTRO_VIEW: LandingView = { center: [127.385, 36.372], zoom: 14.6, pitch: 0, bearing: 0 }
export const DRIFT_METERS = 150              // 평면 지도가 천천히 흐르는 거리(왕복)
export const DRIFT_MS = 30000
// 단계 B: 내려앉아 도착하는 곳. 기울기는 줌별 제한(map-config 의 MAP_PITCH_LIMITS) 안으로 맞춰진다
export const EXPLORE_VIEW: LandingView = { center: [127.3845, 36.3705], zoom: 15.8, pitch: 62, bearing: -25 }
// 둘러보기 웨이포인트(권역 안). 첫 곳은 도착 지점과 같다
export const TOUR_MS = 14000
export const TOUR_RESUME_MS = 5000           // 만진 뒤 이만큼 안 만지면 자동 이동을 다시 이어간다
export const TOUR_WAYPOINTS: LandingView[] = [
  EXPLORE_VIEW,
  { center: [127.3885, 36.3735], zoom: 15.8, pitch: 60, bearing: 10 },
  { center: [127.3925, 36.3750], zoom: 15.8, pitch: 64, bearing: 45 },
  { center: [127.3870, 36.3775], zoom: 15.8, pitch: 62, bearing: 80 },
  { center: [127.3790, 36.3748], zoom: 15.8, pitch: 66, bearing: 15 },
]

// 시연 장소 핀(한밭수목원, 국립중앙과학관, 대전시립미술관). 좌표는 demo-geo.ts 의 입구·전시관 값
export const PLACE_PINS: { id: string; name: string; coord: [number, number] }[] = [
  { id: 'place-hanbat', name: '한밭수목원', coord: [127.3856, 36.3684] },
  { id: 'place-science', name: '국립중앙과학관', coord: [127.3770, 36.3774] },
  { id: 'place-art', name: '대전시립미술관', coord: [127.3872, 36.3753] },
]

// ───────── 화면 ─────────
export const HERO_MIN_HEIGHT_PX = 640
export const MOBILE_MAX_WIDTH = 768          // 이보다 좁으면 휴대폰: 협력 제스처, 나무·그림자 끔
export const VEIL = { center: 0.85, mid: 0.55, midStop: 35, end: 70 } // 제목 뒤 타원 덮개(바탕색 진하기, % 위치)

// ───────── 글자별 시작 지연 계산 ─────────
// 띄어쓰기는 지연 칸을 쓰지 않는다. 둘째 줄은 첫 줄이 끝나기 LINE2_OVERLAP_MS 전에 이어서 시작한다.
export function glyphDelays(lines: string[], stagger: number): number[][] {
  let lineStart = 0
  return lines.map(line => {
    const glyphs = [...line].filter(c => c !== ' ')
    let n = 0
    const delays = [...line].map(c => (c === ' ' ? 0 : lineStart + n++ * stagger))
    const lineEnd = lineStart + Math.max(glyphs.length - 1, 0) * stagger + GLYPH_DURATION_MS
    lineStart = Math.max(lineEnd - LINE2_OVERLAP_MS, lineStart)
    return delays
  })
}

// 글자가 모두 내려온 시각(설명이 나타나기 시작하는 때)
export function titleDoneAt(lines: string[], stagger: number): number {
  const d = glyphDelays(lines, stagger)
  return Math.max(...d.flat()) + GLYPH_DURATION_MS
}
