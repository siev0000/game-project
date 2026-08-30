import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()

const library = await page.evaluate(async () => (await fetch('/api/local/bone-motion-projects', { cache: 'no-store' })).json())
const targets = (library.projects || []).filter(entry => {
  const project = entry.project || {}
  const imageCount = Object.keys(project.imageSources || {}).length
  const meshCount = Object.keys(project.meshBindings || {}).length
  return project.meta?.rigType === 'pixel_simple' && project.layerOrder?.length === 10 && project.frames?.length === 1 && imageCount === 0 && meshCount === 0
})

for (const target of targets) {
  await page.locator('#createPixelProjectBtn').click()
  const result = await page.evaluate(async ({ id, name }) => {
    const project = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
    project.meta.name = name
    const response = await fetch('/api/local/bone-motion-projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, project })
    })
    return { ok: response.ok, status: response.status, body: await response.json() }
  }, { id: target.id, name: target.name || 'pixel_motion' })
  if (!result.ok) throw new Error(`saved pixel rig update failed: ${result.status}`)
}

console.log(JSON.stringify({ updated: targets.map(entry => entry.id) }))
await browser.close()
