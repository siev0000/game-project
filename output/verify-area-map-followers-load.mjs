import { chromium } from 'file:///C:/Users/skkt3/.codex/skills/develop-web-game/node_modules/playwright/index.mjs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(String(error)))

await page.goto('http://127.0.0.1:5175/area-map/middle_terminal_concourse', { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.render_game_to_text === 'function')
await page.locator('.follower-add-button').waitFor()
await page.waitForTimeout(800)

const readState = async (label, expectedFollowers = 0) => {
  if (expectedFollowers) {
    await page.waitForFunction(expected => {
      const frames = [...document.querySelectorAll('.follower-bone-motion iframe')]
      return frames.length === expected && frames.every(frame => typeof frame.contentWindow?.render_game_to_text === 'function')
    }, expectedFollowers, { timeout: 45000 })
  }
  await page.waitForTimeout(1400)
  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()))
  const layout = await page.evaluate(() => {
    const toolbar = document.querySelector('.map-toolbar')?.getBoundingClientRect()
    const tools = document.querySelector('.follower-load-tools')?.getBoundingClientRect()
    const add = document.querySelector('.follower-add-button')?.getBoundingClientRect()
    return {
      toolbar: toolbar && { left: toolbar.left, right: toolbar.right, width: toolbar.width, height: toolbar.height },
      tools: tools && { left: tools.left, right: tools.right, width: tools.width },
      add: add && { left: add.left, right: add.right, width: add.width },
      viewportWidth: window.innerWidth,
      followerNodes: document.querySelectorAll('.map-follower').length,
      followerFrames: document.querySelectorAll('.follower-bone-motion iframe').length,
      readyFollowerFrames: [...document.querySelectorAll('.follower-bone-motion iframe')]
        .filter(frame => typeof frame.contentWindow?.render_game_to_text === 'function').length
    }
  })
  return { label, load: state.followerLoadTest, player: state.player, layout }
}

const addFollower = async () => {
  await page.locator('.follower-add-button').click()
  await page.locator('.follower-character-list button', { hasText: 'ver4' }).click()
}

const samples = [await readState('base')]
for (let index = 0; index < 5; index += 1) await addFollower()
await page.keyboard.down('ArrowRight')
await page.waitForTimeout(2400)
await page.keyboard.up('ArrowRight')
samples.push(await readState('followers-5', 5))
await page.screenshot({ path: 'output/area-map-followers-5.png', fullPage: false })

for (let index = 5; index < 10; index += 1) await addFollower()
await page.keyboard.down('ArrowLeft')
await page.waitForTimeout(2400)
await page.keyboard.up('ArrowLeft')
samples.push(await readState('followers-10', 10))
await page.screenshot({ path: 'output/area-map-followers-10.png', fullPage: false })

for (let index = 10; index < 20; index += 1) await addFollower()
await page.keyboard.down('ArrowRight')
await page.waitForTimeout(2800)
await page.keyboard.up('ArrowRight')
samples.push(await readState('followers-20', 20))
await page.screenshot({ path: 'output/area-map-followers-20.png', fullPage: false })

const finalFollowers = samples.at(-1).load.followers
if (finalFollowers.length !== 20) throw new Error(`追従キャラ数が20体になっていません: ${finalFollowers.length}`)
if (samples.at(-1).layout.followerFrames !== 20) throw new Error(`追従ボーンiframeが20個ではありません: ${samples.at(-1).layout.followerFrames}`)
if (samples.at(-1).load.activeBonePlayers !== 21) throw new Error(`同時ボーンプレイヤー数が21ではありません: ${samples.at(-1).load.activeBonePlayers}`)
if (!finalFollowers.some(follower => follower.x !== samples.at(-1).player.x)) throw new Error('追従遅延による位置差がありません')
if (errors.length) throw new Error(`console/page errors: ${errors.join(' / ')}`)

await page.locator('.follower-clear-button').click()
const cleared = JSON.parse(await page.evaluate(() => window.render_game_to_text())).followerLoadTest
if (cleared.count !== 0 || cleared.activeBonePlayers !== 1) throw new Error(`全削除できません: ${JSON.stringify(cleared)}`)

console.log(JSON.stringify({ samples, cleared, errors }, null, 2))
await browser.close()
