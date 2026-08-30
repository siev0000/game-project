import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{ if(message.type()==='error') errors.push(message.text()) })
page.on('pageerror',error=>errors.push(error.stack || error.message))
page.on('dialog',dialog=>dialog.accept())
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('.project-card').filter({has:page.locator('.project-card-name').filter({hasText:/^鎧デフォルト$/})}).locator('.project-card-main').click()
await page.locator('#settingsBtn').click()
await page.locator('#backgroundImageInput').setInputFiles('2d_bone_editor_split/part_templates/reference/standard_2d_modular_reference.png')
await page.locator('#backgroundAdjustBtn').click()
await page.waitForTimeout(100)

const characterBox=await page.locator('#character').boundingBox()
const crossBox=await page.locator('#canvasOriginCross').boundingBox()
const dragStart={x:characterBox.x+characterBox.width/2,y:characterBox.y+characterBox.height/2+130}
await page.mouse.move(dragStart.x,dragStart.y)
await page.mouse.down()
await page.mouse.move(dragStart.x+72,dragStart.y+36,{steps:6})
await page.mouse.up()
await page.mouse.move(dragStart.x+72,dragStart.y+36)
await page.mouse.wheel(0,-120)
await page.waitForTimeout(350)

const active=await page.evaluate(()=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const toolbar=getComputedStyle(document.querySelector('#backgroundAdjustToolbar'))
  return {
    background:project.background,
    mode:document.querySelector('#stage').classList.contains('background-adjust-mode'),
    toolbarDisplay:toolbar.display,
    toolbarValue:document.querySelector('#backgroundAdjustValue').textContent,
    selectedBone:JSON.parse(window.render_game_to_text()).selectedBone?.id || null
  }
})
await page.screenshot({path:'output/bone-editor-background-direct-adjust.png',fullPage:true})
await page.locator('#backgroundAdjustDoneBtn').click()
await page.waitForTimeout(100)
await page.locator('.layer.interactive:visible').last().click({force:true})
const finished=await page.evaluate(()=>({
  mode:document.querySelector('#stage').classList.contains('background-adjust-mode'),
  toolbarDisplay:getComputedStyle(document.querySelector('#backgroundAdjustToolbar')).display,
  selectedBone:JSON.parse(window.render_game_to_text()).selectedBone?.id || null
}))
const centers={
  character:{x:characterBox.x+characterBox.width/2,y:characterBox.y+characterBox.height/2},
  cross:{x:crossBox.x+crossBox.width/2,y:crossBox.y+crossBox.height/2}
}
console.log(JSON.stringify({active,finished,centers,errors},null,2))
await browser.close()
