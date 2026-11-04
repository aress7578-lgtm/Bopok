'use client'

// 홀 실내 보기의 오른쪽 정보 카드 내용: 홀 이름, 층·좌석 수, 시연용 안내, "어디로 가세요?" 경로 고르기와 결과.
import { hallSeatText } from '@/lib/indoor/arts-center'
import type { RouteMode } from '@/lib/indoor/route'
import { useIndoor } from './IndoorProvider'
import styles from './Indoor.module.css'

const MODES: { mode: RouteMode; text: string }[] = [
  { mode: 'nostairs', text: '계단 없이' },
  { mode: 'shortest', text: '가장 짧게' },
]

export function IndoorInfo({ titleId }: { titleId: string }) {
  const indoor = useIndoor()
  const { hall, dest, mode, result, found, chip } = indoor
  const levels = [...hall.floors].sort((a, b) => a.level - b.level).map(f => f.level)

  return (
    <div className={styles.info}>
      <h2 id={titleId} className={styles.hallName}>{hall.name}</h2>
      <p className={styles.seatText}>{hallSeatText(hall)}</p>
      <p className={styles.notice}>시연용 개략도 · 실제 배치와 다를 수 있어요</p>

      <section className={styles.routeBox} aria-label="실내 경로">
        <h3 className={styles.routeTitle}>어디로 가세요?</h3>
        <div className={styles.chipRow} role="group" aria-label="도착할 객석 층">
          {levels.map(l => (
            <button key={l} type="button" className={styles.pick} aria-pressed={dest === l} onClick={() => indoor.selectDest(l)}>{l}층 객석</button>
          ))}
        </div>
        <div className={styles.chipRow} role="group" aria-label="길 찾기 방식">
          {MODES.map(m => (
            <button key={m.mode} type="button" className={styles.pick} data-small aria-pressed={mode === m.mode} onClick={() => indoor.setMode(m.mode)}>{m.text}</button>
          ))}
        </div>

        {dest === null && <p className={styles.hint}>도착할 객석 층을 고르면 입구에서 가는 길을 그려 드려요.</p>}
        {dest !== null && (result?.status === 'no-data' || result?.status === 'blocked') && (
          <p className={styles.hint} role="status">실내 경로 정보 준비 중</p>
        )}
        {dest !== null && chip && found && (
          <div role="status">
            <p className={styles.summaryChip} data-tone={chip.tone}>{chip.text}</p>
            {chip.warnings.length > 0 && (
              <ul className={styles.warnings}>
                {chip.warnings.map(w => <li key={w}>{w}</li>)}
              </ul>
            )}
            <ol className={styles.steps} aria-label="가는 순서">
              {found.steps.map(step => <li key={step}>{step.replace(/^\d+\.\s*/, '')}</li>)}
            </ol>
          </div>
        )}
      </section>
    </div>
  )
}
