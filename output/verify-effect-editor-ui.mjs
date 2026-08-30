import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://127.0.0.1:4178/guest', { waitUntil: 'networkidle' })
await page.getByRole('tab', { name: 'ゲーム作成' }).click()
await page.getByRole('button', { name: '▶ 技エフェクト作成' }).click()
await page.locator('[data-testid="effect-preview"]').waitFor()
await page.waitForTimeout(300)

const origin = page.getByRole('button', { name: '発射点を移動' })
const before = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.getByRole('button', { name: 'キーフレーム追加' }).click()
await page.getByLabel('サイズ', { exact: true }).fill('20')
await page.getByLabel('回転', { exact: true }).fill('-30')
await page.getByLabel('透明度', { exact: true }).fill('0')
const firstKey = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.getByRole('button', { name: 'フレーム 4' }).click()
await page.getByRole('button', { name: 'キーフレーム追加' }).click()
await page.getByLabel('サイズ', { exact: true }).fill('80')
await page.getByLabel('回転', { exact: true }).fill('40')
await page.getByLabel('透明度', { exact: true }).fill('100')
const secondKey = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.getByRole('button', { name: 'フレーム 2' }).click()
const interpolated = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.getByRole('button', { name: 'フレーム 4' }).click()
await page.screenshot({ path: 'output/effect-motion-editor-ui.png', fullPage: true })
await page.getByRole('button', { name: 'フレーム 6' }).click()
await page.getByRole('button', { name: 'キーフレーム追加' }).click()
const beforeKeyDelete = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.getByRole('button', { name: 'キーフレーム削除' }).click()
const afterKeyDelete = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.getByRole('button', { name: '基本', exact: true }).click()
await page.getByLabel('基準サイズ', { exact: false }).waitFor()
await page.getByRole('button', { name: '動き', exact: true }).click()
await page.getByRole('button', { name: 'フレーム 4' }).click()
const box = await origin.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 35, { steps: 5 })
await page.mouse.up()
const dragged = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.getByRole('button', { name: '位置を初期化' }).click()
const reset = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const resetBox = await origin.boundingBox()
await page.mouse.move(resetBox.x + resetBox.width / 2, resetBox.y + resetBox.height / 2)
await page.mouse.down()
await page.mouse.move(resetBox.x + resetBox.width / 2 + 120, resetBox.y + resetBox.height / 2 + 35, { steps: 5 })
await page.mouse.up()
await page.getByRole('combobox', { name: '追加するテンプレート' }).selectOption('laser')
const selectedOnly = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.getByRole('button', { name: '選択したテンプレートを追加' }).click()
const added = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.getByRole('button', { name: '再生', exact: true }).click()
await page.waitForTimeout(250)
const after = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const metrics = await page.evaluate(() => {
  const preview = document.querySelector('[data-testid="effect-preview"]')?.getBoundingClientRect()
  const settings = document.querySelector('.settings-pane')?.getBoundingClientRect()
  const header = document.querySelector('.editor-header')?.getBoundingClientRect()
  const originHandle = document.querySelector('.point-handle.origin')
  const targetHandle = document.querySelector('.point-handle.target')
  const guide = document.querySelector('.path-guide')
  const resetButton = document.querySelector('.reset-points')
  return {
    preview: preview && { top: preview.top, bottom: preview.bottom, width: preview.width, height: preview.height },
    settings: settings && { top: settings.top, bottom: settings.bottom },
    headerBottom: header?.bottom,
    canvases: document.querySelectorAll('.stage canvas').length,
    pointText: [originHandle?.textContent, targetHandle?.textContent],
    pointSizes: [originHandle?.getBoundingClientRect().width, targetHandle?.getBoundingClientRect().width],
    pointFontSizes: [getComputedStyle(originHandle).fontSize, getComputedStyle(targetHandle).fontSize],
    resetButton: { width: resetButton?.getBoundingClientRect().width, height: resetButton?.getBoundingClientRect().height, fontSize: getComputedStyle(resetButton).fontSize },
    playingOpacity: [getComputedStyle(originHandle).opacity, getComputedStyle(targetHandle).opacity],
    guideOpacity: getComputedStyle(guide).opacity,
    guideHeight: getComputedStyle(guide).height,
    pointGroupBorders: [...document.querySelectorAll('.point-input')].map(item => getComputedStyle(item).borderTopWidth),
    templateNames: [...document.querySelectorAll('.template-select option')].map(item => item.textContent.trim()),
    templateControlWidth: document.querySelector('.template-add')?.getBoundingClientRect().width
  }
})
const expectedTemplateNames = ['explosion', 'laser', 'slash', 'thunderSlash']
if (JSON.stringify(metrics.templateNames) !== JSON.stringify(expectedTemplateNames)) {
  throw new Error(`template function list mismatch: ${JSON.stringify(metrics.templateNames)}`)
}
if (selectedOnly.layerCount !== 1 || added.layerCount !== 3 || added.selectedLayer !== 'beam') {
  throw new Error(`template add behavior mismatch: ${JSON.stringify({ selectedOnly, added })}`)
}
if (JSON.stringify(firstKey.keyframeFrames) !== JSON.stringify([0]) || JSON.stringify(secondKey.keyframeFrames) !== JSON.stringify([0, 4])) {
  throw new Error(`keyframe creation mismatch: ${JSON.stringify({ firstKey, secondKey })}`)
}
if (Math.abs(interpolated.resolvedMotion.size - 65) > 0.01 || Math.abs(interpolated.resolvedMotion.rotation - 22.5) > 0.01 || Math.abs(interpolated.resolvedMotion.alpha - 75) > 0.01) {
  throw new Error(`keyframe interpolation mismatch: ${JSON.stringify(interpolated.resolvedMotion)}`)
}
if (JSON.stringify(beforeKeyDelete.keyframeFrames) !== JSON.stringify([0, 4, 6]) || JSON.stringify(afterKeyDelete.keyframeFrames) !== JSON.stringify([0, 4])) {
  throw new Error(`keyframe delete mismatch: ${JSON.stringify({ beforeKeyDelete, afterKeyDelete })}`)
}
await page.screenshot({ path: 'output/effect-editor-ui.png', fullPage: true })
console.log(JSON.stringify({ before, firstKey, secondKey, interpolated, beforeKeyDelete, afterKeyDelete, dragged, reset, selectedOnly, added, after, metrics, errors }, null, 2))
await browser.close()
