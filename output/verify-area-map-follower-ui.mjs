import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://127.0.0.1:5175/area-map/middle_terminal_concourse', { waitUntil: 'networkidle' })
await page.locator('.follower-add-button').waitFor()

await page.locator('.follower-add-button').click()
const options = await page.locator('.follower-character-list button').count()
if (options < 2) throw new Error(`追加キャラ候補が不足しています: ${options}`)
await page.screenshot({ path: 'output/area-map-follower-picker.png' })
await page.locator('.follower-picker-panel header button').click()

for (let index = 0; index < 5; index += 1) {
  await page.locator('.follower-add-button').click()
  await page.locator('.follower-character-list button', { hasText: 'ver4' }).click()
}
await page.waitForFunction(() => [...document.querySelectorAll('.follower-bone-motion iframe')]
  .every(frame => typeof frame.contentWindow?.render_game_to_text === 'function'))
await page.keyboard.down('ArrowRight')
await page.waitForTimeout(2400)
await page.keyboard.up('ArrowRight')
await page.waitForTimeout(1100)

const beforeClear = await page.evaluate(() => {
  const state = JSON.parse(window.render_game_to_text()).followerLoadTest
  const toolbar = document.querySelector('.map-toolbar').getBoundingClientRect()
  const tools = document.querySelector('.follower-load-tools').getBoundingClientRect()
  const add = document.querySelector('.follower-add-button').getBoundingClientRect()
  const meter = document.querySelector('.load-meter').getBoundingClientRect()
  return { state, toolbar: { left: toolbar.left, right: toolbar.right, height: toolbar.height }, tools: { left: tools.left, right: tools.right }, add: { width: add.width }, meter: { width: meter.width }, text: document.querySelector('.load-meter').textContent }
})
if (beforeClear.state.count !== 5 || beforeClear.state.activeBonePlayers !== 6) throw new Error(`5体追加状態が不正です: ${JSON.stringify(beforeClear.state)}`)
if (beforeClear.toolbar.height > 120 || beforeClear.tools.left < beforeClear.toolbar.left || beforeClear.tools.right > beforeClear.toolbar.right + .5) throw new Error(`負荷UIがツールバーからはみ出しています: ${JSON.stringify(beforeClear)}`)
if (beforeClear.add.width < 18 || beforeClear.meter.width < 250) throw new Error(`負荷UIが潰れています: ${JSON.stringify(beforeClear)}`)
await page.screenshot({ path: 'output/area-map-followers-ui-5.png' })

await page.locator('.follower-clear-button').click()
await page.waitForTimeout(1800)
const afterClear = JSON.parse(await page.evaluate(() => window.render_game_to_text())).followerLoadTest
if (afterClear.count !== 0 || afterClear.activeBonePlayers !== 1) throw new Error(`全削除後が不正です: ${JSON.stringify(afterClear)}`)
if (errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({ options, beforeClear, afterClear, errors }, null, 2))
await browser.close()
