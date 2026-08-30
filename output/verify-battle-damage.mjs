import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

console.log('launching')
const browser = await chromium.launch({ headless: true })
console.log('launched')
const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://127.0.0.1:5173/guest', { waitUntil: 'domcontentloaded', timeout: 10000 })
console.log('guest loaded')
await page.getByRole('button', { name: '▶ バトル情報', exact: true }).click()
console.log('battle opened')
await page.locator('.battle-root').waitFor({ state: 'attached', timeout: 5000 })
console.log('battle attached')

const enemy = page.locator('.enemy-card').first()
console.log('enemy count', await page.locator('.enemy-card').count())
await enemy.locator('img').click({ force: true, timeout: 5000 })
console.log('enemy selected')
// 既定威力40、1ヒット、ガード0のため、選択中の敵へ40ダメージになる。
await page.getByRole('button', { name: '攻撃を実行', exact: true }).click({ force: true, timeout: 5000 })
console.log('attack clicked')
const result = page.locator('.attack-result')
await result.waitFor()
const resultText = await result.textContent()
if (!resultText?.includes('に 40 ダメージ（HP ') || !resultText.includes('）')) {
  throw new Error(`攻撃結果が想定と異なります: ${resultText}`)
}
await page.screenshot({ path: 'output/battle-damage-result.png', fullPage: false })
if (errors.length) throw new Error(`console/page errors: ${errors.join('\n')}`)
console.log(`battle damage: OK (${resultText})`)
await browser.close()
