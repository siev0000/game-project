import fs from 'node:fs'
import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const outputDir = 'output/web-game/vertical-traversal'
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
const advanceWithKey = async (key, milliseconds) => {
  await page.keyboard.down(key)
  await page.evaluate(ms => window.advanceTime(ms), milliseconds)
  await page.keyboard.up(key)
  return state()
}

let originalMap = null
try {
  await page.goto('http://192.168.0.209:5173/area-exploration?area=exterior_grassland')
  await page.locator('.map-edit-button').click()
  await page.getByRole('button', { name: '＋ 階段' }).click()
  await page.getByRole('button', { name: '＋ 梯子' }).click()
  await page.getByRole('button', { name: '＋ エレベーター' }).click()
  const editorState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
  await page.screenshot({ path: `${outputDir}/01-editor-vertical-tools.png`, fullPage: true })

  const drafts = await page.evaluate(async () => (await fetch('/api/local/area-map-draft')).json())
  originalMap = drafts.maps.exterior_grassland

  const blockedMap = JSON.parse(JSON.stringify(originalMap))
  blockedMap.terrainSegments = [{
    id: 'unconnected_upper_ground',
    type: 'flat',
    x: 300,
    y: 390,
    width: 360,
    startY: 390,
    endY: 390,
    steps: 8,
    autoWidth: false,
    grade: 3,
    assetId: 'tile_grassland_ground_fill_01',
    imageSource: '',
    imageMode: 'repeat'
  }]
  blockedMap.verticalTransports = []
  const blockedSaveStatus = await putMap(blockedMap)
  await page.goto('http://192.168.0.209:5173/area-map/exterior_grassland')
  await page.locator('.player').waitFor()
  const blockedBefore = await state()
  const blockedAfter = await advanceWithKey('ArrowRight', 1200)

  const connectedMap = JSON.parse(JSON.stringify(originalMap))
  connectedMap.terrainSegments = [
    {
      id: 'connected_stairs',
      type: 'stairs',
      x: 180,
      y: 410,
      width: 320,
      startY: 570,
      endY: 410,
      steps: 10,
      autoWidth: true,
      grade: 2,
      assetId: 'tile_grassland_ground_fill_01',
      imageSource: '',
      imageMode: 'repeat'
    },
    {
      id: 'middle_floor',
      type: 'flat',
      x: 500,
      y: 410,
      width: 450,
      startY: 410,
      endY: 410,
      steps: 8,
      autoWidth: false,
      grade: 3,
      assetId: 'tile_grassland_ground_fill_01',
      imageSource: '',
      imageMode: 'repeat'
    },
    {
      id: 'upper_floor',
      type: 'flat',
      x: 550,
      y: 250,
      width: 400,
      startY: 250,
      endY: 250,
      steps: 8,
      autoWidth: false,
      grade: 3,
      assetId: 'tile_grassland_ground_fill_01',
      imageSource: '',
      imageMode: 'repeat'
    }
  ]
  connectedMap.verticalTransports = [
    {
      id: 'test_ladder',
      type: 'ladder',
      x: 600,
      y: 250,
      width: 48,
      topY: 250,
      bottomY: 410,
      speed: 220,
      assetId: 'placeholder_ladder',
      imageSource: ''
    },
    {
      id: 'test_elevator',
      type: 'elevator',
      x: 800,
      y: 250,
      width: 96,
      topY: 250,
      bottomY: 410,
      speed: 170,
      assetId: 'placeholder_elevator',
      imageSource: ''
    }
  ]
  const connectedSaveStatus = await putMap(connectedMap)
  await page.goto('http://192.168.0.209:5173/area-map/exterior_grassland')
  await page.locator('.player').waitFor()
  const connectedBefore = await state()
  const afterStairs = await advanceWithKey('ArrowRight', 1300)
  const atLadder = await advanceWithKey('ArrowRight', 130)
  const afterLadder = await advanceWithKey('ArrowUp', 900)
  const atElevator = await advanceWithKey('ArrowRight', 720)
  const afterElevator = await advanceWithKey('ArrowDown', 1100)
  const elevatorCabTop = await page.locator('.elevator-cab').evaluate(element => getComputedStyle(element).top)
  await page.screenshot({ path: `${outputDir}/02-runtime-ladder-elevator.png`, fullPage: true })

  const report = {
    editor: {
      terrain: editorState.terrainSegments.at(-1),
      transports: editorState.verticalTransports
    },
    blockedSurface: {
      saveStatus: blockedSaveStatus,
      before: blockedBefore.player,
      after: blockedAfter.player
    },
    connectedTraversal: {
      saveStatus: connectedSaveStatus,
      before: connectedBefore.player,
      afterStairs: afterStairs.player,
      atLadder: atLadder.player,
      afterLadder: afterLadder.player,
      atElevator: atElevator.player,
      afterElevator: afterElevator.player,
      elevatorCabTop
    },
    errors
  }
  fs.writeFileSync(`${outputDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  if (originalMap) await putMap(originalMap)
  await browser.close()
}
