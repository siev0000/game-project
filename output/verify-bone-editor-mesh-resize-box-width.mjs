import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('bone_editor_compact_single_v34'))
await page.reload({ waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createStandardProjectBtn').click()

const defaultProject = await page.evaluate(() => JSON.parse(localStorage.getItem('bone_editor_compact_single_v34')))
const abdomenId = defaultProject.layerOrder.find(id => defaultProject.layers[id].key === 'abdomen')
const waistId = defaultProject.layerOrder.find(id => defaultProject.layers[id].key === 'waist')
const chestId = defaultProject.layerOrder.find(id => defaultProject.layers[id].key === 'chest')
if (abdomenId) throw new Error('standard 2D default still contains abdomen')
if (defaultProject.layers[chestId].parent !== waistId) throw new Error('chest is not connected directly to waist')

await page.locator('.layer-item').filter({ hasText: '腰' }).click()
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshBindingDialog[open]').waitFor()
await page.locator('#meshChainStartSelect').selectOption({ label: '腰' })
await page.locator('#meshChainEndSelect').selectOption({ label: '首' })

const torsoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500"><rect x="20" y="10" width="260" height="480" rx="40" fill="#f7c94b" stroke="#fff" stroke-width="8"/></svg>`
await page.locator('#meshImageInput').setInputFiles({ name: 'torso-resize-box.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(torsoSvg) })
await page.locator('#meshPreviewImage').waitFor()
await page.locator('#meshBindingApplyBtn').click()
await page.locator('#meshBindingDialog').waitFor({ state: 'hidden' })

const readSaved = () => page.evaluate(() => JSON.parse(localStorage.getItem('bone_editor_compact_single_v34')))
const bindingInfo = async () => {
  const saved = await readSaved()
  const binding = Object.values(saved.meshBindings).find(item => item.name === '腰 → 胸 → 首')
  return {
    binding,
    widths: binding.boneChain.map(id => saved.defaultFrame[id].w),
    displayWidths: binding.boneChain.map(id => saved.layers[id].editorBoneDisplayW),
    names: binding.boneChain.map(id => saved.layers[id].name)
  }
}
const meshCanvasHash = () => page.evaluate(() => {
  const canvas = document.querySelector('.mesh-binding-canvas')
  if (!canvas) return null
  const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
  let hash = 2166136261
  for (let index = 0; index < pixels.length; index += 16) hash = Math.imul(hash ^ pixels[index], 16777619) >>> 0
  return hash
})
const meshVisualSettings = async () => {
  const saved = await readSaved()
  const binding = Object.values(saved.meshBindings).find(item => item.name === '腰 → 胸 → 首')
  return JSON.stringify({
    sourceRect: binding.sourceRect,
    controlPoints: binding.controlPoints,
    targetWidthScale: binding.targetWidthScale,
    targetScaleX: binding.targetScaleX,
    targetScaleY: binding.targetScaleY,
    targetOffsetX: binding.targetOffsetX,
    targetOffsetY: binding.targetOffsetY,
    flipX: binding.flipX,
    flipY: binding.flipY
  })
}
const visibleResizeBoxWidths = async names => {
  const result = {}
  for (const name of names) {
    await page.locator('.layer-item').filter({ hasText: name }).click()
    result[name] = await page.locator('#resizeBox').evaluate(element => Number.parseFloat(element.style.width))
  }
  return result
}
const visibleResizeBoxBounds = async names => {
  const result = {}
  for (const name of names) {
    await page.locator('.layer-item').filter({ hasText: name }).click()
    const box = await page.locator('#resizeBox').boundingBox()
    result[name] = { left: box.x, right: box.x + box.width }
  }
  return result
}

const initial = await bindingInfo()
if (new Set(initial.widths).size !== 1 || initial.widths.some(width => width !== initial.binding.resizeBoxWidth)) throw new Error(`initial real resize widths differ: ${initial.widths}`)
if (new Set(initial.displayWidths).size !== 1) throw new Error(`initial display resize widths differ: ${initial.displayWidths}`)
const initialNormalBoxWidths = await visibleResizeBoxWidths(initial.names)
if (new Set(Object.values(initialNormalBoxWidths)).size !== 1) throw new Error(`normal resize boxes differ: ${JSON.stringify(initialNormalBoxWidths)}`)

await page.locator('.layer-item').filter({ hasText: '胸' }).click()
await page.locator('#wInput').fill('210')
await page.locator('#wInput').press('Enter')
const afterNumber = await bindingInfo()
if (afterNumber.binding.resizeBoxWidth !== 210 || afterNumber.widths.some(width => width !== 210)) {
  throw new Error(`numeric resize width did not propagate: ${JSON.stringify(afterNumber)}`)
}

const boundsBeforeNormalDrag = await visibleResizeBoxBounds(afterNumber.names)
await page.locator('.layer-item').filter({ hasText: '胸' }).click()
const normalResizeHandle = page.locator('#resizeBox .resize-handle.tr')
const normalHandleBox = await normalResizeHandle.boundingBox()
await page.mouse.move(normalHandleBox.x + normalHandleBox.width / 2, normalHandleBox.y + normalHandleBox.height / 2)
await page.mouse.down()
await page.mouse.move(normalHandleBox.x + normalHandleBox.width / 2 + 28, normalHandleBox.y + normalHandleBox.height / 2, { steps: 5 })
await page.mouse.up()
const afterNormalDrag = await bindingInfo()
if (afterNormalDrag.binding.resizeBoxWidth <= 210 || new Set(afterNormalDrag.widths).size !== 1) {
  throw new Error(`normal drag did not propagate the resize box width: ${JSON.stringify(afterNormalDrag)}`)
}
const boundsAfterNormalDrag = await visibleResizeBoxBounds(afterNormalDrag.names)
for (const name of afterNormalDrag.names) {
  if (Math.abs(boundsAfterNormalDrag[name].left - boundsBeforeNormalDrag[name].left) > 1) {
    throw new Error(`${name} extended in the opposite direction: ${JSON.stringify({ before: boundsBeforeNormalDrag[name], after: boundsAfterNormalDrag[name] })}`)
  }
  if (boundsAfterNormalDrag[name].right <= boundsBeforeNormalDrag[name].right) {
    throw new Error(`${name} did not extend toward the dragged side`)
  }
}
const imageHashBeforeDisplayResize = await meshCanvasHash()
const visualSettingsBeforeDisplayResize = await meshVisualSettings()

await page.locator('#boneDisplaySizeModeInput').check()
await page.locator('#boneDisplayWidthInput').fill('146')
await page.locator('#boneDisplayWidthInput').press('Enter')
const afterDisplayNumber = await bindingInfo()
if (afterDisplayNumber.binding.editorResizeBoxWidth !== 146 || afterDisplayNumber.displayWidths.some(width => width !== 146)) {
  throw new Error(`display resize width did not propagate: ${JSON.stringify(afterDisplayNumber)}`)
}

const resizeHandle = page.locator('#resizeBox .resize-handle.tr')
const handleBox = await resizeHandle.boundingBox()
await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
await page.mouse.down()
await page.mouse.move(handleBox.x + handleBox.width / 2 + 28, handleBox.y + handleBox.height / 2, { steps: 5 })
await page.mouse.up()
const afterDrag = await bindingInfo()
if (afterDrag.binding.editorResizeBoxWidth <= 146 || new Set(afterDrag.displayWidths).size !== 1) {
  throw new Error(`drag resize width did not propagate: ${JSON.stringify(afterDrag)}`)
}
const imageHashAfterDisplayResize = await meshCanvasHash()
const visualSettingsAfterDisplayResize = await meshVisualSettings()
if (visualSettingsAfterDisplayResize !== visualSettingsBeforeDisplayResize) throw new Error('display resize changed mesh image settings')
const boxWidths = await visibleResizeBoxWidths(afterDrag.names)
if (new Set(Object.values(boxWidths)).size !== 1) throw new Error(`visible resize boxes differ: ${JSON.stringify(boxWidths)}`)

await page.reload({ waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#recoverDraftBtn').click()
const restored = await bindingInfo()
if (restored.binding.editorResizeBoxWidth !== afterDrag.binding.editorResizeBoxWidth || restored.displayWidths.some(width => width !== afterDrag.binding.editorResizeBoxWidth)) {
  throw new Error(`restored display widths differ: ${JSON.stringify(restored)}`)
}
if (restored.binding.resizeBoxWidth !== afterNormalDrag.binding.resizeBoxWidth || restored.widths.some(width => width !== afterNormalDrag.binding.resizeBoxWidth)) throw new Error(`real widths changed after reload: ${restored.widths}`)

await page.locator('#boneDisplaySizeModeInput').uncheck()
const normalModeAfterReload = !(await page.locator('#boneDisplaySizeModeInput').isChecked())
if (!normalModeAfterReload) throw new Error('failed to return to normal edit mode')
await page.locator('.layer-item').filter({ hasText: '胸' }).click()
await page.screenshot({ path: 'output/bone-editor-mesh-resize-box-width.png', fullPage: true })
console.log(JSON.stringify({ defaultBoneCount: defaultProject.layerOrder.length, initial, initialNormalBoxWidths, afterNumber, boundsBeforeNormalDrag, afterNormalDrag, boundsAfterNormalDrag, afterDisplayNumber, afterDrag, boxWidths, imageHashBeforeDisplayResize, imageHashAfterDisplayResize, visualSettingsUnchanged:visualSettingsAfterDisplayResize === visualSettingsBeforeDisplayResize, restored, normalModeAfterReload, errors }, null, 2))
await browser.close()
