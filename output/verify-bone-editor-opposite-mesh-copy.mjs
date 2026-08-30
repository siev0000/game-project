import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1600,height:1000}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))

await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
const sourceCard=page.locator('.project-card').filter({has:page.locator('.project-card-name',{hasText:/^ver4$/})}).first()
await sourceCard.locator('.project-card-main').click()

async function openMeshFor(name){
  await page.locator('.layer-item').filter({has:page.locator('.bone-name',{hasText:new RegExp(`^${name}$`)})}).click()
  await page.locator('#editMeshBindingBtn').click()
  await page.locator('#meshBindingDialog[open]').waitFor()
}

async function readEditor(){
  return page.evaluate(()=>({
    chain:document.querySelector('#meshChainSelect')?.selectedOptions[0]?.textContent,
    source:document.querySelector('#meshSourceLabel')?.textContent,
    sourceRect:['meshRangeXInput','meshRangeYInput','meshRangeWInput','meshRangeHInput'].map(id=>document.getElementById(id)?.value),
    points:[...document.querySelectorAll('#meshControlOverlay .mesh-control-point')].map(point=>[point.getAttribute('cx'),point.getAttribute('cy')]),
    polygon:document.querySelector('#meshControlOverlay .mesh-control-band')?.getAttribute('points')
  }))
}

await openMeshFor('右足')
const right=await readEditor()
const copyButton=page.locator('#meshRangeCopyOppositeBtn')
const enabled=await copyButton.isEnabled()
await copyButton.click()
const status=await page.locator('#meshRangeCopyStatus').textContent()
const bindingsAfterCopy=JSON.parse(await page.evaluate(()=>window.render_game_to_text())).meshBindings
await page.locator('#meshBindingCloseBtn').click()

await openMeshFor('左足')
const left=await readEditor()
await page.screenshot({path:'output/bone-editor-opposite-mesh-copy.png',fullPage:true})

const result={enabled,status,right,left,bindingNames:bindingsAfterCopy.map(binding=>binding.name),errors}
console.log(JSON.stringify(result,null,2))

if(!enabled) throw new Error('反対側が未作成のときコピーボタンが無効です')
if(!status?.includes('左足 → 左つま先を') || !status?.includes('同じ画像位置・変形範囲・メッシュ点にしました')) throw new Error('反対側メッシュのコピー結果が表示されません')
if(!result.bindingNames.includes('左足 → 左つま先')) throw new Error('左足側のメッシュ設定が作成されていません')
if(JSON.stringify(right.sourceRect)!==JSON.stringify(left.sourceRect)) throw new Error('青い変形範囲が同じ位置ではありません')
if(JSON.stringify(right.points)!==JSON.stringify(left.points) || right.polygon!==left.polygon) throw new Error('緑の中心線・幅・分割点が同じ位置ではありません')
if(right.source!==left.source) throw new Error('使用画像が同じではありません')
if(errors.length) throw new Error(`browser errors: ${errors.join(' / ')}`)

await browser.close()
