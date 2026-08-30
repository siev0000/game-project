import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://192.168.0.209:5173/area-map/middle_public_ring', { waitUntil: 'networkidle' })
const player = page.locator('.player')
const sprite = page.locator('.player-body')
await player.waitFor()
await page.keyboard.down('ArrowRight')
const samples = []
for (let index = 0; index < 7; index += 1) {
  await page.waitForTimeout(28)
  samples.push(await sprite.evaluate(node => ({
    position: getComputedStyle(node).backgroundPosition,
    spriteEnd: getComputedStyle(node).getPropertyValue('--sprite-end'),
    currentTime: node.getAnimations()[0]?.currentTime ?? null
  })))
}
const first = await sprite.evaluate(node => ({
  animation: getComputedStyle(node).animation,
  backgroundPosition: getComputedStyle(node).backgroundPosition,
  source: getComputedStyle(node).backgroundImage,
  state: node.closest('.player')?.dataset.animation
}))
const second = await sprite.evaluate(node => ({
  backgroundPosition: getComputedStyle(node).backgroundPosition,
  state: node.closest('.player')?.dataset.animation
}))
await page.waitForFunction(() => getComputedStyle(document.querySelector('.player-body')).backgroundPosition === '100% 50%')
await page.screenshot({ path: 'output/player-sprite-walk.png', fullPage: false })
await page.keyboard.up('ArrowRight')
console.log(JSON.stringify({ first, second, samples, errors, runtime: await page.evaluate(() => window.render_game_to_text?.()) }))
await browser.close()
