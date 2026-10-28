'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'bobok-large-text'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [largeText, setLargeText] = useState(false)
  // 첫 렌더링은 기본값, 마운트 후 localStorage에서 복원 (hydration 불일치 방지)
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(STORAGE_KEY) === '1') setLargeText(true)
    } catch {}
  }, [])
  const toggleText = () => {
    const next = !largeText
    setLargeText(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {}
  }
  return <div className={largeText ? 'app large-text' : 'app'}>
    <button className="font-toggle" onClick={toggleText} aria-label="글자 크기 변경"><span className={!largeText ? 'active' : ''}>가</span><span className={largeText ? 'active' : ''}>가+</span></button>
    {children}
  </div>
}
