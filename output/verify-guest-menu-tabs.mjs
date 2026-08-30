import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://192.168.0.209:5173/guest', { waitUntil: 'networkidle' })
const initialState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.getByRole('tab', { name: 'ゲーム作成' }).click()
const createState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const boneButton = page.getByRole('button', { name: '▶ 2Dボーン・モーション作成' })
const createItems = await page.locator('#guest-create-panel button').allTextContents()
await page.screenshot({ path: 'output/guest-menu-create-tab.png' })
await boneButton.click()
await page.waitForLoadState('networkidle')
const destination = {
  path: new URL(page.url()).pathname,
  title: await page.title(),
  editor: await page.locator('.app-shell').count()
}
console.log(JSON.stringify({ initialState, createState, createItems, destination, errors }, null, 2))
await browser.close()
