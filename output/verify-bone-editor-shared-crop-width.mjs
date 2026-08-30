import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createProjectBtn').click()
await page.locator('.layer-item').filter({ hasText: '胸' }).click()

const sourceSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#20374a"/><path d="M0 100h400M0 250h400M0 400h400" stroke="#67b9ff" stroke-width="12"/></svg>`
await page.locator('#replaceImageInput').setInputFiles({ name: 'shared-width.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(sourceSvg) })
await page.locator('#imageCropDialog[open]').waitFor()
await page.locator('.crop-bone-check').filter({ hasText: '腹' }).locator('input').check()
await page.locator('.crop-bone-check').filter({ hasText: '腰' }).locator('input').check()

await page.locator('#cropBoneSelect').selectOption({ label: '胸' })
await page.locator('#cropXInput').fill('25')
await page.locator('#cropXInput').press('Enter')
await page.locator('#cropWInput').fill('60')
await page.locator('#cropWInput').press('Enter')
const afterNumber = await page.evaluate(() => [...document.querySelectorAll('.crop-selection')].map(element => ({
  name: element.querySelector('.crop-selection-label')?.textContent,
  x: parseFloat(element.style.left),
  width: parseFloat(element.style.width)
})))

const rightHandle = page.locator('.crop-selection.active .crop-handle.br')
const handleBox = await rightHandle.boundingBox()
await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
await page.mouse.down()
await page.mouse.move(handleBox.x + handleBox.width / 2 - 35, handleBox.y + handleBox.height / 2, { steps: 5 })
await page.mouse.up()
const afterDrag = await page.evaluate(() => [...document.querySelectorAll('.crop-selection')].map(element => ({
  name: element.querySelector('.crop-selection-label')?.textContent,
  x: parseFloat(element.style.left),
  width: parseFloat(element.style.width)
})))

const activeSelection = page.locator('.crop-selection.active')
const selectionBox = await activeSelection.boundingBox()
await page.mouse.move(selectionBox.x + selectionBox.width / 2, selectionBox.y + selectionBox.height / 2)
await page.mouse.down()
await page.mouse.move(selectionBox.x + selectionBox.width / 2 + 24, selectionBox.y + selectionBox.height / 2, { steps: 5 })
await page.mouse.up()
const afterMove = await page.evaluate(() => [...document.querySelectorAll('.crop-selection')].map(element => ({
  name: element.querySelector('.crop-selection-label')?.textContent,
  x: parseFloat(element.style.left),
  width: parseFloat(element.style.width)
})))

await page.screenshot({ path: 'output/bone-editor-shared-crop-width.png', fullPage: true })
console.log(JSON.stringify({
  note: await page.locator('#cropGroupWidthNote').textContent(),
  afterNumber,
  afterDrag,
  afterMove,
  numberRangesEqual: new Set(afterNumber.map(item => `${item.x.toFixed(3)}:${item.width.toFixed(3)}`)).size === 1,
  dragRangesEqual: new Set(afterDrag.map(item => `${item.x.toFixed(3)}:${item.width.toFixed(3)}`)).size === 1,
  moveRangesEqual: new Set(afterMove.map(item => `${item.x.toFixed(3)}:${item.width.toFixed(3)}`)).size === 1,
  dragChangedWidth: afterDrag[0]?.width !== afterNumber[0]?.width,
  errors
}, null, 2))
await browser.close()
