import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const base = process.env.TEST_BASE || 'http://127.0.0.1:5173'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
let savedArea = null
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.route('**/api/local/area-master', async route => {
  if (route.request().method() !== 'PUT') return route.continue()
  savedArea = route.request().postDataJSON().area
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ areas: [savedArea], districts: [] }) })
})

await page.goto(`${base}/area-exploration?area=middle_terminal_concourse`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'エリア情報' }).click()
const editor = page.getByRole('dialog', { name: '中層ターミナルコンコースの設定' })
await editor.waitFor()
await editor.getByRole('button', { name: 'JSONへ保存' }).click()
await editor.getByText('areaMaster.jsonへ保存しました').waitFor()
let state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
if (!savedArea || !state.isEditorOpen || !await editor.isVisible()) throw new Error(`保存後にエリア情報が閉じました: ${JSON.stringify({ savedArea: !!savedArea, state })}`)
await page.screenshot({ path: 'output/editor-save-stays-open.png', fullPage: true })
await editor.getByRole('button', { name: '閉じる', exact: true }).click()
state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
if (state.isEditorOpen || await editor.isVisible()) throw new Error(`閉じるボタンでエリア情報が閉じません: ${JSON.stringify(state)}`)
if (errors.length) throw new Error(`ブラウザエラー: ${JSON.stringify(errors)}`)
console.log(JSON.stringify({ savedAreaId: savedArea.id, stayedOpenAfterSave: true, closedOnlyByClose: true, errors }, null, 2))
await browser.close()
