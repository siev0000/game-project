import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1600,height:1000}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))

await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
const sourceCard=page.locator('.project-card').filter({has:page.locator('.project-card-name',{hasText:/^ver4$/})}).first()
await sourceCard.locator('.project-card-main').click()

async function openRightFootMesh(){
  await page.locator('.layer-item').filter({has:page.locator('.bone-name',{hasText:/^右足$/})}).click()
  await page.locator('#editMeshBindingBtn').click()
  await page.locator('#meshBindingDialog[open]').waitFor()
}

async function readPoints(){
  return page.locator('#meshControlOverlay .mesh-control-point').evaluateAll(points=>points.map(point=>({
    x:Number(point.getAttribute('cx')),
    y:Number(point.getAttribute('cy'))
  })))
}

async function dragPoint(index,dx,dy){
  const point=page.locator(`#meshControlOverlay .mesh-control-point[data-index="${index}"]`)
  const box=await point.boundingBox()
  if(!box) throw new Error(`mesh point ${index} is not visible`)
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2)
  await page.mouse.down()
  await page.mouse.move(box.x+box.width/2+dx,box.y+box.height/2+dy,{steps:8})
  await page.mouse.up()
}

function assertCollinear(points){
  const [start,middle,end]=points
  const cross=(middle.x-start.x)*(end.y-start.y)-(middle.y-start.y)*(end.x-start.x)
  if(Math.abs(cross)>.08) throw new Error(`middle point is not collinear: ${cross}`)
}

await openRightFootMesh()
const lock=page.locator('#meshLockWidthInput')
await lock.check()
let points=await readPoints()
if(points.length<3) throw new Error('three mesh points are required for rectangular mesh verification')

await dragPoint(points.length-1,32,-58)
points=await readPoints()
if(Math.abs(points.at(-1).x-points[0].x)<2) throw new Error('endpoint drag did not tilt the rectangular mesh')
assertCollinear(points)

const widths=[]
for(let index=0;index<points.length;index+=1){
  await page.locator(`#meshControlOverlay .mesh-control-point[data-index="${index}"]`).click()
  widths.push(await page.evaluate(()=>([
    document.getElementById('meshPointLeftInput').value,
    document.getElementById('meshPointRightInput').value
  ])))
}
if(widths.some(width=>JSON.stringify(width)!==JSON.stringify(widths[0]))) throw new Error(`mesh widths are not fixed: ${JSON.stringify(widths)}`)

const beforeMiddleMove=await readPoints()
await dragPoint(1,30,-10)
const afterMiddleMove=await readPoints()
const endpointDeltas=[0,afterMiddleMove.length-1].map(index=>({
  x:afterMiddleMove[index].x-beforeMiddleMove[index].x,
  y:afterMiddleMove[index].y-beforeMiddleMove[index].y
}))
if(endpointDeltas.some(delta=>Math.abs(delta.x)>.08 || Math.abs(delta.y)>.08)){
  throw new Error(`middle-point drag moved an endpoint: ${JSON.stringify(endpointDeltas)}`)
}
const middleDelta={x:afterMiddleMove[1].x-beforeMiddleMove[1].x,y:afterMiddleMove[1].y-beforeMiddleMove[1].y}
if(Math.hypot(middleDelta.x,middleDelta.y)<1) throw new Error(`middle point did not move along the rectangle: ${JSON.stringify(middleDelta)}`)
assertCollinear(afterMiddleMove)

await page.locator('#meshBindingApplyBtn').click()
await page.locator('#meshBindingDialog').waitFor({state:'hidden'})
await openRightFootMesh()
if(!await lock.isChecked()) throw new Error('rectangular mesh setting was not restored after applying')
const restored=await readPoints()
if(JSON.stringify(restored)!==JSON.stringify(afterMiddleMove)) throw new Error('rectangular mesh points were not restored')

await page.screenshot({path:'output/bone-editor-rectangular-mesh.png',fullPage:true})
console.log(JSON.stringify({points:restored,widths,middleDelta,endpointDeltas,errors},null,2))
if(errors.length) throw new Error(`browser errors: ${errors.join(' / ')}`)

await browser.close()
