import { SHOW_WARNING_IN_SHARE_TEXT } from '../config/flags'
import type { FinalPlan } from './final-plan'

export function buildShareText(plan: FinalPlan, showWarnings: boolean = SHOW_WARNING_IN_SHARE_TEXT) {
  const lines = plan.rows.map(r => `${r.time} ${r.name}\n  ${r.detail}`)
  const warnings = showWarnings && plan.warnings.length > 0 ? ['', ...plan.warnings] : []
  return [
    '[보폭] 확정된 하루 일정',
    '',
    ...lines,
    '',
    `${plan.total} (추정치)`,
    ...warnings,
    '',
    '출발 전 운영 여부를 꼭 확인하세요',
    ...plan.notice,
  ].join('\n')
}
