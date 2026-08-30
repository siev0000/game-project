import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:960}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('.project-card-main').filter({hasText:'デフォルト'}).click()
await page.waitForFunction(()=>document.querySelectorAll('.mesh-binding-canvas').length===5)

const readGeometry=()=>page.evaluate(()=>{
  const boneRects=Object.fromEntries([...document.querySelectorAll('.layer')].map(layer=>{
    const rect=layer.getBoundingClientRect()
    return [layer.dataset.id,{x:rect.x,y:rect.y,width:rect.width,height:rect.height}]
  }))
  const rigidLayer=[...document.querySelectorAll('.layer')].find(layer=>{
    const id=layer.dataset.id
    return project.layers[id]?.imageSourceId && !findMeshBindingForBone(id)
  })
  const imageRect=rigidLayer?.querySelector('.image-transform')?.getBoundingClientRect()
  const mesh=[...document.querySelectorAll('.mesh-binding-canvas')].map(canvas=>{
    const rect=canvas.getBoundingClientRect()
    return {id:canvas.dataset.bindingId,transform:getComputedStyle(canvas).transform,origin:getComputedStyle(canvas).transformOrigin,width:rect.width,height:rect.height}
  })
  const root=getWorldState(currentFrameData())[getRootId()]
  return {
    scale:project.meta.imageDisplayScale,
    root:{x:root.anchorX,y:root.anchorY},
    boneRects,
    rigidId:rigidLayer?.dataset.id,
    imageRect:imageRect?{x:imageRect.x,y:imageRect.y,width:imageRect.width,height:imageRect.height}:null,
    imageOverflow:rigidLayer?getComputedStyle(rigidLayer.querySelector('.layer-visual')).overflow:null,
    mesh
  }
})

const before=await readGeometry()
await page.locator('#settingsBtn').click()
await page.locator('#settingImageDisplayScale').fill('130')
await page.locator('#settingImageDisplayScale').dispatchEvent('input')
const settingState=await page.evaluate(()=>({range:document.querySelector('#settingImageDisplayScale').value,number:document.querySelector('#settingImageDisplayScaleNumber').value,scale:project.meta.imageDisplayScale}))
await page.locator('#settingsCloseBtn').click()
const enlarged=await readGeometry()
await page.screenshot({path:'output/bone-editor-saved-default-image-scale-130.png',fullPage:true})

await page.locator('#settingsBtn').click()
await page.locator('#settingImageDisplayScaleReset').click()
await page.locator('#settingsCloseBtn').click()
const restored=await readGeometry()

const tolerance=(left,right,amount=.15)=>Math.abs(left-right)<=amount
const bonesUnchanged=Object.keys(before.boneRects).every(id=>{
  const a=before.boneRects[id],b=enlarged.boneRects[id]
  return b&&tolerance(a.x,b.x)&&tolerance(a.y,b.y)&&tolerance(a.width,b.width)&&tolerance(a.height,b.height)
})
const bonesRestored=Object.keys(before.boneRects).every(id=>{
  const a=before.boneRects[id],b=restored.boneRects[id]
  return b&&tolerance(a.x,b.x)&&tolerance(a.y,b.y)&&tolerance(a.width,b.width)&&tolerance(a.height,b.height)
})

if(before.scale!==1 || !before.imageRect || before.mesh.length!==5) throw new Error(`保存済みデフォルトの初期状態が想定外です: ${JSON.stringify(before)}`)
if(settingState.range!=='130' || settingState.number!=='130' || settingState.scale!==1.3) throw new Error(`倍率設定が同期しません: ${JSON.stringify(settingState)}`)
if(!bonesUnchanged) throw new Error('130%変更でボーンの位置または大きさが変わりました')
if(enlarged.imageRect.width<before.imageRect.width*1.29 || enlarged.imageRect.height<before.imageRect.height*1.29 || enlarged.imageOverflow!=='visible') throw new Error(`通常画像が130%へ拡大されません: ${JSON.stringify({before:before.imageRect,enlarged:enlarged.imageRect,overflow:enlarged.imageOverflow})}`)
if(enlarged.mesh.some(item=>!item.transform.startsWith('matrix(1.3'))) throw new Error(`メッシュが130%へ拡大されません: ${JSON.stringify(enlarged.mesh)}`)
if(restored.scale!==1 || !bonesRestored || !tolerance(restored.imageRect.width,before.imageRect.width) || restored.mesh.some(item=>item.transform!=='none')) throw new Error(`100%へ戻しても初期状態へ復帰しません: ${JSON.stringify(restored)}`)
if(errors.length) throw new Error(`console errors: ${errors.join(' | ')}`)

console.log(JSON.stringify({before,settingState,enlarged:{scale:enlarged.scale,imageRect:enlarged.imageRect,mesh:enlarged.mesh},restored:{scale:restored.scale,imageRect:restored.imageRect,mesh:restored.mesh},bonesUnchanged,bonesRestored,errors},null,2))
await browser.close()
