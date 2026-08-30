import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))

await page.goto('http://127.0.0.1:5173/2d_bone_editor_split/', { waitUntil: 'networkidle' })
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createStandardProjectBtn').click()

async function inspectBone(name) {
  const item = page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: new RegExp(`^${name}$`) }) }).first()
  await item.click()
  return page.evaluate(() => ({
    selected: JSON.parse(window.render_game_to_text()).selectedBone?.name,
    parent: document.querySelector('#parentInput')?.selectedOptions[0]?.textContent,
    attachX: Number(document.querySelector('#attachXInput')?.value),
    attachY: Number(document.querySelector('#attachYInput')?.value),
    shape: document.querySelector('#shapeInput')?.value,
    width: Number(document.querySelector('#wInput')?.value),
    height: Number(document.querySelector('#hInput')?.value),
    rotation: Number(document.querySelector('#rInput')?.value)
  }))
}

async function meshPixelBounds() {
  return page.evaluate(() => {
    const canvas=document.querySelector('.mesh-binding-canvas')
    if(!canvas) return null
    const { width, height }=canvas
    const pixels=canvas.getContext('2d').getImageData(0,0,width,height).data
    let left=width,right=-1,top=height,bottom=-1
    for(let y=0;y<height;y++) for(let x=0;x<width;x++){
      if(pixels[(y*width+x)*4+3]===0) continue
      left=Math.min(left,x); right=Math.max(right,x); top=Math.min(top,y); bottom=Math.max(bottom,y)
    }
    return right<left ? null : { left,right,top,bottom,width:right-left+1,height:bottom-top+1 }
  })
}

const sideState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const horizontalSourceRange = await page.evaluate(() => {
  const binding={segmentsPerBone:1,controlPoints:[
    {u:.2,v:.75,leftWidth:.1,rightWidth:.1},
    {u:.8,v:.75,leftWidth:.1,rightWidth:.1}
  ]}
  const edges=getMeshSourceEdges(binding,{width:200,height:400})
  const ys=edges.flatMap(edge=>[edge.left.y,edge.right.y])
  return { minY:Math.min(...ys),maxY:Math.max(...ys) }
})
const rightToe = await inspectBone('右つま先')
const leftToe = await inspectBone('左つま先')
const sideNames = await page.locator('.layer-item .bone-name').allTextContents()
await page.locator('.layer-item').filter({ has: page.locator('.bone-name', { hasText: /^右つま先$/ }) }).click()
await page.locator('#editMeshBindingBtn').click()
await page.locator('#meshBindingDialog[open]').waitFor()
const meshChain=await page.locator('#meshChainSelect').evaluate(select=>select.selectedOptions[0]?.textContent || '')
const toeSvg='<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30"><rect x="2" y="2" width="76" height="26" rx="10" fill="#73fbd3"/></svg>'
await page.locator('#meshImageInput').setInputFiles({ name:'toe.svg',mimeType:'image/svg+xml',buffer:Buffer.from(toeSvg) })
await page.locator('#meshPreviewImage').waitFor()
await page.locator('#meshBindingApplyBtn').click()
await page.waitForTimeout(250)
const meshBefore=await meshPixelBounds()
await page.locator('#hInput').fill('68')
await page.locator('#hInput').press('Tab')
await page.waitForTimeout(250)
const meshAfter=await meshPixelBounds()
await page.screenshot({ path: 'output/bone-editor-standard-side-toes.png', fullPage: true })

await page.locator('#projectListBtn').click()
await page.locator('#projectLibraryDialog[open]').waitFor()
await page.locator('#createFrontProjectBtn').click()
const frontState = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
const frontNames = await page.locator('.layer-item .bone-name').allTextContents()

const result = {
  side: { boneCount: sideState.project.boneCount, poseType: sideState.project.poseType, rightToe, leftToe, hasBothToes: sideNames.includes('右つま先') && sideNames.includes('左つま先'), horizontalSourceRange, meshChain, meshBefore, meshAfter },
  front: { boneCount: frontState.project.boneCount, poseType: frontState.project.poseType, hasToe: frontNames.some(name => name.includes('つま先')) },
  errors
}
console.log(JSON.stringify(result, null, 2))

if (result.side.boneCount !== 19 || result.side.poseType !== 'side') throw new Error('通常2D・横向きが19ボーンではありません')
if (!result.side.hasBothToes || rightToe.parent !== '右足' || leftToe.parent !== '左足') throw new Error('つま先の親子接続が不正です')
if (rightToe.shape !== 'bar' || rightToe.width !== 20 || rightToe.height !== 34 || rightToe.rotation !== -90) throw new Error('つま先が通常ボーン寸法になっていません')
if (horizontalSourceRange.minY !== 260 || horizontalSourceRange.maxY !== 340) throw new Error('縦長画像の横向きメッシュ範囲が編集画面と一致していません')
if (meshChain?.trim() !== '右つま先' || !meshBefore || !meshAfter || meshAfter.width < meshBefore.width * 1.6) throw new Error('つま先のH変更がメッシュ長へ反映されていません')
if (result.front.boneCount !== 17 || result.front.hasToe) throw new Error('通常2D・正面へつま先が混入しています')
if (errors.length) throw new Error(`browser errors: ${errors.join(' / ')}`)

await browser.close()
