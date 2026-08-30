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
  const project=entry.project
  project.meta.display.bones=true
  const id=project.layerOrder.find(candidate=>project.defaultFrame[candidate]?.w>30 && project.defaultFrame[candidate]?.h>30)
  project.layers[id].shapeFlipX=true
  window.replaceCurrentProject(project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  const polygon=document.querySelector(`.bone-overlay-item[data-id="${id}"] polygon`)
  const box=polygon.getBoundingClientRect()
  let point=null
  for(let y=box.top+2;y<box.bottom-2 && !point;y+=3){
    for(let x=box.left+2;x<box.right-2;x+=3){
      if(document.elementFromPoint(x,y)===polygon){ point={x,y}; break }
    }
  }
  if(!point) throw new Error('反転した♦本体のクリック位置を取得できません')
  const snapshot=JSON.parse(document.querySelector('#jsonArea').value)
  return {id,name:snapshot.layers[id].name,point}
})
await page.mouse.click(setup.point.x,setup.point.y)
const result=await page.evaluate(()=>({selected:document.querySelector('#nameInput')?.value || ''}))
if(result.selected!==setup.name) throw new Error(`反転♦の選択が不正です: ${JSON.stringify({setup,result})}`)
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({setup,result,errors}))
await browser.close()
