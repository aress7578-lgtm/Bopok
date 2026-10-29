import { CLOUD_CLEAR_MS } from '@/lib/landing-intro'
import styles from './HeroClouds.module.css'

// 장식이라 스크린리더에서는 숨긴다
export function HeroClouds({ phase, active }: { phase: 'intro' | 'exploring'; active: boolean }) {
  return (
    <div className={styles.root} data-phase={phase} data-active={active} style={{ '--clear-time': `${CLOUD_CLEAR_MS}ms` } as React.CSSProperties} aria-hidden="true">
      <div className={styles.shadow} />
      <div className={styles.thickWrap}><div className={styles.thick} /></div>
      <div className={`${styles.wisp} ${styles.wisp1}`} />
      <div className={`${styles.wisp} ${styles.wisp2}`} />
    </div>
  )
}
