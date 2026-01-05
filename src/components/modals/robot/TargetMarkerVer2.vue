<template>
  <div class="target-marker-ver2" :style="rootStyle">
    <div class="outer">
      <div
        v-for="layer in outerLayers"
        :key="layer.key"
        class="outer-frame"
        :style="layer.style"
      ></div>
    </div>
    <div class="inner" :style="innerStyle">
      <div class="inner-frame" :style="innerFrameStyle"></div>
      <div class="cross-h"></div>
      <div class="cross-v"></div>
    </div>
    <div class="markers" :class="`markers-${markerType}`" :style="markersStyle">
      <div
        v-for="arrow in markerArrows"
        :key="arrow.key"
        class="marker-arrow"
        :style="arrow.style"
      ></div>
    </div>
    <div class="center" :class="`center-${centerShape}`"></div>
  </div>
  <div class="target-marker-controls">
    <label>
      外枠の形状
      <select v-model="outerShape">
        <option value="circle">丸</option>
        <option value="tri">三角</option>
        <option value="quad">四角</option>
        <option value="pent">五角</option>
        <option value="hex">六角</option>
      </select>
    </label>
    <label>
      外枠の重ね数
      <select v-model.number="outerCount">
        <option :value="1">1重</option>
        <option :value="2">2重</option>
        <option :value="3">3重</option>
      </select>
    </label>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  generation: {
    type: Number,
    default: 1
  }
})

const outerShape = ref('circle')
const outerCount = ref(1)
const outerLineWidth = ref(2)
const outerDashed = ref(false)
const outerGap = ref(6)
const innerShape = ref('circle')
const innerInset = ref(18)
const innerLineWidth = ref(2)
const innerDashed = ref(true)
const centerShape = ref('dot')
const centerSize = ref(18)
const centerLineWidth = ref(2)
const centerDotSize = ref(6)
const markerType = ref('ticks')
const markerCount = ref(24)
const markerInset = ref(8)
const markerLength = ref(8)
const markerWidth = ref(2)
const markerArrowSize = ref(7)
const color = ref('#62e6ff')
const glow = ref(0.45)
const size = ref(140)
const spin = ref(true)
const pulse = ref(true)
const spinDuration = ref(6)
const pulseDuration = ref(3)

const configByGeneration = generation => {
  switch (generation) {
    case 1:
      return {
        outerShape: 'quad',
        outerCount: 1,
        outerLineWidth: 2,
        outerDashed: false,
        innerShape: 'circle',
        innerInset: 22,
        innerLineWidth: 2,
        innerDashed: true,
        centerShape: 'dot',
        centerSize: 14,
        centerDotSize: 6,
        markerType: 'ticks',
        markerCount: 20,
        markerInset: 10,
        markerLength: 6,
        markerWidth: 2,
        color: '#bdbdbd',
        glow: 0,
        size: 140,
        spin: false,
        pulse: false
      }
    case 2:
      return {
        outerShape: 'quad',
        outerCount: 2,
        outerLineWidth: 2,
        outerDashed: false,
        innerShape: 'circle',
        innerInset: 20,
        innerLineWidth: 2,
        innerDashed: true,
        centerShape: 'dot',
        centerSize: 14,
        centerDotSize: 6,
        markerType: 'ticks',
        markerCount: 24,
        markerInset: 8,
        markerLength: 7,
        markerWidth: 2,
        color: '#5cff8a',
        glow: 0.25,
        size: 140,
        spin: true,
        pulse: true,
        spinDuration: 7,
        pulseDuration: 3.4
      }
    case 3:
      return {
        outerShape: 'circle',
        outerCount: 3,
        outerLineWidth: 2,
        outerDashed: false,
        innerShape: 'circle',
        innerInset: 18,
        innerLineWidth: 2,
        innerDashed: true,
        centerShape: 'circle',
        centerSize: 18,
        centerLineWidth: 2,
        markerType: 'ticks',
        markerCount: 28,
        markerInset: 7,
        markerLength: 8,
        markerWidth: 2,
        color: '#62e6ff',
        glow: 0.45,
        size: 140,
        spin: true,
        pulse: true,
        spinDuration: 6,
        pulseDuration: 3
      }
    default:
      return {
        outerShape: 'circle',
        outerCount: 2,
        outerLineWidth: 2,
        outerDashed: false,
        innerShape: 'circle',
        innerInset: 18,
        innerLineWidth: 2,
        innerDashed: true,
        centerShape: 'dot',
        centerSize: 16,
        centerDotSize: 6,
        markerType: 'ticks',
        markerCount: 24,
        markerInset: 8,
        markerLength: 7,
        markerWidth: 2,
        color: '#62e6ff',
        glow: 0.35,
        size: 140,
        spin: true,
        pulse: true,
        spinDuration: 6,
        pulseDuration: 3
      }
  }
}

watch(
  () => props.generation,
  generation => {
    const cfg = configByGeneration(generation)
    outerShape.value = cfg.outerShape
    centerShape.value = cfg.centerShape
    color.value = cfg.color
    size.value = cfg.size
    outerCount.value = cfg.outerCount ?? outerCount.value
    outerLineWidth.value = cfg.outerLineWidth ?? outerLineWidth.value
    outerDashed.value = cfg.outerDashed ?? outerDashed.value
    innerShape.value = cfg.innerShape ?? innerShape.value
    innerInset.value = cfg.innerInset ?? innerInset.value
    innerLineWidth.value = cfg.innerLineWidth ?? innerLineWidth.value
    innerDashed.value = cfg.innerDashed ?? innerDashed.value
    centerSize.value = cfg.centerSize ?? centerSize.value
    centerLineWidth.value = cfg.centerLineWidth ?? centerLineWidth.value
    centerDotSize.value = cfg.centerDotSize ?? centerDotSize.value
    markerType.value = cfg.markerType ?? markerType.value
    markerCount.value = cfg.markerCount ?? markerCount.value
    markerInset.value = cfg.markerInset ?? markerInset.value
    markerLength.value = cfg.markerLength ?? markerLength.value
    markerWidth.value = cfg.markerWidth ?? markerWidth.value
    markerArrowSize.value = cfg.markerArrowSize ?? markerArrowSize.value
    glow.value = cfg.glow ?? glow.value
    spin.value = cfg.spin ?? spin.value
    pulse.value = cfg.pulse ?? pulse.value
    spinDuration.value = cfg.spinDuration ?? spinDuration.value
    pulseDuration.value = cfg.pulseDuration ?? pulseDuration.value
  },
  { immediate: true }
)

const polygonForSides = sides => {
  const points = []
  const step = (Math.PI * 2) / sides
  for (let i = 0; i < sides; i += 1) {
    const angle = step * i - Math.PI / 2
    const x = 50 + 50 * Math.cos(angle)
    const y = 50 + 50 * Math.sin(angle)
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`)
  }
  return `polygon(${points.join(', ')})`
}

const clampInt = (value, min, max) => Math.max(min, Math.min(max, Math.round(value)))

const shapeClipPath = shape => {
  if (shape === 'circle') return 'none'
  if (shape === 'tri') return polygonForSides(3)
  if (shape === 'quad') return polygonForSides(4)
  if (shape === 'pent') return polygonForSides(5)
  if (shape === 'hex') return polygonForSides(6)
  return 'none'
}

const outerLayers = computed(() => {
  const layers = []
  const gap = outerGap.value
  const count = clampInt(outerCount.value, 1, 3)
  for (let i = 0; i < count; i += 1) {
    const inset = i * gap
    const shape = outerShape.value
    const style = {
      inset: `${inset}%`,
      borderWidth: `${outerLineWidth.value}px`,
      borderStyle: outerDashed.value ? 'dashed' : 'solid',
      borderRadius: shape === 'circle' ? '50%' : '6px',
      clipPath: shapeClipPath(shape)
    }
    layers.push({ key: `${shape}-${i}`, style })
  }
  return layers
})

const innerStyle = computed(() => ({
  inset: `${innerInset.value}%`
}))

const innerFrameStyle = computed(() => ({
  borderWidth: `${innerLineWidth.value}px`,
  borderStyle: innerDashed.value ? 'dashed' : 'solid',
  borderRadius: innerShape.value === 'circle' ? '50%' : '6px',
  clipPath: shapeClipPath(innerShape.value)
}))

const markersStyle = computed(() => {
  const count = clampInt(markerCount.value, 4, 48)
  const step = 360 / count
  const tickAngle = Math.max(1, Math.min(6, step * 0.28))
  const bg =
    markerType.value === 'ticks'
      ? `repeating-conic-gradient(from -90deg, currentColor 0deg ${tickAngle}deg, transparent ${tickAngle}deg ${step}deg)`
      : 'none'
  const length = Math.max(2, markerLength.value)
  const mask =
    markerType.value === 'ticks'
      ? `radial-gradient(circle, transparent 0%, transparent calc(100% - ${length}%), #000 calc(100% - ${length}%) 100%)`
      : 'none'
  return {
    inset: `${markerInset.value}%`,
    '--tm-marker-bg': bg,
    '--tm-marker-mask': mask,
    '--tm-marker-width': `${markerWidth.value}px`
  }
})

const markerArrows = computed(() => {
  if (markerType.value !== 'arrows') return []
  const count = clampInt(markerCount.value, 3, 12)
  const step = 360 / count
  return Array.from({ length: count }, (_, index) => ({
    key: `arrow-${index}`,
    style: {
      '--tm-marker-rotate': `${index * step}deg`
    }
  }))
})

const rootStyle = computed(() => ({
  '--tm-color': color.value,
  '--tm-size': `${size.value}px`,
  '--tm-spin': spin.value ? 'running' : 'paused',
  '--tm-pulse': pulse.value ? 'running' : 'paused',
  '--tm-spin-duration': `${spinDuration.value}s`,
  '--tm-pulse-duration': `${pulseDuration.value}s`,
  '--tm-center-size': `${centerSize.value}px`,
  '--tm-center-line': `${centerLineWidth.value}px`,
  '--tm-center-dot-size': `${centerDotSize.value}px`,
  '--tm-marker-arrow-size': `${markerArrowSize.value}px`,
  '--tm-glow': glow.value
}))
</script>

<style scoped>
.target-marker-ver2 {
  width: var(--tm-size);
  height: var(--tm-size);
  position: relative;
  color: var(--tm-color);
  filter: drop-shadow(0 0 calc(12px * var(--tm-glow)) var(--tm-color));
}

.outer,
.inner,
.center,
.markers {
  position: absolute;
  inset: 0;
}

.outer-frame {
  position: absolute;
  border-color: currentColor;
  animation: tmSpin var(--tm-spin-duration) linear infinite;
  animation-play-state: var(--tm-spin);
  box-sizing: border-box;
}

.inner {
  animation: tmPulse var(--tm-pulse-duration) ease-in-out infinite;
  animation-play-state: var(--tm-pulse);
}

.inner-frame {
  position: absolute;
  inset: 0;
  border-color: currentColor;
  box-sizing: border-box;
}

.cross-h,
.cross-v {
  position: absolute;
  background: none;
}

.cross-h {
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: repeating-linear-gradient(
    90deg,
    currentColor 0 6px,
    transparent 6px 12px
  );
}

.cross-v {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: repeating-linear-gradient(
    0deg,
    currentColor 0 6px,
    transparent 6px 12px
  );
}

.center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--tm-center-size);
  height: var(--tm-center-size);
  transform: translate(-50%, -50%);
}

.center-circle {
  border: var(--tm-center-line) solid currentColor;
  border-radius: 50%;
}

.center-square {
  border: var(--tm-center-line) solid currentColor;
}

.center-dot {
  width: var(--tm-center-dot-size);
  height: var(--tm-center-dot-size);
  background: currentColor;
  border-radius: 50%;
}

.markers {
  pointer-events: none;
  border-radius: 50%;
  box-sizing: border-box;
}

.markers-ticks {
  background: var(--tm-marker-bg);
  mask: var(--tm-marker-mask);
}

.markers-arrows .marker-arrow {
  position: absolute;
  inset: 0;
  transform: rotate(var(--tm-marker-rotate));
}

.markers-arrows .marker-arrow::before {
  content: "";
  position: absolute;
  top: var(--tm-marker-width);
  left: 50%;
  width: 0;
  height: 0;
  border-left: calc(var(--tm-marker-arrow-size) * 0.6) solid transparent;
  border-right: calc(var(--tm-marker-arrow-size) * 0.6) solid transparent;
  border-bottom: var(--tm-marker-arrow-size) solid currentColor;
  transform: translateX(-50%);
}

@keyframes tmSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes tmPulse {
  0% { transform: scale(1); }
  50% { transform: scale(0.94); }
  100% { transform: scale(1); }
}

.target-marker-controls {
  margin-top: 8px;
  display: grid;
  gap: 8px;
  color: var(--tm-color);
  font-family: Consolas, monospace;
  font-size: 12px;
}

.target-marker-controls label {
  display: grid;
  gap: 4px;
}

.target-marker-controls select {
  background: #0b1622;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  padding: 4px 6px;
}
</style>
