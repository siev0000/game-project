import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, acceptDownloads: true })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createProjectBtn').click()
await page.locator('.layer-item').filter({ hasText: '右上腕' }).click()
await page.locator('#editMeshBindingBtn').click()

const firstSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="560"><path d="M35 10h130l-18 520-47 20-47-20z" fill="#ffb02e"/><circle cx="72" cy="90" r="18" fill="#35e8ff"/></svg>`
await page.locator('#meshImageInput').setInputFiles({ name: 'right-arm-gold.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(firstSvg) })
await page.locator('#meshPreviewImage').waitFor()
await page.locator('#meshAddPointBtn').click()
await page.locator('#meshPointTInput').fill('18')
await page.locator('#meshPointLeftInput').fill('24')
await page.locator('#meshPointRightInput').fill('58')
await page.locator('#meshFlipXBtn').click()
await page.locator('#meshRotationInput').fill('15')
await page.locator('#meshRotationInput').press('Enter')
await page.waitForTimeout(150)

const edited = await page.evaluate(() => ({
  slot: document.querySelector('#meshPartSlotSelect')?.value,
  pointCount: document.querySelectorAll('.mesh-control-point').length,
  widthHandles: document.querySelectorAll('.mesh-width-handle').length,
  flipX: document.querySelector('#meshFlipXBtn')?.getAttribute('aria-pressed'),
  rotation: document.querySelector('#meshRotationInput')?.value,
  active: document.querySelector('#meshActivePointLabel')?.textContent
}))
await page.screenshot({ path: 'output/bone-editor-mesh-fine-range.png', fullPage: true })
await page.locator('#meshBindingApplyBtn').click()
await page.waitForTimeout(120)

await page.locator('.layer-item').filter({ hasText: '右前腕' }).click()
await page.locator('#rInput').fill('55')
await page.locator('#rInput').press('Enter')
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshSaveReferencePoseBtn').click()
const downloadPromise = page.waitForEvent('download')
await page.locator('#meshGuideDownloadBtn').click()
const download = await downloadPromise
await download.saveAs('output/bone-editor-right-arm-reference-guide.png')
await page.locator('#meshBindingCancelBtn').click()

await page.locator('#rInput').fill('10')
await page.locator('#rInput').press('Enter')
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshApplyReferencePoseBtn').click()
const restoredAngle = await page.locator('#rInput').inputValue()

const secondSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="560"><path d="M28 8h144l-10 525-62 20-62-20z" fill="#845cff"/><path d="M45 70h110v70H45z" fill="#f3e9ff"/></svg>`
await page.locator('#meshImageInput').setInputFiles({ name: 'right-arm-purple.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(secondSvg) })
await page.locator('#meshBindingApplyBtn').click()
await page.waitForTimeout(160)
await page.screenshot({ path: 'output/bone-editor-mesh-part-replaced.png', fullPage: true })

const saved = await page.evaluate(() => {
  const project = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const binding = Object.values(project.meshBindings || {})[0]
  return {
    bindingId: binding.id,
    slot: binding.partSlot,
    points: binding.controlPoints.length,
    finePoint: binding.controlPoints.find(point => Math.abs(point.t - .18) < .03),
    flipX: binding.flipX,
    rotation: binding.rotation,
    sourceName: project.imageSources[binding.sourceId]?.name,
    referenceName: project.meta.referencePoseName,
    referenceForearmAngle: project.meta.referencePose[binding.boneChain[1]]?.r,
    canvasCount: document.querySelectorAll('.mesh-binding-canvas').length
  }
})

await page.reload({ waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#recoverDraftBtn').click()
await page.waitForTimeout(120)
const reloaded = await page.evaluate(() => {
  const project = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const binding = Object.values(project.meshBindings || {})[0]
  return { slot: binding.partSlot, points: binding.controlPoints.length, sourceName: project.imageSources[binding.sourceId]?.name, canvasCount: document.querySelectorAll('.mesh-binding-canvas').length }
})

console.log(JSON.stringify({ edited, guide: download.suggestedFilename(), restoredAngle, saved, reloaded, errors }, null, 2))
await browser.close()
