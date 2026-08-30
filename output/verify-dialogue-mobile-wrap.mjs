import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://192.168.0.209:5173/dialogue-events', { waitUntil: 'networkidle' })
await page.locator('.event-card').first().click()
await page.locator('.sequence-card').first().click()
await page.locator('.message-section textarea').fill('共同管理から配備更新が届いています。今後、高危険度任務における戦闘工程は、第四世代機へ段階的に移管されます。主人公機の性能は現在も基準値を上回っています。')
await page.getByRole('button', { name: 'この発言を確認' }).click()
await page.waitForTimeout(2200)
const result = await page.evaluate(() => {
  const modal = document.querySelector('.preview-overlay .dialogue-modal')
  const body = document.querySelector('.preview-overlay .dialogue-body')
  const content = document.querySelector('.preview-overlay .dialogue-content')
  return {
    viewportWidth: window.innerWidth,
    modalWidth: Math.round(modal?.getBoundingClientRect().width || 0),
    lineCount: document.querySelectorAll('.preview-overlay .dialogue-line').length,
    bodyHeight: Math.ceil(body?.scrollHeight || 0),
    contentHeight: Math.ceil(content?.clientHeight || 0),
    hasNext: Boolean(document.querySelector('.preview-overlay .dialogue-wait'))
  }
})
if (result.modalWidth < 340) throw new Error(`スマホ用の会話幅が狭すぎます: ${result.modalWidth}`)
if (result.lineCount > 4 || result.bodyHeight > result.contentHeight - 20) throw new Error(`長文が表示領域を超えています: ${JSON.stringify(result)}`)
if (!result.hasNext) throw new Error('次ページマーカーが表示されていません')
await page.screenshot({ path: 'output/dialogue-mobile-wrap-390x844.png', fullPage: false })
console.log(JSON.stringify({ errors, result, state: await page.evaluate(() => window.render_game_to_text?.()) }, null, 2))
await browser.close()
