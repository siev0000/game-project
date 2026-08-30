import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('.layer-item').filter({ hasText: '胸' }).click()
const sourceSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="300"><rect width="180" height="100" fill="#f66"/><rect y="100" width="180" height="100" fill="#6f6"/><rect y="200" width="180" height="100" fill="#66f"/><path d="M20 20h40v60H20z" fill="#fff"/></svg>`
await page.locator('#replaceImageInput').setInputFiles({ name: 'torso.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(sourceSvg) })
await page.locator('#imageCropDialog[open]').waitFor()
await page.locator('.crop-bone-check').filter({ hasText: '腹' }).locator('input').check()
await page.locator('.crop-bone-check').filter({ hasText: '腰' }).locator('input').check()
await page.locator('#cropFlipXInput').check()
await page.waitForTimeout(120)
const ranges = [
  { label: '胸', y: '0' },
  { label: '腹', y: '33.3' },
  { label: '腰', y: '66.6' }
]
for (const range of ranges) {
  await page.locator('#cropBoneSelect').selectOption({ label: range.label })
  await page.locator('#cropXInput').fill('0')
  await page.locator('#cropYInput').fill(range.y)
  await page.locator('#cropWInput').fill('100')
  await page.locator('#cropHInput').fill('33.3')
  await page.locator('#cropHInput').press('Enter')
}
await page.screenshot({ path: 'output/bone-editor-torso-split-flip.png' })
await page.locator('#imageCropApplyBtn').click()
await page.locator('#imageCropDialog').waitFor({ state: 'hidden' })
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('bone_editor_compact_single_v34')))
const torsoLayers = Object.values(stored.layers).filter(layer => ['胸', '腹', '腰'].includes(layer.name))
console.log(JSON.stringify({
  sourceTransform: Object.fromEntries(Object.values(stored.imageSources).map(source => [source.name, {
    rotation: source.cropRotation,
    flipX: source.cropFlipX,
    flipY: source.cropFlipY
  }])),
  torsoPieces: torsoLayers.map(layer => ({
    name: layer.name,
    sourceId: layer.imageSourceId,
    crop: [layer.imageCropX, layer.imageCropY, layer.imageCropW, layer.imageCropH],
    fragment: layer.imageFragmentData?.startsWith('data:image/png') ?? false,
    fragmentLength: layer.imageFragmentData?.length ?? 0
  })),
  sharedSourceCount: new Set(torsoLayers.map(layer => layer.imageSourceId)).size,
  uniqueFragmentCount: new Set(torsoLayers.map(layer => layer.imageFragmentData)).size,
  errors
}, null, 2))
await browser.close()
