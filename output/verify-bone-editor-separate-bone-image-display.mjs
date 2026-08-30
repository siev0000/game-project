import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createProjectBtn').click()
await page.locator('.layer-item').filter({ hasText: '胸' }).click()
const sourceSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><circle cx="80" cy="80" r="72" fill="#ff4d8d"/><path d="M30 80h100" stroke="#fff" stroke-width="16"/></svg>`
await page.locator('#replaceImageInput').setInputFiles({ name: 'display-test.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(sourceSvg) })
await page.locator('#imageCropDialog[open]').waitFor()
await page.locator('#imageCropApplyBtn').click()
await page.locator('#imageCropDialog').waitFor({ state: 'hidden' })

const visibleState = () => page.evaluate(() => ({
  visibleBones: [...document.querySelectorAll('.layer-visual .shape')].filter(el => getComputedStyle(el).display !== 'none').length,
  visibleImages: [...document.querySelectorAll('.layer-visual .image-transform')].filter(el => getComputedStyle(el).display !== 'none' && el.querySelector('img')?.src).length,
  visibleBoneOverlays: [...document.querySelectorAll('.connections,.bone-tail,.layer-label,.anchor-ring,.resize-overlay')].filter(el => getComputedStyle(el).display !== 'none').length,
  bonesToggle: document.querySelector('#showBones')?.checked,
  imagesToggle: document.querySelector('#showImages')?.checked,
  stageClasses: document.querySelector('#stage')?.className
}))

await page.locator('label.toggle-icon').filter({ has: page.locator('#showBones') }).click()
const imageOnly = await visibleState()
await page.screenshot({ path: 'output/bone-editor-image-only-display.png', fullPage: true })

await page.locator('label.toggle-icon').filter({ has: page.locator('#showBones') }).click()
await page.locator('label.toggle-icon').filter({ has: page.locator('#showImages') }).click()
const bonesOnly = await visibleState()
await page.screenshot({ path: 'output/bone-editor-bones-only-display.png', fullPage: true })

await page.locator('label.toggle-icon').filter({ has: page.locator('#showImages') }).click()
const both = await visibleState()
await page.locator('label.toggle-icon').filter({ has: page.locator('#showBones') }).click()
await page.locator('label.toggle-icon').filter({ has: page.locator('#showImages') }).click()
const neither = await visibleState()

await page.locator('#settingsBtn').click()
const settingsMirror = await page.evaluate(() => ({
  bones: document.querySelector('#settingBones')?.checked,
  images: document.querySelector('#settingImages')?.checked
}))

console.log(JSON.stringify({ imageOnly, bonesOnly, both, neither, settingsMirror, errors }, null, 2))
await browser.close()
