import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://127.0.0.1:5173/guest', { waitUntil: 'networkidle' })
const originalLayout = await page.evaluate(async () => (await fetch('/api/local/battle-formation-layout')).json())
await page.getByRole('button', { name: '▶ バトル情報ver2' }).click()
await page.waitForTimeout(200)
await page.waitForFunction(expected => JSON.parse(window.render_game_to_text()).formationLayout.field.enemyOuterTop.x === expected, originalLayout.field.enemyOuterTop.x)

const root = page.locator('.battle-root')
if (await page.locator('.enemy-grid .unit-slot').count() !== 9) throw new Error('敵側が9マスではありません')
if (await page.locator('.ally-grid .unit-slot').count() !== 9) throw new Error('味方側が9マスではありません')
const initialGeometry = await page.locator('.battle-field').evaluate(field => {
  const board = field.querySelector('.formation-board-grid')
  const groundedSlot = [...field.querySelectorAll('.enemy-grid .unit-slot')].find(slot => slot.querySelector('.enemy-card') && !slot.querySelector('.unit-shadow'))
  const flyingSlot = [...field.querySelectorAll('.enemy-grid .unit-slot')].find(slot => slot.querySelector('.enemy-card') && slot.querySelector('.unit-shadow'))
  const flyingImage = flyingSlot.querySelector('.enemy-card').getBoundingClientRect()
  const flyingShadow = flyingSlot.querySelector('.unit-shadow').getBoundingClientRect()
  return {
    enemyPath: board.querySelector('.enemy-lines path').getAttribute('d'),
    allyPath: board.querySelector('.ally-lines path').getAttribute('d'),
    boardTransform: getComputedStyle(board).transform,
    groundedFootOffset: groundedSlot.querySelector('.enemy-card').getBoundingClientRect().bottom - groundedSlot.getBoundingClientRect().bottom,
    flyingShadowFootOffset: flyingShadow.bottom - flyingSlot.getBoundingClientRect().bottom,
    flyingLift: flyingShadow.bottom - flyingImage.bottom,
    lineWidth: Number.parseFloat(getComputedStyle(board.querySelector('.enemy-lines')).strokeWidth)
  }
})
if (initialGeometry.boardTransform !== 'none') throw new Error(`盤面全体へtransformが残っています: ${JSON.stringify(initialGeometry)}`)
if (Math.abs(initialGeometry.groundedFootOffset) > 1) throw new Error(`地上ユニットの足元がずれています: ${JSON.stringify(initialGeometry)}`)
if (Math.abs(initialGeometry.flyingShadowFootOffset) > 1 || initialGeometry.flyingLift < 80) throw new Error(`飛行ユニットの影がずれています: ${JSON.stringify(initialGeometry)}`)
if (Math.abs(initialGeometry.lineWidth - originalLayout.style.lineWidth) > 0.01) throw new Error(`初期線幅がJSONと一致しません: ${JSON.stringify(initialGeometry)}`)

await page.getByRole('button', { name: 'UI MODAL' }).click()
const uiPanel = page.locator('.ui-control-panel')
for (const label of ['グリッド線 ON', '文字 ON', '配置面調整', '暗視', 'ターゲット', 'G1', '作成済']) {
  if (!await uiPanel.getByRole('button', { name: label, exact: true }).count()) throw new Error(`UI項目がありません: ${label}`)
}

await uiPanel.getByRole('button', { name: '配置面調整', exact: true }).click()
const editor = page.locator('.formation-editor')
const editorPanel = page.locator('.formation-editor-panel')
await editorPanel.waitFor()
if (await page.locator('.formation-handle').count() !== 6) throw new Error('実画面の基準点が6個ではありません')
const placement = await page.evaluate(() => {
  const field = document.querySelector('.battle-field').getBoundingClientRect()
  const panel = document.querySelector('.formation-editor-panel').getBoundingClientRect()
  return { fieldBottom: field.bottom, panelTop: panel.top, panelBottom: panel.bottom, viewportHeight: innerHeight }
})
if (placement.panelTop < placement.fieldBottom - 1 || placement.panelBottom > placement.viewportHeight + 1) {
  throw new Error(`調整パネルがcommand-area内に収まっていません: ${JSON.stringify(placement)}`)
}
if (await editorPanel.locator('input[type="range"]').count() !== 12 || await editorPanel.locator('input[type="number"]').count() !== 12) {
  throw new Error('基準点タブの入力項目数が不正です')
}
const enemyTopGroup = editorPanel.getByRole('group', { name: '敵・外側上' })
const enemyTopX = enemyTopGroup.locator('input[type="number"]').first()
await enemyTopX.fill('6')
const previewState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
if (previewState.formationLayout.field.enemyOuterTop.x !== 6 || !previewState.formationEditorOpen) {
  throw new Error(`調整がリアルタイム反映されていません: ${JSON.stringify(previewState)}`)
}
await page.waitForTimeout(100)
const adjustedPath = await page.locator('.battle-field .enemy-lines path').getAttribute('d')
if (adjustedPath === initialGeometry.enemyPath) throw new Error(`基準点変更後も実画面のグリッドが変化していません: ${JSON.stringify({ previewState, adjustedPath })}`)

const handleLayer = await page.locator('.formation-handle-layer').boundingBox()
const centerHandle = page.getByRole('button', { name: '中央・上を移動', exact: true })
const centerBox = await centerHandle.boundingBox()
await page.mouse.move(centerBox.x + centerBox.width / 2, centerBox.y + centerBox.height / 2)
await page.mouse.down()
await page.mouse.move(handleLayer.x + handleLayer.width * 0.52, handleLayer.y + handleLayer.height * 0.42, { steps: 5 })
await page.mouse.up()
const draggedState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
if (draggedState.formationLayout.field.centerTop.x !== 52 || draggedState.formationLayout.field.centerTop.y !== 42) {
  throw new Error(`実画面の基準点ドラッグが反映されていません: ${JSON.stringify(draggedState.formationLayout.field.centerTop)}`)
}

await editorPanel.getByRole('button', { name: '3×3区切り', exact: true }).click()
if (await editorPanel.locator('input[type="range"]').count() !== 4 || await editorPanel.locator('input[type="number"]').count() !== 4) {
  throw new Error('3×3区切りタブの入力項目数が不正です')
}
await editorPanel.getByRole('button', { name: '表示', exact: true }).click()
if (await editorPanel.locator('input[type="range"]').count() !== 1 || await editorPanel.locator('input[type="number"]').count() !== 1) {
  throw new Error('表示タブの線幅入力が不正です')
}
await editorPanel.locator('input[type="number"]').fill('0.55')
await page.waitForTimeout(100)
const previewLineWidth = Number.parseFloat(await page.locator('.enemy-lines').evaluate(element => getComputedStyle(element).strokeWidth))
const appearanceState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
if (Math.abs(previewLineWidth - 0.55) > 0.01 || appearanceState.formationLayout.style.lineWidth !== 0.55) {
  throw new Error(`線幅が実画面へ反映されていません: ${JSON.stringify({ previewLineWidth, appearanceState })}`)
}
await page.screenshot({ path: 'output/battle-ver2-formation-editor.png', fullPage: false })
await editorPanel.getByRole('button', { name: 'JSON', exact: true }).click()
const displayedJson = await editorPanel.locator('textarea').inputValue()
if (!await editorPanel.locator('textarea').count() || !displayedJson.includes('"enemyOuterTop"') || !displayedJson.includes('"lineWidth": 0.55')) {
  throw new Error('JSON表示が機能していません')
}
const validatedLayout = await page.evaluate(async layout => {
  const response = await fetch('/api/local/battle-formation-layout?validateOnly=1', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ layout })
  })
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}, appearanceState.formationLayout)
if (validatedLayout.field.enemyOuterTop.x !== 6 || validatedLayout.style.lineWidth !== 0.55) {
  throw new Error(`保存内容の検証APIが不正です: ${JSON.stringify(validatedLayout)}`)
}
const persistedLayout = await page.evaluate(async () => (await fetch('/api/local/battle-formation-layout', { cache: 'no-store' })).json())
if (JSON.stringify(persistedLayout) !== JSON.stringify(originalLayout)) throw new Error('検証テストが実JSONを書き換えました')

await editorPanel.getByRole('button', { name: '調整終了', exact: true }).click()
if (await editorPanel.count() || await page.locator('.formation-handle').count() || !await page.locator('.command-panel').count()) {
  throw new Error('調整終了後に通常コマンドへ戻っていません')
}

if (errors.length) throw new Error(`ブラウザエラー: ${JSON.stringify(errors)}`)
console.log(JSON.stringify({ initialGeometry, adjustedPath, validatedX: validatedLayout.field.enemyOuterTop.x, validatedLineWidth: validatedLayout.style.lineWidth, sourceUnchanged: true, errors }, null, 2))
await browser.close()
