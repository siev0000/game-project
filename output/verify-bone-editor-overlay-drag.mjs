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
  entry.project.meta.editMode='rotate'
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  const polygon=[...document.querySelectorAll('.bone-overlay-shape polygon')].find(item=>{
    const rect=item.getBoundingClientRect()
    return rect.width>30 && rect.height>30 && rect.left>0 && rect.right<1400 && rect.top>80 && rect.bottom<760
  })
  if(!polygon) throw new Error('操作可能なボーンが見つかりません')
  const rect=polygon.getBoundingClientRect()
  let point=null
  for(let y=rect.top+2;y<rect.bottom-2 && !point;y+=3){
    for(let x=rect.left+2;x<rect.right-2;x+=3){
      if(document.elementFromPoint(x,y)===polygon){ point={x,y}; break }
    }
  }
  if(!point) throw new Error('♦本体のクリック位置が見つかりません')
  const hit=polygon.closest('.bone-overlay-item')
  if(!hit) throw new Error('♦のクリック対象が見つかりません')
  const id=hit.dataset.id
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  return {id,name:project.layers[id].name,before:Number(project.defaultFrame[id].r),stageLeft:document.querySelector('#character').style.left,...point}
})
await page.mouse.move(setup.x,setup.y)
await page.mouse.down()
await page.mouse.move(setup.x+32,setup.y+18,{steps:5})
await page.mouse.up()
const result=await page.evaluate(setup=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  return {selectedName:document.querySelector('#nameInput').value,after:Number(project.defaultFrame[setup.id].r),stageLeft:document.querySelector('#character').style.left}
},setup)
if(result.selectedName!==setup.name || Math.abs(result.after-setup.before)<1 || result.stageLeft!==setup.stageLeft) throw new Error(`♦ドラッグ操作または画面パン分離が不正です: ${JSON.stringify({setup,result})}`)
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
await page.screenshot({path:'output/bone-editor-overlay-drag.png',fullPage:true})
console.log(JSON.stringify({setup,result,errors}))
await browser.close()
