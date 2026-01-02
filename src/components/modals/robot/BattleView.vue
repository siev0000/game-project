<template>
  <BaseBattleModal @close="$emit('close')">
    <div class="battle-root">

      <!-- ===== 上：バトルフィールド（40%） ===== -->
      <div class="battle-field" :style="{ backgroundImage: `url(${battleFieldBg})` }">
        <div class="enemy-area">
          <div class="field-placeholder"></div>
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
                :src="getCharIllust(slot.unit.icon)"
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
import { battleAllies } from '../data/battleAllies.js'
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
  height: 60%;
  border: 1px solid #2fa4c7;
  display: flex;
  flex-direction: column;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.enemy-area {
  height: 66.6667%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.field-placeholder {
  opacity: 0.4;
  letter-spacing: 3px;
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
  border: 1px solid #173542;
  position: relative;
  overflow: hidden;
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
  color: #e6fcff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
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
