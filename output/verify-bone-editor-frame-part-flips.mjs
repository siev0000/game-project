import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:960}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))
page.on('dialog',dialog=>dialog.accept())

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('.project-card-main').filter({hasText:'pixel_side_motion'}).click()

const source=JSON.parse(await page.locator('#jsonArea').inputValue())
const frame0=structuredClone(source.defaultFrame)
const frame1=structuredClone(source.defaultFrame)
source.animations.push({id:'test_frame_flips',name:'コマ別反転テスト',fps:8,loop:false,frames:[frame0,frame1]})
await page.locator('#jsonArea').evaluate((textarea,value)=>{textarea.value=value},JSON.stringify(source))
await page.locator('#applyJsonBtn').evaluate(button=>button.click())
await page.locator('#animationSelect').selectOption('test_frame_flips')

const layerIdByKey=key=>source.layerOrder.find(id=>source.layers[id]?.key===key)
const headId=layerIdByKey('head')
const armId=layerIdByKey('armRL')
const armBindingEntry=Object.entries(source.meshBindings).find(([,binding])=>binding.boneChain.includes(armId))
if(!headId || !armId || !armBindingEntry) throw new Error('テスト対象の頭／右腕メッシュが見つかりません')
const armBindingId=armBindingEntry[0]
const selectBone=async name=>page.locator('.layer-item').filter({has:page.locator('.bone-name',{hasText:new RegExp(`^${name}$`)})}).click()
const canvasHash=async()=>page.locator(`canvas.mesh-binding-canvas[data-binding-id="${armBindingId}"]`).evaluate(canvas=>{
  const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data
  let hash=2166136261,alpha=0
  for(let i=0;i<data.length;i+=4){alpha+=data[i+3];if(i%388===0) hash=Math.imul(hash^data[i],16777619)}
  return {hash:hash>>>0,alpha}
})
const headTransform=()=>page.locator(`.layer[data-id="${headId}"] .image-transform`).evaluate(element=>element.style.transform)
const elementRect=locator=>locator.evaluate(element=>{const rect=element.getBoundingClientRect();return {x:rect.x,y:rect.y,width:rect.width,height:rect.height}})

await selectBone('右腕')
const meshBaseline=await canvasHash()
await page.locator(`canvas.mesh-binding-canvas[data-binding-id="${armBindingId}"]`).evaluate(canvas=>{
  window.__frameFlipBaseline=new Uint8ClampedArray(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data)
})
await page.locator('#imageFlipXInput').check()
await page.waitForTimeout(80)
const meshFlipXOnly=await canvasHash()
await page.locator('#imageFlipYInput').check()
await page.waitForTimeout(120)
const meshFrame0=await canvasHash()
const meshDiff=await page.locator(`canvas.mesh-binding-canvas[data-binding-id="${armBindingId}"]`).evaluate((canvas,boneId)=>{
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data
  let minX=canvas.width,minY=canvas.height,maxX=-1,maxY=-1,count=0
  for(let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++){
    const offset=(y*canvas.width+x)*4
    if(pixels[offset]!==window.__frameFlipBaseline[offset]||pixels[offset+1]!==window.__frameFlipBaseline[offset+1]||pixels[offset+2]!==window.__frameFlipBaseline[offset+2]||pixels[offset+3]!==window.__frameFlipBaseline[offset+3]){
      minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);count++
    }
  }
  const canvasRect=canvas.getBoundingClientRect(),boneRect=layerEls[boneId].getBoundingClientRect()
  return {count,diffRect:count?{x:canvasRect.x+minX/canvas.width*canvasRect.width,y:canvasRect.y+minY/canvas.height*canvasRect.height,width:(maxX-minX+1)/canvas.width*canvasRect.width,height:(maxY-minY+1)/canvas.height*canvasRect.height}:null,boneRect:{x:boneRect.x,y:boneRect.y,width:boneRect.width,height:boneRect.height}}
},armId)
if(meshFrame0.hash===meshBaseline.hash) throw new Error('右腕メッシュのコマ別反転が描画へ反映されません')
if(meshFlipXOnly.hash===meshBaseline.hash) throw new Error('右腕メッシュの左右反転が単独で描画へ反映されません')
if(meshFrame0.hash===meshFlipXOnly.hash) throw new Error('右腕メッシュの上下反転が単独で描画へ追加反映されません')
if(meshFrame0.alpha===0) throw new Error('右腕メッシュが反転後に消えました')
if(!meshDiff.diffRect || meshDiff.count<1) throw new Error('右腕メッシュの反転差分がありません')
const margin=36,diffRight=meshDiff.diffRect.x+meshDiff.diffRect.width,diffBottom=meshDiff.diffRect.y+meshDiff.diffRect.height,boneRight=meshDiff.boneRect.x+meshDiff.boneRect.width,boneBottom=meshDiff.boneRect.y+meshDiff.boneRect.height
if(meshDiff.diffRect.x<meshDiff.boneRect.x-margin||meshDiff.diffRect.y<meshDiff.boneRect.y-margin||diffRight>boneRight+margin||diffBottom>boneBottom+margin) throw new Error(`選択した右腕以外まで反転差分が広がりました: ${JSON.stringify(meshDiff)}`)

await selectBone('頭')
const headBefore=await headTransform()
const headRectBefore=await elementRect(page.locator(`.layer[data-id="${headId}"] .image-transform`))
await page.locator('#imageFlipXInput').check()
const headFrame0=await headTransform()
const headRectAfter=await elementRect(page.locator(`.layer[data-id="${headId}"] .image-transform`))
if(headFrame0===headBefore || !headFrame0.includes('scale(-')) throw new Error(`通常画像の左右反転が描画へ反映されません: ${headFrame0}`)
for(const key of ['x','y','width','height']) if(Math.abs(headRectBefore[key]-headRectAfter[key])>.2) throw new Error(`頭画像の反転で表示枠が移動しました: ${JSON.stringify({headRectBefore,headRectAfter})}`)

await page.locator('.frame-btn').nth(1).click()
await selectBone('右腕')
const frame1Checks={x:await page.locator('#imageFlipXInput').isChecked(),y:await page.locator('#imageFlipYInput').isChecked()}
const meshFrame1=await canvasHash()
if(frame1Checks.x || frame1Checks.y) throw new Error('1コマ目の反転が2コマ目へ漏れました')
if(meshFrame1.hash!==meshBaseline.hash) throw new Error('未設定の2コマ目のメッシュ描画が変化しました')
await selectBone('頭')
const headFrame1=await headTransform()
if(headFrame1!==headBefore) throw new Error('頭の反転が2コマ目へ漏れました')

const saved=JSON.parse(await page.locator('#jsonArea').inputValue())
if(saved.animations.at(-1).frames[0][armId].imageFlipX!==true || saved.animations.at(-1).frames[0][armId].imageFlipY!==true) throw new Error('右腕のコマ別反転がJSONにありません')
if(saved.animations.at(-1).frames[0][headId].imageFlipX!==true) throw new Error('頭のコマ別反転がJSONにありません')
if('imageFlipX' in saved.animations.at(-1).frames[1][armId] || 'imageFlipY' in saved.animations.at(-1).frames[1][armId]) throw new Error('未変更の2コマ目へ反転値が追加されました')

await page.locator('#jsonArea').evaluate((textarea,value)=>{textarea.value=value},JSON.stringify(saved))
await page.locator('#applyJsonBtn').evaluate(button=>button.click())
await page.locator('#animationSelect').selectOption('test_frame_flips')
await selectBone('右腕')
const restored={x:await page.locator('#imageFlipXInput').isChecked(),y:await page.locator('#imageFlipYInput').isChecked()}
if(!restored.x || !restored.y) throw new Error('JSON再読込後にコマ別反転が復元されません')
await page.screenshot({path:'output/bone-editor-frame-part-flips-on.png',fullPage:true})

await page.locator('#playBtn').click()
await page.waitForFunction(()=>document.querySelector('.frame-btn.active .frame-no')?.textContent?.trim()==='2')
await page.waitForTimeout(80)
const playbackChecks={x:await page.locator('#imageFlipXInput').isChecked(),y:await page.locator('#imageFlipYInput').isChecked()}
const meshPlaybackFrame1=await canvasHash()
if(playbackChecks.x || playbackChecks.y) throw new Error('再生で2コマ目へ進んでも反転UIが切り替わりません')
if(meshPlaybackFrame1.hash!==meshBaseline.hash) throw new Error('再生で2コマ目へ進んでもメッシュ描画が未反転へ戻りません')

await page.locator('#animationSelect').selectOption('default')
await selectBone('頭')
await page.locator('#imageFlipYInput').check()
await page.locator('#animationSelect').selectOption('test_frame_flips')
await page.locator('.frame-btn').nth(1).click()
await selectBone('頭')
if(await page.locator('#imageFlipYInput').isChecked()) throw new Error('デフォルトの反転変更が既存モーションのコマへ漏れました')

await page.screenshot({path:'output/bone-editor-frame-part-flips.png',fullPage:true})
if(errors.length) throw new Error(errors.join(' | '))
console.log(JSON.stringify({headId,armId,armBindingId,meshBaseline,meshFlipXOnly,meshFrame0,meshDiff,headRectBefore,headRectAfter,meshFrame1,frame1Checks,restored,playbackChecks,meshPlaybackFrame1,errors},null,2))
await browser.close()
