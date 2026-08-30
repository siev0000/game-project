import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createPixelSideProjectBtn').click()

async function openMeshFor(name) {
  await page.locator('.layer-item').filter({ hasText: name }).click()
  await page.locator('#editMeshBindingBtn').click()
  await page.locator('#meshBindingDialog[open]').waitFor()
}

async function chooseRange(start, end) {
  await page.locator('#meshChainStartSelect').selectOption({ label: start })
  await page.locator('#meshChainEndSelect').selectOption({ label: end })
  return page.evaluate(() => ({
    start: document.querySelector('#meshChainStartSelect')?.selectedOptions[0]?.textContent,
    end: document.querySelector('#meshChainEndSelect')?.selectedOptions[0]?.textContent,
    chain: document.querySelector('#meshChainSelect')?.selectedOptions[0]?.textContent,
    chainIds: JSON.parse(window.render_game_to_text()).meshEditor.chain
  }))
}

await openMeshFor('右太腿')
const thighShin = await chooseRange('右太腿', '右すね')
await page.locator('#meshBindingCloseBtn').click()

await openMeshFor('右上腕')
const upperArm = await chooseRange('右上腕', '右腕')
await page.locator('#meshBindingCloseBtn').click()

await openMeshFor('右足首')
const footToe = await chooseRange('右足首', 'つま先')
await page.screenshot({ path: 'output/bone-editor-mesh-chain-range-dialog.png', fullPage: true })
const footSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100"><path d="M8 22h130l84 48-20 22H8z" fill="#f2c94c" stroke="#fff" stroke-width="5"/></svg>`
await page.locator('#meshImageInput').setInputFiles({ name: 'foot-to-toe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(footSvg) })
await page.locator('#meshPreviewImage').waitFor()
await page.locator('#meshBindingApplyBtn').click()
await page.locator('#meshBindingDialog').waitFor({ state: 'hidden' })
await page.waitForTimeout(200)

const savedFoot = await page.evaluate(() => {
  const saved = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const binding = Object.values(saved.meshBindings || {})[0]
  const canvas = document.querySelector('.mesh-binding-canvas')
  const pixels = canvas ? canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data : []
  let opaquePixels = 0
  for (let index = 3; index < pixels.length; index += 4) if (pixels[index]) opaquePixels++
  return {
    chainLength: binding?.boneChain?.length,
    name: binding?.name,
    controlPoints: binding?.controlPoints?.length,
    canvasSize: canvas ? [canvas.width, canvas.height] : null,
    opaquePixels
  }
})

await page.screenshot({ path: 'output/bone-editor-mesh-chain-range.png', fullPage: true })
await page.reload({ waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#recoverDraftBtn').click()
await page.waitForTimeout(150)
const restoredFoot = await page.evaluate(() => {
  const saved = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const binding = Object.values(saved.meshBindings || {})[0]
  return { chainLength: binding?.boneChain?.length, name: binding?.name, canvases: document.querySelectorAll('.mesh-binding-canvas').length }
})

await page.locator('#projectListBtn').click()
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createStandardProjectBtn').click()
await openMeshFor('右上腕')
const standardUpperArm = await chooseRange('右上腕', '右前腕')
await page.locator('#meshBindingCloseBtn').click()

console.log(JSON.stringify({ thighShin, upperArm, footToe, savedFoot, restoredFoot, standardUpperArm, errors }, null, 2))
await browser.close()
