import { describe, expect, it } from 'vitest'
import { formatCheckedMonth, formatSourceLine } from './format-source'

describe('formatSourceLine', () => {
  it('월까지만 표시한다', () => {
    expect(formatSourceLine('한밭수목원 공식 안내도', '2026-10')).toBe('출처: 한밭수목원 공식 안내도 · 2026.10 확인')
    expect(formatSourceLine('한밭수목원 공식 안내도', '2026-10-30')).toBe('출처: 한밭수목원 공식 안내도 · 2026.10 확인')
  })
  it('출처나 날짜가 비어 있으면 출처 확인 중', () => {
    expect(formatSourceLine('', '2026-10')).toBe('출처 확인 중')
    expect(formatSourceLine('   ', '2026-10')).toBe('출처 확인 중')
    expect(formatSourceLine('안내도', '')).toBe('출처 확인 중')
    expect(formatSourceLine(undefined, undefined)).toBe('출처 확인 중')
    expect(formatSourceLine(null, null)).toBe('출처 확인 중')
  })
  it('형식이 틀린 날짜는 확인 중으로 처리한다', () => {
    expect(formatCheckedMonth('2026/10')).toBeNull()
    expect(formatCheckedMonth('2026-13')).toBeNull()
    expect(formatSourceLine('안내도', '10월')).toBe('출처 확인 중')
  })
  it('데모 데이터의 모든 구간(경사로 포함)에 출처와 날짜가 있다', async () => {
    const { placeSegments } = await import('./demo-data')
    const all = Object.values(placeSegments).flat().flatMap(s => (s.ramp ? [s, s.ramp] : [s]))
    for (const s of all) expect(formatSourceLine(s.source, s.checkedAt), s.id).not.toBe('출처 확인 중')
  })
})
