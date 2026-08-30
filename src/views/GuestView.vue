<template>
  <div class="container sf-terminal">
    <div class="panel">
      <h2 class="title">SYSTEM ACCESS</h2>

      <div class="log-box">
        <p>> Boot sequence initiated...</p>
        <p>> Core module: ONLINE</p>
        <p>> Environment scan: OK</p>
        <p>> User authentication: {{ activeCharacter ? 'CHARACTER' : 'GUEST' }}</p>
        <p v-if="activeCharacter">> Active unit: {{ activeCharacter.name }}</p>
        <p v-if="activeMember">> Race profile: {{ activeMember.Role?.[0]?.roleName || activeCharacter.race || 'UNKNOWN' }} / Lv {{ activeMember.stats?.allLv ?? activeCharacter.raceLevel ?? 0 }}</p>
        <p>> Awaiting command.</p>
      </div>

      <div class="guest-tabs" role="tablist" aria-label="ゲストメニュー種別">
        <button
          id="guest-test-tab"
          type="button"
          class="guest-tab"
          :class="{ active: activeGuestTab === 'test' }"
          role="tab"
          :aria-selected="activeGuestTab === 'test'"
          aria-controls="guest-test-panel"
          @click="activeGuestTab = 'test'"
        >動作確認</button>
        <button
          id="guest-create-tab"
          type="button"
          class="guest-tab"
          :class="{ active: activeGuestTab === 'create' }"
          role="tab"
          :aria-selected="activeGuestTab === 'create'"
          aria-controls="guest-create-panel"
          @click="activeGuestTab = 'create'"
        >ゲーム作成</button>
      </div>

      <div
        v-if="activeGuestTab === 'test'"
        id="guest-test-panel"
        class="menu"
        role="tabpanel"
        aria-labelledby="guest-test-tab"
        tabindex="0"
        aria-label="動作確認メニュー"
      >
        <button @click="goDemo">▶ デモ起動</button>
        <button @click="showTutorial = true">▶ 操作ガイド</button>
        <button @click="showWorld = true">▶ ワールド情報</button>
        <button @click="showStats = true">▶ ステータス一覧</button>
        <button @click="showOptions = true">▶ 設定</button>
        <button @click="showBattle = true">▶ バトル情報</button>
        <button v-if="!activeCharacter" @click="showBattleVer2 = true">▶ バトル情報ver2</button>
        <button @click="showUI = true">▶ UI情報</button>
        <button @click="showImageGallery = true">▶ イメージギャラリー</button>
        <button @click="showFontPreview = true">▶ フォント確認</button>
      </div>

      <div
        v-else
        id="guest-create-panel"
        class="menu"
        role="tabpanel"
        aria-labelledby="guest-create-tab"
        tabindex="0"
        aria-label="ゲーム作成メニュー"
      >
        <button @click="showCustomMarker = true">▶ ターゲットマーカー作成</button>
        <button @click="openDialogueTest">▶ メッセージテスト</button>
        <button @click="openDialogueEvents">▶ 会話イベント作成</button>
        <button @click="showEffectEditor = true">▶ 技エフェクト作成</button>
        <button @click="showSkillEffectEditor = true">▶ SE作成</button>
        <button @click="openElectronicLifeLab">▶ 電子生命体ラボ</button>
        <button @click="openAreaExploration">▶ 横スクロール探索エリア</button>
        <button @click="openCharacterLibrary">▶ キャラクター作成・管理</button>
        <button class="bone-editor-entry" @click="openBoneEditor">▶ 2Dボーン・モーション作成</button>
      </div>

      <div class="back">
        <a @click.prevent="goBack">{{ activeCharacter ? 'キャラクター選択に戻る' : 'ログイン画面に戻る' }}</a>
      </div>
    </div>
    <TutorialModal
      v-if="showTutorial"
      @close="showTutorial = false"
    />

    <WorldModal
      v-if="showWorld"
      @close="showWorld = false"
    />

    <StatsModal
      v-if="showStats"
      @close="showStats = false"
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

    <BattleModal
      v-if="showBattle"
      :character="activeCharacter"
      @close="showBattle = false"
    />
    <BattleVer2Modal
      v-if="showBattleVer2"
      :character="activeCharacter"
      @close="showBattleVer2 = false"
    />
    <CustomMarkerModal
      v-if="showCustomMarker"
      :settings="customMarkerSettings"
      @close="showCustomMarker = false"
      @save="saveCustomMarker"
    />
    <DialogueMessageEditorModal
      v-if="showDialogueTest"
      :settings="dialogueMessageSettings"
      @close="showDialogueTest = false"
      @apply="applyDialogueMessageSettings"
    />
    <UIModal
      v-if="showUI"
      @close="showUI = false"
    />
    <ImageGalleryModal
      v-if="showImageGallery"
      @close="showImageGallery = false"
    />
    <SkillEffectEditorModal
      v-if="showSkillEffectEditor"
      initial-mode="sound"
      :effect-options="effectOptions"
      :skills="skillEffectEditorSkills"
      :get-effect-sprite="getEffectSprite"
      @close="showSkillEffectEditor = false"
      @apply="applySkillEffectSettings"
    />
    <EffectEditorModal
      v-if="showEffectEditor"
      @close="showEffectEditor = false"
      @apply="saveCreatedEffect"
    />
    <FontPreviewModal
      v-if="showFontPreview"
      @close="showFontPreview = false"
    />
  </div>
</template>


<script setup>
import { computed, ref, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { applyGlobalScale } from '@/components/useScale.js'
import { getBGMVolume, getSEMasterVolume, playBGM, setBGMVolume, setSEMasterVolume, stopBGM } from '@/constants/statData.js'
import TutorialModal from '../components/modals/robot/TutorialModal.vue'
import WorldModal from '../components/modals/robot/WorldModal.vue'
import StatsModal from '../components/modals/robot/StatsView.vue'
import OptionsModal from '../components/modals/robot/OptionsModal.vue'
import BattleModal from '../components/modals/robot/BattleView.vue'
import BattleVer2Modal from '../components/modals/robot/BattleView_ver2.vue'
import CustomMarkerModal from '../components/modals/robot/CustomMarkerModal.vue'
import DialogueMessageEditorModal from '../components/modals/robot/DialogueMessageEditorModal.vue'
import UIModal from '../components/modals/robot/UIModal.vue'
import ImageGalleryModal from '../components/modals/robot/ImageGalleryModal.vue'
import SkillEffectEditorModal from '../components/modals/robot/SkillEffectEditorModal.vue'
import EffectEditorModal from '../components/modals/robot/EffectEditorModal.vue'
import FontPreviewModal from '../components/modals/robot/FontPreviewModal.vue'
import savedSkillEffectSettings from '../../data/skillEffectSettings.json'
import savedDialogueMessageSettings from '../../data/dialogueMessageSettings.json'
import {
  ATTACK_EFFECT_TYPES,
  EFFECT_OPTIONS,
  getEffectSprite
} from '../components/modals/data/battleEffects.js'

const showTutorial = ref(false)
const showWorld = ref(false)
const showStats = ref(false)
const showOptions = ref(false)
const showBattle = ref(false)
const showBattleVer2 = ref(false)
const showCustomMarker = ref(false)
const showDialogueTest = ref(false)
const showUI = ref(false)
const showImageGallery = ref(false)
const showSkillEffectEditor = ref(false)
const showEffectEditor = ref(false)
const showFontPreview = ref(false)
const route = useRoute()
const activeGuestTab = ref(route.query.tab === 'create' ? 'create' : 'test')
const effectOptions = EFFECT_OPTIONS
const skillEffectSettings = ref(Object.fromEntries(
  (savedSkillEffectSettings.skills || []).map(skill => [skill.id, { ...skill }])
))
const skillEffectEditorSkills = computed(() => ATTACK_EFFECT_TYPES.map(type => ({
  id: type.key,
  label: type.label,
  effectName: type.effectName,
  ...skillEffectSettings.value[type.key]
})))
const dialogueMessageSettings = ref(JSON.parse(JSON.stringify(savedDialogueMessageSettings)))
const CUSTOM_MARKER_SETTINGS_STORAGE_KEY = 'battle-custom-target-marker-settings-v1'
const customMarkerSettings = ref({})
const activeCharacter = ref(null)
const activeMember = computed(() => activeCharacter.value?.party?.[0] || null)
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

const router = useRouter()

onMounted(() => {
  applyGlobalScale()
  playBGM('incredible')
  try {
    activeCharacter.value = JSON.parse(window.sessionStorage.getItem('active-adventure-character') || 'null')
  } catch {
    activeCharacter.value = null
  }
  window.render_game_to_text = () => JSON.stringify({
    screen: 'guest-terminal',
    accessMode: activeCharacter.value ? 'character' : 'guest',
    characterId: activeCharacter.value?.id || null,
    characterName: activeCharacter.value?.name || null,
    race: activeMember.value?.Role?.[0]?.roleName || activeCharacter.value?.race || null,
    level: activeMember.value?.stats?.allLv ?? activeCharacter.value?.raceLevel ?? null,
    activeMenuTab: activeGuestTab.value
  })
  try {
    const savedSettings = window.localStorage.getItem(CUSTOM_MARKER_SETTINGS_STORAGE_KEY)
    if (savedSettings) customMarkerSettings.value = JSON.parse(savedSettings)
  } catch {
    customMarkerSettings.value = {}
  }
})

onBeforeUnmount(() => {
  stopBGM()
  delete window.render_game_to_text
})

const goBack = () => {
  router.push(activeCharacter.value ? '/CharacterSelectView' : '/')
}

const openDialogueTest = () => {
  showDialogueTest.value = true
}

const applyDialogueMessageSettings = settings => {
  dialogueMessageSettings.value = settings
}

const openElectronicLifeLab = () => {
  router.push('/electronic-life')
}

const openAreaExploration = () => {
  router.push('/area-exploration')
}

const openCharacterLibrary = () => {
  router.push('/character-library')
}

const openDialogueEvents = () => {
  router.push('/dialogue-events')
}

const openBoneEditor = () => {
  window.location.assign('/2d_bone_editor_split/?return=%2Fguest%3Ftab%3Dcreate')
}

const saveCustomMarker = settings => {
  customMarkerSettings.value = settings
  try {
    window.localStorage.setItem(CUSTOM_MARKER_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // The editor keeps its own draft even if confirmed settings cannot be persisted.
  }
  showCustomMarker.value = false
}

const applySkillEffectSettings = skills => {
  skillEffectSettings.value = Object.fromEntries(skills.map(skill => [skill.id, { ...skill }]))
}

const saveCreatedEffect = effect => {
  try {
    const key = 'phaser-effect-library-v1'
    const library = JSON.parse(window.localStorage.getItem(key) || '[]')
    const next = Array.isArray(library) ? library.filter(item => item?.name !== effect.name) : []
    next.push(effect)
    window.localStorage.setItem(key, JSON.stringify(next))
  } catch {
    // The downloaded JSON remains usable even when browser storage is unavailable.
  }
  showEffectEditor.value = false
}
</script>

<style scoped>

/* ===== 全体===== */
.sf-terminal {
  max-width: 700px;
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  color: #aefcff;
  font-family: "Consolas", "Courier New", monospace;
}

/* ===== パネル ===== */
.panel {
  display: flex;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    rgba(10, 20, 30, 0.95),
    rgba(5, 10, 15, 0.95)
  );
  border: 2px solid #3aaed8;
  border-radius: 8px;
  padding: 24px;
  box-shadow:
    0 0 20px rgba(58, 174, 216, 0.4),
    inset 0 0 10px rgba(0, 255, 255, 0.1);
}

/* ===== タイトル ===== */
.title {
  text-align: center;
  margin-bottom: 20px;
  letter-spacing: 2px;
  color: #e0faff;
}

/* ===== ログ表示 ===== */
.log-box {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #2fa4c7;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.6;
}

.log-box p {
  margin: 0;
}

.guest-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.guest-tab {
  min-height: 42px;
  border: 1px solid #2d718a;
  background: rgba(8, 30, 40, 0.9);
  color: #aeeeff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.guest-tab:hover { background: rgba(20, 73, 94, 0.95); }
.guest-tab.active {
  border-color: #8bf3ff;
  background: linear-gradient(180deg, #247795, #174c62);
  color: #f1feff;
  box-shadow: inset 0 0 0 1px rgba(194, 254, 255, 0.24), 0 0 10px rgba(81, 222, 248, 0.2);
}

/* ===== メニュー ===== */
.menu {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 8px;
  scrollbar-color: #39cce8 rgba(2, 16, 23, 0.88);
  scrollbar-width: thin;
}

.menu::-webkit-scrollbar { width: 10px; }
.menu::-webkit-scrollbar-track {
  border: 1px solid rgba(76, 201, 240, 0.18);
  border-radius: 2px;
  background: rgba(2, 16, 23, 0.88);
}
.menu::-webkit-scrollbar-thumb {
  border: 2px solid rgba(2, 16, 23, 0.88);
  border-radius: 2px;
  background: linear-gradient(180deg, #8af4ff, #2099bc 52%, #12617d);
  box-shadow: inset 0 0 3px rgba(220, 255, 255, 0.7);
}
.menu::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #c1fbff, #37c4e7 52%, #17789a);
}
.menu:focus-visible {
  outline: 1px solid rgba(100, 232, 255, 0.42);
  outline-offset: 3px;
}

.menu button {
  background: linear-gradient(
    180deg,
    #1f4f66,
    #163a4d
  );
  border: 1px solid #4cc9f0;
  color: #e6fcff;
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
  text-align: left;
  font-weight: 600;
}

.menu button:hover {
  background: linear-gradient(
    180deg,
    #2a6b88,
    #1f556e
  );
}

/* ===== 戻めE===== */
.back {
  flex: 0 0 auto;
  margin-top: 16px;
  text-align: center;
  width: 100%;
}

.menu button.bone-editor-entry {
  border-color: #e6bb68;
  background: linear-gradient(180deg, #5d4a27, #3a2c18);
  color: #fff2c8;
}
.menu button.bone-editor-entry:hover {
  background: linear-gradient(180deg, #816233, #513b1c);
}

.back a {
  color: #88e7ff;
  cursor: pointer;
  text-decoration: none;
}

.back a:hover {
  text-decoration: underline;
}
</style>
