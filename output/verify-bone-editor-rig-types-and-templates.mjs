import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = '2d_bone_editor_split/part_templates/technical'
const saveKit = (folder, kit, manifest) => {
  const target = join(root, folder)
  mkdirSync(target, { recursive: true })
  for (const entry of kit) {
    const base64 = entry.data.split(',')[1]
    writeFileSync(join(target, entry.name), Buffer.from(base64, 'base64'))
  }
  writeFileSync(join(target, `${folder}_part_manifest.json`), JSON.stringify(manifest, null, 2))
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
const initialChoices = await page.evaluate(() => ({
  standard: document.querySelector('#createStandardProjectBtn')?.textContent.trim(),
  pixelSide: document.querySelector('#createPixelSideProjectBtn')?.textContent.trim(),
  pixel: document.querySelector('#createPixelProjectBtn')?.textContent.trim(),
  front: document.querySelector('#createFrontProjectBtn')?.textContent.trim()
}))
await page.screenshot({ path: 'output/bone-editor-rig-type-selection.png', fullPage: true })

await page.locator('#createPixelSideProjectBtn').click()
await page.waitForTimeout(100)
const pixelSideState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const pixelSidePose = await page.evaluate(() => {
  const saved=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const byKey=Object.fromEntries(saved.layerOrder.map(id=>[saved.layers[id].key,{layer:saved.layers[id],pose:saved.frames[0][id]}]))
  return {chestWidth:byKey.chest.pose.w,headX:byKey.head.pose.x,armRAttach:byKey.armRU.layer.attachX,armLAttach:byKey.armLU.layer.attachX,legRU:byKey.legRU.pose.r,legLU:byKey.legLU.pose.r,footRFlip:byKey.footR.layer.shapeFlipX,footLFlip:byKey.footL.layer.shapeFlipX}
})
const sourceLibrary = JSON.parse(readFileSync('src/data/motion/boneMotionProjects.json', 'utf8'))
const adjustedPixelSide = sourceLibrary.projects.find(entry => entry.name === 'pixel_side_motion')?.project
if (!adjustedPixelSide) throw new Error('pixel_side_motion がソースJSONにありません')
const defaultPixelSide = await page.evaluate(() => {
  const saved=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  return Object.fromEntries(saved.layerOrder.map(id=>{
    const layer=saved.layers[id]
    return [layer.key,{pose:saved.frames[0][id],attachX:layer.attachX,attachY:layer.attachY,ox:layer.ox,oy:layer.oy,tailX:layer.tailX,tailY:layer.tailY,shapeFlipX:layer.shapeFlipX}]
  }))
})
const adjustedByKey = Object.fromEntries(adjustedPixelSide.layerOrder.map(id=>{
  const layer=adjustedPixelSide.layers[id]
  return [layer.key,{pose:adjustedPixelSide.frames[0][id],attachX:layer.attachX,attachY:layer.attachY,ox:layer.ox,oy:layer.oy,tailX:layer.tailX,tailY:layer.tailY,shapeFlipX:layer.shapeFlipX}]
}))
const pixelSideDifferences = Object.entries(adjustedByKey).flatMap(([key, expected]) => Object.entries(expected).flatMap(([property, value]) => {
  if(property === 'pose') return Object.entries(value).filter(([poseKey, poseValue]) => defaultPixelSide[key]?.pose?.[poseKey] !== poseValue).map(([poseKey, poseValue]) => `${key}.pose.${poseKey}: ${defaultPixelSide[key]?.pose?.[poseKey]} !== ${poseValue}`)
  return defaultPixelSide[key]?.[property] === value ? [] : [`${key}.${property}: ${defaultPixelSide[key]?.[property]} !== ${value}`]
}))
if(pixelSideDifferences.length) throw new Error(`ドット2D・横向きの新規デフォルトが pixel_side_motion と一致しません: ${pixelSideDifferences.join(', ')}`)
await page.screenshot({ path: 'output/bone-editor-pixel-15-side-rig.png', fullPage: true })
await page.locator('#projectListBtn').click()
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createPixelProjectBtn').click()
await page.waitForTimeout(100)
const pixelState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const pixelBones = await page.evaluate(() => {
  const saved=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  return saved.layerOrder.map(id=>({key:saved.layers[id].key,name:saved.layers[id].name,parent:saved.layers[id].parent ? saved.layers[saved.layers[id].parent]?.key : null}))
})
await page.screenshot({ path: 'output/bone-editor-pixel-15-rig.png', fullPage: true })
await page.locator('#saveMenuBtn').click()
await page.locator('#exportPartTemplateKitBtn').click()
await page.locator('#partReferenceDialog[open]').waitFor()
await page.locator('#partReferenceImage').evaluate(image => image.complete ? true : new Promise(resolve => image.addEventListener('load',resolve,{once:true})))
await page.locator('#partExampleImage').evaluate(image => image.complete ? true : new Promise(resolve => image.addEventListener('load',resolve,{once:true})))
const pixelReference = await page.evaluate(() => ({ label:document.querySelector('#partReferenceRigLabel')?.textContent,src:document.querySelector('#partReferenceImage')?.getAttribute('src'),width:document.querySelector('#partReferenceImage')?.naturalWidth,height:document.querySelector('#partReferenceImage')?.naturalHeight,note:document.querySelector('#partReferenceTypeNote')?.textContent }))
await page.screenshot({ path: 'output/bone-editor-pixel-part-reference.png', fullPage: true })
await page.locator('#partExampleImage').scrollIntoViewIfNeeded()
await page.screenshot({ path: 'output/bone-editor-pixel-part-example.png', fullPage: true })
await page.locator('#partReferenceCloseBtn').click()
await page.locator('.layer-item').filter({ hasText: '右上腕' }).click()
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshBindingDialog[open]').waitFor()
const pixelChain = await page.locator('#meshChainSelect').locator('option:checked').textContent()
await page.screenshot({ path: 'output/bone-editor-pixel-simple-mesh.png', fullPage: true })
await page.locator('#meshBindingCancelBtn').click()
const pixelKit = await page.evaluate(() => window.getPartTemplateKit())
const pixelManifest = await page.evaluate(() => window.getPartTemplateManifest())
saveKit('pixel_simple', pixelKit, pixelManifest)
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshImageInput').setInputFiles(join(root, 'pixel_simple', 'pixel_simple_right_arm_sample.png'))
await page.locator('#meshBindingApplyBtn').click()
await page.waitForTimeout(120)
const pixelApplied = await page.evaluate(() => ({ bindings:Object.keys(JSON.parse(localStorage.getItem('bone_editor_compact_single_v34')).meshBindings || {}).length, canvases:document.querySelectorAll('.mesh-binding-canvas').length }))
await page.screenshot({ path: 'output/bone-editor-pixel-template-applied.png', fullPage: true })

await page.locator('#projectListBtn').click()
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createStandardProjectBtn').click()
await page.waitForTimeout(100)
const sideState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const sidePose = await page.evaluate(() => {
  const saved=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const byKey=Object.fromEntries(saved.layerOrder.map(id=>[saved.layers[id].key,{layer:saved.layers[id],pose:saved.frames[0][id]}]))
  return {chestWidth:byKey.chest.pose.w,armRAttach:byKey.armRU.layer.attachX,armLAttach:byKey.armLU.layer.attachX,armRU:byKey.armRU.pose.r,armLU:byKey.armLU.pose.r}
})
await page.screenshot({ path: 'output/bone-editor-standard-side-rig.png', fullPage: true })
await page.locator('#projectListBtn').click()
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createFrontProjectBtn').click()
await page.waitForTimeout(100)
const standardState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const standardFrontPose = await page.evaluate(() => {
  const saved=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const byKey=Object.fromEntries(saved.layerOrder.map(id=>[saved.layers[id].key,{layer:saved.layers[id],pose:saved.frames[0][id]}]))
  return {chestWidth:byKey.chest.pose.w,armRAttach:byKey.armRU.layer.attachX,armLAttach:byKey.armLU.layer.attachX,armRU:byKey.armRU.pose.r,armLU:byKey.armLU.pose.r,legRU:byKey.legRU.pose.r,legLU:byKey.legLU.pose.r,footR:{ox:byKey.footR.layer.ox,tailX:byKey.footR.layer.tailX,flip:byKey.footR.layer.shapeFlipX},footL:{ox:byKey.footL.layer.ox,tailX:byKey.footL.layer.tailX,flip:byKey.footL.layer.shapeFlipX},partGroups:saved.partGroups}
})
await page.screenshot({ path: 'output/bone-editor-standard-front-rig.png', fullPage: true })
await page.locator('#saveMenuBtn').click()
await page.locator('#exportPartTemplateKitBtn').click()
await page.locator('#partReferenceDialog[open]').waitFor()
await page.locator('#partReferenceImage').evaluate(image => image.complete ? true : new Promise(resolve => image.addEventListener('load',resolve,{once:true})))
await page.locator('#partExampleImage').evaluate(image => image.complete ? true : new Promise(resolve => image.addEventListener('load',resolve,{once:true})))
const standardReference = await page.evaluate(() => ({ label:document.querySelector('#partReferenceRigLabel')?.textContent,src:document.querySelector('#partReferenceImage')?.getAttribute('src'),width:document.querySelector('#partReferenceImage')?.naturalWidth,height:document.querySelector('#partReferenceImage')?.naturalHeight,note:document.querySelector('#partReferenceTypeNote')?.textContent }))
await page.screenshot({ path: 'output/bone-editor-standard-part-reference.png', fullPage: true })
await page.locator('#partReferenceCloseBtn').click()
const standardKit = await page.evaluate(() => window.getPartTemplateKit())
const standardManifest = await page.evaluate(() => window.getPartTemplateManifest())
saveKit('standard_2d', standardKit, standardManifest)
await page.locator('.layer-item').filter({ hasText: '右上腕' }).click()
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshImageInput').setInputFiles(join(root, 'standard_2d', 'standard_2d_right_arm_sample.png'))
await page.locator('#meshBindingApplyBtn').click()
await page.waitForTimeout(120)
const standardApplied = await page.evaluate(() => ({ bindings:Object.keys(JSON.parse(localStorage.getItem('bone_editor_compact_single_v34')).meshBindings || {}).length, canvases:document.querySelectorAll('.mesh-binding-canvas').length }))
await page.screenshot({ path: 'output/bone-editor-standard-template-applied.png', fullPage: true })

const summarize = kit => ({ count: kit.length, names: kit.map(entry => entry.name) })
console.log(JSON.stringify({ initialChoices, pixelSideState, pixelSidePose, pixelSideDefaultMatchesAdjustedProject:pixelSideDifferences.length===0, pixelState, pixelBones, pixelReference, pixelChain, pixelKit: summarize(pixelKit), pixelManifest:{parts:pixelManifest.parts.length,first:pixelManifest.parts[0]}, pixelApplied, sideState, sidePose, standardState, standardFrontPose, standardReference, standardKit: summarize(standardKit), standardManifest:{parts:standardManifest.parts.length,first:standardManifest.parts[0]}, standardApplied, errors }, null, 2))
await browser.close()
