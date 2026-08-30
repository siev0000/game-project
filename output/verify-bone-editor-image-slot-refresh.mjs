import { readFileSync } from 'node:fs'
import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.evaluate(() => {
  localStorage.removeItem('bone_editor_compact_single_v34')
  localStorage.removeItem('bone_editor_current_source_project_v1')
  location.reload()
})
await page.waitForLoadState('networkidle')
const input = page.locator('#baseImageInput')
const firstBuffer = readFileSync('src/assets/images/ようこそ.png')
const secondBuffer = readFileSync('src/assets/images/pixel_art/一般雑魚.png')
await input.setInputFiles({ name: '同名更新テスト.png', mimeType: 'image/png', buffer: firstBuffer })
await page.waitForTimeout(200)
const first = await page.evaluate(() => {
  window.exportJSON(false)
  const project = JSON.parse(document.querySelector('#jsonArea').value)
  const slot = project.imageSlots.body
  return { sourceIds: slot.sourceIds, activeSourceId: slot.activeSourceId, data: project.imageSources[slot.activeSourceId].data }
})
await input.setInputFiles({ name: '同名更新テスト.png', mimeType: 'image/png', buffer: secondBuffer })
await page.waitForTimeout(200)
const second = await page.evaluate(() => {
  window.exportJSON(false)
  const project = JSON.parse(document.querySelector('#jsonArea').value)
  const slot = project.imageSlots.body
  return { sourceIds: slot.sourceIds, activeSourceId: slot.activeSourceId, data: project.imageSources[slot.activeSourceId].data }
})
if (second.sourceIds.length !== 1) throw new Error(`同名画像が追加扱いです: ${second.sourceIds.length}`)
if (second.activeSourceId !== first.activeSourceId) throw new Error('同名更新で画像IDが変わりました')
if (second.data === first.data) throw new Error('同名更新後も画像データが古いままです')
if (errors.length) throw new Error(`console errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({ sourceId: second.activeSourceId, count: second.sourceIds.length, updated: second.data !== first.data, errors }))
await browser.close()
