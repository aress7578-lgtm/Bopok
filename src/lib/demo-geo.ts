// 임시 좌표, 구간 표 좌표로 교체 필요.
// 아래 좌표는 데모용으로 대전 엑스포·한밭수목원 일대에 그럴듯하게 둔 값이며 실제 조사 값이 아니다.
import type { Coord } from './map-types'

export type GeoNode = {
  id: string
  placeId: string
  name: string
  kind: 'start' | 'entrance' | 'sight' | 'rest' | 'toilet'
  restType: 'indoor' | 'outdoor' | null
  coord: Coord
}

// 구간 좌표는 구간 id 로 찾는다(우회로 구간 id 포함). ride 는 장소 사이 탈것 구간.
export type SegmentGeo = { from: string; to: string; path: Coord[]; ride?: boolean }

const n = (id: string, placeId: string, name: string, kind: GeoNode['kind'], coord: Coord, restType: GeoNode['restType'] = null): GeoNode =>
  ({ id, placeId, name, kind, restType, coord })

export const geoNodes: Record<string, GeoNode> = Object.fromEntries([
  n('hb-p', '한밭수목원', '주차장', 'start', [127.3866, 36.3690]),
  n('hb-in', '한밭수목원', '입구', 'entrance', [127.3856, 36.3684]),
  n('hb-rest', '한밭수목원', '실내 쉼터', 'rest', [127.3846, 36.3688], 'indoor'),
  n('hb-deck', '한밭수목원', '전망 데크', 'sight', [127.3836, 36.3680]),
  n('hb-garden', '한밭수목원', '정원', 'sight', [127.3848, 36.3672]),
  n('sc-p', '국립중앙과학관', '주차장', 'start', [127.3745, 36.3763]),
  n('sc-hall', '국립중앙과학관', '전시관', 'entrance', [127.3770, 36.3774]),
  n('am-stop', '대전시립미술관', '정류장', 'start', [127.3862, 36.3744]),
  n('am-hall', '대전시립미술관', '미술관', 'entrance', [127.3872, 36.3753]),
  n('le-p', '이응노미술관', '주차장', 'start', [127.3905, 36.3728]),
  n('le-hall', '이응노미술관', '전시관', 'entrance', [127.3915, 36.3738]),
  n('hv-p', '엑스포과학공원 한빛탑', '주차장', 'start', [127.3895, 36.3735]),
  n('hv-plaza', '엑스포과학공원 한빛탑', '광장 쉼터', 'rest', [127.3880, 36.3750], 'outdoor'),
  n('hv-tower', '엑스포과학공원 한빛탑', '한빛탑', 'sight', [127.3885, 36.3760]),
  n('eb-p', '엑스포다리', '주차장', 'start', [127.3915, 36.3705]),
  n('eb-bridge', '엑스포다리', '다리', 'sight', [127.3935, 36.3720]),
].map(node => [node.id, node]))

export const segmentGeo: Record<string, SegmentGeo> = {
  hb1: { from: 'hb-p', to: 'hb-in', path: [[127.3866, 36.3690], [127.3861, 36.3687], [127.3856, 36.3684]] },
  hb2: { from: 'hb-in', to: 'hb-rest', path: [[127.3856, 36.3684], [127.3851, 36.3687], [127.3846, 36.3688]] },
  hb3: { from: 'hb-rest', to: 'hb-deck', path: [[127.3846, 36.3688], [127.3841, 36.3684], [127.3836, 36.3680]] },
  hb3r: { from: 'hb-rest', to: 'hb-deck', path: [[127.3846, 36.3688], [127.3842, 36.3692], [127.3835, 36.3688], [127.3832, 36.3683], [127.3836, 36.3680]] },
  hb4: { from: 'hb-deck', to: 'hb-garden', path: [[127.3836, 36.3680], [127.3841, 36.3675], [127.3848, 36.3672]] },
  sc1: { from: 'sc-p', to: 'sc-hall', path: [[127.3745, 36.3763], [127.3758, 36.3770], [127.3770, 36.3774]] },
  am1: { from: 'am-stop', to: 'am-hall', path: [[127.3862, 36.3744], [127.3868, 36.3749], [127.3872, 36.3753]] },
  le1: { from: 'le-p', to: 'le-hall', path: [[127.3905, 36.3728], [127.3910, 36.3733], [127.3915, 36.3738]] },
  le1r: { from: 'le-p', to: 'le-hall', path: [[127.3905, 36.3728], [127.3912, 36.3729], [127.3917, 36.3734], [127.3915, 36.3738]] },
  hv1: { from: 'hv-p', to: 'hv-plaza', path: [[127.3895, 36.3735], [127.3888, 36.3743], [127.3880, 36.3750]] },
  hv2: { from: 'hv-plaza', to: 'hv-tower', path: [[127.3880, 36.3750], [127.3883, 36.3755], [127.3885, 36.3760]] },
  hv2r: { from: 'hv-plaza', to: 'hv-tower', path: [[127.3880, 36.3750], [127.3874, 36.3756], [127.3879, 36.3762], [127.3885, 36.3760]] },
  eb1: { from: 'eb-p', to: 'eb-bridge', path: [[127.3915, 36.3705], [127.3925, 36.3712], [127.3935, 36.3720]] },
}
