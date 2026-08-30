import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.waitForFunction(()=>typeof window.replaceCurrentProject==='function')
const target=await page.evaluate(async()=>{
  const entry=await fetch('/api/local/bone-motion-projects?id=motion_20260815095021_85vj',{cache:'no-store'}).then(response=>response.json())
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  const data=JSON.parse(document.querySelector('#jsonArea').value)
  const meshIds=new Set(Object.values(data.meshBindings).flatMap(binding=>binding.boneChain||[]))
  return data.layerOrder.find(id=>(data.layers[id].imageSourceId || data.layers[id].imageSourceSlot) && !meshIds.has(id)) || data.layerOrder.find(id=>data.layers[id].imageSourceId || data.layers[id].imageSourceSlot)
})
if(!target) throw new Error('画像設定済みボーンがありません')
await page.evaluate(id=>window.selectBoneLayer(id),target)
await page.locator('#imageFlipXInput').check()
await page.locator('#imageFlipYInput').check()
const result=await page.evaluate(id=>{
  const image=document.querySelector(`.layer[data-id="${id}"] .image-transform`)
  window.exportJSON(false)
  const data=JSON.parse(document.querySelector('#jsonArea').value)
  const pose=(data.animations.find(animation=>animation.id===data.meta.activeAnimationId)?.frames?.[0] || data.defaultFrame)[id]
  return {transform:image?.style.transform,flipX:pose.imageFlipX,flipY:pose.imageFlipY}
},target)
if(!result.flipX || !result.flipY || !/scale\(-/.test(result.transform) || !/,\s*-/.test(result.transform)) throw new Error(`左右・上下反転が描画へ反映されません: ${JSON.stringify(result)}`)
await page.screenshot({path:'output/bone-editor-image-flips.png',fullPage:true})
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({target,result,errors}))
await browser.close()
