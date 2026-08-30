import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

try {
  await page.goto('http://127.0.0.1:5173/guest', { waitUntil: 'networkidle' })
  const sourcePlacements = await page.evaluate(async () => fetch('/api/local/battle-formation-units', { cache: 'no-store' }).then(response => response.json()))
  await page.getByRole('button', { name: '▶ バトル情報ver2' }).click()
  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
  const baselineX = sourcePlacements.baseline.offsetX
  const baselineY = sourcePlacements.baseline.offsetY
  if (state.formationPlacements.baseline.offsetX !== baselineX || state.formationPlacements.baseline.offsetY !== baselineY) {
    throw new Error(`共通位置の初期値が不正です: ${JSON.stringify(state.formationPlacements.baseline)}`)
  }
  for (const side of ['enemy', 'ally']) {
    for (const [id, expected] of Object.entries(sourcePlacements[side])) {
      const actual = state.formationPlacements[side][id]
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`基準移行値が不正です: ${side}:${id} ${JSON.stringify({ expected, actual })}`)
      }
    }
  }

  const unitCss = [
    ['enemy', '101', '.enemy-grid img[alt="ENEMY-01"]', 2, '--enemy-x', '--enemy-shift', -140],
    ['enemy', '102', '.enemy-grid img[alt="ENEMY-02"]', 2, '--enemy-x', '--enemy-shift', -140],
    ['enemy', '103', '.enemy-grid img[alt="ENEMY-03"]', 2, '--enemy-x', '--enemy-shift', 0],
    ['enemy', '104', '.enemy-grid img[alt="ENEMY-04"]', 2, '--enemy-x', '--enemy-shift', 0],
    ['ally', '1', '.ally-grid img[alt="UNIT-01"]', 1, '--ally-x', '--ally-shift', 0],
    ['ally', '2', '.ally-grid img[alt="UNIT-02"]', 1, '--ally-x', '--ally-shift', 0],
    ['ally', '3', '.ally-grid img[alt="UNIT-03"]', 1, '--ally-x', '--ally-shift', 0]
  ]
  for (const [side, id, selector, parentCount, xName, yName, flyingY] of unitCss) {
    let element = page.locator(selector)
    for (let index = 0; index < parentCount; index += 1) element = element.locator('..')
    const placement = sourcePlacements[side][id]
    const expectedX = (side === 'enemy' ? baselineX : -baselineX) + placement.offsetX
    const expectedY = baselineY + placement.offsetY + flyingY
    const values = await element.evaluate((node, names) => ({
      x: Number.parseFloat(getComputedStyle(node).getPropertyValue(names[0])),
      y: Number.parseFloat(getComputedStyle(node).getPropertyValue(names[1]))
    }), [xName, yName])
    if (values.x !== expectedX || values.y !== expectedY) {
      throw new Error(`見た目の位置が移行前と一致しません: ${selector} ${JSON.stringify({ expectedX, expectedY, values })}`)
    }
  }

  await page.getByRole('button', { name: 'UI MODAL' }).click()
  await page.locator('.ui-control-panel').getByRole('button', { name: '配置面調整', exact: true }).click()
  const panel = page.locator('.formation-editor-panel')
  await panel.getByRole('button', { name: 'キャラ配置', exact: true }).click()
  const commonNumbers = panel.locator('.common-position-settings input[type="number"]')
  if (Number(await commonNumbers.nth(0).inputValue()) !== baselineX || Number(await commonNumbers.nth(1).inputValue()) !== baselineY) {
    throw new Error(`共通位置の入力欄が保存値と一致しません: ${baselineX}/${baselineY}`)
  }
  const previewX = Math.min(300, baselineX + 4)
  const previewY = Math.min(200, baselineY + 10)
  await commonNumbers.nth(0).fill(String(previewX))
  await commonNumbers.nth(1).fill(String(previewY))
  await page.waitForTimeout(100)
  const enemyGround = page.locator('.enemy-grid img[alt="ENEMY-03"]').locator('../..')
  const allyGround = page.locator('.ally-grid img[alt="UNIT-03"]').locator('..')
  const enemyFlyingShadow = page.locator('.enemy-grid img[alt="ENEMY-01"]').locator('../../..').locator('.unit-shadow')
  const globalPreview = {
    enemyX: Number.parseFloat(await enemyGround.evaluate(element => getComputedStyle(element).getPropertyValue('--enemy-x'))),
    enemyY: Number.parseFloat(await enemyGround.evaluate(element => getComputedStyle(element).getPropertyValue('--enemy-shift'))),
    allyX: Number.parseFloat(await allyGround.evaluate(element => getComputedStyle(element).getPropertyValue('--ally-x'))),
    allyY: Number.parseFloat(await allyGround.evaluate(element => getComputedStyle(element).getPropertyValue('--ally-shift'))),
    shadowX: Number.parseFloat(await enemyFlyingShadow.evaluate(element => getComputedStyle(element).getPropertyValue('--shadow-x'))),
    shadowY: Number.parseFloat(await enemyFlyingShadow.evaluate(element => getComputedStyle(element).getPropertyValue('--shadow-y')))
  }
  if (globalPreview.enemyX !== previewX || globalPreview.allyX !== -previewX
    || globalPreview.enemyY !== previewY || globalPreview.allyY !== previewY
    || globalPreview.shadowX !== previewX || globalPreview.shadowY !== previewY) {
    throw new Error(`共通位置が敵味方・影へ反映されません: ${JSON.stringify(globalPreview)}`)
  }
  await commonNumbers.nth(0).fill(String(baselineX))
  await commonNumbers.nth(1).fill(String(baselineY))
  await panel.locator('.unit-selector button').filter({ hasText: 'ENEMY-03' }).click()
  const numbers = panel.locator('.placement-control .offset-control input[type="number"]')
  if (Number(await numbers.nth(0).inputValue()) !== sourcePlacements.enemy['103'].offsetX
    || Number(await numbers.nth(1).inputValue()) !== sourcePlacements.enemy['103'].offsetY) {
    throw new Error('個別位置の入力欄が保存値と一致しません')
  }
  await page.screenshot({ path: 'output/battle-ver2-character-baseline.png', fullPage: false })
  if (errors.length) throw new Error(`ブラウザエラー: ${JSON.stringify(errors)}`)
  console.log(JSON.stringify({ savedBaseline: { x: baselineX, y: baselineY }, previewBaseline: { x: previewX, y: previewY }, globalPreview, sourceUnchanged: true, errors }, null, 2))
} finally {
  await browser.close()
}
