'use client'

import { useMemo } from 'react'
import { usePlan } from '@/components/PlanProvider'
import { placesToStops } from '@/lib/demo-data'
import { conditionFromAnswers, judge } from '@/lib/judge'

const EMPTY = {}

// 부모님이 고른 조건(필요하면 S5에서 바꾼 값)과 현재 일정으로 판정한다.
export function usePlanJudge() {
  const { state } = usePlan()
  const { answers, places } = state
  const tuned = state.tuned ?? EMPTY
  return useMemo(() => {
    const chosen = conditionFromAnswers(answers)
    const condition = { ...chosen, ...tuned }
    const stops = placesToStops(places)
    return { chosen, condition, stops, result: judge(stops, condition) }
  }, [answers, places, tuned])
}
