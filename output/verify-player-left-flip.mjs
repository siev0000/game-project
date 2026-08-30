import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://192.168.0.209:5173/area-map/middle_public_ring', { waitUntil: 'networkidle' })
await page.keyboard.down('a')
await page.waitForTimeout(120)
const left = await page.locator('.player').evaluate(element => ({
  className: element.className,
  transform: getComputedStyle(element).transform,
  width: element.getBoundingClientRect().width,
  left: element.getBoundingClientRect().left
}))
await page.screenshot({ path: 'output/player-left-flip.png', fullPage: false })
await page.keyboard.up('a')
console.log(JSON.stringify({ left, errors }))
await browser.close()
