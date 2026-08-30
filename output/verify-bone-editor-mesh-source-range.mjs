import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:960}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('.project-card-main').first().click()
await page.waitForFunction(()=>document.querySelectorAll('.mesh-binding-canvas').length===5)

const before=await page.evaluate(()=>Object.values(project.meshBindings).map(binding=>({id:binding.id,rect:normalizeMeshSourceRect(binding.sourceRect)})))
await page.evaluate(()=>{
  const binding=Object.values(project.meshBindings)[0]
  selectedLayer=binding.boneChain[0]
  render()
  openMeshBindingEditor()
})
await page.locator('#meshBindingDialog[open]').waitFor()

for(const [id,value] of [['meshRangeXInput','5'],['meshRangeWInput','18'],['meshRangeYInput','31'],['meshRangeHInput','14']]){
  await page.locator(`#${id}`).fill(value)
  await page.locator(`#${id}`).dispatchEvent('change')
}
const numericRect=await page.evaluate(()=>normalizeMeshSourceRect(meshEditorState.sourceRect))

await page.locator('#meshFlipYBtn').click()
await page.waitForFunction(()=>meshEditorState?.flipY===true)
const flippedYRect=await page.evaluate(()=>normalizeMeshSourceRect(meshEditorState.sourceRect))
await page.screenshot({path:'output/bone-editor-mesh-range-flip-y.png',fullPage:true})
await page.locator('#meshFlipYBtn').click()
await page.waitForFunction(()=>meshEditorState?.flipY===false)

await page.locator('#meshFlipXBtn').click()
await page.waitForFunction(()=>meshEditorState?.flipX===true)
const flippedXRect=await page.evaluate(()=>normalizeMeshSourceRect(meshEditorState.sourceRect))
await page.screenshot({path:'output/bone-editor-mesh-range-flip-x.png',fullPage:true})
await page.locator('#meshFlipXBtn').click()
await page.waitForFunction(()=>meshEditorState?.flipX===false)
const flipRoundTripRect=await page.evaluate(()=>normalizeMeshSourceRect(meshEditorState.sourceRect))

const rangeBox=await page.locator('.mesh-source-range').boundingBox()
if(!rangeBox) throw new Error('変形対象範囲が表示されません')
await page.mouse.move(rangeBox.x+rangeBox.width*.25,rangeBox.y+rangeBox.height*.25)
await page.mouse.down()
await page.mouse.move(rangeBox.x+rangeBox.width*.25+24,rangeBox.y+rangeBox.height*.25+16)
await page.mouse.up()
const draggedRect=await page.evaluate(()=>normalizeMeshSourceRect(meshEditorState.sourceRect))

const handle=page.locator('.mesh-range-handle[data-corner="br"]')
const handleBox=await handle.boundingBox()
if(!handleBox) throw new Error('範囲リサイズハンドルが表示されません')
await page.mouse.move(handleBox.x+handleBox.width/2,handleBox.y+handleBox.height/2)
await page.mouse.down()
await page.mouse.move(handleBox.x+handleBox.width/2-35,handleBox.y+handleBox.height/2-28)
await page.mouse.up()
const resizedRect=await page.evaluate(()=>normalizeMeshSourceRect(meshEditorState.sourceRect))
await page.screenshot({path:'output/bone-editor-mesh-source-range.png',fullPage:true})

await page.locator('#meshBindingApplyBtn').click()
await page.waitForFunction(()=>!document.querySelector('#meshBindingDialog').open)
const applied=await page.evaluate(()=>{
  const binding=Object.values(project.meshBindings)[0]
  const cached=meshImageCache.get(binding.sourceId)
  const canvas=transformedMeshImage(cached.image,binding)
  const rect=normalizeMeshSourceRect(binding.sourceRect)
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data
  const left=Math.floor(rect.x*canvas.width),top=Math.floor(rect.y*canvas.height)
  const right=Math.ceil((rect.x+rect.w)*canvas.width),bottom=Math.ceil((rect.y+rect.h)*canvas.height)
  let outsideAlpha=0,insideAlpha=0
  for(let y=0;y<canvas.height;y+=2){
    for(let x=0;x<canvas.width;x+=2){
      const alpha=pixels[(y*canvas.width+x)*4+3]
      if(x>=left&&x<right&&y>=top&&y<bottom) insideAlpha+=alpha
      else outsideAlpha+=alpha
    }
  }
  const centerPoint={x:(rect.x+rect.w/2)*canvas.width,y:(rect.y+rect.h/2)*canvas.height}
  const outsidePoint={x:Math.max(0,(rect.x-.05)*canvas.width),y:Math.max(0,(rect.y-.05)*canvas.height)}
  return {id:binding.id,rect,width:canvas.width,height:canvas.height,outsideAlpha,insideAlpha,centerInfluence:meshRangeInfluence(centerPoint,rect,canvas),outsideInfluence:meshRangeInfluence(outsidePoint,rect,canvas)}
})

await page.evaluate(()=>{
  const binding=Object.values(project.meshBindings)[0]
  currentFrameData()[binding.boneChain[1]].r+=55
  render()
})
await page.waitForTimeout(100)
await page.screenshot({path:'output/bone-editor-localized-joint-bend.png',fullPage:true})

const near=(a,b,t=.015)=>Math.abs(a-b)<=t
if(before.some(item=>item.rect.x<0||item.rect.y<0||item.rect.w<.03||item.rect.h<.03||item.rect.x+item.rect.w>1.001||item.rect.y+item.rect.h>1.001)) throw new Error(`保存済みメッシュ範囲が不正です: ${JSON.stringify(before)}`)
if(!near(numericRect.x,.05)||!near(numericRect.y,.31)||!near(numericRect.w,.18)||!near(numericRect.h,.14)) throw new Error(`数値入力が反映されません: ${JSON.stringify(numericRect)}`)
if(!near(flippedYRect.x,numericRect.x)||!near(flippedYRect.y,numericRect.y)||!near(flippedYRect.w,numericRect.w)||!near(flippedYRect.h,numericRect.h)) throw new Error(`上下反転で参照範囲が移動しました: ${JSON.stringify({numericRect,flippedYRect})}`)
if(!near(flippedXRect.x,numericRect.x)||!near(flippedXRect.y,numericRect.y)||!near(flippedXRect.w,numericRect.w)||!near(flippedXRect.h,numericRect.h)) throw new Error(`左右反転で参照範囲が移動しました: ${JSON.stringify({numericRect,flippedXRect})}`)
if(!near(flipRoundTripRect.x,numericRect.x)||!near(flipRoundTripRect.y,numericRect.y)||!near(flipRoundTripRect.w,numericRect.w)||!near(flipRoundTripRect.h,numericRect.h)) throw new Error(`反転を戻しても範囲が復元しません: ${JSON.stringify({numericRect,flipRoundTripRect})}`)
if(draggedRect.x<=numericRect.x || draggedRect.y<=numericRect.y) throw new Error(`範囲をドラッグ移動できません: ${JSON.stringify({numericRect,draggedRect})}`)
if(resizedRect.w>=draggedRect.w || resizedRect.h>=draggedRect.h) throw new Error(`四隅で範囲を縮小できません: ${JSON.stringify({draggedRect,resizedRect})}`)
if(applied.outsideAlpha<=0 || applied.insideAlpha<=0) throw new Error(`範囲指定後に腕全体の画像が維持されません: ${JSON.stringify(applied)}`)
if(applied.centerInfluence<.99 || applied.outsideInfluence!==0) throw new Error(`変形範囲の内外判定が正しくありません: ${JSON.stringify(applied)}`)
if(errors.length) throw new Error(`console errors: ${errors.join(' | ')}`)

console.log(JSON.stringify({before,numericRect,flippedYRect,flippedXRect,flipRoundTripRect,draggedRect,resizedRect,applied,errors},null,2))
await browser.close()
