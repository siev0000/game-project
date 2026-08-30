import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://192.168.0.209:5173/character-library', { waitUntil: 'networkidle' })
await page.locator('.character-card').first().click()
await page.getByRole('button', { name: '状態別グラフィック' }).click()
await page.getByRole('button', { name: '移動' }).click()
const preview = page.locator('.preview-character')
const samples = []
for (let index = 0; index < 7; index += 1) {
  await page.waitForTimeout(28)
  samples.push(await preview.evaluate(node => getComputedStyle(node).backgroundPosition))
}
await page.waitForFunction(() => getComputedStyle(document.querySelector('.preview-character')).backgroundPosition === '100% 50%')
await page.screenshot({ path: 'output/character-preview-sprite.png', fullPage: false })
console.log(JSON.stringify({ samples, errors, state: await page.evaluate(() => window.render_game_to_text?.()) }))
await browser.close()
