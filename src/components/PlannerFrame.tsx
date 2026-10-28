'use client'

import { usePathname } from 'next/navigation'
import { usePlan } from '@/components/PlanProvider'
import { usePlanJudge } from '@/components/usePlanJudge'
import { reviewPath, stagePaths, stages } from '@/lib/plan-data'

export function PlannerFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { state, toast, go } = usePlan()
  const { result } = usePlanJudge()
  const isReview = pathname === reviewPath
  const stage = isReview ? 6 : Math.max(stagePaths.indexOf(pathname), 0)
  // 조건 충족(또는 정보 부족)이면 수정안 단계를 건너뛴다.
  const skipped = (i: number) => i === 4 && stage > 4 && result.verdict !== 'adjust'
  return (
    <div className="planner">
      <header className="planner-nav"><button className="brand plain" onClick={() => go('/')}><span>보</span>폭</button>{!isReview ? <div className="progress-labels">{stages.map((item, i) => <button key={item} className={stage === i ? 'active' : stage > i ? 'done' : ''} onClick={() => i <= stage && go(stagePaths[i])}>{skipped(i) ? `${item} 건너뜀` : <>{stage > i ? '✓ ' : ''}{item}</>}</button>)}</div> : <div />}<button className="home-link" onClick={() => go('/')}>나가기</button></header>
      {state.demo && <div className="demo-banner">예시 데이터로 보고 있어요</div>}
      {children}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
