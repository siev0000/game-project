import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
const library = await page.evaluate(() => fetch('/api/local/bone-motion-projects', { cache: 'no-store' }).then(response => response.json()))
const candidates = library.projects.filter(entry => Object.keys(entry.project?.meshBindings || {}).length).slice(0, 8)
const results = []

for (const entry of candidates) {
  if (!(await page.locator('#projectLibraryDialog').evaluate(element => element.open))) {
    await page.locator('#projectListBtn').click()
    await page.locator('#projectLibraryDialog[open]').waitFor()
  }
  await page.getByText(entry.name, { exact: true }).locator('..').click()
  if (await page.locator('#boneDisplaySizeModeInput').isChecked()) await page.locator('#boneDisplaySizeModeInput').uncheck()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('bone_editor_compact_single_v34')))
  const bindings = []
  for (const binding of Object.values(saved.meshBindings || {})) {
    const bones = []
    for (const id of binding.boneChain || []) {
      const item = page.locator(`.layer-item[data-layer-id="${id}"]`)
      if (!(await item.count())) {
        bones.push({ id, missing: true })
        continue
      }
      await item.click()
      bones.push(await page.evaluate(({ id }) => {
        const savedProject = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
        const box = document.querySelector('#resizeBox')
        return {
          id,
          name: savedProject.layers[id]?.name,
          realW: savedProject.defaultFrame[id]?.w,
          storedDisplayW: savedProject.layers[id]?.editorBoneDisplayW,
          cssW: Number.parseFloat(box.style.width),
          cssH: Number.parseFloat(box.style.height),
          bindingId: JSON.parse(window.render_game_to_text()).meshBindings.find(item => item.name === savedProject.meshBindings[Object.keys(savedProject.meshBindings).find(key => savedProject.meshBindings[key].boneChain.includes(id))]?.name)?.id || null
        }
      }, { id }))
    }
    bindings.push({ id: binding.id, name: binding.name, enabled: binding.enabled, editorResizeBoxWidth: binding.editorResizeBoxWidth, bones })
  }
  results.push({ id: entry.id, name: entry.name, bindings })
}

console.log(JSON.stringify({ results, errors }, null, 2))
await browser.close()
