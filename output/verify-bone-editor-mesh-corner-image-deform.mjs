import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.replaceCurrentProject === 'function')
await page.evaluate(async () => {
  const entry = await fetch('/api/local/bone-motion-projects?id=motion_20260816133413_r1zy', { cache: 'no-store' }).then(response => response.json())
  window.replaceCurrentProject(entry.project, null)
  document.querySelector('#projectLibraryDialog')?.close()
})
await page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: /^右上腕$/ }) }).click()
await page.waitForTimeout(150)

const inspect = () => page.evaluate(() => {
  const project = JSON.parse(document.querySelector('#jsonArea').value)
  const id = Object.entries(project.layers).find(([, layer]) => layer.name === '右上腕')[0]
  const binding = Object.values(project.meshBindings).find(item => item.boneChain.includes(id))
  const canvas = document.querySelector(`.mesh-binding-canvas[data-binding-id="${binding.id}"]`)
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
  let hash = 2166136261
  for (let index = 3; index < data.length; index += 4) {
    hash ^= data[index]
    hash = Math.imul(hash, 16777619)
  }
  const handles = Object.fromEntries(['tl', 'tr', 'bl', 'br'].map(corner => {
    const rect = document.querySelector(`#resizeBox .resize-handle.${corner}`).getBoundingClientRect()
    return [corner, { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }]
  }))
  const selectedLayerVisual = document.querySelector('.layer.mesh-deform-selected .layer-visual')
  return {
    id,
    bindingId: binding.id,
    chain: binding.boneChain,
    crossSections: binding.targetCrossSections,
    pose: project.defaultFrame[id],
    hash: hash >>> 0,
    handles,
    outlineCount: document.querySelectorAll('#resizeBox.mesh-deform .mesh-resize-outline polygon').length,
    handleCount: document.querySelectorAll('#resizeBox .resize-handle').length,
    legacyOutlineHidden: !!selectedLayerVisual && getComputedStyle(selectedLayerVisual).outlineStyle === 'none'
  }
})

const before = await inspect()
const handle = page.locator('#resizeBox .resize-handle.bl')
const box = await handle.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await page.mouse.move(box.x + box.width / 2 - 34, box.y + box.height / 2, { steps: 8 })
await page.mouse.up()
await page.waitForTimeout(150)
const after = await inspect()
await page.screenshot({ path: 'output/bone-editor-mesh-corner-image-deform-upper-arm.png', fullPage: true })

const reloadState = await page.evaluate(() => {
  const saved = JSON.parse(document.querySelector('#jsonArea').value)
  const id = Object.entries(saved.layers).find(([, layer]) => layer.name === '右上腕')[0]
  const binding = Object.values(saved.meshBindings).find(item => item.boneChain.includes(id))
  const expected = JSON.parse(JSON.stringify(binding.targetCrossSections))
  window.replaceCurrentProject(saved, null)
  document.querySelector('#projectLibraryDialog')?.close()
  const reloaded = JSON.parse(document.querySelector('#jsonArea').value)
  const actual = reloaded.meshBindings[binding.id].targetCrossSections
  return { expected, actual }
})

await page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: /^右前腕$/ }) }).click()
await page.waitForTimeout(80)
const forearmTopLeft = await page.locator('#resizeBox .resize-handle.tl').boundingBox()
const sharedSeamError = Math.hypot(
  after.handles.bl.x - (forearmTopLeft.x + forearmTopLeft.width / 2),
  after.handles.bl.y - (forearmTopLeft.y + forearmTopLeft.height / 2)
)
await page.screenshot({ path: 'output/bone-editor-mesh-corner-image-deform.png', fullPage: true })

const result = {
  poseUnchanged: before.pose.w === after.pose.w && before.pose.h === after.pose.h,
  onlyDraggedSideChanged:
    after.crossSections[1].leftScale !== before.crossSections[1].leftScale &&
    after.crossSections[1].rightScale === before.crossSections[1].rightScale &&
    after.crossSections[0].leftScale === before.crossSections[0].leftScale &&
    after.crossSections[0].rightScale === before.crossSections[0].rightScale,
  imageChanged: before.hash !== after.hash,
  reloadPreserved: JSON.stringify(reloadState.expected) === JSON.stringify(reloadState.actual),
  draggedHandleMoved: Math.hypot(after.handles.bl.x - before.handles.bl.x, after.handles.bl.y - before.handles.bl.y),
  otherCornerMovement: Object.fromEntries(['tl', 'tr', 'br'].map(corner => [corner, Math.hypot(after.handles[corner].x - before.handles[corner].x, after.handles[corner].y - before.handles[corner].y)])),
  sharedSeamError,
  singleOutline: after.outlineCount === 1 && after.handleCount === 4 && after.legacyOutlineHidden,
  before,
  after,
  errors
}
console.log(JSON.stringify(result, null, 2))
if (!result.poseUnchanged || !result.onlyDraggedSideChanged || !result.imageChanged || !result.reloadPreserved || result.draggedHandleMoved < 15 || result.sharedSeamError > 0.1 || !result.singleOutline || errors.length) throw new Error('mesh corner image deformation verification failed')
await browser.close()
