import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://192.168.0.209:5173/area-exploration?area=middle_public_ring', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'マップ編集' }).click()
const playerSelect = page.getByLabel('使用するプレイヤー').first()
await playerSelect.waitFor()
const options = await playerSelect.locator('option').allTextContents()
await playerSelect.selectOption('player_2')
const state = await page.evaluate(() => window.render_game_to_text?.())
await page.screenshot({ path: 'output/map-player-character-select.png', fullPage: false })
console.log(JSON.stringify({ options, state, errors }))
await browser.close()
