import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const consoleErrors = []
const pageErrors = []
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
page.on('pageerror', error => pageErrors.push(error.message))
await page.addInitScript(() => {
  const originalSetItem = Storage.prototype.setItem
  Storage.prototype.setItem = function patchedSetItem(key, value) {
    if (key === 'bone_editor_compact_single_v34') {
      throw new DOMException('Forced quota test', 'QuotaExceededError')
    }
    return originalSetItem.call(this, key, value)
  }
})

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('.project-card-main').filter({ hasText: 'pixel_side_motion' }).click()
await page.waitForTimeout(300)

const openedState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: /^右上腕$/ }) }).click()
await page.locator('#moveModeBtn').click()
const before = { x: Number(await page.locator('#xInput').inputValue()), y: Number(await page.locator('#yInput').inputValue()) }
const box = await page.locator('#resizeBox').boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await page.mouse.move(box.x + box.width / 2 + 34, box.y + box.height / 2 + 20, { steps: 5 })
await page.mouse.up()
const after = { x: Number(await page.locator('#xInput').inputValue()), y: Number(await page.locator('#yInput').inputValue()) }
const movedState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))

if (!openedState.draftBackup?.blocked) throw new Error('容量超過後も自動バックアップ停止状態になっていません')
if (after.x === before.x && after.y === before.y) throw new Error('容量超過後に移動モードでボーンを動かせません')
if (consoleErrors.length || pageErrors.length) throw new Error(`runtime errors: ${[...consoleErrors, ...pageErrors].join(' | ')}`)

await page.screenshot({ path: 'output/bone-editor-quota-and-move.png', fullPage: true })
console.log(JSON.stringify({ openedProject: openedState.project.name, draftBackup: openedState.draftBackup, before, after, editMode: movedState.editMode, consoleErrors, pageErrors }, null, 2))
await browser.close()
