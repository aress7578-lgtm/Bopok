// "YYYY-MM" 또는 "YYYY-MM-DD"를 월까지만 "YYYY.MM"으로 바꾼다. 형식이 맞지 않으면 null.
export function formatCheckedMonth(checkedAt?: string | null) {
  const m = checkedAt?.trim().match(/^(\d{4})-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/)
  return m ? `${m[1]}.${m[2]}` : null
}

// 구간 근거 마지막 줄: "출처: {source} · {YYYY.MM} 확인". 출처나 날짜가 비어 있으면 "출처 확인 중".
export function formatSourceLine(source?: string | null, checkedAt?: string | null) {
  const month = formatCheckedMonth(checkedAt)
  const name = source?.trim()
  if (!name || !month) return '출처 확인 중'
  return `출처: ${name} · ${month} 확인`
}
