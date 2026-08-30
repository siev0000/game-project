import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:960}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))
page.on('dialog',dialog=>dialog.accept())
const svg=(color,mark)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360"><rect width="240" height="360" fill="${color}"/><circle cx="120" cy="90" r="54" fill="#fff"/><text x="120" y="102" text-anchor="middle" font-size="38" fill="#111">${mark}</text></svg>`)
const files={
  body:[{name:'body_gold.svg',mimeType:'image/svg+xml',buffer:svg('#d89b28','B1')},{name:'body_blue.svg',mimeType:'image/svg+xml',buffer:svg('#2386c8','B2')}],
  face:[{name:'face_normal.svg',mimeType:'image/svg+xml',buffer:svg('#45b878','F1')},{name:'face_damage.svg',mimeType:'image/svg+xml',buffer:svg('#c84c54','F2')}]
}

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createStandardProjectBtn').click()
await page.locator('#settingsBtn').click()
await page.locator('#baseImageInput').setInputFiles(files.body)
await page.waitForFunction(()=>project.imageSlots?.body?.sourceIds?.length===2)
await page.evaluate(()=>{imageUploadTargetSlot='face'})
await page.locator('#baseImageInput').setInputFiles(files.face)
await page.waitForFunction(()=>project.imageSlots?.face?.sourceIds?.length===2)
const registered=await page.evaluate(()=>Object.fromEntries(Object.entries(project.imageSlots).map(([id,slot])=>[id,{count:slot.sourceIds.length,active:project.imageSources[slot.activeSourceId]?.name || null}])))
if(registered.body.count!==2||registered.face.count!==2||registered.held.count!==0||registered.decoration.count!==0) throw new Error(`画像セット登録が不正です: ${JSON.stringify(registered)}`)
await page.screenshot({path:'output/bone-editor-image-slots-settings.png',fullPage:true})
await page.locator('#settingsCloseBtn').click()

const ids=await page.evaluate(()=>({head:project.layerOrder.find(id=>project.layers[id].key==='head'),hand:project.layerOrder.find(id=>project.layers[id].key==='handR'),chest:project.layerOrder.find(id=>project.layers[id].key==='chest')}))
await page.evaluate(({head,hand})=>{
  Object.assign(project.layers[head],{imageCropX:.2,imageCropY:.1,imageCropW:.5,imageCropH:.4,imageOffsetX:7,imageScaleX:1.3})
  Object.assign(project.layers[hand],{imageCropX:.1,imageCropY:.3,imageCropW:.6,imageCropH:.5,imageOffsetY:-4,imageScaleY:.8})
},ids)
await page.locator(`.layer-item[data-layer-id="${ids.head}"]`).click()
await page.locator('#imageSlotInput').selectOption('face')
await page.waitForFunction(id=>project.layers[id].imageSourceSlot==='face' && !!project.layers[id].imageFragmentData,ids.head)
await page.locator(`.layer-item[data-layer-id="${ids.hand}"]`).click()
await page.locator('#imageSlotInput').selectOption('body')
await page.waitForFunction(id=>project.layers[id].imageSourceSlot==='body' && !!project.layers[id].imageFragmentData,ids.hand)
await page.locator(`.layer-item[data-layer-id="${ids.chest}"]`).click()
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshBindingDialog[open]').waitFor()
await page.locator('#meshBindingApplyBtn').click()
await page.waitForFunction(id=>findMeshBindingForBone(id)?.imageSourceSlot==='body',ids.chest)

const before=await page.evaluate(({head,hand})=>({
  headSource:project.layers[head].imageSourceId,handSource:project.layers[hand].imageSourceId,
  headCrop:[project.layers[head].imageCropX,project.layers[head].imageCropY,project.layers[head].imageCropW,project.layers[head].imageCropH],
  handCrop:[project.layers[hand].imageCropX,project.layers[hand].imageCropY,project.layers[hand].imageCropW,project.layers[hand].imageCropH],
  headOffset:project.layers[head].imageOffsetX,handOffset:project.layers[hand].imageOffsetY,
  meshSource:findMeshBindingForBone(project.layerOrder.find(id=>project.layers[id].key==='chest'))?.sourceId
}),ids)

await page.locator('#settingsBtn').click()
const targets=await page.evaluate(()=>({body:project.imageSlots.body.sourceIds[1],face:project.imageSlots.face.sourceIds[1]}))
await page.locator('#imageSlotBodySelect').selectOption(targets.body)
await page.waitForFunction(({id,target})=>project.layers[id].imageSourceId===target,{id:ids.hand,target:targets.body})
const bodySwitched=await page.evaluate(({head,hand,before})=>({handChanged:project.layers[hand].imageSourceId!==before.handSource,headStayed:project.layers[head].imageSourceId===before.headSource}),{...ids,before})
if(!bodySwitched.handChanged||!bodySwitched.headStayed) throw new Error(`体画像だけの切り替えが不正です: ${JSON.stringify(bodySwitched)}`)
await page.locator('#imageSlotFaceSelect').selectOption(targets.face)
await page.waitForFunction(({id,target})=>project.layers[id].imageSourceId===target,{id:ids.head,target:targets.face})
await page.locator('#settingsCloseBtn').click()

const after=await page.evaluate(({head,hand})=>({
  headSource:project.layers[head].imageSourceId,handSource:project.layers[hand].imageSourceId,
  headCrop:[project.layers[head].imageCropX,project.layers[head].imageCropY,project.layers[head].imageCropW,project.layers[head].imageCropH],
  handCrop:[project.layers[hand].imageCropX,project.layers[hand].imageCropY,project.layers[hand].imageCropW,project.layers[hand].imageCropH],
  headOffset:project.layers[head].imageOffsetX,handOffset:project.layers[hand].imageOffsetY,
  bodyActive:project.imageSources[project.imageSlots.body.activeSourceId].name,
  faceActive:project.imageSources[project.imageSlots.face.activeSourceId].name,
  headSlot:project.layers[head].imageSourceSlot,handSlot:project.layers[hand].imageSourceSlot,
  headFragment:!!project.layers[head].imageFragmentData,handFragment:!!project.layers[hand].imageFragmentData
  ,meshSource:findMeshBindingForBone(project.layerOrder.find(id=>project.layers[id].key==='chest'))?.sourceId
  ,meshSlot:findMeshBindingForBone(project.layerOrder.find(id=>project.layers[id].key==='chest'))?.imageSourceSlot
}),ids)
if(after.headSource===before.headSource||after.handSource===before.handSource||after.meshSource===before.meshSource||after.meshSource!==targets.body||after.meshSlot!=='body'||JSON.stringify(after.headCrop)!==JSON.stringify(before.headCrop)||JSON.stringify(after.handCrop)!==JSON.stringify(before.handCrop)||after.headOffset!==before.headOffset||after.handOffset!==before.handOffset||after.headSlot!=='face'||after.handSlot!=='body'||!after.headFragment||!after.handFragment) throw new Error(`画像切替時にパーツ設定が維持されません: ${JSON.stringify({before,after})}`)
await page.screenshot({path:'output/bone-editor-image-slots-switched.png',fullPage:true})

await page.locator('#saveMenuBtn').click()
await page.locator('#projectNameInput').fill(`image_slots_test_${Date.now()}`)
await page.locator('#saveSourceJsonBtn').click()
await page.waitForFunction(()=>Boolean(currentSourceProjectId)&&!document.querySelector('#saveDialog').open)
const persisted=await page.evaluate(async ({head,hand})=>{
  const id=currentSourceProjectId
  const library=await fetch('/api/local/bone-motion-projects',{cache:'no-store'}).then(response=>response.json())
  const saved=library.projects.find(entry=>entry.id===id)?.project
  const mesh=Object.values(saved?.meshBindings || {}).find(binding=>binding.boneChain?.includes(Object.keys(saved.layers).find(key=>saved.layers[key].key==='chest')))
  await fetch('/api/local/bone-motion-projects',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
  return {bodyCount:saved?.imageSlots?.body?.sourceIds?.length,faceCount:saved?.imageSlots?.face?.sourceIds?.length,bodyActive:saved?.imageSlots?.body?.activeSourceId,headSlot:saved?.layers?.[head]?.imageSourceSlot,handSlot:saved?.layers?.[hand]?.imageSourceSlot,meshSlot:mesh?.imageSourceSlot}
},ids)
if(persisted.bodyCount!==2||persisted.faceCount!==2||!persisted.bodyActive||persisted.headSlot!=='face'||persisted.handSlot!=='body'||persisted.meshSlot!=='body') throw new Error(`画像セットの保存が不正です: ${JSON.stringify(persisted)}`)

if(errors.length) throw new Error(`console errors: ${errors.join(' | ')}`)
console.log(JSON.stringify({registered,ids,before,bodySwitched,after,persisted,errors},null,2))
await browser.close()
