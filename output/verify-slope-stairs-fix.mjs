import fs from 'node:fs'
import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const outputDir = 'output/web-game/slope-stairs-fix'
fs.mkdirSync(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
page.on('pageerror', error => errors.push(error.message))

const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()))
const move = async (key, milliseconds) => {
  await page.keyboard.down(key)
  await page.evaluate(ms => window.advanceTime(ms), milliseconds)
  await page.keyboard.up(key)
  return state()
}
const putMap = mapDraft => page.evaluate(async draft => {
  const response = await fetch('/api/local/area-map-draft', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ areaId: 'exterior_grassland', mapDraft: draft })
  })
  return response.status
}, mapDraft)

let originalMap = null
try {
  await page.goto('http://192.168.0.209:5173/area-exploration?area=exterior_grassland')
  await page.locator('.map-edit-button').click()
  await page.getByRole('button', { name: '＋ 坂' }).click()
  await page.getByRole('button', { name: '＋ 階段' }).click()
  const editorState = await state()
  const editorShapes = await page.locator('.terrain-object.terrain-slope, .terrain-object.terrain-stairs').evaluateAll(elements => (
    elements.map(element => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return {
        className: element.className,
        x: Math.round(rect.x),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        clipPath: style.clipPath
      }
    })
  ))
  await page.screenshot({ path: `${outputDir}/01-editor-distinct-surfaces.png`, fullPage: true })

  const drafts = await page.evaluate(async () => (await fetch('/api/local/area-map-draft')).json())
  originalMap = drafts.maps.exterior_grassland
  const testMap = JSON.parse(JSON.stringify(originalMap))
  testMap.terrainSegments = [
    {
      id: 'roundtrip_stairs',
      type: 'stairs',
      x: 180,
      y: 410,
      width: 320,
      startY: 570,
      endY: 410,
      baseY: 570,
      rise: 160,
      direction: 'right',
      steps: 10,
      autoWidth: true,
      grade: 2,
      assetId: 'tile_grassland_ground_fill_01',
      imageSource: '',
      imageMode: 'repeat'
    },
    {
      id: 'roundtrip_upper_floor',
      type: 'flat',
      x: 500,
      y: 410,
      width: 300,
      startY: 410,
      endY: 410,
      baseY: 410,
      rise: 0,
      direction: 'right',
      steps: 8,
      autoWidth: false,
      grade: 3,
      assetId: 'tile_grassland_ground_fill_01',
      imageSource: '',
      imageMode: 'repeat'
    }
  ]
  testMap.verticalTransports = []
  const saveStatus = await putMap(testMap)
  await page.goto('http://192.168.0.209:5173/area-map/exterior_grassland')
  await page.locator('.player').waitFor()
  const before = await state()
  const afterAscent = await move('ArrowRight', 1300)
  const afterDescent = await move('ArrowLeft', 1300)
  const runtimeShape = await page.locator('.terrain-segment-stairs').evaluate(element => ({
    clipPath: getComputedStyle(element).clipPath,
    upSign: element.querySelector('.terrain-up-sign')?.textContent.trim()
  }))
  await page.screenshot({ path: `${outputDir}/02-runtime-roundtrip.png`, fullPage: true })

  const slopeMap = JSON.parse(JSON.stringify(testMap))
  slopeMap.terrainSegments = [
    {
      ...testMap.terrainSegments[0],
      id: 'roundtrip_slope',
      type: 'slope',
      width: 480,
      steps: 8,
      grade: 3
    },
    {
      ...testMap.terrainSegments[1],
      id: 'roundtrip_slope_upper_floor',
      x: 660
    }
  ]
  const slopeSaveStatus = await putMap(slopeMap)
  await page.goto('http://192.168.0.209:5173/area-map/exterior_grassland')
  await page.locator('.player').waitFor()
  const slopeBefore = await state()
  const slopeAfterAscent = await move('ArrowRight', 1700)
  const slopeAfterDescent = await move('ArrowLeft', 1700)
  await page.screenshot({ path: `${outputDir}/03-runtime-slope-roundtrip.png`, fullPage: true })

  const report = {
    editor: {
      terrainSegments: editorState.terrainSegments,
      shapes: editorShapes
    },
    runtime: {
      saveStatus,
      before: before.player,
      afterAscent: afterAscent.player,
      afterDescent: afterDescent.player,
      shape: runtimeShape
    },
    slopeRuntime: {
      saveStatus: slopeSaveStatus,
      before: slopeBefore.player,
      afterAscent: slopeAfterAscent.player,
      afterDescent: slopeAfterDescent.player
    },
    errors
  }
  fs.writeFileSync(`${outputDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  if (originalMap) await putMap(originalMap)
  await browser.close()
}
