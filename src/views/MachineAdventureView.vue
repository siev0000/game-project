<template>
  <div class="container sf-terminal machine-adventure">
    <main class="panel">
      <header class="adventure-header">
        <p class="eyebrow">MACHINE WORLD / ACTIVE UNIT</p>
        <h1>{{ character?.name || '接続ユニット未選択' }}</h1>
        <p class="profile">{{ raceName }} / Lv {{ level }}</p>
      </header>

      <section class="unit-readout">
        <p>&gt; Connection status: ONLINE</p>
        <p>&gt; Unit profile: {{ raceName }}</p>
        <p>&gt; Equipment preset: {{ character?.equipmentPreset === 'standard' ? '標準装備' : '登録装備' }}</p>
      </section>

      <nav class="action-list" aria-label="機械世界メニュー">
        <button type="button" @click="showStatus = true">▶ ステータス</button>
        <button type="button" @click="showOptions = true">▶ 設定</button>
        <button type="button" @click="showBattle = true">▶ 戦闘情報</button>
        <button type="button" @click="router.push('/machine-shop')">▶ ショップ</button>
        <button type="button" disabled>▶ 探索開始（準備中）</button>
      </nav>

      <button type="button" class="return-button" @click="router.push('/CharacterSelectView')">キャラクター選択に戻る</button>
    </main>

    <CharacterStatusModal
      v-if="showStatus && character"
      :character="character"
      theme="machine"
      confirm-label="閉じる"
      @close="showStatus = false"
      @ok="showStatus = false"
    />
    <OptionsModal
      v-if="showOptions"
      sound-only
      :se-volume="seVolume"
      :bgm-volume="bgmVolume"
      @close="showOptions = false"
      @update-se-volume="onSeVolumeChange"
      @update-bgm-volume="onBgmVolumeChange"
    />
    <BattleView
      v-if="showBattle && character"
      :character="character"
      @close="showBattle = false"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { applyGlobalScale } from '@/components/useScale.js'
import CharacterStatusModal from '@/components/modals/CharacterStatusModal.vue'
import BattleView from '@/components/modals/robot/BattleView.vue'
import { getBGMVolume, getSEMasterVolume, playBGM, setBGMVolume, setSEMasterVolume, stopBGM } from '@/constants/statData.js'
import OptionsModal from '@/components/modals/robot/OptionsModal.vue'

const router = useRouter()
const character = ref(null)
const showStatus = ref(false)
const showBattle = ref(false)
const showOptions = ref(false)
const activeMember = computed(() => character.value?.party?.[0] || null)
const raceName = computed(() => activeMember.value?.Role?.[0]?.roleName || character.value?.race || '未設定')
const level = computed(() => activeMember.value?.stats?.allLv ?? character.value?.raceLevel ?? 0)
const seVolume = ref(Math.round(getSEMasterVolume() * 100))
const bgmVolume = ref(Math.round(getBGMVolume() * 100))

const onSeVolumeChange = value => {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0))
  seVolume.value = clamped
  setSEMasterVolume(clamped / 100)
}

const onBgmVolumeChange = value => {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0))
  bgmVolume.value = clamped
  setBGMVolume(clamped / 100)
}

onMounted(() => {
  applyGlobalScale()
  playBGM('incredible')
  try {
    character.value = JSON.parse(window.sessionStorage.getItem('active-adventure-character') || 'null')
  } catch {
    character.value = null
  }
  if (!character.value) {
    router.replace('/CharacterSelectView')
    return
  }
  window.render_game_to_text = () => JSON.stringify({
    screen: 'machine-adventure',
    characterId: character.value.id,
    characterName: character.value.name,
    race: raceName.value,
    level: level.value,
    statusOpen: showStatus.value,
    battleOpen: showBattle.value
  })
})

onBeforeUnmount(() => {
  stopBGM()
  delete window.render_game_to_text
})
</script>

<style scoped>
.machine-adventure { max-width: 700px; width: 100%; height: 100%; padding: 20px; box-sizing: border-box; color: #aefcff; font-family: Consolas, "Courier New", monospace; }
.panel { min-height: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 18px; padding: 24px; border: 2px solid #3aaed8; border-radius: 8px; background: linear-gradient(180deg, rgba(10, 20, 30, .95), rgba(5, 10, 15, .95)); box-shadow: 0 0 20px rgba(58, 174, 216, .4), inset 0 0 10px rgba(0, 255, 255, .1); }
.adventure-header { text-align: center; }
.eyebrow { margin: 0 0 8px; color: #72eefa; font-size: 15px; letter-spacing: .12em; }
h1 { margin: 0; color: #e0faff; font-size: 32px; }
.profile { margin: 8px 0 0; color: #a7dfe7; font-size: 16px; }
.unit-readout { padding: 14px; border: 1px solid #2fa4c7; background: rgba(0, 0, 0, .6); font-size: 15px; line-height: 1.65; }
.unit-readout p { margin: 0; }
.action-list { display: grid; gap: 10px; }
.action-list button, .return-button { min-height: 52px; border: 1px solid #3aaed8; border-radius: 4px; background: linear-gradient(180deg, #145b76, #0c3547); color: #e0faff; font: inherit; font-size: 17px; font-weight: 700; text-align: left; padding: 0 16px; cursor: pointer; }
.action-list button:hover, .return-button:hover { background: linear-gradient(180deg, #1c7898, #104f66); }
.action-list button:disabled { cursor: not-allowed; opacity: .45; }
.return-button { margin-top: auto; text-align: center; background: transparent; color: #a7dfe7; }
</style>
