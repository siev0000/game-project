import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1040, height: 900 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://192.168.0.209:5173/dialogue-events', { waitUntil: 'networkidle' })
await page.locator('.event-card').first().click()
await page.getByRole('button', { name: '全体を再生' }).click()
await page.waitForTimeout(2200)
const beforeClick = JSON.parse(await page.evaluate(() => window.render_game_to_text?.()))
if (beforeClick.previewIndex !== 0) throw new Error(`操作なしで次の発言へ進みました: ${beforeClick.previewIndex}`)
await page.locator('.preview-overlay .dialogue-window').click()
await page.waitForTimeout(100)
const afterClick = JSON.parse(await page.evaluate(() => window.render_game_to_text?.()))
if (afterClick.previewIndex !== 1) throw new Error(`クリックで次の発言へ進みません: ${afterClick.previewIndex}`)
console.log(JSON.stringify({ errors, beforeClick, afterClick }, null, 2))
await browser.close()
