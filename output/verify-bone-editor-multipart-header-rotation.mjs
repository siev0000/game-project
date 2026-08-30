import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('bone_editor_compact_single_v34'))
await page.reload({ waitUntil: 'networkidle' })

await page.locator('.layer-item').filter({ hasText: '胸' }).click()
const sourceSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360"><rect width="240" height="120" fill="#f66"/><rect y="120" width="240" height="120" fill="#6f6"/><rect y="240" width="240" height="120" fill="#66f"/></svg>`
await page.locator('#replaceImageInput').setInputFiles({ name: 'torso.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(sourceSvg) })
await page.locator('#imageCropDialog[open]').waitFor()
await page.locator('.crop-bone-check').filter({ hasText: '腹' }).locator('input').check()
await page.locator('.crop-bone-check').filter({ hasText: '腰' }).locator('input').check()

for (const range of [{ label: '胸', y: '0' }, { label: '腹', y: '33.3' }, { label: '腰', y: '66.6' }]) {
  await page.locator('#cropBoneSelect').selectOption({ label: range.label })
  await page.locator('#cropYInput').fill(range.y)
  await page.locator('#cropHInput').fill('33.3')
  await page.locator('#cropHInput').press('Enter')
}

const handle = page.locator('#cropImageRotateHandle')
const box = await handle.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 6 })
await page.mouse.up()
await page.waitForTimeout(250)

const editorState = await page.evaluate(() => ({
  selections: [...document.querySelectorAll('.crop-selection')].map(el => ({ name: el.querySelector('.crop-selection-label')?.textContent, active: el.classList.contains('active') })),
  headerAngle: document.querySelector('#cropHeaderRotationValue')?.textContent,
  visibleHeader: !!document.querySelector('#cropImageRotateHandle')?.offsetParent
}))
await page.screenshot({ path: 'output/bone-editor-multipart-header-rotation.png', fullPage: true })
await page.locator('#imageCropApplyBtn').click()
await page.locator('#imageCropDialog').waitFor({ state: 'hidden' })

await page.locator('.layer-item').filter({ hasText: '胸' }).click()
await page.locator('#headerClearImageBtn').click()
const cleared = await page.evaluate(() => {
  const saved = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const chest = Object.values(saved.layers).find(layer => layer.name === '胸')
  return { sourceId: chest.imageSourceId, imageData: chest.imageData, fragment: chest.imageFragmentData }
})

await page.locator('.layer-item').filter({ hasText: '腹' }).click()
await page.locator('#editImageCropBtn').click()
page.once('dialog', dialog => dialog.accept())
await page.locator('#imageCropRemoveAllBtn').click()
const groupCleared = await page.evaluate(() => {
  const saved = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const torso = Object.values(saved.layers).filter(layer => ['胸', '腹', '腰'].includes(layer.name))
  return {
    remainingAssigned: torso.filter(layer => layer.imageSourceId || layer.imageFragmentData).map(layer => layer.name),
    sourceCount: Object.keys(saved.imageSources || {}).length
  }
})

console.log(JSON.stringify({ editorState, cleared, groupCleared, errors }, null, 2))
await browser.close()
