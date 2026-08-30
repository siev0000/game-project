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
  project.meta.display.boneColorIntensity=100
  const id=project.layerOrder[0]
  project.layers[id].color='#ff00aa'
  window.replaceCurrentProject(project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  window.selectBoneLayer(id)
  const range=document.querySelector('#settingBoneColorIntensity')
  range.value='42'
  range.dispatchEvent(new Event('input',{bubbles:true}))
  const shape=document.querySelector(`.bone-overlay-item[data-id="${id}"] .bone-overlay-shape`)
  const polygon=shape.querySelector('polygon')
  return {
    rangeValue:range.value,
    label:document.querySelector('#settingBoneColorIntensityValue').textContent,
    opacity:shape.style.opacity,
    stroke:polygon.getAttribute('stroke'),
    strokeWidth:polygon.getAttribute('stroke-width'),
    fillOpacity:polygon.getAttribute('fill-opacity'),
    points:polygon.getAttribute('points')
  }
})
const failures=[
  result.rangeValue!=='42' && `rangeValue:${result.rangeValue}`,
  result.label!=='42%' && `label:${result.label}`,
  result.opacity!=='0.42' && `opacity:${result.opacity}`,
  result.stroke!=='#ff00aa' && `stroke:${result.stroke}`,
  result.strokeWidth!=='3' && `strokeWidth:${result.strokeWidth}`,
  result.fillOpacity!=='.14' && `fillOpacity:${result.fillOpacity}`,
  !result.points?.includes(',0 ') && `points:${result.points}`
].filter(Boolean)
if(failures.length) throw new Error(`ボーン色濃さまたは選択輪郭が不正です: ${failures.join(', ')} ${JSON.stringify(result)}`)
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
await page.click('#settingsBtn')
await page.waitForFunction(()=>document.querySelector('#settingsDialog')?.open===true)
await page.screenshot({path:'output/bone-editor-bone-color-intensity.png',fullPage:true})
console.log(JSON.stringify({result,errors}))
await browser.close()
