import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createPixelSideProjectBtn').click()

const leftArmItem = page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: /^左腕$/ }) })
await leftArmItem.click()
await page.locator('#moveModeBtn').click()
const before = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const geometry = await page.locator('#resizeBox').evaluate(element => {
  const rect = element.getBoundingClientRect()
  const point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  const hit = document.elementFromPoint(point.x, point.y)
  return { ...point, width: rect.width, height: rect.height, hitClass: hit?.className || '', hitId: hit?.id || '', pointerEvents: getComputedStyle(element).pointerEvents }
})

const positionBefore = { x: await page.locator('#xInput').inputValue(), y: await page.locator('#yInput').inputValue(), xDisabled: await page.locator('#xInput').isDisabled(), yDisabled: await page.locator('#yInput').isDisabled() }
await page.mouse.move(geometry.x, geometry.y)
await page.mouse.down()
await page.mouse.move(geometry.x + 32, geometry.y + 18, { steps: 4 })
await page.mouse.up()
const positionAfter = { x: await page.locator('#xInput').inputValue(), y: await page.locator('#yInput').inputValue() }
const after = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.screenshot({ path: 'output/bone-editor-selected-behind-drag.png', fullPage: true })

console.log(JSON.stringify({ before:before.selectedBone, after:after.selectedBone, geometry, positionBefore, positionAfter, errors }, null, 2))
await browser.close()
