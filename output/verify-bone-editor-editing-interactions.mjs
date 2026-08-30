import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
page.setDefaultTimeout(8000)
const errors=[]
page.on('console',message=>{ if(message.type()==='error') errors.push(message.text()) })
page.on('pageerror',error=>errors.push(error.stack || error.message))

await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('.project-card').filter({hasText:'鎧デフォルト'}).locator('.project-card-main').click()

const waistItem=page.locator('.layer-item').filter({has:page.locator('.bone-name').filter({hasText:/^腰$/})}).first()
await waistItem.click()
const beforeAdd=await page.evaluate(()=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const id=Object.keys(project.layers).find(layerId=>project.layers[layerId].name==='腰')
  return {id,z:project.defaultFrame[id].z}
})
await page.locator('#addEmptyLayerBtn').click()
const afterAdd=await page.evaluate(({waistId})=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const active=document.querySelector('.layer-item.active')?.dataset.layerId
  const layer=project.layers[active],parent=project.layers[waistId]
  return {id:active,newZ:project.defaultFrame[active].z,waistZ:project.defaultFrame[waistId].z,parent:layer.parent,attached:layer.attached,attachX:layer.attachX,attachY:layer.attachY,parentTailX:parent.tailX,parentTailY:parent.tailY,initialPose:{...project.defaultFrame[active]},list:[...document.querySelectorAll('.layer-item .bone-name')].map(node=>node.textContent)}
},{waistId:beforeAdd.id})

await page.locator('#moveModeBtn').click()
const activeLayer=page.locator(`.layer[data-id="${afterAdd.id}"]`)
const activeBox=await activeLayer.boundingBox()
await page.mouse.move(activeBox.x+activeBox.width/2,activeBox.y+activeBox.height/2)
await page.mouse.down()
await page.mouse.move(activeBox.x+activeBox.width/2+64,activeBox.y+activeBox.height/2+38,{steps:5})
await page.mouse.up()
const moved=await page.evaluate(id=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  return {...project.defaultFrame[id]}
},afterAdd.id)

await page.locator('#nameInput').fill('追加ボーンA')
await page.locator('#nameInput').press('Enter')
const afterEnter=await page.evaluate(id=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  return {name:project.layers[id].name,pose:{...project.defaultFrame[id]}}
},afterAdd.id)

await page.locator('#nameInput').fill('追加ボーンB')
await page.locator('.layer-item').filter({has:page.locator('.bone-name',{hasText:'頭'})}).first().click()
const afterBlur=await page.evaluate(id=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  return {name:project.layers[id].name,pose:{...project.defaultFrame[id]}}
},afterAdd.id)

const stage=page.locator('#stage')
const stageBox=await stage.boundingBox()
await page.mouse.move(stageBox.x+stageBox.width*.55,stageBox.y+stageBox.height*.45)
await page.mouse.wheel(0,-320)
const zoomed=await page.evaluate(()=>({transform:document.querySelector('#character').style.transform,left:document.querySelector('#character').style.left,top:document.querySelector('#character').style.top}))
await page.mouse.move(stageBox.x+40,stageBox.y+40)
await page.mouse.down()
await page.mouse.move(stageBox.x+115,stageBox.y+92,{steps:5})
await page.mouse.up()
const panned=await page.evaluate(()=>({transform:document.querySelector('#character').style.transform,left:document.querySelector('#character').style.left,top:document.querySelector('#character').style.top}))

const headItem=page.locator('.layer-item').filter({has:page.locator('.bone-name').filter({hasText:/^頭$/})}).first()
await headItem.click()
const headBefore=await page.evaluate(()=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const id=Object.keys(project.layers).find(layerId=>project.layers[layerId].name==='頭')
  return {id,pose:{...project.defaultFrame[id]}}
})
const headLayer=page.locator(`.layer[data-id="${headBefore.id}"]`)
const headBox=await headLayer.boundingBox()
await page.mouse.move(headBox.x+headBox.width/2,headBox.y+headBox.height/2)
await page.mouse.down()
await page.mouse.move(headBox.x+headBox.width/2+56,headBox.y+headBox.height/2+28,{steps:5})
await page.mouse.up()
const headAfter=await page.evaluate(id=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  return {...project.defaultFrame[id]}
},headBefore.id)

await waistItem.click()
await page.locator('#editImageCropBtn').click()
const cropArea=page.locator('#cropPreviewArea')
const cropBox=await cropArea.boundingBox()
await page.mouse.move(cropBox.x+cropBox.width/2,cropBox.y+cropBox.height/2)
for(let index=0;index<8;index++) await page.mouse.wheel(0,-240)
await page.waitForTimeout(100)
await page.locator('#cropWInput').fill('50')
await page.locator('#cropWInput').press('Tab')
await page.locator('#cropHInput').fill('50')
await page.locator('#cropHInput').press('Tab')
const selection=page.locator('.crop-selection.active')
const selectionBox=await selection.boundingBox()
const cropBeforeMove=await page.evaluate(()=>({x:document.querySelector('#cropXInput').value,y:document.querySelector('#cropYInput').value,w:document.querySelector('#cropWInput').value,h:document.querySelector('#cropHInput').value}))
await page.mouse.move(selectionBox.x+selectionBox.width/2,selectionBox.y+selectionBox.height/2)
await page.mouse.down()
await page.mouse.move(selectionBox.x+selectionBox.width/2+70,selectionBox.y+selectionBox.height/2+45,{steps:6})
await page.mouse.up()
const cropAfterMove=await page.evaluate(()=>({x:document.querySelector('#cropXInput').value,y:document.querySelector('#cropYInput').value,w:document.querySelector('#cropWInput').value,h:document.querySelector('#cropHInput').value}))
await page.mouse.move(cropBox.x+8,cropBox.y+8)
await page.mouse.down()
await page.mouse.move(cropBox.x-142,cropBox.y-122,{steps:6})
await page.mouse.up()
const cropPan=await page.evaluate(()=>{
  const area=document.querySelector('#cropPreviewArea')
  return {scrollLeft:area.scrollLeft,scrollTop:area.scrollTop,zoom:document.querySelector('#cropZoomValue')?.textContent}
})

await page.screenshot({path:'output/bone-editor-editing-interactions.png',fullPage:true})
console.log(JSON.stringify({beforeAdd,afterAdd,moved,afterEnter,afterBlur,zoomed,panned,zoomedBoneMove:{before:headBefore.pose,after:headAfter},cropRangeMove:{before:cropBeforeMove,after:cropAfterMove},cropPan,errors},null,2))
await browser.close()
