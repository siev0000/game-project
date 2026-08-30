import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
const entry = await page.evaluate(() => fetch('/api/local/bone-motion-projects?id=motion_20260815095021_85vj', { cache: 'no-store' }).then(response => response.json()))
await page.evaluate(project => localStorage.setItem('bone_editor_compact_single_v34', JSON.stringify(project)), entry.project)
await page.reload({ waitUntil: 'networkidle' })
await page.locator('#recoverDraftBtn').click()

const readTorso = () => page.evaluate(() => {
  const project = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const binding = Object.values(project.meshBindings).find(item => item.name === '腰 → 腹 → 胸 → 首')
  return {
    resizeBoxWidth: binding.resizeBoxWidth,
    bones: binding.boneChain.map(id => ({ id, name: project.layers[id].name, width: project.defaultFrame[id].w }))
  }
})
const readTorsoCanvas = () => page.evaluate(() => {
  const project = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const binding = Object.values(project.meshBindings).find(item => item.name === '腰 → 腹 → 胸 → 首')
  const canvas = document.querySelector(`.mesh-binding-canvas[data-binding-id="${binding.id}"]`)
  const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
  let minX = canvas.width, maxX = -1, count = 0, hash = 2166136261
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] > 8) {
      const x = (index / 4) % canvas.width
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); count += 1
    }
    if (index % 64 === 0) hash = Math.imul(hash ^ pixels[index] ^ pixels[index + 3], 16777619) >>> 0
  }
  return { width: maxX >= minX ? maxX - minX + 1 : 0, count, hash }
})

const loaded = await readTorso()
if (loaded.resizeBoxWidth !== 130 || loaded.bones.some(bone => bone.width !== 130)) throw new Error(`saved project was not normalized: ${JSON.stringify(loaded)}`)
const canvasBefore = await readTorsoCanvas()

await page.locator('.layer-item').filter({ hasText: '胸' }).click()
await page.locator('#wInput').fill('154')
await page.locator('#wInput').press('Enter')
const dragged = await readTorso()
if (dragged.resizeBoxWidth !== 154 || dragged.bones.some(bone => bone.width !== dragged.resizeBoxWidth)) throw new Error(`saved project width did not propagate: ${JSON.stringify(dragged)}`)
const canvasAfter = await readTorsoCanvas()

await page.locator('.layer-item').filter({ hasText: '胸' }).click()
await page.screenshot({ path: 'output/saved-project-resize-box-width.png', fullPage: true })
console.log(JSON.stringify({ project: entry.name, loaded, canvasBefore, dragged, canvasAfter, errors }, null, 2))
await browser.close()
