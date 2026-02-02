<template>
  <BaseBattleModal @close="$emit('close')">
    <div class="battle-root">

      <!-- ===== 上：バトルフィールド（40%） ===== -->
      <div class="battle-field" :style="{ backgroundImage: `url(${battleFieldBg})` }">
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
            <div class="ally-icon" :class="{ 'has-icon': slot.unit.icon }">
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
import { battleAllies, battleEnemies } from '../data/battleAllies.js'
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

  const { scale, offsetX, offsetY, baseShift } = getEnemyPositionAdjust(
    enemy,
    sizePx,
    slotIndex
  )
  const shift = baseShift + offsetY

  console.log(
    'enemyDistanceStyle',
    enemy.name,
    rawSiz,
    '→',
    siz,
    `ratio=${ratio.toFixed(3)}`,
    '=>',
    sizePx,
    shift
  )

  return {
    '--enemy-size': `${sizePx}px`,
    '--enemy-shift': `${shift}px`,
    '--enemy-x': `${offsetX}px`,
    '--enemy-scale': scale
  }
}

const getEnemyPositionAdjust = (enemy, sizePx) => {
  const isBack = enemy.position === 'back'

  const baseScale = Number(enemy.scale) || (isBack ? 0.95 : 1.05)
  const flyingScale = enemy.sFlying ? (Number(enemy.flyingScale) || 0.85) : 1
  const scale = baseScale * flyingScale

  const baseX = isBack ? 35 : -23
  const baseY = isBack ? -180 : 0

  const x = Number(enemy.offsetX ?? baseX) || 0
  const y = Number(enemy.offsetY ?? baseY) || 0
  const flyingOffsetY = enemy.sFlying ? (Number(enemy.flyingOffsetY) || -120) : 0
  const offsetY = y + flyingOffsetY

  const baseShift = isBack ? Math.round(sizePx + 50) : 0

  return {
    scale,
    offsetX: x,
    offsetY,
    baseShift
  }
}
const enemyColorStyle = (enemy) => {
  if (!enemy?.setColor) return null
  return { filter: enemy.setColor }
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
  border: 1px solid #2fa4c7;
  display: flex;
  flex-direction: column;
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

.enemy-area {
  height: 66.6667%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 8px 16px;
}

.enemy-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px 24px;
  align-items: stretch;
  justify-items: stretch;
}

.enemy-slot {
  position: relative;
  width: 100%;
  height: 100%;
}

.enemy-slot.is-center {
  grid-column: 1 / -1;
  justify-self: center;
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
