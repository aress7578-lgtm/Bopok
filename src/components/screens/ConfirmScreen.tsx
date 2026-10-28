'use client'

import { useState } from 'react'
import { usePlan } from '@/components/PlanProvider'
import { PlaceSheet } from '@/components/PlaceSheet'

// null = 닫힘, 'add' = 새 줄 추가, 그 외 = 바꿀 줄의 id
export function ConfirmScreen() {
  const { state, update, go } = usePlan()
  const { places } = state
  const [target, setTarget] = useState<string | null>(null)

  const select = (name: string) => {
    if (target === 'add') {
      const last = places[places.length - 1]
      const [h, m] = (last?.time ?? '15:00').split(':').map(Number)
      const minutes = Math.min(h * 60 + m + 90, 23 * 60)
      const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
      update({ places: [...places, { id: `p${Date.now()}`, time, name, tag: '' }] })
    } else {
      update({ places: places.map(p => p.id === target ? { ...p, name, tag: p.tag === '정보 없음' ? '' : p.tag } : p) })
    }
    setTarget(null)
  }

  return <div className="planner-content confirm-page">
    <p className="question-count">3 / 6 · 확인</p><h1>이렇게 정리했어요</h1><p className="question-help">맞는지 확인해 주세요.</p>
    <div className="confirm-list">{places.map(row => <div key={row.id}><time>{row.time}</time><span><b>{row.name}</b>{row.tag && <small className={row.tag === '정보 없음' ? 'unknown-tag' : ''}>{row.tag}</small>}</span><button onClick={() => setTarget(row.id)}>장소 바꾸기</button></div>)}</div>
    <button className="add-place" onClick={() => setTarget('add')}>+ 장소 추가</button>
    <div className="planner-actions"><button className="back" onClick={() => go('/plan/schedule')}>이전</button><button className="button" onClick={() => go('/plan/result')}>판정받기</button></div>
    {target && <PlaceSheet onSelect={select} onClose={() => setTarget(null)} />}
  </div>
}
