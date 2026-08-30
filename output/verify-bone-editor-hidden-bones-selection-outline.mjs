import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('.project-card-main').filter({ hasText: 'pixel_side_motion' }).click()
await page.waitForTimeout(400)
await page.locator('#showBones').uncheck()
await page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: /^右上腕$/ }) }).click()

const result = await page.evaluate(() => {
  const selected = document.querySelector('.layer.selected')
  const visual = selected.querySelector('.layer-visual')
  const shape = selected.querySelector('.shape')
  const overlay = document.querySelector('#resizeOverlay')
  const box = document.querySelector('#resizeBox')
  const boxRect = box.getBoundingClientRect()
  return {
    stageClasses: document.querySelector('#stage').className,
    selectedName: selected.querySelector('.layer-label')?.textContent,
    shapeDisplay: getComputedStyle(shape).display,
    outlineStyle: getComputedStyle(visual).outlineStyle,
    outlineWidth: getComputedStyle(visual).outlineWidth,
    overlayDisplay: getComputedStyle(overlay).display,
    boxPointerEvents: getComputedStyle(box).pointerEvents,
    box: { x: boxRect.x, y: boxRect.y, width: boxRect.width, height: boxRect.height }
  }
})

if (!result.stageClasses.includes('hide-bones')) throw new Error('ボーン非表示状態になっていません')
if (result.shapeDisplay !== 'none') throw new Error('ボーン形状が非表示になっていません')
if (result.outlineStyle !== 'solid' || result.outlineWidth === '0px') throw new Error('選択枠線が表示されていません')
if (result.overlayDisplay === 'none' || result.boxPointerEvents === 'none') throw new Error('選択操作枠が無効です')
if (errors.length) throw new Error(`runtime errors: ${errors.join(' | ')}`)

await page.screenshot({ path: 'output/bone-editor-hidden-bones-selection-outline.png', fullPage: true })
console.log(JSON.stringify({ result, errors }, null, 2))
await browser.close()
