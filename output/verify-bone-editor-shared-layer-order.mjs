import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const baseUrl = 'http://127.0.0.1:5173'
const projectId = 'motion_20260815095021_85vj'
const browser = await chromium.launch({ headless: true })
const editor = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const preview = await browser.newPage({ viewport: { width: 360, height: 460 } })
const map = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const library = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
for (const page of [editor, preview, map, library]) {
  page.on('console', message => { if (message.type() === 'error') errors.push(`${page.url()}: ${message.text()}`) })
  page.on('pageerror', error => errors.push(`${page.url()}: ${String(error)}`))
}

const sameRecord = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const captureOrder = () => ({
  layers: Object.fromEntries([...document.querySelectorAll('#character .layer[data-id]')]
    .filter(node => node.style.display !== 'none')
    .map(node => [node.dataset.id, Number(getComputedStyle(node).zIndex)])),
  meshes: Object.fromEntries([...document.querySelectorAll('.mesh-binding-canvas[data-binding-id]')]
    .map(node => [node.dataset.bindingId, Number(getComputedStyle(node).zIndex)]))
})

await editor.goto(`${baseUrl}/2d_bone_editor_split/`, { waitUntil: 'networkidle' })
await editor.waitForFunction(() => typeof window.replaceCurrentProject === 'function')
await editor.evaluate(async projectId => {
  const entry = await fetch(`/api/local/bone-motion-projects?id=${encodeURIComponent(projectId)}`, { cache: 'no-store' }).then(response => response.json())
  window.replaceCurrentProject(entry.project, null)
  document.querySelector('#projectLibraryDialog')?.close()
}, projectId)
await editor.waitForSelector('.layer[data-id]')
await editor.waitForTimeout(150)
const sourceOrder = await editor.evaluate(captureOrder)

await preview.goto(`${baseUrl}/2d_bone_editor_split/?preview=1&transparent=1&project=${encodeURIComponent(projectId)}&animation=__default__`, { waitUntil: 'networkidle' })
await preview.waitForSelector('.layer[data-id]')
await preview.waitForTimeout(150)
const previewOrder = await preview.evaluate(captureOrder)
if (!sameRecord(sourceOrder, previewOrder)) throw new Error(`編集画面と共通プレビューの描画順が一致しません: ${JSON.stringify({ sourceOrder, previewOrder })}`)

await map.goto(`${baseUrl}/area-map/middle_terminal_concourse`, { waitUntil: 'networkidle' })
const frameHandle = await map.waitForSelector(`.bone-motion-preview`)
const mapFrame = await frameHandle.contentFrame()
if (!mapFrame) throw new Error('エリアマップのボーンモーションiframeを取得できません')
await mapFrame.waitForSelector('.layer[data-id]')
await mapFrame.waitForTimeout(150)
const mapOrder = await mapFrame.evaluate(captureOrder)
if (!sameRecord(sourceOrder, mapOrder)) throw new Error(`編集画面とエリアマップの描画順が一致しません: ${JSON.stringify({ sourceOrder, mapOrder })}`)

await library.goto(`${baseUrl}/character-library`, { waitUntil: 'networkidle' })
await library.locator('.character-card').evaluateAll(cards => {
  const card = cards.find(node => node.textContent.includes('player_3'))
  if (!card) throw new Error('ver4用のプレイヤーカードが見つかりません')
  card.click()
})
const libraryFrameHandle = await library.waitForSelector('.bone-motion-preview')
const libraryFrame = await libraryFrameHandle.contentFrame()
if (!libraryFrame) throw new Error('Character Libraryのボーンモーションiframeを取得できません')
const libraryProjectId = new URL(libraryFrame.url()).searchParams.get('project')
if (libraryProjectId !== projectId) throw new Error(`Character Libraryが別モーションを参照しています: ${libraryProjectId}`)
await libraryFrame.waitForSelector('.mesh-binding-canvas[data-binding-id="mesh_lzwpiwgy"]')
await libraryFrame.waitForTimeout(150)
const libraryOrder = await libraryFrame.evaluate(captureOrder)
const libraryRuntime = await libraryFrame.evaluate(() => JSON.parse(window.render_game_to_text()))
await library.screenshot({ path: 'output/character-library-shared-layer-order.png', fullPage: true })
if (!sameRecord(sourceOrder, libraryOrder)) throw new Error(`編集画面とCharacter Libraryの描画順が一致しません: ${JSON.stringify({ sourceOrder, libraryOrder, libraryRuntime })}`)

const synchronized = await editor.evaluate(() => {
  const before = JSON.parse(document.querySelector('#jsonArea').value)
  const movedId = before.layerOrder.at(-1)
  window.setLayerNumber(movedId, 1, false, true)
  window.exportJSON(false)
  const after = JSON.parse(document.querySelector('#jsonArea').value)
  const frames = [after.defaultFrame, ...after.animations.flatMap(animation => animation.frames)]
  const invalid = []
  frames.forEach((frame, frameIndex) => after.layerOrder.forEach((id, index) => {
    if (frame[id] && Number(frame[id].z) !== index + 1) invalid.push({ frameIndex, id, actual: frame[id].z, expected: index + 1 })
  }))
  return { movedId, frameCount: frames.length, invalid, firstLayer: after.layerOrder[0] }
})
if (synchronized.invalid.length) throw new Error(`レイヤー並べ替えが全モーション・全フレームへ同期されていません: ${JSON.stringify(synchronized)}`)
if (synchronized.firstLayer !== synchronized.movedId) throw new Error(`レイヤーの並べ替え結果が共通順へ反映されていません: ${JSON.stringify(synchronized)}`)

await editor.screenshot({ path: 'output/bone-editor-shared-layer-order.png', fullPage: true })
if (errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({ projectId, layerCount: Object.keys(sourceOrder.layers).length, meshCount: Object.keys(sourceOrder.meshes).length, synchronized, errors }))
await browser.close()
