import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 820, height: 1260 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://192.168.0.209:5173/character-library', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'output/character-library-tall-grid-fix.png', fullPage: false })
console.log(JSON.stringify({ errors, state: await page.evaluate(() => window.render_game_to_text?.()) }))
await browser.close()
