import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{ if(message.type()==='error') errors.push(message.text()) })
page.on('pageerror',error=>errors.push(error.stack || error.message))
page.on('dialog',dialog=>dialog.accept())
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('.project-card').filter({has:page.locator('.project-card-name').filter({hasText:/^鎧デフォルト$/})}).locator('.project-card-main').click()
await page.locator('.background-layer-item').click()
await page.locator('#backgroundImageInput').setInputFiles('2d_bone_editor_split/part_templates/reference/standard_2d_modular_reference.png')
await page.locator('#backgroundOpacityInput').fill('60')
await page.locator('#backgroundOpacityInput').press('Tab')

const read=()=>page.evaluate(()=>{
  const state=JSON.parse(window.render_game_to_text())
  const visibleBones=[...document.querySelectorAll('.layer.interactive')].filter(element=>getComputedStyle(element).display!=='none')
  const boneZ=visibleBones.map(element=>Number(getComputedStyle(element).zIndex)||0)
  const meshZ=[...document.querySelectorAll('.mesh-binding-canvas')].filter(element=>getComputedStyle(element).display!=='none').map(element=>Number(getComputedStyle(element).zIndex)||0)
  const list=[...document.querySelectorAll('#layerList>.layer-item')].map(element=>element.dataset.layerId)
  return {
    layerNo:state.background.layerNo,
    input:Number(document.querySelector('#backgroundLayerInput').value),
    max:Number(document.querySelector('#backgroundLayerInput').max),
    backgroundZ:Number(getComputedStyle(document.querySelector('#backgroundImageLayer')).zIndex),
    boneZ,
    meshZ,
    list,
    backgroundListIndex:list.indexOf('background')
  }
})

const initial=await read()
for(let index=0;index<4;index++) await page.locator('.background-layer-item .z-front').click()
const arrowMoved=await read()
await page.locator('#backgroundLayerInput').fill(String(arrowMoved.max))
await page.locator('#backgroundLayerInput').press('Tab')
const front=await read()
await page.locator('.background-layer-item').dragTo(page.locator('.layer-item:not(.background-layer-item)').nth(6))
await page.waitForTimeout(150)
const dragged=await read()
await page.screenshot({path:'output/bone-editor-background-layer-order.png',fullPage:true})
await page.evaluate(()=>document.querySelector('#applyJsonBtn').click())
await page.waitForTimeout(100)
const restored=await read()
console.log(JSON.stringify({initial,arrowMoved,front,dragged,restored,errors},null,2))
await browser.close()
