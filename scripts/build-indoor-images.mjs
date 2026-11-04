// 대전예술의전당 실내 보기(시연용 개략도) 이미지 4장을 public/images/indoor/arts-center/*.webp 로 줄인다.
// 긴 변 1920px, 한 장 400KB 이하. 원본 그림은 고치지 않는다(글자 영역은 화면에서 crop 으로 가린다: src/lib/indoor/arts-center.ts).
// 실행: pnpm data:indoor-images [원본 폴더]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = process.argv[2] ?? path.join(os.homedir(), 'Downloads')
const OUT = path.join(root, 'public/images/indoor/arts-center')
const MAX_SIDE = 1920
const MAX_BYTES = 400 * 1024
const FILES = {
  'arthall-plan': '887604927_1454942140099081_6552069408938422032_n.webp', // 아트홀 평면(1·2·3층이 세로로 쌓임)
  'arthall-exploded': '671149d9-45a6-4dbd-885d-89c9fd146ac4-edited-edited.webp', // 아트홀 입체 분해도
  'ensemble-plan': 'image_ac0a19-edited-edited.webp', // 앙상블홀 평면
  'ensemble-exploded': '886843456_1716032436474997_710282841840539664_n.webp', // 앙상블홀 입체 분해도
}

// 배경이 분홍빛인 그림은 밝은 픽셀의 분홍 기운만 걷어 흰색으로 만든다(좌석·그림자처럼 색이 있는 부분은 그대로)
const WHITEN = new Set(['ensemble-exploded'])
async function whiten(input) {
  const { data, info } = await sharp(input).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 3) {
    const g = data[i + 1]
    const w = Math.min(1, Math.max(0, (g - 205) / 20)) // g 205 이하는 그대로, 225 이상은 완전히 흰 쪽으로
    if (w === 0) continue
    const white = 255 - (255 - g) * 0.15
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(data[i + c] * (1 - w) + white * w)
  }
  return sharp(data, { raw: info })
}

fs.mkdirSync(OUT, { recursive: true })
for (const [id, name] of Object.entries(FILES)) {
  const input = path.join(SRC, name)
  if (!fs.existsSync(input)) throw new Error(`원본 누락: ${input}`)
  let buf = null
  for (let quality = 85; quality >= 40; quality -= 5) {
    const img = WHITEN.has(id) ? await whiten(input) : sharp(input).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    buf = await img.webp({ quality }).toBuffer()
    if (buf.length <= MAX_BYTES) break
  }
  const meta = await sharp(buf).metadata()
  fs.writeFileSync(path.join(OUT, `${id}.webp`), buf)
  console.log(`${id}: ${meta.width}×${meta.height} ${(buf.length / 1024).toFixed(0)}KB`)
}
