'use client'

import { usePlan } from '@/components/PlanProvider'
import { finalNotice, finalTimeline, finalTotal } from '@/lib/plan-data'
import { buildShareText } from '@/lib/share-text'

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // clipboard API가 막힌 환경: textarea로 복사 시도
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}

export function FinalScreen() {
  const { go, notify } = usePlan()

  const copy = async () => {
    notify((await copyText(buildShareText())) ? '일정 글을 복사했어요' : '복사하지 못했어요')
  }

  const share = async () => {
    const text = buildShareText()
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: '보폭 하루 일정', text })
        return
      } catch (e) {
        // 사용자가 공유 시트를 닫은 경우는 그대로 둔다
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
    }
    await copy()
  }

  return <div className="planner-content share-page">
    <p className="question-count">6 / 6 · 확정</p><h1>확정된 하루 일정</h1><p className="question-help">가족에게 보내기 좋게 꼭 필요한 내용만 정리했어요.</p>
    <div className="timeline">{finalTimeline.map(row => <div key={row[0]}><time>{row[0]}</time><span><b>{row[1]}</b><small>{row[2]}</small></span></div>)}</div>
    <div className="day-total">{finalTotal} <em>추정치</em></div>
    <div className="notice"><b>출발 전 운영 여부를 꼭 확인하세요</b><p>{finalNotice.map((line, i) => <span key={line}>{i > 0 && <br />}{line}</span>)}</p></div>
    <div className="share-actions"><button className="button" onClick={share}>가족에게 보내기</button><button className="save-button" onClick={copy}>복사하기</button></div>
    <button className="direct-link" onClick={() => go('/review')}>다녀오셨나요? 구간 평가하기</button>
    <button className="back home-bottom" onClick={() => go('/')}>처음으로</button>
  </div>
}
