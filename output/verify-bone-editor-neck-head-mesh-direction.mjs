import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('console', message => { if(message.type()==='error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://192.168.0.209:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#createStandardProjectBtn').click()
await page.evaluate(() => {
  selectedLayer=project.layerOrder.find(id=>project.layers[id]?.key==='neck')
  render()
  openMeshBindingEditor()
})
await page.locator('#meshChainStartSelect').selectOption({ label: '首' })
await page.locator('#meshChainEndSelect').selectOption({ label: '頭' })

const result = await page.evaluate(() => {
  const legacy={
    boneChain:[...meshEditorState.boneChain],
    controlPoints:defaultMeshControlPoints(meshEditorState.boneChain.length),
    flipY:true
  }
  ensureMeshBinding(legacy)
  return {
    chain:meshEditorState.boneChain.map(id=>project.layers[id]?.key),
    points:meshEditorState.controlPoints.map((point,index)=>({t:point.t,v:point.v,label:meshPointLabel(index)})),
    migratedLegacy:{points:legacy.controlPoints.map(point=>({t:point.t,v:point.v})),flipY:legacy.flipY,version:legacy.sourceDirectionVersion},
    dialogOpen:document.querySelector('#meshBindingDialog')?.open || false
  }
})

if(result.chain.join('|')!=='neck|head') throw new Error(`首→頭を選択できていません: ${JSON.stringify(result.chain)}`)
if(!(result.points[0].v>result.points.at(-1).v)) throw new Error(`画像上側が頭になっていません: ${JSON.stringify(result.points)}`)
const topPoint=[...result.points].sort((left,right)=>left.v-right.v)[0]
const bottomPoint=[...result.points].sort((left,right)=>right.v-left.v)[0]
if(!topPoint.label.includes('頭') || !bottomPoint.label.includes('首')) throw new Error(`上下の部位表示が逆です: ${JSON.stringify(result.points)}`)
if(result.migratedLegacy.points[0].v<=result.migratedLegacy.points.at(-1).v || result.migratedLegacy.flipY || result.migratedLegacy.version!==2) throw new Error(`旧データを移行できていません: ${JSON.stringify(result.migratedLegacy)}`)
if(errors.length) throw new Error(`ブラウザエラー: ${JSON.stringify(errors)}`)

await page.screenshot({ path:'output/bone-editor-neck-head-mesh-direction.png', fullPage:true })
console.log(JSON.stringify({result,errors},null,2))
await browser.close()
