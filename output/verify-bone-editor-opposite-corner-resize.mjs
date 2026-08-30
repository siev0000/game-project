import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const cases=[]
const directions={tl:{x:-28,y:-20},tr:{x:28,y:-20},bl:{x:-28,y:20},br:{x:28,y:20}}
const opposites={tl:'br',tr:'bl',bl:'tr',br:'tl'}

for(const mode of ['actual','display']){
  for(const corner of Object.keys(directions)){
    const page=await browser.newPage({viewport:{width:1440,height:960}})
    const errors=[]
    page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
    page.on('pageerror',error=>errors.push(error.message))
    await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
    await page.locator('#projectLibraryDialog[open]').waitFor()
    await page.locator('.project-card-main').filter({hasText:'pixel_side_motion'}).click()
    await page.locator('#showBones').evaluate(input=>{
      if(!input.checked){input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}))}
    })
    await page.locator('.layer-item').filter({has:page.locator('.bone-name',{hasText:/^右上腕$/})}).click()
    if(mode==='display') await page.locator('#boneDisplaySizeModeInput').check()

    const fixedHandle=page.locator(`#resizeBox .resize-handle.${opposites[corner]}`)
    const movingHandle=page.locator(`#resizeBox .resize-handle.${corner}`)
    const center=async locator=>{
      const box=await locator.boundingBox()
      return {x:box.x+box.width/2,y:box.y+box.height/2}
    }
    const fixedBefore=await center(fixedHandle)
    const movingBefore=await center(movingHandle)
    const actualBefore=await page.locator('#wInput').inputValue()
    const displayBefore=await page.locator('#boneDisplayWidthInput').inputValue()
    const delta=directions[corner]
    await page.mouse.move(movingBefore.x,movingBefore.y)
    await page.mouse.down()
    await page.mouse.move(movingBefore.x+delta.x,movingBefore.y+delta.y,{steps:6})
    await page.mouse.up()
    await page.waitForTimeout(80)
    const fixedAfter=await center(fixedHandle)
    const distance=Math.hypot(fixedAfter.x-fixedBefore.x,fixedAfter.y-fixedBefore.y)
    const actualAfter=await page.locator('#wInput').inputValue()
    const displayAfter=await page.locator('#boneDisplayWidthInput').inputValue()
    const json=await page.locator('#jsonArea').inputValue()
    if(distance>1.25) throw new Error(`${mode}/${corner}: 対角が ${distance.toFixed(2)}px 移動しました`)
    if(mode==='actual' && actualAfter===actualBefore) throw new Error(`${mode}/${corner}: 実サイズが変化しません`)
    if(mode==='display' && displayAfter===displayBefore) throw new Error(`${mode}/${corner}: 表示サイズが変化しません`)
    if(mode==='display' && actualAfter!==actualBefore) throw new Error(`${mode}/${corner}: 実サイズまで変化しました`)
    if(mode==='display' && !json.includes('editorBoneDisplayOffset')) throw new Error(`${mode}/${corner}: 表示枠オフセットが保存されません`)
    if(errors.length) throw new Error(`${mode}/${corner}: ${errors.join(' | ')}`)
    cases.push({mode,corner,fixedDistance:Number(distance.toFixed(3)),actualBefore,actualAfter,displayBefore,displayAfter})
    if(mode==='display' && corner==='tl') await page.screenshot({path:'output/bone-editor-opposite-corner-resize.png',fullPage:true})
    await page.close()
  }
}

console.log(JSON.stringify(cases,null,2))
await browser.close()
