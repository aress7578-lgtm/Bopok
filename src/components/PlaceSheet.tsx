'use client'

import { useEffect, useRef } from 'react'
import { placeChoices } from '@/lib/plan-data'

export function PlaceSheet({ onSelect, onClose }: { onSelect: (name: string) => void; onClose: () => void }) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const sheet = sheetRef.current
    sheet?.querySelector<HTMLElement>('button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !sheet) return
      const items = Array.from(sheet.querySelectorAll<HTMLElement>('button'))
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener?.focus()
    }
  }, [onClose])

  return <div className="sheet-backdrop" onClick={onClose}>
    <div className="sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-label="장소 고르기" onClick={e => e.stopPropagation()}>
      <b>장소를 골라주세요</b>
      <div className="sheet-list">{placeChoices.map(name => <button key={name} onClick={() => onSelect(name)}>{name}</button>)}</div>
      <button className="sheet-close" onClick={onClose}>닫기</button>
    </div>
  </div>
}
