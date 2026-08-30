import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:960}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('.project-card-main').first().click()
await page.waitForFunction(()=>document.querySelectorAll('.mesh-binding-canvas').length>0)

const selectBone=async id=>page.evaluate(boneId=>{selectedLayer=boneId;render()},id)
const readBoneGeometry=async id=>page.evaluate(boneId=>{
  const element=layerEls[boneId]
  const image=element?.querySelector('.image-transform')
  const rect=element?.getBoundingClientRect(),imageRect=image?.getBoundingClientRect()
  const layer=project.layers[boneId]
  const pose=clone(currentFrameData()[boneId])
  return {
    pose,
    bone:{parent:layer.parent,attachX:layer.attachX,attachY:layer.attachY,ox:layer.ox,oy:layer.oy,headX:layer.headX,headY:layer.headY,tailX:layer.tailX,tailY:layer.tailY},
    rect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null,
    imageRect:imageRect?{x:imageRect.x,y:imageRect.y,width:imageRect.width,height:imageRect.height}:null,
    imageTransform:image?.style.transform || '',
    imageComputedTransform:image?getComputedStyle(image).transform:'',
    imageDisplay:image?getComputedStyle(image).display:'',
    visualClass:element?.querySelector('.layer-visual')?.className || '',
    imageSourceLength:image?.querySelector('img')?.src?.length || 0,
    imageFlipX:!!layer.imageFlipX
  }
},id)

const ids=await page.evaluate(()=>{
  const rigid=project.layerOrder.find(id=>project.layers[id]?.imageSourceId && !findMeshBindingForBone(id))
  const binding=Object.values(project.meshBindings)[0]
  return {rigid,meshBone:binding?.boneChain?.at(-1),bindingId:binding?.id}
})
if(!ids.rigid || !ids.meshBone) throw new Error(`テスト対象の通常画像／メッシュがありません: ${JSON.stringify(ids)}`)

await selectBone(ids.rigid)
const rigidBefore=await readBoneGeometry(ids.rigid)
await page.locator('#imageFlipXInput').setChecked(!rigidBefore.imageFlipX)
await page.waitForFunction(({id,before})=>project.layers[id].imageFlipX!==before,{id:ids.rigid,before:rigidBefore.imageFlipX})
const rigidFlipped=await readBoneGeometry(ids.rigid)
await page.screenshot({path:'output/bone-editor-inspector-rigid-flip-x.png',fullPage:true})
await page.locator('#imageFlipXInput').setChecked(rigidBefore.imageFlipX)
await page.waitForFunction(({id,before})=>project.layers[id].imageFlipX===before,{id:ids.rigid,before:rigidBefore.imageFlipX})
const rigidRestored=await readBoneGeometry(ids.rigid)

await selectBone(ids.meshBone)
const meshBefore=await page.evaluate(bindingId=>{
  const binding=project.meshBindings[bindingId]
  const canvas=meshCanvasElements[bindingId]
  const context=canvas.getContext('2d')
  window.__meshFlipBeforePixels=new Uint8ClampedArray(context.getImageData(0,0,canvas.width,canvas.height).data)
  const effectiveFlip=!!binding.flipX!==!!binding.boneFlipX?.[selectedLayer]
  return {flipX:!!binding.flipX,effectiveFlip,boneFlipX:clone(binding.boneFlipX || {}),rect:normalizeMeshSourceRect(binding.sourceRect),controlPoints:clone(binding.controlPoints),poses:clone(currentFrameData()),layerFlipX:!!project.layers[selectedLayer].imageFlipX,canvasData:canvas?.toDataURL()}
},ids.bindingId)
await page.locator('#imageFlipXInput').setChecked(!meshBefore.effectiveFlip)
await page.waitForFunction(({id,boneId,before})=>((!!project.meshBindings[id].flipX!==!!project.meshBindings[id].boneFlipX?.[boneId])!==before),{id:ids.bindingId,boneId:ids.meshBone,before:meshBefore.effectiveFlip})
const meshFlipped=await page.evaluate(bindingId=>{
  const binding=project.meshBindings[bindingId]
  const canvas=meshCanvasElements[bindingId]
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data
  let minX=canvas.width,minY=canvas.height,maxX=-1,maxY=-1,diffPixels=0
  for(let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++){
    const offset=(y*canvas.width+x)*4
    if(pixels[offset]!==window.__meshFlipBeforePixels[offset]||pixels[offset+1]!==window.__meshFlipBeforePixels[offset+1]||pixels[offset+2]!==window.__meshFlipBeforePixels[offset+2]||pixels[offset+3]!==window.__meshFlipBeforePixels[offset+3]){
      minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);diffPixels++
    }
  }
  const canvasRect=canvas.getBoundingClientRect(),boneRect=layerEls[selectedLayer].getBoundingClientRect()
  const diffRect=diffPixels?{x:canvasRect.x+minX/canvas.width*canvasRect.width,y:canvasRect.y+minY/canvas.height*canvasRect.height,width:(maxX-minX+1)/canvas.width*canvasRect.width,height:(maxY-minY+1)/canvas.height*canvasRect.height}:null
  const effectiveFlip=!!binding.flipX!==!!binding.boneFlipX?.[selectedLayer]
  return {flipX:!!binding.flipX,effectiveFlip,boneFlipX:clone(binding.boneFlipX || {}),rect:normalizeMeshSourceRect(binding.sourceRect),controlPoints:clone(binding.controlPoints),poses:clone(currentFrameData()),layerFlipX:!!project.layers[selectedLayer].imageFlipX,canvasCount:document.querySelectorAll('.mesh-binding-canvas').length,canvasData:canvas?.toDataURL(),diffPixels,diffRect,boneRect:{x:boneRect.x,y:boneRect.y,width:boneRect.width,height:boneRect.height}}
},ids.bindingId)
await page.screenshot({path:'output/bone-editor-inspector-mesh-flip-x.png',fullPage:true})
await page.locator('#imageFlipXInput').setChecked(meshBefore.effectiveFlip)
await page.waitForFunction(({id,boneId,before})=>(!!project.meshBindings[id].flipX!==!!project.meshBindings[id].boneFlipX?.[boneId])===before,{id:ids.bindingId,boneId:ids.meshBone,before:meshBefore.effectiveFlip})
const meshRestored=await page.evaluate(bindingId=>({rect:normalizeMeshSourceRect(project.meshBindings[bindingId].sourceRect),poses:clone(currentFrameData()),boneFlipX:clone(project.meshBindings[bindingId].boneFlipX || {})}),ids.bindingId)

const near=(a,b,t=.2)=>Math.abs(a-b)<=t
const sameRect=(a,b)=>near(a.x,b.x)&&near(a.y,b.y)&&near(a.width,b.width)&&near(a.height,b.height)
const sameSourceRect=(a,b,t=.002)=>Math.abs(a.x-b.x)<=t&&Math.abs(a.y-b.y)<=t&&Math.abs(a.w-b.w)<=t&&Math.abs(a.h-b.h)<=t
if(JSON.stringify(rigidBefore.pose)!==JSON.stringify(rigidFlipped.pose)||JSON.stringify(rigidBefore.bone)!==JSON.stringify(rigidFlipped.bone)||!sameRect(rigidBefore.rect,rigidFlipped.rect)) throw new Error(`通常画像の反転でボーンが移動しました: ${JSON.stringify({rigidBefore,rigidFlipped})}`)
if(!sameRect(rigidBefore.imageRect,rigidFlipped.imageRect)) throw new Error(`通常画像の反転で表示位置が移動しました: ${JSON.stringify({before:rigidBefore.imageRect,after:rigidFlipped.imageRect})}`)
if(rigidBefore.imageTransform===rigidFlipped.imageTransform) throw new Error(`通常画像の左右反転がCSSへ反映されません: ${JSON.stringify({rigidBefore,rigidFlipped})}`)
if(!sameRect(rigidBefore.rect,rigidRestored.rect)||!sameRect(rigidBefore.imageRect,rigidRestored.imageRect)) throw new Error('通常画像の反転解除で元位置へ戻りません')
if(JSON.stringify(meshBefore.poses)!==JSON.stringify(meshFlipped.poses)||meshBefore.layerFlipX!==meshFlipped.layerFlipX) throw new Error('メッシュ画像の反転でボーンまたはボーン側画像設定が変更されました')
if(!sameSourceRect(meshBefore.rect,meshFlipped.rect)||JSON.stringify(meshBefore.controlPoints)!==JSON.stringify(meshFlipped.controlPoints)) throw new Error('メッシュ画像の反転で参照範囲または参照点が移動しました')
if(meshFlipped.flipX!==meshBefore.flipX||meshFlipped.effectiveFlip===meshBefore.effectiveFlip||meshFlipped.canvasCount<1) throw new Error('画像調整の左右反転が選択部位だけへ反映されません')
for(const boneId of Object.keys(meshFlipped.boneFlipX)) if(boneId!==ids.meshBone && !!meshFlipped.boneFlipX[boneId]!==!!meshBefore.boneFlipX[boneId]) throw new Error(`選択していない部位 ${boneId} の反転設定が変更されました`)
if(meshBefore.canvasData===meshFlipped.canvasData) throw new Error('切り取り済みメッシュ画像の見た目が左右反転していません')
if(!meshFlipped.diffRect||meshFlipped.diffPixels<1) throw new Error('選択部位の反転差分がありません')
const margin=24,boneRight=meshFlipped.boneRect.x+meshFlipped.boneRect.width,boneBottom=meshFlipped.boneRect.y+meshFlipped.boneRect.height,diffRight=meshFlipped.diffRect.x+meshFlipped.diffRect.width,diffBottom=meshFlipped.diffRect.y+meshFlipped.diffRect.height
if(meshFlipped.diffRect.x<meshFlipped.boneRect.x-margin||meshFlipped.diffRect.y<meshFlipped.boneRect.y-margin||diffRight>boneRight+margin||diffBottom>boneBottom+margin) throw new Error(`選択部位以外まで描画が変化しました: ${JSON.stringify({bone:meshFlipped.boneRect,diff:meshFlipped.diffRect})}`)
if(!sameSourceRect(meshBefore.rect,meshRestored.rect)||JSON.stringify(meshBefore.poses)!==JSON.stringify(meshRestored.poses)||JSON.stringify(meshBefore.boneFlipX)!==JSON.stringify(meshRestored.boneFlipX)) throw new Error(`メッシュ反転解除で範囲／ボーン／部位設定が復元しません: ${JSON.stringify({meshBefore,meshRestored})}`)
if(errors.length) throw new Error(`console errors: ${errors.join(' | ')}`)

console.log(JSON.stringify({
  ids,
  rigid:{
    boneStayed:JSON.stringify(rigidBefore.pose)===JSON.stringify(rigidFlipped.pose)&&sameRect(rigidBefore.rect,rigidFlipped.rect),
    imageStayed:sameRect(rigidBefore.imageRect,rigidFlipped.imageRect),
    transformChanged:rigidBefore.imageTransform!==rigidFlipped.imageTransform,
    restored:sameRect(rigidBefore.imageRect,rigidRestored.imageRect)
  },
  mesh:{
    boneStayed:JSON.stringify(meshBefore.poses)===JSON.stringify(meshFlipped.poses),
    selectedBoneFlipChanged:meshBefore.effectiveFlip!==meshFlipped.effectiveFlip,
    wholeMeshFlipStayed:meshBefore.flipX===meshFlipped.flipX,
    changedPixels:meshFlipped.diffPixels,
    changedArea:meshFlipped.diffRect,
    rangeRestored:sameSourceRect(meshBefore.rect,meshRestored.rect),
    canvasCount:meshFlipped.canvasCount
  },
  errors
},null,2))
await browser.close()
