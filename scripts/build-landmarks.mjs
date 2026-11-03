// 랜드마크 3D 모형 정리: public/models/raw/*.glb(원본) → public/models/*.glb(최종)
// 중복 제거(dedup)·정점 합치기(weld)·양자화(quantize)만 한다. 재질 색은 그대로 두고 draco 는 쓰지 않는다(디코더가 따로 필요해서).
// 실행: pnpm data:landmarks
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { KHRMeshQuantization } from '@gltf-transform/extensions'
import { dedup, quantize, weld } from '@gltf-transform/functions'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RAW = path.join(root, 'public/models/raw')
const OUT = path.join(root, 'public/models')
// 원본 파일 → 최종 파일
const FILES = {
  'science-museum.glb': 'science-museum.glb', // 국립중앙과학관
  'landmark-b-umbrella.glb': 'arts-center.glb', // 대전예술의전당
  'landmark-a-bands.glb': 'art-museum.glb', // 대전시립미술관
  'hanbat.glb': 'hanbat-arboretum.glb', // 한밭수목원(열대식물원)
  'ibs-library.glb': 'ibs-library.glb', // 기초과학연구원 도서관
  'expo-bridge.glb': 'expo-bridge.glb', // 엑스포다리
  'expo-plaza.glb': 'expo-plaza.glb', // 대전엑스포 시민광장
}

const io = new NodeIO().registerExtensions([KHRMeshQuantization])
for (const [from, to] of Object.entries(FILES)) {
  const src = path.join(RAW, from)
  if (!fs.existsSync(src)) throw new Error(`원본 누락: ${src}`)
  const doc = await io.read(src)
  await doc.transform(dedup(), weld(), quantize())
  await io.write(path.join(OUT, to), doc)
  console.log(`${from} (${fs.statSync(src).size}B) → ${to} (${fs.statSync(path.join(OUT, to)).size}B)`)
}
