'use client'

import { usePlan } from '@/components/PlanProvider'
import { exampleSchedule } from '@/lib/plan-data'

export function ScheduleScreen() {
  const { state, update, go } = usePlan()
  const { schedule } = state
  return <div className="planner-content wide">
    <p className="question-count">2 / 6 · 일정</p><h1>어디로 가실 건가요?</h1><p className="question-help">시간과 장소를 편하게 적어주세요. AI가 일정으로 정리해요.</p>
    <textarea className="schedule-input" value={schedule} onChange={e => update({ schedule: e.target.value, organized: false })} placeholder={`예: ${exampleSchedule}`} />
    <div className="organize-row"><button className="back" onClick={() => update({ schedule: exampleSchedule })}>예시 일정 넣기</button><button className="button" disabled={!schedule.trim()} onClick={() => { update({ organized: true }); go('/plan/confirm') }}>정리하기</button></div>
    <button className="direct-link" onClick={() => { update({ organized: true }); go('/plan/confirm') }}>장소 목록에서 직접 고르기</button>
    <div className="planner-actions"><button className="back" onClick={() => go('/plan/condition')}>이전</button></div>
  </div>
}
