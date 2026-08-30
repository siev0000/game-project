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
  entry.project.meta.display.bones=false
  entry.project.meta.editMode='rotate'
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  const shape=[...document.querySelectorAll('.bone-overlay-shape')].find(item=>{
    const rect=item.getBoundingClientRect()
    return rect.width>35 && rect.height>35 && rect.left>300 && rect.right<1100 && rect.top>100 && rect.bottom<720
  })
  if(!shape) throw new Error('非表示時の操作枠が見つかりません')
  const rect=shape.getBoundingClientRect()
  const x=rect.left+rect.width*.5
  const y=rect.top+rect.height*.5
  const top=document.elementFromPoint(x,y)
  const id=top?.closest('.bone-overlay-item')?.dataset.id
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  return {id,name:project.layers[id].name,before:Number(project.defaultFrame[id].r),shapeOpacity:getComputedStyle(shape).opacity,topClass:top?.className,x,y}
})
await page.mouse.move(setup.x,setup.y)
await page.mouse.down()
await page.mouse.move(setup.x+28,setup.y+14,{steps:4})
await page.mouse.up()
const result=await page.evaluate(setup=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  return {selectedName:document.querySelector('#nameInput').value,after:Number(project.defaultFrame[setup.id].r)}
},setup)
if(setup.shapeOpacity!=='0' || setup.topClass!=='bone-overlay-shape' || result.selectedName!==setup.name || Math.abs(result.after-setup.before)<1) throw new Error(`ボーン非表示時の選択操作が不正です: ${JSON.stringify({setup,result})}`)
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
await page.screenshot({path:'output/bone-editor-hidden-bone-select.png',fullPage:true})
console.log(JSON.stringify({setup,result,errors}))
await browser.close()
