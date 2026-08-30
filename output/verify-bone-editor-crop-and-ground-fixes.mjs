import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{ if(message.type()==='error') errors.push(message.text()) })
page.on('pageerror',error=>errors.push(error.stack || error.message))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('.project-card').filter({hasText:'鎧デフォルト'}).locator('.project-card-main').click()
await page.locator('#settingsBtn').click()
await page.locator('#settingGroundEnabled').uncheck()
await page.locator('#settingGroundVisible').check()
await page.locator('#settingGroundY').fill('700')
await page.locator('#settingGroundY').press('Tab')
await page.locator('#settingsCloseBtn').click()
const ground=await page.evaluate(()=>{
  const line=document.querySelector('#groundLine'),rect=line.getBoundingClientRect(),stage=document.querySelector('#stage').getBoundingClientRect()
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  return {enabled:project.meta.ground.enabled,visibleSetting:project.meta.display.groundVisible,display:getComputedStyle(line).display,label:line.querySelector('span')?.textContent,top:rect.top,insideStage:rect.top>=stage.top&&rect.top<=stage.bottom}
})
await page.screenshot({path:'output/bone-editor-ground-visible-with-collision-off.png',fullPage:true})
console.log(JSON.stringify({ground,errors},null,2))
await browser.close()
