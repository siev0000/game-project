import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})

await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('.project-card').filter({ hasText: '鎧デフォルト' }).locator('.project-card-main').click()

const readLayerState = () => page.evaluate(() => {
  const layers = [...document.querySelectorAll('.layer')].map(element => ({
    name: element.querySelector('.layer-label')?.textContent || '',
    z: Number(element.style.zIndex)
  }))
  const state = JSON.parse(window.render_game_to_text())
  const bindingNames = new Map(state.meshBindings.map(binding => [binding.id, binding.name]))
  const meshes = [...document.querySelectorAll('.mesh-binding-canvas')].map(element => ({
    name: bindingNames.get(element.dataset.bindingId) || element.dataset.bindingId,
    z: Number(element.style.zIndex)
  }))
  return { layers, meshes }
})

const defaultState = await readLayerState()
await page.locator('#animationSelect').selectOption({ label: '既存モーション' })
await page.locator('.frame-btn').filter({ hasText: '2' }).click()
const frameTwoState = await readLayerState()

const duplicateZ = values => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))]
const find = (items, name) => items.find(item => item.name === name)
const result = {
  default: {
    waist: find(defaultState.layers, '腰'),
    rightThigh: find(defaultState.layers, '右太腿'),
    torsoMesh: find(defaultState.meshes, '腰 → 胸'),
    rightLegMesh: find(defaultState.meshes, '右太腿 → 右すね → 右足'),
    duplicateBoneZ: duplicateZ(defaultState.layers.map(item => item.z))
  },
  frameTwo: {
    layerCount: frameTwoState.layers.length,
    sortedZ: frameTwoState.layers.map(item => item.z).sort((a, b) => a - b),
    duplicateBoneZ: duplicateZ(frameTwoState.layers.map(item => item.z))
  },
  errors
}

await page.screenshot({ path: 'output/bone-editor-layer-normalization.png', fullPage: true })
console.log(JSON.stringify(result, null, 2))
await browser.close()
