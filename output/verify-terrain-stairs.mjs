import fs from 'node:fs'
import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const outputDir = 'output/web-game/terrain-stairs'
fs.mkdirSync(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
page.on('pageerror', error => errors.push(error.message))

let originalMap = null
try {
  await page.goto('http://192.168.0.209:5173/area-exploration?area=exterior_grassland')
  await page.locator('.map-edit-button').click()
  await page.getByRole('button', { name: '＋ 階段' }).click()
  const editorState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
  await page.screenshot({ path: `${outputDir}/01-editor-stairs.png`, fullPage: true })

  const drafts = await page.evaluate(async () => (await fetch('/api/local/area-map-draft')).json())
  originalMap = drafts.maps.exterior_grassland
  const testMap = JSON.parse(JSON.stringify(originalMap))
  testMap.terrainSegments = [
    ...(testMap.terrainSegments ?? []),
    {
      id: 'verification_stairs',
      type: 'stairs',
      x: 180,
      y: 390,
      width: 620,
      startY: 570,
      endY: 390,
      steps: 10,
      assetId: 'tile_grassland_ground_fill_01',
      imageSource: '',
      imageMode: 'repeat'
    }
  ]
  if (testMap.tileLayers?.[0]?.tiles?.[0]) {
    testMap.tileLayers[0].tiles[0].imageSource = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%2374b85a%22/%3E%3C/svg%3E'
    testMap.tileLayers[0].tiles[0].imageMode = 'cover'
  }
  const saveStatus = await page.evaluate(async mapDraft => {
    const response = await fetch('/api/local/area-map-draft', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areaId: 'exterior_grassland', mapDraft })
    })
    return response.status
  }, testMap)

  await page.goto('http://192.168.0.209:5173/area-map/exterior_grassland')
  await page.locator('.player').waitFor()
  const before = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
  await page.keyboard.down('ArrowRight')
  await page.evaluate(() => window.advanceTime(1300))
  await page.keyboard.up('ArrowRight')
  const after = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
  const stairsStyle = await page.locator('.terrain-segment-stairs').first().evaluate(element => ({
    clipPath: getComputedStyle(element).clipPath,
    width: getComputedStyle(element).width,
    height: getComputedStyle(element).height
  }))
  const tileBackgroundImage = await page.locator('.map-tile').first().evaluate(element => getComputedStyle(element).backgroundImage)
  await page.screenshot({ path: `${outputDir}/02-runtime-stairs.png`, fullPage: true })

  const report = {
    editorTerrain: editorState.terrainSegments.at(-1),
    saveStatus,
    movement: { before: before.player, after: after.player },
    stairsStyle,
    tileBackgroundImage,
    errors
  }
  fs.writeFileSync(`${outputDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  if (originalMap) {
    await page.evaluate(async mapDraft => {
      await fetch('/api/local/area-map-draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaId: 'exterior_grassland', mapDraft })
      })
    }, originalMap)
  }
  await browser.close()
}
