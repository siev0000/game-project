import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1600,height:1000}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))

await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
const sourceCard=page.locator('.project-card').filter({has:page.locator('.project-card-name',{hasText:/^ver4$/})}).first()
await sourceCard.locator('.project-card-main').click()
await page.locator('.layer-item').filter({has:page.locator('.bone-name',{hasText:/^右上腕$/})}).click()
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshBindingDialog[open]').waitFor()

const before=await page.evaluate(()=>([...document.querySelectorAll('#meshChainEndSelect option')].map(option=>option.textContent)))
const hint=await page.locator('#meshChainRangeHint').textContent()
await page.locator('#meshChainEndSelect').selectOption({label:'右前腕'})
const shortened=await page.evaluate(()=>([...document.querySelectorAll('#meshControlOverlay .mesh-control-point')].map(point=>({
  label:point.nextElementSibling?.textContent || '',
  x:Number(point.getAttribute('cx')),
  y:Number(point.getAttribute('cy'))
}))))
await page.locator('#meshBindingApplyBtn').click()
await page.locator('#meshBindingDialog').waitFor({state:'hidden'})
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshBindingDialog[open]').waitFor()
const restored=await page.locator('#meshChainEndSelect').inputValue()
const restoredLabel=await page.locator('#meshChainEndSelect option:checked').textContent()
await page.screenshot({path:'output/bone-editor-upper-arm-to-arm-range.png',fullPage:true})

console.log(JSON.stringify({before,hint,shortened,restored,restoredLabel,errors},null,2))
if(JSON.stringify(before)!==JSON.stringify(['右前腕','右手'])) throw new Error(`upper-arm endpoints are incomplete or not short-first: ${JSON.stringify(before)}`)
if(!hint?.includes('右前腕まで') || !hint?.includes('右手まで')) throw new Error(`upper-arm range hint is incomplete: ${hint}`)
if(shortened.length!==3) throw new Error(`upper-arm to forearm should have three mesh points: ${shortened.length}`)
if(restoredLabel!=='右前腕') throw new Error(`upper-arm to forearm range was not restored: ${restoredLabel}`)
if(errors.length) throw new Error(`browser errors: ${errors.join(' / ')}`)
await browser.close()
