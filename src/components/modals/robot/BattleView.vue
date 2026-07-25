<template>
  <BaseBattleModal @close="$emit('close')">
    <div class="battle-root" :class="{ 'is-custom-marker-editor-open': showCustomMarkerModal }">

      <!-- ===== 上：バトルフィールド（40%） ===== -->
      <div
        ref="battleFieldRef"
        class="battle-field"
        :style="{ backgroundImage: `url(${battleFieldBg})` }"
        @click="handleBattleFieldClick"
      >
        <UIModal
          v-if="showUIModal"
          ref="uiModalRef"
          embedded
          :showControls="false"
          :target-marker-type="targetMarkerType"
          :gen4-marker-nodes="gen4MarkerNodes"
          :gen45-marker-nodes="gen45MarkerNodes"
          :custom-marker-settings="customMarkerSettings"
        />
        <div class="battle-settings">
          <button
            type="button"
            class="settings-button"
            aria-label="Options"
            @click="toggleOptionsModal"
          >
            ⚙
          </button>
          <button
            type="button"
            class="settings-button marker-settings-button"
            aria-label="Target marker settings"
            @click="openMarkerSettings"
          >
            TARGET
          </button>
          <button
            type="button"
            class="settings-button message-button"
            aria-label="Select dialogue message type"
            @click="playDialogueWithTypeSelect"
          >
            MSG
          </button>
          <button
            type="button"
            class="settings-button type-button"
            aria-label="Toggle dialogue message type"
            @click="cycleDialogueType"
          >
            {{ dialogueTypeButtonLabel }}
          </button>
          <button
            type="button"
            class="settings-button speed-button"
            aria-label="Toggle dialogue message speed"
            @click="cycleDialogueSpeed"
          >
            {{ dialogueSpeedButtonLabel }}
          </button>
          <button
            type="button"
            class="settings-button wait-button"
            aria-label="Toggle dialogue wait input"
            @click="toggleDialogueWaitInput"
          >
            {{ dialogueWaitButtonLabel }}
          </button>
        </div>
        <OptionsModal
          v-if="showOptionsModal"
          :seVolume="seVolume"
          :spark-effect-enabled="sparkEffectEnabled"
          :gen4MarkerNodes="gen4MarkerNodes"
          :gen45MarkerNodes="gen45MarkerNodes"
          @close="showOptionsModal = false"
          @update-se-volume="onSeVolumeChange"
          @update-spark-effect-enabled="onSparkEffectEnabled"
          @update-marker-node-count="onMarkerNodeCountChange"
          @update-marker-node-color="onMarkerNodeColorChange"
          @update-marker-node-strength="onMarkerNodeStrengthChange"
          @update-gen4-marker-node-count="onGen4MarkerNodeCountChange"
          @update-gen4-marker-node-color="onGen4MarkerNodeColorChange"
          @update-gen4-marker-node-strength="onGen4MarkerNodeStrengthChange"
        />
        <CustomMarkerModal
          v-if="showCustomMarkerModal"
          :settings="customMarkerSettings"
          @close="showCustomMarkerModal = false"
          @save="onCustomMarkerSave"
        />
          <SkillEffectEditorModal
            v-if="showSkillEffectEditor"
            :effect-options="effectOptions"
            :skills="skillEffectEditorSkills"
            :get-effect-sprite="getEffectSprite"
            @close="showSkillEffectEditor = false"
            @apply="applySkillEffectSettings"
          />
        <div ref="effectCanvasRef" class="battle-effect-canvas" aria-hidden="true"></div>
        <div class="spark-effect-layer" aria-hidden="true">
          <div
            v-for="spark in sparkEffects"
            :key="spark.id"
            class="spark-burst"
            :style="{ left: `${spark.x}%`, top: `${spark.y}%` }"
          >
            <span class="spark-core"></span>
            <span
              v-for="particle in spark.particles"
              :key="particle.id"
              class="spark-particle"
              :style="{
                '--spark-angle': `${particle.angle}deg`,
                '--spark-distance': `${particle.distance}px`,
                '--spark-size': `${particle.size}px`,
                '--spark-delay': `${particle.delay}ms`
              }"
            ></span>
          </div>
        </div>
        <!-- ===== メッセージモーダル設定 送信先 ===== -->
        <!-- name / message: 表示テキスト -->
        <!-- type: タイプ番号（SEはモーダル側で解決） -->
        <!-- messageSpeed: 文字送り速度 -->
        <!-- voicePitch / voiceVolume: 音声の高さ・音量 -->
        <!-- messageId / waitInput: 表示制御 -->
        <DialogueMessageModal
          v-if="showDialogueModal"
          :name="dialogueName"
          :message="dialogueMessage"
          :type="dialogueType"
          :message-speed="dialogueMessageSpeed"
          :voice-pitch="dialogueVoicePitch"
          :voice-volume="dialogueVoiceVolume / 100"
          :message-id="dialogueMessageId"
          :wait-input="dialogueWaitInput"
          :test-mode="dialogueTestMode"
          @close="handleDialogueClose"
        />
        <!-- ===== /メッセージモーダル設定 送信先 ===== -->
        <div class="enemy-area">
          <div class="enemy-grid">
            <div
              v-for="slot in enemySlots"
              :key="slot.index"
              class="enemy-slot"
              :class="getEnemySlotClass(slot)"
            >
              <div
                v-if="slot.unit"
                class="enemy-card"
                :style="enemyDistanceStyle(slot.unit, slot.index)"
              >
                <div class="enemy-icon" :class="{ 'has-icon': slot.unit.icon }">
                  <img
                    v-if="slot.unit.icon"
                    :src="getCharIllust(slot.unit.icon)"
                    :alt="slot.unit.name"
                    :style="enemyColorStyle(slot.unit)"
                    @click="selectTargetBySlot(slot.index)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      

      <!-- ===== 中央：味方（20% / 2x2 固定4枠） ===== -->
      <div class="ally-area">
        <div
          v-for="slot in allySlots"
          :key="slot.index"
          class="ally-card"
          :class="{ empty: !slot.unit }"
        >
          <template v-if="slot.unit">
            <!-- 左：アイコン枠 -->
            <div
              class="ally-icon"
              :class="{ 'has-icon': slot.unit.icon, targetable: targetSelectMode }"
              :ref="el => setAllyIconRef(el, slot.index)"
              @click="selectAllyTargetBySlot(slot.index)"
            >
              <img
                v-if="slot.unit.icon"
                :src="getCharIllust(slot.unit.icon) || getCharIllust('スレイブ (新)')"
                :alt="slot.unit.name"
              />
            </div>

            <!-- 右：ステータス -->
            <div class="ally-info">
              <div class="meter">
                <span>HP</span>
                <div class="bar big">
                  <div class="segments">
                    <span
                      v-for="n in 10"
                      :key="`hp-${slot.unit.id}-${n}`"
                      class="segment hp"
                      :style="{ '--fill': segmentFill(slot.unit.hp, slot.unit.hpMax, n) }"
                    />
                  </div>
                  <span class="bar-value">{{ slot.unit.hp }}/{{ slot.unit.hpMax }}</span>
                </div>
              </div>

              <div class="meter">
                <span>MP</span>
                <div class="bar small">
                  <div class="segments">
                    <span
                      v-for="n in 10"
                      :key="`mp-${slot.unit.id}-${n}`"
                      class="segment en"
                      :style="{ '--fill': segmentFill(slot.unit.mp, slot.unit.mpMax, n) }"
                    />
                  </div>
                  <span class="bar-value">{{ slot.unit.mp }}/{{ slot.unit.mpMax }}</span>
                </div>
              </div>

              <div class="status">
                <span v-if="slot.unit.fatigue" class="fatigue">FATIGUE</span>
              </div>
            </div>
          </template>

          <template v-else>
          <div class="ally-empty">
            <div class="empty-frame">
              <div class="empty-id">--</div>
              <div class="empty-lines">
                <span></span><span></span><span></span>
              </div>
              <div class="empty-arrow"></div>
            </div>
          </div>
        </template>
        </div>
      </div>

      </div>
      <!-- ===== 下：コマンド / ログ（40%） ===== -->
      <div class="command-area">
        <div class="command-panel">
          <button
            v-for="btn in mainCommandButtons"
            :key="btn.key"
            @click="selectCommand(btn.key)"
          >
            {{ btn.label }}
          </button>
          <button @click="toggleUIModal">
            {{ showUIModal ? 'UIModal非表示' : 'UIModal表示' }}
          </button>
        </div>

        <div class="info-panel">
          <template v-if="selectedCommand === 'attack'">
            <div class="attack-effect-test">
              <div class="attack-effect-title-row">
                <p class="info-title">ATTACK EFFECT TEST</p>
                <button type="button" class="attack-effect-editor-open" @click="showSkillEffectEditor = true">技演出設定</button>
              </div>
              <div class="attack-effect-setting">
                <span class="attack-effect-label">ATTACK TYPE</span>
                <div class="attack-type-buttons">
                  <button
                    v-for="type in attackEffectTypes"
                    :key="type.key"
                    :class="{ active: attackEffectType === type.key }"
                    @click="selectAttackEffectType(type.key)"
                  >
                    {{ type.label }}
                  </button>
                </div>
              </div>
              <div class="attack-effect-setting">
                <label class="attack-effect-label" for="attack-effect-asset">EFFECT ASSET</label>
                <select id="attack-effect-asset" v-model="attackEffectAsset" class="attack-effect-select">
                  <option v-for="effectName in effectOptions" :key="effectName" :value="effectName">
                    {{ effectName }}
                  </option>
                </select>
              </div>
              <div class="attack-effect-setting">
                <span class="attack-effect-label">DIRECTION</span>
                <div class="attack-direction-buttons">
                  <button
                    v-for="direction in attackEffectDirections"
                    :key="direction.key"
                    :class="{ active: attackEffectDirection === direction.key }"
                    @click="attackEffectDirection = direction.key"
                  >
                    {{ direction.label }}
                  </button>
                </div>
              </div>
              <div class="attack-effect-range-grid">
                <div class="attack-effect-setting attack-effect-range-setting">
                  <label class="attack-effect-label" for="attack-effect-speed">
                    SPEED <strong>{{ attackEffectSpeed }}%</strong>
                  </label>
                  <input
                    id="attack-effect-speed"
                    v-model.number="attackEffectSpeed"
                    type="range"
                    min="25"
                    max="300"
                    step="5"
                  >
                </div>
                <div class="attack-effect-setting attack-effect-range-setting">
                  <label class="attack-effect-label" for="attack-effect-size">
                    SIZE <strong>{{ attackEffectSize }}%</strong>
                  </label>
                  <input
                    id="attack-effect-size"
                    v-model.number="attackEffectSize"
                    type="range"
                    min="10"
                    max="400"
                    step="5"
                  >
                </div>
              </div>
              <div class="attack-effect-setting attack-count-setting">
                <span class="attack-effect-label">HIT COUNT</span>
                <div class="attack-count-controls">
                  <button @click="changeAttackEffectCount(-1)">-</button>
                  <strong>{{ attackEffectCount }}</strong>
                  <button @click="changeAttackEffectCount(1)">+</button>
                </div>
                <button class="attack-effect-execute" @click="triggerAttackEffect">TEST EXECUTE</button>
              </div>
              <p class="attack-effect-note">種別と回数を選んで実行します。未選択時はフィールド中央を対象にします。</p>
            </div>
          </template>
          <template v-else-if="selectedCommand === 'ui'">
            <div v-if="targetSelectMode" class="target-select">
              <div class="target-select-label">TARGET SLOT</div>
              <div class="target-select-buttons">
                <button @click="selectTargetBySlot(0)">1</button>
                <button @click="selectTargetBySlot(1)">2</button>
                <button @click="selectTargetBySlot(2)">3</button>
                <button @click="selectTargetBySlot(3)">4</button>
              </div>
              <div class="target-select-group">
                <div class="target-select-label">TARGET GENERATION</div>
                <div class="target-config-buttons target-generation-buttons">
                  <button
                    v-for="gen in targetGenerationOptions"
                    :key="gen"
                    :class="{ active: gen === allyTargetGeneration }"
                    @click="onAllyTargetGenerationChange(gen)"
                  >
                    {{ targetGenerationLabel(gen) }}
                  </button>
                </div>
              </div>
            </div>
            <div class="ui-controls">
              <button
                v-for="btn in uiButtons"
                :key="btn.key"
                @click="invokeUiAction(btn)"
              >
                {{ btn.label }}
              </button>
              <button
                v-for="btn in uiGenButtons"
                :key="btn.key"
                @click="invokeUiAction(btn)"
              >
                {{ btn.label }}
              </button>
            </div>
            
          </template>
          <template v-else>
            <p class="info-title">{{ panelTitle }}</p>
            <p v-for="(log, i) in logs" :key="i">&gt; {{ log }}</p>
          </template>
        </div>
      </div>

    </div>
  </BaseBattleModal>
</template>

<script setup>
import { reactive, computed, onBeforeUnmount, onMounted, ref, nextTick, watch } from 'vue'
import Phaser from 'phaser'
import PhaserEffectPlayer from '@/components/effects/phaser-effect-player.mjs'
import { playSynthSE } from '@/components/effects/soundEffectSynth.js'
import BaseBattleModal from './BaseBattleModal.vue'
import UIModal from './UIModal.vue'
import OptionsModal from './OptionsModal.vue'
import CustomMarkerModal from './CustomMarkerModal.vue'
import DialogueMessageModal from './DialogueMessageModal.vue'
import SkillEffectEditorModal from './SkillEffectEditorModal.vue'
import { battleAllies, battleEnemies } from '../data/battleAllies.js'
import savedSkillEffectSettings from '../../../../data/skillEffectSettings.json'
import {
  ATTACK_EFFECT_DIRECTIONS,
  ATTACK_EFFECT_TYPES,
  EFFECT_OPTIONS,
  SPARK_EFFECT,
  createAttackImpactPoints,
  createSparkParticles,
  getAttackEffectDirection,
  getAttackEffectType,
  getEffectSprite
} from '../data/battleEffects.js'
import { getBackgroundIllust, getCharIllust, getSEMasterVolume, playSE, setSEMasterVolume } from '@/constants/statData.js'
defineEmits(['close'])
const DIALOGUE_SETTINGS_STORAGE_KEY = 'battle-dialogue-settings-v1'
const CUSTOM_MARKER_SETTINGS_STORAGE_KEY = 'battle-custom-target-marker-settings-v1'
const DIALOGUE_PLAYBACK_DEFAULTS = {
  messageSpeed: 28,
  voicePitch: 1,
  voiceVolume: 50
}

// 表示用：戦闘味方データ（表示専用にラップ）
const allies = reactive(
  battleAllies.map(u => ({
    ...u,
    hpDisplay: 0,
    mpDisplay: 0
  }))
)
const enemyUnits = battleEnemies
const ENEMY_SLOT_COUNT = 4
const enemySlots = computed(() => {
  const front = enemyUnits.filter(enemy => enemy.position !== 'back')
  const back = enemyUnits.filter(enemy => enemy.position === 'back')
  const backSlots = [back[0] || null, back[1] || null]
  const frontSlots = [front[0] || null, front[1] || null]
  const ordered = [...backSlots, ...frontSlots].slice(0, ENEMY_SLOT_COUNT)
  return Array.from({ length: ENEMY_SLOT_COUNT }, (_, index) => ({
    index,
    unit: ordered[index] || null
  }))
})
const backCount = computed(() => enemyUnits.filter(enemy => enemy.position === 'back').length)
const frontCount = computed(() => enemyUnits.filter(enemy => enemy.position !== 'back').length)

const enemyRowIndexMap = computed(() => {
  const front = enemyUnits.filter(enemy => enemy.position !== 'back')
  const back = enemyUnits.filter(enemy => enemy.position === 'back')
  const map = {}
  back.forEach((enemy, index) => {
    map[enemy.id] = { row: 'back', index, count: back.length }
  })
  front.forEach((enemy, index) => {
    map[enemy.id] = { row: 'front', index, count: front.length }
  })
  return map
})

const getEnemySlotClass = (slot) => {
  const classes = [`enemy-slot-${slot.index + 1}`]

  if (slot.unit) {
    const isBackRow = slot.index < 2
    const isFrontRow = slot.index >= 2
    const isSingleBack = isBackRow && backCount.value === 1
    const isSingleFront = isFrontRow && frontCount.value === 1

    if (isSingleBack || isSingleFront) {
      classes.push('is-center')
    }
  }

  return classes
}

const enemyDistanceStyle = (enemy, slotIndex) => {
  if (!enemy) return null
  const rawSiz = Number(enemy.siz) || 450

  // SIZ の想定範囲
  const MIN_SIZ = 90
  const MAX_SIZ = 1000
  const SIZ_RANGE = MAX_SIZ - MIN_SIZ // 910

  // 表示サイズ(px)の範囲
  const MIN_PX = 200
  const MAX_PX = 550
  const PX_RANGE = MAX_PX - MIN_PX // 700

  // clamp
  const siz = Math.min(MAX_SIZ, Math.max(MIN_SIZ, rawSiz))

  // 割合（0〜1）
  const ratio = (siz - MIN_SIZ) / SIZ_RANGE

  // 線形変換
  const sizePx = Math.round(
    MIN_PX + PX_RANGE * ratio
  )

  const { scale, offsetX, offsetY, baseShift, translateX, translateY } = getEnemyPositionAdjust(
    enemy,
    sizePx,
    slotIndex
  )
  const shift = baseShift + offsetY
  if (enemy?.id != null) {
    enemyRenderOffsets[enemy.id] = {
      offsetX,
      shift
    }
  }

  // ----------------------------
  // ★ 最終位置を保存
  // ----------------------------
  const key = enemy.id ?? enemy.name
  if (key != null) {
    const isBack = enemy.position === 'back'
    const data = {
      id: enemy.id ?? null,
      name: enemy.name ?? null,
      x: translateX,
      y: translateY,
      // scale: scale * (1.0 + 1 * ratio),
      scale: (1.0 + 1 * ratio),
      sizePx,
      position: enemy.position,
      isBack,
      isFlying: !!enemy.sFlying
    }

    targetPositions[key] = data
  }

  return {
    '--enemy-size': `${sizePx}px`,
    '--enemy-shift': `${shift}px`,
    '--enemy-x': `${offsetX}px`,
    '--enemy-scale': scale
  }
}

const ENEMY_BASE_OFFSET = {
  back: { x: 50, y: 0 },
  front: { x: -50, y: 0 }
}
const ENEMY_SPREAD = {
  front: 300,
  back: 300
}

const getEnemyPositionAdjust = (enemy, sizePx) => {
  const isBack = enemy.position === 'back'

  const baseScale = Number(enemy.scale) || (isBack ? 0.95 : 1.35)
  const flyingScale = enemy.sFlying ? (Number(enemy.flyingScale) || 1.00) : 1
  const scale = baseScale * flyingScale

  const rowData = enemyRowIndexMap.value[enemy.id] || {
    row: isBack ? 'back' : 'front',
    index: 0,
    count: 1
  }
  const spread = rowData.row === 'back' ? ENEMY_SPREAD.back : ENEMY_SPREAD.front
  const rowOffsetX =
    rowData.count <= 1
      ? 0
      : (rowData.index - (rowData.count - 1) / 2) * spread

  const baseOffset = isBack ? ENEMY_BASE_OFFSET.back : ENEMY_BASE_OFFSET.front
  const shouldApplyBaseOffsetX = backCount.value === frontCount.value
  const baseX = (shouldApplyBaseOffsetX ? baseOffset.x : 0) + rowOffsetX
  const baseY = baseOffset.y

  const x = Number(enemy.offsetX ?? baseX) || 0
  const y = Number(enemy.offsetY ?? baseY) || 0
  // const x = 0
  // const y = 0
  const flyingOffsetY = enemy.sFlying ? (Number(enemy.flyingOffsetY) || -120) : 0
  const offsetY = y + flyingOffsetY

  const baseShift = 0

  const deltaX = baseX
  const deltaY = offsetY
  const translateX = deltaX
  const translateY = baseShift + offsetY
  console.log('[enemy-offset]', {
    unit: enemy?.name,
    position: enemy?.position,
    deltaX: Math.round(deltaX),
    deltaY: Math.round(deltaY),
    sizePx,
    scale
  })

  return {
    scale,
    offsetX: x,
    offsetY,
    baseShift,
    translateX,
    translateY
  }
}
const enemyColorStyle = (enemy) => {
  if (!enemy?.setColor) return null
  return { filter: enemy.setColor }
}

const selectedCommand = ref('attack')
const showUIModal = ref(true)
const showTarget = ref(true)
const targetPos = ref({ x: 0, y: 0 })
const targetPositions = reactive({})
const enemyRenderOffsets = reactive({})
const battleFieldRef = ref(null)
const effectCanvasRef = ref(null)
const allyIconRefs = ref([])
const showOptionsModal = ref(false)
const showCustomMarkerModal = ref(false)
const showSkillEffectEditor = ref(false)
const gen4MarkerNodes = ref([
  { color: '#63f58c', connectionStrength: 0.7 },
  { color: '#ffe45c', connectionStrength: 0.55 },
  { color: '#5faeff', connectionStrength: 0.8 }
])
const gen45MarkerNodes = ref([
  { color: '#63f58c', connectionStrength: 0.7 },
  { color: '#ffe45c', connectionStrength: 0.45 },
  { color: '#5faeff', connectionStrength: 0.85 },
  { color: '#ffffff', connectionStrength: 0.55 },
  { color: '#b8ff62', connectionStrength: 0.65 }
])

// ===== メッセージモーダル設定（DialogueMessageModal へ送信） =====
// 表示状態（true でメッセージモーダルを表示）
const showDialogueModal = ref(false)
const dialogueTestMode = ref(false)
const seVolume = ref(Math.round(getSEMasterVolume() * 100))
const sparkEffectEnabled = ref(false)
const sparkEffects = ref([])
let sparkEffectId = 0
const sparkEffectTimers = new Map()
const attackEffectTimers = new Set()
const activeEffectPlayers = new Set()
let effectGame = null
let effectScene = null
let effectCanvasResizeObserver = null
const attackEffectType = ref('slash')
const attackEffectDirection = ref('right')
const attackEffectCount = ref(1)
const attackEffectSpeed = ref(100)
const attackEffectSize = ref(100)
const attackEffectTypes = ATTACK_EFFECT_TYPES
const attackEffectDirections = ATTACK_EFFECT_DIRECTIONS
const effectOptions = EFFECT_OPTIONS
const attackEffectAsset = ref(getAttackEffectType(attackEffectType.value).effectName)
// 技演出の初期設定はソース内の JSON を正とする。
const skillEffectSettings = ref(Object.fromEntries(
  (savedSkillEffectSettings.skills || []).map(skill => [skill.id, { ...skill }])
))
const skillEffectEditorSkills = computed(() => ATTACK_EFFECT_TYPES.map(type => ({
  id: type.key,
  label: type.label,
  effectName: type.effectName,
  ...skillEffectSettings.value[type.key]
})))
const allyTargetGeneration = ref(1)
const targetMarkerType = ref('standard')
const CUSTOM_MARKER_DEFAULTS = {
  shape: 'circle',
  color: '#8fefff',
  size: 100,
  opacity: 88,
  ringCount: 2,
  lineWidth: 2,
  rotationSeconds: 8,
  showCenterDot: true,
  behavior: {
    previewBackgroundColor: '#071722',
    previewGradientEnabled: true,
    followCursor: false,
    cursorFollowDuration: 80,
    cursorFollowSpeed: 90
  }
}
const customMarkerSettings = ref({ ...CUSTOM_MARKER_DEFAULTS })
const targetGenerationOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 9]
const targetGenerationLabel = generation => generation === 9 ? 'SP' : `G${generation}`
// 話者名
const dialogueName = ref('UNIT-01')
// 本文（\n で改行）
const dialogueMessage = ref('敵性反応を確認。\n各ユニットは迎撃態勢へ移行してください。')
// タイプ番号（0=無音, 1/2/2.5/3/3.5/4/4.5）
const dialogueType = ref(1)
// 文字送り速度（ms）。0 は瞬時表示
const dialogueMessageSpeed = ref(DIALOGUE_PLAYBACK_DEFAULTS.messageSpeed)
// 音声ピッチ倍率
const dialogueVoicePitch = ref(DIALOGUE_PLAYBACK_DEFAULTS.voicePitch)
// 音声ボリューム（0-100）
const dialogueVoiceVolume = ref(DIALOGUE_PLAYBACK_DEFAULTS.voiceVolume)
// 同じ本文でも再描画をトリガーする識別子
const dialogueMessageId = ref(1)
// タイプ完了後に入力待ちマーカーを出すか
const dialogueWaitInput = ref(true)
const dialogueTypeOptions = [0, 1, 2, 2.5, 3, 3.5, 4, 4.5]

// 速度ボタンで循環させる候補値（0=瞬時）
const dialogueSpeedOptions = [0, 16, 28, 40]
// UI ボタンラベル（タイプ）
const dialogueTypeButtonLabel = computed(() => {
  if (dialogueType.value === 0) return 'TYPE-OFF'
  return `TYPE-${dialogueType.value}`
})
// UI ボタンラベル（速度）
const dialogueSpeedButtonLabel = computed(() => {
  if (dialogueMessageSpeed.value === 0) return 'SPD-INST'
  return `SPD-${dialogueMessageSpeed.value}`
})
// UI ボタンラベル（入力待ち）
const dialogueWaitButtonLabel = computed(() =>
  dialogueWaitInput.value ? 'WAIT-ON' : 'WAIT-OFF'
)
// ===== /メッセージモーダル設定（DialogueMessageModal へ送信） =====

const toggleOptionsModal = () => {
  showOptionsModal.value = !showOptionsModal.value
}

const openMarkerSettings = () => {
  showOptionsModal.value = true
}

const gen4MarkerNodeDefaults = [
  { color: '#63f58c', connectionStrength: 0.7 },
  { color: '#ffe45c', connectionStrength: 0.55 },
  { color: '#5faeff', connectionStrength: 0.8 }
]

const markerNodeDefaults = [
  { color: '#63f58c', connectionStrength: 0.7 },
  { color: '#ffe45c', connectionStrength: 0.45 },
  { color: '#5faeff', connectionStrength: 0.85 },
  { color: '#ffffff', connectionStrength: 0.55 },
  { color: '#b8ff62', connectionStrength: 0.65 }
]

const onMarkerNodeCountChange = value => {
  const count = Math.max(3, Math.min(10, Math.round(Number(value) || 3)))
  gen45MarkerNodes.value = Array.from({ length: count }, (_, index) => {
    return gen45MarkerNodes.value[index] ?? markerNodeDefaults[index % markerNodeDefaults.length]
  })
}

const onMarkerNodeColorChange = (index, color) => {
  if (!gen45MarkerNodes.value[index]) return
  gen45MarkerNodes.value[index] = { ...gen45MarkerNodes.value[index], color }
}

const onMarkerNodeStrengthChange = (index, value) => {
  if (!gen45MarkerNodes.value[index]) return
  const strength = Math.max(0, Math.min(1, Number(value) / 100 || 0))
  gen45MarkerNodes.value[index] = { ...gen45MarkerNodes.value[index], connectionStrength: strength }
}

const onGen4MarkerNodeCountChange = value => {
  const count = Math.max(3, Math.min(10, Math.round(Number(value) || 3)))
  gen4MarkerNodes.value = Array.from({ length: count }, (_, index) => {
    return gen4MarkerNodes.value[index] ?? gen4MarkerNodeDefaults[index % gen4MarkerNodeDefaults.length]
  })
}

const onGen4MarkerNodeColorChange = (index, color) => {
  if (!gen4MarkerNodes.value[index]) return
  gen4MarkerNodes.value[index] = { ...gen4MarkerNodes.value[index], color }
}

const onGen4MarkerNodeStrengthChange = (index, value) => {
  if (!gen4MarkerNodes.value[index]) return
  const strength = Math.max(0, Math.min(1, Number(value) / 100 || 0))
  gen4MarkerNodes.value[index] = { ...gen4MarkerNodes.value[index], connectionStrength: strength }
}
const handleDialogueClose = () => {
  showDialogueModal.value = false
  dialogueTestMode.value = false
}
// メッセージモーダルの表示切替（開くたびに messageId を進める）
const toggleDialogueModal = () => {
  showDialogueModal.value = !showDialogueModal.value
  if (!showDialogueModal.value) {
    dialogueTestMode.value = false
  }
  if (showDialogueModal.value) {
    dialogueMessageId.value += 1
  }
}
// MSG押下: モーダル内テストUI（TYPE SELECT）で起動
const playDialogueWithTypeSelect = () => {
  dialogueTestMode.value = true
  showDialogueModal.value = true
  dialogueMessageId.value += 1
}
const setDialogueMessageSpeed = (value) => {
  const raw = Number(value)
  const numeric = Number.isFinite(raw) ? Math.round(raw) : DIALOGUE_PLAYBACK_DEFAULTS.messageSpeed
  dialogueMessageSpeed.value = Math.max(0, Math.min(80, numeric))
}
const setDialogueVoicePitch = (value) => {
  const raw = Number(value)
  const numeric = Number.isFinite(raw) ? raw : DIALOGUE_PLAYBACK_DEFAULTS.voicePitch
  dialogueVoicePitch.value = Math.max(0.6, Math.min(1.6, Number(numeric.toFixed(2))))
}
const setDialogueVoiceVolume = (value) => {
  const raw = Number(value)
  const numeric = Number.isFinite(raw) ? Math.round(raw) : DIALOGUE_PLAYBACK_DEFAULTS.voiceVolume
  dialogueVoiceVolume.value = Math.max(0, Math.min(100, numeric))
}
const resetDialoguePlaybackSettings = () => {
  dialogueMessageSpeed.value = DIALOGUE_PLAYBACK_DEFAULTS.messageSpeed
  dialogueVoicePitch.value = DIALOGUE_PLAYBACK_DEFAULTS.voicePitch
  dialogueVoiceVolume.value = DIALOGUE_PLAYBACK_DEFAULTS.voiceVolume
}
const loadDialoguePlaybackSettings = () => {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(DIALOGUE_SETTINGS_STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      setDialogueMessageSpeed(parsed.messageSpeed)
      setDialogueVoicePitch(parsed.voicePitch)
      setDialogueVoiceVolume(parsed.voiceVolume)
    }
  } catch {
    // ignore invalid storage payload
  }
}
const saveDialoguePlaybackSettings = () => {
  if (typeof window === 'undefined') return
  const payload = {
    messageSpeed: dialogueMessageSpeed.value,
    voicePitch: dialogueVoicePitch.value,
    voiceVolume: dialogueVoiceVolume.value
  }
  window.localStorage.setItem(DIALOGUE_SETTINGS_STORAGE_KEY, JSON.stringify(payload))
}

const loadCustomMarkerSettings = () => {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(CUSTOM_MARKER_SETTINGS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object') {
      customMarkerSettings.value = { ...CUSTOM_MARKER_DEFAULTS, ...parsed }
    }
  } catch {
    // Ignore a malformed saved marker and continue with the defaults.
  }
}

const onCustomMarkerSave = (settings) => {
  customMarkerSettings.value = { ...CUSTOM_MARKER_DEFAULTS, ...settings }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      CUSTOM_MARKER_SETTINGS_STORAGE_KEY,
      JSON.stringify(customMarkerSettings.value)
    )
  }
  onTargetMarkerTypeChange('custom')
  showCustomMarkerModal.value = false
}

const openCustomMarkerModal = () => {
  showCustomMarkerModal.value = true
}

watch(
  () => [dialogueMessageSpeed.value, dialogueVoicePitch.value, dialogueVoiceVolume.value],
  () => {
    saveDialoguePlaybackSettings()
  }
)
// タイプ切替: 候補リストを循環
const cycleDialogueType = () => {
  const current = dialogueTypeOptions.indexOf(dialogueType.value)
  const next = current >= 0 ? (current + 1) % dialogueTypeOptions.length : 0
  dialogueType.value = dialogueTypeOptions[next]
}
// 速度切替: 0 -> 16 -> 28 -> 40 -> 0
const cycleDialogueSpeed = () => {
  const current = dialogueSpeedOptions.indexOf(dialogueMessageSpeed.value)
  const next = current >= 0 ? (current + 1) % dialogueSpeedOptions.length : 0
  dialogueMessageSpeed.value = dialogueSpeedOptions[next]
}
// 入力待ちマーカーの表示 ON/OFF
const toggleDialogueWaitInput = () => {
  dialogueWaitInput.value = !dialogueWaitInput.value
}
// =========================================
// ====== ボリューム設定 ========
const onSeVolumeChange = (value) => {
  const raw = Number(value)
  const clamped = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 0))
  seVolume.value = clamped
  setSEMasterVolume(clamped / 100)
}
const onAllyTargetGenerationChange = (value) => {
  const raw = Number(value)
  const numeric = Number.isFinite(raw) ? raw : 1
  allyTargetGeneration.value = numeric
  uiModalRef.value?.setTargetGeneration?.(numeric)
}
const onSparkEffectEnabled = (enabled) => {
  sparkEffectEnabled.value = enabled === true
}
const createSparkEffect = (x, y) => {
  const spark = {
    id: ++sparkEffectId,
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
    particles: createSparkParticles()
  }
  sparkEffects.value.push(spark)
  const timer = window.setTimeout(() => {
    sparkEffects.value = sparkEffects.value.filter(effect => effect.id !== spark.id)
    sparkEffectTimers.delete(spark.id)
  }, SPARK_EFFECT.lifetime)
  sparkEffectTimers.set(spark.id, timer)
}
const resizeEffectCanvas = () => {
  const field = battleFieldRef.value
  if (!field || !effectGame) return

  effectGame.scale.resize(Math.max(1, field.clientWidth), Math.max(1, field.clientHeight))
}

const initializeEffectCanvas = () => {
  if (effectGame || !effectCanvasRef.value || !battleFieldRef.value) return

  const field = battleFieldRef.value
  effectGame = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: effectCanvasRef.value,
    width: Math.max(1, field.clientWidth),
    height: Math.max(1, field.clientHeight),
    transparent: true,
    banner: false,
    scene: {
      create () {
        effectScene = this
      }
    }
  })
  effectCanvasResizeObserver = new ResizeObserver(resizeEffectCanvas)
  effectCanvasResizeObserver.observe(field)
}

const playAttackSpriteEffect = async ({ x, y, source, rotation, scale, frameDurationMs }) => {
  if (!effectScene || !battleFieldRef.value) return

  const field = battleFieldRef.value
  const rect = field.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  // targetPos is measured from the scaled battle field. Phaser uses its unscaled canvas coordinates.
  const worldX = x / rect.width * field.clientWidth
  const worldY = y / rect.height * field.clientHeight
  const player = new PhaserEffectPlayer(effectScene)
  activeEffectPlayers.add(player)
  try {
    await player.play({
      src: source,
      x: worldX,
      y: worldY,
      angleDeg: rotation,
      scalePercent: Math.max(1, scale * 100),
      frameDurationMs,
      renderStyle: 'none'
    })
  } finally {
    player.destroy()
    activeEffectPlayers.delete(player)
  }
}
const changeAttackEffectCount = (amount) => {
  attackEffectCount.value = Math.max(1, Math.min(8, attackEffectCount.value + amount))
}
const selectAttackEffectType = (type) => {
  const effectType = getAttackEffectType(type)
  attackEffectType.value = effectType.key
  attackEffectAsset.value = effectType.effectName
}
const scheduleSkillSE = (config) => {
  const isSynth = config.seMode === 'synth' && config.seSynth
  if (!isSynth && !config.seKey) return
  const delay = Math.max(0, Number(config.seDelayMs) || 0)
  const timer = window.setTimeout(() => {
    const rawVolume = Number(config.seVolume)
    const volume = Math.max(0, Math.min(1, (Number.isFinite(rawVolume) ? rawVolume : 80) / 100))
    if (isSynth) playSynthSE(config.seSynth, { volume: volume * getSEMasterVolume() })
    else playSE(config.seKey, { volume })
    attackEffectTimers.delete(timer)
  }, delay)
  attackEffectTimers.add(timer)
}
const triggerAttackEffect = async (overrides = {}) => {
  const field = battleFieldRef.value
  if (!field || !effectScene) return

  const rect = field.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const targetX = targetPos.value.x / rect.width * 100
  const targetY = targetPos.value.y / rect.height * 100
  const baseX = Number.isFinite(targetX) && targetX > 0 ? targetX : 50
  const baseY = Number.isFinite(targetY) && targetY > 0 ? targetY : 42
  const configuredSkill = skillEffectSettings.value[attackEffectType.value] || {}
  const config = { ...configuredSkill, ...overrides }
  const hitCount = Math.max(1, Math.min(8, Number(config.hitCount) || attackEffectCount.value))
  const impacts = createAttackImpactPoints({
    type: attackEffectType.value,
    count: hitCount,
    baseX,
    baseY
  })
  const effectType = getAttackEffectType(attackEffectType.value)
  const direction = getAttackEffectDirection(attackEffectDirection.value)
  const sprite = getEffectSprite(config.effectName || attackEffectAsset.value, effectType.duration)
  const sizeMultiplier = Math.max(0.1, Number(config.size) / 100 || Number(attackEffectSize.value) / 100 || 1)
  const speedMultiplier = Math.max(0.25, Number(config.speed) / 100 || Number(attackEffectSpeed.value) / 100 || 1)
  const scale = sizeMultiplier
  // All effects use the same per-frame speed; only the number of frames changes the total duration.
  const frameDurationMs = Math.max(16, Math.round(100 / speedMultiplier))
  const effectDelayMs = Math.max(0, Number(config.effectDelayMs) || 0)
  const rotation = Number.isFinite(Number(config.angleDeg)) ? Number(config.angleDeg) : direction.rotation
  scheduleSkillSE(config)

  impacts.forEach(({ x, y, delay }) => {
    const timer = window.setTimeout(() => {
      void playAttackSpriteEffect({
        x: x / 100 * rect.width,
        y: y / 100 * rect.height,
        source: sprite.source,
        rotation,
        scale,
        frameDurationMs
      })
      attackEffectTimers.delete(timer)
    }, effectDelayMs + delay)
    attackEffectTimers.add(timer)
  })
}
const applySkillEffectSettings = (skills) => {
  skillEffectSettings.value = Object.fromEntries(skills.map(skill => [skill.id, { ...skill }]))
  showSkillEffectEditor.value = false
}
const handleBattleFieldClick = (event) => {
  if (!sparkEffectEnabled.value || !battleFieldRef.value) return
  // BaseBattleModal itself uses `.modal-overlay`, so excluding it would reject every field click.
  if (event.target.closest('button, input, select, textarea, label')) return

  const rect = battleFieldRef.value.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  createSparkEffect(
    (event.clientX - rect.left) / rect.width * 100,
    (event.clientY - rect.top) / rect.height * 100
  )
}

const onTargetMarkerTypeChange = (value) => {
  const markerTypes = ['standard', 'angel', 'tactical', 'diamond', 'radar', 'rift', 'custom']
  targetMarkerType.value = markerTypes.includes(value) ? value : 'standard'
  uiModalRef.value?.setTargetMarkerType?.(targetMarkerType.value)
}

const setAllyIconRef = (el, index) => {
  allyIconRefs.value[index] = el
}
const toggleUIModal = () => {
  showUIModal.value = !showUIModal.value
}
const selectCommand = (key) => {
  selectedCommand.value = key
}
const mainCommandButtons = [
  { key: 'attack', label: '攻撃' },
  { key: 'skill', label: 'スキル' },
  { key: 'defend', label: '防御' },
  { key: 'item', label: 'アイテム' },
  { key: 'ui', label: 'UIModal' }
]
const panelTitleMap = {
  attack: 'ATTACK',
  skill: 'SKILL',
  defend: 'DEFEND',
  item: 'ITEM',
  ui: 'UIMODAL'
}
const panelTitle = computed(() => panelTitleMap[selectedCommand.value] || 'INFO')

const uiModalRef = ref(null)
const uiButtons = ref([])
const uiGenButtons = ref([])

const targetSelectMode = ref(false)

const invokeUiAction = (btn) => {
  if (btn?.key === 'custom-edit') {
    openCustomMarkerModal()
    return
  }

  const ui = uiModalRef.value
  const action = btn?.action
  if (!ui || !action || typeof ui[action] !== 'function') return

  if (action === 'setGeneration') onTargetMarkerTypeChange('standard')
  if (action === 'setMarkerPreset') onTargetMarkerTypeChange(btn.args?.[0])

  if (btn.key === 'target') {
    targetSelectMode.value = !targetSelectMode.value
  }
  if (Array.isArray(btn.args) && btn.args.length > 0) {
    ui[action](...btn.args)
    return
  }
  ui[action]()
}

const loadUiButtons = () => {
  const ui = uiModalRef.value
  if (!ui) return
  uiButtons.value = ui.getControlButtons?.() || []
  uiGenButtons.value = ui.getGenerationButtons?.() || []
}

const TARGET_OFFSET = { x: 0, y: 0 }

const getAbsolutePosition = (element) => {
  const field = battleFieldRef.value
  if (!element || !field) return null
  
  const elRect = element.getBoundingClientRect()
  const fieldRect = field.getBoundingClientRect()
  
  return {
    x: elRect.left - fieldRect.left + (elRect.width / 2),
    y: elRect.top - fieldRect.top + (elRect.height / 2)
  }
}


const selectTargetBySlot = (slotIndex) => {
  const slot = enemySlots.value?.[slotIndex]
  const unit = slot?.unit
  if (!unit) return

  // DOMが見つからない場合のフォールバック
  const key = unit.id ?? unit.name
  const saved = key != null ? targetPositions[key] : null
  console.log('[target][slot]', { saved })
  
  if (saved) {
    // バック行とフロント行で異なる補正値を適用
    const isBack = saved.position === 'back'
    const offsetX = isBack ? 350 : 350 // バック行用とフロント行用の補正値
    const offsetY = isBack ? 270 : 270 // 必要に応じて調整
    
    targetPos.value = { 
      x: saved.x + TARGET_OFFSET.x + offsetX, 
      y: saved.y + TARGET_OFFSET.y + offsetY + (saved.isFlying ? 60 : 0),
      scale: saved.scale || 1
    }
    
    console.log('[target][position-adjusted]', {
      unit: saved.name,
      position: saved.position,
      isFlying : saved.isFlying,
      isBack,
      offsetX,
      offsetY,
      finalX: saved.x + TARGET_OFFSET.x + offsetX,
      finalY: saved.y + TARGET_OFFSET.y + offsetY
    })
    
    // UIModalにターゲット位置を渡す
    const ui = uiModalRef.value
    if (ui) {
      ui.setTargetGeneration?.(null)
      ui.setTargetPosition(targetPos.value)
      ui.setTargetVisible(true)
    }
    
    showUIModal.value = true
    showTarget.value = true
    return
  }
  
  console.log('[target][slot][missing]', {
    unit: unit?.name,
    unit_id: unit?.id
  })
}

const selectAllyTargetBySlot = (slotIndex) => {
  if (!targetSelectMode.value) return
  const slot = allySlots.value?.[slotIndex]
  const unit = slot?.unit
  if (!unit) return
  const iconEl = allyIconRefs.value?.[slotIndex]
  if (!iconEl) return
  const pos = getAbsolutePosition(iconEl)
  if (!pos) return

  const rect = iconEl.getBoundingClientRect()
  const baseSize = 180
  const autoScale = rect ? Math.min(rect.width, rect.height) / baseSize : 1
  const customScale = Number(unit.targetScale)
  const scale = Number.isFinite(customScale) && customScale > 0 ? customScale : autoScale
  const customOffsetX = Number(unit.targetOffsetX)
  const customOffsetY = Number(unit.targetOffsetY)
  const offsetX = Number.isFinite(customOffsetX) ? customOffsetX : 20
  const offsetY = Number.isFinite(customOffsetY) ? customOffsetY : 140
  targetPos.value = {
    x: pos.x + offsetX,
    y: pos.y + offsetY,
    scale
  }
  

  const ui = uiModalRef.value
  if (ui) {
    ui.setTargetGeneration?.(allyTargetGeneration.value)
    ui.setTargetPosition(targetPos.value)
    ui.setTargetVisible(true)
  }
  showUIModal.value = true
  showTarget.value = true
}


const battleFieldBg = getBackgroundIllust('ロボット研究所_廃墟')
const SLOT_COUNT = 4
const allySlots = computed(() =>
  Array.from({ length: SLOT_COUNT }, (_, index) => ({
    index,
    unit: allies[index] || null
  }))
)
const segmentFill = (current, max, index) => {
  if (!max) return 0
  const ratio = current / max
  const fill = ratio * 10 - (index - 1)
  return Math.max(0, Math.min(1, fill))
}

onBeforeUnmount(() => {
  sparkEffectTimers.forEach(timer => window.clearTimeout(timer))
  sparkEffectTimers.clear()
  attackEffectTimers.forEach(timer => window.clearTimeout(timer))
  attackEffectTimers.clear()
  activeEffectPlayers.forEach(player => player.destroy())
  activeEffectPlayers.clear()
  effectCanvasResizeObserver?.disconnect()
  effectCanvasResizeObserver = null
  effectGame?.destroy(true)
  effectGame = null
  effectScene = null
})

// 起動時に HP / MP を 0 → 現在値までアニメーション
onMounted(() => {
  loadDialoguePlaybackSettings()
  loadCustomMarkerSettings()
  nextTick(() => {
    initializeEffectCanvas()
    loadUiButtons()
    const field = battleFieldRef.value
    if (field) {
      const rect = field.getBoundingClientRect()
      targetPos.value = {
        x: Math.round(rect.width / 2),
        y: Math.round(rect.height / 2)
      }
    }
  })
  allies.forEach(unit => {
    // HP
    requestAnimationFrame(() => {
      unit.hpDisplay = unit.hp
    })

    // MP / ENERGY（少し遅らせる）
    setTimeout(() => {
      unit.mpDisplay = unit.mp
    }, 120)
  })
})
</script>

<style scoped>
.battle-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: Consolas, monospace;
  color: #bff6ff;
}

/* ===== 上：フィールド ===== */
.battle-field {
  height: 725px;
  /* border: 1px solid #2fa4c7; */
  display: flex;
  flex-direction: column;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
}

.battle-settings {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  z-index: 4;
  pointer-events: auto;
}

.settings-button {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(160, 230, 255, 0.6);
  background: rgba(8, 16, 24, 0.7);
  color: #bff6ff;
  font-size: 18px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(90, 200, 255, 0.25);
}

.settings-button:hover {
  background: rgba(10, 22, 32, 0.85);
  border-color: rgba(190, 245, 255, 0.8);
}

.message-button {
  width: 52px;
  font-size: 10px;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.type-button,
.speed-button,
.wait-button {
  width: 80px;
  font-size: 10px;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.battle-root.is-custom-marker-editor-open .battle-field > *,
.battle-root.is-custom-marker-editor-open .command-area {
  visibility: hidden;
}

.battle-root.is-custom-marker-editor-open .battle-field *,
.battle-root.is-custom-marker-editor-open .command-area * {
  animation-play-state: paused !important;
}

.battle-field .ui-modal {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  /* top: -321px; */
  /* inset: auto; */
  /* top: 100px;
  right: 416px; */
}

.battle-field .target-layer {
  position: absolute;
  inset: 0;
  z-index: 100; /* Enemyより上に表示 */
  pointer-events: none;
}

.target-marker-instance {
  position: absolute;
  /* transform: translate(-50%, -50%); */
}

.battle-field::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(3px);
  background: rgba(0, 0, 0, 0.08);
  z-index: 0;
}

.battle-field > * {
  position: relative;
  z-index: 1;
}

.spark-effect-layer {
  position: absolute !important;
  inset: 0;
  z-index: 80 !important;
  pointer-events: none;
  overflow: hidden;
}

.battle-effect-canvas {
  position: absolute;
  inset: 0;
  z-index: 79;
  pointer-events: none;
  overflow: hidden;
}

.battle-effect-canvas :deep(canvas) {
  display: block;
}

.spark-burst {
  position: absolute;
  width: 0;
  height: 0;
}

.spark-core {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: #fff7c4;
  box-shadow: 0 0 6px 2px #fff1a2, 0 0 17px 5px rgba(255, 138, 53, 0.85);
  animation: sparkCoreFlash 0.48s ease-out forwards;
}

.spark-particle {
  position: absolute;
  top: calc(var(--spark-size) / -2);
  left: 0;
  width: var(--spark-size);
  height: var(--spark-size);
  border-radius: 50%;
  transform-origin: 0 50%;
  background: linear-gradient(90deg, #fffbe0 0%, #ffd34d 42%, #ff6b2c 100%);
  box-shadow: 0 0 5px 1px rgba(255, 184, 64, 0.95);
  animation: sparkParticleBurst 0.68s cubic-bezier(0.12, 0.63, 0.36, 1) var(--spark-delay) forwards;
}

@keyframes sparkCoreFlash {
  0% { opacity: 1; scale: 0.4; }
  35% { opacity: 1; scale: 1.5; }
  100% { opacity: 0; scale: 0; }
}

@keyframes sparkParticleBurst {
  0% {
    opacity: 1;
    transform: rotate(var(--spark-angle)) translateX(0) scaleX(1.8);
  }
  55% { opacity: 1; }
  100% {
    opacity: 0;
    transform: rotate(var(--spark-angle)) translateX(var(--spark-distance)) scaleX(0.25);
  }
}

.enemy-area {
  height: 66.6667%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
}

.enemy-grid {
  width: 100%;
  height: 100%;
  position: relative;
}

.enemy-slot {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.enemy-slot.is-center {
  inset: 0;
}

.enemy-card {
  width: var(--enemy-size, 225px);
  height: var(--enemy-size, 225px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translate(calc(-50% + var(--enemy-x, 0px)), var(--enemy-shift, 0px))
    scale(var(--enemy-scale, 1));
}

/* Slot order: 1,2 = front / 3,4 = back */
.enemy-slot-3,
.enemy-slot-4 {
  opacity: 0.9;
}

.enemy-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  transform-origin: center center;
}

.enemy-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
}

/* 人数による縮小は行わず、個体サイズをそのまま反映 */
.enemy-icon {
  transform: none;
}

/* ===== 中央：味方 ===== */
.ally-area {
  height: 33.3333%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 6px;
}

.ally-card {
  display: grid;
  grid-template-columns: 40% 60%;
  gap: 8px;
  background: linear-gradient(180deg, rgba(10,25,35,0.95), rgba(5,15,25,0.95));
  border: 1px solid #3aaed8;
  padding: 8px;
  font-size: 20px;
  height: 100px;
}

.ally-card.empty {
  border: 1px dashed #2fa4c7;
  background: rgba(10,20,30,0.4);
}

.ally-empty {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-frame {
  width: 90%;
  height: 80px;
  border: 1px solid #2fa4c7;
  position: relative;
  color: #6fdfff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 12px;
  background: rgba(10, 20, 30, 0.35);
}

.empty-frame::before,
.empty-frame::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid #6fdfff;
}

.empty-frame::before {
  top: -2px; left: -2px;
  border-right: none; border-bottom: none;
}

.empty-frame::after {
  bottom: -2px; right: -2px;
  border-left: none; border-top: none;
}

.empty-id {
  font-size: 18px;
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.empty-lines span {
  display: block;
  height: 4px;
  margin: 3px 0;
  background: linear-gradient(90deg, #6fdfff33, #6fdfff66, #6fdfff33);
}

.empty-arrow {
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid #f2d94c;
}

.ally-icon {
  width: 100%;
  height: 100%;
  border: 1px solid #4cc9f0;
  background: radial-gradient(circle at center, #0b1a22, #050c10);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: monitorBoot 0.6s ease-out forwards;
  overflow: hidden;
}

.ally-icon.targetable {
  cursor: pointer;
  box-shadow: 0 0 12px rgba(90, 200, 255, 0.35);
}

.ally-icon.targetable:hover {
  box-shadow: 0 0 16px rgba(120, 230, 255, 0.5);
}

.ally-icon img {
  height: 100%;
  width: auto;
  display: block;
  object-fit: cover;
  object-position: center top;
}

.ally-icon.has-icon img {
  transform: scale(3.5) translateY(34%);
}

.ally-card:nth-child(1) .ally-icon { animation-delay: 0.05s; }
.ally-card:nth-child(2) .ally-icon { animation-delay: 0.1s; }
.ally-card:nth-child(3) .ally-icon { animation-delay: 0.15s; }
.ally-card:nth-child(4) .ally-icon { animation-delay: 0.2s; }

.ally-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1px;
  padding-top: 4px;
}

/* ===== メーター ===== */
.meter {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 2px;
  align-items: center;
}

.bar {
  width: 150px;
  background: #111;
  border: 1px solid #3aaed8;
  overflow: hidden;
  position: relative;
  padding: 2px;
}

.bar.big { height: 14px; }
.bar.small { height: 8px; }

.segments {
  height: 100%;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
}

.segment {
  background: #0a141a;
  position: relative;
  overflow: hidden;
  clip-path: polygon(6% 0, 100% 0, 94% 100%, 0 100%);
  box-shadow: inset 0 0 0 1px #173542;
}

.segment::before {
  content: '';
  position: absolute;
  inset: 0;
  transform: scaleX(var(--fill));
  transform-origin: left center;
}

.segment.hp::before { background: #4cf2ff; }
.segment.en::before { background: #5cff8a; }

.bar-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  color: #f7fdff;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.9),
    0 0 6px rgba(0, 200, 255, 0.45),
    0 0 12px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

/* ===== 状態 ===== */
.status { text-align: right; }

.fatigue {
  color: #ff6b6b;
  animation: blink 1s steps(2) infinite;
}

@keyframes blink { 50% { opacity: 0; } }

@keyframes monitorBoot {
  0% {
    opacity: 0;
    transform: scaleY(0.05) scaleX(1.2);
    filter: brightness(2) blur(2px);
  }
  40% {
    opacity: 1;
    transform: scaleY(0.08) scaleX(1.05);
    filter: brightness(1.8) blur(1px);
  }
  70% {
    transform: scaleY(1.05) scaleX(0.98);
    filter: brightness(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    filter: none;
  }
}

/* ===== 下：コマンド / ログ ===== */
.command-area {
  height: 35%;
  display: flex;
  gap: 6px;
  padding: 6px;
}

.command-panel {
  width: 40%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.command-panel button {
  background: linear-gradient(#1f4f66, #122c3a);
  border: 1px solid #4cc9f0;
  color: #f7fdff;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.info-panel {
  flex: 1;
  border: 1px solid #2fa4c7;
  padding: 6px;
  font-size: 11px;
  overflow-y: auto;
}

.info-title {
  margin: 0 0 6px;
  font-size: 12px;
  color: #9feaff;
}

.attack-effect-test {
  display: grid;
  gap: 5px;
}

.attack-effect-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.attack-effect-title-row .info-title {
  margin: 0;
}

.attack-effect-editor-open {
  min-height: 27px;
  border: 1px solid #51dff8;
  color: #e1fbff;
  background: #0c3a4b;
  padding: 0 8px;
  font-family: Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.attack-effect-editor-open:hover {
  background: #175d70;
}

.attack-effect-setting {
  display: grid;
  gap: 3px;
}

.attack-effect-label {
  color: #ffd878;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.attack-effect-label strong {
  float: right;
  color: #f6fff0;
}

.attack-effect-range-setting input[type='range'] {
  width: 100%;
  accent-color: #ffd15c;
}

.attack-effect-range-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.attack-effect-select {
  width: 100%;
  min-height: 32px;
  border: 1px solid #ffd15c;
  background: #25190d;
  color: #fff2c2;
  font-family: Consolas, monospace;
  font-size: 12px;
  padding: 3px 6px;
}

.attack-type-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
}

.attack-direction-buttons {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
}

.attack-type-buttons button,
.attack-direction-buttons button,
.attack-count-controls button,
.attack-effect-execute {
  min-height: 30px;
  border: 1px solid #ffd15c;
  background: linear-gradient(180deg, #5a3d1d, #25190d);
  color: #fff2c2;
  font-family: Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.attack-type-buttons button:hover,
.attack-type-buttons button.active,
.attack-direction-buttons button:hover,
.attack-direction-buttons button.active,
.attack-count-controls button:hover,
.attack-effect-execute:hover {
  background: linear-gradient(180deg, #805526, #352211);
  box-shadow: 0 0 10px rgba(255, 185, 68, 0.5);
}

.attack-count-setting {
  grid-template-columns: auto auto 1fr;
  align-items: center;
}

.attack-count-setting .attack-effect-label {
  grid-column: 1 / -1;
}

.attack-count-controls {
  display: grid;
  grid-template-columns: 34px 40px 34px;
  align-items: center;
  gap: 4px;
}

.attack-count-controls strong {
  color: #fff6d1;
  font-size: 18px;
  text-align: center;
}

.attack-effect-execute {
  min-height: 34px;
}

.attack-effect-note {
  margin: 0;
  color: #a8c2ca;
  font-size: 10px;
  line-height: 1.45;
}

.ui-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 8px;
}

.ui-controls button {
  background: linear-gradient(#1f4f66, #122c3a);
  border: 1px solid #4cc9f0;
  color: #f7fdff;
  font-size: 22px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.target-select {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid #2fa4c7;
}

.target-select-label {
  font-size: 12px;
  color: #9feaff;
  margin-bottom: 6px;
}

.target-select-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.target-select-buttons button {
  background: linear-gradient(#1f4f66, #122c3a);
  border: 1px solid #4cc9f0;
  color: #f7fdff;
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.target-select-group {
  margin-top: 10px;
}

.target-config-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.target-config-buttons button {
  min-width: 58px;
  padding: 5px 7px;
  border: 1px solid rgba(76, 201, 240, 0.65);
  background: rgba(13, 39, 52, 0.9);
  color: #dffaff;
  font-size: 12px;
  cursor: pointer;
}

.target-config-buttons button.active {
  border-color: #dffaff;
  background: rgba(30, 100, 125, 0.95);
  box-shadow: 0 0 9px rgba(76, 201, 240, 0.55);
}

.target-generation-buttons button {
  min-width: 48px;
}
</style>
