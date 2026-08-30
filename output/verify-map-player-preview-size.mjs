import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const base = process.env.TEST_BASE || 'http://127.0.0.1:4178'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

const embeddedState = async selector => page.locator(selector).evaluate(element => {
  const frame = element.querySelector('iframe')
  const doc = frame?.contentDocument
  const characterRect = doc?.querySelector('#character')?.getBoundingClientRect()
  const rootRect = element.getBoundingClientRect()
  return {
    rootOffsetWidth: element.offsetWidth,
    rootOffsetHeight: element.offsetHeight,
    rootScreenWidth: rootRect.width,
    rootScreenHeight: rootRect.height,
    iframeWidth: frame?.clientWidth,
    iframeHeight: frame?.clientHeight,
    previewMode: doc?.documentElement.classList.contains('preview-mode'),
    topbarDisplay: doc?.querySelector('.topbar') ? getComputedStyle(doc.querySelector('.topbar')).display : null,
    characterRect: characterRect ? { x: characterRect.x, y: characterRect.y, width: characterRect.width, height: characterRect.height } : null
  }
})

await page.goto(`${base}/area-exploration?area=middle_terminal_concourse`, { waitUntil: 'networkidle' })
await page.locator('.map-edit-button').click()
await page.locator('.test-player .bone-motion-player.ready').waitFor()
const editorGameState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const editor = await embeddedState('.test-player .bone-motion-player')
await page.screenshot({ path: 'output/map-player-preview-fixed.png', fullPage: true })

await page.getByRole('button', { name: 'マップ編集を閉じる' }).click()
await page.locator('.map-button').click()
await page.waitForURL('**/area-map/middle_terminal_concourse')
await page.locator('.player .bone-motion-player.ready').waitFor()
await page.waitForTimeout(500)
const runtimeGameState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const runtime = await embeddedState('.player .bone-motion-player')
await page.screenshot({ path: 'output/map-player-runtime-fixed.png', fullPage: true })

const expectedWidth = runtimeGameState.playerPresentation.displayWidth
const expectedHeight = runtimeGameState.playerPresentation.displayHeight
if (editorGameState.testPlayer.displayWidth !== expectedWidth || editorGameState.testPlayer.displayHeight !== expectedHeight) {
  throw new Error(`設定画面と実マップのキャラクター設定値が不一致です: ${JSON.stringify({ editor: editorGameState.testPlayer, runtime: runtimeGameState.playerPresentation })}`)
}
for (const [name, value] of Object.entries({ editor, runtime })) {
  if (value.rootOffsetWidth !== expectedWidth || value.rootOffsetHeight !== expectedHeight
    || value.iframeWidth !== expectedWidth || value.iframeHeight !== expectedHeight
    || !value.previewMode || value.topbarDisplay !== 'none' || !value.characterRect) {
    throw new Error(`${name}のボーン描画領域が不正です: ${JSON.stringify(value)}`)
  }
}
if (Math.abs(editor.characterRect.width - runtime.characterRect.width) > .5
  || Math.abs(editor.characterRect.height - runtime.characterRect.height) > .5) {
  throw new Error(`内部キャラクター描画サイズが不一致です: ${JSON.stringify({ editor: editor.characterRect, runtime: runtime.characterRect })}`)
}
if (Math.abs(editor.rootScreenWidth - expectedWidth * editorGameState.zoom) > .1
  || Math.abs(editor.rootScreenHeight - expectedHeight * editorGameState.zoom) > .1
  || Math.abs(runtime.rootScreenWidth / runtime.rootOffsetWidth - runtime.rootScreenHeight / runtime.rootOffsetHeight) > .001) {
  throw new Error(`画面倍率を含む外枠サイズが不正です: ${JSON.stringify({ editor, runtime })}`)
}
if (errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)

console.log(JSON.stringify({ expected: { width: expectedWidth, height: expectedHeight }, editor, runtime, errors }, null, 2))
await browser.close()
