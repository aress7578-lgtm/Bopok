import { describe, expect, it } from 'vitest'
import { buildFinalPlan } from '../lib/final-plan'
import { conditionFromAnswers } from '../lib/judge'
import { defaultPlaces } from '../lib/plan-data'
import { buildShareText } from '../lib/share-text'
import { FEATURE_TOILET } from './flags'

describe('FEATURE_TOILET', () => {
  it('회의 전까지 꺼져 있고, 화면·공유 글에 화장실 문구가 없다', () => {
    const plan = buildFinalPlan(defaultPlaces, 2, conditionFromAnswers([1, 1, 1, 0, 0]))
    expect(FEATURE_TOILET).toBe(false)
    expect(JSON.stringify(plan.rows)).not.toContain('화장실')
    expect(buildShareText(plan)).not.toContain('화장실')
  })

  it('쉼터 표시는 그대로 유지된다', () => {
    const plan = buildFinalPlan(defaultPlaces, 2, conditionFromAnswers([1, 1, 1, 0, 0]))
    expect(plan.rows[0].detail).toContain('실내 쉼터에서 10분 쉬기')
  })
})
