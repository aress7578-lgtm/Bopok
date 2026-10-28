import type { Segment, Stop } from './judge'
import type { PlaceRow } from './plan-data'

// 데모용 구간 데이터. 거리·계단 수·출처는 예시이며 실제 조사 값이 아니다.
const CHECKED = '2026-10'

export const placeSegments: Record<string, Segment[]> = {
  '한밭수목원': [
    { id: 'hb1', label: '주차장 → 입구', distanceM: 200, note: '추정치', source: '한밭수목원 공식 안내도', checkedAt: CHECKED },
    { id: 'hb2', label: '입구 → 실내 쉼터', distanceM: 240, note: '쉼터(실내)', shelterName: '실내 쉼터', source: '한밭수목원 공식 안내도', checkedAt: CHECKED },
    {
      id: 'hb3', label: '실내 쉼터 → 전망 데크', distanceM: 140, stairs: 24, source: '한밭수목원 공식 안내도', checkedAt: CHECKED,
      ramp: { id: 'hb3r', label: '실내 쉼터 → 전망 데크 (경사로)', distanceM: 240, slope: true, note: '경사로', source: '한밭수목원 공식 안내도', checkedAt: CHECKED },
    },
    { id: 'hb4', label: '전망 데크 → 정원', distanceM: 360, source: '한밭수목원 공식 안내도', checkedAt: CHECKED },
  ],
  '국립중앙과학관': [
    { id: 'sc1', label: '주차장 → 전시관', distanceM: 600, source: '국립중앙과학관 관람 안내도', checkedAt: CHECKED },
  ],
  '대전시립미술관': [
    { id: 'am1', label: '정류장 → 미술관', distanceM: 320, source: '대전시립미술관 이용 안내', checkedAt: CHECKED },
  ],
  '이응노미술관': [
    {
      id: 'le1', label: '주차장 → 전시관', distanceM: 400, stairs: 10, source: '이응노미술관 이용 안내', checkedAt: CHECKED,
      ramp: { id: 'le1r', label: '주차장 → 전시관 (경사로)', distanceM: 360, slope: true, note: '경사로', source: '이응노미술관 이용 안내', checkedAt: CHECKED },
    },
  ],
  '엑스포과학공원 한빛탑': [
    { id: 'hv1', label: '주차장 → 광장', distanceM: 480, shelterName: '광장 쉼터', source: '엑스포과학공원 안내도', checkedAt: CHECKED },
    {
      id: 'hv2', label: '광장 → 한빛탑', distanceM: 280, stairs: 30, source: '엑스포과학공원 안내도', checkedAt: CHECKED,
      ramp: { id: 'hv2r', label: '광장 → 한빛탑 (경사로)', distanceM: 420, slope: true, note: '경사로', source: '엑스포과학공원 안내도', checkedAt: CHECKED },
    },
  ],
  '엑스포다리': [
    { id: 'eb1', label: '주차장 → 다리', distanceM: 520, source: '엑스포과학공원 안내도', checkedAt: CHECKED },
  ],
}

// 구간 데이터가 없는 장소는 known: false (정보 없음)
export function placesToStops(places: PlaceRow[]): Stop[] {
  return places.map(p => {
    const segments = placeSegments[p.name]
    return { name: p.name, known: !!segments, segments: segments ?? [] }
  })
}
