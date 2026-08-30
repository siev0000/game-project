import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createStandardProjectBtn').click()
await page.locator('.layer-item').filter({ hasText: '右上腕' }).click()
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshBindingDialog[open]').waitFor()

const armSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="540"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffcf45"/><stop offset="1" stop-color="#ff5b45"/></linearGradient></defs><path d="M38 12h104l-8 330 28 150-72 38-72-38 28-150z" fill="url(#g)" stroke="#fff" stroke-width="8"/><circle cx="90" cy="265" r="28" fill="#172a3a" stroke="#65ffd0" stroke-width="8"/></svg>`
await page.locator('#meshImageInput').setInputFiles({ name: 'right-arm-chain.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(armSvg) })
await page.locator('#meshPreviewImage').waitFor()
await page.waitForTimeout(150)

const point = page.locator('.mesh-control-point').nth(1)
const pointBox = await point.boundingBox()
await page.mouse.move(pointBox.x + pointBox.width / 2, pointBox.y + pointBox.height / 2)
await page.mouse.down()
await page.mouse.move(pointBox.x + pointBox.width / 2 + 18, pointBox.y + pointBox.height / 2, { steps: 4 })
await page.mouse.up()
const editorState = await page.evaluate(() => ({
  chain: document.querySelector('#meshChainSelect')?.selectedOptions[0]?.textContent,
  points: document.querySelectorAll('.mesh-control-point').length,
  source: document.querySelector('#meshSourceLabel')?.textContent
}))
await page.screenshot({ path: 'output/bone-editor-chain-mesh-editor.png', fullPage: true })
await page.locator('#meshBindingApplyBtn').click()
await page.locator('#meshBindingDialog').waitFor({ state: 'hidden' })
await page.waitForTimeout(200)

await page.locator('.layer-item').filter({ hasText: '右前腕' }).click()
await page.locator('#rotateModeBtn').click()
await page.locator('#rInput').fill('55')
await page.locator('#rInput').press('Enter')
await page.waitForTimeout(150)

const rendered = await page.evaluate(() => {
  const saved = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const binding = Object.values(saved.meshBindings || {})[0]
  const canvas = document.querySelector('.mesh-binding-canvas')
  const pixels = canvas ? canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data : []
  let opaque = 0
  for (let index = 3; index < pixels.length; index += 4) if (pixels[index]) opaque++
  return {
    binding: binding ? { name: binding.name, chainLength: binding.boneChain.length, pointCount: binding.controlPoints.length, segments: binding.segmentsPerBone } : null,
    canvasCount: document.querySelectorAll('.mesh-binding-canvas').length,
    opaquePixels: opaque,
    layerSources: binding?.boneChain.map(id => saved.layers[id].imageSourceId)
  }
})
await page.screenshot({ path: 'output/bone-editor-chain-mesh-bent.png', fullPage: true })

await page.reload({ waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#recoverDraftBtn').click()
await page.waitForTimeout(200)
const restored = await page.evaluate(() => ({
  bindings: Object.keys(JSON.parse(localStorage.getItem('bone_editor_compact_single_v34')).meshBindings || {}).length,
  canvases: document.querySelectorAll('.mesh-binding-canvas').length
}))

console.log(JSON.stringify({ editorState, rendered, restored, errors }, null, 2))
await browser.close()
