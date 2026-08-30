import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const baseUrl = 'http://127.0.0.1:5173'
const projectId = 'motion_20260815095021_85vj'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))
page.on('dialog', async dialog => {
  if (dialog.type() === 'prompt') await dialog.accept('握る')
  else await dialog.dismiss()
})

await page.goto(`${baseUrl}/2d_bone_editor_split/`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.replaceCurrentProject === 'function')
const target = await page.evaluate(async id => {
  const entry = await fetch(`/api/local/bone-motion-projects?id=${encodeURIComponent(id)}`, { cache: 'no-store' }).then(response => response.json())
  window.replaceCurrentProject(entry.project, null)
  document.querySelector('#projectLibraryDialog')?.close()
  const data = JSON.parse(document.querySelector('#jsonArea').value)
  return data.layerOrder.find(layerId => data.layers[layerId].imageSourceId || data.layers[layerId].imageSourceSlot)
}, projectId)
if (!target) throw new Error('画像が設定済みの検証用ボーンがありません')

// 重なった画像があっても、実UIと同じ選択処理を通して対象ボーンを選ぶ。
await page.evaluate(id => window.selectBoneLayer(id), target)
await page.locator('#addBoneMorphBtn').click()
await page.waitForFunction(() => document.querySelector('#boneMorphSelect')?.value === '握る')
await page.locator('#editImageCropBtn').click()
await page.waitForSelector('#imageCropDialog[open]')
const dialogState = await page.evaluate(() => ({
  label: document.querySelector('#cropSourceLabel')?.textContent,
  removeAllHidden: document.querySelector('#imageCropRemoveAllBtn')?.hidden,
  cropControls: [...document.querySelectorAll('#imageCropDialog input')].map(node => node.id)
}))
if (!dialogState.label?.includes('モーフ「握る」')) throw new Error(`部位分割がモーフ対象になっていません: ${JSON.stringify(dialogState)}`)
if (!dialogState.removeAllHidden) throw new Error('モーフ編集中に通常画像の一括削除ボタンが表示されています')
await page.screenshot({ path: 'output/bone-editor-morph-crop-dialog.png', fullPage: true })

// ダイアログ内部の既存範囲値を変更して、通常画像ではなくモーフだけに保存されることを確認する。
await page.locator('#cropXInput').fill('12')
await page.locator('#cropYInput').fill('8')
await page.locator('#cropWInput').fill('64')
await page.locator('#cropHInput').fill('72')
await page.locator('#cropFlipXInput').check()
await page.locator('#cropFlipYInput').check()
await page.locator('#imageCropApplyBtn').click()
await page.waitForFunction(() => !document.querySelector('#imageCropDialog')?.open)
await page.locator('#imageFlipXInput').check()
await page.locator('#imageFlipYInput').check()
const result = await page.evaluate(({ target }) => {
  window.exportJSON(false)
  const data = JSON.parse(document.querySelector('#jsonArea').value)
  const frame = data.animations.find(animation => animation.id === data.meta.activeAnimationId)?.frames?.[0] || data.defaultFrame
  const morph = data.layers[target].morphs?.[frame[target]?.morphId]
  return { morphId: frame[target]?.morphId, morph, baseCrop: [data.layers[target].imageCropX, data.layers[target].imageCropY, data.layers[target].imageCropW, data.layers[target].imageCropH] }
}, { target })
if (result.morphId !== '握る') throw new Error(`モーフ選択がフレームへ残っていません: ${JSON.stringify(result)}`)
if (JSON.stringify([result.morph.imageCropX, result.morph.imageCropY, result.morph.imageCropW, result.morph.imageCropH]) !== JSON.stringify([0.12, 0.08, 0.64, 0.72])) throw new Error(`部位分割の範囲がモーフへ保存されていません: ${JSON.stringify(result)}`)
if (!result.morph.imageCropFlipX || !result.morph.imageCropFlipY || !result.morph.imageFragmentData || !result.morph.imageFlipX || !result.morph.imageFlipY) throw new Error(`モーフの反転設定が保存・適用されていません: ${JSON.stringify(result)}`)
await page.screenshot({ path: 'output/bone-editor-morph-crop.png', fullPage: true })
if (errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({ target, dialogState, result, errors }))
await browser.close()
