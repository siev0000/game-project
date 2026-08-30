import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

const base = process.env.TEST_BASE || 'http://127.0.0.1:4178'
const originalDrafts = await (await page.request.get(`${base}/api/local/area-map-draft`)).json()
let savedLibrary = await (await page.request.get(`${base}/api/local/map-part-library`)).json()
let savedDraft = null
let savedAreaState = null
await page.route('**/api/local/map-part-library', async route => {
  if (route.request().method() === 'GET') {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(savedLibrary) })
  }
  savedLibrary = route.request().postDataJSON().library
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(savedLibrary) })
})
await page.route('**/api/local/area-map-draft', async route => {
  if (route.request().method() === 'GET') {
    const maps = { ...originalDrafts.maps, ...(savedDraft ? { middle_terminal_concourse: savedDraft } : {}) }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...originalDrafts, maps }) })
  }
  savedDraft = route.request().postDataJSON().mapDraft
  const maps = { ...originalDrafts.maps, middle_terminal_concourse: savedDraft }
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...originalDrafts, maps }) })
})
await page.route('**/api/local/area-state', async route => {
  if (route.request().method() !== 'PUT') return route.continue()
  const request = route.request().postDataJSON()
  savedAreaState = request.areaState
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ areaStates: { [request.areaId]: savedAreaState } })
  })
})

await page.goto(`${base}/area-exploration?area=middle_terminal_concourse`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '素材・部品' }).click()
const partEditor = page.getByRole('dialog', { name: '素材・部品作成' })
await partEditor.waitFor()
await partEditor.getByRole('button', { name: '元画像を選択' }).click()
let imagePicker = page.getByRole('dialog', { name: '部品の元画像を選択' })
await imagePicker.waitFor()
await imagePicker.getByRole('button', { name: '機械廊下を候補にする' }).waitFor()
if (await imagePicker.locator('.image-picker-grid > button').count() < 2) throw new Error('画像選択モーダルにサムネイルが表示されません')
await imagePicker.getByRole('button', { name: '機械廊下を候補にする' }).click()
await imagePicker.getByRole('button', { name: 'この画像を選択' }).click()
const sourceImage = partEditor.getByAltText('locations/機械廊下.webpの切り出し元')
await sourceImage.waitFor()
await page.waitForFunction(() => document.querySelector('.source-frame img')?.naturalWidth > 0)
const frame = await partEditor.locator('.source-frame').boundingBox()
if (!frame) throw new Error('切り出し元画像が表示されません')
const southeastHandle = partEditor.getByRole('button', { name: '右下をドラッグして切り出し範囲を変更' })
let southeastHandleBox = await southeastHandle.boundingBox()
if (!southeastHandleBox) throw new Error('切り出し範囲の右下ハンドルが表示されません')
await page.mouse.move(southeastHandleBox.x + southeastHandleBox.width / 2, southeastHandleBox.y + southeastHandleBox.height / 2)
await page.mouse.down()
await page.mouse.move(southeastHandleBox.x - 150, southeastHandleBox.y - 100, { steps: 8 })
await page.mouse.up()
const cropBox = await partEditor.locator('.crop-selection').boundingBox()
if (!cropBox) throw new Error('切り出し範囲が表示されません')
await page.mouse.move(cropBox.x + cropBox.width / 2, cropBox.y + cropBox.height / 2)
await page.mouse.down()
await page.mouse.move(cropBox.x + cropBox.width / 2 + 30, cropBox.y + cropBox.height / 2 + 20, { steps: 6 })
await page.mouse.up()
const cropNumbersBeforeWidth = {
  y: await partEditor.getByLabel('Y', { exact: true }).inputValue(),
  height: await partEditor.getByLabel('高さ', { exact: true }).inputValue(),
  width: Number(await partEditor.getByLabel('幅', { exact: true }).inputValue())
}
const eastCropHandle = partEditor.getByRole('button', { name: '右をドラッグして切り出し範囲を変更', exact: true })
const eastCropHandleBox = await eastCropHandle.boundingBox()
if (!eastCropHandleBox) throw new Error('切り出し範囲の右ハンドルが表示されません')
await page.mouse.move(eastCropHandleBox.x + eastCropHandleBox.width / 2, eastCropHandleBox.y + eastCropHandleBox.height / 2)
await page.mouse.down()
await page.mouse.move(eastCropHandleBox.x + eastCropHandleBox.width / 2 + 35, eastCropHandleBox.y + eastCropHandleBox.height / 2, { steps: 5 })
await page.mouse.up()
const cropNumbersAfterWidth = {
  y: await partEditor.getByLabel('Y', { exact: true }).inputValue(),
  height: await partEditor.getByLabel('高さ', { exact: true }).inputValue(),
  width: Number(await partEditor.getByLabel('幅', { exact: true }).inputValue())
}
if (cropNumbersAfterWidth.width <= cropNumbersBeforeWidth.width || cropNumbersAfterWidth.y !== cropNumbersBeforeWidth.y || cropNumbersAfterWidth.height !== cropNumbersBeforeWidth.height) {
  throw new Error(`右ハンドルの幅変更が不正です: ${JSON.stringify({ cropNumbersBeforeWidth, cropNumbersAfterWidth })}`)
}
const cropBeforeZoom = await partEditor.locator('.source-frame').boundingBox()
await partEditor.locator('.crop-stage').hover({ position: { x: 360, y: 220 } })
await page.mouse.wheel(0, -420)
const cropAfterZoom = await partEditor.locator('.source-frame').boundingBox()
if (!cropBeforeZoom || !cropAfterZoom || cropAfterZoom.width <= cropBeforeZoom.width) throw new Error('ホイールで元画像を拡大できません')
const panStage = await partEditor.locator('.crop-stage').boundingBox()
if (!panStage) throw new Error('切り出しステージが表示されません')
const transformBeforePan = await partEditor.locator('.source-frame').evaluate(element => getComputedStyle(element).transform)
await page.mouse.move(panStage.x + 25, panStage.y + 25)
await page.mouse.down()
await page.mouse.move(panStage.x + 75, panStage.y + 55, { steps: 5 })
await page.mouse.up()
const transformAfterPan = await partEditor.locator('.source-frame').evaluate(element => getComputedStyle(element).transform)
if (transformAfterPan === transformBeforePan) throw new Error('枠外ドラッグで表示位置を移動できません')
await partEditor.getByLabel('部品ID').fill('test_pipe_part')
await partEditor.getByLabel('部品名').fill('テスト配管')
await partEditor.getByLabel('種類').selectOption('pipe')
await partEditor.getByLabel('配置方法').selectOption('free')
await partEditor.getByLabel('初期表示位置').selectOption('frontPlayer')
await partEditor.getByRole('button', { name: '部品を保存' }).click()
await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).isPartEditorOpen === true)
await partEditor.getByText('mapPartLibrary.jsonへ保存しました').waitFor()
const savedTestPart = savedLibrary.parts.find(part => part.id === 'test_pipe_part')
if (!savedTestPart || savedTestPart.sourceRect.width <= 1) throw new Error(`部品保存が不正です: ${JSON.stringify(savedLibrary)}`)
const resultPreview = await partEditor.locator('.part-preview-stage i').evaluate(element => {
  const style = getComputedStyle(element)
  return { width: Number.parseFloat(style.width), height: Number.parseFloat(style.height), backgroundSize: style.backgroundSize, backgroundPosition: style.backgroundPosition }
})
const resultRatio = resultPreview.width / resultPreview.height
const sourceRatio = savedTestPart.sourceRect.width / savedTestPart.sourceRect.height
if (Math.abs(resultRatio - sourceRatio) > .02) throw new Error(`切り出し結果の縦横比が配置時と異なります: ${JSON.stringify({ resultPreview, savedTestPart })}`)
const partEditorLayout = await page.evaluate(() => Object.fromEntries(['.part-editor-body', '.crop-workspace', '.crop-stage', '.source-frame', '.part-settings'].map(selector => {
  const element = document.querySelector(selector)
  const rect = element.getBoundingClientRect()
  return [selector, { x: rect.x, y: rect.y, width: rect.width, height: rect.height, overflow: getComputedStyle(element).overflow }]
})))
await page.screenshot({ path: 'output/map-part-authoring.png', fullPage: true })
await partEditor.getByRole('button', { name: '素材・部品作成を閉じる' }).click()

await page.getByRole('button', { name: 'マップ作成' }).click()
const mapEditor = page.getByRole('dialog', { name: '中層ターミナルコンコース' })
await mapEditor.waitFor()
let editorState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
if (editorState.zoom !== .5) throw new Error(`初期倍率が50%ではありません: ${editorState.zoom}`)
await mapEditor.locator('.test-player .editor-bone-motion').waitFor()
const editorPlayerVisual = await mapEditor.locator('.test-player').evaluate(element => ({
  width: element.getBoundingClientRect().width,
  height: element.getBoundingClientRect().height,
  hasBoneMotion: !!element.querySelector('.editor-bone-motion')
}))
if (Math.abs(editorPlayerVisual.width - editorState.testPlayer.displayWidth * editorState.zoom) > .1
  || Math.abs(editorPlayerVisual.height - editorState.testPlayer.displayHeight * editorState.zoom) > .1
  || !editorPlayerVisual.hasBoneMotion) {
  throw new Error(`プレイヤー実寸プレビューが不正です: ${JSON.stringify({ state: editorState.testPlayer, visual: editorPlayerVisual })}`)
}
await mapEditor.getByRole('button', { name: 'テスト配管' }).click()
const canvas = mapEditor.locator('.map-canvas')
const canvasBox = await canvas.boundingBox()
if (!canvasBox) throw new Error('マップキャンバスが表示されません')
await page.mouse.click(canvasBox.x + Math.min(520, canvasBox.width * .55), canvasBox.y + Math.min(250, canvasBox.height * .45))
editorState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const initialTestMapPart = editorState.mapParts.find(part => part.partId === 'test_pipe_part')
if (initialTestMapPart?.width !== savedTestPart.sourceRect.width || initialTestMapPart?.height !== savedTestPart.sourceRect.height) {
  throw new Error(`切り出し結果と配置時の初期サイズが一致しません: ${JSON.stringify({ initialTestMapPart, savedTestPart })}`)
}
await mapEditor.getByLabel('X', { exact: true }).fill('190')
await mapEditor.getByLabel('Y', { exact: true }).fill('380')
await mapEditor.getByLabel('幅', { exact: true }).fill('240')
await mapEditor.getByLabel('幅', { exact: true }).press('Enter')
editorState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
let editorTestMapPart = editorState.mapParts.find(part => part.partId === 'test_pipe_part')
const expectedHeightAt240 = Math.round(240 * savedTestPart.sourceRect.height / savedTestPart.sourceRect.width)
if (!editorTestMapPart || editorTestMapPart.renderLayer !== 'frontPlayer' || !editorTestMapPart.partFound || editorTestMapPart.width !== 240 || editorTestMapPart.height !== expectedHeightAt240) {
  throw new Error(`部品配置が不正です: ${JSON.stringify(editorState.mapParts)}`)
}
await mapEditor.getByRole('button', { name: 'グリッド吸着を切り替える' }).click()
const eastHandle = mapEditor.getByRole('button', { name: '右端をドラッグしてサイズ変更' })
const eastHandleBox = await eastHandle.boundingBox()
if (!eastHandleBox) throw new Error('部品の幅リサイズハンドルが表示されません')
await page.mouse.move(eastHandleBox.x + eastHandleBox.width / 2, eastHandleBox.y + eastHandleBox.height / 2)
await page.mouse.down()
await page.mouse.move(eastHandleBox.x + eastHandleBox.width / 2 + 30, eastHandleBox.y + eastHandleBox.height / 2, { steps: 6 })
await page.mouse.up()
editorState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
editorTestMapPart = editorState.mapParts.find(part => part.partId === 'test_pipe_part')
const expectedHeightAt300 = Math.round(300 * savedTestPart.sourceRect.height / savedTestPart.sourceRect.width)
if (editorTestMapPart.width !== 300 || editorTestMapPart.height !== expectedHeightAt300) throw new Error(`部品のドラッグ幅調整が不正です: ${JSON.stringify(editorTestMapPart)}`)
await page.screenshot({ path: 'output/map-part-placement.png', fullPage: true })

await mapEditor.getByRole('button', { name: /背景・キャラ/ }).click()
await mapEditor.getByLabel('上', { exact: true }).fill('#203060')
await mapEditor.getByLabel('右', { exact: true }).fill('#602040')
await mapEditor.getByLabel('下', { exact: true }).fill('#080510')
await mapEditor.getByLabel('左', { exact: true }).fill('#105040')
await mapEditor.getByRole('button', { name: '背景画像', exact: true }).click()
await mapEditor.getByRole('button', { name: '＋ 背景を追加' }).click()
await mapEditor.getByRole('button', { name: '＋ 背景を追加' }).click()
const backgroundRows = mapEditor.locator('.dynamic-background-row')
if (await backgroundRows.count() !== 3) throw new Error(`背景枚数が3ではありません: ${await backgroundRows.count()}`)
await mapEditor.getByRole('button', { name: '背景画像を選択 #2' }).click()
imagePicker = page.getByRole('dialog', { name: '背景画像を選択' })
await imagePicker.getByRole('button', { name: '研究所を候補にする' }).click()
await page.screenshot({ path: 'output/common-image-picker.png', fullPage: true })
await imagePicker.getByRole('button', { name: 'この画像を選択' }).click()
const secondBackgroundRow = backgroundRows.nth(1)
await secondBackgroundRow.getByLabel('位置 X', { exact: true }).fill('77')
await secondBackgroundRow.getByLabel('幅', { exact: true }).fill('800')
await secondBackgroundRow.getByRole('button', { name: 'マップ全面に戻す' }).click()
const resetBackgroundState = JSON.parse(await page.evaluate(() => window.render_game_to_text())).backgroundImages[1]
if (resetBackgroundState.x !== 0 || resetBackgroundState.y !== 0 || resetBackgroundState.width !== 3000 || resetBackgroundState.height !== 720) {
  throw new Error(`背景のマップ全面初期化が不正です: ${JSON.stringify(resetBackgroundState)}`)
}
await mapEditor.getByRole('button', { name: '背景画像を選択 #3' }).click()
imagePicker = page.getByRole('dialog', { name: '背景画像を選択' })
await imagePicker.getByRole('button', { name: '機械廊下を候補にする' }).click()
await imagePicker.getByRole('button', { name: 'この画像を選択' }).click()
const thirdBackgroundRow = backgroundRows.nth(2)
await thirdBackgroundRow.locator('select').first().selectOption('stretch')
await thirdBackgroundRow.getByLabel('位置 X', { exact: true }).fill('120')
await thirdBackgroundRow.getByLabel('表示 Y', { exact: true }).fill('40')
await thirdBackgroundRow.getByLabel('幅', { exact: true }).fill('900')
await thirdBackgroundRow.getByLabel('高さ', { exact: true }).fill('500')
let backgroundFrame = await mapEditor.locator('.background-live-preview .canvas-background-image').nth(2).evaluate(element => ({
  left: element.style.left,
  top: element.style.top,
  width: element.style.width,
  height: element.style.height,
  backgroundSize: element.style.backgroundSize
}))
if (JSON.stringify(backgroundFrame) !== JSON.stringify({ left: '60px', top: '20px', width: '450px', height: '250px', backgroundSize: '100% 100%' })) {
  throw new Error(`背景の数値位置・引き延ばしが不正です: ${JSON.stringify(backgroundFrame)}`)
}
const backgroundBox = await mapEditor.locator('.background-transform-box').boundingBox()
if (!backgroundBox) throw new Error('背景ドラッグ枠が表示されません')
await page.mouse.move(backgroundBox.x + 80, backgroundBox.y + 80)
await page.mouse.down()
await page.mouse.move(backgroundBox.x + 100, backgroundBox.y + 90, { steps: 4 })
await page.mouse.up()
const backgroundEastHandle = await mapEditor.locator('.background-resize-e').boundingBox()
if (!backgroundEastHandle) throw new Error('背景右リサイズハンドルが表示されません')
await page.mouse.move(backgroundEastHandle.x + backgroundEastHandle.width / 2, backgroundEastHandle.y + backgroundEastHandle.height / 2)
await page.mouse.down()
await page.mouse.move(backgroundEastHandle.x + backgroundEastHandle.width / 2 + 30, backgroundEastHandle.y + backgroundEastHandle.height / 2, { steps: 4 })
await page.mouse.up()
const backgroundNorthHandle = await mapEditor.locator('.background-resize-n').boundingBox()
if (!backgroundNorthHandle) throw new Error('背景上リサイズハンドルが表示されません')
await page.mouse.move(backgroundNorthHandle.x + backgroundNorthHandle.width / 2, backgroundNorthHandle.y + backgroundNorthHandle.height / 2)
await page.mouse.down()
await page.mouse.move(backgroundNorthHandle.x + backgroundNorthHandle.width / 2, backgroundNorthHandle.y + backgroundNorthHandle.height / 2 - 20, { steps: 4 })
await page.mouse.up()
const adjustedBackgroundState = JSON.parse(await page.evaluate(() => window.render_game_to_text())).backgroundImages[2]
if (adjustedBackgroundState.x !== 160 || adjustedBackgroundState.y !== 20 || adjustedBackgroundState.width !== 960 || adjustedBackgroundState.height !== 540 || adjustedBackgroundState.fit !== 'stretch') {
  throw new Error(`背景のドラッグ位置・サイズ変更が不正です: ${JSON.stringify(adjustedBackgroundState)}`)
}
const backgroundPreview = await mapEditor.locator('.background-live-preview').evaluate(element => ({
  width: element.style.width,
  height: element.style.height,
  gradient: getComputedStyle(element.querySelector('.canvas-gradient')).backgroundImage,
  imageCount: [...element.querySelectorAll('.canvas-background-image')].filter(item => getComputedStyle(item).display !== 'none' && getComputedStyle(item).backgroundImage !== 'none').length
}))
if (backgroundPreview.width !== '1500px' || backgroundPreview.height !== '360px' || backgroundPreview.imageCount !== 3 || !backgroundPreview.gradient.includes('conic-gradient')) {
  throw new Error(`背景ライブプレビューが不正です: ${JSON.stringify(backgroundPreview)}`)
}
await page.screenshot({ path: 'output/map-background-settings.png', fullPage: true })
for (const tabName of ['キャラクター', '会話・案内文', 'グラデーション', '背景画像']) {
  await mapEditor.getByRole('button', { name: tabName, exact: true }).click()
  const tabState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
  const expectedTab = { キャラクター: 'character', '会話・案内文': 'speech', グラデーション: 'gradient', 背景画像: 'images' }[tabName]
  if (tabState.backgroundSettingTab !== expectedTab) throw new Error(`${tabName}タブへ切り替わりません: ${JSON.stringify(tabState)}`)
}
await mapEditor.getByRole('button', { name: /状態テスト/ }).click()
await mapEditor.getByText('これはゲーム中のセーブではありません。', { exact: false }).waitFor()
await mapEditor.getByLabel('警報状態').selectOption('alert')
await mapEditor.getByRole('button', { name: '状態テストの初期値を保存' }).click()
await mapEditor.getByText('状態テストの初期値を保存しました').waitFor()
if (savedAreaState?.alarmState !== 'alert') throw new Error(`状態テスト初期値の保存内容が不正です: ${JSON.stringify(savedAreaState)}`)
if (!await mapEditor.isVisible()) throw new Error('状態テスト初期値の保存後にマップ編集画面が閉じました')
await page.screenshot({ path: 'output/map-state-save-explained.png', fullPage: true })
await mapEditor.getByRole('button', { name: 'マップをJSONへ保存' }).click()
await page.waitForFunction(() => document.body.textContent.includes('areaMapDrafts.jsonへ保存しました'))
if (!await mapEditor.isVisible()) throw new Error('マップ保存後に編集画面が閉じました')
const savedTestMapPart = savedDraft?.mapParts.find(part => part.partId === 'test_pipe_part')
const savedAdjustedBackground = savedDraft?.backgroundImages[2]
if (!savedDraft || savedDraft.backgroundImages.length !== 3 || savedTestMapPart?.renderLayer !== 'frontPlayer'
  || savedAdjustedBackground?.x !== 160 || savedAdjustedBackground?.y !== 20 || savedAdjustedBackground?.width !== 960 || savedAdjustedBackground?.height !== 540 || savedAdjustedBackground?.fit !== 'stretch') {
  throw new Error(`マップ保存が不正です: ${JSON.stringify(savedDraft)}`)
}
await mapEditor.getByRole('button', { name: 'マップ編集を閉じる' }).click()
await page.getByRole('button', { name: 'マップを開く' }).click()
await page.waitForURL('**/area-map/middle_terminal_concourse')
await page.locator('.map-part[data-part-id="test_pipe_part"]').first().waitFor()
const runtime = await page.evaluate(backgroundLayerId => ({
  state: JSON.parse(window.render_game_to_text()),
  partZ: getComputedStyle(document.querySelector('.map-part[data-part-id="test_pipe_part"]')).zIndex,
  playerZ: getComputedStyle(document.querySelector('.player')).zIndex,
  worldHeight: Number.parseFloat(document.querySelector('.map-world').style.height),
  backgroundCount: document.querySelectorAll('.world-segment:first-of-type .map-background-image').length,
  gradient: getComputedStyle(document.querySelector('.map-base-gradient')).backgroundImage,
  adjustedBackground: (() => {
    const element = document.querySelector(`.world-segment:first-of-type .map-background-image[data-background-layer-id="${backgroundLayerId}"]`)
    const style = getComputedStyle(element)
    return { left: style.left, top: style.top, width: style.width, height: style.height, backgroundSize: style.backgroundSize }
  })()
}), savedAdjustedBackground.id)
if (Number(runtime.partZ) <= Number(runtime.playerZ)) throw new Error(`部品がプレイヤーの前ではありません: ${JSON.stringify(runtime)}`)
if (runtime.backgroundCount !== 3 || !runtime.gradient.includes('conic-gradient')) throw new Error(`背景実描画が不正です: ${JSON.stringify(runtime)}`)
const runtimeVerticalScale = runtime.worldHeight / savedDraft.height
const runtimeBackgroundMatches = runtime.adjustedBackground.left === '160px'
  && Math.abs(Number.parseFloat(runtime.adjustedBackground.top) - 20 * runtimeVerticalScale) < .1
  && runtime.adjustedBackground.width === '960px'
  && Math.abs(Number.parseFloat(runtime.adjustedBackground.height) - 540 * runtimeVerticalScale) < .1
  && runtime.adjustedBackground.backgroundSize === '100% 100%'
if (!runtimeBackgroundMatches) {
  throw new Error(`背景位置・引き延ばしの実マップ反映が不正です: ${JSON.stringify(runtime.adjustedBackground)}`)
}
await page.screenshot({ path: 'output/map-authoring-runtime.png', fullPage: true })

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
mobile.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
mobile.on('pageerror', error => errors.push(String(error)))
await mobile.goto(`${base}/area-exploration?area=middle_terminal_concourse`, { waitUntil: 'networkidle' })
await mobile.getByRole('button', { name: '素材・部品' }).click()
const mobilePartEditor = mobile.getByRole('dialog', { name: '素材・部品作成' })
await mobilePartEditor.waitFor()
const mobileLayout = await mobilePartEditor.evaluate(element => ({
  left: element.getBoundingClientRect().left,
  right: element.getBoundingClientRect().right,
  viewportWidth: innerWidth,
  bodyOverflowX: element.querySelector('.part-editor-body').scrollWidth - element.querySelector('.part-editor-body').clientWidth
}))
if (mobileLayout.left < 0 || mobileLayout.right > mobileLayout.viewportWidth || mobileLayout.bodyOverflowX > 1) {
  throw new Error(`素材・部品のモバイル表示が横にはみ出しています: ${JSON.stringify(mobileLayout)}`)
}
await mobile.screenshot({ path: 'output/map-part-authoring-mobile.png', fullPage: true })
await mobilePartEditor.getByRole('button', { name: '素材・部品作成を閉じる' }).click()
await mobile.getByRole('button', { name: 'マップ作成' }).click()
const mobileMapEditor = mobile.getByRole('dialog', { name: '中層ターミナルコンコース' })
await mobileMapEditor.getByRole('button', { name: /背景・キャラ/ }).click()
const mobileBackgroundLayout = await mobileMapEditor.locator('.background-settings-workspace').evaluate(element => ({
  width: element.getBoundingClientRect().width,
  overflowX: element.scrollWidth - element.clientWidth,
  previewScrollWidth: element.querySelector('.background-preview-scroller').scrollWidth,
  previewClientWidth: element.querySelector('.background-preview-scroller').clientWidth,
  zoom: JSON.parse(window.render_game_to_text()).zoom
}))
if (mobileBackgroundLayout.overflowX > 1 || mobileBackgroundLayout.previewScrollWidth <= mobileBackgroundLayout.previewClientWidth || mobileBackgroundLayout.zoom !== .5) {
  throw new Error(`背景ライブプレビューのモバイル表示が不正です: ${JSON.stringify(mobileBackgroundLayout)}`)
}
await mobile.screenshot({ path: 'output/map-background-settings-mobile.png', fullPage: true })
await mobileMapEditor.getByRole('button', { name: '背景画像', exact: true }).click()
await mobileMapEditor.getByRole('button', { name: '背景画像を選択 #1' }).click()
const mobileImagePicker = mobile.getByRole('dialog', { name: '背景画像を選択' })
await mobileImagePicker.getByRole('button', { name: '機械廊下を候補にする' }).waitFor()
const mobilePickerLayout = await mobileImagePicker.evaluate(element => ({
  left: element.getBoundingClientRect().left,
  right: element.getBoundingClientRect().right,
  width: element.getBoundingClientRect().width,
  viewportWidth: innerWidth,
  columns: getComputedStyle(element.querySelector('.image-picker-grid')).gridTemplateColumns
}))
if (mobilePickerLayout.left < 0 || mobilePickerLayout.right > mobilePickerLayout.viewportWidth) throw new Error(`共通画像選択のモバイル表示が不正です: ${JSON.stringify(mobilePickerLayout)}`)
await mobile.screenshot({ path: 'output/common-image-picker-mobile.png', fullPage: true })
await mobileImagePicker.getByRole('button', { name: '画像選択を閉じる' }).click()

if (errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({ part: savedTestPart, partEditorLayout, mapPart: savedTestMapPart, backgroundImages: savedDraft.backgroundImages.length, backgroundPreview, runtime, mobileLayout, mobileBackgroundLayout, mobilePickerLayout, editorPlayerVisual, errors }, null, 2))
await browser.close()
