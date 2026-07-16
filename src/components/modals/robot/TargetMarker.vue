<template>
  <div class="target-marker" :class="[generationClass, `type-${markerType}`, { 'is-target-moving': isTargetMoving }]">
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>
    <div class="ring ring-outer"></div>
    <div class="ring ring-inner"></div>
    <div class="ring ring-core"></div>
    <div v-if="Number(generation) === 2.5" class="jammer-target-marker" aria-hidden="true">
      <span class="jammer-arc jammer-arc-a"></span>
      <span class="jammer-arc jammer-arc-b"></span>
      <span class="jammer-arc jammer-arc-c"></span>
      <span class="jammer-noise jammer-noise-a"></span>
      <span class="jammer-noise jammer-noise-b"></span>
      <span class="jammer-noise jammer-noise-c"></span>
      <span class="jammer-pointer jammer-pointer-top"></span>
      <span class="jammer-pointer jammer-pointer-right"></span>
      <span class="jammer-pointer jammer-pointer-bottom"></span>
      <span class="jammer-pointer jammer-pointer-left"></span>
      <span class="jammer-center-point"></span>
    </div>
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
    <div v-if="Number(generation) === 3.5" class="gen35-upgrade" aria-hidden="true">
      <span class="gen35-outer-ring"></span>
      <span class="gen35-tick-ring"></span>
      <span class="gen35-segment-ring"></span>
      <span class="gen35-core"></span>
      <span class="gen35-pointer gen35-pointer-top"></span>
      <span class="gen35-pointer gen35-pointer-right"></span>
      <span class="gen35-pointer gen35-pointer-bottom"></span>
      <span class="gen35-pointer gen35-pointer-left"></span>
    </div>
    <div class="magitech-rings">
      <svg class="magitech-ring magitech-ring-outer" viewBox="0 0 140 140" aria-hidden="true">
        <path
          v-if="isMagitechGeneration"
          v-for="(path, index) in magitechLinkWavePaths"
          :key="index"
          class="magitech-wave-path"
          :d="path"
          :style="magitechLinkStyle(index)"
        />
      </svg>
      <span class="magitech-ring magitech-ring-inner"></span>
    </div>
    <div class="magitech-jewels">
      <template v-if="isMagitechGeneration">
        <span
          v-for="(node, index) in magitechNodes"
          :key="index"
          class="magitech-jewel"
          :style="magitechNodeStyle(node)"
        ></span>
      </template>
    </div>
    <div class="demon-reticle">
      <span class="demon-segment"></span>
      <span class="demon-point demon-point-top"></span>
      <span class="demon-point demon-point-right"></span>
      <span class="demon-point demon-point-bottom"></span>
      <span class="demon-point demon-point-left"></span>
    </div>
    <div v-if="Number(generation) === 4.5" class="demon-eye-target" aria-hidden="true">
      <span class="demon-eye-iris"></span>
      <span class="demon-eye-pupil"></span>
    </div>
    <div v-if="Number(generation) === 4" class="magitech-center-dot" aria-hidden="true"></div>
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
    <div v-if="isAngelGeneration" class="angel-marker" aria-hidden="true">
      <span class="angel-crown"></span>
      <span class="angel-halo angel-halo-outer"></span>
      <span class="angel-halo angel-halo-middle"></span>
      <span class="angel-halo angel-halo-inner"></span>
      <span class="angel-wing angel-wing-left angel-wing-1"></span>
      <span class="angel-wing angel-wing-left angel-wing-2"></span>
      <span class="angel-wing angel-wing-left angel-wing-3"></span>
      <span class="angel-wing angel-wing-right angel-wing-1"></span>
      <span class="angel-wing angel-wing-right angel-wing-2"></span>
      <span class="angel-wing angel-wing-right angel-wing-3"></span>
      <span class="angel-node angel-node-top"></span>
      <span class="angel-node angel-node-right"></span>
      <span class="angel-node angel-node-bottom"></span>
      <span class="angel-node angel-node-left"></span>
      <span class="angel-core">
        <svg class="angel-core-star" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 2 C56 32 61 39 98 50 C61 61 56 68 50 98 C44 68 39 61 2 50 C39 39 44 32 50 2 Z" />
        </svg>
        <span class="angel-core-dot"></span>
      </span>
    </div>
    <div v-if="markerType === 'tactical'" class="tactical-marker" aria-hidden="true">
      <span class="tactical-corner tactical-corner-tl"></span>
      <span class="tactical-corner tactical-corner-tr"></span>
      <span class="tactical-corner tactical-corner-bl"></span>
      <span class="tactical-corner tactical-corner-br"></span>
      <span class="tactical-range tactical-range-top"></span>
      <span class="tactical-range tactical-range-bottom"></span>
      <span class="tactical-cross"></span>
    </div>
    <div v-if="markerType === 'diamond'" class="diamond-marker" aria-hidden="true">
      <span class="diamond-frame diamond-frame-outer"></span>
      <span class="diamond-frame diamond-frame-inner"></span>
      <span class="diamond-dot diamond-dot-top"></span>
      <span class="diamond-dot diamond-dot-right"></span>
      <span class="diamond-dot diamond-dot-bottom"></span>
      <span class="diamond-dot diamond-dot-left"></span>
      <span class="diamond-core"></span>
    </div>
    <div v-if="markerType === 'radar'" class="radar-marker" aria-hidden="true">
      <span class="radar-ring radar-ring-outer"></span>
      <span class="radar-ring radar-ring-inner"></span>
      <span class="radar-sweep"></span>
      <span class="radar-line radar-line-h"></span>
      <span class="radar-line radar-line-v"></span>
      <span class="radar-core"></span>
    </div>
    <div v-if="markerType === 'rift'" class="rift-marker" aria-hidden="true">
      <span class="rift-frame rift-frame-outer"></span>
      <span class="rift-frame rift-frame-inner"></span>
      <span class="rift-spike rift-spike-top"></span>
      <span class="rift-spike rift-spike-right"></span>
      <span class="rift-spike rift-spike-bottom"></span>
      <span class="rift-spike rift-spike-left"></span>
      <span class="rift-core"></span>
    </div>
    <div
      v-if="markerType === 'custom'"
      class="custom-marker"
      :style="customMarkerStyle"
      aria-hidden="true"
    >
      <div class="custom-marker-motion">
        <span
          v-for="ring in customRings"
          :key="ring.id"
          class="custom-marker-ring-orbit"
          :class="[
            {
              'is-animated': isCustomRingAnimated(ring) && isCustomRingRotationEnabled(ring),
              'is-hidden': ring.visible === false
            }
          ]"
          :style="getCustomRingMotionStyle(ring)"
        >
          <span
            class="custom-marker-ring-highlight"
            :class="{ 'is-editor-highlighted': ring.id === highlightRingId }"
          >
          <span
            class="custom-marker-ring"
            :class="[
              `is-mode-${getCustomRenderMode(ring)}`,
              getCustomRingSplitDirection(ring),
              {
                'is-layout-arc': isCustomCircumference(ring),
                'is-animated': isCustomRingAnimated(ring) && isCustomRingPulseEnabled(ring)
              }
            ]"
            :style="getCustomRingStyle(ring)"
          >
            <svg
              v-if="getCustomRenderMode(ring) === 'segmentedArc'"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              class="custom-marker-ring-segment custom-special-layer"
              :class="getCustomSegmentAnimationClasses(ring)"
              :style="getCustomSegmentedArcStyle(ring)"
            >
              <ellipse class="custom-segment-line" cx="50" cy="50" rx="46" ry="46" pathLength="100" />
              <ellipse
                v-if="ring.lineStyle === 'double'"
                class="custom-segment-line custom-segment-line-inner"
                cx="50"
                cy="50"
                rx="40"
                ry="40"
                pathLength="100"
              />
            </svg>
            <svg
              v-else-if="getCustomRenderMode(ring) === 'connection'"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              class="custom-marker-ring-segment custom-special-layer"
              :class="getCustomSegmentAnimationClasses(ring)"
              :style="getCustomConnectionStyle(ring)"
            >
              <path class="custom-segment-fill" :d="getCustomConnectionPath(ring)" />
              <path class="custom-segment-line" :d="getCustomConnectionPath(ring)" />
              <path
                v-if="ring.lineStyle === 'double'"
                class="custom-segment-line custom-segment-line-inner"
                :d="getCustomConnectionPath(ring)"
              />
            </svg>
            <svg
              v-else
              v-for="segmentIndex in getCustomRenderCount(ring)"
              :key="segmentIndex"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              class="custom-marker-ring-segment"
              :class="[`custom-shape-${ring.shape || customMarkerAppearance.shape}`, getCustomSegmentAnimationClasses(ring)]"
              :style="getCustomRingSegmentStyle(ring, segmentIndex - 1)"
            >
              <path
                class="custom-segment-fill"
                :d="getCustomShapePath(ring.shape || customMarkerAppearance.shape)"
              />
              <path
                class="custom-segment-line"
                :d="getCustomShapePath(ring.shape || customMarkerAppearance.shape)"
              />
              <path
                v-if="ring.lineStyle === 'double'"
                class="custom-segment-line custom-segment-line-inner"
                :d="getCustomShapePath(ring.shape || customMarkerAppearance.shape)"
              />
            </svg>
          </span>
          </span>
        </span>
      </div>
      <span v-if="customMarkerAppearance.showCenterDot" class="custom-marker-core"></span>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getUillust } from '@/constants/statData.js'

const props = defineProps({
  generation: {
    type: [Number, String],
    default: 1
  },
  markerType: {
    type: String,
    default: 'standard'
  },
  gen4MagitechNodeSettings: {
    type: Array,
    default: () => []
  },
  gen45MagitechNodeSettings: {
    type: Array,
    default: () => []
  },
  isTargetMoving: {
    type: Boolean,
    default: false
  },
  customMarkerSettings: {
    type: Object,
    default: () => ({})
  },
  highlightRingId: {
    type: [String, Number],
    default: null
  }
})

const generationClass = computed(() => `gen-${String(props.generation).replace('.', '-')}`)
const isAngelGeneration = computed(() =>
  props.markerType === 'angel' && [5, 5.5].includes(Number(props.generation))
)

const CUSTOM_MARKER_DEFAULTS = {
  shape: 'circle',
  color: '#8fefff',
  size: 100,
  opacity: 88,
  ringCount: 2,
  lineWidth: 2,
  rotationSeconds: 8,
  showCenterDot: true,
  rings: []
}

const customMarkerSettings = computed(() => ({
  ...CUSTOM_MARKER_DEFAULTS,
  ...props.customMarkerSettings
}))
const customMarkerAppearance = computed(() => {
  const state = props.isTargetMoving ? 'moving' : 'idle'
  return {
    shape: customMarkerSettings.value.shape,
    size: customMarkerSettings.value.size,
    opacity: customMarkerSettings.value.opacity,
    showCenterDot: customMarkerSettings.value.showCenterDot,
    ...(customMarkerSettings.value.appearance?.[state] || {})
  }
})
const customRings = computed(() => {
  const configuredRings = customMarkerSettings.value.rings
  if (Array.isArray(configuredRings) && configuredRings.length > 0) {
    const state = props.isTargetMoving ? 'moving' : 'idle'
    return configuredRings.map(ring => ({
      ...ring,
      ...(ring.appearance?.[state] || {})
    }))
  }

  const count = Math.min(8, Math.max(1, Number(customMarkerSettings.value.ringCount) || 1))
  return Array.from({ length: count }, (_, index) => ({
    id: `legacy-ring-${index + 1}`,
    color: customMarkerSettings.value.color,
    size: 100 - index * 18,
    opacity: 100,
    lineWidth: customMarkerSettings.value.lineWidth,
    shape: customMarkerSettings.value.shape,
    lineStyle: 'solid',
    splitCount: 1,
    splitGap: 0,
    layout: 'straight',
    arcSpread: 90,
    arcRadius: 45,
    arcAngle: 270,
    arcOrientation: 'tangent',
    glow: 7,
    visible: true,
    motion: {
      idle: {
        enabled: true,
        rotateEnabled: index === 0,
        pulseEnabled: false,
        repeat: true,
        rotateDuration: customMarkerSettings.value.rotationSeconds,
        pulseDuration: 3,
        direction: 'normal',
        delay: 0,
        pulseAmount: 18
      },
      moving: {
        enabled: true,
        rotateEnabled: index === 0,
        pulseEnabled: false,
        repeat: true,
        rotateDuration: customMarkerSettings.value.rotationSeconds,
        pulseDuration: 3,
        direction: 'normal',
        delay: 0,
        pulseAmount: 18
      }
    }
  }))
})
const customMarkerStyle = computed(() => ({
  '--custom-marker-color': customMarkerSettings.value.color,
  '--custom-marker-size': `${Math.min(180, Math.max(40, Number(customMarkerAppearance.value.size) || 100))}%`,
  '--custom-marker-opacity': String(Math.min(100, Math.max(10, Number(customMarkerAppearance.value.opacity) || 88)) / 100),
  '--custom-morph-duration': `${Math.max(0, Number(props.isTargetMoving
    ? customMarkerSettings.value.transition?.morphInDuration
    : customMarkerSettings.value.transition?.morphOutDuration) || 0)}ms`,
  '--custom-morph-easing': ['linear', 'ease-in', 'ease-out', 'ease-in-out'].includes(customMarkerSettings.value.transition?.easing)
    ? customMarkerSettings.value.transition.easing
    : 'ease-in-out'
}))
const getCustomRingMotion = ring => {
  const state = props.isTargetMoving ? 'moving' : 'idle'
  if (ring.motion?.[state]) return ring.motion[state]

  const trigger = ring.animationTrigger || 'always'
  return {
    enabled: trigger === 'always' || (trigger === 'moving' && props.isTargetMoving),
    rotateEnabled: typeof ring.rotateEnabled === 'boolean' ? ring.rotateEnabled : ring.animationType === 'rotate',
    pulseEnabled: typeof ring.pulseEnabled === 'boolean' ? ring.pulseEnabled : ring.animationType === 'pulse',
    rotateDuration: Number(ring.rotateDuration) || Number(ring.duration) || 8,
    pulseDuration: Number(ring.pulseDuration) || Number(ring.duration) || 3,
    direction: ring.direction,
    delay: ring.delay,
    pulseAmount: ring.pulseAmount,
    repeat: ring.repeat
  }
}
const isCustomRingAnimated = ring => getCustomRingMotion(ring).enabled !== false
const isCustomRingRotationEnabled = ring => getCustomRingMotion(ring).rotateEnabled === true
const isCustomRingPulseEnabled = ring => getCustomRingMotion(ring).pulseEnabled === true
const getCustomRingSplitCount = ring => Math.min(8, Math.max(1, Number(ring.splitCount) || 1))
const CUSTOM_RENDER_MODES = new Set(['continuous', 'segmentedArc', 'circumference', 'free', 'center', 'connection'])
const getCustomRenderMode = ring => CUSTOM_RENDER_MODES.has(ring.renderMode)
  ? ring.renderMode
  : ring.layout === 'arc' ? 'circumference' : 'continuous'
const getCustomRenderCount = ring => ['circumference'].includes(getCustomRenderMode(ring))
  ? getCustomRingSplitCount(ring)
  : 1
const isCustomCircumference = ring => getCustomRenderMode(ring) === 'circumference'
const getCustomSegmentAnimationClasses = ring => ({
  'is-sequenced': isCustomRingAnimated(ring) && getCustomRingMotion(ring).segmentSequenceEnabled,
  'is-glow-animated': isCustomRingAnimated(ring) && getCustomRingMotion(ring).glowEnabled,
  'is-fill-pulsing': ring.fillEnabled && isCustomRingAnimated(ring) && getCustomRingMotion(ring).fillPulseEnabled,
  'is-line-flowing': isCustomRingAnimated(ring) && getCustomRingMotion(ring).lineFlowEnabled
})
const CUSTOM_SHAPE_PATHS = {
  circle: 'M50 4 A46 46 0 1 1 49.99 4 Z',
  square: 'M5 5 H95 V95 H5 Z',
  triangle: 'M50 5 L95 92 H5 Z',
  diamond: 'M50 4 L96 50 L50 96 L4 50 Z',
  line: 'M6 50 H94',
  cross: 'M50 7 V93 M7 50 H93',
  corner: 'M92 38 V8 H62',
  cornerFrame: 'M5 30 V5 H30 M70 5 H95 V30 M95 70 V95 H70 M30 95 H5 V70',
  arc: 'M8 68 A46 46 0 0 1 92 68',
  tick: 'M50 5 V30',
  star: 'M50 4 L61 36 L95 36 L68 56 L78 90 L50 70 L22 90 L32 56 L5 36 L39 36 Z',
  sparkle: 'M50 3 C56 35 65 44 97 50 C65 56 56 65 50 97 C44 65 35 56 3 50 C35 44 44 35 50 3 Z',
  arrow: 'M5 34 H55 V14 L96 50 L55 86 V66 H5 Z',
  arrowhead: 'M12 8 L92 50 L12 92 L34 50 Z',
  sector: 'M50 50 L50 5 A45 45 0 0 1 95 50 Z',
  // G5/G5.5のorbitと同じ、二つの長い円弧と欠けで構成するリング。
  wave: 'M50 4 A46 46 0 1 1 49.99 4 Z'
}
const getCustomMagitechWavePath = () => {
  const pointCount = 96
  const waveCount = 12
  const points = []
  for (let index = 0; index <= pointCount; index += 1) {
    const progress = index / pointCount
    const wavePosition = progress * waveCount
    const waveIndex = Math.floor(wavePosition)
    const waveProgress = wavePosition - waveIndex
    const interpolation = (1 - Math.cos(waveProgress * Math.PI)) / 2
    const random = seededUnit(20, waveIndex) * (1 - interpolation)
      + seededUnit(20, waveIndex + 1) * interpolation
    const amplitude = 2.2 + random * 3.2
    const phase = magitechLinkWavePhase.value * (0.75 + random * 0.55) + random * Math.PI * 2
    const radius = 42 + Math.sin(progress * Math.PI * 2 * waveCount + phase) * amplitude
    const angle = -Math.PI / 2 + progress * Math.PI * 2
    points.push([50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius])
  }
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') + ' Z'
}
const getCustomShapePath = shape => shape === 'magitechWave'
  ? getCustomMagitechWavePath()
  : CUSTOM_SHAPE_PATHS[shape] || CUSTOM_SHAPE_PATHS.circle
const getCustomRingSplitDirection = ring => {
  const legacySize = Number(ring.size) || 100
  const width = Number(ring.width) || legacySize
  const height = Number(ring.height) || legacySize
  return width >= height ? 'is-split-horizontal' : 'is-split-vertical'
}
const getCustomSegmentVisualStyle = (ring, index = 0) => {
  const count = getCustomRingSplitCount(ring)
  const motion = getCustomRingMotion(ring)
  const segmentColor = ring.useSegmentColors
    ? ring.segmentColors?.[index] || ring.color || customMarkerSettings.value.color
    : ring.color || customMarkerSettings.value.color
  const lineStyle = ring.lineStyle || 'solid'
  const flowing = motion.lineFlowEnabled === true
  return {
    '--custom-segment-color': segmentColor,
    '--custom-segment-fill': ring.fillColor || segmentColor,
    '--custom-segment-fill-opacity': String(ring.fillEnabled ? Math.min(100, Math.max(0, Number(ring.fillOpacity) || 0)) / 100 : 0),
    '--custom-segment-dash': ring.shape === 'wave' ? '96 48 96 48' : flowing ? '14 8' : lineStyle === 'dashed' ? '14 8' : lineStyle === 'dotted' ? '2 7' : 'none',
    '--custom-segment-delay': `${index * Math.max(0.1, Number(motion.segmentSequenceDuration) || 2) / count}s`
  }
}
const getCustomRingSegmentStyle = (ring, index) => {
  const legacySize = Number(ring.size) || 100
  const width = Math.min(140, Math.max(10, Number(ring.width) || legacySize))
  const height = Math.min(140, Math.max(10, Number(ring.height) || legacySize))
  const count = getCustomRingSplitCount(ring)
  const commonStyle = getCustomSegmentVisualStyle(ring, index)

  if (!isCustomCircumference(ring)) {
    // 正形化は「分割片」のための設定。1個の形状へ適用すると、
    // 縦横比を変更した際にSVGだけが正方形であふれて中心がずれる。
    if (count <= 1) return commonStyle
    if (ring.evenSpacing && count > 1) {
      const spacingRatio = Math.min(60, Math.max(0, Number(ring.spacingRatio) || 0))
      const segmentRatio = (100 - spacingRatio) / count
      if (width >= height) {
        if (!ring.equalizeSegments) {
          return { ...commonStyle, flex: '0 0 auto', width: `${segmentRatio}%`, height: '100%' }
        }
        const side = Math.min(height, width * segmentRatio / 100)
        return {
          ...commonStyle,
          flex: '0 0 auto',
          width: `${side / width * 100}%`,
          height: `${side / height * 100}%`,
          aspectRatio: '1'
        }
      }
      if (!ring.equalizeSegments) {
        return { ...commonStyle, flex: '0 0 auto', width: '100%', height: `${segmentRatio}%` }
      }
      const side = Math.min(width, height * segmentRatio / 100)
      return {
        ...commonStyle,
        flex: '0 0 auto',
        width: `${side / width * 100}%`,
        height: `${side / height * 100}%`,
        aspectRatio: '1'
      }
    }
    if (!ring.equalizeSegments) return commonStyle
    return width >= height
      ? { ...commonStyle, width: 'auto', height: '100%', aspectRatio: '1', justifySelf: 'center' }
      : { ...commonStyle, width: '100%', height: 'auto', aspectRatio: '1', alignSelf: 'center' }
  }

  const radius = Math.min(70, Math.max(0, Number(ring.arcRadius) || 0))
  const spread = Math.min(360, Math.max(0, Number(ring.arcSpread) || 0))
  const centerAngle = Math.min(359, Math.max(0, Number(ring.arcAngle) || 0))
  const progress = count <= 1 ? 0 : index / (count - 1) - 0.5
  const angle = (ring.evenSpacing || spread >= 360) && count > 1
    ? centerAngle + 360 * index / count
    : centerAngle + spread * progress
  const radians = angle * Math.PI / 180
  let segmentWidth = width >= height ? width / count : width
  let segmentHeight = width >= height ? height : height / count
  if (ring.equalizeSegments) {
    const side = width >= height ? segmentHeight : segmentWidth
    segmentWidth = side
    segmentHeight = side
  }
  const shapeAngle = Math.min(359, Math.max(0, Number(ring.angle) || 0))
  const orientation = ['tangent', 'radial', 'fixed'].includes(ring.arcOrientation)
    ? ring.arcOrientation
    : 'tangent'
  const orientationAngle = orientation === 'fixed'
    ? 0
    : orientation === 'radial'
      ? angle
      : angle + 90

  return {
    ...commonStyle,
    left: `calc(50% + ${Math.cos(radians) * radius}%)`,
    top: `calc(50% + ${Math.sin(radians) * radius}%)`,
    width: `${segmentWidth}%`,
    height: `${segmentHeight}%`,
    translate: '-50% -50%',
    rotate: `${orientationAngle + shapeAngle}deg`
  }
}
const getCustomSegmentedArcStyle = ring => {
  const count = getCustomRingSplitCount(ring)
  const segmentLength = 100 / count
  const requestedGap = Math.max(0.5, Number(ring.splitGap) || 2)
  const gap = Math.min(segmentLength * 0.8, requestedGap)
  return {
    ...getCustomSegmentVisualStyle(ring),
    '--custom-segment-dash': `${Math.max(0.5, segmentLength - gap)} ${gap}`
  }
}
const getCustomConnectionPath = ring => {
  const count = Math.max(2, getCustomRingSplitCount(ring))
  const radius = Math.min(45, Math.max(2, Number(ring.arcRadius) || 45) / 70 * 45)
  const startAngle = (Number(ring.arcAngle) || 270) * Math.PI / 180
  const points = Array.from({ length: count }, (_, index) => {
    const angle = startAngle + Math.PI * 2 * index / count
    return [50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius]
  })
  const path = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  return ring.connectionClosed === false ? path : `${path} Z`
}
const getCustomConnectionStyle = ring => getCustomSegmentVisualStyle(ring)
const getCustomRingStyle = ring => {
  const motion = getCustomRingMotion(ring)
  const legacySize = Number(ring.size) || 100
  const width = Math.min(140, Math.max(10, Number(ring.width) || legacySize))
  const height = Math.min(140, Math.max(10, Number(ring.height) || legacySize))
  const angle = Math.min(359, Math.max(0, Number(ring.angle) || 0))
  const offsetX = Math.min(50, Math.max(-50, Number(ring.offsetX) || 0))
  const offsetY = Math.min(50, Math.max(-50, Number(ring.offsetY) || 0))
  const opacity = Math.min(100, Math.max(0, Number(ring.opacity) || 100))
  const glow = Math.min(30, Math.max(0, Number(ring.glow) || 0))
  const splitCount = getCustomRingSplitCount(ring)
  const renderCount = getCustomRenderCount(ring)
  const splitGap = Math.min(20, Math.max(0, Number(ring.splitGap) || 0))
  const color = ring.color || customMarkerSettings.value.color
  const glowColor = ring.glowColor || color
  const mode = getCustomRenderMode(ring)
  const isArc = mode === 'circumference'
  const isCentered = ['continuous', 'segmentedArc', 'center', 'connection'].includes(mode)
  const useEvenSpacing = !isArc && ring.evenSpacing && renderCount > 1
  return {
    left: isArc ? '0' : `calc(50% + ${isCentered ? 0 : offsetX}%)`,
    top: isArc ? '0' : `calc(50% + ${isCentered ? 0 : offsetY}%)`,
    width: isArc ? '100%' : `${width}%`,
    height: isArc ? '100%' : `${height}%`,
    opacity: String(opacity / 100),
    display: isArc ? 'block' : useEvenSpacing ? 'flex' : 'grid',
    flexDirection: useEvenSpacing ? width >= height ? 'row' : 'column' : undefined,
    justifyContent: useEvenSpacing ? 'space-evenly' : undefined,
    alignItems: useEvenSpacing ? 'center' : undefined,
    gap: isArc || useEvenSpacing ? '0' : `${splitGap}px`,
    gridTemplateColumns: isArc || useEvenSpacing ? undefined : width >= height ? `repeat(${renderCount}, minmax(0, 1fr))` : 'minmax(0, 1fr)',
    gridTemplateRows: isArc || useEvenSpacing ? undefined : width >= height ? 'minmax(0, 1fr)' : `repeat(${renderCount}, minmax(0, 1fr))`,
    '--custom-ring-color': color,
    '--custom-ring-line-width': `${Math.min(8, Math.max(1, Number(ring.lineWidth) || 2))}px`,
    '--custom-ring-glow-color': glowColor,
    '--custom-ring-glow-size': `${glow}px`,
    '--custom-ring-pulse-amount': String(Math.min(45, Math.max(2, Number(motion.pulseAmount) || 18)) / 100),
    translate: isArc ? 'none' : '-50% -50%',
    rotate: isArc ? 'none' : `${angle}deg`
  }
}
const getCustomRingMotionStyle = ring => {
  const motion = getCustomRingMotion(ring)
  return {
    '--custom-ring-rotate-duration': `${Math.max(0.4, Number(motion.rotateDuration) || 8)}s`,
    '--custom-ring-pulse-duration': `${Math.max(0.4, Number(motion.pulseDuration) || 3)}s`,
    '--custom-ring-iteration': motion.repeat === false ? '1' : 'infinite',
    '--custom-ring-direction': motion.direction === 'reverse' ? 'reverse' : 'normal',
    '--custom-ring-delay': `${Math.max(0, Number(motion.delay) || 0)}s`,
    '--custom-glow-min': `${Math.max(0, Number(motion.glowMin) || 0)}px`,
    '--custom-glow-max': `${Math.max(0, Number(motion.glowMax) || 14)}px`,
    '--custom-glow-duration': `${Math.max(0.2, Number(motion.glowDuration) || 2)}s`,
    '--custom-sequence-duration': `${Math.max(0.2, Number(motion.segmentSequenceDuration) || 2)}s`,
    '--custom-line-flow-duration': `${Math.max(0.2, Number(motion.lineFlowDuration) || 2)}s`,
    '--custom-fill-pulse-duration': `${Math.max(0.2, Number(motion.fillPulseDuration) || 2)}s`,
    '--custom-fill-pulse-min': String(Math.min(100, Math.max(0, Number(motion.fillPulseMin) || 0)) / 100)
  }
}

// 第4.5世代の円弧リンク設定。nodes の要素数が球体数・接続数になる。
const MAGITECH_LINK_WAVE = {
  nodeRadius: 53.2,
  wavesPerLink: 4,
  amplitude: 2.4,
  // 0で均一、1に近づけるほど各波の高さ・速度・位相の差が大きくなる。
  randomness: 0.65,
  segmentsPerWave: 8,
  speed: 0.004,
  // color: 球体と、その球体から次へ伸びる線の色。
  // connectionStrength: 0〜1。高いほど接続線を太く・明るく表示する。
  nodes: [
    { color: '#63f58c', connectionStrength: 0.7 },
    { color: '#ffe45c', connectionStrength: 0.45 },
    { color: '#5faeff', connectionStrength: 0.85 },
    { color: '#ffffff', connectionStrength: 0.55 },
    { color: '#b8ff62', connectionStrength: 0.65 }
  ]
}

const GEN4_MAGITECH_NODES = [
  { color: '#63f58c', connectionStrength: 0.7 },
  { color: '#ffe45c', connectionStrength: 0.55 },
  { color: '#5faeff', connectionStrength: 0.8 }
]

const magitechLinkWavePhase = ref(0)
let magitechLinkWaveAnimationFrame = 0

const seededUnit = (linkIndex, waveIndex) => {
  const seed = Math.sin((linkIndex + 1) * 91.17 + (waveIndex + 1) * 37.71) * 43758.5453
  return seed - Math.floor(seed)
}

const magitechNodeSettings = computed(() => {
  const isGen4 = Number(props.generation) === 4
  const customNodes = isGen4 ? props.gen4MagitechNodeSettings : props.gen45MagitechNodeSettings
  if (customNodes.length > 0) return customNodes
  return isGen4 ? GEN4_MAGITECH_NODES : MAGITECH_LINK_WAVE.nodes
})

const isMagitechGeneration = computed(() => [4, 4.5].includes(Number(props.generation)))

const magitechNodes = computed(() => {
  if (isMagitechGeneration.value) {
    const { nodeRadius } = MAGITECH_LINK_WAVE
    const nodes = magitechNodeSettings.value
    return nodes.map((node, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / nodes.length
      return {
        ...node,
        x: 70 + Math.cos(angle) * nodeRadius,
        y: 70 + Math.sin(angle) * nodeRadius
      }
    })
  }

  return [[70, 16.8], [23.8, 96.6], [116.2, 96.6]]
})

const magitechLinkWavePaths = computed(() => {
  const { nodeRadius, wavesPerLink, amplitude, randomness, segmentsPerWave } = MAGITECH_LINK_WAVE
  const nodes = magitechNodes.value
  const pointCount = wavesPerLink * segmentsPerWave

  return nodes.map((_, linkIndex) => {
    const startAngle = -Math.PI / 2 + (Math.PI * 2 * linkIndex) / nodes.length
    const arcAngle = (Math.PI * 2) / nodes.length
    const points = []

    for (let index = 0; index <= pointCount; index += 1) {
      const progress = index / pointCount
      const wavePosition = progress * wavesPerLink
      const waveIndex = Math.floor(wavePosition)
      const waveProgress = wavePosition - waveIndex
      const interpolation = (1 - Math.cos(waveProgress * Math.PI)) / 2
      const random = seededUnit(linkIndex, waveIndex) * (1 - interpolation)
        + seededUnit(linkIndex, waveIndex + 1) * interpolation
      const localAmplitude = amplitude * (1 - randomness * 0.55 + random * randomness * 1.1)
      const localSpeed = 1 - randomness * 0.35 + random * randomness * 0.7
      const localPhase = random * Math.PI * 2
      // 両端では必ず0にして、球体との接続位置を固定する。
      const connectionFade = Math.sin(progress * Math.PI)
      const wave = Math.sin(
        progress * Math.PI * 2 * wavesPerLink + magitechLinkWavePhase.value * localSpeed + localPhase
      ) * localAmplitude * connectionFade
      const angle = startAngle + arcAngle * progress
      const radius = nodeRadius + wave
      const x = 70 + Math.cos(angle) * radius
      const y = 70 + Math.sin(angle) * radius
      points.push((index === 0 ? 'M ' : 'L ') + x.toFixed(2) + ' ' + y.toFixed(2))
    }

    return points.join(' ')
  })
})

const magitechNodeStyle = node => ({
  left: `${(node.x / 140) * 100}%`,
  top: `${(node.y / 140) * 100}%`,
  '--magitech-node-color': node.color,
  '--magitech-node-strength': node.connectionStrength
})

const magitechLinkStyle = index => {
  const node = magitechNodeSettings.value[index]
  const strength = node?.connectionStrength ?? 0.5
  return {
    '--magitech-link-color': node?.color ?? 'currentColor',
    '--magitech-link-strength': strength
  }
}

onMounted(() => {
  let lastTimestamp = performance.now()

  const animateLinkWaves = timestamp => {
    const elapsed = timestamp - lastTimestamp
    lastTimestamp = timestamp
    magitechLinkWavePhase.value += elapsed * MAGITECH_LINK_WAVE.speed
    magitechLinkWaveAnimationFrame = requestAnimationFrame(animateLinkWaves)
  }

  magitechLinkWaveAnimationFrame = requestAnimationFrame(animateLinkWaves)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(magitechLinkWaveAnimationFrame)
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
  filter: drop-shadow(0 0 6px rgba(116, 193, 255, 0.85));
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
  color: #a9d8ff;
  filter: drop-shadow(0 0 2px rgba(3, 12, 28, 1)) drop-shadow(0 0 12px rgba(116, 193, 255, 0.95));
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

/* 第3.5世代: 第3世代を強化した、分割ロックオンリング。 */
.gen35-upgrade {
  position: absolute;
  inset: 0;
  color: #d7efff;
}

.gen35-outer-ring,
.gen35-tick-ring,
.gen35-segment-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.gen35-outer-ring {
  width: 90%;
  aspect-ratio: 1;
  box-sizing: border-box;
  border: 3px solid currentColor;
  opacity: 0.95;
}

.gen35-outer-ring::before,
.gen35-outer-ring::after {
  content: '';
  position: absolute;
  inset: -3%;
  background:
    linear-gradient(currentColor, currentColor) 50% 0 / 14% 3px no-repeat,
    linear-gradient(currentColor, currentColor) 100% 50% / 3px 14% no-repeat,
    linear-gradient(currentColor, currentColor) 50% 100% / 14% 3px no-repeat,
    linear-gradient(currentColor, currentColor) 0 50% / 3px 14% no-repeat;
}

.gen35-outer-ring::after {
  inset: 1%;
  border: 1px solid rgba(215, 239, 255, 0.6);
  border-radius: 50%;
}

.gen35-tick-ring {
  width: 98%;
  aspect-ratio: 1;
  box-sizing: border-box;
  border: 1px dashed rgba(215, 239, 255, 0.9);
  opacity: 0.7;
  animation: gen35OuterTickSpin 12s linear infinite;
}

.gen35-segment-ring {
  width: 60%;
  aspect-ratio: 1;
  box-sizing: border-box;
  border: 4px dashed currentColor;
  opacity: 0.45;
}

.gen35-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border: 2px solid currentColor;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(215, 239, 255, 0.75);
  transform: translate(-50%, -50%);
  opacity: 0.45;
}

.gen35-core::before,
.gen35-core::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: currentColor;
  transform: translate(-50%, -50%);
}

.gen35-core::before {
  width: 34px;
  height: 1px;
}

.gen35-core::after {
  width: 1px;
  height: 34px;
}

.gen35-pointer {
  position: absolute;
  z-index: 1;
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 12px solid currentColor;
  filter: drop-shadow(0 0 5px rgba(215, 239, 255, 0.7));
  opacity: 0.45;
}

.gen35-pointer-top { top: 14%; left: calc(50% - 7px); transform: rotate(180deg); }
.gen35-pointer-right { top: calc(50% - 7px); right: 14%; transform: rotate(-90deg); }
.gen35-pointer-bottom { bottom: 14%; left: calc(50% - 7px); }
.gen35-pointer-left { top: calc(50% - 7px); left: 14%; transform: rotate(90deg); }

@keyframes gen35OuterTickSpin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* 第4世代: 軽量な魔導制御を示す、細い二重円と3つの宝珠ノード。 */
.magitech-rings,
.magitech-jewels,
.demon-reticle {
  display: none;
}

.gen-4 {
  /* 第4世代のサイズ調整: 二重円・電子ノードを個別に変更できる。 */
  --magitech-outer-ring-scale: 0.96;
  --magitech-inner-ring-scale: 1.2;
  --magitech-node-size: 20px;
  --magitech-node-scale: 1;
  --magitech-ring-glow: rgba(57, 198, 216, 0.7);
  --magitech-inner-ring-color: rgba(107, 235, 244, 0.9);
  color: #39c6d8;
  filter: drop-shadow(0 0 10px rgba(57, 198, 216, 0.8));
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
  box-shadow: 0 0 7px var(--magitech-ring-glow, rgba(88, 184, 255, 0.7));
}

.magitech-ring-outer {
  inset: 0;
  animation: spin 9s linear infinite;
  scale: var(--magitech-outer-ring-scale, 1);
}

.magitech-wave-path {
  fill: none;
  stroke: var(--magitech-link-color, currentColor);
  stroke-width: calc(1px + var(--magitech-link-strength, 0.5) * 1.7px);
  opacity: calc(0.4 + var(--magitech-link-strength, 0.5) * 0.6);
  filter: drop-shadow(0 0 calc(2px + var(--magitech-link-strength, 0.5) * 4px) var(--magitech-link-color, currentColor));
  vector-effect: non-scaling-stroke;
}

.magitech-ring-inner {
  inset: 26%;
  border-color: var(--magitech-inner-ring-color, rgba(125, 218, 255, 0.9));
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
  border: 1px solid var(--magitech-node-color, #bdefff);
  border-radius: 50%;
  background:
    radial-gradient(circle, #f1fcff 0 12%, transparent 14% 39%, var(--magitech-node-color, #58c6ff) 42% 48%, transparent 51%),
    rgba(15, 85, 132, 0.28);
  box-shadow: 0 0 calc(4px + var(--magitech-node-strength, 0.5) * 7px) var(--magitech-node-color, rgba(87, 201, 255, 0.75));
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
  --magitech-ring-glow: rgba(80, 68, 184, 0.75);
  --magitech-inner-ring-color: rgba(126, 114, 234, 0.9);
  color: #5044b8;
  filter: drop-shadow(0 0 12px rgba(80, 68, 184, 0.9));
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
  animation: spin 9s linear infinite;
}

/* 第4世代: 制御座標の中心点。 */
.magitech-center-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 7px;
  border: 1px solid rgba(190, 255, 255, 0.82);
  border-radius: 50%;
  background: rgba(124, 235, 245, 0.3);
  box-shadow: 0 0 7px rgba(57, 198, 216, 0.7);
  transform: translate(-50%, -50%);
  animation: magitechCenterPulse 1.7s ease-in-out infinite;
}

.magitech-center-dot::before,
.magitech-center-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: rgba(150, 245, 250, 0.62);
  transform: translate(-50%, -50%);
}

.magitech-center-dot::before { width: 15px; height: 1px; }
.magitech-center-dot::after { width: 1px; height: 15px; }

/* 第4.5世代: 攻撃対象を捕捉する、電子照準風の眼。 */
.demon-eye-target {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 38%;
  height: 19%;
  border: 1px solid currentColor;
  border-radius: 50% / 80%;
  transform: translate(-50%, -50%);
  background: rgba(80, 68, 184, 0.05);
  box-shadow: 0 0 7px rgba(126, 114, 234, 0.65), inset 0 0 6px rgba(112, 91, 255, 0.18);
  animation: demonEyeFocus 1.8s ease-in-out infinite;
}

.demon-eye-target::before,
.demon-eye-target::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 18%;
  height: 1px;
  background: currentColor;
  opacity: 0.85;
}

.demon-eye-target::before { left: -23%; }
.demon-eye-target::after { right: -23%; }

.demon-eye-iris {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40%;
  aspect-ratio: 1;
  border: 1px solid rgba(194, 184, 255, 0.72);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 5px rgba(141, 124, 255, 0.55);
}

.demon-eye-pupil {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 11%;
  height: 58%;
  border: 1px solid rgba(229, 224, 255, 0.7);
  border-radius: 50%;
  background: rgba(229, 224, 255, 0.12);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 5px rgba(208, 199, 255, 0.5);
}

.gen-4-5 .magitech-rings,
.gen-4-5 .demon-reticle {
  animation: none;
}

/* ターゲット移動中だけ、第4・4.5世代の円環を高速追尾させる。 */
.gen-4.is-target-moving .magitech-ring-outer {
  animation-duration: 0.65s;
}

.gen-4.is-target-moving .magitech-jewels {
  animation: spin 0.72s linear infinite, magitechNodesPulse 0.72s ease-in-out infinite;
}

.gen-4-5.is-target-moving .magitech-ring-outer {
  animation-duration: 0.48s;
}

.gen-4-5.is-target-moving .magitech-jewels {
  animation: spin 0.56s linear infinite;
}

.gen-4-5.is-target-moving .demon-reticle {
  animation: spin 0.44s linear infinite;
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

@keyframes magitechCenterPulse {
  0%, 100% { opacity: 0.42; transform: translate(-50%, -50%) scale(0.85); }
  50% { opacity: 0.85; transform: translate(-50%, -50%) scale(1.12); }
}

@keyframes demonReticlePulse {
  0%, 100% { opacity: 0.72; transform: translateY(0); }
  50% { opacity: 1; transform: scale(1.04); }
}

@keyframes demonEyeFocus {
  0%, 100% { opacity: 0.36; transform: translate(-50%, -50%) scale(0.9); }
  50% { opacity: 0.62; transform: translate(-50%, -50%) scale(1.06); }
}

.gen-5 {
  color: #fff0a6;
  filter: drop-shadow(0 0 10px rgba(255, 232, 137, 0.6));
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

/* 天使タイプ: 標準の第5・5.5世代マーカーとは独立した光翼・ハロー系。 */
.type-angel.gen-5,
.type-angel.gen-5-5 {
  color: #fff4bd;
  filter: drop-shadow(0 0 8px rgba(255, 237, 160, 0.78));
}

.type-angel.gen-5 {
  transform: scale(0.96);
}

.type-angel.gen-5-5 {
  color: #e6f8ff;
  filter: drop-shadow(0 0 10px rgba(191, 238, 255, 0.85)) drop-shadow(0 0 16px rgba(255, 239, 182, 0.45));
}

.type-angel.gen-5 .corner,
.type-angel.gen-5 .ring,
.type-angel.gen-5 .ticks,
.type-angel.gen-5 .sweep,
.type-angel.gen-5 .cross,
.type-angel.gen-5 .center-x,
.type-angel.gen-5 .ring-segment,
.type-angel.gen-5 .inner-ring,
.type-angel.gen-5 .orbit,
.type-angel.gen-5 .outer-dots,
.type-angel.gen-5-5 .corner,
.type-angel.gen-5-5 .ring,
.type-angel.gen-5-5 .ticks,
.type-angel.gen-5-5 .sweep,
.type-angel.gen-5-5 .cross,
.type-angel.gen-5-5 .center-x,
.type-angel.gen-5-5 .ring-segment,
.type-angel.gen-5-5 .inner-ring,
.type-angel.gen-5-5 .orbit,
.type-angel.gen-5-5 .outer-dots,
.type-angel.gen-5-5 .core {
  display: none;
}

.angel-marker {
  position: absolute;
  inset: -12%;
  color: inherit;
}

.angel-halo {
  position: absolute;
  top: 18%;
  left: 50%;
  box-sizing: border-box;
  border: 1px solid currentColor;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.angel-halo-outer {
  width: 58%;
  height: 15%;
  border-width: 2px;
  border-style: double;
  animation: angelHaloFloat 3.4s ease-in-out infinite;
}

.angel-halo-middle {
  top: 23%;
  width: 44%;
  height: 10%;
  border-style: solid;
  opacity: 0.8;
  animation: angelHaloFloat 3.4s ease-in-out infinite reverse;
}

.angel-halo-inner {
  top: 28%;
  width: 30%;
  height: 7%;
  border-color: rgba(224, 249, 255, 0.88);
  opacity: 0.7;
  animation: angelHaloPulse 2.4s ease-in-out infinite;
}

.angel-wing {
  position: absolute;
  top: 38%;
  width: 31%;
  height: 33%;
  box-sizing: border-box;
  border: 2px solid currentColor;
  opacity: 0.75;
}

.angel-wing-left {
  left: -1%;
  border-right: 0;
  border-radius: 100% 0 0 72%;
  transform: rotate(-18deg);
}

.angel-wing-right {
  right: -1%;
  border-left: 0;
  border-radius: 0 100% 72% 0;
  transform: rotate(18deg);
}

.angel-wing::after {
  content: '';
  position: absolute;
  top: 28%;
  width: 86%;
  height: 1px;
  background: currentColor;
  box-shadow: 0 7px 0 rgba(255, 244, 189, 0.65), 0 14px 0 rgba(255, 244, 189, 0.35);
}

.angel-wing-left::after { left: 7%; transform: rotate(18deg); transform-origin: left; }
.angel-wing-right::after { right: 7%; transform: rotate(-18deg); transform-origin: right; }

.angel-wing-2 {
  top: 44%;
  width: 25%;
  height: 24%;
  opacity: 0.55;
}

.angel-wing-3 {
  top: 49%;
  width: 19%;
  height: 16%;
  opacity: 0.38;
}

.angel-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  border: 1px solid currentColor;
  border-radius: 50%;
  background: rgba(255, 249, 213, 0.32);
  box-shadow: 0 0 10px currentColor;
  transform: translate(-50%, -50%);
}

.angel-core::before,
.angel-core::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: currentColor;
  transform: translate(-50%, -50%);
}

.angel-core::before { width: 28px; height: 1px; }
.angel-core::after { width: 1px; height: 28px; }

.type-angel.gen-5 .angel-halo-inner,
.type-angel.gen-5 .angel-wing-2,
.type-angel.gen-5 .angel-wing-3 {
  display: none;
}

.type-angel.gen-5-5 .angel-marker {
  inset: -16%;
}

.type-angel.gen-5-5 .angel-halo-outer {
  border-color: #fff2bd;
  animation-duration: 12s;
}

.type-angel.gen-5-5 .angel-halo-middle {
  border-color: #bfeeff;
  animation-duration: 7s;
}

.type-angel.gen-5-5 .angel-wing {
  border-color: rgba(232, 250, 255, 0.95);
}

@keyframes angelHaloFloat {
  0%, 100% { transform: translate(-50%, -50%) translateY(0); opacity: 0.58; }
  50% { transform: translate(-50%, -50%) translateY(-4px); opacity: 1; }
}

@keyframes angelHaloPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.42; }
  50% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.9; }
}

/* 天使系: 多重の光輪、翼状バー、レンズ中央の十字星。 */
.angel-marker {
  inset: -16%;
}

.type-angel .angel-halo {
  top: 53%;
  height: auto;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.type-angel .angel-halo-outer {
  width: 88%;
  aspect-ratio: 1;
  border: 2px solid currentColor;
  border-style: double;
  animation: angelRingDrift 10s linear infinite;
}

.type-angel .angel-halo-middle {
  top: 53%;
  width: 72%;
  aspect-ratio: 1;
  border: 4px dashed rgba(225, 248, 255, 0.92);
  animation: angelRingDriftReverse 7s linear infinite;
}

.type-angel .angel-halo-inner {
  top: 53%;
  width: 52%;
  aspect-ratio: 1;
  border: 1px solid rgba(220, 246, 255, 0.9);
  animation: angelLensPulse 2.6s ease-in-out infinite;
}

.angel-crown {
  position: absolute;
  top: 4%;
  left: 50%;
  width: 42%;
  height: 10%;
  border: 2px solid rgba(226, 249, 255, 0.95);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(191, 238, 255, 0.8);
  transform: translateX(-50%);
  animation: angelCrownFloat 3s ease-in-out infinite;
}

.angel-wing {
  box-sizing: border-box;
  width: 26%;
  height: 7px;
  border: 0;
  border-radius: 1px;
  background: linear-gradient(90deg, rgba(224, 249, 255, 0.98), rgba(191, 238, 255, 0.45));
  box-shadow: 0 0 7px rgba(191, 238, 255, 0.78);
  opacity: 0.9;
}

.angel-wing::after {
  content: none;
}

.angel-wing-left { left: -4%; transform: rotate(20deg); }
.angel-wing-right { right: -4%; background: linear-gradient(90deg, rgba(191, 238, 255, 0.45), rgba(224, 249, 255, 0.98)); transform: rotate(-20deg); }
.angel-wing-1 { top: 43%; }
.angel-wing-2 { top: 50%; width: 30%; opacity: 0.78; }
.angel-wing-3 { top: 57%; width: 26%; opacity: 0.56; }

.angel-node {
  position: absolute;
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid #fff0be;
  background: rgba(255, 244, 189, 0.12);
  box-shadow: 0 0 7px rgba(255, 230, 150, 0.85);
  transform: rotate(45deg);
}

.angel-node-top { top: 24%; left: calc(50% - 6px); }
.angel-node-right { top: calc(53% - 6px); right: 12%; }
.angel-node-bottom { bottom: 11%; left: calc(50% - 6px); }
.angel-node-left { top: calc(53% - 6px); left: 12%; }

.angel-core {
  top: 53%;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(234, 252, 255, 0.6);
  background: radial-gradient(circle, rgba(190, 239, 255, 0.32) 0 46%, transparent 50%);
  box-shadow: 0 0 12px rgba(191, 238, 255, 0.85), inset 0 0 8px rgba(225, 249, 255, 0.35);
}

.angel-core::before,
.angel-core::after {
  display: none;
}

.angel-core-star {
  position: absolute;
  inset: -22%;
  width: 144%;
  height: 144%;
  overflow: visible;
  filter: drop-shadow(0 0 5px rgba(255, 249, 218, 0.95));
}

.angel-core-star path {
  fill: rgba(255, 250, 226, 0.96);
}

.angel-core-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c9f7ff;
  box-shadow: 0 0 7px 2px rgba(191, 238, 255, 0.95);
  transform: translate(-50%, -50%);
}

.type-angel.gen-5 .angel-halo-inner,
.type-angel.gen-5 .angel-wing-3 {
  display: none;
}

.type-angel.gen-5-5 .angel-marker {
  inset: -20%;
}

.type-angel.gen-5-5 .angel-halo-outer {
  border-color: rgba(255, 241, 190, 0.96);
}

.type-angel.gen-5-5 .angel-halo-middle {
  border-color: rgba(191, 238, 255, 0.95);
}

@keyframes angelRingDrift {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes angelRingDriftReverse {
  to { transform: translate(-50%, -50%) rotate(-360deg); }
}

@keyframes angelLensPulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.96); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
}

@keyframes angelCrownFloat {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.72; }
  50% { transform: translateX(-50%) translateY(-5px); opacity: 1; }
}

/* 比較用の独立タイプ: 既存世代の部品を隠し、タイプ固有の形だけを描画する。 */
.type-tactical > :not(.tactical-marker),
.type-diamond > :not(.diamond-marker),
.type-radar > :not(.radar-marker),
.type-rift > :not(.rift-marker),
.type-custom > :not(.custom-marker) {
  display: none !important;
}

.type-tactical {
  color: #93ffb9;
  filter: drop-shadow(0 0 8px rgba(92, 255, 158, 0.7));
}

.tactical-marker,
.diamond-marker,
.radar-marker,
.rift-marker,
.custom-marker {
  position: absolute;
  inset: 0;
}

/* 戦術: 直線的なフレームと距離目盛りによる軍用HUD。 */
.tactical-corner {
  position: absolute;
  width: 25%;
  height: 25%;
  border: 3px solid currentColor;
}

.tactical-corner-tl { top: 6%; left: 6%; border-right: 0; border-bottom: 0; }
.tactical-corner-tr { top: 6%; right: 6%; border-left: 0; border-bottom: 0; }
.tactical-corner-bl { bottom: 6%; left: 6%; border-right: 0; border-top: 0; }
.tactical-corner-br { right: 6%; bottom: 6%; border-left: 0; border-top: 0; }

.tactical-range {
  position: absolute;
  left: 50%;
  width: 42%;
  height: 8px;
  border-top: 1px solid currentColor;
  background: repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 8px);
  transform: translateX(-50%);
  opacity: 0.85;
}

.tactical-range-top { top: 21%; }
.tactical-range-bottom { bottom: 21%; transform: translateX(-50%) rotate(180deg); }

.tactical-cross,
.tactical-cross::before {
  position: absolute;
  top: 50%;
  left: 50%;
  background: currentColor;
  content: '';
  transform: translate(-50%, -50%);
}

.tactical-cross { width: 40%; height: 2px; }
.tactical-cross::before { width: 2px; height: 40%; }

/* 菱形: 結晶・結界のような回転する二重ダイヤ。 */
.type-diamond {
  color: #ff9fe8;
  filter: drop-shadow(0 0 10px rgba(255, 126, 226, 0.75));
}

.diamond-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  box-sizing: border-box;
  border: 2px solid currentColor;
  transform: translate(-50%, -50%) rotate(45deg);
}

.diamond-frame-outer {
  width: 76%;
  aspect-ratio: 1;
  animation: diamondRotate 11s linear infinite;
}

.diamond-frame-inner {
  width: 40%;
  aspect-ratio: 1;
  border-style: dashed;
  animation: diamondRotateReverse 6s linear infinite;
}

.diamond-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: currentColor;
  transform: rotate(45deg);
  box-shadow: 0 0 6px currentColor;
}

.diamond-dot-top { top: 8%; left: calc(50% - 4px); }
.diamond-dot-right { top: calc(50% - 4px); right: 8%; }
.diamond-dot-bottom { bottom: 8%; left: calc(50% - 4px); }
.diamond-dot-left { top: calc(50% - 4px); left: 8%; }

.diamond-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 11px;
  height: 11px;
  background: #fff5fc;
  box-shadow: 0 0 10px currentColor;
  transform: translate(-50%, -50%) rotate(45deg);
}

/* レーダー: 半透明の走査面と、遅いスイープ線。 */
.type-radar {
  color: #6ee8ff;
  filter: drop-shadow(0 0 8px rgba(82, 224, 255, 0.75));
}

.radar-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  box-sizing: border-box;
  border: 1px solid currentColor;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.radar-ring-outer { width: 86%; aspect-ratio: 1; border-style: dashed; }
.radar-ring-inner { width: 47%; aspect-ratio: 1; opacity: 0.72; }

.radar-sweep {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 39%;
  height: 2px;
  background: linear-gradient(90deg, currentColor, rgba(110, 232, 255, 0));
  box-shadow: 0 0 7px currentColor;
  transform-origin: 0 50%;
  animation: radarSweep 3.8s linear infinite;
}

.radar-line {
  position: absolute;
  top: 50%;
  left: 50%;
  background: currentColor;
  opacity: 0.42;
  transform: translate(-50%, -50%);
}

.radar-line-h { width: 86%; height: 1px; }
.radar-line-v { width: 1px; height: 86%; }

.radar-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 10px currentColor;
  transform: translate(-50%, -50%);
}

/* 裂け目: 円ではない不規則な八角フレームと、外向きの亀裂。 */
.type-rift {
  color: #b592ff;
  filter: drop-shadow(0 0 10px rgba(166, 111, 255, 0.78));
}

.rift-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  box-sizing: border-box;
  border: 2px solid currentColor;
  clip-path: polygon(25% 0, 72% 5%, 100% 28%, 92% 70%, 70% 100%, 26% 94%, 0 70%, 6% 26%);
  transform: translate(-50%, -50%);
}

.rift-frame-outer {
  width: 84%;
  aspect-ratio: 1;
  animation: riftPulse 2.8s ease-in-out infinite;
}

.rift-frame-inner {
  width: 49%;
  aspect-ratio: 1;
  border-style: dashed;
  transform: translate(-50%, -50%) rotate(22deg);
  animation: diamondRotateReverse 8s linear infinite;
}

.rift-spike {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 17px solid currentColor;
  filter: drop-shadow(0 0 5px currentColor);
}

.rift-spike-top { top: 1%; left: calc(50% - 7px); transform: rotate(180deg); }
.rift-spike-right { top: calc(50% - 7px); right: 1%; transform: rotate(-90deg); }
.rift-spike-bottom { bottom: 1%; left: calc(50% - 7px); }
.rift-spike-left { top: calc(50% - 7px); left: 1%; transform: rotate(90deg); }

.rift-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  background: radial-gradient(circle, #fff 0 18%, currentColor 20% 42%, transparent 44%);
  transform: translate(-50%, -50%) rotate(45deg);
}

/* 作成マーカー: 設定モーダルから形・色・輪郭・回転を指定する共通フレーム。 */
.type-custom {
  color: var(--custom-marker-color, #8fefff);
  filter: drop-shadow(0 0 9px color-mix(in srgb, currentColor 75%, transparent));
}

.custom-marker {
  top: 50%;
  right: auto;
  bottom: auto;
  left: 50%;
  width: var(--custom-marker-size);
  height: var(--custom-marker-size);
  opacity: var(--custom-marker-opacity);
  transform: translate(-50%, -50%);
  transition:
    width var(--custom-morph-duration) var(--custom-morph-easing),
    height var(--custom-morph-duration) var(--custom-morph-easing),
    opacity var(--custom-morph-duration) var(--custom-morph-easing);
}

.custom-marker-motion {
  position: absolute;
  inset: 0;
}

.custom-marker-ring-orbit {
  position: absolute;
  inset: 0;
  transform-origin: 50% 50%;
}

.custom-marker-ring-highlight {
  position: absolute;
  inset: 0;
}

.custom-marker-ring-highlight.is-editor-highlighted {
  animation: customEditorRingFlash 0.85s ease-out 1;
}

.custom-marker-ring {
  position: absolute;
  box-sizing: border-box;
  display: grid;
  transform-origin: center;
  transition:
    left var(--custom-morph-duration) var(--custom-morph-easing),
    top var(--custom-morph-duration) var(--custom-morph-easing),
    width var(--custom-morph-duration) var(--custom-morph-easing),
    height var(--custom-morph-duration) var(--custom-morph-easing),
    opacity var(--custom-morph-duration) var(--custom-morph-easing),
    gap var(--custom-morph-duration) var(--custom-morph-easing),
    translate var(--custom-morph-duration) var(--custom-morph-easing),
    rotate var(--custom-morph-duration) var(--custom-morph-easing);
}

.custom-marker-ring-segment {
  box-sizing: border-box;
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: visible;
  transition:
    left var(--custom-morph-duration) var(--custom-morph-easing),
    top var(--custom-morph-duration) var(--custom-morph-easing),
    width var(--custom-morph-duration) var(--custom-morph-easing),
    height var(--custom-morph-duration) var(--custom-morph-easing),
    opacity var(--custom-morph-duration) var(--custom-morph-easing),
    translate var(--custom-morph-duration) var(--custom-morph-easing),
    rotate var(--custom-morph-duration) var(--custom-morph-easing);
}

.custom-segment-fill,
.custom-segment-line {
  vector-effect: non-scaling-stroke;
  transition:
    fill var(--custom-morph-duration) var(--custom-morph-easing),
    fill-opacity var(--custom-morph-duration) var(--custom-morph-easing),
    stroke var(--custom-morph-duration) var(--custom-morph-easing),
    stroke-width var(--custom-morph-duration) var(--custom-morph-easing),
    filter var(--custom-morph-duration) var(--custom-morph-easing);
}
.custom-segment-fill {
  fill: var(--custom-segment-fill);
  fill-opacity: var(--custom-segment-fill-opacity);
  stroke: none;
}
.custom-shape-line .custom-segment-fill,
.custom-shape-cross .custom-segment-fill,
.custom-shape-corner .custom-segment-fill,
.custom-shape-cornerFrame .custom-segment-fill,
.custom-shape-arc .custom-segment-fill,
.custom-shape-tick .custom-segment-fill,
.custom-shape-wave .custom-segment-fill,
.custom-shape-magitechWave .custom-segment-fill { fill: none; }
.custom-segment-line {
  fill: none;
  stroke: var(--custom-segment-color);
  stroke-width: var(--custom-ring-line-width);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: var(--custom-segment-dash);
  filter: drop-shadow(0 0 var(--custom-ring-glow-size) var(--custom-ring-glow-color));
}
.custom-segment-line-inner {
  stroke: color-mix(in srgb, var(--custom-segment-color) 35%, transparent);
  stroke-width: 1px;
}
.custom-marker-ring-segment.is-sequenced {
  animation: customSegmentSequence var(--custom-sequence-duration) linear infinite;
  animation-delay: var(--custom-segment-delay);
}
.custom-marker-ring-segment.is-glow-animated .custom-segment-line {
  animation: customGlowPulse var(--custom-glow-duration) ease-in-out infinite;
}
.custom-marker-ring-segment.is-line-flowing .custom-segment-line {
  animation: customLineFlow var(--custom-line-flow-duration) linear infinite;
}
.custom-marker-ring-segment.is-glow-animated.is-line-flowing .custom-segment-line {
  animation-name: customGlowPulse, customLineFlow;
  animation-duration: var(--custom-glow-duration), var(--custom-line-flow-duration);
  animation-timing-function: ease-in-out, linear;
  animation-iteration-count: infinite, infinite;
}
.custom-marker-ring-segment.is-fill-pulsing .custom-segment-fill {
  animation: customFillPulse var(--custom-fill-pulse-duration) ease-in-out infinite;
}

.custom-marker-ring.is-layout-arc {
  display: block;
}

.custom-marker-ring.is-layout-arc .custom-marker-ring-segment {
  position: absolute;
}

.custom-marker-ring-orbit.is-hidden { display: none; }
.custom-marker-ring-orbit.is-animated,
.custom-marker-ring.is-animated {
  animation-timing-function: linear;
  animation-iteration-count: var(--custom-ring-iteration);
  animation-direction: var(--custom-ring-direction);
  animation-delay: var(--custom-ring-delay);
}
.custom-marker-ring-orbit.is-animated {
  animation-name: customMarkerOrbit;
  animation-duration: var(--custom-ring-rotate-duration);
}
.custom-marker-ring.is-animated {
  animation-name: customMarkerPulse;
  animation-duration: var(--custom-ring-pulse-duration);
}

.custom-marker-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 8px 3px currentColor;
  transform: translate(-50%, -50%);
}

@keyframes diamondRotate {
  to { transform: translate(-50%, -50%) rotate(405deg); }
}

@keyframes customMarkerOrbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes customMarkerPulse {
  0%, 100% { scale: calc(1 - var(--custom-ring-pulse-amount)); }
  50% { scale: calc(1 + var(--custom-ring-pulse-amount)); }
}

@keyframes customEditorRingFlash {
  0%, 100% { opacity: 1; filter: brightness(1); }
  18%, 58% { opacity: 0.28; filter: brightness(0.75); }
  38%, 78% { opacity: 1; filter: brightness(2.5) drop-shadow(0 0 8px #d9fbff); }
}

@keyframes customSegmentSequence {
  0%, 35%, 100% { opacity: 0.28; }
  12%, 24% { opacity: 1; }
}

@keyframes customGlowPulse {
  0%, 100% { filter: drop-shadow(0 0 var(--custom-glow-min) var(--custom-ring-glow-color)); }
  50% { filter: drop-shadow(0 0 var(--custom-glow-max) var(--custom-ring-glow-color)); }
}

@keyframes customLineFlow {
  to { stroke-dashoffset: -44; }
}

@keyframes customFillPulse {
  0%, 100% { fill-opacity: var(--custom-fill-pulse-min); }
  50% { fill-opacity: var(--custom-segment-fill-opacity); }
}

@keyframes diamondRotateReverse {
  to { transform: translate(-50%, -50%) rotate(-315deg); }
}

@keyframes radarSweep {
  to { transform: rotate(360deg); }
}

@keyframes riftPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.94); opacity: 0.68; }
  50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
}

.gen-3 .ring-outer,
.gen-3 .sweep {
  display: none;
}

/* 第1.5世代: 重装歩行兵器の砲撃ロックオン照準。 */
.gen-1-5 {
  color: #e58a36;
  filter: drop-shadow(0 0 9px rgba(229, 138, 54, 0.68));
}

.gen-1-5 .ring-outer,
.gen-1-5 .ring-inner,
.gen-1-5 .corner,
.gen-1-5 .cross,
.gen-1-5 .core {
  display: block;
}

.gen-1-5 .ring-outer {
  inset: 7%;
  border-width: 3px;
  animation: heavyLockPulse 1.5s steps(2) infinite;
}

.gen-1-5 .ring-inner {
  inset: 19%;
  border-width: 2px;
  border-style: dashed;
  animation: none;
  opacity: 0.75;
}

.gen-1-5 .ring-core,
.gen-1-5 .ticks,
.gen-1-5 .sweep,
.gen-1-5 .halo,
.gen-1-5 .arc,
.gen-1-5 .grid,
.gen-1-5 .tri,
.gen-1-5 .cross.small,
.gen-1-5 .center-x {
  display: none;
}

.gen-1-5 .corner {
  width: 32px;
  height: 32px;
  border-width: 3px;
  opacity: 0.95;
  animation: none;
}

.gen-1-5 .cross {
  opacity: 0.88;
  box-shadow: none;
}

.gen-1-5 .cross-h {
  width: 58%;
  height: 2px;
  background: currentColor;
}

.gen-1-5 .cross-v {
  width: 2px;
  height: 58%;
  background: currentColor;
}

/* 第2.5世代: 電子戦・偽装・撹乱を示すジャミング照準。 */
.gen-2-5 {
  color: #62d8c7;
  filter: drop-shadow(0 0 2px rgba(10, 35, 44, 1)) drop-shadow(0 0 10px rgba(98, 216, 199, 0.72));
}

.gen-2-5 .corner,
.gen-2-5 .ring,
.gen-2-5 .ticks,
.gen-2-5 .sweep,
.gen-2-5 .hex-frame,
.gen-2-5 .scanline,
.gen-2-5 .grid,
.gen-2-5 .halo,
.gen-2-5 .arc,
.gen-2-5 .cross,
.gen-2-5 .core,
.gen-2-5 .tri,
.gen-2-5 .gen4-outer,
.gen-2-5 .gen4-inner,
.gen-2-5 .gen4-arrows {
  display: none;
}

.jammer-target-marker {
  position: absolute;
  inset: 6%;
  color: #21dce5;
  animation: none;
}

.jammer-target-marker::before {
  content: '';
  position: absolute;
  inset: 2%;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(138, 247, 255, 0.9) 0deg 0.8deg,
    transparent 0.8deg 3.6deg
  );
  -webkit-mask: radial-gradient(transparent 0 92%, #000 92.5% 95%, transparent 95.5%);
  mask: radial-gradient(transparent 0 92%, #000 92.5% 95%, transparent 95.5%);
  animation: jammerOuterTickSpin 14s linear infinite;
  transition: inset 0.18s ease-out;
}

.gen-2-5.is-target-moving .jammer-target-marker::before {
  inset: -5%;
}

.jammer-arc {
  position: absolute;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  opacity: 0.9;
}

.jammer-arc-a {
  inset: 2%;
  border-width: 2px;
  animation: jammerArcSpin 10s linear infinite;
}

.jammer-arc-b {
  inset: 16%;
  border: 0;
  background: conic-gradient(
    from 0deg,
    transparent 0deg 8deg,
    currentColor 8deg 72deg,
    transparent 72deg 98deg,
    currentColor 98deg 162deg,
    transparent 162deg 188deg,
    currentColor 188deg 252deg,
    transparent 252deg 278deg,
    currentColor 278deg 342deg,
    transparent 342deg 360deg
  );
  -webkit-mask: radial-gradient(transparent 0 91%, #000 92% 96%, transparent 97%);
  mask: radial-gradient(transparent 0 91%, #000 92% 96%, transparent 97%);
  animation: jammerArcSpinReverse 7s linear infinite;
}

.jammer-arc-c {
  inset: 30%;
  border-style: dashed;
  border-color: rgba(138, 247, 255, 0.8);
  opacity: 0.82;
  animation: jammerArcPulse 2.2s ease-in-out infinite;
}

.jammer-noise {
  display: none;
}

.jammer-noise-a { top: 29%; left: 8%; width: 30%; transform: skewX(-24deg); }
.jammer-noise-b { top: 59%; right: 5%; width: 28%; color: #b6a7ff; transform: skewX(20deg); }
.jammer-noise-c { bottom: 27%; left: 28%; width: 43%; opacity: 0.28; transform: scaleX(0.8); }

.jammer-center-point {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 17px;
  height: 17px;
  border: 1px solid #c9feff;
  border-radius: 50%;
  box-shadow: 0 0 5px rgba(33, 220, 229, 0.6);
  transform: translate(-50%, -50%);
}

.jammer-pointer {
  position: absolute;
  left: 50%;
  top: 50%;
}

.jammer-pointer {
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 12px solid #21dce5;
  filter: drop-shadow(0 0 4px currentColor);
  transition: transform 0.18s ease-out;
}

/* 通常時は中心寄り、移動中は対象を広く捕捉する位置まで展開する。 */
.jammer-pointer-top { transform: translate(-50%, -590%) rotate(180deg); }
.jammer-pointer-right { transform: translate(500%, -50%) rotate(-90deg); }
.jammer-pointer-bottom { transform: translate(-50%, 500%); }
.jammer-pointer-left { transform: translate(-590%, -50%) rotate(90deg); }

.gen-2-5.is-target-moving .jammer-pointer-top { transform: translate(-50%, -700%) rotate(180deg); }
.gen-2-5.is-target-moving .jammer-pointer-right { transform: translate(600%, -50%) rotate(-90deg); }
.gen-2-5.is-target-moving .jammer-pointer-bottom { transform: translate(-50%, 600%); }
.gen-2-5.is-target-moving .jammer-pointer-left { transform: translate(-700%, -50%) rotate(90deg); }

.jammer-center-point::before,
.jammer-center-point::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: #d8fff7;
  transform: translate(-50%, -50%);
}

.jammer-center-point::before { width: 45px; height: 1px; }
.jammer-center-point::after { width: 1px; height: 45px; }

@keyframes jammerFlicker {
  0%, 32%, 36%, 68%, 100% { opacity: 0.78; }
  34%, 70% { opacity: 0.35; }
  72% { opacity: 0.9; }
}

@keyframes jammerOuterTickSpin {
  to { transform: rotate(360deg); }
}

@keyframes jammerArcSpin {
  to { transform: rotate(360deg); }
}

@keyframes jammerArcSpinReverse {
  to { transform: rotate(-360deg); }
}

@keyframes jammerArcPulse {
  0%, 100% { opacity: 0.52; transform: scale(0.96); }
  50% { opacity: 0.9; transform: scale(1.04); }
}

.heavy-distance-scale {
  position: absolute;
  bottom: 2%;
  left: 50%;
  display: flex;
  align-items: end;
  justify-content: space-between;
  width: 44%;
  height: 11px;
  border-top: 1px solid rgba(255, 215, 138, 0.75);
  transform: translateX(-50%);
}

.heavy-distance-scale span {
  width: 1px;
  height: 6px;
  background: currentColor;
}

.heavy-distance-scale span:nth-child(3) { height: 10px; }

@keyframes heavyLockPulse {
  0%, 100% { opacity: 0.75; transform: scale(0.96); }
  50% { opacity: 1; transform: scale(1.01); }
}

.gen-1-5 {
  color: #e58a36;
  filter: drop-shadow(0 0 2px rgba(38, 19, 5, 1)) drop-shadow(0 0 11px rgba(229, 138, 54, 0.82));
}

/* 第1.5世代は旧G3の基本照準を使用する。 */
.gen-1-5 .ring-outer,
.gen-1-5 .sweep {
  display: none;
}

.gen-1-5 .ring-inner {
  display: block;
  inset: 18%;
  border-width: 2px;
  border-style: dashed;
  animation: spin 6s linear infinite;
}

.gen-1-5 .ring-core,
.gen-1-5 .ticks {
  display: block;
}

.gen-1-5 .corner {
  width: 28px;
  height: 28px;
  border-width: 2px;
}

/* 第1.5世代: 停止中は歩行兵器らしい微振動、移動中は山なりの捕捉軌道。 */
.gen-1-5 {
  animation: gen15IdleSway 2.8s ease-in-out infinite;
}

.gen-1-5.is-target-moving {
  animation: gen15ArcMove 0.65s cubic-bezier(0.2, 0.78, 0.3, 1) both;
}

@keyframes gen15IdleSway {
  0%, 100% { transform: translate(0, 0) rotate(0); }
  25% { transform: translate(-1px, 1px) rotate(-0.45deg); }
  55% { transform: translate(1px, -1px) rotate(0.35deg); }
  78% { transform: translate(-0.5px, 0.5px) rotate(-0.2deg); }
}

@keyframes gen15ArcMove {
  0% { transform: translate(0, 0) rotate(0); }
  48% { transform: translate(3px, -30px) rotate(2.2deg); }
  76% { transform: translate(-1px, -9px) rotate(-0.8deg); }
  100% { transform: translate(0, 0) rotate(0); }
}

/* 第3世代は旧G3.5の矢印照準を使用する。 */
.gen-3 {
  color: #b7ceff;
  filter: drop-shadow(0 0 2px rgba(3, 12, 28, 1)) drop-shadow(0 0 11px rgba(104, 143, 255, 0.95));
}

.gen-3 .ring,
.gen-3 .corner,
.gen-3 .ticks,
.gen-3 .sweep,
.gen-3 .hex-frame,
.gen-3 .scanline,
.gen-3 .grid,
.gen-3 .halo,
.gen-3 .arc,
.gen-3 .cross,
.gen-3 .cross.small,
.gen-3 .core,
.gen-3 .tri {
  display: none;
}

.gen-3 .gen4-outer,
.gen-3 .gen4-inner,
.gen-3 .gen4-arrows {
  display: block;
  opacity: 1;
}

.gen-3 .gen4-arrow {
  filter: drop-shadow(0 0 6px rgba(104, 143, 255, 0.9));
}

.gen-3 .gen4-outer,
.gen-3 .gen4-inner {
  border-color: #b7ceff;
  box-shadow: none;
  filter: none;
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







