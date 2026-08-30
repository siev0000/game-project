import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

let originalPlacements
try {
  await page.goto('http://127.0.0.1:5173/guest', { waitUntil: 'networkidle' })
  originalPlacements = await page.evaluate(async () => fetch('/api/local/battle-formation-units', { cache: 'no-store' }).then(response => response.json()))
  await page.getByRole('button', { name: '▶ バトル情報ver2' }).click()
  await page.getByRole('button', { name: 'UI MODAL' }).click()
  await page.locator('.ui-control-panel').getByRole('button', { name: '配置面調整', exact: true }).click()
  const panel = page.locator('.formation-editor-panel')
  await panel.getByRole('button', { name: 'キャラ配置', exact: true }).click()
  if (await panel.locator('.unit-selector button').count() !== 7) throw new Error('キャラ選択が敵4体＋味方3体ではありません')
  const editorState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
  if (editorState.formationEditorMode !== 'characters') throw new Error(`キャラ配置モードになっていません: ${JSON.stringify(editorState)}`)

  const before = JSON.parse(await page.evaluate(() => window.render_game_to_text())).formationPlacements.enemy['104']
  const enemy = page.locator('img[alt="ENEMY-04"]').locator('..')
  const enemyBox = await enemy.boundingBox()
  const hitInfo = await page.evaluate(({ x, y }) => {
    const element = document.elementFromPoint(x, y)
    return { tag: element?.tagName, className: element?.className, alt: element?.getAttribute?.('alt') }
  }, { x: enemyBox.x + enemyBox.width / 2, y: enemyBox.y + enemyBox.height - 8 })
  await page.mouse.move(enemyBox.x + enemyBox.width / 2, enemyBox.y + enemyBox.height - 8)
  await page.mouse.down()
  await page.mouse.move(enemyBox.x + enemyBox.width / 2 - 105, enemyBox.y + enemyBox.height - 30, { steps: 6 })
  await page.mouse.up()
  const enemyBoxAfterDrag = await enemy.boundingBox()
  const afterDrag = JSON.parse(await page.evaluate(() => window.render_game_to_text())).formationPlacements.enemy['104']
  if (JSON.stringify(afterDrag) === JSON.stringify(before)) throw new Error(`直接ドラッグで配置が変わりません: ${JSON.stringify({ before, afterDrag, enemyBox, hitInfo })}`)
  if (Math.abs(enemyBoxAfterDrag.x - enemyBox.x) < 20 && Math.abs(enemyBoxAfterDrag.y - enemyBox.y) < 20) {
    throw new Error(`直接ドラッグ後もキャラ画像が動きません: ${JSON.stringify({ enemyBox, enemyBoxAfterDrag, afterDrag })}`)
  }
  if (!await enemy.locator('..').getAttribute('class').then(value => value.includes('selected-placement-unit'))) throw new Error('ドラッグしたキャラが選択表示になりません')

  const xNumber = panel.locator('.placement-control .offset-control input[type="number"]').first()
  const enemyBoxBeforeNumber = await enemy.boundingBox()
  const enemyCssXBeforeNumber = Number.parseFloat(await enemy.locator('..').evaluate(element => getComputedStyle(element).getPropertyValue('--enemy-x')))
  await xNumber.fill('24')
  await page.waitForTimeout(100)
  const enemyBoxAfterNumber = await enemy.boundingBox()
  const enemyCssXAfterNumber = Number.parseFloat(await enemy.locator('..').evaluate(element => getComputedStyle(element).getPropertyValue('--enemy-x')))
  const afterNumber = JSON.parse(await page.evaluate(() => window.render_game_to_text())).formationPlacements.enemy['104']
  if (afterNumber.offsetX !== 24) throw new Error(`X微調整が反映されません: ${JSON.stringify(afterNumber)}`)
  if (Math.abs((enemyCssXAfterNumber - enemyCssXBeforeNumber) - 45) > 0.1 || enemyBoxAfterNumber.x - enemyBoxBeforeNumber.x < 20) {
    throw new Error(`X微調整が画像位置へ反映されません: ${JSON.stringify({ enemyBoxBeforeNumber, enemyBoxAfterNumber, enemyCssXBeforeNumber, enemyCssXAfterNumber, afterDrag, afterNumber })}`)
  }

  await panel.locator('.unit-selector button').filter({ hasText: 'ENEMY-01' }).click()
  const flyingCard = page.locator('img[alt="ENEMY-01"]').locator('../..')
  const flyingShadow = flyingCard.locator('..').locator('.unit-shadow')
  const yNumber = panel.locator('.placement-control .offset-control input[type="number"]').nth(1)
  const flyingBoxBeforeY = await flyingCard.boundingBox()
  const shadowBoxBeforeY = await flyingShadow.boundingBox()
  const flyingCssYBefore = Number.parseFloat(await flyingCard.evaluate(element => getComputedStyle(element).getPropertyValue('--enemy-shift')))
  const shadowCssYBefore = Number.parseFloat(await flyingShadow.evaluate(element => getComputedStyle(element).getPropertyValue('--shadow-y')))
  const savedFlyingY = Number(await yNumber.inputValue())
  await yNumber.fill(String(savedFlyingY + 30))
  await page.waitForTimeout(100)
  const flyingBoxAfterY = await flyingCard.boundingBox()
  const shadowBoxAfterY = await flyingShadow.boundingBox()
  const flyingCssYAfter = Number.parseFloat(await flyingCard.evaluate(element => getComputedStyle(element).getPropertyValue('--enemy-shift')))
  const shadowCssYAfter = Number.parseFloat(await flyingShadow.evaluate(element => getComputedStyle(element).getPropertyValue('--shadow-y')))
  if (Math.abs((flyingCssYAfter - flyingCssYBefore) - 30) > 0.1
    || Math.abs((shadowCssYAfter - shadowCssYBefore) - 30) > 0.1
    || flyingBoxAfterY.y - flyingBoxBeforeY.y < 15
    || shadowBoxAfterY.y - shadowBoxBeforeY.y < 15) {
    throw new Error(`Y微調整が飛行画像と影へ反映されません: ${JSON.stringify({ flyingBoxBeforeY, flyingBoxAfterY, shadowBoxBeforeY, shadowBoxAfterY, flyingCssYBefore, flyingCssYAfter, shadowCssYBefore, shadowCssYAfter })}`)
  }

  await page.screenshot({ path: 'output/battle-ver2-character-placement.png', fullPage: false })
  const validated = await page.evaluate(async placements => {
    const response = await fetch('/api/local/battle-formation-units?validateOnly=1', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placements })
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  }, JSON.parse(await page.evaluate(() => window.render_game_to_text())).formationPlacements)
  if (validated.enemy['104'].offsetX !== 24) throw new Error(`保存内容の検証APIが不正です: ${JSON.stringify(validated.enemy['104'])}`)
  const persisted = await page.evaluate(async () => fetch('/api/local/battle-formation-units', { cache: 'no-store' }).then(response => response.json()))
  if (JSON.stringify(persisted) !== JSON.stringify(originalPlacements)) throw new Error('検証テストが実JSONを書き換えました')
  if (errors.length) throw new Error(`ブラウザエラー: ${JSON.stringify(errors)}`)
  console.log(JSON.stringify({ before, afterDrag, enemyBoxAfterDrag, afterNumber, enemyBoxAfterNumber, enemyCssXBeforeNumber, enemyCssXAfterNumber, validated: validated.enemy['104'], sourceUnchanged: true, selected: 'enemy:104', errors }, null, 2))
} finally {
  await browser.close()
}
