'use client'

import { usePathname } from 'next/navigation'
import { usePlan } from '@/components/PlanProvider'
import { reviewPath, stagePaths, stages } from '@/lib/plan-data'

export function PlannerFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { state, toast, go } = usePlan()
  const isReview = pathname === reviewPath
  const stage = isReview ? 6 : Math.max(stagePaths.indexOf(pathname), 0)
  return (
    <div className="planner">
      <header className="planner-nav"><button className="brand plain" onClick={() => go('/')}><span>보</span>폭</button>{!isReview ? <div className="progress-labels">{stages.map((item, i) => <button key={item} className={stage === i ? 'active' : stage > i ? 'done' : ''} onClick={() => i <= stage && go(stagePaths[i])}>{stage > i ? '✓ ' : ''}{item}</button>)}</div> : <div />}<button className="home-link" onClick={() => go('/')}>나가기</button></header>
      {state.demo && <div className="demo-banner">예시 데이터로 보고 있어요</div>}
      {children}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
