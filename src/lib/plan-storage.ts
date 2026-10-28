import { defaultPlaces, demoAnswers, exampleSchedule, type PlaceRow } from './plan-data'

export type PlanState = {
  answers: number[]
  question: number
  schedule: string
  organized: boolean
  option: number
  demo: boolean
  places: PlaceRow[]
}

export const PLAN_STORAGE_KEY = 'bobok-plan'

export const initialPlan: PlanState = {
  answers: [],
  question: 0,
  schedule: '',
  organized: false,
  option: 0,
  demo: false,
  places: defaultPlaces,
}

export const demoPlan: PlanState = {
  answers: demoAnswers,
  question: 5,
  schedule: exampleSchedule,
  organized: true,
  option: 0,
  demo: true,
  places: defaultPlaces,
}

// 랜딩에서 시작할 때 이전 상태가 복원되지 않도록 저장값을 직접 지정/삭제한다.
export function startFresh() {
  try {
    sessionStorage.removeItem(PLAN_STORAGE_KEY)
  } catch {}
}

export function startDemo() {
  try {
    sessionStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(demoPlan))
  } catch {}
}
