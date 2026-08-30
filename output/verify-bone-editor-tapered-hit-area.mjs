import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.waitForFunction(()=>typeof window.replaceCurrentProject==='function')
const result=await page.evaluate(async()=>{
  const entry=await fetch('/api/local/bone-motion-projects?id=motion_20260815095021_85vj',{cache:'no-store'}).then(response=>response.json())
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  selectedLayer=null
  render()
  const data=JSON.parse(document.querySelector('#jsonArea').value)
  const id=data.layerOrder.find(layerId=>Math.abs(data.defaultFrame[layerId].r||0)<.001)
  const el=document.querySelector(`.layer[data-id="${id}"]`)
  const rect=el.getBoundingClientRect()
  const points=[]
  for(let y=rect.top+2;y<rect.bottom-2;y+=Math.max(4,rect.height/8)) for(let x=rect.left+2;x<rect.right-2;x+=Math.max(4,rect.width/8)) points.push({x,y,inside:isPointerInsideEditorBone(id,x,y)})
  const outside=points.find(point=>!point.inside)
  const inside=points.find(point=>point.inside)
  if(!outside || !inside) throw new Error('テーパー形状の内外判定点を取得できません')
  const dispatch=(x,y)=>{
    el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,clientX:x,clientY:y,button:0}))
    window.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,clientX:x,clientY:y,button:0}))
  }
  dispatch(outside.x,outside.y)
  const offSelected=el.classList.contains('selected')
  dispatch(inside.x,inside.y)
  const onSelected=el.classList.contains('selected')
  const shape=getComputedStyle(el.querySelector('.shape')).clipPath
  return {id,offSelected,onSelected,shape,outside,inside}
})
if(result.offSelected || !result.onSelected || result.shape==='none') throw new Error(`テーパー形状の選択判定が不正です: ${JSON.stringify(result)}`)
await page.screenshot({path:'output/bone-editor-tapered-hit-area.png',fullPage:true})
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({result,errors}))
await browser.close()
