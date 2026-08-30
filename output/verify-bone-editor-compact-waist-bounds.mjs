import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const rotate=(x,y,degrees)=>{
  const radians=degrees*Math.PI/180
  return {x:x*Math.cos(radians)-y*Math.sin(radians),y:x*Math.sin(radians)+y*Math.cos(radians)}
}

const worldState=(project,frame)=>{
  const cache={}
  const calc=id=>{
    if(cache[id]) return cache[id]
    const layer=project.layers[id],pose=frame[id]
    let anchorX,anchorY,rotation
    if(!layer.parent){anchorX=pose.x;anchorY=pose.y;rotation=pose.r}
    else{
      const parent=calc(layer.parent),parentPose=frame[layer.parent],parentLayer=project.layers[layer.parent]
      const relative=rotate((layer.attachX-parentLayer.ox)*parentPose.w,(layer.attachY-parentLayer.oy)*parentPose.h,parent.rotation)
      const offset=rotate(pose.x,pose.y,parent.rotation)
      anchorX=parent.anchorX+relative.x+offset.x
      anchorY=parent.anchorY+relative.y+offset.y
      rotation=parent.rotation+pose.r
    }
    return cache[id]={anchorX,anchorY,rotation}
  }
  project.layerOrder.forEach(calc)
  return cache
}

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
const library=await page.evaluate(()=>fetch('/api/local/bone-motion-projects',{cache:'no-store'}).then(response=>response.json()))
const source=library.projects.find(entry=>entry.name==='鎧デフォルト').project
const idsByName=Object.fromEntries(Object.entries(source.layers).map(([id,layer])=>[layer.name,id]))
const before=worldState(source,source.defaultFrame)

await page.locator('.project-card').filter({hasText:'鎧デフォルト'}).locator('.project-card-main').click()
const after=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.layer')].map(element=>{
  const name=element.querySelector('.layer-label')?.textContent || ''
  const width=parseFloat(element.style.width),height=parseFloat(element.style.height)
  const [originX,originY]=element.style.transformOrigin.split(' ').map(value=>parseFloat(value)/100)
  return [name,{width,height,anchorX:parseFloat(element.style.left)+originX*width,anchorY:parseFloat(element.style.top)+originY*height}]
})))

const tracked=['腰','胸','頭','右太腿','左太腿']
const anchorDelta=Object.fromEntries(tracked.map(name=>{
  const original=before[idsByName[name]],current=after[name]
  return [name,{x:Math.round((current.anchorX-original.anchorX)*100)/100,y:Math.round((current.anchorY-original.anchorY)*100)/100}]
}))
const result={
  waistHeight:{before:source.defaultFrame[idsByName['腰']].h,after:after['腰'].height},
  anchorDelta,
  sourceVersion:source.meta.rootTorsoBoundsVersion ?? null,
  displayedProject:JSON.parse(await page.evaluate(()=>window.render_game_to_text())).project,
  errors
}
await page.locator('#animationSelect').selectOption({label:'既存モーション'})
result.animationWaistHeights=[]
for(const button of await page.locator('.frame-btn').all()){
  await button.click()
  result.animationWaistHeights.push(Number(await page.locator('.layer').filter({has:page.locator('.layer-label', {hasText:'腰'})}).evaluate(element=>parseFloat(element.style.height))))
}
await page.locator('.layer-item').filter({hasText:'腰'}).click()
await page.screenshot({path:'output/bone-editor-compact-waist-bounds.png',fullPage:true})
console.log(JSON.stringify(result,null,2))
await browser.close()
