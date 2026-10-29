'use client'

import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import Map, { type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  MAP_BEARING, MAP_BG_COLOR, MAP_CENTER, MAP_FLAT_DURATION_MS, MAP_FONT_FAMILY,
  MAP_MAX_BOUNDS, MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_PITCH, MAP_STYLE_URL, MAP_WORKER_URL, MAP_ZOOM,
} from '@/lib/map-config'

maplibregl.setWorkerUrl(MAP_WORKER_URL)

const placeholder = { background: MAP_BG_COLOR, color: '#8A847B', display: 'grid', placeItems: 'center', fontSize: 13, textAlign: 'center' } as const

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function MapView({ flat = false, onFail }: { flat?: boolean; onFail?: () => void }) {
  const mapRef = useRef<MapRef>(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(() => !hasWebGL())

  useEffect(() => {
    if (failed) onFail?.()
  }, [failed, onFail])

  // 2D ↔ 3D 전환
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.easeTo({ pitch: flat ? 0 : MAP_PITCH, bearing: flat ? 0 : MAP_BEARING, duration: reduce ? 0 : MAP_FLAT_DURATION_MS })
  }, [flat, loaded])

  if (failed) return <div style={{ ...placeholder, width: '100%', height: '100%' }} role="status">지도를 불러오지 못했어요. 목록으로 보여드릴게요</div>

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: MAP_BG_COLOR }}>
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={MAP_STYLE_URL}
        initialViewState={{ ...MAP_CENTER, zoom: MAP_ZOOM, pitch: MAP_PITCH, bearing: MAP_BEARING }}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        maxBounds={MAP_MAX_BOUNDS}
        localIdeographFontFamily={MAP_FONT_FAMILY}
        attributionControl={{ compact: true }}
        onLoad={() => setLoaded(true)}
        // 지도가 뜨기 전에 난 오류(스타일·WebGL)만 실패로 본다. 타일 하나가 늦는 건 무시
        onError={() => { if (!loaded) setFailed(true) }}
        style={{ width: '100%', height: '100%' }}
      />
      {!loaded && <div style={{ ...placeholder, position: 'absolute', inset: 0 }} role="status">지도를 불러오는 중이에요</div>}
    </div>
  )
}
