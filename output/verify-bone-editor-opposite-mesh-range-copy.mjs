import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createPixelSideProjectBtn').click()

const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="420"><rect x="30" y="8" width="100" height="404" rx="36" fill="${color}" stroke="#fff" stroke-width="6"/></svg>`

async function openRange(startBone, endLabel) {
  await page.locator('.layer-item').filter({ hasText: startBone }).click()
  await page.locator('#editMeshBindingBtn').click()
  await page.locator('#meshBindingDialog[open]').waitFor()
  await page.locator('#meshChainStartSelect').selectOption({ label: startBone })
  await page.locator('#meshChainEndSelect').selectOption({ label: endLabel })
}

async function setRect([x,y,w,h]) {
  for (const [id,value] of [['meshRangeXInput',x],['meshRangeYInput',y],['meshRangeWInput',w],['meshRangeHInput',h]]) {
    await page.locator(`#${id}`).fill(String(value))
    await page.locator(`#${id}`).dispatchEvent('change')
  }
}

await openRange('左太腿', '左すね')
await page.locator('#meshImageInput').setInputFiles({ name:'left-leg.svg', mimeType:'image/svg+xml', buffer:Buffer.from(svg('#2ecf9f')) })
await page.locator('#meshPreviewImage').waitFor()
await setRect([6,14,32,26])
await page.locator('#meshSegmentsInput').fill('9')
await page.locator('#meshSegmentsInput').dispatchEvent('input')
await page.locator('#meshFlipYBtn').click()
await page.locator('#meshBindingApplyBtn').click()
await page.locator('#meshBindingDialog').waitFor({ state:'hidden' })

await openRange('右太腿', '右すね')
await page.locator('#meshImageInput').setInputFiles({ name:'right-leg.svg', mimeType:'image/svg+xml', buffer:Buffer.from(svg('#8067df')) })
await page.locator('#meshPreviewImage').waitFor()
await setRect([21.5,33.5,28,19.5])
await page.locator('.mesh-control-point').nth(1).click()
await page.locator('#meshPointNameInput').fill('膝コピー')
await page.locator('#meshPointNameInput').dispatchEvent('input')
await page.locator('#meshPointTInput').fill('58')
await page.locator('#meshPointTInput').dispatchEvent('input')
await page.locator('#meshPointLeftInput').fill('31')
await page.locator('#meshPointLeftInput').dispatchEvent('input')
await page.locator('#meshPointRightInput').fill('47')
await page.locator('#meshPointRightInput').dispatchEvent('input')

const before = await page.evaluate(() => {
  const saved=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const left=Object.values(saved.meshBindings).find(binding=>binding.name==='左太腿 → 左すね')
  return { sourceRect:left.sourceRect,segments:left.segmentsPerBone,flipY:left.flipY,sourceId:left.sourceId,controlPoints:left.controlPoints }
})
const button = page.locator('#meshRangeCopyOppositeBtn')
const buttonState = { disabled:await button.isDisabled(), title:await button.getAttribute('title') }
await button.click()
await page.waitForTimeout(100)
const after = await page.evaluate(() => {
  const saved=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const left=Object.values(saved.meshBindings).find(binding=>binding.name==='左太腿 → 左すね')
  return {
    sourceRect:left.sourceRect,segments:left.segmentsPerBone,flipY:left.flipY,sourceId:left.sourceId,controlPoints:left.controlPoints,
    status:document.querySelector('#meshRangeCopyStatus')?.textContent
  }
})
await page.screenshot({ path:'output/bone-editor-opposite-mesh-range-copy.png', fullPage:true })

await page.locator('#meshBindingCancelBtn').click()
await page.reload({ waitUntil:'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#recoverDraftBtn').click()
await page.waitForTimeout(100)
const restored = await page.evaluate(() => {
  const saved=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const left=Object.values(saved.meshBindings).find(binding=>binding.name==='左太腿 → 左すね')
  return left?.sourceRect
})

console.log(JSON.stringify({ before,buttonState,after,restored,errors },null,2))
await browser.close()
