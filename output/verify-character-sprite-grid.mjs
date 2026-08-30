import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://192.168.0.209:5173/character-library', { waitUntil: 'networkidle' })
await page.locator('.character-card').first().click()
await page.getByRole('button', { name: '状態別グラフィック' }).click()
await page.getByRole('button', { name: '移動' }).click()
await page.getByLabel('横列数').fill('4')
await page.getByLabel('縦行数').fill('2')
await page.getByLabel('fps').fill('1')

const preview = page.locator('.preview-character')
const samples = []
for (let index = 0; index < 8; index += 1) {
  if (index) await page.evaluate(() => window.advanceTime(1000))
  samples.push(await preview.evaluate(node => ({
    position: getComputedStyle(node).backgroundPosition,
    size: getComputedStyle(node).backgroundSize
  })))
}
const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const expectedPositions = ['0% 0%', '33.3333% 0%', '66.6667% 0%', '100% 0%', '0% 100%', '33.3333% 100%', '66.6667% 100%', '100% 100%']
if (state.animationGrid.columns !== 4 || state.animationGrid.rows !== 2 || state.animationGrid.frames !== 8) throw new Error(`グリッド状態が不正です: ${JSON.stringify(state.animationGrid)}`)
if (samples.some(sample => sample.size !== '400% 200%')) throw new Error(`背景サイズが不正です: ${JSON.stringify(samples)}`)
for (let index = 0; index < expectedPositions.length; index += 1) {
  const actual = samples[index].position.split(' ').map(Number)
  const expected = expectedPositions[index].split(' ').map(Number)
  if (Math.abs(actual[0] - expected[0]) > .02 || Math.abs(actual[1] - expected[1]) > .02) throw new Error(`フレーム${index + 1}の位置が不正です: ${samples[index].position}`)
}
if (errors.length) throw new Error(`ブラウザエラー: ${JSON.stringify(errors)}`)

await page.screenshot({ path: 'output/character-sprite-grid-2x4.png', fullPage: false })
console.log(JSON.stringify({ state, samples, errors }, null, 2))
await browser.close()
