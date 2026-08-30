import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/area-map/middle_terminal_concourse', { waitUntil: 'networkidle' })
await page.locator('.map-bone-motion iframe').waitFor()
await page.waitForFunction(() => typeof document.querySelector('.map-bone-motion iframe')?.contentWindow?.render_game_to_text === 'function')
await page.waitForTimeout(500)
const layout = await page.evaluate(() => {
  const player = document.querySelector('.player')
  const frame = document.querySelector('.map-bone-motion iframe')
  const doc = frame.contentDocument
  const stage = doc.querySelector('.stage')
  const elements = [...doc.querySelectorAll('.layer')].filter(node => getComputedStyle(node).display !== 'none')
  const childWindow = frame.contentWindow
  const world = childWindow.getWorldState(childWindow.currentFrameData())
  const rect = node => {
    const box = node.getBoundingClientRect()
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height }
  }
  return {
    player: rect(player),
    frame: rect(frame),
    stage: rect(stage),
    layers: elements.map(node => ({ id: node.dataset.id, rect: rect(node), image: rect(node.querySelector('.image-transform')) })),
    worldBounds: elements.reduce((bounds, node) => {
      const state = world[node.dataset.id]
      if (!state) return bounds
      bounds.minX = Math.min(bounds.minX, state.left)
      bounds.minY = Math.min(bounds.minY, state.top)
      bounds.maxX = Math.max(bounds.maxX, state.left + state.pose.w)
      bounds.maxY = Math.max(bounds.maxY, state.top + state.pose.h)
      return bounds
    }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }),
    state: JSON.parse(window.render_game_to_text()),
    iframeFunctions: { getWorldState: typeof frame.contentWindow.getWorldState, currentFrameData: typeof frame.contentWindow.currentFrameData }
  }
})
await page.screenshot({ path: 'output/area-map-motion-layout-before.png' })
await page.keyboard.down('ArrowRight')
await page.waitForTimeout(700)
const walking = await page.evaluate(() => {
  const frame = document.querySelector('.map-bone-motion iframe')
  const stage = frame.contentDocument.querySelector('.stage').getBoundingClientRect()
  const visible = [...frame.contentDocument.querySelectorAll('.layer')].filter(node => getComputedStyle(node).display !== 'none').map(node => node.getBoundingClientRect())
  return {
    animation: document.querySelector('.player').dataset.animation,
    stage: { width: stage.width, height: stage.height },
    bounds: {
      left: Math.min(...visible.map(rect => rect.left)),
      top: Math.min(...visible.map(rect => rect.top)),
      right: Math.max(...visible.map(rect => rect.right)),
      bottom: Math.max(...visible.map(rect => rect.bottom))
    },
    motion: JSON.parse(frame.contentWindow.render_game_to_text()).project
  }
})
await page.screenshot({ path: 'output/area-map-motion-layout-walk.png' })
await page.keyboard.up('ArrowRight')
if (walking.animation !== 'walk' || walking.motion.editing !== '走る') throw new Error(`走行モーションへ切り替わっていません: ${JSON.stringify(walking)}`)
if (walking.bounds.left < 0 || walking.bounds.top < 0 || walking.bounds.right > walking.stage.width || walking.bounds.bottom > walking.stage.height) throw new Error(`走行モーションが表示枠から見切れています: ${JSON.stringify(walking)}`)
if (walking.stage.height - walking.bounds.bottom > 6) throw new Error(`走行モーションの足元が地面基準から浮いています: ${JSON.stringify(walking)}`)
if (errors.length) throw new Error(`console errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({ layout, walking, errors }))
await browser.close()
