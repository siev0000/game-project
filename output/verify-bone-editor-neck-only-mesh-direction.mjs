import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser=await chromium.launch({headless:true})
const page=await browser.newPage({viewport:{width:1600,height:1000}})
const errors=[]
page.on('console',message=>{if(message.type()==='error') errors.push(message.text())})
page.on('pageerror',error=>errors.push(error.message))

await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/',{waitUntil:'networkidle'})
await page.locator('#createStandardProjectBtn').click()
await page.locator('.layer-item').filter({has:page.locator('.bone-name',{hasText:/^首$/})}).click()
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshBindingDialog[open]').waitFor()
const endOptions=await page.locator('#meshChainEndSelect option').allTextContents()
await page.locator('#meshChainEndSelect').selectOption({label:'首'})
const neckSvg='<svg xmlns="http://www.w3.org/2000/svg" width="120" height="300"><rect width="120" height="150" fill="#ff3028"/><rect y="150" width="120" height="150" fill="#246dff"/></svg>'
await page.locator('#meshImageInput').setInputFiles({name:'neck-direction.svg',mimeType:'image/svg+xml',buffer:Buffer.from(neckSvg)})
await page.locator('#meshBindingApplyBtn').click()
await page.locator('#meshBindingDialog').waitFor({state:'hidden'})
await page.waitForTimeout(150)

const result=await page.evaluate(()=>{
  const draft=JSON.parse(localStorage.getItem('bone_editor_compact_single_v34'))
  const binding=Object.values(draft.meshBindings || {})[0]
  const canvas=document.querySelector('.mesh-binding-canvas')
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data
  let redY=0,redCount=0,blueY=0,blueCount=0
  for(let index=0;index<pixels.length;index+=4){
    const y=Math.floor((index/4)/canvas.width),r=pixels[index],b=pixels[index+2],a=pixels[index+3]
    if(a>40 && r>160 && r>b*1.5){redY+=y;redCount++}
    if(a>40 && b>160 && b>r*1.5){blueY+=y;blueCount++}
  }
  return {
    name:binding?.name,
    chainLength:binding?.boneChain?.length,
    pointV:binding?.controlPoints?.map(point=>point.v),
    directionVersion:binding?.sourceDirectionVersion,
    redAverageY:redCount?redY/redCount:null,
    blueAverageY:blueCount?blueY/blueCount:null,
    redCount,blueCount
  }
})
await page.screenshot({path:'output/bone-editor-neck-only-mesh-direction.png',fullPage:true})
console.log(JSON.stringify({endOptions,result,errors},null,2))
if(!endOptions.includes('首') || !endOptions.includes('頭')) throw new Error(`neck mesh endpoints are incomplete: ${JSON.stringify(endOptions)}`)
if(result.name!=='首' || result.chainLength!==1) throw new Error(`neck-only mesh was not created: ${JSON.stringify(result)}`)
if(!(result.pointV[0]>result.pointV.at(-1)) || result.directionVersion!==3) throw new Error(`neck source direction is not bottom-to-top: ${JSON.stringify(result)}`)
if(!result.redCount || !result.blueCount || !(result.redAverageY<result.blueAverageY)) throw new Error(`neck texture is vertically reversed: ${JSON.stringify(result)}`)
if(errors.length) throw new Error(`browser errors: ${errors.join(' / ')}`)
await browser.close()
