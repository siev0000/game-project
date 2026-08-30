import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1600,height:1000}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))
page.on('dialog',dialog=>dialog.accept())

await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('#createStandardProjectBtn').click()
await page.locator('.layer-item').filter({has:page.locator('.bone-name',{hasText:/^首$/})}).click()
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshBindingDialog[open]').waitFor()
await page.locator('#meshChainEndSelect').selectOption({label:'頭'})
const neckSvg='<svg xmlns="http://www.w3.org/2000/svg" width="120" height="300"><rect x="34" y="8" width="52" height="284" rx="22" fill="#79d9ff"/></svg>'
await page.locator('#meshImageInput').setInputFiles({name:'neck-mesh.svg',mimeType:'image/svg+xml',buffer:Buffer.from(neckSvg)})
await page.locator('#meshBindingApplyBtn').click()
await page.locator('#meshBindingDialog').waitFor({state:'hidden'})

const detachButton=page.locator('#headerDetachMeshBindingBtn')
if(!await detachButton.isVisible()){
  const state=await page.evaluate(()=>([
    document.getElementById('headerDetachMeshBindingBtn')?.outerHTML,
    JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))?.meshBindings
  ]))
  throw new Error(`neck mesh detach button is not visible: ${JSON.stringify(state)}`)
}
await page.screenshot({path:'output/bone-editor-neck-mesh-detach-control.png',fullPage:true})
const before=await page.evaluate(() => {
  const draft=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  return {
    meshNames:Object.values(draft.meshBindings || {}).map(binding=>binding.name),
    imageSourceIds:Object.keys(draft.imageSources || {}),
    boneCount:Object.keys(draft.layers || {}).length,
    meshCanvases:document.querySelectorAll('.mesh-binding-canvas').length
  }
})
await detachButton.click()
await page.waitForTimeout(100)
const after=await page.evaluate(() => {
  const draft=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  return {
    meshNames:Object.values(draft.meshBindings || {}).map(binding=>binding.name),
    imageSourceIds:Object.keys(draft.imageSources || {}),
    boneCount:Object.keys(draft.layers || {}).length,
    meshCanvases:document.querySelectorAll('.mesh-binding-canvas').length
  }
})
await page.screenshot({path:'output/bone-editor-neck-mesh-detached.png',fullPage:true})

console.log(JSON.stringify({before,after,errors},null,2))
if(!before.meshNames.includes('首 → 頭') || after.meshNames.includes('首 → 頭')) throw new Error('neck-to-head mesh was not detached')
if(JSON.stringify(before.imageSourceIds)!==JSON.stringify(after.imageSourceIds)) throw new Error('detaching mesh removed an image source')
if(before.boneCount!==after.boneCount) throw new Error('detaching mesh removed a bone')
if(after.meshCanvases!==before.meshCanvases-1) throw new Error('detaching mesh did not remove exactly one mesh canvas')
if(await detachButton.isVisible() || await page.locator('#detachMeshBindingBtn').isVisible()) throw new Error('detach button remains visible after detaching the selected bone mesh')
if(errors.length) throw new Error(`browser errors: ${errors.join(' / ')}`)
await browser.close()
