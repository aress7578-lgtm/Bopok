import Image from 'next/image'
import styles from './HeroMapBackground.module.css'

export function HeroMapBackground() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.stage}>
        <div className={styles.map}>
          <Image src="/hero/map-light.png" alt="" aria-hidden="true" fill preload sizes="100vw" className={styles.mapImage} />
        </div>
        <div className={`${styles.map} ${styles.vivid}`}>
          <Image src="/hero/map-vivid.webp" alt="" aria-hidden="true" fill preload sizes="100vw" className={styles.mapImage} />
        </div>
      </div>
      <div className={`${styles.shadow}`} />
      <div className={styles.thickClouds} />
      <div className={`${styles.wisp} ${styles.wisp1}`} />
      <div className={`${styles.wisp} ${styles.wisp2}`} />
      <div className={styles.veil} />
    </div>
  )
}
