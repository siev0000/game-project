import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'
import { readFileSync } from 'node:fs'

const characterSource = JSON.parse(readFileSync(new URL('../src/data/exploration/characterLibrary.json', import.meta.url), 'utf8'))
const messageSettings = JSON.parse(readFileSync(new URL('../data/dialogueMessageSettings.json', import.meta.url), 'utf8'))
const player = characterSource.characters.find(character => character.id === 'placeholder_player') || characterSource.characters.find(character => character.kind === 'player')
const npc = characterSource.characters.find(character => character.id === 'placeholder_npc') || characterSource.characters.find(character => character.kind === 'npc')
const typeName = character => messageSettings.typeProfiles?.[String(character?.messageType)]?.label || `TYPE-${character?.messageType}`

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1040, height: 1051 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://192.168.0.209:5173/character-library', { waitUntil: 'networkidle' })
await page.locator('.character-card').first().click()
const messageTypeSelect = page.getByLabel('メッセージタイプ')
if (await messageTypeSelect.inputValue() !== String(player.messageType)) throw new Error('キャラクターの保存済みメッセージタイプが表示されていません')
const alternateType = (await messageTypeSelect.locator('option').evaluateAll((options, current) => options.map(option => option.value).find(value => value !== current), String(player.messageType)))
await messageTypeSelect.selectOption(alternateType)
if (await messageTypeSelect.inputValue() !== alternateType) throw new Error('キャラクター側でメッセージタイプを変更できません')
await page.screenshot({ path: 'output/character-message-type-1040x1051.png', fullPage: false })

await page.goto('http://192.168.0.209:5173/dialogue-events', { waitUntil: 'networkidle' })
await page.locator('.event-card').first().click()
const sequenceBox = await page.locator('.sequence-panel').boundingBox()
const inspectorBox = await page.locator('.inspector-panel').boundingBox()
if (!sequenceBox || !inspectorBox || Math.abs(sequenceBox.width - inspectorBox.width) > 2) {
  throw new Error(`左右が50:50ではありません: ${sequenceBox?.width} / ${inspectorBox?.width}`)
}
if (await page.getByLabel('TYPE', { exact: true }).count()) throw new Error('会話イベント側にTYPE選択が残っています')

await page.locator('.sequence-card').nth(1).click()
const inspector = page.locator('.inspector-panel')
const speakerSelect = inspector.getByLabel('キャラクター')
const emotionSelect = inspector.getByLabel('表情')
const effectSelect = inspector.getByLabel('顔エフェクト')
if (!await inspector.locator('.live-face-frame img').isVisible()) throw new Error('再生前の顔画像が表示されていません')
await speakerSelect.selectOption(player.id)
if (!await inspector.getByText(typeName(player), { exact: true }).isVisible()) throw new Error('プレイヤーのメッセージタイプが表示されていません')
await emotionSelect.selectOption('anger')
await effectSelect.selectOption('monitor')
if (!await inspector.locator('.live-face-frame.effect-monitor').isVisible()) throw new Error('モニターエフェクトが常時プレビューへ反映されていません')
await speakerSelect.selectOption(npc.id)
if (!await inspector.getByText(typeName(npc), { exact: true }).isVisible()) throw new Error('NPC変更時にメッセージタイプが自動切替されません')
await speakerSelect.selectOption(player.id)
if (!await inspector.getByText(typeName(player), { exact: true }).isVisible()) throw new Error('プレイヤーへ戻した際にメッセージタイプが自動復帰しません')
if (await page.locator('.preview-overlay').count()) throw new Error('再生していないのに全体プレビューが開いています')
await page.screenshot({ path: 'output/dialogue-live-face-type-1040x1051.png', fullPage: false })

console.log(JSON.stringify({ errors, widths: { sequence: sequenceBox.width, inspector: inspectorBox.width }, state: await page.evaluate(() => window.render_game_to_text?.()) }, null, 2))
await browser.close()
