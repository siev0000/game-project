import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.waitForFunction(()=>typeof window.replaceCurrentProject==='function')
await page.evaluate(async()=>{
  const entry=await fetch('/api/local/bone-motion-projects?id=motion_20260816133413_r1zy',{cache:'no-store'}).then(response=>response.json())
  window.replaceCurrentProject(entry.project,null)
  document.querySelector('#projectLibraryDialog')?.close()
  const select=document.querySelector('#animationSelect')
  select.value='animation_mt2ag0cy_n22u'
  select.dispatchEvent(new Event('change',{bubbles:true}))
  document.querySelector('#fpsInput').value='16'
})

const playback=await page.evaluate(()=>new Promise(resolve=>{
  const samples=[]
  const status=document.querySelector('#frameStatus')
  const observer=new MutationObserver(()=>{
    samples.push({frame:JSON.parse(window.render_game_to_text()).project.frame,ms:performance.now()})
  })
  observer.observe(status,{childList:true,subtree:true,characterData:true})
  const startedAt=performance.now()
  document.querySelector('#playBtn').click()
  setTimeout(()=>{
    const stoppedAt=performance.now()
    document.querySelector('#playBtn').click()
    observer.disconnect()
    const uniqueTimes=samples.map(sample=>sample.ms-startedAt)
    resolve({
      frameChanges:samples.length,
      elapsedMs:stoppedAt-startedAt,
      measuredFps:samples.length/((stoppedAt-startedAt)/1000),
      firstChangeMs:uniqueTimes[0] ?? null,
      lastChangeMs:uniqueTimes.at(-1) ?? null,
      stopped:document.querySelector('#playBtn').textContent,
      activeButtons:document.querySelectorAll('#frameList .frame-btn.active').length,
      frameCount:JSON.parse(window.render_game_to_text()).project.frameCount
    })
  },2100)
}))

if(playback.frameCount!==12 || playback.measuredFps<15.2 || playback.measuredFps>17.2 || playback.firstChangeMs<45 || playback.stopped!=='▶' || playback.activeButtons!==1){
  throw new Error(`16FPS再生が不正です: ${JSON.stringify(playback)}`)
}

await page.click('#playBtn')
await page.waitForTimeout(450)
await page.screenshot({path:'output/bone-editor-playback-16fps.png',fullPage:true})
await page.click('#playBtn')
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({playback,errors}))
await browser.close()
