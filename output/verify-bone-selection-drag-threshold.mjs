import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
const url = 'http://192.168.0.209:5173/2d_bone_editor_split/'
await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('bone_editor_compact_single_v34'))
await page.reload({ waitUntil: 'networkidle' })

const layer = page.locator('.layer').filter({ hasText: '右上腕' })
const box = await layer.boundingBox()
const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
const readAngle = () => page.evaluate(() => {
  const data = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const layerId = data.layerOrder.find(id => data.layers[id].name === '右上腕')
  return data.frames[0][layerId].r
})

const initialAngle = await readAngle()
await layer.dispatchEvent('mousedown', { button: 0, clientX: center.x, clientY: center.y })
await page.evaluate(({ x, y }) => window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true })), { x: center.x + 2, y: center.y + 1 })
await page.evaluate(() => window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })))
const afterSmallMovement = await readAngle()

await page.evaluate(() => {
  const data = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const layerId = data.layerOrder.find(id => data.layers[id].name === '右上腕')
  data.frames[0][layerId].r = 17
  localStorage.setItem('bone_editor_compact_single_v34', JSON.stringify(data))
})
await page.reload({ waitUntil: 'networkidle' })
const cachedBeforeClick = await readAngle()
const cachedLayer = page.locator('.layer').filter({ hasText: '右上腕' })
const cachedBox = await cachedLayer.boundingBox()
const cachedCenter = { x: cachedBox.x + cachedBox.width / 2, y: cachedBox.y + cachedBox.height / 2 }
await cachedLayer.dispatchEvent('mousedown', { button: 0, clientX: cachedCenter.x, clientY: cachedCenter.y })
await page.evaluate(() => window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })))
const cachedAfterClick = await readAngle()

await cachedLayer.dispatchEvent('mousedown', { button: 0, clientX: cachedCenter.x, clientY: cachedCenter.y })
await page.evaluate(({ x, y }) => window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true })), { x: cachedCenter.x + 24, y: cachedCenter.y })
await page.evaluate(() => window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })))
const afterIntentionalDrag = await readAngle()
await page.screenshot({ path: 'output/bone-selection-drag-threshold.png' })

console.log(JSON.stringify({ initialAngle, afterSmallMovement, cachedBeforeClick, cachedAfterClick, afterIntentionalDrag, errors }, null, 2))
await browser.close()
