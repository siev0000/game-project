import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'
import { join } from 'node:path'

const browser = await chromium.launch({ headless:true })
const page = await browser.newPage({ viewport:{ width:1440,height:960 } })
const errors = []
page.on('console', message => { if(message.type()==='error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createStandardProjectBtn').click()

await page.locator('#settingsBtn').click()
await page.locator('#settingsDialog[open]').waitFor()
const baseImage = join('2d_bone_editor_split','part_templates','technical','standard_2d','standard_2d_torso_sample.png')
await page.locator('#baseImageInput').setInputFiles(baseImage)
await page.waitForFunction(() => document.querySelector('#baseImageSourceStatus')?.textContent.includes('torso'))
const baseRegistered = await page.evaluate(() => ({
  modal:document.querySelector('#settingsDialog').matches(':modal'),
  sourceId:project.baseImageSourceId,
  assigned:project.layerOrder.filter(id => project.layers[id].imageSourceId).length,
  cropOpen:document.querySelector('#imageCropDialog').open,
  meshOpen:document.querySelector('#meshBindingDialog').open,
  status:document.querySelector('#baseImageSourceStatus')?.textContent
}))
let backgroundBlocked=false
try{ await page.locator('.layer-item').first().click({timeout:800}) }catch(error){ backgroundBlocked=true }
await page.screenshot({path:'output/bone-editor-base-image-default-settings.png',fullPage:true})
await page.locator('#settingsCloseBtn').click()

await page.locator('.layer-item').filter({hasText:'胸'}).click()
await page.locator('#editImageCropBtn').click()
await page.locator('#imageCropDialog[open]').waitFor()
const cropDefault = await page.evaluate(() => ({
  sourceId:cropEditorState.sourceId,
  baseImageSourceId:project.baseImageSourceId,
  shared:[...cropEditorState.shared].map(id => project.layers[id].name),
  available:[...cropEditorState.availableIds].map(id => project.layers[id].name),
  checkCount:document.querySelectorAll('#cropBoneChecks .crop-bone-check').length,
  sourceLabel:document.querySelector('#cropSourceLabel')?.textContent
}))
await page.locator('#imageCropApplyBtn').click()
await page.locator('#imageCropDialog').waitFor({state:'hidden'})
const cropApplied = await page.evaluate(() => ({
  assigned:project.layerOrder.filter(id => project.layers[id].imageSourceId).map(id => project.layers[id].name),
  chestRole:Object.values(project.layers).find(layer => layer.name==='胸')?.imageSourceRole
}))

await page.locator('.layer-item').filter({hasText:'腰'}).click()
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshBindingDialog[open]').waitFor()
await page.locator('#meshPreviewImage').evaluate(image => image.complete ? true : new Promise(resolve => image.addEventListener('load',resolve,{once:true})))
const torsoMesh = await page.evaluate(() => ({
  sourceId:meshEditorState.sourceId,
  baseImageSourceId:project.baseImageSourceId,
  slot:meshEditorState.partSlot,
  chain:meshEditorState.boneChain.map(id => project.layers[id].name),
  points:meshEditorState.controlPoints.map((point,index) => ({v:point.v,t:point.t,label:meshPointLabel(index)})),
  sourceLabel:document.querySelector('#meshSourceLabel')?.textContent
}))
await page.screenshot({path:'output/bone-editor-torso-mesh-waist-bottom.png',fullPage:true})
await page.locator('#meshBindingCancelBtn').click()

await page.locator('.layer-item').filter({hasText:'右上腕'}).click()
const additionalImage = join('2d_bone_editor_split','part_templates','technical','standard_2d','standard_2d_right_arm_sample.png')
await page.locator('#replaceImageInput').setInputFiles(additionalImage)
await page.locator('#imageCropDialog[open]').waitFor()
const additionalEditor = await page.evaluate(() => ({
  sourceId:cropEditorState.sourceId,
  baseImageSourceId:project.baseImageSourceId,
  shared:[...cropEditorState.shared].length,
  available:[...cropEditorState.availableIds].length,
  sourceLabel:document.querySelector('#cropSourceLabel')?.textContent
}))
await page.locator('#imageCropApplyBtn').click()
await page.locator('#imageCropDialog').waitFor({state:'hidden'})
const additionalApplied = await page.evaluate(() => {
  const layer=Object.values(project.layers).find(item=>item.name==='右上腕')
  return {role:layer?.imageSourceRole,sourceId:layer?.imageSourceId,baseImageSourceId:project.baseImageSourceId}
})

if(!baseRegistered.modal || !backgroundBlocked) throw new Error(`設定モーダルの背面が有効です: ${JSON.stringify({baseRegistered,backgroundBlocked})}`)
if(!baseRegistered.sourceId || baseRegistered.assigned!==0 || baseRegistered.cropOpen || baseRegistered.meshOpen) throw new Error(`基準画像が一括適用されました: ${JSON.stringify(baseRegistered)}`)
if(cropDefault.sourceId!==cropDefault.baseImageSourceId || cropDefault.shared.length!==1 || cropDefault.checkCount!==4 || cropDefault.available.length!==4 || !cropDefault.sourceLabel.startsWith('体:')) throw new Error(`部位分割で体画像が正しく初期選択されません: ${JSON.stringify(cropDefault)}`)
if(cropApplied.assigned.length!==1 || cropApplied.assigned[0]!=='胸' || cropApplied.chestRole!=='slot') throw new Error(`開いた部位以外へ体画像が適用されました: ${JSON.stringify(cropApplied)}`)
if(torsoMesh.slot!=='torso' || torsoMesh.sourceId!==torsoMesh.baseImageSourceId || torsoMesh.chain[0]!=='腰' || torsoMesh.points[0].v<.9 || torsoMesh.points.at(-1).v>.1 || !torsoMesh.points[0].label.startsWith('腰') || !torsoMesh.sourceLabel.startsWith('基準:')) throw new Error(`胴体メッシュの上下が不正です: ${JSON.stringify(torsoMesh)}`)
if(additionalEditor.sourceId===additionalEditor.baseImageSourceId || additionalEditor.shared!==1 || additionalEditor.sourceLabel.startsWith('基準:')) throw new Error(`追加画像が独立していません: ${JSON.stringify(additionalEditor)}`)
if(additionalApplied.role!=='additional' || additionalApplied.sourceId===additionalApplied.baseImageSourceId) throw new Error(`追加画像の適用状態が不正です: ${JSON.stringify(additionalApplied)}`)
if(errors.length) throw new Error(`console errors: ${errors.join(' | ')}`)

console.log(JSON.stringify({baseRegistered,backgroundBlocked,cropDefault,cropApplied,torsoMesh,additionalEditor,additionalApplied,errors},null,2))
await browser.close()
