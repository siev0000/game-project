import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.waitForFunction(()=>typeof window.replaceCurrentProject==='function')

const setup=await page.evaluate(async()=>{
  const entry=await fetch('/api/local/bone-motion-projects?id=motion_20260816133413_r1zy',{cache:'no-store'}).then(response=>response.json())
  entry.project.meta.display.bones=true
  entry.project.meta.editMode='move'
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const childId=project.layerOrder.find(id=>project.layers[id]?.key==='armRL')
  if(!childId) throw new Error('検証用の右前腕が見つかりません')
  window.selectBoneLayer(childId)
  document.querySelector('#moveModeBtn').click()
  return {childId,childName:project.layers[childId].name}
})

const initial=await page.evaluate(({childId})=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const pose=project.defaultFrame[childId]
  return {
    attached:project.layers[childId].attached!==false,
    detachChecked:document.querySelector('#attachedInput').checked,
    xDisabled:document.querySelector('#xInput').disabled,
    pose:{x:pose.x,y:pose.y}
  }
},setup)
if(!initial.attached || initial.detachChecked || !initial.xDisabled) throw new Error(`初期接続UIが不正です: ${JSON.stringify(initial)}`)

await page.check('#attachedInput')
const detachedBefore=await page.evaluate(({childId})=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const pose=project.defaultFrame[childId]
  return {attached:project.layers[childId].attached!==false,xDisabled:document.querySelector('#xInput').disabled,pose:{x:pose.x,y:pose.y}}
},setup)
if(detachedBefore.attached || detachedBefore.xDisabled) throw new Error(`接続解除が不正です: ${JSON.stringify(detachedBefore)}`)

const point=await page.locator(`.bone-overlay-item[data-id="${setup.childId}"] polygon`).evaluate(element=>{
  const rect=element.getBoundingClientRect()
  return {x:rect.left+rect.width/2,y:rect.top+rect.height/2}
})
await page.mouse.move(point.x,point.y)
await page.mouse.down()
await page.mouse.move(point.x+36,point.y+24,{steps:5})
await page.mouse.up()
const detachedAfter=await page.evaluate(({childId})=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const pose=project.defaultFrame[childId]
  return {x:pose.x,y:pose.y}
},setup)
if(detachedAfter.x===detachedBefore.pose.x && detachedAfter.y===detachedBefore.pose.y) throw new Error('接続解除後もボーンを移動できません')

await page.uncheck('#attachedInput')
const reconnected=await page.evaluate(({childId})=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const layer=project.layers[childId]
  const parent=project.layers[layer.parent]
  const frame=project.defaultFrame
  const world=window.getWorldState(frame)
  const parentPoint=window.parentAttachWorldPosition(layer,world,frame)
  const child=world[childId]
  const childHead=window.localPointToWorld(child,layer.headX*child.pose.w,layer.headY*child.pose.h)
  const allFrames=[project.defaultFrame,...project.animations.flatMap(animation=>animation.frames)]
  const framesSnapped=allFrames.every(item=>{
    const expected=window.attachedPoseOffset(layer,item[childId])
    return Math.abs(item[childId].x-expected.x)<0.001 && Math.abs(item[childId].y-expected.y)<0.001
  })
  return {
    attached:layer.attached!==false,
    detachChecked:document.querySelector('#attachedInput').checked,
    xDisabled:document.querySelector('#xInput').disabled,
    attachMatchesTail:Math.abs(layer.attachX-parent.tailX)<0.001 && Math.abs(layer.attachY-parent.tailY)<0.001,
    jointDistance:Math.hypot(parentPoint.x-childHead.x,parentPoint.y-childHead.y),
    framesSnapped,
    pose:{x:frame[childId].x,y:frame[childId].y,r:frame[childId].r}
  }
},setup)
if(!reconnected.attached || reconnected.detachChecked || !reconnected.xDisabled || !reconnected.attachMatchesTail || reconnected.jointDistance>.02 || !reconnected.framesSnapped){
  throw new Error(`再接続が不正です: ${JSON.stringify(reconnected)}`)
}

const lockedPoint=await page.locator(`.bone-overlay-item[data-id="${setup.childId}"] polygon`).evaluate(element=>{
  const rect=element.getBoundingClientRect()
  return {x:rect.left+rect.width/2,y:rect.top+rect.height/2}
})
await page.mouse.move(lockedPoint.x,lockedPoint.y)
await page.mouse.down()
await page.mouse.move(lockedPoint.x+42,lockedPoint.y+28,{steps:5})
await page.mouse.up()
const lockedAfterDrag=await page.evaluate(({childId})=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  return {x:project.defaultFrame[childId].x,y:project.defaultFrame[childId].y}
},setup)
if(lockedAfterDrag.x!==reconnected.pose.x || lockedAfterDrag.y!==reconnected.pose.y) throw new Error(`接続中に移動しました: ${JSON.stringify({before:reconnected.pose,after:lockedAfterDrag})}`)

await page.click('#rotateModeBtn')
await page.locator('#rInput').fill(String(reconnected.pose.r+25))
await page.locator('#rInput').dispatchEvent('change')
const rotated=await page.evaluate(({childId})=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const layer=project.layers[childId]
  const frame=project.defaultFrame
  const world=window.getWorldState(frame)
  const parentPoint=window.parentAttachWorldPosition(layer,world,frame)
  const child=world[childId]
  const childHead=window.localPointToWorld(child,layer.headX*child.pose.w,layer.headY*child.pose.h)
  return {r:frame[childId].r,jointDistance:Math.hypot(parentPoint.x-childHead.x,parentPoint.y-childHead.y)}
},setup)
if(rotated.r!==reconnected.pose.r+25 || rotated.jointDistance>.02) throw new Error(`接続中の回転補正が不正です: ${JSON.stringify(rotated)}`)

await page.screenshot({path:'output/bone-editor-parent-joint-lock.png',fullPage:true})
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({setup,initial,detachedBefore,detachedAfter,reconnected,lockedAfterDrag,rotated,errors}))
await browser.close()
