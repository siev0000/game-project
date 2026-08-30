import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1040, height: 1051 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://192.168.0.209:5173/dialogue-events', { waitUntil: 'networkidle' })
await page.locator('.event-card').first().click()
await page.locator('.sequence-card').first().click()
const before = JSON.parse(await page.evaluate(() => window.render_game_to_text?.()))
await page.getByRole('button', { name: 'この発言を確認' }).click()
await page.waitForTimeout(200)
const during = JSON.parse(await page.evaluate(() => window.render_game_to_text?.()))
const renderedSource = await page.locator('.preview-overlay .dialogue-portrait img').getAttribute('src')

if (during.previewFaceSource !== before.selectedFaceSource) {
  throw new Error(`編集プレビューと再生プレビューの表情画像が一致しません: ${before.selectedFaceSource} / ${during.previewFaceSource}`)
}
if (renderedSource !== during.previewFaceSource) {
  throw new Error(`再生DOMの画像が設定値と一致しません: ${renderedSource} / ${during.previewFaceSource}`)
}
await page.screenshot({ path: 'output/dialogue-preview-expression-bridge-1040x1051.png', fullPage: false })
console.log(JSON.stringify({ errors, before, during, renderedSource }, null, 2))
await browser.close()
