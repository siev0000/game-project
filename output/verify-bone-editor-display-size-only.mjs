import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('.project-card-main').filter({ hasText: 'pixel_side_motion' }).click()
await page.waitForTimeout(350)
await page.locator('#showBones').evaluate(input => {
  if (!input.checked) {
    input.checked = true
    input.dispatchEvent(new Event('change', { bubbles:true }))
  }
})
await page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: /^右上腕$/ }) }).click()

const readState = () => page.evaluate(() => {
  const selected = document.querySelector('#stage .layer.selected')
  const shape = selected?.querySelector('.shape')
  const imageTransform = selected?.querySelector('.image-transform')
  const box = document.querySelector('#resizeBox')
  const rect = element => {
    const value = element.getBoundingClientRect()
    return { x:value.x, y:value.y, width:value.width, height:value.height }
  }
  const meshSignature = [...document.querySelectorAll('.mesh-binding-canvas')].map(canvas => {
    const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data
    let hash=2166136261
    for(let index=0;index<data.length;index+=97) hash=Math.imul(hash^data[index],16777619)
    return hash>>>0
  }).join(',')
  return {
    layerId:selected?.dataset.id,
    layer:rect(selected),
    shape:rect(shape),
    image:rect(imageTransform),
    meshSignature,
    box:rect(box),
    w:document.querySelector('#wInput').value,
    h:document.querySelector('#hInput').value,
    wDisabled:document.querySelector('#wInput').disabled,
    hDisabled:document.querySelector('#hInput').disabled,
    displayW:document.querySelector('#boneDisplayWidthInput').value,
    displayH:document.querySelector('#boneDisplayHeightInput').value,
    boxStyle:{width:parseFloat(box.style.width),height:parseFloat(box.style.height)},
    mode:document.querySelector('#boneDisplaySizeModeInput').checked,
    json:document.querySelector('#jsonArea').value
  }
})

const before = await readState()
await page.locator('#boneDisplaySizeModeInput').check()
await page.locator('#boneDisplayWidthInput').fill('40')
await page.locator('#boneDisplayWidthInput').press('Enter')
const afterWidthOnly = await readState()
await page.locator('#boneDisplayHeightInput').fill('95')
await page.locator('#boneDisplayHeightInput').press('Enter')
await page.waitForTimeout(100)
const afterInput = await readState()

if (!afterInput.mode || !afterInput.wDisabled || !afterInput.hDisabled) throw new Error('表示サイズ調整ON中にW/Hが保護されていません')
if (afterInput.w !== before.w || afterInput.h !== before.h) throw new Error('表示W/Hの変更で実ボーンW/Hが変化しました')
if (Math.abs(afterInput.layer.width - before.layer.width) > .1 || Math.abs(afterInput.layer.height - before.layer.height) > .1) throw new Error('表示W/Hの変更で画像用レイヤー寸法が変化しました')
if (Math.abs(afterInput.image.width - before.image.width) > .1 || Math.abs(afterInput.image.height - before.image.height) > .1) throw new Error('表示W/Hの変更で画像寸法が変化しました')
if (afterInput.meshSignature !== before.meshSignature) throw new Error('表示W/Hの変更でメッシュ画像が変化しました')
if (Number(afterWidthOnly.displayW)!==40 || Number(afterWidthOnly.displayH)!==Number(before.displayH)) throw new Error('横幅だけの変更が縦幅へ干渉しました')
if (afterInput.boxStyle.width!==40 || afterInput.boxStyle.height!==95) throw new Error(`選択枠が表示W/Hへ追従していません: ${JSON.stringify(afterInput.boxStyle)}`)
if (!afterInput.json.includes('"editorBoneDisplayW": 40') || !afterInput.json.includes('"editorBoneDisplayH": 95')) throw new Error('表示W/HがJSONへ出力されていません')
if (afterInput.json.includes('"editorBoneScale"')) throw new Error('旧一括倍率が新設定後も残っています')

const handle = page.locator('#resizeBox .resize-handle.br')
const handleBox = await handle.boundingBox()
const start = { x:handleBox.x + handleBox.width / 2, y:handleBox.y + handleBox.height / 2 }
await page.mouse.move(start.x,start.y)
await page.mouse.down()
await page.mouse.move(start.x+35,start.y+18,{steps:5})
await page.mouse.up()
await page.waitForTimeout(100)
const afterDrag = await readState()

if (Number(afterDrag.displayW)===40 && Number(afterDrag.displayH)===95) throw new Error('四隅ドラッグで表示W/Hが変更されません')
if (afterDrag.w !== before.w || afterDrag.h !== before.h) throw new Error('表示W/Hドラッグで実ボーンW/Hが変化しました')
if (Math.abs(afterDrag.image.width - before.image.width) > .1 || Math.abs(afterDrag.image.height - before.image.height) > .1) throw new Error('表示W/Hドラッグで画像寸法が変化しました')
if (afterDrag.meshSignature !== before.meshSignature) throw new Error('表示W/Hドラッグでメッシュ画像が変化しました')
if (errors.length) throw new Error(`runtime errors: ${errors.join(' | ')}`)

await page.screenshot({ path:'output/bone-editor-display-size-only.png', fullPage:true })
console.log(JSON.stringify({ before:{...before,json:'omitted'}, afterWidthOnly:{...afterWidthOnly,json:'omitted'}, afterInput:{...afterInput,json:'omitted'}, afterDrag:{...afterDrag,json:'omitted'}, errors }, null, 2))
await browser.close()
