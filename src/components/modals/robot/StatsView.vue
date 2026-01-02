<template>
  <BaseHudModal @close="$emit('close')">
    <div class="hud-root">

      <!-- HEADER -->
      <div class="hud-panel header">UNIT STATUS</div>

      <!-- CORE -->
      <div class="hud-panel core-panel">
        <h3>CORE</h3>
        <p>Lv : {{ stats.lv }}</p>
        <p>CLASS : {{ stats.class }}</p>
        <p>SIZ : {{ stats.siz }}</p>
      </div>

      <!-- VITAL -->
      <div class="hud-panel">
        <h3>VITAL</h3>

        <!-- HP -->
        <div class="meter">
          <span>HP</span>
          <div class="bar">
            <div class="fill hp" :style="{ width: hpRate + '%' }"></div>
            <div
              v-if="hpPrevRate > hpRate"
              class="damage hp-damage"
              :style="{
                left: hpRate + '%',
                width: (hpPrevRate - hpRate) + '%'
              }"
            ></div>
          </div>
          <span>{{ stats.hp }}/{{ stats.hpMax }}</span>
        </div>

        <!-- ENERGY -->
        <div class="meter">
          <span>EN</span>
          <div class="bar">
            <div class="fill en" :style="{ width: enRate + '%' }"></div>
            <div
              v-if="enPrevRate > enRate"
              class="damage en-damage"
              :style="{
                left: enRate + '%',
                width: (enPrevRate - enRate) + '%'
              }"
            ></div>
          </div>
          <span>{{ stats.energy }}/{{ stats.energyMax }}</span>
        </div>

        <!-- MP -->
        <div class="meter">
          <span>MP</span>
          <div class="bar">
            <div class="fill mp" :style="{ width: mpRate + '%' }"></div>
            <div
              v-if="mpPrevRate > mpRate"
              class="damage mp-damage"
              :style="{
                left: mpRate + '%',
                width: (mpPrevRate - mpRate) + '%'
              }"
            ></div>
          </div>
          <span>{{ stats.mp }}/{{ stats.mpMax }}</span>
        </div>
      </div>

      <!-- COMBAT -->
      <div class="hud-panel">
        <h3>COMBAT</h3>
        <div class="combat-grid">
          <div>PWR {{ stats.power }}</div>
          <div>ACC {{ stats.accuracy }}</div>
          <div>AGI {{ stats.agility }}</div>
          <div>DEF {{ stats.defense }}</div>
          <div>ARM {{ stats.armor }}</div>
        </div>
      </div>

      <button class="close-btn" @click="$emit('close')">CLOSE</button>
    </div>
  </BaseHudModal>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import BaseHudModal from './BaseHudModal.vue'

const stats = reactive({
  lv: 12,
  class: 'MECHANIC',
  siz: 'M',

  hp: 120,
  hpMax: 160,

  energy: 80,
  energyMax: 100,

  mp: 40,
  mpMax: 60,

  power: 45,
  accuracy: 40,
  agility: 31,
  defense: 38,
  armor: 25
})

const prev = reactive({
  hp: stats.hp,
  energy: stats.energy,
  mp: stats.mp
})

watch(() => stats.hp, (n, o) => (prev.hp = o))
watch(() => stats.energy, (n, o) => (prev.energy = o))
watch(() => stats.mp, (n, o) => (prev.mp = o))

const hpRate = computed(() => (stats.hp / stats.hpMax) * 100)
const hpPrevRate = computed(() => (prev.hp / stats.hpMax) * 100)

const enRate = computed(() => (stats.energy / stats.energyMax) * 100)
const enPrevRate = computed(() => (prev.energy / stats.energyMax) * 100)

const mpRate = computed(() => (stats.mp / stats.mpMax) * 100)
const mpPrevRate = computed(() => (prev.mp / stats.mpMax) * 100)
</script>

<style scoped>
.hud-root {
  padding: 12px;
  color: #bff6ff;
  font-family: Consolas, monospace;
}

.hud-panel {
  border: 1px solid #3aaed8;
  padding: 8px;
  margin-bottom: 10px;
}

.header {
  text-align: center;
  letter-spacing: 2px;
}

.core-panel p {
  margin: 2px 0;
  line-height: 1.2;
}

.meter {
  display: grid;
  grid-template-columns: 30px 1fr 115px;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
}

.bar {
  position: relative;
  height: 12px;
  background: #111;
  border: 1px solid #3aaed8;
  overflow: hidden;
}

.fill {
  height: 100%;
  transition: width 0.25s linear;
}

.damage {
  position: absolute;
  top: 0;
  height: 100%;
}

.hp { background: #4cf2ff }
.en { background: #5cff8a }
.mp { background: #4c8dff }

.hp-damage {
  background: repeating-linear-gradient(120deg, #fff 0 2px, #4cf2ff 2px 6px);
  animation: spark 0.3s linear infinite;
}

.en-damage {
  background: repeating-linear-gradient(120deg, #fff 0 2px, #5cff8a 2px 6px);
  animation: spark 0.3s linear infinite;
}

.mp-damage {
  background: repeating-linear-gradient(120deg, #fff 0 2px, #4c8dff 2px 6px);
  animation: spark 0.3s linear infinite;
}

@keyframes spark {
  from { background-position-x: 0; }
  to { background-position-x: 20px; }
}

.combat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.close-btn {
  width: 100%;
  padding: 8px;
  background: #1f4f66;
  border: 1px solid #4cc9f0;
  color: #e6fcff;
}
</style>