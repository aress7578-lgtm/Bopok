// 랜드마크 상세 화면의 사진을 public/images/landmarks/<id>.webp 로 줄인다(한 장 300KB 이하).
// 원본은 팀이 준 실사 사진(기본 위치: 사용자 Downloads/실사). 저장소에는 줄인 결과만 넣는다.
// 실행: pnpm data:landmark-images [원본 폴더]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = process.argv[2] ?? path.join(os.homedir(), 'Downloads', '실사')
const OUT = path.join(root, 'public/images/landmarks')
const MAX_BYTES = 300 * 1024
const MAX_WIDTH = 1600
// landmarks.ts 의 id → 원본 파일 이름
const FILES = {
  'science-museum': '관국립중앙과학.webp',
  'art-museum': '대전시립미술관.webp',
  'arts-center': '대전예술의전당.webp',
  'hanbat-greenhouse': '한밭수목원.webp',
  'ibs-library': '기초과학연구원.webp',
  'expo-bridge': '엑스포다리.webp',
  'expo-plaza': '대전엑스포 시민광장.webp',
}

fs.mkdirSync(OUT, { recursive: true })
for (const [id, name] of Object.entries(FILES)) {
  const input = path.join(SRC, name)
  if (!fs.existsSync(input)) throw new Error(`원본 누락: ${input}`)
  // 품질을 낮춰 가며 300KB 아래가 될 때까지
  let buf = null
  for (let quality = 80; quality >= 40; quality -= 5) {
    buf = await sharp(input).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality }).toBuffer()
    if (buf.length <= MAX_BYTES) break
  }
  const meta = await sharp(buf).metadata()
  fs.writeFileSync(path.join(OUT, `${id}.webp`), buf)
  console.log(`${id}: ${meta.width}×${meta.height} ${(buf.length / 1024).toFixed(0)}KB`)
}
