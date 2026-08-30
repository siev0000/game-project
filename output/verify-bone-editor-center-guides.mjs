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
await page.locator('#settingGroundY').fill('650')
await page.locator('#settingGroundY').press('Tab')
await page.locator('#settingsCloseBtn').click()

const read=()=>page.evaluate(()=>{
  const stage=document.querySelector('#stage')
  const ground=document.querySelector('#groundLine')
  const groundMark=document.querySelector('.ground-center-mark')
  const centerX=document.querySelector('.origin-line-x')
  const centerY=document.querySelector('.origin-line-y')
  const centerPoint=document.querySelector('#canvasOriginCross span')
  const state=JSON.parse(window.render_game_to_text())
  return {
    enabled:state.project.centerGuides,
    checked:document.querySelector('#showCenterGuides').checked,
    hiddenClass:stage.classList.contains('hide-center-guides'),
    centerXDisplay:getComputedStyle(centerX).display,
    centerYDisplay:getComputedStyle(centerY).display,
    centerXBackground:getComputedStyle(centerX).backgroundImage,
    centerYBackground:getComputedStyle(centerY).backgroundImage,
    centerPointBorder:getComputedStyle(centerPoint).borderStyle,
    groundBorder:getComputedStyle(ground).borderTopStyle,
    groundCenterBorder:getComputedStyle(groundMark).borderLeftStyle,
    groundCenterDisplay:getComputedStyle(groundMark).display
  }
})

const initial=await read()
await page.locator('#showCenterGuides').uncheck({force:true})
const disabled=await read()
await page.evaluate(()=>document.querySelector('#applyJsonBtn').click())
await page.waitForTimeout(100)
const restoredDisabled=await read()
await page.locator('#showCenterGuides').check({force:true})
await page.waitForTimeout(100)
const enabled=await read()
await page.screenshot({path:'output/bone-editor-center-guides.png',fullPage:true})
console.log(JSON.stringify({initial,disabled,restoredDisabled,enabled,errors},null,2))
await browser.close()
