import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/area-map/middle_terminal_concourse', { waitUntil: 'networkidle' })
await page.locator('.map-bone-motion iframe').waitFor()
await page.waitForFunction(() => typeof window.render_game_to_text === 'function')
await page.waitForTimeout(350)

const read = () => {
  const player = document.querySelector('.player')
  const state = JSON.parse(window.render_game_to_text())
  return {
    facingDirection: state.facingDirection,
    moveDirection: state.moveDirection,
    leftClass: player.classList.contains('left'),
    transform: getComputedStyle(player).transform,
    x: state.player.x
  }
}

const initial = await page.evaluate(read)
await page.keyboard.down('ArrowLeft')
await page.waitForTimeout(260)
const movingLeft = await page.evaluate(read)
await page.keyboard.up('ArrowLeft')
await page.waitForTimeout(120)
const stoppedLeft = await page.evaluate(read)
await page.screenshot({ path: 'output/area-map-facing-left-stopped.png' })

await page.keyboard.down('ArrowRight')
await page.waitForTimeout(260)
const movingRight = await page.evaluate(read)
await page.keyboard.up('ArrowRight')
await page.waitForTimeout(120)
const stoppedRight = await page.evaluate(read)
await page.screenshot({ path: 'output/area-map-facing-right-stopped.png' })

if (movingLeft.facingDirection !== -1 || !movingLeft.leftClass || movingLeft.moveDirection !== -1) throw new Error(`左移動中の向きが反映されません: ${JSON.stringify(movingLeft)}`)
if (stoppedLeft.facingDirection !== -1 || !stoppedLeft.leftClass || stoppedLeft.moveDirection !== 0) throw new Error(`左停止後に向きが維持されません: ${JSON.stringify(stoppedLeft)}`)
if (movingRight.facingDirection !== 1 || movingRight.leftClass || movingRight.moveDirection !== 1) throw new Error(`右移動中の向きが反映されません: ${JSON.stringify(movingRight)}`)
if (stoppedRight.facingDirection !== 1 || stoppedRight.leftClass || stoppedRight.moveDirection !== 0) throw new Error(`右停止後に向きが維持されません: ${JSON.stringify(stoppedRight)}`)
if (errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({ initial, movingLeft, stoppedLeft, movingRight, stoppedRight, errors }))
await browser.close()
