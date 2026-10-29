'use client'

import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { ExpressionSpecification } from 'maplibre-gl'
import Map, { Layer, Marker, Source, type LayerProps, type MapRef } from 'react-map-gl/maplibre'
import type { FeatureCollection, LineString } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapPin, RouteProps } from '@/lib/map-geojson'
import {
  MAP_BEARING, MAP_BG_COLOR, MAP_CENTER, MAP_FLAT_DURATION_MS, MAP_FONT_FAMILY,
  MAP_MAX_BOUNDS, MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_PITCH, MAP_STYLE_URL, MAP_WORKER_URL, MAP_ZOOM,
  BUILDINGS_BEFORE_ID, BUILDINGS_FALLBACK_H, BUILDINGS_LAYER_ID, BUILDINGS_SOURCE_ID, BUILDINGS_URL,
  ROUTE_BEFORE_ID, ROUTE_COLORS, ROUTE_SOURCE_ID,
} from '@/lib/map-config'

maplibregl.setWorkerUrl(MAP_WORKER_URL)

// 높이는 전처리에서 계산한 h(m)만 읽는다. 색은 층수가 있으면 층수, 없으면 높이로 어림해서 1층 크림 → 15층 연회색 → 30층 이상 연파랑
const buildingLayer: LayerProps = {
  id: BUILDINGS_LAYER_ID,
  type: 'fill-extrusion',
  source: BUILDINGS_SOURCE_ID,
  paint: {
    'fill-extrusion-height': ['coalesce', ['get', 'h'], BUILDINGS_FALLBACK_H],
    'fill-extrusion-base': 0,
    'fill-extrusion-color': [
      'interpolate', ['linear'], ['coalesce', ['get', 'floors'], ['/', ['coalesce', ['get', 'h'], BUILDINGS_FALLBACK_H], 3.5]],
      1, '#F4EFE8', 15, '#ECE8E3', 30, '#D9E4F2',
    ],
    'fill-extrusion-vertical-gradient': true,
    'fill-extrusion-opacity': 0.96,
  },
}

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
  { id: 'route-ride', type: 'line', source: ROUTE_SOURCE_ID, filter: isRide, layout: { 'line-cap': 'butt' }, paint: { 'line-width': 2, 'line-color': ROUTE_COLORS.ride, 'line-dasharray': [1.5, 2] } },
  { id: 'route-info', type: 'line', source: ROUTE_SOURCE_ID, filter: isInfo, layout: { 'line-cap': 'butt', 'line-join': 'round' }, paint: { 'line-width': ['case', selected, 7, 5], 'line-color': ROUTE_COLORS.info, 'line-dasharray': [1.6, 1.2] } },
  { id: 'route-detour', type: 'line', source: ROUTE_SOURCE_ID, filter: isDetour, layout: { 'line-cap': 'butt', 'line-join': 'round' }, paint: { 'line-width': ['case', selected, 7, 5], 'line-color': ROUTE_COLORS.ok, 'line-dasharray': [1.6, 1.2], 'line-opacity': ['get', 'emphasis'] } },
  { id: 'route-main', type: 'line', source: ROUTE_SOURCE_ID, filter: isSolidMain, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-width': ['case', selected, 7, 5], 'line-color': ['match', ['get', 'status'], 'warn', ROUTE_COLORS.warn, ROUTE_COLORS.ok] } },
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
  // 경로가 모두 들어오는 범위 [서, 남, 동, 북]. 바뀔 때마다 카메라를 맞춘다
  fit?: [number, number, number, number] | null
  onSelectSegment?: (segmentId: string) => void
}

export default function MapView({ flat = false, onFail, routes = null, pins = [], fit = null, onSelectSegment }: Props) {
  const mapRef = useRef<MapRef>(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(() => !hasWebGL())
  const [cursor, setCursor] = useState('')

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

  // 경로 범위가 바뀌면 카메라를 맞춘다 (각도는 그대로)
  const fitKey = fit ? fit.join(',') : ''
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded || !fit) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.fitBounds([[fit[0], fit[1]], [fit[2], fit[3]]], { padding: 48, maxZoom: 17, duration: reduce ? 0 : 600 })
    // fit 배열 자체가 아니라 값(fitKey)이 바뀔 때만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, loaded])

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
        onError={e => { if ((e as { sourceId?: string }).sourceId !== BUILDINGS_SOURCE_ID && !loaded) setFailed(true) }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* 건물 데이터를 못 불러와도 바탕 지도는 그대로 보인다 */}
        <Source id={BUILDINGS_SOURCE_ID} type="geojson" data={BUILDINGS_URL} promoteId="fid">
          <Layer {...buildingLayer} beforeId={BUILDINGS_BEFORE_ID} />
        </Source>
        {routes && (
          <Source id={ROUTE_SOURCE_ID} type="geojson" data={routes}>
            {routeLayers.map(layer => <Layer key={layer.id} {...layer} beforeId={ROUTE_BEFORE_ID} />)}
          </Source>
        )}
        {pins.map(pin => (
          <Marker key={pin.id} longitude={pin.coord[0]} latitude={pin.coord[1]} anchor={pin.kind === 'stairs' ? 'bottom' : 'center'} style={{ zIndex: pin.kind === 'stairs' ? 3 : 2 }}>
            {pin.kind === 'stairs' ? (
              <button type="button" className="map-pin pin-stairs" onClick={e => { e.stopPropagation(); if (pin.segmentId) onSelectSegment?.(pin.segmentId) }}>{pin.label}</button>
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
