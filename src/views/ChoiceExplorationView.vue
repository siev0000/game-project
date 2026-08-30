<template>
  <main class="exploration-screen">
    <section class="exploration-panel" aria-labelledby="area-name">
      <header class="screen-header">
        <div>
          <p>DEFAULT EXPEDITION</p>
          <h1 id="area-name">{{ currentArea.name }}</h1>
        </div>
        <button type="button" class="leave-button" @click="leaveExploration">{{ leaveLabel }}</button>
      </header>

      <p class="area-description">{{ currentArea.description }}</p>
      <p class="area-meta">{{ currentArea.areaKind === 'route' ? '通路・移動エリア' : '探索エリア' }} ／ BGM: {{ currentArea.bgm }}</p>

      <section class="log" aria-live="polite">
        <p v-for="(entry, index) in logEntries" :key="`${entry}-${index}`">{{ entry }}</p>
      </section>

      <section class="choices" aria-label="探索行動">
        <h2>行動を選ぶ</h2>
        <button type="button" class="choice-button inspect" @click="inspectArea">この場所を調べる</button>
        <button
          v-for="exit in availableExits"
          :key="exit.id"
          type="button"
          class="choice-button"
          @click="moveTo(exit)"
        >
          {{ exit.label }}
          <small>{{ destinationName(exit) }}</small>
        </button>
        <button type="button" class="choice-button back" :disabled="!canGoBack" @click="goBack">
          前のエリアへ戻る
          <small>{{ previousAreaName }}</small>
        </button>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { areas as bundledAreas, getAreaById } from '@/data/exploration/areaRepository.js'

const DEFAULT_AREA_ID = 'upper_terminal_concourse'
const router = useRouter()
const hasLogin = Boolean(window.localStorage.getItem('authToken') && window.localStorage.getItem('username'))
const currentAreaId = ref(DEFAULT_AREA_ID)
const areaHistory = ref([])
const logEntries = ref(['デフォルト設定で探索を開始した。', '行動を選んで先へ進める。'])

const currentArea = computed(() => getAreaById(currentAreaId.value) ?? getAreaById(DEFAULT_AREA_ID))
const availableExits = computed(() => currentArea.value.exits.filter(exit => exit.requiredEventFlags.length === 0))
const canGoBack = computed(() => areaHistory.value.length > 0)
const previousAreaName = computed(() => {
  const previousId = areaHistory.value.at(-1)
  return previousId ? getAreaById(previousId)?.name ?? '前のエリア' : '開始地点です'
})

const destinationName = exit => bundledAreas.find(area => area.id === exit.destinationArea)?.name ?? exit.destinationArea
const leaveLabel = hasLogin ? 'ダッシュボードへ戻る' : 'ログイン画面へ戻る'

const leaveExploration = () => {
  router.push(hasLogin ? '/dashboard' : '/login')
}

const inspectArea = () => {
  logEntries.value = [`${currentArea.value.name}を調べた。`, currentArea.value.description]
}

const moveTo = exit => {
  const destination = getAreaById(exit.destinationArea)
  if (!destination) {
    logEntries.value = ['移動先のエリア情報が見つからない。']
    return
  }
  areaHistory.value.push(currentAreaId.value)
  currentAreaId.value = destination.id
  logEntries.value = [`${destination.name}へ移動した。`, destination.description]
}

const goBack = () => {
  const previousId = areaHistory.value.pop()
  if (!previousId) return
  currentAreaId.value = previousId
  logEntries.value = [`${currentArea.value.name}へ戻った。`, currentArea.value.description]
}
</script>

<style scoped>
.exploration-screen { width: 100%; height: 100vh; box-sizing: border-box; overflow-y: auto; padding: 32px 16px; background: radial-gradient(circle at top, #22394e, #0b111a 62%); color: #eefaff; }
.exploration-panel { width: min(100%, 720px); margin: 0 auto; padding: 28px; border: 1px solid #75c8e0; border-radius: 12px; background: rgba(5, 18, 29, .9); box-shadow: 0 20px 60px rgba(0, 0, 0, .35); }
.screen-header { display: grid; gap: 14px; border-bottom: 1px solid rgba(117, 200, 224, .36); padding-bottom: 16px; }
.screen-header p, .area-meta { margin: 0; color: #9fc6d5; font-size: 13px; letter-spacing: .08em; }
h1 { margin: 5px 0 0; font-size: 28px; }
.leave-button { width: 100%; padding: 9px 12px; border: 1px solid #6c9bae; background: transparent; color: #e8f8ff; cursor: pointer; font-size: 15px; }
.area-description { margin: 22px 0 8px; font-size: 17px; line-height: 1.7; }
.log { min-height: 86px; margin: 20px 0; padding: 14px 16px; border-left: 3px solid #65d4c3; background: rgba(45, 109, 120, .18); font-size: 15px; line-height: 1.6; }
.log p { margin: 0; }.log p + p { margin-top: 5px; }
.choices h2 { margin: 0 0 12px; font-size: 18px; }.choices { display: grid; gap: 10px; }
.choice-button { display: grid; gap: 4px; width: 100%; padding: 15px 16px; border: 1px solid #478ca9; background: #142d3d; color: #f2fbff; text-align: left; cursor: pointer; font-size: 16px; }
.choice-button:hover:not(:disabled) { background: #1b4358; border-color: #7dddf3; }.choice-button small { color: #a9cfdb; font-size: 13px; }.choice-button.inspect { border-color: #65bda8; background: #173e3c; }.choice-button.back { border-color: #9483b5; background: #29233c; }.choice-button:disabled { opacity: .48; cursor: not-allowed; }
@media (max-width: 560px) { .exploration-screen { padding: 16px 10px; }.exploration-panel { padding: 20px; } h1 { font-size: 24px; } }
</style>
