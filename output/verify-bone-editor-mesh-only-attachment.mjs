import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.waitForFunction(()=>typeof window.replaceCurrentProject==='function')
const setup=await page.evaluate(async()=>{
  const entry=await fetch('/api/local/bone-motion-projects?id=motion_20260816133413_r1zy',{cache:'no-store'}).then(response=>response.json())
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const meshId=project.layerOrder.find(id=>project.layers[id]?.key==='armRL')
  const plainId=project.layerOrder.find(id=>project.layers[id]?.key==='head')
  return {meshId,plainId}
})

await page.locator(`.layer-item[data-layer-id="${setup.plainId}"]`).click()
await page.click('#moveModeBtn')
const plain=await page.evaluate(()=>({rowHidden:document.querySelector('#meshAttachRow').hidden,xDisabled:document.querySelector('#xInput').disabled}))
if(!plain.rowHidden || plain.xDisabled) throw new Error(`メッシュ外にも自動接続UIまたは移動ロックがあります: ${JSON.stringify(plain)}`)

await page.locator(`.layer-item[data-layer-id="${setup.meshId}"]`).click()
const meshOff=await page.evaluate(()=>({rowHidden:document.querySelector('#meshAttachRow').hidden,checked:document.querySelector('#attachedInput').checked,xDisabled:document.querySelector('#xInput').disabled}))
if(meshOff.rowHidden || meshOff.checked || meshOff.xDisabled) throw new Error(`メッシュ接続の初期OFF状態が不正です: ${JSON.stringify(meshOff)}`)

await page.check('#attachedInput')
const meshOn=await page.evaluate(({meshId})=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const layer=project.layers[meshId], pose=project.defaultFrame[meshId]
  const expected=window.attachedPoseOffset(layer,pose)
  return {checked:document.querySelector('#attachedInput').checked,xDisabled:document.querySelector('#xInput').disabled,attached:layer.attached,offsetError:Math.hypot(pose.x-expected.x,pose.y-expected.y)}
},setup)
if(!meshOn.checked || !meshOn.xDisabled || !meshOn.attached || meshOn.offsetError>.01) throw new Error(`メッシュ接続ONが不正です: ${JSON.stringify(meshOn)}`)

await page.uncheck('#attachedInput')
const meshAgainOff=await page.evaluate(()=>({checked:document.querySelector('#attachedInput').checked,xDisabled:document.querySelector('#xInput').disabled}))
if(meshAgainOff.checked || meshAgainOff.xDisabled) throw new Error(`メッシュ接続OFFで自由調整に戻りません: ${JSON.stringify(meshAgainOff)}`)
await page.screenshot({path:'output/bone-editor-mesh-only-attachment.png',fullPage:true})
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({setup,plain,meshOff,meshOn,meshAgainOff,errors}))
await browser.close()
