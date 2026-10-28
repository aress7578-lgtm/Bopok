'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { initialPlan, PLAN_STORAGE_KEY, type PlanState } from '@/lib/plan-storage'

type PlanContextValue = {
  state: PlanState
  update: (patch: Partial<PlanState>) => void
  toast: string
  notify: (message: string) => void
  go: (path: string) => void
}

const PlanContext = createContext<PlanContextValue | null>(null)

export function usePlan() {
  const value = useContext(PlanContext)
  if (!value) throw new Error('usePlan must be used inside PlanProvider')
  return value
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<PlanState>(initialPlan)
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)

  // 첫 렌더링은 기본값, 마운트 후 sessionStorage에서 복원
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PLAN_STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setState({ ...initialPlan, ...JSON.parse(raw) })
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      sessionStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state, hydrated])

  const update = useCallback((patch: Partial<PlanState>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const notify = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 1800)
  }, [])

  const go = useCallback((path: string) => {
    router.push(path)
    window.scrollTo(0, 0)
  }, [router])

  return <PlanContext.Provider value={{ state, update, toast, notify, go }}>{children}</PlanContext.Provider>
}
