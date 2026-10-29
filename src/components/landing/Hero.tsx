'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { Map as MapLibreMap } from 'maplibre-gl'
import {
  ACTIONS_FADE_MS, ACTIONS_STAGGER_MS, BACK_FLY_MS, DRIFT_METERS, DRIFT_MS, EXPLORE_VIEW, FLY_DELAY_MS, FLY_MS,
  GLYPH_BLUR_PX, GLYPH_DROP_PX, GLYPH_DURATION_MS, GLYPH_EASING, GLYPH_STAGGER_MS, GLYPH_STAGGER_SEEN_MS, GLYPH_TILT_DEG,
  HINT_MS, INTRO_VIEW, LEAD_FADE_MS, MOBILE_MAX_WIDTH, PLACE_PINS, SEEN_KEY, TEXT_OUT_MS, TEXT_OUT_RISE_PX, TITLE_LINES, TITLE_TEXT,
  TOUR_MS, TOUR_RESUME_MS, TOUR_WAYPOINTS, VEIL, glyphDelays, titleDoneAt,
} from '@/lib/landing-intro'
import { PALETTE } from '@/lib/map-config'
import type { MapPin } from '@/lib/map-geojson'
import { HeroClouds } from './HeroClouds'
import { createCameraLoop, metersToLon, type CameraLoop } from './tour'
import styles from './Hero.module.css'

// 서버에는 WebGL이 없어서 지도는 브라우저에서만 불러온다. 지도가 뜨기 전에는 바탕색 + 구름만 보인다
const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const hexToRgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')
const veilBackground = `radial-gradient(ellipse at center, rgba(${hexToRgb(PALETTE.background)}, ${VEIL.center}) 0%, rgba(${hexToRgb(PALETTE.background)}, ${VEIL.mid}) ${VEIL.midStop}%, rgba(${hexToRgb(PALETTE.background)}, 0) ${VEIL.end}%)`

const placePins: MapPin[] = PLACE_PINS.map(p => ({ id: p.id, kind: 'place', coord: p.coord, label: p.name }))

type Phase = 'intro' | 'exploring'

export function Hero({ onStart }: { onStart: () => void }) {
  const heroRef = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [arrived, setArrived] = useState(false)   // 둘러보기로 내려앉아 도착함
  const [homeReady, setHomeReady] = useState(true) // 첫 화면 위치로 돌아와 있음(돌아가는 중이면 false)
  const [flat, setFlat] = useState(true)          // true = 건물 높이 0 (평면 지도)
  const [showHint, setShowHint] = useState(false)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [mapFailed, setMapFailed] = useState(false)
  const [active, setActive] = useState(true)      // 히어로가 화면에 보이는지
  const [compact, setCompact] = useState(false)   // 휴대폰
  const [seen, setSeen] = useState(false)         // 이번 탭에서 이미 한 번 봄
  const [titleKey, setTitleKey] = useState(0)

  const driftRef = useRef<CameraLoop | null>(null)
  const tourRef = useRef<CameraLoop | null>(null)
  const flight = useRef(0) // 카메라 이동 번호. 나중에 시작한 이동이 먼저 시작한 이동의 끝 처리를 덮어쓰지 않게
  const timers = useRef<number[]>([])
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])
  const phaseRef = useRef(phase)
  useEffect(() => {
    phaseRef.current = phase
  })

  // 다시 들어왔는지(sessionStorage), 휴대폰인지
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem(SEEN_KEY)) setSeen(true)
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {}
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH - 1}px)`)
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // 히어로가 화면 밖이면 자동 이동과 구름 애니메이션을 멈춘다
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const onMapReady = useCallback((m: MapLibreMap) => setMap(m), [])
  const onMapFail = useCallback(() => setMapFailed(true), [])

  // 카메라 이동 만들기
  useEffect(() => {
    if (!map) return
    const [lon, lat] = INTRO_VIEW.center
    driftRef.current = createCameraLoop(map, [
      { ...INTRO_VIEW, center: [lon + metersToLon(DRIFT_METERS, lat), lat] },
      INTRO_VIEW,
    ], DRIFT_MS)
    tourRef.current = createCameraLoop(map, TOUR_WAYPOINTS, TOUR_MS, 1) // 도착 지점이 첫 웨이포인트라 두 번째부터
    return () => {
      driftRef.current?.stop()
      tourRef.current?.stop()
    }
  }, [map])

  // 첫 화면: 평면 지도가 아주 천천히 흐른다 (화면에 보일 때만, 움직임 줄이기면 안 움직인다)
  useEffect(() => {
    const drift = driftRef.current
    if (!map || !drift) return
    if (phase === 'intro' && homeReady && active && !reduced()) drift.start()
    else drift.stop()
  }, [map, phase, homeReady, active])

  // 둘러보기: 도착한 뒤 천천히 미끄러지듯 이동. 만지면 멈추고 TOUR_RESUME_MS 동안 안 만지면 이어간다
  const tourWanted = phase === 'exploring' && arrived && active && !showHint
  useEffect(() => {
    const tour = tourRef.current
    if (!map || !tour) return
    if (!tourWanted || reduced()) { tour.stop(); return }
    let resume: number | undefined
    let touching = false
    const pause = () => {
      touching = true
      window.clearTimeout(resume)
      tour.stop()
    }
    const release = () => {
      touching = false
      window.clearTimeout(resume)
      resume = window.setTimeout(() => { if (!touching) tour.start() }, TOUR_RESUME_MS)
    }
    const downs = ['mousedown', 'touchstart'] as const
    const ups = ['mouseup', 'touchend', 'touchcancel', 'dragend', 'rotateend'] as const
    downs.forEach(e => map.on(e, pause))
    ups.forEach(e => map.on(e, release))
    tour.start()
    return () => {
      window.clearTimeout(resume)
      downs.forEach(e => map.off(e, pause))
      ups.forEach(e => map.off(e, release))
      tour.stop()
    }
  }, [map, tourWanted])

  // 지도 둘러보기
  const explore = () => {
    if (!map || phaseRef.current === 'exploring') return
    setPhase('exploring')
    later(() => {
      driftRef.current?.stop()
      setFlat(false) // 건물 높이 0 → 1 (카메라가 기울기 시작할 때부터)
      const fast = reduced()
      const mine = ++flight.current
      map.once('moveend', () => {
        if (mine !== flight.current) return // 도중에 '처음으로'를 눌렀으면 도착으로 치지 않는다
        setArrived(true)
        setShowHint(true)
        later(() => setShowHint(false), HINT_MS)
      })
      map.flyTo({ center: EXPLORE_VIEW.center, zoom: EXPLORE_VIEW.zoom, pitch: EXPLORE_VIEW.pitch, bearing: EXPLORE_VIEW.bearing, duration: fast ? 0 : FLY_MS, essential: true })
    }, FLY_DELAY_MS)
  }

  // 처음으로: 카메라가 첫 화면 위치(평면)로 돌아가고 구름·제목이 다시 나타난다
  const back = () => {
    if (!map) return
    tourRef.current?.stop()
    const mine = ++flight.current
    setArrived(false)
    setShowHint(false)
    setHomeReady(false)
    setPhase('intro')
    setTitleKey(k => k + 1)
    setSeen(true) // 다시 보는 제목은 짧게
    map.once('moveend', () => {
      if (mine !== flight.current) return
      setFlat(true)
      setHomeReady(true) // 도착한 뒤에야 평면 지도가 다시 흐르기 시작한다
    })
    map.flyTo({ center: INTRO_VIEW.center, zoom: INTRO_VIEW.zoom, pitch: INTRO_VIEW.pitch, bearing: INTRO_VIEW.bearing, duration: reduced() ? 0 : BACK_FLY_MS, essential: true })
  }

  // 제목 글자별 지연
  const stagger = seen ? GLYPH_STAGGER_SEEN_MS : GLYPH_STAGGER_MS
  const delays = useMemo(() => glyphDelays(TITLE_LINES, stagger), [stagger])
  const leadDelay = titleDoneAt(TITLE_LINES, stagger)
  const actionsDelay = leadDelay + LEAD_FADE_MS

  const exploring = phase === 'exploring'
  const cssVars = {
    '--out-ms': `${TEXT_OUT_MS}ms`,
    '--out-rise': `${TEXT_OUT_RISE_PX}px`,
    '--glyph-ms': `${GLYPH_DURATION_MS}ms`,
    '--glyph-ease': GLYPH_EASING,
    '--glyph-blur': `${GLYPH_BLUR_PX}px`,
    '--glyph-drop': `${GLYPH_DROP_PX}px`,
    '--glyph-tilt': `${GLYPH_TILT_DEG}deg`,
    '--lead-ms': `${LEAD_FADE_MS}ms`,
    '--lead-delay': `${leadDelay}ms`,
    '--actions-ms': `${ACTIONS_FADE_MS}ms`,
    '--actions-delay': `${actionsDelay}ms`,
    '--actions-stagger': `${ACTIONS_STAGGER_MS}ms`,
    '--hint-ms': `${HINT_MS}ms`,
  } as React.CSSProperties

  return (
    <section ref={heroRef} className={styles.hero} data-active={active} data-phase={phase} style={cssVars}>
      <div className={styles.map}>
        <MapView
          mode="landing"
          flat={flat}
          compact={compact}
          interactive={exploring && arrived}
          initialView={INTRO_VIEW}
          pins={exploring && arrived ? placePins : []}
          onMapReady={onMapReady}
          onFail={onMapFail}
        />
      </div>
      <HeroClouds phase={phase} active={active} />
      <div className={styles.veil} data-hidden={exploring} style={{ background: veilBackground }} aria-hidden="true" />

      <div className={styles.copy} data-hidden={exploring} aria-hidden={exploring} inert={exploring}>
        <h1 key={titleKey} className={styles.title} aria-label={TITLE_TEXT}>
          {TITLE_LINES.map((line, li) => (
            <span key={li} className={styles.line} aria-hidden="true">
              {[...line].map((ch, i) => (ch === ' '
                ? <span key={i} className={styles.space} />
                : <span key={i} className={styles.glyph} style={{ '--d': `${delays[li][i]}ms` } as React.CSSProperties}>{ch}</span>))}
            </span>
          ))}
        </h1>
        <p key={`lead-${titleKey}`} className={styles.lead}>주차장에서 입구, 관람길 계단까지 계산해서<br className="desktop" /> 부모님이 편하게 걸을 수 있는 일정으로 고쳐드려요.</p>
        <div key={`actions-${titleKey}`} className={styles.actions}>
          <button className="button hero-start" onClick={onStart}>지금 시작하기</button>
          {map && !mapFailed && <button className={styles.explore} onClick={explore}>지도 둘러보기</button>}
        </div>
      </div>

      {exploring && (
        <>
          <button className={styles.back} onClick={back}>← 처음으로</button>
          <button className={styles.startPill} onClick={onStart}>지금 시작하기</button>
        </>
      )}
      {showHint && (
        <div className={styles.hint} role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6.5 6.5 0 0 1-6.5 6.5h-1A6 6 0 0 1 6 17.8l-2.2-3.7a1.5 1.5 0 0 1 2.4-1.7L9 15.5" />
          </svg>
          끌어서 둘러보세요
        </div>
      )}
    </section>
  )
}
