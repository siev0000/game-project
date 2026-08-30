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
  const id=JSON.parse(document.querySelector('#jsonArea').value).layerOrder[0]
  window.selectBoneLayer(id)
  const box=document.querySelector('#resizeBox')
  const handle=box.querySelector('.resize-handle')
  const overlay=document.querySelector('#resizeOverlay')
  const character=document.querySelector('#character')
  return {boxPointerEvents:getComputedStyle(box).pointerEvents,handlePointerEvents:getComputedStyle(handle).pointerEvents,resizeZ:Number(getComputedStyle(overlay).zIndex),characterZ:Number(getComputedStyle(character).zIndex),active:overlay.classList.contains('active')}
})
if(result.boxPointerEvents!=='none' || result.handlePointerEvents!=='auto' || result.resizeZ<=result.characterZ || !result.active) throw new Error(`四角枠のクリック透過設定が不正です: ${JSON.stringify(result)}`)
await page.screenshot({path:'output/bone-editor-resize-overlay-clickthrough.png',fullPage:true})
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({result,errors}))
await browser.close()
