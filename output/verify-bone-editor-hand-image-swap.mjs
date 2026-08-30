import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:960}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.waitForFunction(()=>typeof window.replaceCurrentProject==='function')
await page.evaluate(async()=>{
  const entry=await fetch('/api/local/bone-motion-projects?id=motion_20260816133413_r1zy',{cache:'no-store'}).then(response=>response.json())
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
})

const selectBone=async name=>{
  await page.locator('.layer-item').filter({has:page.locator('.bone-name',{hasText:new RegExp(`^${name}$`)})}).click()
}
await selectBone('右手')
const handUi={
  label:await page.locator('#boneMorphLabel').textContent(),
  add:await page.locator('#addBoneMorphBtn').textContent(),
  noteVisible:await page.locator('#handSwapNote').isVisible()
}

const handSvg='<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><path fill="#ff2fb3" stroke="#ffffff" stroke-width="5" d="M14 45 L28 8 L38 34 L50 12 L52 38 L70 25 L61 58 L40 72 Z"/></svg>'
await page.locator('#handVariantImageInput').setInputFiles({name:'開いた手.svg',mimeType:'image/svg+xml',buffer:Buffer.from(handSvg)})
await page.waitForTimeout(150)

const afterUpload=await page.evaluate(()=>{
  const data=JSON.parse(document.querySelector('#jsonArea').value)
  const id=Object.entries(data.layers).find(([,layer])=>layer.name==='右手')[0]
  const morphId=data.defaultFrame[id].morphId
  const morph=data.layers[id].morphs[morphId]
  const source=data.imageSources[morph.imageSourceId]
  const image=document.querySelector(`.layer[data-id="${id}"] img`)
  return {
    id,morphId,morph,sourceName:source?.name,imageSrc:image?.src || '',
    imageOptions:[...document.querySelectorAll('#boneMorphImageSelect option')].map(option=>option.textContent),
    selected:document.querySelector('#boneMorphSelect').value
  }
})

await page.locator('#imageOffsetXInput').fill('13')
await page.locator('#imageOffsetXInput').dispatchEvent('change')
const adjustment=await page.evaluate(()=>{
  const data=JSON.parse(document.querySelector('#jsonArea').value)
  const id=Object.entries(data.layers).find(([,layer])=>layer.name==='右手')[0]
  const morphId=data.defaultFrame[id].morphId
  return {morphX:data.layers[id].morphs[morphId].imageOffsetX,baseX:data.layers[id].imageOffsetX}
})

await page.evaluate(()=>{
  const data=JSON.parse(document.querySelector('#jsonArea').value)
  const id=Object.entries(data.layers).find(([,layer])=>layer.name==='右手')[0]
  const first=structuredClone(data.defaultFrame)
  const second=structuredClone(data.defaultFrame)
  second[id].morphId=''
  data.animations=[{id:'hand_swap_test',name:'手差し替え確認',fps:2,loop:true,frames:[first,second]}]
  window.replaceCurrentProject(data,null)
})
await page.locator('#animationSelect').selectOption('hand_swap_test')
await selectBone('右手')
const storedFrames=await page.evaluate(()=>{
  const data=JSON.parse(document.querySelector('#jsonArea').value)
  const id=Object.entries(data.layers).find(([,layer])=>layer.name==='右手')[0]
  return data.animations.find(animation=>animation.id==='hand_swap_test').frames.map(frame=>frame[id].morphId)
})
await page.locator('.frame-btn').nth(0).click()
const frame1=await page.locator('#boneMorphSelect').inputValue()
await page.locator('.frame-btn').nth(1).click()
const frame2=await page.locator('#boneMorphSelect').inputValue()
await page.locator('.frame-btn').nth(0).click()
await page.locator('#playBtn').click()
const playbackSamples=[]
for(const wait of [180,420,520]){
  await page.waitForTimeout(wait)
  playbackSamples.push(await page.evaluate(()=>({
    frame:document.querySelector('.frame-btn.active .frame-no')?.textContent || '',
    handImage:document.querySelector('.layer.selected img')?.src || ''
  })))
}
await page.locator('#playBtn').click()
await page.locator('.frame-btn').nth(0).click()
await page.screenshot({path:'output/bone-editor-hand-image-swap.png',fullPage:true})

await selectBone('右前腕')
const nonHandUi={
  label:await page.locator('#boneMorphLabel').textContent(),
  add:await page.locator('#addBoneMorphBtn').textContent(),
  noteVisible:await page.locator('#handSwapNote').isVisible()
}

await page.locator('.frame-btn').nth(0).click()
await selectBone('右手')
page.once('dialog',dialog=>dialog.accept())
await page.locator('#deleteBoneMorphBtn').click()
const afterDelete=await page.evaluate(()=>{
  const data=JSON.parse(document.querySelector('#jsonArea').value)
  const id=Object.entries(data.layers).find(([,layer])=>layer.name==='右手')[0]
  return {
    morphExists:!!data.layers[id].morphs['開いた手'],
    frameMorphs:data.animations.find(animation=>animation.id==='hand_swap_test').frames.map(frame=>frame[id].morphId),
    sourceExists:Object.values(data.imageSources).some(source=>source.name==='開いた手.svg')
  }
})

const result={
  handUi,
  uploaded:{morphId:afterUpload.morphId,kind:afterUpload.morph.kind,sourceName:afterUpload.sourceName,imageIsSvg:afterUpload.imageSrc.startsWith('data:image/svg+xml'),imageOptions:afterUpload.imageOptions,selected:afterUpload.selected},
  adjustment,
  perFrame:{frame1,frame2},
  playbackSamples:playbackSamples.map(sample=>({frame:sample.frame,isAddedHand:sample.handImage.startsWith('data:image/svg+xml')})),
  storedFrames,
  nonHandUi,
  afterDelete,
  errors
}
console.log(JSON.stringify(result,null,2))
if(handUi.label!=='このコマの手' || handUi.add.trim()!=='＋手画像' || !handUi.noteVisible) throw new Error('hand replacement UI is not visible')
if(afterUpload.morph.kind!=='hand' || afterUpload.sourceName!=='開いた手.svg' || !afterUpload.imageSrc.startsWith('data:image/svg+xml')) throw new Error('hand image was not registered or rendered')
if(!afterUpload.imageOptions.includes('開いた手.svg') || adjustment.morphX!==13 || adjustment.baseX===13) throw new Error('hand image list or independent adjustment failed')
if(frame1!==afterUpload.morphId || frame2!=='') throw new Error('per-frame hand selection failed')
if(!playbackSamples.some(sample=>sample.frame==='1' && sample.handImage.startsWith('data:image/svg+xml')) || !playbackSamples.some(sample=>sample.frame==='2' && !sample.handImage.startsWith('data:image/svg+xml'))) throw new Error('hand image did not switch during playback')
if(nonHandUi.label!=='このコマのモーフ' || nonHandUi.noteVisible || errors.length) throw new Error('non-hand UI regression or browser error')
if(afterDelete.morphExists || afterDelete.sourceExists || afterDelete.frameMorphs.some(Boolean)) throw new Error('hand image deletion failed')
await browser.close()
