import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://192.168.0.209:5173/character-library', { waitUntil: 'networkidle' })
await page.locator('.character-card').first().click()
await page.getByRole('button', { name: '状態別グラフィック' }).click()
await page.getByRole('button', { name: '画像一覧から選ぶ' }).click()
await page.locator('.asset-card').first().waitFor()
const assetCount = await page.locator('.asset-card').count()
await page.screenshot({ path: 'output/character-image-picker-open.png', fullPage: false })
await page.locator('.asset-card').first().click()
const selected = await page.locator('.selected-asset img').getAttribute('src')
await page.screenshot({ path: 'output/character-image-picker.png', fullPage: false })
console.log(JSON.stringify({ errors, assetCount, selected, state: await page.evaluate(() => window.render_game_to_text?.()) }))
await browser.close()
