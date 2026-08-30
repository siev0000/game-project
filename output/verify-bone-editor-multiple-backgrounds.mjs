import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:960}})
const errors=[]
page.on('console',message=>{ if(message.type()==='error') errors.push(message.text()) })
page.on('pageerror',error=>errors.push(error.stack || error.message))
page.on('dialog',dialog=>dialog.accept())

await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('.project-card').filter({has:page.locator('.project-card-name').filter({hasText:/^鎧デフォルト$/})}).locator('.project-card-main').click()
await page.locator('.background-layer-item').last().click()
await page.locator('#backgroundImageInput').setInputFiles('2d_bone_editor_split/part_templates/reference/standard_2d_modular_reference.png')
await page.locator('#backgroundXInput').fill('25')
await page.locator('#backgroundXInput').press('Tab')

await page.locator('#backgroundAddBtn').click()
await page.locator('#backgroundImageInput').setInputFiles('2d_bone_editor_split/part_templates/reference/standard_2d_modular_reference.png')
await page.locator('#backgroundXInput').fill('-70')
await page.locator('#backgroundXInput').press('Tab')
await page.locator('#backgroundYInput').fill('40')
await page.locator('#backgroundYInput').press('Tab')
await page.locator('#backgroundOpacityInput').fill('50')
await page.locator('#backgroundOpacityInput').press('Tab')
await page.locator('#backgroundLayerInput').fill('10')
await page.locator('#backgroundLayerInput').press('Tab')
await page.waitForTimeout(150)

const read=()=>page.evaluate(()=>{
  const state=JSON.parse(window.render_game_to_text())
  const json=JSON.parse(document.querySelector('#jsonArea').value)
  const images=[...document.querySelectorAll('#backgroundImageLayer img[data-background-id]')].map(image=>({
    id:image.dataset.backgroundId,
    display:getComputedStyle(image).display,
    z:Number(getComputedStyle(image).zIndex),
    left:image.style.left,
    top:image.style.top,
    opacity:image.style.opacity
  }))
  return {state,json,images,list:[...document.querySelectorAll('.background-layer-item')].map(item=>item.dataset.layerId)}
})

const beforeReload=await read()
if(beforeReload.state.backgrounds.length!==2) throw new Error(`背景が2枚になっていません: ${beforeReload.state.backgrounds.length}`)
if(beforeReload.images.filter(image=>image.display!=='none').length!==2) throw new Error('2枚の背景画像が同時表示されていません')
if(beforeReload.list.length!==2) throw new Error('左レイヤー一覧へ背景が2項目表示されていません')
if(beforeReload.json.background!==undefined || !Array.isArray(beforeReload.json.backgrounds)) throw new Error('JSONがbackgrounds配列へ移行していません')
if(new Set(beforeReload.images.map(image=>image.z)).size!==2) throw new Error('背景同士の表示順が重複しています')
const positions=beforeReload.state.backgrounds.map(background=>[background.x,background.y,background.opacity])
if(!positions.some(([x])=>x===25) || !positions.some(([x,y,opacity])=>x===-70&&y===40&&opacity===.5)) throw new Error(`背景ごとの設定が独立していません: ${JSON.stringify(positions)}`)

const firstId=beforeReload.state.backgrounds.find(background=>background.x===25).id
await page.locator(`[data-layer-id="background:${firstId}"]`).click()
await page.locator('#backgroundXInput').fill('90')
await page.locator('#backgroundXInput').press('Tab')
const afterIndependentEdit=await read()
const untouched=afterIndependentEdit.state.backgrounds.find(background=>background.id!==firstId)
if(untouched.x!==-70 || untouched.y!==40 || untouched.opacity!==.5) throw new Error('一方の背景編集が別背景へ干渉しました')

await page.evaluate(()=>document.querySelector('#applyJsonBtn').click())
await page.waitForTimeout(150)
const afterReload=await read()
if(afterReload.state.backgrounds.length!==2 || afterReload.images.filter(image=>image.display!=='none').length!==2) throw new Error('JSON再読込後に複数背景が維持されません')
await page.locator('#backgroundAddBtn').click()
if((await page.locator('.background-layer-item').count())!==3) throw new Error('背景の追加を繰り返せません')
await page.locator('#backgroundLayerDeleteBtn').click()
if((await page.locator('.background-layer-item').count())!==2) throw new Error('選択中の背景レイヤーを削除できません')
if(errors.length) throw new Error(`runtime errors: ${errors.join(' | ')}`)

await page.screenshot({path:'output/bone-editor-multiple-backgrounds.png',fullPage:true})
console.log(JSON.stringify({backgrounds:afterReload.state.backgrounds,images:afterReload.images,list:afterReload.list,errors},null,2))
await browser.close()
