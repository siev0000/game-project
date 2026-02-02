<template>
  <div class="ui-modal">
    <div class="hud-root" :class="`gen-${generation}`">
      <div
        class="hud-panel"
        :class="[
          `gen-${generation}`,
          {
            'eye-opening': eyeOpen,
            'eye-closing': eyeClosing,
            'damage-flash': damageFlash,
            analyzing: isAnalyze,
            'static-2': staticMode2,
            'static-3': staticFlash && staticLevel === 3,
            'static-4': staticMode4,
            nightvision: isNightVision,
            shake: shakeView,
            'static-flash': staticFlash
          }
        ]"
      >
        <div v-if="showTarget" class="target-layer">
          <TargetMarker class="target-marker-instance" :generation="generation" />
        </div>
        <!-- <div v-if="showTargetVer2" class="target-layer">
          <TargetMarkerVer2
            v-if="generation <= 3"
            class="target-marker-instance"
            :generation="generation"
          />
        </div> -->
        <div class="hud-blackout" :class="{ active: eyeClosed || eyeOpen || eyeClosing }"></div>
        <div class="hud-glow"></div>
        <div class="hud-corners"></div>
        <div class="hud-notch"></div>
        <div class="hud-scanlines"></div>
        <div class="hud-scanline-x" @animationend="onScanlineEnd"></div>
        <div class="hud-noise"></div>
        <div class="hud-open-light"></div>
        <div class="hud-static"></div>
        <div class="hud-lids"></div>
        <div class="hud-readout">ROBOT VISION</div>
        <div class="hud-gauge"></div>
      </div>

      <div class="hud-controls">
        <button @click="handleClose">閉じる</button>
        <button @click="triggerEyeOpen">眼を開く</button>
        <button @click="triggerEyeClose">眼を閉じる</button>
        <button @click="triggerAnalyze">解析</button>
        <button @click="triggerDamage">ダメージ</button>
        <button @click="triggerShake">揺れ</button>
        <button @click="triggerStatic(1)">砂嵐</button>
        <button @click="toggleStatic2">砂嵐2</button>
        <button @click="triggerStatic(3)">砂嵐3</button>
        <button @click="toggleStatic4">砂嵐4</button>
        <button @click="triggerAnomaly">異常</button>
        <button @click="triggerReboot">再起動</button>
        <button @click="toggleTarget">ターゲット</button>
        <button @click="toggleHeat">熱源</button>
        <button @click="toggleNightVision">暗視</button>
        <!-- <button @click="toggleTargetVer2">ターゲットVer2</button> -->
      </div>
      <div class="hud-controls hud-controls-secondary">
        <button @click="setGeneration(1)">第一世代</button>
        <button @click="setGeneration(2)">第二世代</button>
        <button @click="setGeneration(3)">第三世代</button>
        <button @click="setGeneration(4)">第四世代</button>
        <button @click="setGeneration(5)">第五世代</button>
        <button @click="setGeneration(6)">第六世代</button>
        <button @click="setGeneration(9)">SP世代</button>
      </div>
    </div>
  </div>
</template>
<!-- 追加してみる。なんだかラグがすごい気がするけど大丈夫だろうか -->
<script setup>
import { ref, computed } from 'vue'
import { playSE, stopSE } from '@/constants/statData.js'
import TargetMarker from './TargetMarker.vue'
// import TargetMarkerVer2 from './TargetMarkerVer2.vue'

const emit = defineEmits(['close'])

const eyeOpen = ref(false)
const eyeClosing = ref(false)
const damageFlash = ref(false)
const shakeView = ref(false)
const staticFlash = ref(false)
const staticLevel = ref(1)
const staticMode2 = ref(false)
const staticMode4 = ref(false)
const eyeClosed = ref(false)
const generation = ref(1)
const showTarget = ref(false)
const isAnalyze = ref(false)
const isHeat = ref(false)
const isNightVision = ref(false)
// const showTargetVer2 = ref(false)
const controlButtons = computed(() => [
  { key: "close", label: "閉じる", action: "handleClose" },

  { key: "eyeOpen", label: "眼を開く", action: "triggerEyeOpen" },
  { key: "eyeClose", label: "眼を閉じる", action: "triggerEyeClose" },

  { key: "analyze", label: "解析", action: "triggerAnalyze" },
  { key: "damage", label: "ダメージ", action: "triggerDamage" },
  { key: "shake", label: "揺れ", action: "triggerShake" },

  { key: "static1", label: "砂嵐", action: "triggerStatic", args: [1] },
  { key: "static2", label: "砂嵐2", action: "toggleStatic2" },
  { key: "static3", label: "砂嵐3", action: "triggerStatic", args: [3] },
  { key: "static4", label: "砂嵐4", action: "toggleStatic4" },

  { key: "anomaly", label: "異常", action: "triggerAnomaly" },
  { key: "reboot", label: "再起動", action: "triggerReboot" },

  { key: "target", label: "ターゲット", action: "toggleTarget" },
  { key: "heat", label: "熱源", action: "toggleHeat" },
  { key: "night", label: "暗視", action: "toggleNightVision" },
]);

const generationButtons = computed(() => [
  { key: 1, label: "第一世代", action: "setGeneration", args: [1] },
  { key: 2, label: "第二世代", action: "setGeneration", args: [2] },
  { key: 3, label: "第三世代", action: "setGeneration", args: [3] },
  { key: 4, label: "第四世代", action: "setGeneration", args: [4] },
  { key: 5, label: "第五世代", action: "setGeneration", args: [5] },
  { key: 6, label: "第六世代", action: "setGeneration", args: [6] },
  { key: 9, label: "SP世代", action: "setGeneration", args: [9] },
]);

const setGeneration = value => {
  generation.value = value
  playSE('カーソル移動5')
}

const handleClose = () => {
  playSE('電話が切れる2')
  emit('close')
}

const toggleTarget = () => {
  showTarget.value = !showTarget.value
  playSE('カーソル移動2')
}
// const toggleTargetVer2 = () => {
//   showTargetVer2.value = !showTargetVer2.value
// }
const triggerEyeOpen = () => {
  playSE('パソコンの電源を入れる')
  eyeClosed.value = true
  eyeOpen.value = false
  requestAnimationFrame(() => {
    eyeOpen.value = true
    setTimeout(() => {
      eyeOpen.value = false
      eyeClosed.value = false
    }, 700)
  })
}

const triggerEyeClose = () => {
  playSE('パソコンの電源を切る')
  eyeClosing.value = false
  eyeClosed.value = false
  requestAnimationFrame(() => {
    eyeClosing.value = true
    setTimeout(() => {
      eyeClosing.value = false
      eyeClosed.value = true
    }, 350)
  })
}

const triggerDamage = () => {
  playSE('ロボットを殴る2')
  damageFlash.value = true
  triggerShake()
  setTimeout(() => {
    damageFlash.value = false
  }, 300)
}

const triggerShake = () => {
  playSE('ロボットの足音3')
  shakeView.value = true
  setTimeout(() => {
    shakeView.value = false
  }, 450)
}

const triggerStatic = (level = 1) => {
  playSE('マイクノイズ')
  staticLevel.value = level
  staticFlash.value = true
  setTimeout(() => {
    staticFlash.value = false
  }, 350)
}

const triggerAnalyze = () => {
  playSE('データ表示4')
  isAnalyze.value = !isAnalyze.value
}

const onScanlineEnd = () => {
  if (isAnalyze.value) {
    isAnalyze.value = false
  }
}

const toggleHeat = () => {
  isHeat.value = !isHeat.value
  if (isHeat.value) {
    playSE('マイクノイズ', { loop: true, id: 'heat' })
  } else {
    stopSE('heat')
  }
}

const toggleNightVision = () => {
  isNightVision.value = !isNightVision.value
  if (isNightVision.value) {
    playSE('メニューを開く3', { loop: true, id: 'nightvision' })
  } else {
    stopSE('nightvision')
  }
}

const triggerAnomaly = () => {
  playSE('妨害電波')
  damageFlash.value = true
  setTimeout(() => {
    damageFlash.value = false
  }, 300)
}

const triggerReboot = () => {
  playSE('パソコンの電源を切る')
}

const toggleStatic2 = () => {
  staticMode2.value = !staticMode2.value
  if (staticMode2.value) {
    playSE('マイクノイズ', { loop: true, id: 'static2' })
    staticFlash.value = false
  } else {
    stopSE('static2')
  }
}

const toggleStatic4 = () => {
  staticMode4.value = !staticMode4.value
  if (staticMode4.value) {
    playSE('妨害電波', { loop: true, id: 'static4' })
    staticFlash.value = false
  } else {
    stopSE('static4')
  }
}
</script>

<style scoped>
.ui-modal {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 50% 40%, #0b1423 0%, #060a12 55%, #04070d 100%);
}

.hud-root {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #8fefff;
  font-family: Consolas, monospace;
  pointer-events: none;
}

.hud-panel {
  width: min(700px);
  height: min(400px);
  position: relative;
  --hud-rgb: 0, 220, 255;
  --hud-accent-rgb: 140, 250, 255;
  --hud-bg-start: rgba(10, 20, 36, 0.9);
  --hud-bg-end: rgba(6, 12, 24, 0.95);
  --hud-scan-opacity: 0.25;
  --hud-noise-opacity: 0.2;
  background: linear-gradient(135deg, var(--hud-bg-start), var(--hud-bg-end));
  border-radius: 12px;
  box-shadow:
    inset 0 0 18px rgba(var(--hud-rgb), 0.12),
    0 0 24px rgba(var(--hud-rgb), 0.25);
  overflow: hidden;
}

.target-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  pointer-events: none;
  color: #8fefff;
}

.gen-1 .target-layer {
  filter: grayscale(1) brightness(1.1);
  opacity: 0.7;
}

.gen-2 .target-layer {
  color: #5cff8a;
  opacity: 0.9;
}

.gen-3 .target-layer {
  filter: hue-rotate(200deg) saturate(1.2);
  opacity: 0.9;
}

.gen-4 .target-layer {
  filter: hue-rotate(210deg) saturate(1.3) brightness(1.1);
  opacity: 1;
}

.gen-5 .target-layer,
.gen-6 .target-layer {
  filter: saturate(0.7) brightness(1.35);
  opacity: 0.85;
}

.hud-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid rgba(var(--hud-rgb), 0.8);
  border-radius: 12px;
  clip-path: polygon(
    0 12%,
    6% 0,
    94% 0,
    100% 12%,
    100% 88%,
    94% 100%,
    6% 100%,
    0 88%
  );
}

.hud-glow {
  position: absolute;
  inset: -10%;
  border-radius: 18px;
  background: radial-gradient(circle at 30% 40%, rgba(var(--hud-rgb), 0.2), transparent 55%),
    radial-gradient(circle at 80% 70%, rgba(var(--hud-rgb), 0.15), transparent 60%);
  filter: blur(8px);
}

.hud-corners {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(var(--hud-accent-rgb), 1), rgba(var(--hud-accent-rgb), 1)) top left / 40px 2px no-repeat,
    linear-gradient(rgba(var(--hud-accent-rgb), 1), rgba(var(--hud-accent-rgb), 1)) top right / 40px 2px no-repeat,
    linear-gradient(rgba(var(--hud-accent-rgb), 1), rgba(var(--hud-accent-rgb), 1)) bottom left / 40px 2px no-repeat,
    linear-gradient(rgba(var(--hud-accent-rgb), 1), rgba(var(--hud-accent-rgb), 1)) bottom right / 40px 2px no-repeat,
    linear-gradient(rgba(var(--hud-accent-rgb), 1), rgba(var(--hud-accent-rgb), 1)) top left / 2px 40px no-repeat,
    linear-gradient(rgba(var(--hud-accent-rgb), 1), rgba(var(--hud-accent-rgb), 1)) top right / 2px 40px no-repeat,
    linear-gradient(rgba(var(--hud-accent-rgb), 1), rgba(var(--hud-accent-rgb), 1)) bottom left / 2px 40px no-repeat,
    linear-gradient(rgba(var(--hud-accent-rgb), 1), rgba(var(--hud-accent-rgb), 1)) bottom right / 2px 40px no-repeat;
  opacity: 0.9;
}

.hud-notch {
  position: absolute;
  left: 12%;
  bottom: 8%;
  width: 28%;
  height: 16%;
  border: 2px solid rgba(var(--hud-rgb), 0.8);
  border-left: none;
  border-radius: 0 8px 8px 0;
  background: linear-gradient(90deg, rgba(var(--hud-rgb), 0.12), transparent);
}

.hud-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 200, 255, 0.08),
    rgba(0, 200, 255, 0.08) 2px,
    transparent 2px,
    transparent 6px
  );
  mix-blend-mode: screen;
  opacity: var(--hud-scan-opacity);
}

.hud-scanline-x {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -20%;
  width: 20%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(120, 245, 255, 0.12) 45%,
    rgba(120, 245, 255, 0.35) 50%,
    rgba(120, 245, 255, 0.12) 55%,
    transparent 100%
  );
  opacity: 0;
  pointer-events: none;
}

.analyzing .hud-scanline-x {
  opacity: 1;
  animation: scanlineX 1.5s linear 1;
}

.hud-noise {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 3px 3px;
  opacity: var(--hud-noise-opacity);
}

.hud-open-light {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle at center, rgba(var(--hud-accent-rgb), 0.65), rgba(var(--hud-rgb), 0.25) 35%, transparent 60%);
  opacity: 0;
  transform: scale(0.2);
  mix-blend-mode: screen;
}

.hud-blackout {
  position: absolute;
  inset: 0;
  background: #000;
  opacity: 0;
  transition: opacity 0.35s ease;
  z-index: 3;
}

.hud-blackout.active {
  opacity: 1;
}

.eye-opening .hud-blackout {
  transition: opacity 0.7s ease;
  opacity: 0;
}

.eye-closing .hud-blackout {
  transition: opacity 0.35s ease;
  opacity: 1;
}

.hud-static {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.15),
      rgba(255, 255, 255, 0.15) 1px,
      transparent 1px,
      transparent 2px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.2),
      rgba(0, 0, 0, 0.2) 1px,
      transparent 1px,
      transparent 2px
    );
  opacity: 0;
  mix-blend-mode: screen;
}

.static-2 .hud-static {
  opacity: 0.8;
  filter: contrast(1.1);
}

.static-3 .hud-static {
  opacity: 1;
  filter: contrast(1.25) brightness(1.05);
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.28),
      rgba(255, 255, 255, 0.28) 1px,
      transparent 1px,
      transparent 2px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.3),
      rgba(0, 0, 0, 0.3) 1px,
      transparent 1px,
      transparent 2px
    ),
    radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px);
  background-size: auto, auto, 2px 2px;
}

.static-4 .hud-static {
  opacity: 1;
  filter: contrast(1.25) brightness(1.05);
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.35),
      rgba(255, 255, 255, 0.35) 1px,
      transparent 1px,
      transparent 2px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.35),
      rgba(0, 0, 0, 0.35) 1px,
      transparent 1px,
      transparent 2px
    ),
    radial-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-size: auto, auto, 1px 1px;
  background-position: 0 0, 0 0, 0 0;
  animation: staticGrain 1.8s steps(3) infinite;
}

.hud-lids {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, rgba(3, 8, 14, 0.95) 0 50%, transparent 50% 100%),
    linear-gradient(to top, rgba(3, 8, 14, 0.95) 0 50%, transparent 50% 100%);
  transform-origin: center;
  transform: scaleY(0);
  opacity: 0;
}

.hud-readout {
  position: absolute;
  top: 12%;
  right: 10%;
  font-size: 12px;
  letter-spacing: 3px;
  color: rgba(var(--hud-accent-rgb), 0.85);
  text-shadow: 0 0 8px rgba(var(--hud-rgb), 0.4);
}

/* .hud-gauge {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 8%;
  height: 15px;
  background: linear-gradient(90deg, #2afd6d 0% 70%, #ff4b4b 70% 100%);
  -webkit-mask: repeating-linear-gradient(
    90deg,
    #000 0 6px,
    transparent 6px 9px
  );
  mask: repeating-linear-gradient(
    90deg,
    #000 0 5px,
    transparent 5px 8px
  );
  opacity: 0.9;
  transform: skewX(-20deg);
  transform-origin: left center;
} */

.hud-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 8px;
  width: min(610px);
  pointer-events: auto;
}

.hud-controls-secondary {
  opacity: 0.9;
}

.hud-controls button {
  padding: 8px 6px;
  width: 120px;
  background: rgba(6, 16, 26, 0.95);
  border: 1px solid rgba(var(--hud-rgb), 0.7);
  color: rgba(var(--hud-accent-rgb), 0.95);
  font-family: Consolas, monospace;
  font-size: 24px;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(var(--hud-rgb), 0.2);
}

.hud-controls button:hover {
  background: rgba(10, 26, 40, 0.95);
}

.eye-opening .hud-lids {
  animation: eyeOpen 0.7s ease-out;
}

.eye-opening .hud-open-light {
  animation: openLight 0.7s ease-out;
}

.eye-closing .hud-lids {
  animation: eyeClose 0.35s ease-in;
}

.damage-flash::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(255, 60, 60, 0.2);
  box-shadow: inset 0 0 40px rgba(255, 40, 40, 0.35);
}

.static-flash .hud-static {
  animation: staticFlash 0.35s steps(2) both;
}

.gen-1 {
  --hud-rgb: 170, 170, 170;
  --hud-accent-rgb: 200, 200, 200;
  --hud-bg-start: rgba(18, 18, 18, 0.952);
  --hud-bg-end: rgba(8, 8, 8, 0.95);
  --hud-scan-opacity: 1.18;
  --hud-noise-opacity: 1.22;
}

.gen-2 {
  --hud-rgb: 0, 200, 105;
  --hud-accent-rgb: 120, 240, 175;
  --hud-bg-start: rgba(6, 20, 12, 0.4);
  --hud-bg-end: rgba(4, 10, 6, 0.35);
  --hud-scan-opacity: 0.42;
  --hud-noise-opacity: 0.64;
}
.gen-2 .hud-glow{
  opacity: 0.5;
}

.gen-3 {
  --hud-rgb: 60, 140, 255;
  --hud-accent-rgb: 170, 210, 255;
  --hud-bg-start: rgba(8, 14, 26, 0.3);
  --hud-bg-end: rgba(4, 8, 16, 0.45);
  --hud-scan-opacity: 0.18;
  --hud-noise-opacity: 0.1;
}
.gen-3 .hud-glow{
  opacity: 0.5;
}

.gen-4 {
  --hud-rgb: 90, 170, 255;
  --hud-accent-rgb: 200, 235, 255;
  --hud-bg-start: rgba(10, 16, 24, 0.3);
  --hud-bg-end: rgba(6, 10, 16, 0.45);
  --hud-scan-opacity: 0.12;
  --hud-noise-opacity: 0.06;
}
.gen-4 .hud-glow{
  opacity: 0.35;
}
.gen-5 {
  --hud-rgb: 245, 252, 255;
  --hud-accent-rgb: 140, 220, 255;
  --hud-bg-start: rgba(10, 14, 18, 0);
  --hud-bg-end: rgba(4, 6, 8, 0);
  --hud-scan-opacity: 0.1;
  --hud-noise-opacity: 0.05;
}
.gen-5 .hud-glow{
  opacity: 0.25;
}
.gen-6 {
  --hud-rgb: 245, 252, 255;
  --hud-accent-rgb: 140, 220, 255;
  --hud-bg-start: rgba(10, 14, 18, 0);
  --hud-bg-end: rgba(4, 6, 8, 0);
  --hud-scan-opacity: 0;
  --hud-noise-opacity: 0;
}

.gen-6 .hud-glow,
.gen-6 .hud-notch,
.gen-6 .hud-scanlines,
.gen-6 .hud-noise,
.gen-6 .hud-open-light,
.gen-6 .hud-static {
  opacity: 0;
}

.nightvision {
  color: #7bff9a;
  --hud-rgb: 80, 220, 120;
  --hud-accent-rgb: 160, 255, 190;
  --hud-scan-opacity: 0.45;
  --hud-noise-opacity: 0.35;
}

.nightvision .hud-panel {
  box-shadow:
    inset 0 0 18px rgba(var(--hud-rgb), 0.2),
    0 0 26px rgba(var(--hud-rgb), 0.35);
}

.nightvision .hud-scanlines {
  mix-blend-mode: screen;
}

.nightvision .hud-noise {
  background-size: 2px 2px;
}

.shake {
  animation: shake 0.45s ease-in-out;
}

@keyframes eyeOpen {
  0% {
    opacity: 1;
    transform: scaleY(1);
  }
  70% {
    opacity: 1;
    transform: scaleY(0.2);
  }
  100% {
    opacity: 0;
    transform: scaleY(0);
  }
}

@keyframes openLight {
  0% {
    opacity: 0.9;
    transform: scale(0.2);
  }
  60% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.6);
  }
}

@keyframes eyeClose {
  0% {
    opacity: 0;
    transform: scaleY(0);
  }
  100% {
    opacity: 1;
    transform: scaleY(1);
  }
}

@keyframes shake {
  0% { transform: translate(0, 0); }
  20% { transform: translate(-4px, 2px); }
  40% { transform: translate(3px, -3px); }
  60% { transform: translate(-2px, 3px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0, 0); }
}

@keyframes staticFlash {
  0% { opacity: 0; }
  10% { opacity: 0.8; }
  40% { opacity: 0.35; }
  70% { opacity: 0.7; }
  100% { opacity: 0; }
}

@keyframes scanlineX {
  0% { transform: translateX(0); }
  100% { transform: translateX(120vw); }
}

@keyframes staticGrain {
  0% {
    opacity: 0.6;
    filter: contrast(1.15) brightness(1.02);
    background-size: auto, auto, 2px 2px;
  }
  50% {
    opacity: 1;
    filter: contrast(1.35) brightness(1.08);
    background-size: auto, auto, 1px 1px;
  }
  100% {
    opacity: 0.75;
    filter: contrast(1.2) brightness(1.04);
    background-size: auto, auto, 3px 3px;
  }
}
</style>
