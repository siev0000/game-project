<template>
  <BaseBattleModal @close="$emit('close')">
    <div class="battle-root">

      <!-- ===== 上：バトルフィールド（40%） ===== -->
      <div
        ref="battleFieldRef"
        class="battle-field"
        :style="{ backgroundImage: `url(${battleFieldBg})` }"
      >
        <UIModal v-if="showUIModal" ref="uiModalRef" embedded :showControls="false" />
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
          :allyTargetGeneration="allyTargetGeneration"
          @close="showOptionsModal = false"
          @update-se-volume="onSeVolumeChange"
          @update-ally-target-generation="onAllyTargetGenerationChange"
        />
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
          <template v-if="selectedCommand === 'ui'">
            <div v-if="targetSelectMode" class="target-select">
              <div class="target-select-label">TARGET SLOT</div>
              <div class="target-select-buttons">
                <button @click="selectTargetBySlot(0)">1</button>
                <button @click="selectTargetBySlot(1)">2</button>
                <button @click="selectTargetBySlot(2)">3</button>
                <button @click="selectTargetBySlot(3)">4</button>
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
import { reactive, computed, onMounted, ref, nextTick, watch } from 'vue'
import BaseBattleModal from './BaseBattleModal.vue'
import UIModal from './UIModal.vue'
import OptionsModal from './OptionsModal.vue'
import DialogueMessageModal from './DialogueMessageModal.vue'
import { battleAllies, battleEnemies } from '../data/battleAllies.js'
import { getBackgroundIllust, getCharIllust, getSEMasterVolume, setSEMasterVolume } from '@/constants/statData.js'
defineEmits(['close'])
const DIALOGUE_SETTINGS_STORAGE_KEY = 'battle-dialogue-settings-v1'
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
const allyIconRefs = ref([])
const showOptionsModal = ref(false)

// ===== メッセージモーダル設定（DialogueMessageModal へ送信） =====
// 表示状態（true でメッセージモーダルを表示）
const showDialogueModal = ref(false)
const dialogueTestMode = ref(false)
const seVolume = ref(Math.round(getSEMasterVolume() * 100))
const allyTargetGeneration = ref(1)
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
  const ui = uiModalRef.value
  const action = btn?.action
  if (!ui || !action || typeof ui[action] !== 'function') return
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

// 起動時に HP / MP を 0 → 現在値までアニメーション
onMounted(() => {
  loadDialoguePlaybackSettings()
  nextTick(() => {
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
</style>
