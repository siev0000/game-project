import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://192.168.0.209:5173/guest', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'メッセージテスト' }).click()
await page.getByRole('button', { name: 'ファイル・初期化メニュー' }).click()
const responsePromise = page.waitForResponse(response => response.url().includes('/api/local/dialogue-message-settings') && response.request().method() === 'PUT')
await page.getByRole('button', { name: 'JSONへ保存して反映' }).click()
const response = await responsePromise
if (!response.ok()) throw new Error(`設定JSONの保存に失敗しました: ${response.status()}`)
const payload = await response.json()
if (!payload.typeProfiles || !Object.keys(payload.typeProfiles).length) throw new Error('保存された設定JSONが不正です')
console.log(JSON.stringify({ errors, typeCount: Object.keys(payload.typeProfiles).length, savedVersion: payload.version }, null, 2))
await browser.close()
