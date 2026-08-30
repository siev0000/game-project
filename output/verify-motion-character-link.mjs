import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/?return=%2Fguest%3Ftab%3Dcreate', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryCloseBtn').click()
const closeButton = page.locator('#closeEditorBtn')
if (!await closeButton.isVisible()) throw new Error('モーション作成画面の閉じるボタンが表示されていません')
const closeBox = await closeButton.boundingBox()
if (!closeBox || closeBox.x < 0 || closeBox.x + closeBox.width > 1280) throw new Error(`閉じるボタンが画面外です: ${JSON.stringify(closeBox)}`)
await page.screenshot({ path: 'output/motion-editor-close-button.png', fullPage: false })
await closeButton.click()
await page.waitForURL(url => url.pathname === '/guest')
await page.waitForTimeout(800)
await page.screenshot({ path: 'output/motion-editor-return-result.png', fullPage: false })
const guestEntryCount = await page.locator('.bone-editor-entry').count()
if (!guestEntryCount) throw new Error(`guest一覧へ戻れていません: ${await page.locator('body').innerText()}`)

await page.goto('http://192.168.0.209:5173/character-library', { waitUntil: 'networkidle' })
await page.locator('.character-card').first().click()
const motionSelect = page.getByLabel('保存済みモーション')
await motionSelect.waitFor()
const motionOptions = await motionSelect.locator('option').evaluateAll(options => options.map(option => ({ value: option.value, text: option.textContent })))
const firstMotion = motionOptions.find(option => option.value)
if (!firstMotion) throw new Error('保存済みモーションが選択肢へ表示されていません')
await motionSelect.selectOption(firstMotion.value)
await page.locator('.motion-project-summary').waitFor()
const displaySizeInputs = page.locator('.metric-groups article').first().locator('input')
await displaySizeInputs.nth(0).fill('60')
await displaySizeInputs.nth(1).fill('100')
await page.getByRole('button', { name: '状態別グラフィック' }).click()
const stateMotionSelect = page.getByLabel('待機モーション')
const stateMotionOptions = await stateMotionSelect.locator('option').evaluateAll(options => options.map(option => ({ value: option.value, text: option.textContent })))
const firstAnimation = stateMotionOptions.find(option => option.value && option.value !== '__default__')
if (!firstAnimation) throw new Error('選択したデータ内のモーションが状態別選択肢へ表示されていません')
await stateMotionSelect.selectOption(firstAnimation.value)
if (!await page.locator('.state-motion-current').getByText(firstAnimation.text.split('（')[0], { exact: true }).count()) throw new Error('状態別モーションの選択結果が表示されていません')
await page.locator('.bone-motion-preview').waitFor()
const previewSize = await page.locator('.character-motion-player').evaluate(node => ({ width: getComputedStyle(node).width, height: getComputedStyle(node).height }))
if (previewSize.width !== '120px' || previewSize.height !== '200px') throw new Error(`character-libraryの表示サイズがプレビューへ反映されていません: ${JSON.stringify(previewSize)}`)
await page.waitForFunction(() => typeof document.querySelector('.bone-motion-preview')?.contentWindow?.render_game_to_text === 'function')
await page.waitForTimeout(350)
const previewState = JSON.parse(await page.evaluate(() => document.querySelector('.bone-motion-preview').contentWindow.render_game_to_text()))
if (previewState.project?.editing !== firstAnimation.text.split('（')[0] || previewState.project?.frameCount < 1) throw new Error(`stage-gridへ選択モーションが読み込まれていません: ${JSON.stringify(previewState.project)}`)

let savedMotion = null
await page.route('**/api/local/character-library', async route => {
  if (route.request().method() !== 'PUT') return route.continue()
  const body = route.request().postDataJSON()
  savedMotion = {
    id: body.library.characters[0].motionProjectId,
    name: body.library.characters[0].motionProjectName,
    states: body.library.characters[0].motionStates
  }
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body.library) })
})
await page.getByRole('button', { name: 'JSONへ保存' }).click()
await page.getByText('characterLibrary.jsonへ保存しました').waitFor()
if (savedMotion?.id !== firstMotion.value || !savedMotion.name || savedMotion.states?.idle !== firstAnimation.value) throw new Error(`保存リクエストへ状態別モーション参照が入りません: ${JSON.stringify(savedMotion)}`)

const state = JSON.parse(await page.evaluate(() => window.render_game_to_text?.()))
if (state.motionProject?.id !== firstMotion.value || !state.motionProject.available || state.motionProject.states?.idle !== firstAnimation.value) throw new Error(`画面状態へ状態別モーションが反映されていません: ${JSON.stringify(state.motionProject)}`)
await page.locator('.state-motion-section').scrollIntoViewIfNeeded()
await page.screenshot({ path: 'output/character-motion-project-setting.png', fullPage: false })

console.log(JSON.stringify({ closeBox, returnedToGuest: true, optionCount: motionOptions.length - 1, selected: savedMotion, previewSize, preview: previewState.project, errors, state }))
await browser.close()
