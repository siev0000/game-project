import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const projectId = 'motion_20260815095021_85vj'
const boneIds = {
  shin: 'layer_hy9ldr5z',
  foot: 'layer_icbefltx',
  toe: 'layer_l6tr11bb'
}
const bindingIds = { shin: 'mesh_ckewsx50', foot: 'mesh_lzwpiwgy' }
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.replaceCurrentProject === 'function')
await page.evaluate(async ({ projectId }) => {
  const entry = await fetch(`/api/local/bone-motion-projects?id=${encodeURIComponent(projectId)}`, { cache: 'no-store' }).then(response => response.json())
  window.replaceCurrentProject(entry.project, null)
  document.querySelector('#projectLibraryDialog')?.close()
}, { projectId })
await page.waitForSelector(`.mesh-binding-canvas[data-binding-id="${bindingIds.foot}"]`)
const before = await page.evaluate(({ bindingIds }) => ({
  shin: Number(getComputedStyle(document.querySelector(`.mesh-binding-canvas[data-binding-id="${bindingIds.shin}"]`)).zIndex),
  foot: Number(getComputedStyle(document.querySelector(`.mesh-binding-canvas[data-binding-id="${bindingIds.foot}"]`)).zIndex)
}), { bindingIds })
await page.evaluate(({ boneIds }) => {
  window.setLayerNumber(boneIds.foot, 1, false, false)
  window.setLayerNumber(boneIds.toe, 2, false, false)
  window.setLayerNumber(boneIds.shin, 24, false, true)
}, { boneIds })
await page.waitForTimeout(120)
const after = await page.evaluate(({ bindingIds }) => ({
  shin: Number(getComputedStyle(document.querySelector(`.mesh-binding-canvas[data-binding-id="${bindingIds.shin}"]`)).zIndex),
  foot: Number(getComputedStyle(document.querySelector(`.mesh-binding-canvas[data-binding-id="${bindingIds.foot}"]`)).zIndex),
  order: JSON.parse(window.render_game_to_text()).meshBindings
}), { bindingIds })
await page.screenshot({ path: 'output/bone-editor-mesh-layer-order.png' })
if (!(after.shin > after.foot)) throw new Error(`右すねを手前、右足／つま先を奥へした順番がメッシュへ反映されていません: ${JSON.stringify({ before, after })}`)
if (errors.length) throw new Error(`console errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({ before, after, errors }))
await browser.close()
