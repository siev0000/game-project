import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.waitForFunction(()=>typeof window.replaceCurrentProject==='function')
const result=await page.evaluate(async()=>{
  const entry=await fetch('/api/local/bone-motion-projects?id=motion_20260815095021_85vj',{cache:'no-store'}).then(response=>response.json())
  const project=entry.project
  project.meta.display.bones=true
  project.meta.display.boneColors=true
  const parentId=project.layerOrder.find(id=>project.layerOrder.some(childId=>project.layers[childId].parent===id))
  const childId=project.layerOrder.find(id=>project.layers[id].parent===parentId)
  project.layers[parentId].color='#ff00aa'
  window.replaceCurrentProject(project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  window.selectBoneLayer(parentId)
  const parentImage=document.querySelector(`.layer[data-id="${parentId}"] .image-transform`)
  const childImage=document.querySelector(`.layer[data-id="${childId}"] .image-transform`)
  const parentLayer=document.querySelector(`.layer[data-id="${parentId}"]`)
  const childLayer=document.querySelector(`.layer[data-id="${childId}"]`)
  const shape=document.querySelector(`.bone-overlay-item[data-id="${parentId}"] .bone-overlay-shape`)
  const parentOverlay=document.querySelector(`.bone-overlay-item[data-id="${parentId}"]`)
  const childOverlay=document.querySelector(`.bone-overlay-item[data-id="${childId}"]`)
  return {
    parentId,childId,
    parentBranch:parentLayer.classList.contains('selected-branch'),
    childBranch:childLayer.classList.contains('selected-branch'),
    parentOpacity:parentImage.style.opacity,
    childOpacity:childImage.style.opacity,
    parentImageVisible:getComputedStyle(parentImage).display!=='none',
    childImageVisible:getComputedStyle(childImage).display!=='none',
    parentZ:Number(parentLayer.style.zIndex),
    childZ:Number(childLayer.style.zIndex),
    parentOverlayZ:Number(parentOverlay.style.zIndex),
    childOverlayZ:Number(childOverlay.style.zIndex),
    shapeStroke:shape.querySelector('polygon').getAttribute('stroke')
  }
})
const failures=[
  result.parentBranch && 'parentBranch',
  result.childBranch && 'childBranch',
  Math.abs(Number(result.parentOpacity)-1)>.001 && `parentOpacity:${result.parentOpacity}`,
  Math.abs(Number(result.childOpacity)-1)>.001 && `childOpacity:${result.childOpacity}`,
  result.parentZ>=10000 && `parentZ:${result.parentZ}`,
  result.childZ>=10000 && `childZ:${result.childZ}`,
  result.parentOverlayZ<=result.childOverlayZ && `overlayZ:${result.parentOverlayZ}/${result.childOverlayZ}`,
  result.shapeStroke!=='#ff00aa' && `shapeStroke:${result.shapeStroke}`
].filter(Boolean)
if(failures.length) throw new Error(`選択枝プレビューまたは色設定が不正です: ${failures.join(', ')} ${JSON.stringify(result)}`)
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
await page.screenshot({path:'output/bone-editor-selection-preview.png',fullPage:true})
console.log(JSON.stringify({result,errors}))
await browser.close()
