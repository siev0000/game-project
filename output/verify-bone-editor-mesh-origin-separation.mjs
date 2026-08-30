import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('.project-card-main').filter({ hasText: 'pixel_side_motion' }).click()
await page.waitForTimeout(500)
await page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: /^右上腕$/ }) }).click()
await page.locator('#anchorModeBtn').click()

const meshAlphaBox = async () => page.evaluate(() => {
  const canvas = [...document.querySelectorAll('.mesh-binding-canvas')].find(element => element.dataset.bindingId === 'mesh_q84e3tz2')
  const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
  let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1, count = 0
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (pixels[(y * canvas.width + x) * 4 + 3] <= 8) continue
      minX = Math.min(minX, x); minY = Math.min(minY, y)
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); count += 1
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1, count }
})

const before = {
  mesh: await meshAlphaBox(),
  state: JSON.parse(await page.evaluate(() => window.render_game_to_text())).selectedBone
}
const origin = await page.locator('.anchor-editor-handle.origin .anchor-editor-dot').boundingBox()
await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2)
await page.mouse.down()
await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2 + 42, { steps: 5 })
await page.mouse.up()
await page.waitForTimeout(200)

const after = {
  mesh: await meshAlphaBox(),
  state: JSON.parse(await page.evaluate(() => window.render_game_to_text())).selectedBone,
  savedLayer: await page.evaluate(() => {
    const project = JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
    return Object.values(project.layers).find(layer => layer.name === '右上腕')
  })
}

const delta = Object.fromEntries(['minX', 'minY', 'width', 'height', 'count'].map(key => [key, after.mesh[key] - before.mesh[key]]))
if (Math.abs(delta.minX) > 1 || Math.abs(delta.minY) > 1 || Math.abs(delta.width) > 1 || Math.abs(delta.height) > 1 || Math.abs(delta.count) > 12) {
  throw new Error(`回転軸の変更でメッシュ画像が変形しました: ${JSON.stringify(delta)}`)
}
if (after.state.pivotY === before.state.pivotY) throw new Error('回転軸Yが変更されていません')
if (after.state.headX !== before.state.headX || after.state.headY !== before.state.headY) throw new Error('回転軸の変更で頭点が変化しました')
if (after.savedLayer.headX !== before.state.headX || after.savedLayer.headY !== before.state.headY) throw new Error('分離した頭点がブラウザ保存へ保持されていません')
if (errors.length) throw new Error(`console errors: ${errors.join(' | ')}`)

await page.screenshot({ path: 'output/bone-editor-mesh-origin-separated.png', fullPage: true })
console.log(JSON.stringify({ before, after: { mesh: after.mesh, state: after.state, savedHead: { x: after.savedLayer.headX, y: after.savedLayer.headY } }, delta, errors }, null, 2))
await browser.close()
