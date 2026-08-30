import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'
import { join } from 'node:path'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('.project-card-main').filter({ hasText: 'pixel_side_motion' }).click()

await page.locator('#settingsBtn').click()
await page.locator('#settingsDialog[open]').waitFor()
const settings = await page.locator('#settingsDialog').boundingBox()
const settingsState = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.settings-toggle-grid .settings-row')]
  return {
    columns: getComputedStyle(document.querySelector('.settings-toggle-grid')).gridTemplateColumns,
    rowTops: [...new Set(rows.map(row => Math.round(row.getBoundingClientRect().top)))],
    switches: document.querySelectorAll('.settings-check i').length,
    clipped: document.querySelector('#settingsDialog').scrollHeight > document.querySelector('#settingsDialog').clientHeight
  }
})
await page.screenshot({ path: 'output/bone-editor-settings-ui-large.png', fullPage: true })
const labelToggle = page.locator('#settingLabels')
const labelsBefore = await labelToggle.isChecked()
await page.locator('.settings-toggle-row').filter({ has: labelToggle }).click()
const labelsHiddenAfterToggle = await page.locator('#stage').evaluate(stage => stage.classList.contains('hide-labels'))
if (labelsHiddenAfterToggle === !labelsBefore) throw new Error('ボーン名スイッチが画面表示へ反映されません')
await page.locator('.settings-toggle-row').filter({ has: labelToggle }).click()
await page.locator('#settingsCloseBtn').click()

await page.locator('.layer-item').filter({ hasText: '右上腕' }).click()
await page.locator('#replaceImageInput').setInputFiles(join('2d_bone_editor_split', 'part_templates', 'technical', 'pixel_simple', 'pixel_simple_right_arm_sample.png'))
await page.locator('#imageCropDialog[open]').waitFor()
await page.locator('#cropEditorImage').evaluate(image => image.complete ? true : new Promise(resolve => image.addEventListener('load', resolve, { once:true })))
const cropDialog = await page.locator('#imageCropDialog').boundingBox()
const cropPreview = await page.locator('#cropPreviewArea').boundingBox()
const cropControls = await page.locator('#imageCropDialog .crop-controls').boundingBox()
await page.screenshot({ path: 'output/bone-editor-image-editor-large.png', fullPage: true })
await page.locator('#cropYInput').fill('5')
await page.locator('#cropYInput').dispatchEvent('change')
const cropTop = await page.locator('.crop-selection.active').evaluate(node => node.style.top)
if (cropTop !== '5%') throw new Error(`画像範囲入力がプレビューへ反映されません: ${cropTop}`)
await page.locator('#imageCropCancelBtn').click()
await page.locator('#imageCropDialog').waitFor({ state: 'hidden' })

if (!settings || settings.width < 760) throw new Error(`設定画面の幅が不足しています: ${JSON.stringify(settings)}`)
if (settingsState.rowTops.length !== 4 || settingsState.switches < 11) throw new Error(`設定が2列スイッチ配置になっていません: ${JSON.stringify(settingsState)}`)
if (!cropDialog || cropDialog.width < 1380 || cropDialog.height < 900) throw new Error(`画像編集画面が十分に大きくありません: ${JSON.stringify(cropDialog)}`)
if (!cropPreview || cropPreview.width < 900 || cropPreview.height < 700) throw new Error(`画像プレビュー領域が不足しています: ${JSON.stringify(cropPreview)}`)
if (!cropControls || cropControls.width < 330) throw new Error(`画像設定欄が狭すぎます: ${JSON.stringify(cropControls)}`)
if (errors.length) throw new Error(`console errors: ${errors.join(' | ')}`)

console.log(JSON.stringify({ settings, settingsState, cropDialog, cropPreview, cropControls, errors }, null, 2))
await browser.close()
