import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://192.168.0.209:5173/dialogue-events', { waitUntil: 'networkidle' })
const cards = await page.locator('.event-card').count()
if (cards !== 10) throw new Error(`イベント件数が一致しません: ${cards}`)
if (!await page.getByText('プロローグ07：第四世代との初対面', { exact: true }).isVisible()) throw new Error('第四世代イベントが一覧にありません')
await page.getByText('プロローグ07：第四世代との初対面', { exact: true }).click()
const lines = await page.locator('.sequence-card').count()
if (lines !== 11) throw new Error(`第四世代イベントの発言数が一致しません: ${lines}`)
await page.getByRole('button', { name: '全体を再生' }).click()
await page.waitForTimeout(250)
if (!await page.locator('.preview-overlay').isVisible()) throw new Error('会話プレビューが開きません')
await page.screenshot({ path: 'output/prologue-dialogue-events-1280x900.png', fullPage: false })
console.log(JSON.stringify({ errors, cards, lines, state: await page.evaluate(() => window.render_game_to_text?.()) }, null, 2))
await browser.close()
