<template>
  <div class="container sf-terminal">
    <div class="panel">
      <h2 class="title">SYSTEM ACCESS</h2>

      <div class="log-box">
        <p>> Boot sequence initiated...</p>
        <p>> Core module: ONLINE</p>
        <p>> Environment scan: OK</p>
        <p>> User authentication: GUEST</p>
        <p>> Awaiting command.</p>
      </div>

      <div class="menu">
        <button @click="goDemo">▶ デモ起動</button>
        <button @click="showTutorial = true">▶ 操作ガイド</button>
        <button @click="showWorld = true">▶ ワールド情報</button>
        <button @click="showStats = true">▶ ステータス一覧</button>
        <button @click="showBattle = true">▶ バトル情報</button>
        <button @click="showBattleVer2 = true">▶ バトル情報ver2</button>
        <button @click="openDialogueTest">▶ メッセージテスト</button>
        <button @click="showUI = true">▶ UI情報</button>
        <button @click="showImageGallery = true">▶ イメージギャラリー</button>
        <button @click="showSkillEffectEditor = true">▶ SE作成</button>
        <button @click="showFontPreview = true">▶ フォント確認</button>
        <button @click="openElectronicLifeLab">▶ 電子生命体ラボ</button>
      </div>

      <div class="back">
        <a @click.prevent="goBack">ログイン画面に戻る</a>
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

    <BattleModal
      v-if="showBattle"
      @close="showBattle = false"
    />
    <BattleVer2Modal
      v-if="showBattleVer2"
      @close="showBattleVer2 = false"
    />
    <DialogueMessageModal
      v-if="showDialogueTest"
      :name="dialogueTestName"
      :message="dialogueTestMessage"
      :type="dialogueTestType"
      :message-speed="dialogueTestMessageSpeed"
      :voice-pitch="dialogueTestVoicePitch"
      :voice-volume="dialogueTestVoiceVolume"
      :message-id="dialogueTestMessageId"
      :wait-input="dialogueTestWaitInput"
      :test-mode="true"
      @close="showDialogueTest = false"
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
    <FontPreviewModal
      v-if="showFontPreview"
      @close="showFontPreview = false"
    />
  </div>
</template>


<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { applyGlobalScale } from '@/components/useScale.js'
import TutorialModal from '../components/modals/robot/TutorialModal.vue'
import WorldModal from '../components/modals/robot/WorldModal.vue'
import StatsModal from '../components/modals/robot/StatsView.vue'
import BattleModal from '../components/modals/robot/BattleView.vue'
import BattleVer2Modal from '../components/modals/robot/BattleView_ver2.vue'
import DialogueMessageModal from '../components/modals/robot/DialogueMessageModal.vue'
import UIModal from '../components/modals/robot/UIModal.vue'
import ImageGalleryModal from '../components/modals/robot/ImageGalleryModal.vue'
import SkillEffectEditorModal from '../components/modals/robot/SkillEffectEditorModal.vue'
import FontPreviewModal from '../components/modals/robot/FontPreviewModal.vue'
import savedSkillEffectSettings from '../../data/skillEffectSettings.json'
import {
  ATTACK_EFFECT_TYPES,
  EFFECT_OPTIONS,
  getEffectSprite
} from '../components/modals/data/battleEffects.js'

const showTutorial = ref(false)
const showWorld = ref(false)
const showStats = ref(false)
const showBattle = ref(false)
const showBattleVer2 = ref(false)
const showDialogueTest = ref(false)
const showUI = ref(false)
const showImageGallery = ref(false)
const showSkillEffectEditor = ref(false)
const showFontPreview = ref(false)
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
const dialogueTestName = ref('TEST-UNIT')
const dialogueTestMessage = ref('テストモードを起動しました。\nTYPEと音声設定を調整してください。')
const dialogueTestType = ref(1)
const dialogueTestMessageSpeed = ref(28)
const dialogueTestVoicePitch = ref(1)
const dialogueTestVoiceVolume = ref(0.5)
const dialogueTestMessageId = ref(1)
const dialogueTestWaitInput = ref(true)

const router = useRouter()

onMounted(() => {
  applyGlobalScale()
})

const goBack = () => {
  router.push('/')
}

const openDialogueTest = () => {
  dialogueTestMessageId.value += 1
  showDialogueTest.value = true
}

const openElectronicLifeLab = () => {
  router.push('/electronic-life')
}

const applySkillEffectSettings = skills => {
  skillEffectSettings.value = Object.fromEntries(skills.map(skill => [skill.id, { ...skill }]))
}
</script>

<style scoped>

/* ===== 全体===== */
.sf-terminal {
  max-width: 700px;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  color: #aefcff;
  font-family: "Consolas", "Courier New", monospace;
}

/* ===== パネル ===== */
.panel {
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

/* ===== メニュー ===== */
.menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  margin-top: 20px;
  text-align: center;
  width: 100%;
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
