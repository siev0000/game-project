import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text())
})
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createStandardProjectBtn').click()

await page.locator('#motionManagerBtn').click()
await page.locator('#newMotionNameInput').fill('検証アニメーション')
await page.locator('#createMotionBtn').click()
await page.locator('#fpsInput').fill('12')
await page.locator('#fpsInput').press('Enter')
await page.locator('#saveMenuBtn').click()
await page.locator('#projectNameInput').fill('自動検証モーション')
page.once('dialog', dialog => dialog.accept())
await page.locator('#saveSourceJsonBtn').click()
await page.waitForFunction(() => Boolean(currentSourceProjectId) && !document.querySelector('#saveDialog').open)

const savedEntry = await page.evaluate(async () => {
  const response = await fetch('/api/local/bone-motion-projects', { cache: 'no-store' })
  const library = await response.json()
  return library.projects.find(item => item.name === '自動検証モーション')
})

await page.locator('#saveMenuBtn').click()
page.once('dialog', dialog => dialog.accept())
await page.locator('#saveSourceAsJsonBtn').click()
const unchangedRejected=await page.evaluate(id=>({dialogOpen:document.querySelector('#saveDialog').open,currentId:currentSourceProjectId,sameId:currentSourceProjectId===id}),savedEntry.id)
if(!unchangedRejected.dialogOpen||!unchangedRejected.sameId) throw new Error(`同名の別名保存抑止が不正です: ${JSON.stringify(unchangedRejected)}`)
await page.locator('#projectNameInput').fill('自動検証モーション 別名')
await page.screenshot({ path: 'output/bone-editor-save-as.png', fullPage: true })
page.once('dialog', dialog => dialog.accept())
await page.locator('#saveSourceAsJsonBtn').click()
await page.waitForFunction(name => currentSourceProjectId && project.meta.name === name && !document.querySelector('#saveDialog').open, '自動検証モーション 別名')
const savedAsEntry = await page.evaluate(async originalId => {
  const response = await fetch('/api/local/bone-motion-projects', { cache: 'no-store' })
  const library = await response.json()
  const copy = library.projects.find(item => item.name === '自動検証モーション 別名')
  return {copy, currentId:currentSourceProjectId, originalStillExists:library.projects.some(item=>item.id===originalId)}
}, savedEntry.id)
if(!savedAsEntry.copy || savedAsEntry.copy.id===savedEntry.id || savedAsEntry.currentId!==savedAsEntry.copy.id || !savedAsEntry.originalStillExists) throw new Error(`別名保存が不正です: ${JSON.stringify(savedAsEntry)}`)

await page.locator('#projectListBtn').click()
await page.locator('.project-card').filter({ hasText: '自動検証モーション 別名' }).waitFor()
await page.screenshot({ path: 'output/bone-editor-source-project-list.png', fullPage: true })
await page.locator('.project-card').filter({ hasText: '自動検証モーション 別名' }).locator('.project-card-main').click()
await page.locator('#animationSelect').selectOption({ label: '検証アニメーション' })
const reopened = await page.evaluate(() => ({
  title: document.querySelector('#currentProjectName')?.textContent,
  fps: document.querySelector('#fpsInput')?.value
}))

await page.locator('.layer-item').filter({ hasText: '胸' }).click()
const sourceSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360"><rect width="240" height="120" fill="#f66"/><rect y="120" width="240" height="120" fill="#6f6"/><rect y="240" width="240" height="120" fill="#66f"/></svg>`
await page.locator('#replaceImageInput').setInputFiles({ name: 'live-rotation.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(sourceSvg) })
await page.locator('#imageCropDialog[open]').waitFor()
const handle = page.locator('#cropImageRotateHandle')
const box = await handle.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2, { steps: 5 })
const duringDrag = await page.evaluate(() => ({
  angle: document.querySelector('#cropHeaderRotationValue')?.textContent,
  imageTransform: document.querySelector('#cropEditorImage')?.style.transform,
  dragging: document.querySelector('#cropImageRotateHandle')?.classList.contains('dragging')
}))
await page.screenshot({ path: 'output/bone-editor-source-library-live-rotation.png', fullPage: true })
await page.mouse.up()
await page.locator('#imageCropCancelBtn').click()

await page.locator('#saveMenuBtn').click()
page.once('dialog', dialog => dialog.accept())
await page.locator('#initializeProjectBtn').click()
const initialized = await page.evaluate(() => ({
  title: document.querySelector('#currentProjectName')?.textContent,
  bones: document.querySelectorAll('.layer-item').length,
  frames: document.querySelectorAll('.frame-btn').length,
  sourceId: localStorage.getItem('bone_editor_current_source_project_v1')
}))

if (savedEntry?.id || savedAsEntry.copy?.id) {
  await page.evaluate(async ids => {
    for(const id of ids.filter(Boolean)) await fetch('/api/local/bone-motion-projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
  }, [savedEntry?.id,savedAsEntry.copy?.id])
}

console.log(JSON.stringify({
  saved: savedEntry ? { id: savedEntry.id, name: savedEntry.name, fps: savedEntry.project.animations?.[0]?.fps } : null,
  savedAs: savedAsEntry.copy ? { id:savedAsEntry.copy.id,name:savedAsEntry.copy.name,originalStillExists:savedAsEntry.originalStillExists } : null,
  unchangedRejected,
  reopened,
  duringDrag,
  initialized,
  errors
}, null, 2))
await browser.close()
