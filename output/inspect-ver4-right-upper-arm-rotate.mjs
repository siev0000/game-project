import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.replaceCurrentProject === 'function')
await page.evaluate(async () => {
  const entry = await fetch('/api/local/bone-motion-projects?id=motion_20260816133413_r1zy').then(response => response.json())
  window.replaceCurrentProject(entry.project, null)
  document.querySelector('#projectLibraryDialog')?.close()
})
await page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: /^右上腕$/ }) }).click()
await page.locator('#rotateModeBtn').click()
const before = await page.evaluate(() => {
  const mesh = document.querySelector('.mesh-binding-canvas')
  const canvas = mesh?.getContext('2d')
  const pixels = canvas ? canvas.getImageData(0, 0, mesh.width, mesh.height).data : []
  let alpha = 0
  for (let i = 3; i < pixels.length; i += 4) alpha += pixels[i] > 0 ? 1 : 0
  return { r: document.querySelector('#rInput').value, meshAlpha: alpha, meshDisplay: getComputedStyle(mesh).display }
})
await page.locator('#rInput').fill('46')
await page.locator('#rInput').press('Tab')
await page.waitForTimeout(100)
const after = await page.evaluate(() => {
  const mesh = document.querySelector('.mesh-binding-canvas')
  const canvas = mesh?.getContext('2d')
  const pixels = canvas ? canvas.getImageData(0, 0, mesh.width, mesh.height).data : []
  let alpha = 0
  for (let i = 3; i < pixels.length; i += 4) alpha += pixels[i] > 0 ? 1 : 0
  return { r: document.querySelector('#rInput').value, meshAlpha: alpha, meshDisplay: getComputedStyle(mesh).display, selected: document.querySelector('#nameInput').value }
})
await page.screenshot({ path: 'output/inspect-ver4-right-upper-arm-rotate.png', fullPage: true })
console.log(JSON.stringify({ before, after, errors }, null, 2))
await browser.close()
