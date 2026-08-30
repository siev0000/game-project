import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createPixelSideProjectBtn').click()

await page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: /^右上腕$/ }) }).click()
await page.locator('#anchorModeBtn').click()
await page.locator('.anchor-editor-handle.parent').waitFor()
await page.locator('.anchor-editor-handle.origin').waitFor()

const before = await page.evaluate(() => ({
  mode: JSON.parse(window.render_game_to_text()).editMode,
  attachX: document.querySelector('#attachXInput').value,
  attachY: document.querySelector('#attachYInput').value,
  ox: document.querySelector('#oxInput').value,
  oy: document.querySelector('#oyInput').value
}))
const originBeforeParent = await page.locator('.anchor-editor-handle.origin .anchor-editor-dot').boundingBox()
const parentBox = await page.locator('.anchor-editor-handle.parent .anchor-editor-dot').boundingBox()
await page.mouse.move(parentBox.x + parentBox.width / 2, parentBox.y + parentBox.height / 2)
await page.mouse.down()
await page.mouse.move(parentBox.x + parentBox.width / 2 + 42, parentBox.y + parentBox.height / 2 + 18, { steps: 5 })
await page.mouse.up()
const afterParent = await page.evaluate(() => ({ attachX: document.querySelector('#attachXInput').value, attachY: document.querySelector('#attachYInput').value }))
const originAfterParent = await page.locator('.anchor-editor-handle.origin .anchor-editor-dot').boundingBox()

const pivotBox = await page.locator('.anchor-editor-handle.origin .anchor-editor-dot').boundingBox()
const visualBeforeOriginMove = await page.locator('.layer.selected').boundingBox()
await page.mouse.move(pivotBox.x + pivotBox.width / 2, pivotBox.y + pivotBox.height / 2)
await page.mouse.down()
await page.mouse.move(pivotBox.x + pivotBox.width / 2, pivotBox.y + pivotBox.height / 2 + 42, { steps: 5 })
await page.mouse.up()
const visualAfterOriginMove = await page.locator('.layer.selected').boundingBox()
const afterPivot = await page.evaluate(() => ({
  ox: document.querySelector('#oxInput').value,
  oy: document.querySelector('#oyInput').value,
  state: JSON.parse(window.render_game_to_text())
}))
await page.screenshot({ path: 'output/bone-editor-anchor-mode.png', fullPage: true })

console.log(JSON.stringify({ before, originBeforeParent, afterParent, originAfterParent, visualBeforeOriginMove, visualAfterOriginMove, afterPivot, errors }, null, 2))
await browser.close()
