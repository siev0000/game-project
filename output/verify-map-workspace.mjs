import fs from 'node:fs'
import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const outputDir = 'output/web-game/map-workspace-final'
fs.mkdirSync(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
})
page.on('pageerror', error => errors.push(`page: ${error.message}`))

const openEditor = async areaId => {
  await page.goto(`http://192.168.0.209:5173/area-exploration?area=${areaId}`, { waitUntil: 'domcontentloaded' })
  await page.click('.map-edit-button')
  await page.waitForSelector('.map-canvas')
}

await openEditor('exterior_forest')
const npc = page.locator('.placement-object.type-npc').first()
const before = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const box = await npc.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await page.mouse.move(box.x + box.width / 2 + 96, box.y + box.height / 2 - 32, { steps: 6 })
await page.mouse.up()
const after = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
await page.screenshot({ path: `${outputDir}/01-layout-drag.png`, fullPage: true })

await openEditor('middle_public_ring')
await page.click('[data-editor-tab="connections"]')
await page.screenshot({ path: `${outputDir}/02-connections.png`, fullPage: true })
const connectionState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))

await page.click('[data-editor-tab="simulation"]')
await page.screenshot({ path: `${outputDir}/03-simulation.png`, fullPage: true })
await page.click('[data-editor-tab="assets"]')
await page.screenshot({ path: `${outputDir}/04-assets.png`, fullPage: true })

await openEditor('exterior_forest')
const stateSaveResponse = page.waitForResponse(response => response.url().includes('/api/local/area-state') && response.request().method() === 'PUT')
await page.click('[data-editor-tab="simulation"]')
await page.getByRole('button', { name: '状態テストの初期値を保存' }).click()
const stateResponse = await stateSaveResponse
await openEditor('exterior_forest')
const mapSaveResponse = page.waitForResponse(response => response.url().includes('/api/local/area-map-draft') && response.request().method() === 'PUT')
await page.getByRole('button', { name: 'マップをJSONへ保存' }).click()
const mapResponse = await mapSaveResponse

const report = {
  drag: {
    before: before.placements.find(item => item.type === 'npc'),
    after: after.placements.find(item => item.type === 'npc'),
    selected: after.selected
  },
  connectionsTab: connectionState.activeTab,
  mapSaveStatus: mapResponse.status(),
  stateSaveStatus: stateResponse.status(),
  errors
}
fs.writeFileSync(`${outputDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`)
await browser.close()
console.log(JSON.stringify(report, null, 2))
