export const questions = [
  { title: '쉬지 않고 얼마나 걸으실 수 있나요?', options: ['집 앞 편의점까지', '동네 마트까지', '버스 한 정거장', '잘 모르겠어요'], notes: ['약 10분', '약 20분', '약 30분', '기본값 20분'] },
  { title: '하루에 모두 합쳐 얼마나 걸으셔도 괜찮나요?', options: ['동네 한 바퀴', '시장 장보기', '반나절 나들이', '잘 모르겠어요'], notes: ['약 30분', '약 60분', '약 90분', '기본값 60분'] },
  { title: '한 번 쉴 때 얼마나 쉬셔야 하나요?', options: ['잠깐 앉으면 돼요', '차 한 잔 정도', '넉넉히', '잘 모르겠어요'], notes: ['약 5분', '약 10분', '약 20분', '기본값 10분'] },
  { title: '계단은 피하시는 게 좋을까요?', options: ['피하고 싶어요', '괜찮아요', '잘 모르겠어요'], notes: ['계단 없는 길을 찾아요', '계단도 포함해요', '기본값: 피하기'] },
  { title: '걷는 속도는 어떠세요?', options: ['천천히 걸으세요', '보통이에요', '잘 모르겠어요'], notes: ['여유 있게 계산해요', '평균 속도로 계산해요', '기본값: 천천히'] },
]

export const exampleSchedule = '10시 한밭수목원 보고 점심 먹고 국립중앙과학관, 4시에 대전시립미술관 예약'

export const stages = ['조건', '일정', '확인', '판정', '수정안', '확정']

export const stagePaths = [
  '/plan/condition',
  '/plan/schedule',
  '/plan/confirm',
  '/plan/result',
  '/plan/options',
  '/plan/final',
]

export const reviewPath = '/review'

// 기본 조건(쉬지 않고 20분 / 하루 60분 / 쉬는 시간 10분 / 계단 피하기 / 천천히)과 같은 예시 답
export const demoAnswers = [1, 1, 1, 0, 0]

export type PlaceRow = { id: string; time: string; name: string; tag: string; finalName?: string; finalNote?: string }

export const defaultPlaces: PlaceRow[] = [
  { id: 'p1', time: '10:00', name: '한밭수목원', tag: '꼭 갈 곳' },
  { id: 'p2', time: '12:00', name: '점심 (둔산동 식당)', tag: '정보 없음', finalName: '점심 (둔산동)', finalNote: '수목원 → 식당 택시 약 5분' },
  { id: 'p3', time: '13:30', name: '국립중앙과학관', tag: '' },
  { id: 'p4', time: '16:00', name: '대전시립미술관', tag: '예약 16:00' },
]

export const placeChoices = ['한밭수목원', '국립중앙과학관', '대전시립미술관', '이응노미술관', '엑스포과학공원 한빛탑', '엑스포다리']

export const reviewSegments = ['주차장 → 입구', '입구 → 실내 쉼터', '실내 쉼터 → 전망 데크 (경사로)', '전망 데크 → 정원', '점심 장소 안 길']

export const reviewQuestions = ['계단이 있었나요?', '쉬지 않고 걸을 만했나요?', '쉴 곳이 있었나요?']
