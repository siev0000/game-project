<template>
  <div class="target-marker" :class="generationClass">
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>
    <div class="ring ring-outer"></div>
    <div class="ring ring-inner"></div>
    <div class="ring ring-core"></div>
    <div v-if="generation === 9" class="genSp-illust-wrap">
      <img
        class="genSp-illust genSp-circle"
        :src="getUillust('円_サイバー')"
        alt="Target marker gen 3 circle"
      />
      <div class="genSp-tri-wrap genSp-tri-top">
        <img
          class="genSp-illust genSp-tri"
          :src="getUillust('照準器_枠ver3')"
          alt="Target marker gen 3 triangle top"
        />
      </div>
      <div class="genSp-tri-wrap genSp-tri-left">
        <img
          class="genSp-illust genSp-tri"
          :src="getUillust('照準器_枠ver3')"
          alt="Target marker gen 3 triangle left"
        />
      </div>
      <div class="genSp-tri-wrap genSp-tri-right">
        <img
          class="genSp-illust genSp-tri"
          :src="getUillust('照準器_枠ver3')"
          alt="Target marker gen 3 triangle right"
        />
      </div>
    </div>
    <div class="tri-frame"></div>
    <div class="tri-inner"></div>
    <div class="ring ring-outer gen4-outer"></div>
    <div class="ring gen4-inner"></div>
    <div class="gen4-arrows">
      <div class="gen4-arrow"></div>
      <div class="gen4-arrow"></div>
      <div class="gen4-arrow"></div>
      <div class="gen4-arrow"></div>
    </div>
    <div class="magitech-rings">
      <svg class="magitech-ring magitech-ring-outer" viewBox="0 0 140 140" aria-hidden="true">
        <path class="magitech-wave-path" :d="magitechOuterWavePath" />
      </svg>
      <span class="magitech-ring magitech-ring-inner"></span>
    </div>
    <div class="magitech-jewels">
      <span class="magitech-jewel"></span>
      <span class="magitech-jewel"></span>
      <span class="magitech-jewel"></span>
      <span class="magitech-jewel"></span>
      <span class="magitech-jewel"></span>
    </div>
    <div class="demon-reticle">
      <span class="demon-segment"></span>
      <span class="demon-point demon-point-top"></span>
      <span class="demon-point demon-point-right"></span>
      <span class="demon-point demon-point-bottom"></span>
      <span class="demon-point demon-point-left"></span>
    </div>
    <div class="hex-frame"></div>
    <div class="scanline"></div>
    <div class="halo"></div>
    <div class="arc arc-top"></div>
    <div class="arc arc-left"></div>
    <div class="arc arc-right"></div>
    <div class="arc arc-bottom"></div>
    <div class="grid"></div>
    <div class="tri tri-up"></div>
    <div class="tri tri-right"></div>
    <div class="tri tri-down"></div>
    <div class="tri tri-left"></div>
    <div class="ticks"></div>
    <div class="sweep"></div>
    <div class="cross cross-h"></div>
    <div class="cross cross-v"></div>
    <div class="cross cross-h small"></div>
    <div class="cross cross-v small"></div>
    <div class="center-x"></div>
    <div class="ring-segment ring-segment-outer"></div>
    <div class="ring-segment ring-segment-inner"></div>
    <div class="core"></div>
    <div class="inner-ring inner-ring-thin"></div>
    <div class="inner-ring inner-ring-thick"></div>
    <div class="orbit orbit-1"></div>
    <div class="orbit orbit-2"></div>
    <div class="orbit orbit-3"></div>
    <div class="orbit orbit-4"></div>
    <div class="orbit orbit-5"></div>
    <div class="outer-dots"></div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getUillust } from '@/constants/statData.js'

const props = defineProps({
  generation: {
    type: [Number, String],
    default: 1
  }
})

const generationClass = computed(() => `gen-${String(props.generation).replace('.', '-')}`)

// 第4・4.5世代の外側円の波形設定。count を増やすと、周方向の波の数が増える。
const MAGITECH_OUTER_WAVE = {
  count: 32,
  amplitude: 7.4,
  jitterInterval: 180,
  settleFactor: 0.12
}

const createWaveOffsets = () =>
  Array.from({ length: MAGITECH_OUTER_WAVE.count }, () => Math.random() * 2 - 1)

const magitechOuterWaveOffsets = ref(createWaveOffsets())
let magitechWaveAnimationFrame = 0

const magitechOuterWavePath = computed(() => {
  const { count, amplitude } = MAGITECH_OUTER_WAVE
  const center = 70
  const radius = 53
  const pointCount = count * 12
  const points = []

  for (let index = 0; index <= pointCount; index += 1) {
    const angle = (index / pointCount) * Math.PI * 2 - Math.PI / 2
    const wavePosition = (index / pointCount) * count
    const lowerIndex = Math.floor(wavePosition) % count
    const upperIndex = (lowerIndex + 1) % count
    const blend = wavePosition - Math.floor(wavePosition)
    const offsets = magitechOuterWaveOffsets.value
    const waveOffset = offsets[lowerIndex] * (1 - blend) + offsets[upperIndex] * blend
    const waveRadius = radius + waveOffset * amplitude
    const x = center + Math.cos(angle) * waveRadius
    const y = center + Math.sin(angle) * waveRadius
    points.push((index === 0 ? 'M ' : 'L ') + x.toFixed(2) + ' ' + y.toFixed(2))
  }

  return points.join(' ') + ' Z'
})

onMounted(() => {
  let lastTargetChange = performance.now()
  let currentOffsets = [...magitechOuterWaveOffsets.value]
  let targetOffsets = createWaveOffsets()

  const animateWave = timestamp => {
    if (timestamp - lastTargetChange >= MAGITECH_OUTER_WAVE.jitterInterval) {
      targetOffsets = createWaveOffsets()
      lastTargetChange = timestamp
    }

    currentOffsets = currentOffsets.map((value, index) =>
      value + (targetOffsets[index] - value) * MAGITECH_OUTER_WAVE.settleFactor
    )
    magitechOuterWaveOffsets.value = currentOffsets
    magitechWaveAnimationFrame = requestAnimationFrame(animateWave)
  }

  magitechWaveAnimationFrame = requestAnimationFrame(animateWave)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(magitechWaveAnimationFrame)
})
</script>

<style scoped>
.target-marker {
  position: relative;
  width: 140px;
  height: 140px;
  color: currentColor;
  filter: drop-shadow(0 0 10px rgba(0, 220, 255, 0.45));
}

.genSp-illust {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: none;
}

.genSp-illust-wrap {
  width: 150%;
  height: 150%;
  display: none;
  position: absolute;
  inset: 0;
  transform-origin: 50% 50%;
  --circle-radius: 50%;
  --tri-gap: 6%;
  left: -35px;
  top: -35px
}

.genSp-circle {
  display: block;
  transform: scale(0.6);
  animation: genSpCircleExpand 6s ease-in-out infinite;
}

.genSp-tri-wrap {
  position: absolute;
  width: 50%;
  height: 50%;
  transform-origin: center;
}

.genSp-tri {
  width: 100%;
  height: 100%;
}

.genSp-tri-top {
  top: -10%;
  left: 50%;
  transform: translateX(-50%);
}

.genSp-tri-left {
  left: calc(50% - var(--circle-radius) - var(--tri-gap));
  top: 70%;
  transform: translateY(-50%) rotate(-120deg);
}

.genSp-tri-right {
  right: calc(50% - var(--circle-radius) - var(--tri-gap));
  top: 70%;
  transform: translateY(-50%) rotate(120deg);
}

/* 角のブラケット（複数世代で使用） */
.corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 2px solid currentColor;
  opacity: 0.9;
}

.corner.tl {
  top: 6px;
  left: 6px;
  border-right: none;
  border-bottom: none;
}

.corner.tr {
  top: 6px;
  right: 6px;
  border-left: none;
  border-bottom: none;
}

.corner.bl {
  bottom: 6px;
  left: 6px;
  border-right: none;
  border-top: none;
}

.corner.br {
  bottom: 6px;
  right: 6px;
  border-left: none;
  border-top: none;
}

/* 基本リング（外周/内周/コア） */
.ring {
  position: absolute;
  inset: 0;
  border: 2px solid currentColor;
  border-radius: 50%;
}

.ring-outer {
  animation: pulse 1.6s ease-in-out infinite;
}

.ring-inner {
  inset: 18%;
  border-style: dashed;
  border-color: currentColor;
  animation: spin 6s linear infinite;
}

.ring-core {
  inset: 36%;
  border-width: 1px;
  opacity: 0.8;
}

.halo {
  position: absolute;
  inset: -6%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(98, 230, 255, 0.4) 0%, rgba(98, 230, 255, 0.05) 55%, transparent 70%);
  opacity: 0;
}

.arc {
  position: absolute;
  width: 36px;
  height: 18px;
  border: 3px solid currentColor;
  border-bottom: none;
  border-radius: 999px 999px 0 0;
  opacity: 0;
}

.arc-top {
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
}

.arc-left {
  left: 2px;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
}

.arc-right {
  right: 2px;
  top: 50%;
  transform: translateY(-50%) rotate(90deg);
}

.arc-bottom {
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%) rotate(180deg);
}

.grid {
  position: absolute;
  inset: 22%;
  border-radius: 50%;
  background:
    radial-gradient(circle, transparent 58%, rgba(98, 230, 255, 0.35) 59% 60%, transparent 61%),
    repeating-linear-gradient(0deg, rgba(98, 230, 255, 0.25), rgba(98, 230, 255, 0.25) 1px, transparent 1px, transparent 6px),
    repeating-linear-gradient(90deg, rgba(98, 230, 255, 0.25), rgba(98, 230, 255, 0.25) 1px, transparent 1px, transparent 6px);
  opacity: 0;
}

/* 円周の目盛り */
.ticks {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  border: 1px solid transparent;
  background:
    conic-gradient(
      from 0deg,
      currentColor 0deg 6deg,
      transparent 6deg 18deg
    );
  mask: radial-gradient(circle, transparent 58%, #000 59%);
  opacity: 0.6;
}

.tri {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}

.tri-frame {
  position: absolute;
  inset: 10%;
  background:
    linear-gradient(60deg, currentColor 0 2px, transparent 2px) left bottom / 50% 100% no-repeat,
    linear-gradient(-60deg, currentColor 0 2px, transparent 2px) right bottom / 50% 100% no-repeat,
    linear-gradient(currentColor, currentColor) bottom center / 100% 2px no-repeat;
  opacity: 0;
}

.tri-inner {
  position: absolute;
  inset: 26%;
  background:
    linear-gradient(60deg, currentColor 0 2px, transparent 2px) left bottom / 50% 100% no-repeat,
    linear-gradient(-60deg, currentColor 0 2px, transparent 2px) right bottom / 50% 100% no-repeat,
    linear-gradient(currentColor, currentColor) bottom center / 100% 2px no-repeat;
  opacity: 0;
}

.hex-frame {
  position: absolute;
  inset: 12%;
  border: 2px solid currentColor;
  clip-path: polygon(25% 6%, 75% 6%, 96% 50%, 75% 94%, 25% 94%, 4% 50%);
  opacity: 0;
}

.scanline {
  position: absolute;
  inset: 18%;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.08) 1px,
    transparent 1px,
    transparent 6px
  );
  opacity: 0;
}

.gen4-outer {
  border-width: 2px;
  opacity: 0;
  box-shadow: 0 0 10px rgba(255, 120, 120, 0.6);
}

.gen4-inner {
  inset: 18%;
  border-width: 3px;
  border-style: dashed;
  opacity: 0;
}

.gen4-arrows {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.gen4-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 10px solid currentColor;
  top: 23%;
  left: 50%;
  transform: translateX(-50%);
  filter: drop-shadow(0 0 6px rgba(255, 120, 120, 0.7));
}

.gen4-arrow:nth-child(2) {
  top: 50%;
  left: 75%;
  transform: translate(-50%, -50%) rotate(90deg);
}

.gen4-arrow:nth-child(3) {
  top: 75%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(180deg);
}

.gen4-arrow:nth-child(4) {
  top: 50%;
  left: 25%;
  transform: translate(-50%, -50%) rotate(270deg);
}


.tri-up {
  top: 8px;
  left: 50%;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 12px solid currentColor;
  transform: translateX(-50%);
}

.tri-right {
  right: 8px;
  top: 50%;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 12px solid currentColor;
  transform: translateY(-50%);
}

.tri-down {
  bottom: 8px;
  left: 50%;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 12px solid currentColor;
  transform: translateX(-50%);
}

.tri-left {
  left: 8px;
  top: 50%;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 12px solid currentColor;
  transform: translateY(-50%);
}

.sweep {
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0deg 300deg, rgba(255, 255, 255, 0.35) 300deg 360deg);
  opacity: 0.35;
  animation: spin 4s linear infinite;
}

/* 中心の十字線 */
.cross {
  position: absolute;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}

.cross-h {
  left: 50%;
  top: 50%;
  width: 110%;
  height: 2px;
  transform: translate(-50%, -50%);
}

.cross-v {
  left: 50%;
  top: 50%;
  width: 2px;
  height: 110%;
  transform: translate(-50%, -50%);
}

.cross.small {
  box-shadow: none;
  opacity: 0.9;
}

.cross-h.small {
  width: 20%;
  height: 2px;
}

.cross-v.small {
  width: 2px;
  height: 20%;
}

.center-x {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  transform: translate(-50%, -50%) rotate(45deg);
  opacity: 0;
}

.center-x::before,
.center-x::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 2px;
  background: currentColor;
  transform: translate(-50%, -50%);
}

.center-x::after {
  transform: translate(-50%, -50%) rotate(90deg);
}

/* 中心の円 */
.core {
  position: absolute;
  inset: 43%;
  border: 2px solid currentColor;
  box-shadow: 0 0 8px currentColor;
}

/* 内側の補助リング */
.inner-ring {
  position: absolute;
  inset: 36%;
  border-radius: 50%;
  border: 1px solid currentColor;
  opacity: 0;
  box-sizing: border-box;
}

.inner-ring-thin {
  inset: 36%;
  border-width: 1px;
}

.inner-ring-thick {
  inset: 42%;
  border-width: 3px;
}

/* 外周の点線リング */
.outer-dots {
  position: absolute;
  inset: 2%;
  border-radius: 50%;
  border: 2px dashed currentColor;
  opacity: 0;
  box-sizing: border-box;
}

/* 上下左右の欠けたリング */
.ring-segment {
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  background: conic-gradient(
    from 60deg,
    currentColor 0deg 60deg,
    transparent 60deg 90deg,
    currentColor 90deg 150deg,
    transparent 150deg 180deg,
    currentColor 180deg 240deg,
    transparent 240deg 270deg,
    currentColor 270deg 330deg,
    transparent 330deg 360deg
  );
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 12px),
    #fff calc(100% - 10px),
    #fff 100%
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 10px),
    #fff calc(100% - 6px),
    #fff 100%
  );
  opacity: 0;
}

.ring-segment-inner {
  inset: 18%;
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 4px),
    #fff calc(100% - 2px),
    #fff 100%
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 4px),
    #fff calc(100% - 2px),
    #fff 100%
  );
}

/* 回転する欠けリング群 */
.orbit {
  position: absolute;
  inset: 4%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    currentColor 0deg 120deg,
    transparent 120deg 180deg,
    currentColor 180deg 300deg,
    transparent 300deg 360deg
  );
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 12px),
    #fff calc(100% - 12px),
    #fff 100%
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 12px),
    #fff calc(100% - 5px),
    #fff 100%
  );
  opacity: 0;
  animation: spin 12s linear infinite;
}

.orbit-2 {
  inset: 14%;
  animation-duration: 9s;
  animation-direction: reverse;
  background: conic-gradient(
    from 30deg,
    currentColor 0deg 120deg,
    transparent 120deg 180deg,
    currentColor 180deg 300deg,
    transparent 300deg 360deg
  );
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 15px),
    #fff calc(100% - 15px),
    #fff 100%
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 15px),
    #fff calc(100% - 7px),
    #fff 100%
  );
}

.orbit-3 {
  inset: 14%;
  animation-duration: 9s;
  animation-direction: reverse;
  background: conic-gradient(
    from 15deg,
    currentColor 0deg 200deg,
    transparent 200deg 202deg,
    currentColor 250deg 300deg,
    transparent 300deg 360deg
  );
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 3px),
    #fff calc(100% - 2px),
    #fff 100%
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 3px),
    #fff calc(100% - 1px),
    #fff 100%
  );
}

.orbit-4 {
  inset: 19%;
  animation-duration: 7s;
  background: conic-gradient(
    from 15deg,
    currentColor 0deg 220deg,
    transparent 220deg 250deg,
    currentColor 220deg 250deg,
    transparent 250deg 360deg
  );
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 4px),
    #fff calc(100% - 2px),
    #fff 100%
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 3px),
    #fff calc(100% - 1px),
    #fff 100%
  );
}

.orbit-5 {
  display: none;
  inset: -25%;
  animation-duration: 14s;
  background: conic-gradient(
    from -90deg,
    transparent 0deg 300deg,
    currentColor 300deg 306deg,
    transparent 306deg 312deg,
    currentColor 312deg 318deg,
    transparent 318deg 324deg,
    currentColor 324deg 330deg,
    transparent 330deg 336deg,
    currentColor 336deg 342deg,
    transparent 342deg 348deg,
    currentColor 348deg 354deg,
    transparent 354deg 360deg
  );
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 15px),
    #fff calc(100% - 15px),
    #fff 100%
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 15px),
    #fff calc(100% - 10px),
    #fff 100%
  );
  opacity: 0.7;
}

/* ===== Generation tuning ===== */
.gen-1 {
  filter: none;
  color: rgba(220, 220, 220, 0.95);
}

.gen-1 .ring-outer,
.gen-1 .ring-inner,
.gen-1 .ring-core,
.gen-1 .ticks,
.gen-1 .sweep,
.gen-1 .core,
.gen-1 .cross.small {
  display: none;
}

.gen-1 .ring-outer,
.gen-1 .ring-inner,
.gen-1 .ring-core,
.gen-1 .ticks,
.gen-1 .sweep {
  animation: none;
}

.gen-1 .ring-outer {
  display: block;
  inset: 8%;
  border: 2px solid currentColor;
  background: none;
  opacity: 0.95;
  --gen1-ring-x: 0px;
  --gen1-ring-y: 0px;
  animation: gen1JitterRing 3.1s steps(2) infinite;
  animation-delay: 0.42s;
  transform: translate(var(--gen1-ring-x), var(--gen1-ring-y));
}

.gen-1 .cross {
  box-shadow: none;
  opacity: 0.9;
  background: none;
  --gen1-jx: 0px;
  --gen1-jy: 0px;
  animation-delay: 0.5s;
  animation: gen1JitterCross 3.1s steps(2) infinite;
  transform: translate(-50%, -50%) translate(var(--gen1-jx), var(--gen1-jy));
}

.gen-1 .cross-h {
  width: 100%;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    currentColor 0 4px,
    transparent 4px 10px
  );
}

.gen-1 .cross-v {
  height: 100%;
  width: 2px;
  background: repeating-linear-gradient(
    0deg,
    currentColor 0 4px,
    transparent 4px 10px
  );
}

.gen-1 .core {
  display: block;
  border-width: 1.5px;
  border-radius: 50%;
  box-shadow: none;
}

.gen-2 .ticks,
.gen-2 .sweep {
  display: none;
}

.gen-2 {
  color: #5cff8a;
}

.gen-2 .ring,
.gen-2 .cross,
.gen-2 .core {
  display: none;
}

.gen-2 .cross {
  display: block;
  opacity: 0.85;
  box-shadow: none;
  --gen2-float: 0px;
  animation: gen2Float 1.6s ease-in-out infinite;
}

.gen-2 .cross-h,
.gen-2 .cross-v {
  background: none;
}

.gen-2 .cross-h::before,
.gen-2 .cross-v::before {
  content: "";
  position: absolute;
  background: currentColor;
}

.gen-2 .cross-h::before {
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(calc(-50% + var(--gen2-float)));
  background: linear-gradient(
    to right,
    currentColor 0 30%,
    transparent 30% 70%,
    currentColor 70% 100%
  );
}

.gen-2 .cross-v::before {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%) translateY(var(--gen2-float));
  background: linear-gradient(
    to bottom,
    currentColor 0 30%,
    transparent 30% 70%,
    currentColor 70% 100%
  );
}

.gen-2 .cross-h {
  width: 90%;
}

.gen-2 .cross-v {
  height: 90%;
}

.gen-2 .corner {
  display: block;
  transform-origin: center;
  animation: cornerShrink 1.2s ease-in-out infinite;
}

.gen-2 .corner.tl { animation-delay: 0s; }
.gen-2 .corner.tr { animation-delay: 0s; }
.gen-2 .corner.br { animation-delay: 0s; }
.gen-2 .corner.bl { animation-delay: 0s; }

.gen-1 .corner,
.gen-Sp .corner,
.gen-3-5 .corner,
.gen-5 .corner,
.gen-5-5 .corner {
  display: none;
}

@keyframes cornerShrink {
  0% { transform: scale(1); opacity: 0.95; }
  50% { transform: scale(0.95); opacity: 1; }
  100% { transform: scale(1); opacity: 0.95; }
}

@keyframes gen2Float {
  0% { --gen2-float: 0px; }
  10% { --gen2-float: 1px; }
  20% { --gen2-float: 2px; }
  30% { --gen2-float: 3px; }
  40% { --gen2-float: 4px; }
  50% { --gen2-float: 4px; }
  60% { --gen2-float: 3px; }
  70% { --gen2-float: 2px; }
  80% { --gen2-float: 1px; }
  90% { --gen2-float: 0px; }
  100% { --gen2-float: 0px; }
}

.gen-9 {
  color: #ff8a3d;
  filter: drop-shadow(0 0 10px rgba(255, 138, 61, 0.6));
}

.gen-9 .ring,
.gen-9 .ticks,
.gen-9 .sweep,
.gen-9 .grid,
.gen-9 .halo,
.gen-9 .arc,
.gen-9 .cross,
.gen-9 .cross.small,
.gen-9 .core,
.gen-9 .tri {
  display: none;
}

.gen-9 .genSp-illust {
  display: block;
  filter: hue-rotate(200deg) saturate(1.35);
}

.gen-9 .genSp-tri {
  animation: genSpTriShrink 6s ease-in-out infinite;
  transform-origin: center;
}

.gen-9 .genSp-illust-wrap {
  display: block;
  animation: genSpSpin 6s linear infinite;
}

.gen-9 .tri-frame,
.gen-9 .tri-inner {
  display: none;
}

.gen-3-5 .ring-core {
  opacity: 1;
}

.gen-3-5 .ticks {
  opacity: 0.85;
}

.gen-3-5 .sweep {
  opacity: 0.55;
}

.gen-3-5 .ring-outer {
  border-width: 2px;
}

.gen-3-5 {
  color: #ff6b6b;
  filter: drop-shadow(0 0 12px rgba(255, 90, 90, 0.7));
}

.gen-3-5 .ring,
.gen-3-5 .ticks,
.gen-3-5 .sweep,
.gen-3-5 .hex-frame,
.gen-3-5 .scanline,
.gen-3-5 .grid,
.gen-3-5 .halo,
.gen-3-5 .arc,
.gen-3-5 .cross,
.gen-3-5 .cross.small,
.gen-3-5 .core,
.gen-3-5 .tri {
  display: none;
}

.gen-3-5 .gen4-outer,
.gen-3-5 .gen4-inner,
.gen-3-5 .gen4-arrows {
  display: block;
  opacity: 1;
}

/* 第4世代: 軽量な魔導制御を示す、細い二重円と3つの宝珠ノード。 */
.magitech-rings,
.magitech-jewels,
.demon-reticle {
  display: none;
}

.gen-4 {
  /* 第4世代のサイズ調整: 二重円・電子ノードを個別に変更できる。 */
  --magitech-outer-ring-scale: 1;
  --magitech-inner-ring-scale: 1;
  --magitech-node-size: 14px;
  --magitech-node-scale: 1;
  color: #58b8ff;
  filter: drop-shadow(0 0 10px rgba(73, 163, 255, 0.8));
}

.gen-4 .corner,
.gen-4 .ring,
.gen-4 .ticks,
.gen-4 .sweep,
.gen-4 .hex-frame,
.gen-4 .scanline,
.gen-4 .grid,
.gen-4 .halo,
.gen-4 .arc,
.gen-4 .cross,
.gen-4 .core,
.gen-4 .tri,
.gen-4 .gen4-outer,
.gen-4 .gen4-inner,
.gen-4 .gen4-arrows {
  display: none;
}

.gen-4 .magitech-rings,
.gen-4 .magitech-jewels {
  display: block;
}

.magitech-rings {
  position: absolute;
  inset: 0;
  animation: magitechRingPulse 2.4s ease-in-out infinite;
}

.magitech-ring {
  position: absolute;
  border: 1px solid currentColor;
  border-radius: 50%;
  box-shadow: 0 0 7px rgba(88, 184, 255, 0.7);
}

.magitech-ring-outer {
  inset: 0;
  transform: scale(var(--magitech-outer-ring-scale, 1));
}

.magitech-wave-path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.magitech-ring-inner {
  inset: 26%;
  border-color: rgba(125, 218, 255, 0.9);
  transform: scale(var(--magitech-inner-ring-scale, 1));
}

.magitech-jewels {
  position: absolute;
  inset: 0;
  animation: spin 9s linear infinite, magitechNodesPulse 2.4s ease-in-out infinite;
}

.magitech-jewel {
  position: absolute;
  width: var(--magitech-node-size, 14px);
  height: var(--magitech-node-size, 14px);
  border: 1px solid #bdefff;
  border-radius: 50%;
  background:
    radial-gradient(circle, #dffaff 0 12%, transparent 14% 39%, #58c6ff 42% 48%, transparent 51%),
    rgba(15, 85, 132, 0.28);
  box-shadow: 0 0 7px rgba(87, 201, 255, 0.75);
  transform: translate(-50%, -50%) scale(var(--magitech-node-scale, 1));
}

.magitech-jewel:nth-child(1) { top: 12%; left: 50%; }
.magitech-jewel:nth-child(2) { top: 69%; left: 17%; }
.magitech-jewel:nth-child(3) { top: 69%; left: 83%; }
.magitech-jewel:nth-child(4),
.magitech-jewel:nth-child(5) { display: none; }

/* 第4.5世代: 攻撃特化を示す、分割円と外向きの尖り。 */
.gen-4-5 {
  /* 第4.5世代のサイズ調整: 二重円・ノード・外側分割円・棘を個別に変更できる。 */
  --magitech-outer-ring-scale: 1;
  --magitech-inner-ring-scale: 1.2;
  --magitech-node-size: 14px;
  --magitech-node-scale: 1.1;
  --demon-reticle-scale: 0.85;
  --demon-point-scale: 1;
  color: #8e8cff;
  filter: drop-shadow(0 0 12px rgba(113, 105, 255, 0.9));
}

.gen-4-5 .corner,
.gen-4-5 .ring,
.gen-4-5 .ticks,
.gen-4-5 .sweep,
.gen-4-5 .hex-frame,
.gen-4-5 .scanline,
.gen-4-5 .grid,
.gen-4-5 .halo,
.gen-4-5 .arc,
.gen-4-5 .cross,
.gen-4-5 .core,
.gen-4-5 .tri,
.gen-4-5 .gen4-outer,
.gen-4-5 .gen4-inner,
.gen-4-5 .gen4-arrows {
  display: none;
}

.gen-4-5 .magitech-rings,
.gen-4-5 .magitech-jewels,
.gen-4-5 .demon-reticle {
  display: block;
}

.gen-4-5 .magitech-jewels {
  filter: hue-rotate(28deg) saturate(1.15);
  animation: spin 9s linear infinite;
}

.gen-4-5 .magitech-rings,
.gen-4-5 .demon-reticle {
  animation: none;
}

.gen-4-5 .magitech-jewel:nth-child(1) { top: 12%; left: 50%; }
.gen-4-5 .magitech-jewel:nth-child(2) { top: 39%; left: 85%; }
.gen-4-5 .magitech-jewel:nth-child(3) { top: 81%; left: 72%; }
.gen-4-5 .magitech-jewel:nth-child(4) { top: 81%; left: 28%; display: block; }
.gen-4-5 .magitech-jewel:nth-child(5) { top: 39%; left: 15%; display: block; }

.demon-reticle {
  position: absolute;
  inset: -6%;
  animation: demonReticlePulse 1.8s ease-in-out infinite;
  scale: var(--demon-reticle-scale, 1);
}

.demon-segment {
  position: absolute;
  inset: 0;
  border: 2px dashed currentColor;
  border-radius: 50%;
  box-shadow: 0 0 9px rgba(142, 140, 255, 0.75);
}

.demon-point {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #beb5ff;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  filter: drop-shadow(0 0 5px rgba(170, 154, 255, 0.95));
  scale: var(--demon-point-scale, 1);
}

.demon-point-top { top: 0; left: 50%; transform: translate(-50%, -100%); }
.demon-point-right { top: 50%; right: 0; transform: translate(100%, -50%) rotate(90deg); }
.demon-point-bottom { bottom: 0; left: 50%; transform: translate(-50%, 100%) rotate(180deg); }
.demon-point-left { top: 50%; left: 0; transform: translate(-100%, -50%) rotate(-90deg); }

@keyframes magitechRingPulse {
  0%, 100% { opacity: 0.7; transform: scale(0.96); }
  50% { opacity: 1; transform: scale(1.03); }
}

@keyframes magitechNodesPulse {
  0%, 100% { opacity: 0.7; scale: 0.96; }
  50% { opacity: 1; scale: 1.03; }
}

@keyframes demonReticlePulse {
  0%, 100% { opacity: 0.72; transform: translateY(0); }
  50% { opacity: 1; transform: scale(1.04); }
}

.gen-5 {
  color: #7ef6ff;
  filter: drop-shadow(0 0 10px rgba(120, 245, 255, 0.6));
  transform: scale(0.85);
  transform-origin: center;
}

.gen-5 .ring,
.gen-5 .ticks,
.gen-5 .sweep,
.gen-5 .cross,
.gen-5 .cross.small,
.gen-5 .core,
.gen-5 .tri,
.gen-5 .corner,
.gen-5 .hex-frame,
.gen-5 .scanline,
.gen-5 .grid,
.gen-5 .halo,
.gen-5 .arc,
.gen-5 .gen3-illust-wrap,
.gen-5 .gen4-outer,
.gen-5 .gen4-inner,
.gen-5 .gen4-arrows {
  display: none;
}

.gen-5 .orbit {
  display: block;
  opacity: 1;
  inset: -10%;
}

.gen-5 .orbit-2 {
  inset: 1%;
}

/* .gen-5 .orbit-3 {
  inset: 3%;
} */

.gen-5 .orbit-4 {
  inset: 3%;
}

.gen-5 .orbit-5 {
  display: block;
  inset: -25%;
}

.gen-5 .inner-ring {
  display: block;
  opacity: 0.2;
}

.gen-5 .inner-ring-thin {
  inset: 4%;
}

.gen-5 .inner-ring-thick {
  inset: 30%;
}

.gen-5 .outer-dots {
  display: block;
  opacity: 0.6;
  inset: -12%;
}

.gen-5-5 .ring-outer {
  display: none;
}

.gen-5-5 .ring-inner {
  display: none;
  inset: 22%;
  border-width: 1px;
  border-style: solid;
  opacity: 0.6;
  animation: spin 10s linear infinite;
}

.gen-5-5 .ring-core {
  display: none;
  /* inset: -16%;
  border-width: 1px;
  opacity: 0.7; */
}

.gen-5-5 .ticks,
.gen-5-5 .sweep,
.gen-5-5 .grid,
.gen-5-5 .inner-ring,
.gen-5-5 .orbit,
.gen-5-5 .outer-dots,
.gen-5-5 .core {
  display: none;
}

.gen-5-5 .arc {
  display: none;
}

.gen-5-5 .cross {
  display: block;
  background: none;
  box-shadow: none;
  opacity: 0.7;
  transform: translate(-50%, -50%) rotate(45deg);
}

.gen-5-5 .cross-h {
  width: 75%;
  height: 3px;
  background: repeating-linear-gradient(
    90deg,
    currentColor 0 2px,
    transparent 2px 8px
  );
  opacity: 0.4;
}

.gen-5-5 .cross-v {
  height: 75%;
  width: 3px;
  background: repeating-linear-gradient(
    0deg,
    currentColor 0 2px,
    transparent 2px 8px
  );
  opacity: 0.4;
}

.gen-5-5 .cross.small {
  display: none;
}

.gen-5-5 .ring-segment {
  display: block;
  opacity: 0.85;
  animation: spin 12s linear infinite;
  opacity: 0.7;
}

.gen-5-5 .corner {
  display: block;
  width: 18px;
  height: 18px;
  border: 3px solid currentColor;
  background: transparent;
  opacity: 0.8;
  transform-origin: center;
  --corner-rot: 0deg;
  animation: gen6CornerPulse 2.6s ease-in-out infinite;
}

.gen-5-5 .corner.tl {
  top: 4px;
  left: 4px;
  --corner-rot: 0deg;
  opacity: 0.7;
}

.gen-5-5 .corner.tr {
  top: 4px;
  right: 4px;
  --corner-rot: 90deg;
  opacity: 0.7;
}

.gen-5-5 .corner.bl {
  bottom: 4px;
  left: 4px;
  --corner-rot: 90deg;
  opacity: 0.7;
}

.gen-5-5 .corner.br {
  bottom: 4px;
  right: 4px;
  --corner-rot: 0deg;
  opacity: 0.7;
}

.gen-5-5 .center-x {
  opacity: 0.45;
}

.gen-5-5 .core {
  display: block;
  inset: 13%;
  border-width: 1px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
  opacity: 0.9;
}

.gen-5-5 {
  color: #9be7ff;
  filter: drop-shadow(0 0 12px rgba(155, 231, 255, 0.65));
}

.gen-3 .ring-outer,
.gen-3 .sweep {
  display: none;
}

.gen-sp {
  color: #ff3b30;
  filter: drop-shadow(0 0 10px rgba(255, 60, 60, 0.7));
}

.gen-sp .ring,
.gen-sp .ticks,
.gen-sp .sweep,
.gen-sp .hex-frame,
.gen-sp .scanline,
.gen-sp .grid,
.gen-sp .halo,
.gen-sp .arc,
.gen-sp .tri,
.gen-sp .gen3-illust-wrap,
.gen-sp .gen4-outer,
.gen-sp .gen4-inner,
.gen-sp .gen4-arrows {
  display: none;
}

.gen-sp .corner {
  display: block;
  width: 24px;
  height: 24px;
  border-width: 2px;
  opacity: 0.95;
}

.gen-sp .cross {
  box-shadow: none;
  opacity: 0.95;
  background: none;
}

.gen-sp .cross-h {
  width: 70%;
  height: 2px;
  background: none;
}

.gen-sp .cross-v {
  height: 70%;
  width: 2px;
  background: none;
}

.gen-sp .cross-h::before,
.gen-sp .cross-v::before {
  content: "";
  position: absolute;
  background: currentColor;
}

.gen-sp .cross-h::before {
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: linear-gradient(
    to right,
    currentColor 0 40%,
    transparent 40% 60%,
    currentColor 60% 100%
  );
}

.gen-sp .cross-v::before {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: linear-gradient(
    to bottom,
    currentColor 0 40%,
    transparent 40% 60%,
    currentColor 60% 100%
  );
}

.gen-sp .cross.small {
  display: none;
}

.gen-sp .core {  display: none;}

@keyframes pulse {
  0% { transform: scale(0.98); opacity: 0.8; }
  50% { transform: scale(1.03); opacity: 1; }
  100% { transform: scale(0.98); opacity: 0.8; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes gen6CornerPulse {
  0% { transform: rotate(var(--corner-rot)) skew(20deg, 20deg) scale(1); }
  50% { transform: rotate(var(--corner-rot)) skew(20deg, 20deg) scale(1.15); }
  100% { transform: rotate(var(--corner-rot)) skew(20deg, 20deg) scale(1); }
}
@keyframes genSpSpin {
  0% { transform: rotate(0deg); }
  8% { transform: rotate(120deg); }
  100% { transform: rotate(120deg); }
}

@keyframes genSpCircleExpand {
  0% { transform: scale(0.47); }
  50% { transform: scale(0.5); }
  100% { transform: scale(0.47); }
}

@keyframes genSpTriShrink {
  0% { transform: scale(1); }
  50% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

/* 第一世代の照準 */
@keyframes gen1JitterRing {
  0%  { --gen1-ring-x: 0px;  --gen1-ring-y: 0px; }

  /* 左下へ一気にブレる */
  5%  { --gen1-ring-x: -1px; --gen1-ring-y: 1px; }
  10% { --gen1-ring-x: -2px; --gen1-ring-y: 2px; }
  15% { --gen1-ring-x: -3px; --gen1-ring-y: 3px; }
  20% { --gen1-ring-x: -4px; --gen1-ring-y: 4px; }
  25% { --gen1-ring-x: -5px; --gen1-ring-y: 5px; } /* ピーク */

  /* 少し戻す（縦だけ） */
  30% { --gen1-ring-x: -5px; --gen1-ring-y: 3px; }

  /* 横方向へズレ */
  35% { --gen1-ring-x: -2px; --gen1-ring-y: 3px; }
  40% { --gen1-ring-x: 1px;  --gen1-ring-y: 3px; }
  45% { --gen1-ring-x: 4px;  --gen1-ring-y: 3px; }

  /* 上方向へ */
  50% { --gen1-ring-x: 4px;  --gen1-ring-y: 1px; }
  55% { --gen1-ring-x: 4px;  --gen1-ring-y: -1px; }
  60% { --gen1-ring-x: 4px;  --gen1-ring-y: -3px; }

  /* 減衰しながら戻る */
  65% { --gen1-ring-x: 2px;  --gen1-ring-y: -2px; }
  70% { --gen1-ring-x: 1px;  --gen1-ring-y: -1px; }
  75% { --gen1-ring-x: 0px;  --gen1-ring-y: -1px; }
  80% { --gen1-ring-x: 0px;  --gen1-ring-y: -0.5px; }

  /* 余韻 */
  90% { --gen1-ring-x: -0.5px; --gen1-ring-y: 0.2px; }
  100%{ --gen1-ring-x: 0px;    --gen1-ring-y: 0px; }
}
/* 第一世代の照準十字 */
@keyframes gen1JitterCross {
  0%  { --gen1-jx: 0px;  --gen1-jy: 0px; }

  /* 左下へ */
  5%  { --gen1-jx: -1px; --gen1-jy: 1px; }
  10% { --gen1-jx: -2px; --gen1-jy: 2px; }
  15% { --gen1-jx: -3px; --gen1-jy: 3px; }
  20% { --gen1-jx: -4px; --gen1-jy: 4px; }
  25% { --gen1-jx: -5px; --gen1-jy: 5px; }   /* 左下ピーク */

  /* 2pxだけ上（X固定） */
  30% { --gen1-jx: -5px; --gen1-jy: 3px; }

  /* 右へ移動（Yほぼ固定） */
  35% { --gen1-jx: -2px; --gen1-jy: 3px; }
  40% { --gen1-jx: 1px;  --gen1-jy: 3px; }
  45% { --gen1-jx: 4px;  --gen1-jy: 3px; }

  /* 上へ移動（X固定） */
  50% { --gen1-jx: 4px;  --gen1-jy: 1px; }
  55% { --gen1-jx: 4px;  --gen1-jy: -1px; }
  60% { --gen1-jx: 4px;  --gen1-jy: -3px; }

  /* 戻り */
  65% { --gen1-jx: 2px;  --gen1-jy: -2px; }
  70% { --gen1-jx: 1px;  --gen1-jy: -1px; }
  75% { --gen1-jx: 0px;  --gen1-jy: -1px; }
  80% { --gen1-jx: 0px;  --gen1-jy: -0.5px; }

  /* 余韻 */
  90% { --gen1-jx: -0.5px; --gen1-jy: 0.2px; }
  100%{ --gen1-jx: 0px;    --gen1-jy: 0px; }
}




</style>







