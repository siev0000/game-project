import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('.layer-item').filter({ hasText: '右上腕' }).click()
const sourceSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="#192432"/><rect x="0" y="0" width="80" height="160" fill="#f66"/><rect x="80" y="0" width="80" height="160" fill="#6f6"/><rect x="160" y="0" width="80" height="160" fill="#66f"/></svg>`
await page.locator('#replaceImageInput').setInputFiles({ name: 'arms.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(sourceSvg) })
await page.locator('#imageCropDialog[open]').waitFor()
await page.locator('.crop-bone-check').filter({ hasText: '右前腕' }).locator('input').check()
await page.locator('.crop-bone-check').filter({ hasText: '右手' }).locator('input').check()
await page.locator('#cropRotationInput').fill('30')
await page.locator('#cropRotationInput').press('Enter')
await page.waitForTimeout(180)
await page.locator('#cropBoneSelect').selectOption({ label: '右上腕' })
await page.locator('#cropXInput').fill('0')
await page.locator('#cropYInput').fill('10')
await page.locator('#cropWInput').fill('33')
await page.locator('#cropHInput').fill('70')
await page.locator('#cropHInput').press('Enter')
await page.locator('#cropBoneSelect').selectOption({ label: '右前腕' })
await page.locator('#cropXInput').fill('33')
await page.locator('#cropWInput').fill('33')
await page.locator('#cropWInput').press('Enter')
await page.locator('#cropBoneSelect').selectOption({ label: '右手' })
await page.locator('#cropXInput').fill('66')
await page.locator('#cropWInput').fill('34')
await page.locator('#cropWInput').press('Enter')
await page.screenshot({ path: 'output/bone-editor-rotated-crop.png' })
await page.locator('#imageCropApplyBtn').click()
await page.locator('#imageCropDialog').waitFor({ state: 'hidden' })
const pieceSources = await page.locator('.layer').evaluateAll(nodes => nodes
  .filter(node => ['右上腕', '右前腕', '右手'].includes(node.querySelector('.layer-label')?.textContent))
  .map(node => ({ name: node.querySelector('.layer-label')?.textContent, src: node.querySelector('.image-transform img')?.getAttribute('src') }))
)
const downloadPromise = page.waitForEvent('download')
await page.locator('#saveMenuBtn').click()
await page.locator('#exportMaterialGuideBtn').click()
const download = await downloadPromise
await download.saveAs('output/bone-editor-material-guide.png')
console.log(JSON.stringify({
  rotation: await page.locator('#cropRotationInput').inputValue().catch(() => 'closed'),
  pieces: pieceSources.map(piece => ({ name: piece.name, dataUrl: piece.src?.startsWith('data:image/png') ?? false, length: piece.src?.length ?? 0 })),
  uniquePieceData: new Set(pieceSources.map(piece => piece.src)).size,
  guide: { filename: download.suggestedFilename(), failure: await download.failure() },
  errors
}, null, 2))
await browser.close()
