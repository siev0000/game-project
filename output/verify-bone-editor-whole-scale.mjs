import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{ if(message.type()==='error') errors.push(message.text()) })
page.on('pageerror',error=>errors.push(error.stack || error.message))
page.on('dialog',dialog=>dialog.accept())
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('.project-card').filter({has:page.locator('.project-card-name').filter({hasText:/^鎧デフォルト$/})}).locator('.project-card-main').click()
await page.locator('#scaleModeBtn').click()
await page.waitForTimeout(100)

const readFrame=()=>page.evaluate(()=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  return {
    frame:project.defaultFrame,
    layers:project.layers,
    mode:JSON.parse(window.render_game_to_text()).editMode,
    overlayDisplay:getComputedStyle(document.querySelector('#wholeScaleOverlay')).display,
    label:document.querySelector('.whole-scale-label').textContent
  }
})
const before=await readFrame()
const beforeBox=await page.locator('#wholeScaleBox').boundingBox()
const handle=await page.locator('.whole-scale-handle.tr').boundingBox()
await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2)
await page.mouse.down()
await page.mouse.move(handle.x+handle.width/2+110,handle.y+handle.height/2-110,{steps:8})
await page.mouse.up()
await page.waitForTimeout(120)
const after=await readFrame()
const afterBox=await page.locator('#wholeScaleBox').boundingBox()
await page.screenshot({path:'output/bone-editor-whole-scale.png',fullPage:true})

const ids=Object.keys(before.frame).filter(id=>after.frame[id])
const ratios=ids.flatMap(id=>[
  after.frame[id].w/before.frame[id].w,
  after.frame[id].h/before.frame[id].h
])
const minRatio=Math.min(...ratios),maxRatio=Math.max(...ratios)
await page.locator('#undoBtn').click()
await page.waitForTimeout(100)
const undone=await readFrame()
const restored=ids.every(id=>['x','y','w','h','r','z'].every(key=>Math.abs(Number(undone.frame[id][key])-Number(before.frame[id][key]))<0.001))
console.log(JSON.stringify({
  mode:before.mode,
  overlayDisplay:before.overlayDisplay,
  beforeBox,
  afterBox,
  fixedBottomLeftDelta:{x:afterBox.x-beforeBox.x,y:(afterBox.y+afterBox.height)-(beforeBox.y+beforeBox.height)},
  scaleRatios:{min:minRatio,max:maxRatio,spread:maxRatio-minRatio},
  labelAfter:after.label,
  undoRestored:restored,
  errors
},null,2))
await browser.close()
