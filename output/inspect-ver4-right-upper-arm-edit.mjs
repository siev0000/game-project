import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.replaceCurrentProject === 'function')
const setup = await page.evaluate(async () => {
  const entry = await fetch('/api/local/bone-motion-projects?id=motion_20260816133413_r1zy', { cache: 'no-store' }).then(response => response.json())
  window.replaceCurrentProject(entry.project, null)
  document.querySelector('#projectLibraryDialog')?.close()
  const project = JSON.parse(document.querySelector('#jsonArea').value)
  const id = Object.entries(project.layers).find(([, layer]) => layer.name === '右上腕')?.[0]
  const meshes = Object.values(project.meshBindings || {}).filter(binding => binding.boneChain?.includes(id))
  return { id, displayOnly: !!project.meta.boneDisplaySizeMode, pose: project.defaultFrame[id], meshes: meshes.map(binding => ({ chain: binding.boneChain, resizeBoxWidth: binding.resizeBoxWidth })) }
})
await page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: /^右上腕$/ }) }).click()
const selected = await page.locator('#nameInput').inputValue()
const handles = await page.locator('#resizeBox .resize-handle').count()
const valuesBefore = {
  w: await page.locator('#wInput').inputValue(), h: await page.locator('#hInput').inputValue(),
  displayW: await page.locator('#boneDisplayWidthInput').inputValue(), displayH: await page.locator('#boneDisplayHeightInput').inputValue()
}
const handle = page.locator('#resizeBox .resize-handle.br')
const box = await handle.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 20, { steps: 5 })
await page.mouse.up()
await page.waitForTimeout(80)
const valuesAfter = {
  w: await page.locator('#wInput').inputValue(), h: await page.locator('#hInput').inputValue(),
  displayW: await page.locator('#boneDisplayWidthInput').inputValue(), displayH: await page.locator('#boneDisplayHeightInput').inputValue()
}
await page.screenshot({ path: 'output/inspect-ver4-right-upper-arm-edit.png', fullPage: true })
console.log(JSON.stringify({ setup, selected, handles, valuesBefore, valuesAfter, errors }, null, 2))
await browser.close()
