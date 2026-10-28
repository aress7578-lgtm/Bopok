'use client'

import { useEffect, useState } from 'react'
import { usePlan } from '@/components/PlanProvider'
import { reviewQuestions, reviewSegments } from '@/lib/plan-data'

const STORAGE_KEY = 'bobok-reviews'

type Answers = (boolean | undefined)[]

export function ReviewScreen() {
  const { go, notify } = usePlan()
  const [saved, setSaved] = useState<Record<string, boolean[]>>({})
  const [open, setOpen] = useState<string | null>(null)
  const [draft, setDraft] = useState<Answers>([])

  // 첫 렌더링은 빈 값, 마운트 후 localStorage에서 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSaved(JSON.parse(raw))
    } catch {}
  }, [])

  const start = (label: string) => {
    setOpen(label)
    setDraft(saved[label] ?? [])
  }

  const answer = (i: number, value: boolean) => {
    const next = [...draft]
    next[i] = value
    setDraft(next)
  }

  const complete = reviewQuestions.every((_, i) => draft[i] !== undefined)

  const save = () => {
    if (!open || !complete) return
    const next = { ...saved, [open]: reviewQuestions.map((_, i) => draft[i] as boolean) }
    setSaved(next)
    setOpen(null)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      notify('평가를 저장했어요')
    } catch {
      notify('이 기기에는 저장하지 못했어요')
    }
  }

  return <div className="planner-content review-page">
    <button className="back" onClick={() => go('/plan/final')}>← 확정 일정으로</button><h1>다녀오신 길을 알려주세요</h1><p className="question-help">다음 가족의 판정이 더 정확해져요.</p>
    <div className="review-list">{reviewSegments.map(item => <div key={item} className="review-item">
      <div className="review-head"><b>{item}</b><button onClick={() => open === item ? setOpen(null) : start(item)}>{saved[item] ? '✓ 평가 완료' : '평가하기'}</button></div>
      {open === item && <div className="review-form">
        {reviewQuestions.map((q, i) => <fieldset key={q}><legend>{q}</legend>
          <button type="button" aria-pressed={draft[i] === true} className={draft[i] === true ? 'on' : ''} onClick={() => answer(i, true)}>예</button>
          <button type="button" aria-pressed={draft[i] === false} className={draft[i] === false ? 'on' : ''} onClick={() => answer(i, false)}>아니오</button>
        </fieldset>)}
        <button className="button small" disabled={!complete} onClick={save}>평가 저장</button>
      </div>}
    </div>)}</div>
  </div>
}
