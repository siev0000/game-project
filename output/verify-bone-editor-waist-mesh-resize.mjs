import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
page.setDefaultTimeout(5000)
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(`pageerror: ${error.stack || error.message}`))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('.project-card').filter({hasText:'鎧デフォルト'}).locator('.project-card-main').click()
await page.waitForTimeout(300)
console.log('load-state',await page.evaluate(()=>({dialogOpen:document.querySelector('#projectLibraryDialog')?.open})),errors)
await page.locator('.layer-item').filter({has:page.locator('.bone-name').filter({hasText:/^腰$/})}).click()

const read=()=>page.evaluate(()=>{
  const waist=[...document.querySelectorAll('.layer')].find(element=>element.querySelector('.layer-label')?.textContent==='腰')
  const chest=[...document.querySelectorAll('.layer')].find(element=>element.querySelector('.layer-label')?.textContent==='胸')
  const box=document.querySelector('#resizeBox')
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const binding=Object.values(project.meshBindings).find(item=>item.partSlot==='torso')
  const waistId=Object.keys(project.layers).find(id=>project.layers[id].name==='腰')
  const chestId=binding.boneChain[1]
  return {
    waistPose:{w:parseFloat(waist.style.width),h:parseFloat(waist.style.height)},
    waistSelection:{outline:getComputedStyle(waist.querySelector('.layer-visual')).outlineStyle,headLabel:getComputedStyle(waist,'::after').display},
    chestPosition:{left:parseFloat(chest.style.left),top:parseFloat(chest.style.top)},
    meshBox:{left:parseFloat(box.style.left),top:parseFloat(box.style.top),w:parseFloat(box.style.width),h:parseFloat(box.style.height),bindingId:box.dataset.bindingId || null},
    sourceRect:{...binding.sourceRect},
    torsoGeometry:{waistOy:project.layers[waistId].oy,waistHeadY:project.layers[waistId].headY,waistTailY:project.layers[waistId].tailY,chestAttachY:project.layers[chestId].attachY},
    meshTransform:{x:binding.targetScaleX,y:binding.targetScaleY,offsetX:binding.targetOffsetX,offsetY:binding.targetOffsetY}
  }
})

const before=await read()
await page.screenshot({path:'output/bone-editor-waist-mesh-range-before.png',fullPage:true})
const handle=page.locator('#resizeBox .resize-handle.br')
const handleBox=await handle.boundingBox()
await page.mouse.move(handleBox.x+handleBox.width/2,handleBox.y+handleBox.height/2)
await page.mouse.down()
await page.mouse.move(handleBox.x+handleBox.width/2+42,handleBox.y+handleBox.height/2+36,{steps:5})
await page.mouse.up()
const after=await read()
await page.screenshot({path:'output/bone-editor-waist-mesh-resize.png',fullPage:true})
console.log(JSON.stringify({before,after,errors},null,2))
await browser.close()
