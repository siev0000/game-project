<template>
  <BaseBattleModal @close="$emit('close')">
    <div
      class="battle-root"
      :class="{
        'show-formation-grid': showFormationGrid,
        'show-formation-labels': showFormationLabels
      }"
    >
      <!-- ===== 上：バトルフィールド（左右並び） ===== -->
      <div class="battle-field" :style="{ backgroundImage: `url(${battleFieldBg})` }">
        <UIModal ref="uiModalRef" embedded :show-controls="false" />
        <svg
          class="formation-board-grid"
          :style="{ '--formation-line-width': formationLayout.style.lineWidth }"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <g class="formation-lines enemy-lines">
            <path :d="formationGeometry.enemy.lines" />
          </g>
          <g class="formation-lines ally-lines">
            <path :d="formationGeometry.ally.lines" />
          </g>
        </svg>
        <div v-if="showFormationEditor" class="formation-handle-layer">
          <button
            v-for="handle in formationHandles"
            :key="handle.key"
            type="button"
            class="formation-handle"
            :class="[handle.side, { bottom: handle.key.endsWith('Bottom') }]"
            :style="{ left: `${handle.point.x}%`, top: `${handle.point.y}%` }"
            :aria-label="`${handle.label}を移動`"
            @pointerdown.prevent="startFormationPointDrag(handle.key, $event)"
          ><span>{{ handle.label }}</span></button>
        </div>
        <!-- 左：敵（後列 / 中列 / 前列 × 3行） -->
        <div class="enemy-area" :class="{ 'placement-side-selected': selectedPlacementUnitKey.startsWith('enemy:') }">
          <div class="unit-grid enemy-grid">
            <div
              v-for="slot in enemyFieldSlots"
              :key="slot.key"
              class="unit-slot"
              :class="slot.className"
              :style="formationSlotStyle(slot, 'enemy')"
            >
              <span class="slot-label">敵 {{ slot.columnLabel }}{{ slot.row + 1 }}</span>
              <template v-for="entry in slot.entries" :key="entry.key">
                <div
                  v-if="entry.unit.sFlying"
                  class="unit-shadow"
                  :style="unitShadowStyle(entry.unit, entry.placement, 'enemy')"
                ></div>
                <div
                  class="enemy-card"
                  :class="{ 'placement-draggable': formationEditorMode === 'characters', 'selected-placement-unit': selectedPlacementUnitKey === entry.key }"
                  :style="enemyDistanceStyle(entry.unit, entry.placement)"
                  @pointerdown.prevent="startFormationUnitDrag(entry, $event)"
                >
                <div class="enemy-icon" :class="{ 'has-icon': entry.unit.icon }">
                  <img
                    v-if="entry.unit.icon"
                    :src="getCharIllust(entry.unit.icon)"
                    :alt="entry.unit.name"
                    :style="enemyColorStyle(entry.unit)"
                  />
                </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 右：味方（前列 / 中列 / 後列 × 3行） -->
        <div class="ally-area" :class="{ 'placement-side-selected': selectedPlacementUnitKey.startsWith('ally:') }">
          <div class="unit-grid ally-grid">
            <div
              v-for="slot in allyFieldSlots"
              :key="slot.key"
              class="unit-slot"
              :class="slot.className"
              :style="formationSlotStyle(slot, 'ally')"
            >
              <span class="slot-label">味 {{ slot.columnLabel }}{{ slot.row + 1 }}</span>
              <template v-for="entry in slot.entries" :key="entry.key">
                <div
                  v-if="entry.unit.sFlying"
                  class="unit-shadow"
                  :style="unitShadowStyle(entry.unit, entry.placement, 'ally')"
                ></div>
                <div
                  class="ally-unit-card"
                  :class="{ 'placement-draggable': formationEditorMode === 'characters', 'selected-placement-unit': selectedPlacementUnitKey === entry.key }"
                  :style="allyImageStyle(entry.unit, entry.placement)"
                  @pointerdown.prevent="startFormationUnitDrag(entry, $event)"
                >
                <img
                  v-if="entry.unit.icon"
                  :src="getCharIllust(entry.unit.icon) || getCharIllust('スレイブ (新)')"
                  :alt="entry.unit.name"
                />
                <span v-else class="ally-icon-fallback">{{ entry.unit.name?.slice(0, 1) || 'Ω' }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 下：ステータス（味方） ===== -->
      <div class="status-area">
        <div
          v-for="slot in allySlots"
          :key="slot.index"
          class="ally-card"
          :class="{ empty: !slot.unit }"
        >
          <template v-if="slot.unit">
            <!-- 左：アイコン枠 -->
            <div class="ally-icon" :class="{ 'has-icon': slot.unit.icon }">
              <img
                v-if="slot.unit.icon"
                :src="getCharIllust(slot.unit.icon) || getCharIllust('スレイブ (新)')"
                :alt="slot.unit.name"
              />
            </div>

            <!-- 下：ステータス（HP/MP 横並び） -->
            <div class="ally-info">
              <div class="ally-name">{{ slot.unit.name }}</div>
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

      <!-- ===== 下：コマンド / ログ ===== -->
      <div v-if="showFormationEditor" class="command-area formation-editor-area">
        <BattleFormationEditorModal
          :layout="formationLayout"
          :placements="formationPlacements"
          :units="formationPlacementUnits"
          :selected-unit-key="selectedPlacementUnitKey"
          @preview="applyFormationLayout"
          @saved="applyFormationLayout"
          @placement-preview="applyFormationPlacements"
          @placement-saved="applyFormationPlacements"
          @placement-select="selectedPlacementUnitKey = $event"
          @mode-change="formationEditorMode = $event"
          @close="showFormationEditor = false"
        />
      </div>
      <div v-else class="command-area">
        <div class="command-panel">
          <button :class="{ active: selectedCommand === 'attack' }" @click="selectCommand('attack')">ATTACK</button>
          <button :class="{ active: selectedCommand === 'skill' }" @click="selectCommand('skill')">SKILL</button>
          <button :class="{ active: selectedCommand === 'defend' }" @click="selectCommand('defend')">DEFEND</button>
          <button :class="{ active: selectedCommand === 'wait' }" @click="selectCommand('wait')">WAIT</button>
          <button :class="{ active: selectedCommand === 'ui' }" @click="selectCommand('ui')">UI MODAL</button>
        </div>

        <div v-if="selectedCommand === 'ui'" class="log-panel ui-control-panel">
          <div class="formation-display-toggles">
            <button class="grid-toggle" :class="{ active: showFormationGrid }" @click="showFormationGrid = !showFormationGrid">グリッド線 {{ showFormationGrid ? 'ON' : 'OFF' }}</button>
            <button class="label-toggle" :class="{ active: showFormationLabels }" @click="showFormationLabels = !showFormationLabels">文字 {{ showFormationLabels ? 'ON' : 'OFF' }}</button>
          </div>
          <button class="formation-editor-button" @click="showFormationEditor = true">配置面調整</button>
          <button v-for="btn in uiButtons" :key="btn.key" @click="invokeUiAction(btn)">{{ btn.label }}</button>
          <button v-for="btn in uiGenButtons" :key="`gen-${btn.key}`" @click="invokeUiAction(btn)">{{ btn.label }}</button>
        </div>
        <div v-else class="log-panel">
          <p class="panel-title">{{ selectedCommand.toUpperCase() }}</p>
          <p v-for="(log, i) in logs" :key="i">&gt; {{ log }}</p>
        </div>
      </div>
    </div>
  </BaseBattleModal>
</template>

<script setup>
import { reactive, computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import BaseBattleModal from './BaseBattleModal.vue'
import UIModal from './UIModal.vue'
import BattleFormationEditorModal from './BattleFormationEditorModal.vue'
import { battleAllies, battleEnemiesver2 } from '../data/battleAllies.js'
import { buildBattleAlliesFromCharacter } from '../data/battleCharacterAdapter.js'
import { getBackgroundIllust, getCharIllust } from '@/constants/statData.js'
import savedFormationLayout from '@/data/battle/battleFormationLayout.json'
import savedFormationPlacements from '@/data/battle/battleFormationUnits.json'
import { buildBattleFormationGeometry, formationColumnOrder, normalizeBattleFormationLayout, normalizeBattleFormationUnits } from '@/utils/battleFormationGeometry.js'
const props = defineProps({
  character: { type: Object, default: null }
})
defineEmits(['close'])

// 表示用：戦闘味方データ（表示専用にラップ）
const allies = reactive(
  (buildBattleAlliesFromCharacter(props.character) || battleAllies).map(u => ({
    ...u,
    hpDisplay: 0,
    mpDisplay: 0
  }))
)
const enemyUnits = props.character ? [] : battleEnemiesver2
const ENEMY_ROWS = 3
const ALLY_ROWS = 3
// 1体のみのときに配置する行（0-2）
const SINGLE_UNIT_ROW_INDEX = 1
// 1体のみのときの追加オフセット
const SINGLE_UNIT_OFFSET = { x: 0, y: 0 }

// front/middle/back で3列に分割。旧データの未指定はfrontへ置く。
// 片側の表示スロットを組み立て（列×行）
const buildSideSlots = (units, rows, columnOrder, side, placements) => {
  const slots = []
  const columnLabels = { back: '後', middle: '中', front: '前' }

  columnOrder.forEach((colKey, colIndex) => {
    for (let row = 0; row < rows; row += 1) {
      const entries = units
        .map(unit => ({ key: `${side}:${unit.id}`, side, unit, placement: placements?.[String(unit.id)] }))
        .filter(entry => entry.placement?.column === colKey && entry.placement?.row === row)
      slots.push({
        key: `${colKey}-${row}`,
        column: colKey,
        columnLabel: columnLabels[colKey],
        row,
        colIndex,
        entries,
        className: `col-${colIndex + 1} row-${row + 1} ${colKey}-col`
      })
    }
  })

  return slots
}

// 左：敵（B列 → F列）
const enemyFieldSlots = computed(() =>
  buildSideSlots(enemyUnits, ENEMY_ROWS, formationColumnOrder.enemy, 'enemy', formationPlacements.value.enemy)
)

// 右：味方（F列 → B列）※味方は position が無い場合は全員 front 扱い
const allyFieldSlots = computed(() =>
  buildSideSlots(allies, ALLY_ROWS, formationColumnOrder.ally, 'ally', formationPlacements.value.ally)
)

const formationLayout = ref(normalizeBattleFormationLayout(savedFormationLayout))
const formationGeometry = computed(() => buildBattleFormationGeometry(formationLayout.value))
const formationUnitGroups = computed(() => ({ enemy: enemyUnits, ally: allies }))
const formationPlacements = ref(normalizeBattleFormationUnits(savedFormationPlacements, formationUnitGroups.value))
const formationPlacementUnits = computed(() => [
  ...enemyUnits.map(unit => ({ key: `enemy:${unit.id}`, side: 'enemy', id: unit.id, name: unit.name })),
  ...allies.map(unit => ({ key: `ally:${unit.id}`, side: 'ally', id: unit.id, name: unit.name }))
])
const showFormationEditor = ref(false)
const formationEditorMode = ref('points')
const selectedPlacementUnitKey = ref(formationPlacementUnits.value[0]?.key || '')
const applyFormationLayout = layout => { formationLayout.value = normalizeBattleFormationLayout(layout) }
const applyFormationPlacements = placements => { formationPlacements.value = normalizeBattleFormationUnits(placements, formationUnitGroups.value) }
const formationHandles = computed(() => [
  { key: 'enemyOuterTop', label: '敵・外上', side: 'enemy', point: formationLayout.value.field.enemyOuterTop },
  { key: 'enemyOuterBottom', label: '敵・外下', side: 'enemy', point: formationLayout.value.field.enemyOuterBottom },
  { key: 'centerTop', label: '中央・上', side: 'center', point: formationLayout.value.field.centerTop },
  { key: 'centerBottom', label: '中央・下', side: 'center', point: formationLayout.value.field.centerBottom },
  { key: 'allyOuterTop', label: '味・外上', side: 'ally', point: formationLayout.value.field.allyOuterTop },
  { key: 'allyOuterBottom', label: '味・外下', side: 'ally', point: formationLayout.value.field.allyOuterBottom }
])
let stopFormationDrag = null
const startFormationPointDrag = (key, event) => {
  stopFormationDrag?.()
  const layer = event.currentTarget.closest('.formation-handle-layer')
  const update = moveEvent => {
    const rect = layer.getBoundingClientRect()
    const next = normalizeBattleFormationLayout(formationLayout.value)
    next.field[key] = {
      x: Math.round(Math.min(100, Math.max(0, ((moveEvent.clientX - rect.left) / rect.width) * 100)) * 2) / 2,
      y: Math.round(Math.min(100, Math.max(0, ((moveEvent.clientY - rect.top) / rect.height) * 100)) * 2) / 2
    }
    applyFormationLayout(next)
  }
  const stop = () => {
    window.removeEventListener('pointermove', update)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    stopFormationDrag = null
  }
  stopFormationDrag = stop
  window.addEventListener('pointermove', update)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)
  update(event)
}
const startFormationUnitDrag = (entry, event) => {
  if (formationEditorMode.value !== 'characters') return
  event.preventDefault()
  event.stopPropagation()
  stopFormationDrag?.()
  selectedPlacementUnitKey.value = entry.key
  const grid = event.currentTarget.closest('.unit-grid')
  const rect = grid.getBoundingClientRect()
  const startPointer = { x: event.clientX, y: event.clientY }
  const startPlacement = { ...entry.placement }
  const sideGeometry = formationGeometry.value[entry.side]
  const columnOrder = formationColumnOrder[entry.side]
  const startColumnIndex = Math.max(0, columnOrder.indexOf(startPlacement.column))
  const startAnchor = sideGeometry.anchors[startColumnIndex]?.[startPlacement.row] || { x: 50, y: 50 }
  const startPoint = {
    x: rect.width * startAnchor.x / 100 + startPlacement.offsetX,
    y: rect.height * startAnchor.y / 100 + startPlacement.offsetY
  }
  const update = moveEvent => {
    const candidate = {
      x: startPoint.x + moveEvent.clientX - startPointer.x,
      y: startPoint.y + moveEvent.clientY - startPointer.y
    }
    let nearest = { columnIndex: 0, row: 0, distance: Infinity, anchor: sideGeometry.anchors[0][0] }
    sideGeometry.anchors.forEach((column, columnIndex) => column.forEach((anchor, row) => {
      const anchorX = rect.width * anchor.x / 100
      const anchorY = rect.height * anchor.y / 100
      const distance = Math.hypot(candidate.x - anchorX, candidate.y - anchorY)
      if (distance < nearest.distance) nearest = { columnIndex, row, distance, anchor }
    }))
    const anchorX = rect.width * nearest.anchor.x / 100
    const anchorY = rect.height * nearest.anchor.y / 100
    const next = normalizeBattleFormationUnits(formationPlacements.value, formationUnitGroups.value)
    next[entry.side][String(entry.unit.id)] = {
      column: columnOrder[nearest.columnIndex],
      row: nearest.row,
      offsetX: Math.round(Math.min(300, Math.max(-300, candidate.x - anchorX))),
      offsetY: Math.round(Math.min(200, Math.max(-200, candidate.y - anchorY)))
    }
    applyFormationPlacements(next)
  }
  const stop = () => {
    window.removeEventListener('pointermove', update)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    stopFormationDrag = null
  }
  stopFormationDrag = stop
  window.addEventListener('pointermove', update)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)
}
const loadFormationLayout = async () => {
  try {
    const [layoutResponse, placementResponse] = await Promise.all([
      fetch('/api/local/battle-formation-layout', { cache: 'no-store' }),
      fetch('/api/local/battle-formation-units', { cache: 'no-store' })
    ])
    if (layoutResponse.ok) applyFormationLayout(await layoutResponse.json())
    if (placementResponse.ok) applyFormationPlacements(await placementResponse.json())
  } catch {
    // ビルド配信などローカル編集APIがない場合はimport済みJSONを使用する。
  }
}
const formationSlotStyle = (slot, side) => {
  const anchor = formationGeometry.value[side].anchors[slot.colIndex]?.[slot.row] || { x: 50, y: 100 }
  return {
    '--slot-left': `${anchor.x}%`,
    '--slot-bottom': `${100 - anchor.y}%`,
    '--slot-depth': slot.row + 2
  }
}

const showFormationGrid = ref(true)
const showFormationLabels = ref(true)
const selectedCommand = ref('attack')
const logs = reactive(['FORMATION GRID READY', 'SELECT COMMAND'])
const uiModalRef = ref(null)
const uiButtons = ref([])
const uiGenButtons = ref([])
const parentOnlyUiKeys = new Set(['battle-noise', 'target-noise', 'rune-rain'])
const loadUiButtons = () => {
  const ui = uiModalRef.value
  if (!ui) return
  uiButtons.value = (ui.getControlButtons?.() || []).filter(button => !parentOnlyUiKeys.has(button.key))
  uiGenButtons.value = ui.getGenerationButtons?.() || []
}
const invokeUiAction = button => {
  const ui = uiModalRef.value
  const action = button?.action
  if (!ui || !action || typeof ui[action] !== 'function') return
  if (Array.isArray(button.args) && button.args.length) ui[action](...button.args)
  else ui[action]()
}
const selectCommand = command => {
  selectedCommand.value = command
  if (command === 'attack') {
    const target = enemyUnits.find(unit => unit.hp > 0)
    if (target) logs.unshift(`${target.name} DAMAGE TEST`)
  }
}

// 敵の表示サイズ・位置（スロット補正込み）
const enemyDistanceStyle = (enemy, slot) => {
  if (!enemy) return null
  const sizePx = calcSizePx(enemy.siz, 450)

  const { scale, offsetX, offsetY, baseShift } = getEnemyPositionAdjust(
    enemy,
    sizePx
  )
  const placementOffsetX = Number(slot?.offsetX) || 0
  const placementOffsetY = Number(slot?.offsetY) || 0
  const shift = baseShift + offsetY + placementOffsetY

  return {
    '--enemy-size': `${sizePx}px`,
    '--enemy-shift': `${shift}px`,
    '--enemy-x': `${offsetX + placementOffsetX}px`,
    '--enemy-scale': scale
  }
}

// 敵の個体補正（拡大率/位置）
const getEnemyPositionAdjust = (enemy, sizePx) => {
  const { scale, offsetX, offsetY } = getPositionAdjust(enemy, 'enemy')

  // 左右構図では敵味方の基準高さをそろえるため、基本は 0 にする
  const baseShift = 0

  return {
    scale,
    offsetX,
    offsetY,
    baseShift
  }
}
// 味方の個体補正（拡大率/位置）
const getAllyPositionAdjust = (unit) => getPositionAdjust(unit, 'ally')

// 共通の位置補正（敵/味方の向きだけ変える）
const getPositionAdjust = (unit, side) => {
  const isBack = unit?.position === 'back'

  const baseScale = Number(unit?.scale) || (isBack ? 1.00 : 1.00)
  const flyingScale = unit?.sFlying ? (Number(unit?.flyingScale) || 1.00) : 1
  const scale = baseScale * flyingScale

  const baseline = formationPlacements.value.baseline
  const baseX = baseline.offsetX * (side === 'enemy' ? 1 : -1)
  const baseY = baseline.offsetY

  const x = Number(unit?.offsetX ?? baseX) || 0
  const y = Number(unit?.offsetY ?? baseY) || 0
  const flyingOffsetY = unit?.sFlying ? (Number(unit?.flyingOffsetY) || -140) : 0
  const offsetY = y + flyingOffsetY

  return {
    scale,
    offsetX: x,
    offsetY,
    baseOffsetY: y
  }
}

// 敵の色フィルタ
const enemyColorStyle = (enemy) => {
  if (!enemy?.setColor) return null
  return { filter: enemy.setColor }
}

const battleFieldBg = getBackgroundIllust('機械廊下')
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

// 味方の表示サイズ・位置（スロット補正込み）
const allyImageStyle = (unit, slot) => {
  const sizePx = calcSizePx(unit?.siz, 450)
  const { scale, offsetX, offsetY } = getAllyPositionAdjust(unit)
  const placementOffsetX = Number(slot?.offsetX) || 0
  const placementOffsetY = Number(slot?.offsetY) || 0
  return {
    '--ally-size': `${sizePx}px`,
    '--ally-x': `${offsetX + placementOffsetX}px`,
    '--ally-shift': `${offsetY + placementOffsetY}px`,
    '--ally-scale': scale
  }
}

// 飛行時の影：本来位置に固定
const unitShadowStyle = (unit, slot, side) => {
  const sizePx = calcSizePx(unit?.siz * 0.1, 450)
  const shadowHeight = Math.round(sizePx / 5)
  const placementOffsetX = Number(slot?.offsetX) || 0
  const placementOffsetY = Number(slot?.offsetY) || 0
  const { offsetX, baseOffsetY } = getPositionAdjust(unit, side)
  return {
    '--shadow-w': `${sizePx}px`,
    '--shadow-h': `${shadowHeight}px`,
    '--shadow-x': `${offsetX + placementOffsetX}px`,
    '--shadow-y': `${baseOffsetY + placementOffsetY}px`
  }
}

// SIZ を表示サイズ(px)へ変換（1000超は別スケール）
const calcSizePx = (rawValue, fallback) => {
  const rawSiz = Number(rawValue) || fallback

  // SIZ の想定範囲
  const MIN_SIZ = 90
  const MAX_SIZ = 1000
  const SIZ_RANGE = MAX_SIZ - MIN_SIZ // 910

  // 表示サイズ(px)の範囲
  const MIN_PX = 180
  const MAX_PX = 300
  const PX_RANGE = MAX_PX - MIN_PX // 700

  if (rawSiz <= MAX_SIZ) {
    // clamp
    const siz = Math.min(MAX_SIZ, Math.max(MIN_SIZ, rawSiz))
    const ratio = (siz - MIN_SIZ) / SIZ_RANGE
    return Math.round(MIN_PX + PX_RANGE * ratio)
  }

  // 1000 -> 320, 2000 -> 500 (linear)
  const EXTRA_MIN_SIZ = 1000
  const EXTRA_MAX_SIZ = 2000
  const EXTRA_MIN_PX = 300
  const EXTRA_MAX_PX = 460
  const extraSiz = Math.min(EXTRA_MAX_SIZ, Math.max(EXTRA_MIN_SIZ, rawSiz))
  const extraRatio = (extraSiz - EXTRA_MIN_SIZ) / (EXTRA_MAX_SIZ - EXTRA_MIN_SIZ)
  return Math.round(EXTRA_MIN_PX + (EXTRA_MAX_PX - EXTRA_MIN_PX) * extraRatio)
}

// 起動時に HP / MP を 0 → 現在値までアニメーション
onMounted(() => {
  nextTick(loadUiButtons)
  loadFormationLayout()
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
const renderBattleVer2State = () => JSON.stringify({
  screen: 'battle-ver2',
  formation: { enemy: { columns: 3, rows: 3, slots: enemyFieldSlots.value.length }, ally: { columns: 3, rows: 3, slots: allyFieldSlots.value.length } },
  boardHeightRatio: 0.6,
  gridLines: showFormationGrid.value,
  gridLabels: showFormationLabels.value,
  formationEditorOpen: showFormationEditor.value,
  formationEditorMode: formationEditorMode.value,
  formationLayout: formationLayout.value,
  formationPlacements: formationPlacements.value,
  selectedCommand: selectedCommand.value,
  uiButtonLabels: uiButtons.value.map(button => button.label),
  uiGenerationLabels: uiGenButtons.value.map(button => button.label)
})
const advanceBattleVer2Time = () => {}
if (typeof window !== 'undefined') {
  window.render_game_to_text = renderBattleVer2State
  window.advanceTime = advanceBattleVer2Time
}
onBeforeUnmount(() => {
  stopFormationDrag?.()
  if (window.render_game_to_text === renderBattleVer2State) delete window.render_game_to_text
  if (window.advanceTime === advanceBattleVer2Time) delete window.advanceTime
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

/* ===== 上：フィールド（左右並び） ===== */
.battle-field {
  height: 550px;
  border: 1px solid #2fa4c7;
  display: flex;
  gap: 0;
  padding: 14px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
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

.battle-field :deep(.ui-modal) {
  z-index: 20;
}

.formation-board-grid {
  position: absolute!important;
  right: 14px;
  bottom: 14px;
  left: 14px;
  z-index: 1!important;
  top: 14px;
  opacity: 0;
  pointer-events: none;
}

.show-formation-grid .formation-board-grid { opacity: 1; }

.formation-handle-layer {
  position: absolute!important;
  inset: 14px;
  z-index: 6!important;
  pointer-events: none;
}
.formation-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  min-width: 16px;
  padding: 0;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  cursor: move;
  touch-action: none;
  box-shadow: 0 0 8px currentColor;
}
.formation-handle.enemy { color: #ff745b; background: #ff745b; }
.formation-handle.ally { color: #4dbeff; background: #4dbeff; }
.formation-handle.center { color: #ffe27a; background: #ffe27a; }
.formation-handle span {
  position: absolute;
  top: 18px;
  left: 50%;
  padding: 2px 4px;
  color: #e8fbff;
  background: rgba(2, 12, 17, 0.88);
  border: 1px solid currentColor;
  font: 13px Consolas, monospace;
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
}
.formation-handle.bottom span { top: auto; bottom: 18px; }

.formation-lines {
  fill: none;
  stroke-width: var(--formation-line-width, 0.75);
  vector-effect: non-scaling-stroke;
}
.enemy-lines { stroke: rgba(255, 116, 91, 0.86); }
.ally-lines { stroke: rgba(77, 190, 255, 0.9); }

.placement-draggable {
  cursor: move;
  pointer-events: auto;
  touch-action: none;
}
.placement-draggable::after {
  position: absolute;
  bottom: -7px;
  left: 50%;
  width: 11px;
  height: 11px;
  box-sizing: border-box;
  background: #173640;
  border: 2px solid #7ee8ff;
  border-radius: 50%;
  box-shadow: 0 0 5px #32cdec;
  content: '';
  transform: translateX(-50%);
}
.selected-placement-unit::after {
  background: #ffe27a;
  border-color: #fff6ba;
  box-shadow: 0 0 9px #ffe27a;
}

.ally-area {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 2;
  left: 14px;
  width: auto;
  height: auto;
  top: 14px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  overflow: visible;
  pointer-events: none;
}

.enemy-area {
  position: absolute;
  bottom: 14px;
  left: 14px;
  z-index: 2;
  right: 14px;
  width: auto;
  height: auto;
  top: 14px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  overflow: visible;
  pointer-events: none;
}
.enemy-area.placement-side-selected,
.ally-area.placement-side-selected { z-index: 5; }

.unit-grid {
  width: 100%;
  height: 100%;
  display: block;
  position: relative;
  isolation: isolate;
}

.unit-slot {
  position: absolute;
  left: var(--slot-left);
  bottom: var(--slot-bottom);
  z-index: var(--slot-depth, 2);
  width: 16.6667%;
  height: 0;
  transform: translateX(-50%);
}

.slot-label {
  display: none;
  position: absolute;
  bottom: 8px;
  left: 50%;
  z-index: 4;
  color: rgba(191, 246, 255, 0.82);
  font-size: 11px;
  line-height: 1;
  pointer-events: none;
  transform: translateX(-50%);
  white-space: nowrap;
}

.show-formation-labels .slot-label { display: block; }

.enemy-card {
  width: var(--enemy-size, 225px);
  height: var(--enemy-size, 225px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: absolute;
  left: 50%;
  bottom: 0;
  transform-origin: center bottom;
  transform: translate(calc(-50% + var(--enemy-x, 0px)), var(--enemy-shift, 0px))
    scale(var(--enemy-scale, 1));
}

.enemy-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  transform-origin: center center;
  transform: none;
}

.enemy-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  transform: scaleX(-1);
}

.unit-shadow {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: var(--shadow-w, 200px);
  height: var(--shadow-h, 40px);
  transform: translate(calc(-50% + var(--shadow-x, 0px)), var(--shadow-y, 0px));
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  filter: blur(2px);
  z-index: 1;
}

.ally-unit-card {
  width: var(--ally-size, 260px);
  height: var(--ally-size, 260px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: absolute;
  left: 50%;
  bottom: 0;
  transform-origin: center bottom;
  transform: translate(calc(-50% + var(--ally-x, 0px)), var(--ally-shift, 0px))
    scale(var(--ally-scale, 1));
}

.ally-unit-card img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
}

.unit-slot.back-col .enemy-card,
.unit-slot.back-col .ally-unit-card {
  opacity: 0.9;
}

/* ===== 下：ステータス ===== */
.status-area {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 6px;
}

/* ===== 中央：味方 ===== */
.ally-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: linear-gradient(180deg, rgba(10,25,35,0.95), rgba(5,15,25,0.95));
  border: 1px solid #3aaed8;
  padding: 8px;
  font-size: 18px;
  height: 120px;
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
  height: 70px;
  border: 1px solid #4cc9f0;
  background: radial-gradient(circle at center, #0b1a22, #050c10);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: monitorBoot 0.6s ease-out forwards;
  overflow: hidden;
}

.ally-icon img {
  height: 100%;
  width: 100%;
  display: block;
  object-fit: contain;
  object-position: center center;
}
.ally-icon-fallback {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: #85f5ff;
  font-size: 30px;
  font-weight: 700;
  text-shadow: 0 0 10px #1bd4ef;
}
.ally-name {
  grid-column: 1 / -1;
  overflow: hidden;
  color: #d9fbff;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ally-card:nth-child(1) .ally-icon { animation-delay: 0.05s; }
.ally-card:nth-child(2) .ally-icon { animation-delay: 0.1s; }
.ally-card:nth-child(3) .ally-icon { animation-delay: 0.15s; }
.ally-card:nth-child(4) .ally-icon { animation-delay: 0.2s; }

.ally-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  align-items: center;
}

/* ===== メーター ===== */
.meter {
  display: grid;
  grid-template-columns: 26px 1fr;
  gap: 2px;
  align-items: center;
}

.bar {
  width: 100%;
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
  font-size: 12px;
  color: #f7fdff;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.9),
    0 0 6px rgba(0, 200, 255, 0.45),
    0 0 12px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

/* ===== 状態 ===== */
.status {
  grid-column: 1 / -1;
  text-align: right;
}

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
.formation-editor-area { display: block; min-height: 0; }

.command-panel {
  width: 40%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.command-panel button {
  background: linear-gradient(#1f4f66, #122c3a);
  border: 1px solid #4cc9f0;
  color: #e6fcff;
  font-size: 15px;
}

.command-panel button.active {
  border-color: #fff09d;
  background: linear-gradient(#356c7d, #173d4d);
  color: #fff7b8;
}

.log-panel {
  flex: 1;
  border: 1px solid #2fa4c7;
  padding: 6px;
  font-size: 15px;
  overflow-y: auto;
}

.panel-title { margin: 0 0 8px; color: #6feaff; font-weight: 700; }
.ui-control-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-content: start;
  gap: 6px;
}
.ui-control-panel button {
  min-height: 38px;
  padding: 5px 7px;
  border: 1px solid #4cc9f0;
  background: linear-gradient(#1f4f66, #122c3a);
  color: #e6fcff;
  font: 15px Consolas, monospace;
  cursor: pointer;
}
.formation-display-toggles {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.formation-editor-button { grid-column: 1 / -1; }
.ui-control-panel button.active {
  border-color: #96ffbd;
  background: linear-gradient(#206345, #123c2c);
  color: #d9ffe8;
}
</style>
