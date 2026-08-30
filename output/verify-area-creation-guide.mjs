import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const errors = []
const recordErrors = page => {
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(String(error)))
}
const url = 'http://127.0.0.1:4178/area-exploration?area=middle_terminal_concourse'

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
recordErrors(page)
await page.goto(url, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '作成手順' }).click()
const guide = page.getByRole('dialog', { name: '横スクロールエリアの作成手順' })
await guide.waitFor()
const steps = guide.locator('.creation-steps > li')
const desktopMetrics = await guide.evaluate(element => ({
  leadFontSize: getComputedStyle(element.querySelector('.creation-guide-lead')).fontSize,
  stepFontSize: getComputedStyle(element.querySelector('.creation-steps li p > span')).fontSize,
  scrollable: element.querySelector('.creation-guide-body').scrollHeight >= element.querySelector('.creation-guide-body').clientHeight,
  dialogHeight: element.getBoundingClientRect().height
}))
if (await steps.count() !== 5) throw new Error('作成手順が5段階ではありません')
await guide.getByText('素材・部品を作成').waitFor()
await guide.getByRole('button', { name: '素材・部品を開く' }).waitFor()
if (desktopMetrics.leadFontSize !== '15px' || desktopMetrics.stepFontSize !== '15px') {
  throw new Error(`本文文字サイズが不正です: ${JSON.stringify(desktopMetrics)}`)
}
await page.screenshot({ path: 'output/area-creation-guide.png', fullPage: true })

await guide.getByRole('button', { name: 'エリア情報を開く' }).click()
let state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
if (!state.isEditorOpen || state.isCreationGuideOpen) throw new Error(`エリア情報への遷移が不正です: ${JSON.stringify(state)}`)
await page.getByRole('button', { name: '編集を閉じる' }).click()
await page.getByRole('button', { name: '作成手順' }).click()
await page.getByRole('dialog', { name: '横スクロールエリアの作成手順' }).getByRole('button', { name: 'マップ作成を開く' }).click()
state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
if (state.screen !== 'area-map-editor' || state.areaId !== 'middle_terminal_concourse') throw new Error(`マップ作成への遷移が不正です: ${JSON.stringify(state)}`)
await page.getByRole('button', { name: 'マップ編集を閉じる' }).click()

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
recordErrors(mobile)
await mobile.goto(url, { waitUntil: 'networkidle' })
await mobile.getByRole('button', { name: '作成手順' }).click()
const mobileGuide = mobile.getByRole('dialog', { name: '横スクロールエリアの作成手順' })
await mobileGuide.waitFor()
const mobileMetrics = await mobileGuide.evaluate(element => ({
  left: element.getBoundingClientRect().left,
  right: element.getBoundingClientRect().right,
  viewportWidth: innerWidth,
  bodyOverflowX: element.querySelector('.creation-guide-body').scrollWidth - element.querySelector('.creation-guide-body').clientWidth
}))
if (mobileMetrics.left < 0 || mobileMetrics.right > mobileMetrics.viewportWidth || mobileMetrics.bodyOverflowX > 1) {
  throw new Error(`モバイル表示が横にはみ出しています: ${JSON.stringify(mobileMetrics)}`)
}
await mobile.screenshot({ path: 'output/area-creation-guide-mobile.png', fullPage: true })

if (errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({ desktopMetrics, mobileMetrics, errors }, null, 2))
await browser.close()
