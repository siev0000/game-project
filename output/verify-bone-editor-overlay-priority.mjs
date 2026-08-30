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
  entry.project.meta.display.bones=true
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  const target=[...document.querySelectorAll('.bone-overlay-shape')].find(shape=>{
    const rect=shape.getBoundingClientRect()
    return rect.width>18 && rect.height>18 && rect.left>=0 && rect.right<=1440 && rect.top>=64 && rect.bottom<=790
  })
  if(!target) throw new Error('画面内のボーンが見つかりません')
  const targetId=target.closest('.bone-overlay-item').dataset.id
  window.selectBoneLayer(targetId)
  const rect=target.getBoundingClientRect()
  const point={x:rect.left+rect.width/2,y:rect.top+rect.height*.3}
  const top=document.elementFromPoint(point.x,point.y)
  target.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,clientX:point.x,clientY:point.y}))
  target.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:point.x,clientY:point.y}))
  return {
    targetId,
    rect:rect.toJSON(),
    point,
    topClass:top?.className,
    topOverlayId:top?.closest('.bone-overlay-item')?.dataset.id || null,
    selected:window.__boneEditorDebug?.selectedLayer || document.querySelector('#nameInput')?.value,
    imagePointerEvents:getComputedStyle(document.querySelector(`.layer[data-id="${targetId}"]`)).pointerEvents,
    overlayZ:getComputedStyle(document.querySelector('.bone-overlay')).zIndex
  }
})
if(result.topOverlayId!==result.targetId || result.imagePointerEvents!=='none' || Number(result.overlayZ)<900001) throw new Error(`ボーン前面／クリック優先が不正です: ${JSON.stringify(result)}`)
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
await page.screenshot({path:'output/bone-editor-overlay-priority.png',fullPage:true})
console.log(JSON.stringify({result,errors}))
await browser.close()
