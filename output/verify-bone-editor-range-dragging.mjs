import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const baseUrl='http://127.0.0.1:5173'
const projectId='motion_20260815095021_85vj'
const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(String(error)))
await page.goto(`${baseUrl}/2d_bone_editor_split/`,{waitUntil:'networkidle'})
await page.waitForFunction(()=>typeof window.replaceCurrentProject==='function')
const target=await page.evaluate(async id=>{
  const entry=await fetch(`/api/local/bone-motion-projects?id=${encodeURIComponent(id)}`,{cache:'no-store'}).then(response=>response.json())
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  const data=JSON.parse(document.querySelector('#jsonArea').value)
  const binding=Object.values(data.meshBindings).find(item=>item.enabled!==false && item.boneChain?.length)
  return {boneId:binding.boneChain[0],bindingId:binding.id,before:binding.controlPoints}
},projectId)
await page.evaluate(id=>window.selectBoneLayer(id),target.boneId)
await page.locator('#editMeshBindingBtn').click()
await page.waitForSelector('#meshBindingDialog[open]')
const band=page.locator('.mesh-control-band')
const bandBox=await band.boundingBox()
if(!bandBox) throw new Error('連続メッシュの移動範囲が表示されません')
const start={x:bandBox.x+bandBox.width/2,y:bandBox.y+bandBox.height/2}
await page.mouse.move(start.x,start.y)
await page.mouse.down()
await page.mouse.move(start.x+28,start.y+18,{steps:4})
await page.mouse.up()
await page.locator('#meshBindingApplyBtn').click()
const meshResult=await page.evaluate(({bindingId,before})=>{
  window.exportJSON(false)
  const after=JSON.parse(document.querySelector('#jsonArea').value).meshBindings[bindingId].controlPoints
  return {before,after,delta:{u:after[0].u-before[0].u,v:after[0].v-before[0].v}}
},target)
if(Math.abs(meshResult.delta.u)<.001 || Math.abs(meshResult.delta.v)<.001) throw new Error(`帯域全体が移動していません: ${JSON.stringify(meshResult)}`)

// 部位分割では、同じselection DOMを保ったまま枠の座標を連続更新する。
await page.locator('#editImageCropBtn').click()
await page.waitForSelector('#imageCropDialog[open]')
const selection=page.locator('.crop-selection.active')
const selectionBox=await selection.boundingBox()
if(!selectionBox) throw new Error('部位分割の選択範囲が表示されません')
const beforeNode=await selection.evaluate(node=>node)
const cropStart={x:selectionBox.x+selectionBox.width/2,y:selectionBox.y+selectionBox.height/2}
await page.mouse.move(cropStart.x,cropStart.y)
await page.mouse.down()
await page.mouse.move(cropStart.x+24,cropStart.y+16,{steps:6})
const during=await selection.evaluate(node=>({same:node===document.querySelector('.crop-selection.active'),left:node.style.left,top:node.style.top,hasCapture:node.hasPointerCapture?.(1) ?? false}))
await page.mouse.up()
if(!during.same || !during.left || !during.top) throw new Error(`部位分割ドラッグ中に選択枠が作り直されています: ${JSON.stringify(during)}`)
await page.screenshot({path:'output/bone-editor-range-dragging.png',fullPage:true})
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({target,meshResult,during,errors}))
await browser.close()
