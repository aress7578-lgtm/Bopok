'use client'

import { useMemo } from 'react'
import { usePlan } from '@/components/PlanProvider'
import { placesToStops } from '@/lib/demo-data'
import { conditionFromAnswers, judge } from '@/lib/judge'

// 부모님이 고른 조건과 현재 일정으로 판정한다.
export function usePlanJudge() {
  const { state } = usePlan()
  const { answers, places } = state
  return useMemo(() => {
    const condition = conditionFromAnswers(answers)
    const stops = placesToStops(places)
    return { condition, stops, result: judge(stops, condition) }
  }, [answers, places])
}
