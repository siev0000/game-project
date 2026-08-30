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
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  const id=JSON.parse(document.querySelector('#jsonArea').value).layerOrder[0]
  window.selectBoneLayer(id)
  const stage=document.querySelector('#stage')
  const before=stage.getBoundingClientRect().width
  document.querySelector('#closeInspectorBtn').click()
  return {
    before,
    after:stage.getBoundingClientRect().width,
    workspaceOpen:document.querySelector('.workspace').classList.contains('inspector-open'),
    inspectorDisplay:getComputedStyle(document.querySelector('#inspector')).display,
    ariaHidden:document.querySelector('#inspector').getAttribute('aria-hidden')
  }
})
if(Math.abs(result.after-result.before)>.1 || !result.workspaceOpen || result.inspectorDisplay==='none' || result.ariaHidden!=='false') throw new Error(`右メニュー固定表示が不正です: ${JSON.stringify(result)}`)
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
await page.screenshot({path:'output/bone-editor-inspector-fixed.png',fullPage:true})
console.log(JSON.stringify({result,errors}))
await browser.close()
