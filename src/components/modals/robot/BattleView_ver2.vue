<template>
  <BaseBattleModal @close="$emit('close')">
    <div class="battle-root">
      <!-- ===== 上：バトルフィールド（左右並び） ===== -->
      <div class="battle-field" :style="{ backgroundImage: `url(${battleFieldBg})` }">
        <!-- 左：敵（B1-3 / F1-3） -->
        <div class="enemy-area">
          <div class="unit-grid enemy-grid">
            <div
              v-for="slot in enemyFieldSlots"
              :key="slot.key"
              class="unit-slot"
              :class="slot.className"
            >
              <div
                v-if="slot.unit"
                class="enemy-card"
                :style="enemyDistanceStyle(slot.unit, slot)"
              >
                <div
                  v-if="slot.unit.sFlying"
                  class="unit-shadow"
                  :style="unitShadowStyle(slot.unit, slot, 'enemy')"
                ></div>
                <div class="enemy-icon" :class="{ 'has-icon': slot.unit.icon }">
                  <img
                    v-if="slot.unit.icon"
                    :src="getCharIllust(slot.unit.icon)"
                    :alt="slot.unit.name"
                    :style="enemyColorStyle(slot.unit)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右：味方（F5-7 / B5-7） -->
        <div class="ally-area">
          <div class="unit-grid ally-grid">
            <div
              v-for="slot in allyFieldSlots"
              :key="slot.key"
              class="unit-slot"
              :class="slot.className"
            >
              <div
                v-if="slot.unit"
                class="ally-unit-card"
                :style="allyImageStyle(slot.unit, slot)"
              >
                <div
                  v-if="slot.unit.sFlying"
                  class="unit-shadow"
                  :style="unitShadowStyle(slot.unit, slot, 'ally')"
                ></div>
                <img
                  v-if="slot.unit.icon"
                  :src="getCharIllust(slot.unit.icon) || getCharIllust('スレイブ (新)')"
                  :alt="slot.unit.name"
                />
              </div>
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
      <div class="command-area">
        <div class="command-panel">
          <button @click="testDamage">ATTACK</button>
          <button disabled>SKILL</button>
          <button disabled>DEFEND</button>
          <button disabled>WAIT</button>
        </div>

        <div class="log-panel">
          <p v-for="(log, i) in logs" :key="i">&gt; {{ log }}</p>
        </div>
      </div>
    </div>
  </BaseBattleModal>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import BaseBattleModal from './BaseBattleModal.vue'
import { battleAllies, battleEnemiesver2 } from '../data/battleAllies.js'
import { getBackgroundIllust, getCharIllust } from '@/constants/statData.js'
defineEmits(['close'])

// 表示用：戦闘味方データ（表示専用にラップ）
const allies = reactive(
  battleAllies.map(u => ({
    ...u,
    hpDisplay: 0,
    mpDisplay: 0
  }))
)
const enemyUnits = battleEnemiesver2
const ENEMY_ROWS = 3
const ALLY_ROWS = 3
const SINGLE_UNIT_ROW_INDEX = 1
const SINGLE_UNIT_OFFSET = { x: 0, y: 90 }

const splitUnits = (units, backValue = 'back') => ({
  back: units.filter(unit => unit.position === backValue),
  front: units.filter(unit => unit.position !== backValue)
})

const buildSideSlots = (units, rows, columnOrder) => {
  const slots = []
  const { back, front } = splitUnits(units)
  const columns = { back, front }
  const isSingleBack = back.length === 1
  const isSingleFront = front.length === 1

  columnOrder.forEach((colKey, colIndex) => {
    for (let row = 0; row < rows; row += 1) {
      const unit = columns[colKey][row] || null
      const isSingleCol = (colKey === 'back' && isSingleBack) || (colKey === 'front' && isSingleFront)
      const isCenter = unit && isSingleCol && row === SINGLE_UNIT_ROW_INDEX
      const slotOffsetX = isSingleCol ? SINGLE_UNIT_OFFSET.x : 0
      const slotOffsetY = isSingleCol ? SINGLE_UNIT_OFFSET.y : 0
      slots.push({
        key: `${colKey}-${row}`,
        unit,
        className: `col-${colIndex + 1} row-${row + 1} ${colKey}-col${isCenter ? ' is-center' : ''}`,
        slotOffsetX,
        slotOffsetY
      })
    }
  })

  return slots
}

// 左：敵（B列 → F列）
const enemyFieldSlots = computed(() =>
  buildSideSlots(enemyUnits, ENEMY_ROWS, ['back', 'front'])
)

// 右：味方（F列 → B列）※味方は position が無い場合は全員 front 扱い
const allyFieldSlots = computed(() =>
  buildSideSlots(allies, ALLY_ROWS, ['front', 'back'])
)

const enemyDistanceStyle = (enemy, slot) => {
  if (!enemy) return null
  const sizePx = calcSizePx(enemy.siz, 450)

  const { scale, offsetX, offsetY, baseShift } = getEnemyPositionAdjust(
    enemy,
    sizePx
  )
  const slotOffsetX = Number(slot?.slotOffsetX) || 0
  const slotOffsetY = Number(slot?.slotOffsetY) || 0
  const shift = baseShift + offsetY + slotOffsetY

  return {
    '--enemy-size': `${sizePx}px`,
    '--enemy-shift': `${shift}px`,
    '--enemy-x': `${offsetX + slotOffsetX}px`,
    '--enemy-scale': scale
  }
}

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
const getAllyPositionAdjust = (unit) => getPositionAdjust(unit, 'ally')

const getPositionAdjust = (unit, side) => {
  const sign = side === 'enemy' ? -1 : 1
  const baseXBack = 20 * sign
  const baseXFront = 15 * sign
  const baseYBack = 150
  const baseYFront = 170
  const isBack = unit?.position === 'back'

  const baseScale = Number(unit?.scale) || (isBack ? 1.00 : 1.00)
  const flyingScale = unit?.sFlying ? (Number(unit?.flyingScale) || 1.00) : 1
  const scale = baseScale * flyingScale

  const baseX = isBack ? baseXBack : baseXFront
  const baseY = isBack ? baseYBack : baseYFront

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

const allyImageStyle = (unit, slot) => {
  const sizePx = calcSizePx(unit?.siz, 450)
  const { scale, offsetX, offsetY } = getAllyPositionAdjust(unit)
  const slotOffsetX = Number(slot?.slotOffsetX) || 0
  const slotOffsetY = Number(slot?.slotOffsetY) || 0
  return {
    '--ally-size': `${sizePx}px`,
    '--ally-x': `${offsetX + slotOffsetX}px`,
    '--ally-shift': `${offsetY + slotOffsetY}px`,
    '--ally-scale': scale
  }
}

const unitShadowStyle = (unit, slot, side) => {
  const sizePx = calcSizePx(unit?.siz * 0.1, 450)
  const shadowHeight = Math.round(sizePx / 5)
  const slotOffsetX = Number(slot?.slotOffsetX) || 0
  const slotOffsetY = Number(slot?.slotOffsetY) || 0
  const { offsetX, baseOffsetY } = getPositionAdjust(unit, side)
  return {
    '--shadow-w': `${sizePx}px`,
    '--shadow-h': `${shadowHeight}px`,
    '--shadow-x': `${offsetX + slotOffsetX}px`,
    '--shadow-y': `${baseOffsetY + slotOffsetY}px`
  }
}

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

/* ===== 上：フィールド（左右並び） ===== */
.battle-field {
  height: 550px;
  border: 1px solid #2fa4c7;
  display: flex;
  gap: 10px;
  padding: 10px;
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

.ally-area {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 8px 16px;
}

.enemy-area {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 8px 16px;
}

.unit-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 8px 24px;
  align-items: stretch;
  justify-items: stretch;
}

.unit-slot {
  position: relative;
  width: 100%;
  height: 100%;
}

.unit-slot.col-1 { grid-column: 1; }
.unit-slot.col-2 { grid-column: 2; }
.unit-slot.row-1 { grid-row: 1; }
.unit-slot.row-2 { grid-row: 2; }
.unit-slot.row-3 { grid-row: 3; }

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
  font-size: 12px;
}

.log-panel {
  flex: 1;
  border: 1px solid #2fa4c7;
  padding: 6px;
  font-size: 11px;
  overflow-y: auto;
}
</style>
