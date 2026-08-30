import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const base = process.env.TEST_BASE || 'http://127.0.0.1:5175'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto(`${base}/area-exploration?area=middle_terminal_concourse`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'マップ作成' }).click()
const editor = page.getByRole('dialog', { name: '中層ターミナルコンコース' })
await editor.waitFor()
await editor.getByRole('button', { name: /背景・キャラ/ }).click()
await editor.getByRole('button', { name: '背景画像', exact: true }).click()
if (!await editor.locator('.dynamic-background-row').count()) await editor.getByRole('button', { name: '＋ 背景を追加' }).click()

const row = editor.locator('.dynamic-background-row').first()
await row.getByLabel('高さ', { exact: true }).fill('300')
await row.locator('.background-transform-fields select').selectOption('aboveGround')
let state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
let layer = state.backgroundImages[0]
if (layer.verticalAnchor !== 'aboveGround' || layer.resolvedY !== 270) throw new Error(`地面上接地が不正です: ${JSON.stringify(layer)}`)

await row.locator('.background-transform-fields select').selectOption('belowGround')
state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
layer = state.backgroundImages[0]
if (layer.verticalAnchor !== 'belowGround' || layer.resolvedY !== 570) throw new Error(`地面下開始が不正です: ${JSON.stringify(layer)}`)
const guideTop = await editor.locator('.background-ground-guide').evaluate(element => element.style.top)
if (guideTop !== '285px') throw new Error(`背景プレビューの地面ガイドが不正です: ${guideTop}`)

await editor.getByRole('button', { name: /配置編集/ }).click()
await editor.locator('.background-layout-palette button').first().click()
state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
if (state.selected.kind !== 'background') throw new Error(`配置画面で背景を選択できません: ${JSON.stringify(state.selected)}`)
const layoutBox = editor.locator('.background-layout-box')
const box = await layoutBox.boundingBox()
if (!box) throw new Error('配置画面に背景の移動枠が表示されません')
await page.mouse.move(box.x + 80, box.y + 50)
await page.mouse.down()
await page.mouse.move(box.x + 112, box.y + 66, { steps: 4 })
await page.mouse.up()
state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
layer = state.backgroundImages[0]
if (layer.verticalAnchor !== 'free' || layer.y === 570) throw new Error(`背景ドラッグで自由配置に切り替わりません: ${JSON.stringify(layer)}`)
await page.screenshot({ path: 'output/map-background-layout-adjust.png', fullPage: true })

const partObject = editor.locator('.map-part-object').first()
if (await partObject.count()) {
  await partObject.click()
  const renderLayerSelect = editor.locator('.inspector-scroll select').nth(1)
  await renderLayerSelect.selectOption('background')
  await editor.getByLabel('同レイヤー内の重なり順 Z', { exact: true }).fill('10')
  let z = await partObject.evaluate(element => Number(getComputedStyle(element).zIndex))
  const groundZ = await editor.locator('.canvas-ground').evaluate(element => Number(getComputedStyle(element).zIndex))
  if (!(z < groundZ)) throw new Error(`背景寄り部品が地面より手前です: part=${z} ground=${groundZ}`)

  await renderLayerSelect.selectOption('behindPlayer')
  z = await partObject.evaluate(element => Number(getComputedStyle(element).zIndex))
  const playerZ = await editor.locator('.test-player').evaluate(element => Number(getComputedStyle(element).zIndex))
  if (!(z > groundZ && z < playerZ)) throw new Error(`プレイヤー後方レイヤーが不正です: ground=${groundZ} part=${z} player=${playerZ}`)

  await renderLayerSelect.selectOption('frontPlayer')
  await editor.getByLabel('同レイヤー内の重なり順 Z', { exact: true }).fill('-10')
  z = await partObject.evaluate(element => Number(getComputedStyle(element).zIndex))
  if (!(z > playerZ)) throw new Error(`プレイヤー前方レイヤーが不正です: part=${z} player=${playerZ}`)
}

await page.screenshot({ path: 'output/map-ground-layering.png', fullPage: true })
if (errors.length) throw new Error(`ブラウザエラー: ${JSON.stringify(errors)}`)
console.log(JSON.stringify({ background: layer, groundGuideTop: guideTop, errors }, null, 2))
await browser.close()
