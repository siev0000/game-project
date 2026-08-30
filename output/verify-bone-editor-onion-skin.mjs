import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createPixelSideProjectBtn').click()

const headSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="44" fill="#ffd15c" stroke="#fff" stroke-width="6"/><circle cx="67" cy="43" r="7" fill="#182633"/></svg>`
await page.locator('.layer-item').filter({hasText:'頭'}).click()
await page.locator('#replaceImageInput').setInputFiles({name:'onion-head.svg',mimeType:'image/svg+xml',buffer:Buffer.from(headSvg)})
await page.locator('#imageCropDialog[open]').waitFor()
await page.locator('#imageCropApplyBtn').click()
await page.locator('#imageCropDialog').waitFor({state:'hidden'})

const armSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="420"><rect x="32" y="8" width="96" height="404" rx="38" fill="#67d8ff" stroke="#fff" stroke-width="6"/></svg>`
await page.locator('.layer-item').filter({hasText:'右上腕'}).click()
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshBindingDialog[open]').waitFor()
await page.locator('#meshChainStartSelect').selectOption({label:'右上腕'})
await page.locator('#meshChainEndSelect').selectOption({label:'右腕'})
await page.locator('#meshImageInput').setInputFiles({name:'onion-arm.svg',mimeType:'image/svg+xml',buffer:Buffer.from(armSvg)})
await page.locator('#meshPreviewImage').waitFor()
await page.locator('#meshBindingApplyBtn').click()
await page.locator('#meshBindingDialog').waitFor({state:'hidden'})

await page.locator('#motionManagerBtn').click()
await page.locator('#newMotionNameInput').fill('オニオン確認')
await page.locator('#createMotionBtn').click()
await page.locator('#dupFrameBtn').click()

const firstOff=await page.evaluate(()=>({checked:document.querySelector('#showOnionSkin').checked,display:getComputedStyle(document.querySelector('#onionSkinCanvas')).display}))
await page.locator('#showOnionSkin+span').click()
await page.waitForFunction(()=>{
  const canvas=document.querySelector('#onionSkinCanvas'),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data
  for(let i=3;i<pixels.length;i+=4) if(pixels[i]) return true
  return false
})

async function canvasState(){
  return page.evaluate(()=>{
    const canvas=document.querySelector('#onionSkinCanvas'),data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data
    let opaque=0,hash=2166136261
    for(let i=0;i<data.length;i+=4){
      if(data[i+3]) opaque++
      hash^=data[i]; hash=Math.imul(hash,16777619); hash^=data[i+1]; hash=Math.imul(hash,16777619); hash^=data[i+2]; hash=Math.imul(hash,16777619); hash^=data[i+3]; hash=Math.imul(hash,16777619)
    }
    const text=JSON.parse(window.render_game_to_text())
    return {display:getComputedStyle(canvas).display,opacity:getComputedStyle(canvas).opacity,opaque,hash:hash>>>0,canvasCount:document.querySelectorAll('#onionSkinCanvas').length,text}
  })
}

const frame2Before=await canvasState()
await page.evaluate(()=>{
  const frame=currentFrameData(),root=getRootId(); frame[root].x+=140; frame[root].y-=70; render()
})
await page.waitForTimeout(150)
const frame2AfterDragRender=await canvasState()

await page.locator('.frame-btn').nth(0).click()
const frame1=await canvasState()
await page.locator('.frame-btn').nth(1).click()
await page.waitForFunction(()=>document.querySelector('#onionSkinCanvas').classList.contains('visible'))
await page.waitForTimeout(120)
const frame2Restored=await canvasState()
await page.screenshot({path:'output/bone-editor-onion-skin.png',fullPage:true})
await page.locator('#showOnionSkin+span').click()
const toggledOff=await canvasState()

if(firstOff.checked || firstOff.display!=='none') throw new Error(`初期OFFが不正です: ${JSON.stringify(firstOff)}`)
if(frame2Before.display!=='block' || frame2Before.opacity!=='0.25' || frame2Before.opaque<=0 || frame2Before.canvasCount!==1) throw new Error(`2フレーム目の表示が不正です: ${JSON.stringify(frame2Before)}`)
if(frame2AfterDragRender.hash!==frame2Before.hash || frame2AfterDragRender.opaque!==frame2Before.opaque) throw new Error('ドラッグ中に前フレームCanvasが再生成されました')
if(frame1.display!=='none' || frame1.opaque!==0) throw new Error(`先頭フレームが非表示ではありません: ${JSON.stringify(frame1)}`)
if(frame2Restored.display!=='block' || frame2Restored.hash!==frame2Before.hash) throw new Error('フレーム再選択後の前フレームCanvasが一致しません')
if(toggledOff.display!=='none' || toggledOff.opaque!==0) throw new Error(`OFF切替が不正です: ${JSON.stringify(toggledOff)}`)
if(errors.length) throw new Error(`ブラウザエラー: ${errors.join(' / ')}`)

console.log(JSON.stringify({firstOff,frame2Before,frame2AfterDragRender,frame1,frame2Restored,toggledOff,errors},null,2))
await browser.close()
