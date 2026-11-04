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

fs.mkdirSync(OUT, { recursive: true })
for (const [id, name] of Object.entries(FILES)) {
  const input = path.join(SRC, name)
  if (!fs.existsSync(input)) throw new Error(`원본 누락: ${input}`)
  let buf = null
  for (let quality = 85; quality >= 40; quality -= 5) {
    buf = await sharp(input).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true }).webp({ quality }).toBuffer()
    if (buf.length <= MAX_BYTES) break
  }
  const meta = await sharp(buf).metadata()
  fs.writeFileSync(path.join(OUT, `${id}.webp`), buf)
  console.log(`${id}: ${meta.width}×${meta.height} ${(buf.length / 1024).toFixed(0)}KB`)
}
