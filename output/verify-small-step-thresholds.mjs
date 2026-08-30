import fs from 'node:fs'
import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const outputDir = 'output/web-game/small-step-thresholds'
fs.mkdirSync(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
page.on('pageerror', error => errors.push(error.message))

const putMap = mapDraft => page.evaluate(async draft => {
  const response = await fetch('/api/local/area-map-draft', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ areaId: 'exterior_grassland', mapDraft: draft })
  })
  return response.status
}, mapDraft)
const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()))
const moveRight = async milliseconds => {
  await page.keyboard.down('ArrowRight')
  await page.evaluate(ms => window.advanceTime(ms), milliseconds)
  await page.keyboard.up('ArrowRight')
  return state()
}
const flat = (id, x, width, y) => ({
  id, type: 'flat', x, y, width, startY: y, endY: y,
  baseY: y, rise: 0, direction: 'right', steps: 8,
  autoWidth: false, grade: 3, assetId: 'tile_grassland_ground_fill_01',
  imageSource: '', imageMode: 'repeat'
})

let originalMap = null
try {
  await page.goto('http://192.168.0.209:5173/area-exploration?area=exterior_grassland')
  await page.locator('.map-edit-button').click()
  await page.locator('[data-editor-tab="settings"]').click()
  const editorThresholds = {
    maxStepUp: await page.getByLabel('自動で上れる段差').inputValue(),
    maxStepDown: await page.getByLabel('自動で下りる段差').inputValue()
  }
  await page.screenshot({ path: `${outputDir}/00-editor-threshold-settings.png`, fullPage: true })
  await page.goto('http://192.168.0.209:5173/area-map/exterior_grassland')
  const drafts = await page.evaluate(async () => (await fetch('/api/local/area-map-draft')).json())
  originalMap = drafts.maps.exterior_grassland

  const smallStepMap = JSON.parse(JSON.stringify(originalMap))
  smallStepMap.playerPresentation = {
    ...smallStepMap.playerPresentation,
    maxStepUp: 48,
    maxStepDown: 72
  }
  smallStepMap.terrainSegments = [flat('small_step_40', 300, 220, 530)]
  smallStepMap.verticalTransports = []
  const smallSaveStatus = await putMap(smallStepMap)
  await page.reload()
  await page.locator('.player').waitFor()
  const smallBefore = await state()
  const onSmallStep = await moveRight(500)
  const afterSmallStep = await moveRight(800)
  await page.screenshot({ path: `${outputDir}/01-small-step-crossed.png`, fullPage: true })

  const highStepMap = JSON.parse(JSON.stringify(smallStepMap))
  highStepMap.terrainSegments = [flat('blocked_step_70', 300, 220, 500)]
  const highSaveStatus = await putMap(highStepMap)
  await page.reload()
  await page.locator('.player').waitFor()
  const highBlocked = await moveRight(900)

  const dropMap = JSON.parse(JSON.stringify(smallStepMap))
  dropMap.terrainSegments = [
    {
      id: 'access_slope',
      type: 'slope',
      x: 180,
      y: 490,
      width: 240,
      startY: 570,
      endY: 490,
      baseY: 570,
      rise: 80,
      direction: 'right',
      steps: 8,
      autoWidth: true,
      grade: 3,
      assetId: 'tile_grassland_ground_fill_01',
      imageSource: '',
      imageMode: 'repeat'
    },
    flat('high_floor_before_drop', 420, 180, 490)
  ]
  const dropSaveStatus = await putMap(dropMap)
  await page.reload()
  await page.locator('.player').waitFor()
  const largeDropBlocked = await moveRight(1800)
  await page.screenshot({ path: `${outputDir}/02-large-drop-blocked.png`, fullPage: true })

  const report = {
    editorThresholds,
    thresholds: { maxStepUp: 48, maxStepDown: 72 },
    smallStep: {
      saveStatus: smallSaveStatus,
      before: smallBefore.player,
      onStep: onSmallStep.player,
      afterStep: afterSmallStep.player
    },
    largeStep: { saveStatus: highSaveStatus, after: highBlocked.player },
    largeDrop: { saveStatus: dropSaveStatus, after: largeDropBlocked.player },
    errors
  }
  fs.writeFileSync(`${outputDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  if (originalMap) await putMap(originalMap)
  await browser.close()
}
