import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://192.168.0.209:5173/area-exploration?area=middle_public_ring')
await page.locator('.map-edit-button').click()
await page.locator('.workspace').waitFor()

const geometry = await page.evaluate(() => {
  const box = selector => {
    const rect = document.querySelector(selector).getBoundingClientRect()
    return { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }
  }
  return {
    layout: box('.layout-workspace'),
    canvas: box('.canvas-column'),
    tools: box('.tool-palette'),
    inspector: box('.inspector')
  }
})

const labelsBefore = await page.locator('.canvas-object span:visible, .locked-marker span:visible').count()
const routesBefore = await page.locator('.locked-marker:visible').count()
const snapBefore = await page.locator('.tool-toggle').getAttribute('aria-pressed')
await page.locator('.tool-toggle').click()
const snapAfter = await page.locator('.tool-toggle').getAttribute('aria-pressed')
await page.locator('.locked-marker.spawn').nth(1).hover()
await page.locator('.hover-card').waitFor()
const hoverText = await page.locator('.hover-card').innerText()
await page.screenshot({ path: 'output/web-game/map-layout-filters/desktop-hover.png', fullPage: true })

await page.locator('[data-view-filter="routes"]').click()
const routesAfter = await page.locator('.locked-marker:visible').count()
await page.locator('[data-view-filter="labels"]').click()
const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.screenshot({ path: 'output/web-game/map-layout-filters/desktop-filtered.png', fullPage: true })

console.log(JSON.stringify({
  geometry,
  labelsBefore,
  routesBefore,
  routesAfter,
  snapBefore,
  snapAfter,
  hoverText,
  viewFilters: state.viewFilters,
  errors
}, null, 2))

await browser.close()
