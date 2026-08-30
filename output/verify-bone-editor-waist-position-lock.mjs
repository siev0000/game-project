import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:960}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))
page.on('dialog',dialog=>dialog.accept())

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('.project-card-main').filter({hasText:'pixel_side_motion'}).click()
const waistItem=page.locator('.layer-item').filter({has:page.locator('.bone-name',{hasText:/^腰$/})})
await waistItem.click()
await page.locator('#moveModeBtn').click()

const row=page.locator('#waistPositionLockRow')
if(await row.isHidden()) throw new Error('腰の位置固定が腰設定に表示されません')
const before=JSON.parse(await page.locator('#jsonArea').inputValue())
const waistId=before.layerOrder.find(id=>before.layers[id]?.key==='waist' || before.layers[id]?.name==='腰')
const beforePose={...before.defaultFrame[waistId]}

await page.locator('#waistPositionLockInput').check()
if(!await page.locator('#xInput').isDisabled() || !await page.locator('#yInput').isDisabled()) throw new Error('固定中もX/Y入力が有効です')
const box=await page.locator('#resizeBox').boundingBox()
await page.mouse.move(box.x+box.width/2,box.y+box.height/2)
await page.mouse.down()
await page.mouse.move(box.x+box.width/2+70,box.y+box.height/2+45,{steps:8})
await page.mouse.up()
await page.waitForTimeout(80)

const locked=JSON.parse(await page.locator('#jsonArea').inputValue())
const lockedPose=locked.defaultFrame[waistId]
if(lockedPose.x!==beforePose.x || lockedPose.y!==beforePose.y) throw new Error(`固定中に腰が移動しました: ${beforePose.x},${beforePose.y} -> ${lockedPose.x},${lockedPose.y}`)
if(locked.layers[waistId].positionLocked!==true) throw new Error('固定状態がJSONへ保存されません')

await page.locator('#applyJsonBtn').evaluate(button=>button.click())
await page.waitForTimeout(80)
await waistItem.click()
await page.locator('#moveModeBtn').click()
if(!await page.locator('#waistPositionLockInput').isChecked()) throw new Error('JSON再読込後に固定状態が復元されません')

await page.locator('#waistPositionLockInput').uncheck()
const unlockedBox=await page.locator('#resizeBox').boundingBox()
await page.mouse.move(unlockedBox.x+unlockedBox.width/2,unlockedBox.y+unlockedBox.height/2)
await page.mouse.down()
await page.mouse.move(unlockedBox.x+unlockedBox.width/2+45,unlockedBox.y+unlockedBox.height/2+25,{steps:6})
await page.mouse.up()
await page.waitForTimeout(80)
const unlocked=JSON.parse(await page.locator('#jsonArea').inputValue())
const unlockedPose=unlocked.defaultFrame[waistId]
if(unlockedPose.x===beforePose.x && unlockedPose.y===beforePose.y) throw new Error('固定OFFでも腰が移動できません')
if('positionLocked' in unlocked.layers[waistId]) throw new Error('固定OFF後もJSONに固定状態が残っています')

await waistItem.click()
await page.locator('#waistPositionLockInput').check()
await page.screenshot({path:'output/bone-editor-waist-position-lock.png',fullPage:true})
if(errors.length) throw new Error(errors.join(' | '))
console.log(JSON.stringify({waistId,beforePose,lockedPose,unlockedPose,jsonReloaded:true,errors},null,2))
await browser.close()
