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
const selectedBeforeImage=await page.evaluate(()=>({
  target:JSON.parse(window.render_game_to_text()).selectedTarget,
  title:document.querySelector('#inspectorTitle').textContent,
  backgroundInspectorHidden:document.querySelector('#backgroundInspector').hidden,
  boneInspectorHidden:document.querySelector('#boneInspector').hidden,
  lastLayerIsBackground:document.querySelector('#layerList').lastElementChild.classList.contains('background-layer-item')
}))
await page.locator('#backgroundImageInput').setInputFiles('2d_bone_editor_split/part_templates/reference/standard_2d_modular_reference.png')
await page.waitForTimeout(120)
const stageBox=await page.locator('#stage').boundingBox()
const start={x:stageBox.x+stageBox.width*.54,y:stageBox.y+stageBox.height*.56}
await page.mouse.move(start.x,start.y)
await page.mouse.down()
await page.mouse.move(start.x+64,start.y+32,{steps:6})
await page.mouse.up()
await page.mouse.wheel(0,-100)
await page.waitForTimeout(350)
await page.locator('#backgroundOpacityInput').fill('60')
await page.locator('#backgroundOpacityInput').press('Tab')
await page.locator('#backgroundFlipXInput').check()
await page.waitForTimeout(100)

const backgroundState=await page.evaluate(()=>{
  const state=JSON.parse(window.render_game_to_text())
  const layer=document.querySelector('#backgroundImageLayer')
  const boneZ=[...document.querySelectorAll('.layer.interactive')].filter(element=>getComputedStyle(element).display!=='none').map(element=>Number(getComputedStyle(element).zIndex)||0)
  return {
    target:state.selectedTarget,
    background:state.background,
    stageAdjusting:document.querySelector('#stage').classList.contains('background-adjust-mode'),
    backgroundZ:Number(getComputedStyle(layer).zIndex),
    minimumBoneZ:Math.min(...boneZ),
    inspectorTitle:document.querySelector('#inspectorTitle').textContent,
    layerStatus:document.querySelector('.background-layer-item .layer-meta').textContent
  }
})
await page.screenshot({path:'output/bone-editor-background-layer-inspector.png',fullPage:true})

await page.locator('.layer-item:not(.background-layer-item)').first().click()
await page.waitForTimeout(100)
const boneState=await page.evaluate(()=>({
  target:JSON.parse(window.render_game_to_text()).selectedTarget,
  title:document.querySelector('#inspectorTitle').textContent,
  backgroundInspectorHidden:document.querySelector('#backgroundInspector').hidden,
  boneInspectorHidden:document.querySelector('#boneInspector').hidden,
  stageAdjusting:document.querySelector('#stage').classList.contains('background-adjust-mode')
}))
console.log(JSON.stringify({selectedBeforeImage,backgroundState,boneState,errors},null,2))
await browser.close()
