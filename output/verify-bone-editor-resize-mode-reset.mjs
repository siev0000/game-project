import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
const entry = await page.evaluate(() => fetch('/api/local/bone-motion-projects?id=motion_20260821041211_iekc', { cache: 'no-store' }).then(response => response.json()))
if (entry.project.meta.boneDisplaySizeMode !== true) throw new Error('fixture no longer starts in display-only mode')
await page.evaluate(project => localStorage.setItem('bone_editor_compact_single_v34', JSON.stringify(project)), entry.project)
await page.reload({ waitUntil: 'networkidle' })
await page.locator('#recoverDraftBtn').click()
await page.locator('.layer-item').filter({ hasText: '胸' }).click()

const canvasMetrics = () => page.evaluate(() => {
  const project = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const binding = Object.values(project.meshBindings).find(item => item.name === '腰 → 胸 → 首')
  const canvas = document.querySelector(`.mesh-binding-canvas[data-binding-id="${binding.id}"]`)
  const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
  let minX = canvas.width, maxX = -1, count = 0
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] <= 8) continue
    const x = (index / 4) % canvas.width
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); count += 1
  }
  return { width: maxX >= minX ? maxX - minX + 1 : 0, count }
})

if (await page.locator('#boneDisplaySizeModeInput').isChecked()) throw new Error('display-only mode remained enabled after opening project')
const openedMeta = await page.evaluate(() => JSON.parse(localStorage.getItem('bone_editor_compact_single_v34')).meta.boneDisplaySizeMode)
if (openedMeta !== false) throw new Error('transient display-only mode was written back as enabled')

const beforeRealResize = await canvasMetrics()
const widthBeforeDrag = Number(await page.locator('#wInput').inputValue())
const handle = page.locator('#resizeBox .resize-handle.tr')
const handleBox = await handle.boundingBox()
await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
await page.mouse.down()
await page.mouse.move(handleBox.x + handleBox.width / 2 + 24, handleBox.y + handleBox.height / 2, { steps: 5 })
await page.mouse.up()
const widthAfterDrag = Number(await page.locator('#wInput').inputValue())
const afterRealDrag = await canvasMetrics()
if (widthAfterDrag <= widthBeforeDrag || afterRealDrag.width <= beforeRealResize.width) {
  throw new Error(`normal handle drag did not resize mesh image: ${JSON.stringify({ widthBeforeDrag, widthAfterDrag, beforeRealResize, afterRealDrag })}`)
}
await page.locator('#wInput').fill('150')
await page.locator('#wInput').press('Enter')
const afterRealResize = await canvasMetrics()
if (afterRealResize.width <= beforeRealResize.width || afterRealResize.count === beforeRealResize.count) {
  throw new Error(`normal resize did not resize mesh image: ${JSON.stringify({ beforeRealResize, afterRealResize })}`)
}

await page.locator('#boneDisplaySizeModeInput').check()
await page.locator('.bone-display-mode-notice').waitFor()
const beforeDisplayResize = await canvasMetrics()
await page.locator('#boneDisplayWidthInput').fill('190')
await page.locator('#boneDisplayWidthInput').press('Enter')
const afterDisplayResize = await canvasMetrics()
if (JSON.stringify(afterDisplayResize) !== JSON.stringify(beforeDisplayResize)) throw new Error('display-only resize changed mesh image')
await page.screenshot({ path: 'output/bone-editor-display-only-warning.png', fullPage: true })

await page.reload({ waitUntil: 'networkidle' })
await page.locator('#recoverDraftBtn').click()
await page.locator('.layer-item').filter({ hasText: '胸' }).click()
const resetAfterReload = !(await page.locator('#boneDisplaySizeModeInput').isChecked())
if (!resetAfterReload) throw new Error('display-only mode did not reset after reload')
if (errors.length) throw new Error(`console errors: ${errors.join(' | ')}`)

console.log(JSON.stringify({ project: entry.name, openedMeta, widthBeforeDrag, widthAfterDrag, beforeRealResize, afterRealDrag, afterRealResize, beforeDisplayResize, afterDisplayResize, resetAfterReload, errors }, null, 2))
await browser.close()
