'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { ExpressionSpecification, FillExtrusionLayerSpecification, FillLayerSpecification } from 'maplibre-gl'
import Map, { Layer, Marker, Source, type LayerProps, type MapRef } from 'react-map-gl/maplibre'
import type { Feature, FeatureCollection, LineString, Polygon } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import { crossingBearing, focusZone, nearBuildingIds, veilPolygon } from '@/lib/map-focus'
import type { Coord } from '@/lib/map-types'
import type { MapPin, RouteProps } from '@/lib/map-geojson'
import {
  MAP_BEARING, MAP_BG_COLOR, MAP_CENTER, MAP_FLAT_DURATION_MS, MAP_FONT_FAMILY,
  MAP_MAX_BOUNDS, MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_PITCH, MAP_STYLE_URL, MAP_WORKER_URL, MAP_ZOOM,
  BUILDINGS_BEFORE_ID, BUILDINGS_FALLBACK_H, BUILDINGS_FAR_LAYER_ID, BUILDINGS_NEAR_LAYER_ID, BUILDINGS_SOURCE_ID, BUILDINGS_URL,
  FAR_COLOR, FAR_HEIGHT_SCALE, FAR_OPACITY, FOCUS_MOVE_MS, FOCUS_PITCH, FOCUS_RISE_MS, VEIL_OPACITY, VEIL_SOURCE_ID,
  ROUTE_BEFORE_ID, ROUTE_COLORS, ROUTE_SOURCE_ID,
} from '@/lib/map-config'

maplibregl.setWorkerUrl(MAP_WORKER_URL)

// 높이는 전처리에서 계산한 h(m)만 읽는다. 색은 층수가 있으면 층수, 없으면 높이로 어림해서 1층 크림 → 15층 연회색 → 30층 이상 연파랑
// fill-extrusion 의 진하기는 레이어 단위라서 건물을 near(선명)/far(흐리고 낮게) 두 레이어로 나누고 filter 로 fid 를 나눈다.
// 레이어는 한 번만 만들고, 높이 배율은 setPaintProperty 로만 바꾼다(솟아오르는 연출).
const HEIGHT: ExpressionSpecification = ['coalesce', ['get', 'h'], BUILDINGS_FALLBACK_H]
const heightScaled = (scale: number): ExpressionSpecification => ['*', HEIGHT, scale]
const nearLayer: FillExtrusionLayerSpecification = {
  id: BUILDINGS_NEAR_LAYER_ID,
  type: 'fill-extrusion',
  source: BUILDINGS_SOURCE_ID,
  paint: {
    'fill-extrusion-height': heightScaled(1),
    'fill-extrusion-base': 0,
    'fill-extrusion-color': [
      'interpolate', ['linear'], ['coalesce', ['get', 'floors'], ['/', HEIGHT, 3.5]],
      1, '#F4EFE8', 15, '#ECE8E3', 30, '#D9E4F2',
    ],
    'fill-extrusion-vertical-gradient': true,
    'fill-extrusion-opacity': 0.97,
  },
}
const farLayer: FillExtrusionLayerSpecification = {
  id: BUILDINGS_FAR_LAYER_ID,
  type: 'fill-extrusion',
  source: BUILDINGS_SOURCE_ID,
  paint: {
    'fill-extrusion-height': heightScaled(FAR_HEIGHT_SCALE),
    'fill-extrusion-base': 0,
    'fill-extrusion-color': FAR_COLOR,
    'fill-extrusion-vertical-gradient': true,
    'fill-extrusion-opacity': FAR_OPACITY,
  },
}
const veilLayer: FillLayerSpecification = { id: 'focus-veil', type: 'fill', source: VEIL_SOURCE_ID, paint: { 'fill-color': '#FFFFFF', 'fill-opacity': VEIL_OPACITY } }
const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] }

// 경로 선 레이어. line-dasharray 는 데이터로 바꿀 수 없어서 점선/실선을 레이어로 나눈다.
const isMain: ExpressionSpecification = ['==', ['get', 'role'], 'main']
const isDetour: ExpressionSpecification = ['==', ['get', 'role'], 'detour']
const isRide: ExpressionSpecification = ['==', ['get', 'role'], 'ride']
const isInfo: ExpressionSpecification = ['all', isMain, ['==', ['get', 'status'], 'info']]
const isSolidMain: ExpressionSpecification = ['all', isMain, ['!=', ['get', 'status'], 'info']]
const isLine: ExpressionSpecification = ['!', isRide]
const selected: ExpressionSpecification = ['==', ['get', 'selected'], true]

const routeLayers: LayerProps[] = [
  // 누르기 쉽게 투명한 두꺼운 선(폭 24px)
  { id: 'route-hit', type: 'line', source: ROUTE_SOURCE_ID, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-width': 24, 'line-color': '#000000', 'line-opacity': 0.01 } },
  // 흰 테두리 (폭 9px, 선택되면 11px)
  { id: 'route-casing', type: 'line', source: ROUTE_SOURCE_ID, filter: isLine, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-width': ['case', selected, 11, 9], 'line-color': ROUTE_COLORS.casing, 'line-opacity': ['get', 'emphasis'] } },
  { id: 'route-ride', type: 'line', source: ROUTE_SOURCE_ID, filter: isRide, layout: { 'line-cap': 'butt' }, paint: { 'line-width': 2, 'line-color': ROUTE_COLORS.ride, 'line-dasharray': [1.5, 2], 'line-opacity': ['get', 'emphasis'] } },
  { id: 'route-info', type: 'line', source: ROUTE_SOURCE_ID, filter: isInfo, layout: { 'line-cap': 'butt', 'line-join': 'round' }, paint: { 'line-width': ['case', selected, 7, 5], 'line-color': ROUTE_COLORS.info, 'line-dasharray': [1.6, 1.2], 'line-opacity': ['get', 'emphasis'] } },
  { id: 'route-detour', type: 'line', source: ROUTE_SOURCE_ID, filter: isDetour, layout: { 'line-cap': 'butt', 'line-join': 'round' }, paint: { 'line-width': ['case', selected, 7, 5], 'line-color': ROUTE_COLORS.ok, 'line-dasharray': [1.6, 1.2], 'line-opacity': ['get', 'emphasis'] } },
  { id: 'route-main', type: 'line', source: ROUTE_SOURCE_ID, filter: isSolidMain, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-width': ['case', selected, 7, 5], 'line-color': ['match', ['get', 'status'], 'warn', ROUTE_COLORS.warn, ROUTE_COLORS.ok], 'line-opacity': ['get', 'emphasis'] } },
]

const placeholder = { background: MAP_BG_COLOR, color: '#8A847B', display: 'grid', placeItems: 'center', fontSize: 13, textAlign: 'center' } as const

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function BenchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ flex: 'none' }} aria-hidden="true" fill="none" stroke="#1D4ED8" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2.5 7h11M3.5 7v-2.5h9V7M4 7v5M12 7v5M2.5 10h11" />
    </svg>
  )
}

type Props = {
  flat?: boolean
  onFail?: () => void
  routes?: FeatureCollection<LineString, RouteProps> | null
  pins?: MapPin[]
  // 경로가 모두 들어오는 범위 [서, 남, 동, 북]. 전체 보기에서 카메라를 맞춘다
  fit?: [number, number, number, number] | null
  // 값이 있으면 "구간만 보기": 이 경로 주변 건물만 선명하게 보여준다
  focusPath?: Coord[] | null
  onSelectSegment?: (segmentId: string) => void
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function MapView({ flat = false, onFail, routes = null, pins = [], fit = null, focusPath = null, onSelectSegment }: Props) {
  const mapRef = useRef<MapRef>(null)
  const firstFit = useRef(true)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(() => !hasWebGL())
  const [cursor, setCursor] = useState('')
  const [buildings, setBuildings] = useState<FeatureCollection | null>(null)

  useEffect(() => {
    if (failed) onFail?.()
  }, [failed, onFail])

  // 건물 데이터는 직접 받아서 구간 주변 건물을 계산한다. 못 받아도 바탕 지도는 그대로 보인다
  useEffect(() => {
    let alive = true
    fetch(BUILDINGS_URL)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: FeatureCollection) => { if (alive) setBuildings(data) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  // 구간 범위와 주변 건물은 구간이 바뀔 때만 계산한다
  const zone = useMemo(() => (focusPath ? focusZone(focusPath) : null), [focusPath])
  const nearIds = useMemo(() => (zone && buildings ? nearBuildingIds(buildings, zone) : null), [zone, buildings])
  const veil = useMemo<FeatureCollection | Feature<Polygon>>(() => (zone ? veilPolygon(MAP_MAX_BOUNDS, zone) : EMPTY_FC), [zone])

  const nearFilter = useMemo<ExpressionSpecification>(
    () => (nearIds ? ['in', ['get', 'fid'], ['literal', nearIds]] : ['has', 'fid']),
    [nearIds],
  )
  const farFilter = useMemo<ExpressionSpecification>(
    () => (nearIds ? ['!', ['in', ['get', 'fid'], ['literal', nearIds]]] : ['==', ['get', 'fid'], -1]),
    [nearIds],
  )

  // 건물 높이 배율: 2D 는 평면(0), 구간만 보기로 바뀌면 near 건물이 0 → 1 로 솟아오른다
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !loaded || !buildings || !map.getLayer(BUILDINGS_NEAR_LAYER_ID)) return
    const setScale = (near: number, far: number) => {
      map.setPaintProperty(BUILDINGS_NEAR_LAYER_ID, 'fill-extrusion-height', heightScaled(near))
      map.setPaintProperty(BUILDINGS_FAR_LAYER_ID, 'fill-extrusion-height', heightScaled(far))
    }
    if (flat) { setScale(0, 0); return }
    if (!zone || reducedMotion()) { setScale(1, FAR_HEIGHT_SCALE); return }
    let raf = 0
    const start = performance.now()
    setScale(0, FAR_HEIGHT_SCALE)
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / FOCUS_RISE_MS)
      setScale(1 - (1 - t) ** 3, FAR_HEIGHT_SCALE) // ease-out
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [flat, zone, nearIds, loaded, buildings])

  // 카메라: 전체 보기는 경로 전체, 구간만 보기는 구간 범위. 2D 는 항상 위에서 북쪽 기준
  const target = zone ? zone.bounds : fit
  const targetKey = target ? target.join(',') : ''
  const bearing = flat ? 0 : zone && focusPath ? crossingBearing(focusPath) : MAP_BEARING
  const pitch = flat ? 0 : zone ? FOCUS_PITCH : MAP_PITCH
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    const duration = reducedMotion() || firstFit.current ? 0 : zone ? FOCUS_MOVE_MS : MAP_FLAT_DURATION_MS
    if (target) {
      map.fitBounds([[target[0], target[1]], [target[2], target[3]]], { padding: 48, maxZoom: 18, pitch, bearing, duration })
      firstFit.current = false
    } else {
      map.easeTo({ pitch, bearing, duration: reducedMotion() ? 0 : MAP_FLAT_DURATION_MS })
    }
    // target 배열이 아니라 값(targetKey)이 바뀔 때만 움직인다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, targetKey, pitch, bearing])

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
        interactiveLayerIds={routes ? ['route-hit'] : []}
        cursor={cursor}
        onMouseEnter={() => setCursor('pointer')}
        onMouseLeave={() => setCursor('')}
        onClick={e => {
          const id = e.features?.[0]?.properties?.segmentId
          if (typeof id === 'string') onSelectSegment?.(id)
        }}
        onLoad={() => setLoaded(true)}
        // 지도가 뜨기 전에 난 오류(스타일·WebGL)만 실패로 본다. 타일 하나가 늦는 건 무시
        onError={() => { if (!loaded) setFailed(true) }}
        style={{ width: '100%', height: '100%' }}
      >
        {buildings && (
          <Source id={BUILDINGS_SOURCE_ID} type="geojson" data={buildings} promoteId="fid">
            <Layer {...nearLayer} filter={nearFilter} beforeId={BUILDINGS_BEFORE_ID} />
            <Layer {...farLayer} filter={farFilter} beforeId={BUILDINGS_BEFORE_ID} />
          </Source>
        )}
        {/* 구간 범위 밖을 흐리게 덮는 흰 덮개. 범위 모양만 뚫려 있다 */}
        <Source id={VEIL_SOURCE_ID} type="geojson" data={veil}>
          <Layer {...veilLayer} beforeId={ROUTE_BEFORE_ID} />
        </Source>
        {routes && (
          <Source id={ROUTE_SOURCE_ID} type="geojson" data={routes}>
            {routeLayers.map(layer => <Layer key={layer.id} {...layer} beforeId={ROUTE_BEFORE_ID} />)}
          </Source>
        )}
        {pins.map(pin => (
          <Marker key={pin.id} longitude={pin.coord[0]} latitude={pin.coord[1]} anchor={pin.kind === 'stairs' ? 'bottom' : 'center'} style={{ zIndex: pin.kind === 'stairs' ? 3 : 2 }}>
            {pin.kind === 'stairs' ? (
              <button type="button" className="map-pin pin-stairs" style={{ width: 'max-content' }} onClick={e => { e.stopPropagation(); if (pin.segmentId) onSelectSegment?.(pin.segmentId) }}>{pin.label}</button>
            ) : pin.kind === 'start' ? (
              <div className="map-pin pin-start" role="img" aria-label={pin.label}>P</div>
            ) : (
              <div className="map-pin pin-rest" style={{ width: 'max-content' }} role="img" aria-label={`쉼터: ${pin.label}`}>
                <BenchIcon />
                {pin.indoor && <small>실내</small>}
              </div>
            )}
          </Marker>
        ))}
      </Map>
      {!loaded && <div style={{ ...placeholder, position: 'absolute', inset: 0 }} role="status">지도를 불러오는 중이에요</div>}
    </div>
  )
}
