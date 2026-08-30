import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const rect = selector => page.locator(selector).first().evaluate(element => {
  const style = getComputedStyle(element)
  const box = element.getBoundingClientRect()
  return {
    inline: { left: element.style.left, top: element.style.top, width: element.style.width, height: element.style.height },
    box: { width: Math.round(box.width * 100) / 100, height: Math.round(box.height * 100) / 100 },
    transform: style.transform
  }
})

await page.goto('http://127.0.0.1:5173/area-exploration?area=middle_terminal_concourse', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'マップ作成' }).click()
const editor = page.getByRole('dialog', { name: '中層ターミナルコンコース' })
await editor.waitFor()
const editorData = {
  zoom: JSON.parse(await page.evaluate(() => window.render_game_to_text())).zoom,
  player: await rect('.test-player'),
  background: await rect('.canvas-background-image'),
  mapPart: await rect('.map-part-object'),
  canvas: await rect('.map-canvas')
}
await editor.getByRole('button', { name: '閉じる', exact: true }).click()
await page.getByRole('button', { name: 'マップを開く' }).click()
await page.waitForURL('**/area-map/middle_terminal_concourse')
const runtimeData = {
  zoom: JSON.parse(await page.evaluate(() => window.render_game_to_text())).mapZoom,
  player: await rect('.player'),
  background: await rect('.map-background-image'),
  mapPart: await rect('.map-part'),
  world: await rect('.map-world'),
  mapHeight: await page.evaluate(() => JSON.parse(window.render_game_to_text()).mapHeight ?? 720)
}
console.log(JSON.stringify({ editorData, runtimeData }, null, 2))
await browser.close()
