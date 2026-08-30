import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://127.0.0.1:5173/character-library', { waitUntil: 'networkidle' })
await page.locator('.character-card').first().click()
await page.getByRole('button', { name: '状態別グラフィック' }).click()
await page.getByRole('button', { name: '移動' }).click()
await page.getByLabel('横列数').fill('4')
await page.getByLabel('縦行数').fill('2')
await page.getByLabel('fps').fill('1')
const cards = page.locator('.frame-order-card')
if (await cards.count() !== 8) throw new Error(`カード数が不正です: ${await cards.count()}`)
await cards.nth(0).dragTo(cards.nth(3))
await page.waitForTimeout(150)

const preview = page.locator('.preview-character')
const samples = []
for (let index = 0; index < 8; index += 1) {
  samples.push({
    state: JSON.parse(await page.evaluate(() => window.render_game_to_text())),
    position: await preview.evaluate(node => getComputedStyle(node).backgroundPosition)
  })
  await page.evaluate(() => window.advanceTime(1000))
}

const expectedFrames = [2, 3, 4, 1, 5, 6, 7, 8]
const expectedPositions = ['33.3333% 0%', '66.6667% 0%', '100% 0%', '0% 0%', '0% 100%', '33.3333% 100%', '66.6667% 100%', '100% 100%']
for (let index = 0; index < expectedFrames.length; index += 1) {
  if (samples[index].state.sourceFrame !== expectedFrames[index]) throw new Error(`元コマ${index + 1}が不正です: ${JSON.stringify(samples[index].state)}`)
  const actual = samples[index].position.split(' ').map(Number)
  const expected = expectedPositions[index].split(' ').map(Number)
  if (Math.abs(actual[0] - expected[0]) > .02 || Math.abs(actual[1] - expected[1]) > .02) throw new Error(`表示位置${index + 1}が不正です: ${samples[index].position}`)
}
if (JSON.stringify(samples[0].state.frameOrder) !== JSON.stringify(expectedFrames)) throw new Error(`再生順が不正です: ${JSON.stringify(samples[0].state.frameOrder)}`)
await page.getByRole('button', { name: '通常順に戻す' }).click()
const resetState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
if (JSON.stringify(resetState.frameOrder) !== JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8])) throw new Error(`通常順への復元が不正です: ${JSON.stringify(resetState.frameOrder)}`)
const titleLayout = await page.locator('.setting-title-row').evaluate(node => {
  const heading = node.querySelector('h3').getBoundingClientRect()
  const button = node.querySelector('button').getBoundingClientRect()
  return { headingWidth: heading.width, headingHeight: heading.height, buttonWidth: button.width }
})
if (titleLayout.headingHeight > 24 || titleLayout.buttonWidth > 180) throw new Error(`見出しレイアウトが不正です: ${JSON.stringify(titleLayout)}`)
if (errors.length) throw new Error(`ブラウザエラー: ${JSON.stringify(errors)}`)

await page.screenshot({ path: 'output/character-frame-order.png', fullPage: false })
console.log(JSON.stringify({ frameOrder: samples[0].state.frameOrder, sourceFrames: samples.map(sample => sample.state.sourceFrame), positions: samples.map(sample => sample.position), resetOrder: resetState.frameOrder, titleLayout, errors }, null, 2))
await browser.close()
