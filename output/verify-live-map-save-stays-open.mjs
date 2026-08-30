import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/area-exploration?area=middle_terminal_concourse', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'マップ作成' }).click()
const editor = page.getByRole('dialog', { name: '中層ターミナルコンコース' })
await editor.waitFor()
await editor.getByRole('button', { name: 'マップをJSONへ保存' }).click()
await editor.getByText('areaMapDrafts.jsonへ保存しました').waitFor({ timeout: 10000 })
if (!await editor.isVisible()) throw new Error('実ファイル保存後にマップ編集画面が閉じました')
await page.screenshot({ path: 'output/live-map-save-stays-open.png', fullPage: true })
console.log(JSON.stringify({ editorOpen: await editor.isVisible(), errors }, null, 2))
await browser.close()
