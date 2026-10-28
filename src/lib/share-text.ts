import { finalNotice, finalTimeline, finalTotal } from './plan-data'

export function buildShareText() {
  const lines = finalTimeline.map(([time, name, detail]) => `${time} ${name}\n  ${detail}`)
  return [
    '[보폭] 확정된 하루 일정',
    '',
    ...lines,
    '',
    `${finalTotal} (추정치)`,
    '',
    '출발 전 운영 여부를 꼭 확인하세요',
    ...finalNotice,
  ].join('\n')
}
