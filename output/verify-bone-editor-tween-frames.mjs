import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(String(error)))
await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.waitForFunction(()=>typeof window.replaceCurrentProject==='function')

async function installTestMotion(){
  await page.evaluate(()=>{
    const project=JSON.parse(document.querySelector('#jsonArea').value)
    const layerId=project.layerOrder[0]
    const frames=Array.from({length:6},(_,index)=>{
      const frame=structuredClone(project.defaultFrame)
      frame[layerId].x=index*12
      frame[layerId].r=[350,10,40,70,100,130][index]
      frame[layerId].morphId=index===0?'開始モーフ':'後続モーフ'
      frame[layerId].imageFlipX=index>0
      return frame
    })
    project.animations=[{id:'test_tween',name:'歩行',fps:6,loop:true,frames}]
    window.replaceCurrentProject(project,null)
    document.querySelector('#projectLibraryDialog')?.close()
    const select=document.querySelector('#animationSelect')
    select.value='test_tween'
    select.dispatchEvent(new Event('change',{bubbles:true}))
  })
}

await installTestMotion()
await page.click('#tweenFrameBtn')
await page.selectOption('#tweenPartialCountSelect','1')
await page.click('#tweenFrameApplyBtn')
const partial=await page.evaluate(()=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const animation=project.animations.find(item=>item.id==='test_tween')
  const layerId=project.layerOrder[0]
  const pose=animation.frames[1][layerId]
  return {frameCount:animation.frames.length,x:pose.x,r:pose.r,morphId:pose.morphId,imageFlipX:pose.imageFlipX,editing:JSON.parse(window.render_game_to_text()).project}
})
if(partial.frameCount!==7 || partial.x!==6 || partial.r!==360 || partial.morphId!=='開始モーフ' || partial.imageFlipX!==false){
  throw new Error(`部分中割の結果が不正です: ${JSON.stringify(partial)}`)
}

await installTestMotion()
await page.click('#tweenFrameBtn')
await page.getByText('全体生成',{exact:true}).click()
await page.selectOption('#tweenWholeMultiplierSelect','2')
await page.click('#tweenFrameApplyBtn')
const whole=await page.evaluate(()=>{
  const project=JSON.parse(document.querySelector('#jsonArea').value)
  const source=project.animations.find(item=>item.id==='test_tween')
  const generated=project.animations.find(item=>item.id!=='test_tween')
  const layerId=project.layerOrder[0]
  return {
    animationCount:project.animations.length,
    sourceFrames:source.frames.length,
    generatedFrames:generated.frames.length,
    generatedFps:generated.fps,
    generatedName:generated.name,
    middle:{x:generated.frames[1][layerId].x,r:generated.frames[1][layerId].r,morphId:generated.frames[1][layerId].morphId,imageFlipX:generated.frames[1][layerId].imageFlipX},
    originalSecond:{x:generated.frames[2][layerId].x,r:generated.frames[2][layerId].r},
    editing:JSON.parse(window.render_game_to_text()).project
  }
})
if(whole.animationCount!==2 || whole.sourceFrames!==6 || whole.generatedFrames!==12 || whole.generatedFps!==12 || whole.middle.x!==6 || whole.middle.r!==360 || whole.middle.morphId!=='開始モーフ' || whole.middle.imageFlipX!==false || whole.originalSecond.x!==12 || whole.originalSecond.r!==10 || whole.editing.frameCount!==12){
  throw new Error(`全体中割の結果が不正です: ${JSON.stringify(whole)}`)
}

await page.click('#tweenFrameBtn')
await page.getByText('全体生成',{exact:true}).click()
await page.selectOption('#tweenWholeMultiplierSelect','3')
await page.screenshot({path:'output/bone-editor-tween-frames.png',fullPage:true})
if(errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)
console.log(JSON.stringify({partial,whole,errors}))
await browser.close()
