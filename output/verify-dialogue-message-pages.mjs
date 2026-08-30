import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1040, height: 1051 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://192.168.0.209:5173/dialogue-events', { waitUntil: 'networkidle' })
await page.locator('.event-card').first().click()
await page.locator('.sequence-card').first().click()
const textarea = page.locator('.message-section textarea')
await textarea.fill('one\ntwo\nthree\nfour\nfive\nsix')
await page.getByRole('button', { name: 'この発言を確認' }).click()
await page.waitForTimeout(1500)

const firstLines = await page.locator('.preview-overlay .dialogue-line').allTextContents()
const firstContentBox = await page.locator('.preview-overlay .dialogue-content').boundingBox()
if (firstLines.length !== 4 || firstLines.join('|') !== 'one|two|three|four') throw new Error(`1ページ目が4行に制限されていません: ${firstLines.join('|')}`)
if (!firstContentBox || Math.round(firstContentBox.height) !== 140) throw new Error(`本文枠の高さが固定されていません: ${firstContentBox?.height}`)

await page.locator('.preview-overlay .dialogue-window').click()
await page.waitForTimeout(700)
const secondLines = await page.locator('.preview-overlay .dialogue-line').allTextContents()
const secondContentBox = await page.locator('.preview-overlay .dialogue-content').boundingBox()
if (secondLines.length !== 2 || secondLines.join('|') !== 'five|six') throw new Error(`2ページ目へ送れていません: ${secondLines.join('|')}`)
if (!secondContentBox || Math.round(secondContentBox.height) !== 140) throw new Error(`ページ送り後に本文枠の高さが変化しました: ${secondContentBox?.height}`)
await page.screenshot({ path: 'output/dialogue-message-pages-1040x1051.png', fullPage: false })
console.log(JSON.stringify({ errors, firstLines, secondLines, firstHeight: firstContentBox.height, secondHeight: secondContentBox.height }, null, 2))
await browser.close()
