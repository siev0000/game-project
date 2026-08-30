import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://127.0.0.1:5173/area-map/middle_terminal_concourse', { waitUntil: 'networkidle' })
const zoomSelector = page.locator('[aria-label="マップ表示倍率"]')
const measurements = {}
for (const value of ['1', '1.5']) {
  await zoomSelector.selectOption(value)
  await page.waitForTimeout(100)
  measurements[value] = await page.evaluate(() => {
    const rect = selector => {
      const element = document.querySelector(selector)
      if (!element) return null
      const { width, height } = element.getBoundingClientRect()
      return { width: Math.round(width * 100) / 100, height: Math.round(height * 100) / 100 }
    }
    return {
      state: JSON.parse(window.render_game_to_text()),
      player: rect('.player'),
      background: rect('.map-background-image'),
      ground: rect('.ground'),
      mapPart: rect('.map-part'),
      world: rect('.map-world')
    }
  })
}
await page.screenshot({ path: 'output/area-map-zoom-150-uniform.png' })
const ratio = (key, dimension) => Math.round(measurements['1.5'][key][dimension] / measurements['1'][key][dimension] * 100) / 100
const expectedKeys = ['player', 'background', 'ground', 'mapPart']
const ratios = Object.fromEntries(expectedKeys.map(key => [key, {
  width: ratio(key, 'width'), height: ratio(key, 'height')
}]))
const uniform = expectedKeys.every(key => ratios[key].width === 1.5 && ratios[key].height === 1.5)
console.log(JSON.stringify({ measurements, ratios, uniform, errors }, null, 2))
await browser.close()
