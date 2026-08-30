import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createPixelSideProjectBtn').click()
await page.locator('#wholeMoveModeBtn').click()

async function rootState(){
  return page.evaluate(()=>{
    const saved=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
    const rootId=saved.layerOrder.find(id=>!saved.layers[id].parent)
    return {rootId,pose:{...saved.defaultFrame[rootId]},text:JSON.parse(window.render_game_to_text())}
  })
}

async function dragRoot(dx,dy,{shift=false}={}){
  const {rootId}=await rootState()
  const box=await page.locator(`.layer[data-id="${rootId}"]`).boundingBox()
  const x=box.x+box.width/2,y=box.y+box.height/2
  if(shift) await page.keyboard.down('Shift')
  await page.mouse.move(x,y)
  await page.mouse.down()
  await page.mouse.move(x+dx,y+dy,{steps:6})
  await page.mouse.up()
  if(shift) await page.keyboard.up('Shift')
  await page.waitForTimeout(80)
}

const axisVisible=await page.locator('#wholeAxisTools').evaluate(element=>getComputedStyle(element).display)

await page.locator('input[name="wholeMoveAxis"][value="horizontal"]+span').click()
const horizontalBefore=await rootState()
await dragRoot(110,-65)
const horizontalAfter=await rootState()

await page.locator('input[name="wholeMoveAxis"][value="vertical"]+span').click()
const verticalBefore=await rootState()
await dragRoot(90,-100)
const verticalAfter=await rootState()

await page.locator('input[name="wholeMoveAxis"][value="free"]+span').click()
const freeBefore=await rootState()
await dragRoot(75,-55)
const freeAfter=await rootState()

const shiftBefore=await rootState()
await dragRoot(120,-25,{shift:true})
const shiftAfter=await rootState()

await page.locator('input[name="wholeMoveAxis"][value="vertical"]+span').click()
await page.screenshot({path:'output/bone-editor-whole-move-axis-lock.png',fullPage:true})
await page.reload({waitUntil:'networkidle'})
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#recoverDraftBtn').click()
const restored=await rootState()

console.log(JSON.stringify({axisVisible,horizontalBefore,horizontalAfter,verticalBefore,verticalAfter,freeBefore,freeAfter,shiftBefore,shiftAfter,restoredAxis:restored.text.wholeMoveAxis,errors},null,2))
await browser.close()
