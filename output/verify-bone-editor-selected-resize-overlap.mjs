import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.waitForFunction(()=>typeof window.replaceCurrentProject==='function')
const setup=await page.evaluate(async()=>{
  const entry=await fetch('/api/local/bone-motion-projects?id=motion_20260815095021_85vj',{cache:'no-store'}).then(response=>response.json())
  entry.project.meta.display.bones=true
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  let overlap=null
  for(const selectedId of project.layerOrder){
    window.selectBoneLayer(selectedId)
    for(const handle of document.querySelectorAll('#resizeBox .resize-handle')){
      const rect=handle.getBoundingClientRect()
      const x=rect.left+rect.width/2
      const y=rect.top+rect.height/2
      const elements=document.elementsFromPoint(x,y)
      const polygon=elements.find(element=>element.tagName?.toLowerCase()==='polygon' && element.closest('.bone-overlay-item')?.dataset.id!==selectedId)
      if(!polygon) continue
      const frame=project.defaultFrame[selectedId]
      overlap={selectedId,selectedName:project.layers[selectedId].name,targetId:polygon.closest('.bone-overlay-item').dataset.id,x,y,corner:handle.dataset.corner,topClass:document.elementFromPoint(x,y)?.className || '',beforeW:Number(frame.w),beforeH:Number(frame.h)}
      break
    }
    if(overlap) break
  }
  if(!overlap) throw new Error('リサイズハンドルと他ボーンが重なる検証箇所を取得できません')
  return overlap
})
await page.mouse.move(setup.x,setup.y)
await page.mouse.down()
await page.mouse.move(setup.x+18,setup.y+14,{steps:4})
await page.mouse.up()
const result=await page.evaluate(setup=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const frame=project.defaultFrame[setup.selectedId]
  return {selectedName:document.querySelector('#nameInput')?.value || '',afterW:Number(frame.w),afterH:Number(frame.h),characterZ:Number(getComputedStyle(document.querySelector('#character')).zIndex),resizeZ:Number(getComputedStyle(document.querySelector('#resizeOverlay')).zIndex)}
},setup)
if(!String(setup.topClass).includes('resize-handle') || result.selectedName!==setup.selectedName || (Math.abs(result.afterW-setup.beforeW)<1 && Math.abs(result.afterH-setup.beforeH)<1) || result.resizeZ<=result.characterZ) throw new Error(`他ボーンと重なったリサイズハンドルを操作できません: ${JSON.stringify({setup,result})}`)
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
await page.screenshot({path:'output/bone-editor-selected-resize-overlap.png',fullPage:true})
console.log(JSON.stringify({setup,result,errors}))
await browser.close()
