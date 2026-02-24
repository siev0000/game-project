<template>
  <div class="ui-modal" :class="{ embedded }">
    <div class="hud-root" :class="`gen-${generation}`">
        <div v-if="showTarget" class="target-layer" :class="`gen-${currentTargetGeneration}`">
          <div ref="targetRef" class="target-marker-instance" :style="targetStyle">
            <div class="target-marker-core" :class="targetMarkerClasses">
              <TargetMarker :generation="currentTargetGeneration" />
            </div>
          </div>
        </div>
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
        <!-- <div v-if="showTargetVer2" class="target-layer">
          <TargetMarkerVer2
            v-if="generation <= 3"
            class="target-marker-instance"
            :generation="generation"
          />
        </div> -->
        <!-- 視界の開閉（暗転/開眼/閉眼） -->
        <div class="hud-blackout" :class="{ active: eyeClosed || eyeOpen || eyeClosing }"></div>
        <!-- HUDの発光レイヤー -->
        <div class="hud-glow"></div>
        <!-- 四隅のライン装飾 -->
        <div class="hud-corners"></div>
        <!-- HUDの切り欠き装飾（未使用） -->
        <!-- <div class="hud-notch"></div> -->
        <!-- 走査線（横ライン） -->
        <div class="hud-scanlines"></div>
        <!-- 走査線（縦スキャン） -->
        <div class="hud-scanline-x" @animationend="onScanlineEnd"></div>
        <!-- ノイズ粒子 -->
        <div class="hud-noise"></div>
        <!-- 眼を開く光の演出 -->
        <div class="hud-open-light"></div>
        <!-- 砂嵐/ノイズ演出 -->
        <div class="hud-static"></div>
        <!-- まぶたの演出 -->
        <div class="hud-lids"></div>
        <!-- HUDのテキスト表示（未使用） -->
        <!-- <div class="hud-readout">ROBOT VISION</div> -->
        <!-- HUDのメーター装飾 -->
        <div class="hud-gauge"></div>
      </div>

      <div v-if="showControls" class="hud-controls">
        <button @click="handleClose">閉じる</button>
        <button @click="toggleTarget">ターゲット</button>
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
        <button @click="toggleHeat">熱源</button>
        <button @click="toggleNightVision">暗視</button>
        <!-- <button @click="toggleTargetVer2">ターゲットVer2</button> -->
      </div>
      <div v-if="showControls" class="hud-controls hud-controls-secondary">
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
import { ref, computed, watch } from 'vue'
import { playSE, stopSE } from '@/constants/statData.js'
import TargetMarker from './TargetMarker.vue'
// import TargetMarkerVer2 from './TargetMarkerVer2.vue'

const props = defineProps({
  embedded: { type: Boolean, default: false },
  showControls: { type: Boolean, default: true }
})

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
const targetRef = ref(null)
const targetPos = ref(null)
const isAnalyze = ref(false)
const isHeat = ref(false)
const isNightVision = ref(false)
// const showTargetVer2 = ref(false)

// 世代別アニメーション用の状態
const targetAnimating = ref(false)
const targetShaking = ref(false)
const targetScaling = ref(false)
const targetPulse = ref(false)
const targetGeneration = ref(null)
const targetStage = ref(0) // 第二世代の2段階移動用（0: なし, 1: 縦移動中, 2: 横移動中）
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

const setTargetVisible = (value) => {
  showTarget.value = value
}

const setTargetGeneration = (value) => {
  if (value == null || value === '') {
    targetGeneration.value = null
    return
  }
  const numeric = Number(value)
  targetGeneration.value = Number.isFinite(numeric) ? numeric : null
}

const currentTargetGeneration = computed(() => targetGeneration.value ?? generation.value)

const setTargetPosition = (pos) => {
  if (!pos) {
    targetPos.value = null
    return
  }
  
  // 第二世代の2段階移動の場合
  if (currentTargetGeneration.value === 2 && targetPos.value) {
    // まず縦（Y）のみ更新
    targetStage.value = 1
    targetPos.value = { 
      x: targetPos.value.x, // 古いXを維持
      y: pos.y, 
      scale: pos.scale || 1 
    }
    // 0.3秒後に横（X）を更新
    setTimeout(() => {
      targetStage.value = 2
      targetPos.value = { x: pos.x, y: pos.y, scale: pos.scale || 1 }
      setTimeout(() => {
        targetStage.value = 0
      }, 300)
    }, 300)
  } else {
    targetPos.value = { x: pos.x, y: pos.y, scale: pos.scale || 1 }
  }
}

const targetMotionProfiles = {
  1: {
    transition: () => 'left 0.4s linear, top 0.4s linear, transform 0.4s linear',
    transform: scale => `translate(-50%, -50%) scale(${scale})`,
    duration: 400,
    shouldScheduleEnd: () => true,
    endShake: true,
    moveSound: '巨大ロボットが腕を動かす3',
    onMoveStart: () => {},
    onMoveEnd: () => {
      targetShaking.value = false
      targetPulse.value = false
      requestAnimationFrame(() => {
        targetShaking.value = true
        targetPulse.value = true
        setTimeout(() => {
          targetShaking.value = false
        }, 450)
        setTimeout(() => {
          targetPulse.value = false
        }, 400)
      })
    }
  },
  2: {
    transition: () => {
      if (targetStage.value === 1) {
        return 'top 0.3s ease-in-out, transform 0.3s ease-in-out'
      }
      if (targetStage.value === 2) {
        return 'left 0.3s ease-in-out, transform 0.3s ease-in-out'
      }
      return 'left 0.3s ease-in-out, top 0.3s ease-in-out, transform 0.3s ease-in-out'
    },
    transform: scale => `translate(-50%, -50%) scale(${scale})`,
    duration: 300,
    shouldScheduleEnd: () => targetStage.value !== 1,
    endShake: false,
    moveSound: 'ロボットが腕を動かす1',
    shouldPlaySound: () => targetStage.value === 1,
    onMoveStart: () => {}
  },
  3: {
    transition: () =>
      'left 0.35s ease-out, top 0.35s ease-out, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: scale => {
      const overshootScale = targetScaling.value ? scale * 1.3 : scale
      return `translate(-50%, -50%) scale(${overshootScale})`
    },
    duration: 350,
    shouldScheduleEnd: () => true,
    endShake: false,
    moveSound: 'データ表示4',
    onMoveStart: () => {
      targetScaling.value = true
      setTimeout(() => {
        targetScaling.value = false
      }, 350)
    }
  },
  6: {
    transition: () =>
      'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), top 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: scale => `translate(-50%, -50%) scale(${scale})`,
    duration: 250,
    shouldScheduleEnd: () => true,
    endShake: false,
    moveSound: 'メニューを開く4',
    onMoveStart: () => {}
  },
  default: {
    transition: () =>
      'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), top 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: scale => `translate(-50%, -50%) scale(${scale})`,
    duration: 250,
    shouldScheduleEnd: () => true,
    endShake: false,
    moveSound: 'キャンセル7',
    onMoveStart: () => {}
  }
}

const getTargetMotionProfile = (value) =>
  targetMotionProfiles[value] ?? targetMotionProfiles.default

const targetStyle = computed(() => {
  if (!targetPos.value) {
    return { left: '50%', top: '50%' }
  }

  const scale = targetPos.value.scale || 1
  const baseStyle = {
    left: `${targetPos.value.x}px`,
    top: `${targetPos.value.y}px`
  }
  const profile = getTargetMotionProfile(currentTargetGeneration.value)
  const transition = profile.transition()
  const transform = profile.transform(scale)

  return {
    ...baseStyle,
    transform,
    transition
  }
})

const targetMarkerClasses = computed(() => ({
  'target-jitter': targetShaking.value,
  'target-pulse': targetPulse.value
}))

const getTargetRect = () => {
  if (!targetRef.value) return null
  return targetRef.value.getBoundingClientRect()
}

let targetMoveTimer = null
let targetMoveToken = 0
const scheduleTargetMoveEnd = (duration, options = {}) => {
  const { endShake = false, onMoveEnd = null } = options
  targetMoveToken += 1
  const token = targetMoveToken
  if (targetMoveTimer) {
    clearTimeout(targetMoveTimer)
    targetMoveTimer = null
  }
  targetAnimating.value = true
  targetMoveTimer = setTimeout(() => {
    if (token !== targetMoveToken) return
    targetAnimating.value = false
    if (endShake) {
      triggerShake()
    }
    if (onMoveEnd) onMoveEnd()
  }, duration)
}

// targetPosの変更を監視して世代別アニメーションをトリガー
watch(targetPos, (newPos, oldPos) => {
  if (!newPos || !oldPos) return
  
  const newScale = newPos.scale || 1
  const oldScale = oldPos.scale || 1
  const moved =
    newPos.x !== oldPos.x ||
    newPos.y !== oldPos.y ||
    newScale !== oldScale
  if (!moved) return

  const profile = getTargetMotionProfile(currentTargetGeneration.value)
  if (profile.moveSound && (!profile.shouldPlaySound || profile.shouldPlaySound())) {
    playSE(profile.moveSound)
  }
  if (profile.onMoveStart) profile.onMoveStart()
  if (profile.shouldScheduleEnd && !profile.shouldScheduleEnd()) {
    return
  }
  scheduleTargetMoveEnd(profile.duration, {
    endShake: profile.endShake,
    onMoveEnd: profile.onMoveEnd
  })
})
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

defineExpose({
  getControlButtons: () => controlButtons.value,
  getGenerationButtons: () => generationButtons.value,
  setTargetVisible,
  setTargetGeneration,
  setTargetPosition,
  getTargetRect,
  handleClose,
  triggerEyeOpen,
  triggerEyeClose,
  triggerAnalyze,
  triggerDamage,
  triggerShake,
  triggerStatic,
  toggleStatic2,
  toggleStatic4,
  triggerAnomaly,
  triggerReboot,
  toggleTarget,
  toggleHeat,
  toggleNightVision,
  setGeneration
})
</script>

<style scoped>
.ui-modal {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 50% 40%, #0b1423 0%, #060a12 55%, #04070d 100%);
}

.ui-modal.embedded {
  position: absolute;
  inset: 0;
  background: transparent;
  pointer-events: none;
  width: 100%;
  height: 100%;
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
  width: min(702px);
  /*---------------------------------- 
    画面サイズ小さめ 
  ------------------------------------*/
  /* height: min(475px);
  top: -125px; */
  /*---------------------------------- 
    画面サイズ大き目 
  ------------------------------------*/
  height: min(725px);
  /* --------------------- */
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
  z-index: 2;
  pointer-events: none;
  color: #8fefff;
}

.target-marker-instance {
  position: absolute;
  transform: translate(-50%, -50%);
}

.target-marker-core {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform-origin: center;
}

.target-marker-core.target-jitter {
  animation: targetJitter 0.45s ease-in-out;
}

.target-marker-core.target-pulse::after {
  content: "";
  position: absolute;
  inset: -12px;
  border: 1px solid currentColor;
  border-radius: 12px;
  opacity: 0;
  animation: targetPulse 0.4s ease-out;
  box-shadow: 0 0 14px rgba(var(--hud-accent-rgb), 0.55);
}

.target-layer.gen-1 {
  filter: grayscale(1) brightness(1.1);
  opacity: 0.7;
}

.target-layer.gen-2 {
  color: #5cff8a;
  opacity: 0.9;
}

.target-layer.gen-3 {
  filter: hue-rotate(200deg) saturate(1.2);
  opacity: 0.9;
}

.target-layer.gen-4 {
  filter: hue-rotate(210deg) saturate(1.3) brightness(1.1);
  opacity: 1;
}

.target-layer.gen-5,
.target-layer.gen-6 {
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
  --hud-bg-start: rgba(18, 18, 18, 0.252);
  --hud-bg-end: rgba(8, 8, 8, 0.25);
  --hud-scan-opacity: 1.18;
  --hud-noise-opacity: 1.22;
}

.gen-2 {
  --hud-rgb: 0, 200, 105;
  --hud-accent-rgb: 120, 240, 175;
  --hud-bg-start: rgba(6, 20, 12, 0.2);
  --hud-bg-end: rgba(4, 10, 6, 0.25);
  --hud-scan-opacity: 0.42;
  --hud-noise-opacity: 0.64;
}
.gen-2 .hud-glow{
  opacity: 0.5;
}

.gen-3 {
  --hud-rgb: 60, 140, 255;
  --hud-accent-rgb: 170, 210, 255;
  --hud-bg-start: rgba(8, 14, 26, 0.15);
  --hud-bg-end: rgba(4, 8, 16, 0.20);
  --hud-scan-opacity: 0.18;
  --hud-noise-opacity: 0.1;
}
.gen-3 .hud-glow{
  opacity: 0.5;
}

.gen-4 {
  --hud-rgb: 90, 170, 255;
  --hud-accent-rgb: 200, 235, 255;
  --hud-bg-start: rgba(10, 16, 24, 0.1);
  --hud-bg-end: rgba(6, 10, 16, 0.15);
  --hud-scan-opacity: 0.12;
  --hud-noise-opacity: 0.06;
}
.gen-4 .hud-glow{
  opacity: 0.35;
}
.gen-5 {
  --hud-rgb: 245, 252, 255;
  --hud-accent-rgb: 140, 220, 255;
  --hud-bg-start: rgba(10, 14, 18, 0.1);
  --hud-bg-end: rgba(4, 6, 8, 0.1);
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

@keyframes targetJitter {
  0% { transform: translate(0, 0) scale(1); }
  20% { transform: translate(-2px, 1px) scale(1.02); }
  40% { transform: translate(2px, -2px) scale(1.04); }
  60% { transform: translate(-1px, 2px) scale(1.02); }
  80% { transform: translate(1px, -1px) scale(1); }
  100% { transform: translate(0, 0) scale(1); }
}

@keyframes targetPulse {
  0% { opacity: 0; transform: scale(0.7); }
  35% { opacity: 0.9; }
  100% { opacity: 0; transform: scale(1.45); }
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
