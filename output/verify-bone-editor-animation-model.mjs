import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:960}})
const baseUrl=process.env.BONE_EDITOR_URL || 'http://192.168.0.209:5173'
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))
page.on('dialog',dialog=>dialog.accept())

await page.goto(`${baseUrl}/2d_bone_editor_split/`,{waitUntil:'networkidle'})
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createStandardProjectBtn').click()

const initial=await page.evaluate(()=>(
  {defaultFrames:activeFrames().length,animations:project.animations.length,legacyFrames:'frames' in project,legacyPoses:'poseEntries' in project,groups:'defaultLayerGroups' in project,addDisabled:document.querySelector('#addFrameBtn').disabled,playDisabled:document.querySelector('#playBtn').disabled,motionButton:document.querySelector('#motionManagerBtn')?.textContent.trim()}
))
if(initial.defaultFrames!==1||initial.animations!==0||initial.legacyFrames||initial.legacyPoses||initial.groups||!initial.addDisabled||!initial.playDisabled||initial.motionButton!=='モーション') throw new Error(`デフォルト構造が不正です: ${JSON.stringify(initial)}`)

await page.locator('#motionManagerBtn').click()
await page.locator('#newMotionNameInput').fill('歩行')
await page.locator('#createMotionBtn').click()
await page.locator('#dupFrameBtn').click()
const created=await page.evaluate(()=>{
  const animation=currentAnimation(),root=getRootId(),base=project.defaultFrame[root].x
  animation.frames[1][root].x=base+100
  render()
  return {id:animation.id,name:animation.name,frames:animation.frames.length,root,base,frame0:animation.frames[0][root].x,frame1:animation.frames[1][root].x,defaultX:project.defaultFrame[root].x,groups:'layerGroups' in animation}
})
if(created.name!=='歩行'||created.frames!==2||created.frame0!==created.base||created.frame1!==created.base+100||created.defaultX!==created.base||created.groups) throw new Error(`モーション作成が不正です: ${JSON.stringify(created)}`)

await page.locator('#motionManagerBtn').click()
await page.locator('#newMotionNameInput').fill('走行')
await page.locator('#motionCreateMode').selectOption('copy')
await page.locator('#motionCopySourceSelect').selectOption(created.id)
await page.screenshot({path:'output/bone-editor-motion-manager.png',fullPage:true})
await page.locator('#createMotionBtn').click()
const duplicated=await page.evaluate(()=>({id:currentAnimation().id,name:currentAnimation().name,frames:currentAnimation().frames.length,frame1:currentAnimation().frames[1][getRootId()].x,animationCount:project.animations.length,groups:'layerGroups' in currentAnimation()}))
if(duplicated.name!=='走行'||duplicated.frames!==2||duplicated.frame1!==created.base+100||duplicated.animationCount!==2||duplicated.groups) throw new Error(`既存モーション複製が不正です: ${JSON.stringify(duplicated)}`)

await page.locator('#animationSelect').selectOption(created.id)
await page.locator('.frame-btn').nth(1).click()
await page.locator('#copyFrameToMotionBtn').click()
const targetOptions=await page.locator('#copyFrameTargetSelect option').allTextContents()
if(targetOptions.length!==1||!targetOptions[0].startsWith('走行')) throw new Error(`複製先候補が不正です: ${JSON.stringify(targetOptions)}`)
await page.screenshot({path:'output/bone-editor-copy-frame-to-motion.png',fullPage:true})
await page.locator('#copyFrameApplyBtn').click()
const copied=await page.evaluate(targetId=>{
  const target=project.animations.find(animation=>animation.id===targetId),root=getRootId()
  return {frames:target.frames.length,lastX:target.frames.at(-1)[root].x,sourceX:currentFrameData()[root].x,imageSources:Object.keys(project.imageSources).length}
},duplicated.id)
if(copied.frames!==3||copied.lastX!==copied.sourceX) throw new Error(`別モーションへのフレーム複製が不正です: ${JSON.stringify(copied)}`)

await page.locator('#motionManagerBtn').click()
await page.locator('.motion-list-item').filter({hasText:'走行'}).click()
await page.locator('#deleteManagedMotionBtn').click()
const deletion=await page.evaluate(()=>({animationCount:project.animations.length,names:project.animations.map(animation=>animation.name),editing:currentAnimation()?.name || 'デフォルト'}))
if(deletion.animationCount!==1||deletion.names.includes('走行')||deletion.editing!=='歩行') throw new Error(`モーション削除が不正です: ${JSON.stringify(deletion)}`)
await page.locator('#motionManagerCloseBtn').click()

await page.locator('#saveMenuBtn').click()
await page.locator('#projectNameInput').fill(`animation_model_test_${Date.now()}`)
await page.locator('#saveSourceJsonBtn').click()
await page.waitForFunction(()=>Boolean(currentSourceProjectId)&&!document.querySelector('#saveDialog').open)
const sourceId=await page.evaluate(()=>currentSourceProjectId)
const persisted=await page.evaluate(async id=>{
  const library=await fetch('/api/local/bone-motion-projects',{cache:'no-store'}).then(response=>response.json())
  const saved=library.projects.find(entry=>entry.id===id)?.project
  return {hasDefault:!!saved?.defaultFrame,animations:saved?.animations?.map(animation=>({name:animation.name,frames:animation.frames.length,groups:'layerGroups' in animation})),groups:'defaultLayerGroups' in saved,legacyFrames:'frames' in saved,legacyPoses:'poseEntries' in saved}
},sourceId)
if(!persisted.hasDefault||persisted.animations?.length!==1||persisted.animations[0].frames!==2||persisted.animations[0].groups||persisted.groups||persisted.legacyFrames||persisted.legacyPoses) throw new Error(`保存JSONが不正です: ${JSON.stringify(persisted)}`)

const migration=await page.evaluate(()=>{
  const legacy=clone(project),first=clone(project.defaultFrame),second=clone(project.defaultFrame),root=project.layerOrder[0]
  second[root].r+=15
  delete legacy.defaultFrame
  delete legacy.animations
  legacy.frames=[first,second]
  legacy.poseEntries=[{layerGroups:[{name:'旧専用',layerIds:[root]}]}]
  legacy.defaultLayerGroups=[{name:'旧共通',layerIds:legacy.layerOrder}]
  replaceCurrentProject(legacy,null)
  return {hasDefault:!!project.defaultFrame,animations:project.animations.length,name:project.animations[0]?.name,frames:project.animations[0]?.frames.length,rotation:project.animations[0]?.frames[1]?.[root]?.r,legacyFrames:'frames' in project,legacyPoses:'poseEntries' in project,groups:'defaultLayerGroups' in project||'layerGroups' in project.animations[0]}
})
if(!migration.hasDefault||migration.animations!==1||migration.name!=='既存モーション'||migration.frames!==2||migration.rotation!==15||migration.legacyFrames||migration.legacyPoses||migration.groups) throw new Error(`旧JSON移行が不正です: ${JSON.stringify(migration)}`)

await page.evaluate(async id=>{
  await fetch('/api/local/bone-motion-projects',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
  localStorage.removeItem('bone_editor_current_source_project_v1')
},sourceId)
if(errors.length) throw new Error(`console errors: ${errors.join(' | ')}`)
console.log(JSON.stringify({initial,created,duplicated,targetOptions,copied,deletion,persisted,migration,cleanup:sourceId,errors},null,2))
await browser.close()
