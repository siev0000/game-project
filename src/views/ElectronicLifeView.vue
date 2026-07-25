<template>
  <main class="life-lab">
    <section
      ref="lifeStage"
      class="life-stage can-move"
      aria-label="電子生命体の表示エリア"
      @click="moveHologramToPointer"
    >
      <header class="life-header">
        <div>
          <p class="eyebrow">ELECTRONIC LIFE LAB</p>
          <h1>電子生命体</h1>
        </div>
        <button type="button" class="back-button" @click.stop="router.push('/guest')">戻る</button>
      </header>
      <div class="stage-grid"></div>
      <div class="stage-scanline"></div>
      <div class="stage-status">
        <span>UNIT-00</span>
        <span>FORM: VER.{{ lifeForm }}</span>
        <span>MOTION: {{ activeMotion.code }}</span>
      </div>

      <div
        class="hologram-unit"
        :class="{ 'is-relocating': isRelocating }"
        :style="hologramPositionStyle"
        :aria-label="`電子生命体 Ver.${lifeForm}`"
      >
        <span class="hologram-aura"></span>
        <svg v-if="lifeForm === 1" :class="['life-creature', `motion-${activeMotion.key}`]" viewBox="0 0 280 390" role="img" aria-label="電子生命体 Ver.1">
          <defs>
            <radialGradient id="spirit-head-fill" cx="42%" cy="32%" r="72%">
              <stop offset="0" stop-color="#efffff" stop-opacity="0.74" />
              <stop offset="0.36" stop-color="#76f7ff" stop-opacity="0.44" />
              <stop offset="1" stop-color="#18c7dc" stop-opacity="0.12" />
            </radialGradient>
            <linearGradient id="spirit-body-fill" x1="0" y1="0" x2="0.7" y2="1">
              <stop offset="0" stop-color="#dcffff" stop-opacity="0.65" />
              <stop offset="0.38" stop-color="#66efff" stop-opacity="0.38" />
              <stop offset="1" stop-color="#0cb9d1" stop-opacity="0.04" />
            </linearGradient>
            <filter id="spirit-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <g class="spirit-halo" filter="url(#spirit-glow)">
            <ellipse cx="140" cy="43" rx="78" ry="18" />
            <ellipse cx="140" cy="43" rx="58" ry="11" />
          </g>

          <g class="spirit-particles">
            <circle cx="62" cy="93" r="3" /><circle cx="213" cy="105" r="2" />
            <circle cx="44" cy="179" r="2.5" /><circle cx="231" cy="205" r="3" />
            <circle cx="82" cy="278" r="2" /><circle cx="204" cy="297" r="2.5" />
          </g>

          <path class="head-wisp back" d="M126 91 C106 73 115 54 152 31 C139 52 167 58 151 89 Z" />
          <path class="head-wisp front" d="M142 93 C128 72 143 57 165 47 C151 67 173 72 157 96 Z" />

          <g class="spirit-form" filter="url(#spirit-glow)">
            <g class="front-body">
              <path class="spirit-tail" d="M100 190 C89 226 91 263 112 290 C127 310 147 319 137 354 C133 367 139 377 151 384 C149 360 177 337 166 305 C159 285 174 263 174 233 C174 211 166 196 160 187 Z" />
              <path class="spirit-body" d="M93 164 C90 191 94 223 112 243 C126 259 153 258 169 239 C184 220 188 188 180 160 C161 145 113 145 93 164 Z" />

              <g class="spirit-arm left">
                <path d="M100 176 C77 180 59 192 43 211 C35 220 39 232 49 230 C69 226 88 210 109 198 Z" />
                <ellipse cx="43" cy="218" rx="15" ry="12" />
              </g>
              <g class="spirit-arm right">
                <path d="M177 176 C200 180 219 192 236 211 C244 220 240 232 230 230 C210 226 191 210 170 198 Z" />
                <ellipse cx="236" cy="218" rx="15" ry="12" />
              </g>
              <circle class="spirit-core" cx="139" cy="211" r="13" />
            </g>

            <circle class="spirit-head" cx="139" cy="137" r="61" />
            <g class="front-face">
              <path class="spirit-highlight" d="M101 105 C114 86 143 79 163 89 C135 91 117 106 108 128" />
              <ellipse class="spirit-eye left" cx="116" cy="139" rx="7" ry="11" />
              <ellipse class="spirit-eye right" cx="160" cy="139" rx="7" ry="11" />
              <path class="spirit-mouth" d="M129 161 Q139 170 150 160" />
              <ellipse class="spirit-mouth-surprise" cx="139" cy="165" rx="7" ry="9" />
            </g>
          </g>
        </svg>
        <svg v-else :class="['life-creature', 'life-creature-v2', `motion-${activeMotion.key}`]" viewBox="0 0 280 390" role="img" aria-label="丸い顔と炎状の角を持つ電子生命体 Ver.2">
          <g class="v2-form">
            <path class="v2-horn left" d="M111 93 C85 91 58 77 54 54 C52 41 59 29 71 20 C67 39 79 46 91 35 C87 52 99 59 113 55 C105 68 105 80 111 93 Z" />
            <path class="v2-horn right" d="M169 93 C195 91 222 77 226 54 C228 41 221 29 209 20 C213 39 201 46 189 35 C193 52 181 59 167 55 C175 68 175 80 169 93 Z" />

            <path class="spirit-tail v2-tail" d="M110 211 C93 242 99 278 121 301 C139 320 146 335 136 352 C130 363 137 376 153 384 C148 366 174 348 166 323 C160 303 175 283 177 252 C179 231 169 215 160 205 Z" />
            <path class="v2-body" d="M99 192 C91 218 98 252 117 270 C133 285 154 281 170 263 C186 245 190 216 179 191 C158 177 120 177 99 192 Z" />

            <g class="spirit-arm left v2-arm">
              <path d="M105 199 C84 201 70 215 55 230 C45 240 35 239 28 231 C38 230 44 222 48 213 C55 221 63 211 70 202 C80 190 93 186 108 188 Z" />
              <circle cx="31" cy="231" r="12" />
            </g>
            <g class="spirit-arm right v2-arm">
              <path d="M175 199 C196 201 210 215 225 230 C235 240 245 239 252 231 C242 230 236 222 232 213 C225 221 217 211 210 202 C200 190 187 186 172 188 Z" />
              <circle cx="249" cy="231" r="12" />
            </g>

            <circle class="v2-head" cx="140" cy="137" r="72" />
            <ellipse class="spirit-eye left v2-eye" cx="112" cy="132" rx="11" ry="22" />
            <ellipse class="spirit-eye right v2-eye" cx="168" cy="132" rx="11" ry="22" />
            <path class="spirit-mouth v2-mouth" d="M107 164 Q140 190 173 164 Q168 197 140 202 Q112 197 107 164 Z" />
          </g>
        </svg>
        <div class="projection-rings"><span></span><span></span></div>
        <span class="life-label">UNIT-00 / FORM VER.{{ lifeForm }}</span>
      </div>

      <p class="move-hint">CLICK STAGE / 移動先を指定</p>
    </section>

    <section class="motion-panel" aria-label="動作選択">
      <div class="motion-panel-heading">
        <span>MOTION SELECT</span>
        <output>選択中: {{ selectedMotion.label }}</output>
      </div>
      <div class="form-buttons" aria-label="外見選択">
        <span>FORM SELECT</span>
        <button type="button" :class="{ active: lifeForm === 1 }" @click="lifeForm = 1">Ver.1</button>
        <button type="button" :class="{ active: lifeForm === 2 }" @click="lifeForm = 2">Ver.2</button>
      </div>
      <div class="motion-buttons">
        <button
          v-for="motion in motions"
          :key="motion.key"
          type="button"
          :class="{ active: selectedMotion.key === motion.key }"
          @click="selectMotion(motion)"
        >
          <span class="motion-code">{{ motion.code }}</span>
          <span>{{ motion.label }}</span>
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const internalMotions = {
  float: { key: 'float', code: 'M-01', label: '浮遊' },
  left: { key: 'move-left', code: 'M-02L', label: '左移動' },
  right: { key: 'move-right', code: 'M-02R', label: '右移動' },
  up: { key: 'move-up', code: 'M-02U', label: '跳躍' },
  down: { key: 'move-down', code: 'M-02D', label: '下降' }
}
const motions = [
  { key: 'idle', code: 'M-00', label: '待機' },
  { key: 'joy', code: 'E-01', label: '喜び' },
  { key: 'surprise', code: 'E-02', label: '驚き' },
  { key: 'puzzled', code: 'E-03', label: '困惑' },
  { key: 'rest', code: 'E-04', label: '休止' }
]
const selectedMotion = ref(motions[0])
const lifeForm = ref(2)
const lifeStage = ref(null)
const hologramPosition = ref({ x: 50, y: 56 })
const isRelocating = ref(false)
const movementDirection = ref('right')
let relocationTimer = null

const hologramPositionStyle = computed(() => ({
  left: `${hologramPosition.value.x}%`,
  top: `${hologramPosition.value.y}%`
}))
const activeMotion = computed(() => {
  if (isRelocating.value) return internalMotions[movementDirection.value]
  if (selectedMotion.value.key === 'idle') return internalMotions.float
  return selectedMotion.value
})

const selectMotion = motion => {
  selectedMotion.value = motion
}

const moveHologramToPointer = event => {
  if (!lifeStage.value) return
  const rect = lifeStage.value.getBoundingClientRect()
  const x = Math.min(76, Math.max(24, (event.clientX - rect.left) / rect.width * 100))
  const y = Math.min(63, Math.max(43, (event.clientY - rect.top) / rect.height * 100))
  const deltaX = (x - hologramPosition.value.x) / 100 * rect.width
  const deltaY = (y - hologramPosition.value.y) / 100 * rect.height

  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    movementDirection.value = deltaY < 0 ? 'up' : 'down'
  } else {
    movementDirection.value = deltaX < 0 ? 'left' : 'right'
  }

  hologramPosition.value = { x, y }
  isRelocating.value = true
  window.clearTimeout(relocationTimer)
  relocationTimer = window.setTimeout(() => {
    isRelocating.value = false
  }, 900)
}

const renderGameToText = () => JSON.stringify({
  screen: 'electronic-life',
  coordinateSystem: 'DOM stage; origin is top-left, x points right, y points down',
  hologram: {
    visible: true,
    formVersion: lifeForm.value,
    form: lifeForm.value === 2
      ? 'round face, flame horns, floating hands, tapered spectral tail, no legs'
      : 'round head, floating arms and hands, tapered spectral body, no legs',
    positionPercent: hologramPosition.value,
    relocating: isRelocating.value,
    movementDirection: isRelocating.value ? movementDirection.value : null
  },
  selectedMotion: {
    key: selectedMotion.value.key,
    label: selectedMotion.value.label,
    code: selectedMotion.value.code
  },
  activeMotion: {
    key: activeMotion.value.key,
    label: activeMotion.value.label,
    code: activeMotion.value.code
  }
})

const advanceTime = ms => {
  document.querySelectorAll('.life-stage *').forEach(element => {
    element.getAnimations().forEach(animation => {
      if (animation.currentTime !== null) animation.currentTime += ms
    })
  })
}

onMounted(() => {
  window.render_game_to_text = renderGameToText
  window.advanceTime = advanceTime
})

onBeforeUnmount(() => {
  window.clearTimeout(relocationTimer)
  if (window.render_game_to_text === renderGameToText) delete window.render_game_to_text
  if (window.advanceTime === advanceTime) delete window.advanceTime
})
</script>

<style scoped>
.life-lab {
  --life-cyan: #6df5ff;
  --life-dim: #1b6671;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  padding: 14px;
  overflow: hidden;
  color: #d8fbff;
  font-family: 'Consolas', 'Courier New', monospace;
  background:
    radial-gradient(circle at 50% 44%, rgba(19, 104, 117, 0.22), transparent 32%),
    #020405;
}

.life-header,
.motion-panel,
.life-stage {
  border: 1px solid rgba(109, 245, 255, 0.45);
  box-shadow: inset 0 0 22px rgba(74, 225, 241, 0.06), 0 0 18px rgba(36, 167, 183, 0.08);
}

.life-header {
  position: absolute;
  z-index: 2;
  top: 10px;
  right: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(4, 13, 16, 0.9);
}

.eyebrow {
  margin: 0 0 2px;
  color: var(--life-cyan);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.back-button,
.motion-buttons button {
  border: 1px solid rgba(109, 245, 255, 0.56);
  color: #d8fbff;
  font: inherit;
  cursor: pointer;
}

.back-button {
  flex: 0 0 auto;
  width: auto !important;
  min-width: 58px;
  padding: 5px 10px;
  background: rgba(5, 31, 36, 0.9);
  font-size: 14px;
}

.life-stage {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 0;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(4, 14, 17, 0.86), rgba(0, 0, 0, 0.94));
}
.life-stage.can-move { cursor: crosshair; }

.stage-grid {
  position: absolute;
  inset: 0;
  opacity: 0.32;
  background-image:
    linear-gradient(rgba(109, 245, 255, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(109, 245, 255, 0.16) 1px, transparent 1px);
  background-size: 38px 38px;
  mask-image: linear-gradient(to bottom, transparent, black 35%, black 80%, transparent);
}

.stage-scanline {
  position: absolute;
  inset: -20% 0 auto;
  height: 24%;
  background: linear-gradient(transparent, rgba(98, 242, 255, 0.1), transparent);
  animation: scan 4.8s linear infinite;
}

.stage-status {
  position: absolute;
  top: 88px;
  right: 16px;
  display: grid;
  gap: 4px;
  color: rgba(186, 250, 255, 0.72);
  font-size: 12px;
  text-align: right;
  letter-spacing: 0.08em;
}

.hologram-unit {
  position: absolute;
  z-index: 1;
  width: 280px;
  height: 390px;
  color: var(--life-cyan);
  filter: drop-shadow(0 0 12px rgba(109, 245, 255, 0.68));
  transform: translate(-50%, -50%);
  transition:
    left 900ms cubic-bezier(0.22, 0.72, 0.28, 1),
    top 900ms cubic-bezier(0.22, 0.72, 0.28, 1),
    filter 180ms ease;
  will-change: left, top;
}
.hologram-unit.is-relocating { filter: drop-shadow(0 0 20px rgba(171, 252, 255, 0.9)); }
.hologram-unit.is-relocating .projection-rings { animation-duration: 0.65s; }

.hologram-aura {
  position: absolute;
  inset: 34px 5px 24px;
  border: 1px solid rgba(109, 245, 255, 0.24);
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(109, 245, 255, 0.14), transparent 66%);
  animation: auraPulse 2.8s ease-in-out infinite;
}

.life-creature {
  position: absolute;
  top: 0;
  left: 50%;
  width: 280px;
  height: 390px;
  overflow: visible;
  transform-origin: 50% 55%;
  transform: translateX(-50%);
  animation: creatureFloat 3.2s ease-in-out infinite;
}

.life-creature-v2 {
  pointer-events: none;
}
.life-creature-v2 .v2-form { stroke-linecap: round; stroke-linejoin: round; }
.life-creature-v2 .v2-head,
.life-creature-v2 .v2-body,
.life-creature-v2 .v2-tail,
.life-creature-v2 .v2-horn,
.life-creature-v2 .v2-arm path,
.life-creature-v2 .v2-arm circle {
  fill: rgba(91, 224, 235, 0.28);
  stroke: #83edf3;
  stroke-width: 3;
}
.life-creature-v2 .v2-horn { fill: rgba(91, 224, 235, 0.2); transform-box: fill-box; transform-origin: 50% 100%; }
.life-creature-v2 .v2-horn.left { animation: headWispBack 2.9s ease-in-out infinite; }
.life-creature-v2 .v2-horn.right { animation: headWispFront 2.5s ease-in-out infinite; }
.life-creature-v2 .v2-eye { fill: rgba(235, 255, 255, 0.92); stroke-width: 2; }
.life-creature-v2 .v2-mouth { fill: rgba(220, 255, 255, 0.52); stroke: rgba(221, 255, 255, 0.86); stroke-width: 2.5; }

.spirit-halo ellipse { fill: rgba(109, 245, 255, 0.08); stroke: #c9ffff; stroke-width: 2; }
.spirit-halo ellipse:last-child { stroke-width: 1; stroke-dasharray: 8 10; opacity: 0.74; }
.spirit-halo { transform-box: fill-box; transform-origin: center; animation: haloDrift 3s ease-in-out infinite; }
.spirit-particles circle { fill: #eaffff; filter: drop-shadow(0 0 5px #6df5ff); animation: particleBlink 2.6s ease-in-out infinite; }
.spirit-particles circle:nth-child(2n) { animation-delay: -1.3s; }
.head-wisp { fill: url(#spirit-body-fill); stroke: #58efff; stroke-width: 2; stroke-linejoin: round; transform-box: fill-box; transform-origin: 50% 100%; }
.head-wisp.back { opacity: 0.48; animation: headWispBack 2.9s ease-in-out infinite; }
.head-wisp.front { opacity: 0.8; animation: headWispFront 2.5s ease-in-out infinite; }
.spirit-form { stroke-linecap: round; stroke-linejoin: round; }
.spirit-head { fill: url(#spirit-head-fill); stroke: #66f5ff; stroke-width: 3; }
.spirit-body,
.spirit-tail,
.spirit-arm path,
.spirit-arm ellipse { fill: url(#spirit-body-fill); stroke: #55edff; stroke-width: 2.5; }
.spirit-tail { transform-box: fill-box; transform-origin: 50% 0; animation: spiritTailSway 3s ease-in-out infinite; }
.spirit-arm { transform-box: fill-box; }
.spirit-arm.left { transform-origin: 100% 38%; animation: spiritArmLeft 3.2s ease-in-out infinite; }
.spirit-arm.right { transform-origin: 0 65%; animation: spiritArmRight 3.2s ease-in-out infinite; }
.spirit-highlight { fill: none; stroke: rgba(234, 255, 255, 0.88); stroke-width: 5; opacity: 0.62; }
.spirit-eye { fill: #efffff; stroke: #23d9ed; stroke-width: 2; filter: drop-shadow(0 0 6px #dfffff); transform-box: fill-box; transform-origin: center; animation: eyeBlink 5s infinite; }
.spirit-mouth { fill: none; stroke: #18d0e5; stroke-width: 3; }
.spirit-mouth-surprise { fill: rgba(8, 123, 145, 0.34); stroke: #dfffff; stroke-width: 2; opacity: 0; transform-box: fill-box; transform-origin: center; }
.front-face,
.front-body { transform-box: view-box; transform-origin: center; transition: transform 100ms ease; }
.front-face .spirit-eye { transition: opacity 100ms ease, scale 100ms ease; }
.spirit-core { fill: rgba(239, 255, 255, 0.86); stroke: #7af6ff; stroke-width: 2; filter: drop-shadow(0 0 8px #eaffff); transform-box: fill-box; transform-origin: center; animation: corePulse 1.8s ease-in-out infinite; }

.life-creature.motion-float { animation: motionFloat 1.9s ease-in-out infinite; }
.life-creature.motion-move-left { animation: motionMoveLeft 900ms ease-in-out both; }
.life-creature.motion-move-right { animation: motionMoveRight 900ms ease-in-out both; }
.life-creature.motion-move-up { animation: motionMoveUp 900ms cubic-bezier(0.45, 0, 0.25, 1) both; }
.life-creature.motion-move-down { animation: motionMoveDown 900ms ease-in-out both; }
.life-creature.motion-joy { animation: motionJoy 1.15s ease-in-out infinite; }
.life-creature.motion-surprise { animation: motionSurprise 1.7s ease-in-out infinite; }
.life-creature.motion-puzzled { animation: motionPuzzled 2.4s ease-in-out infinite; }
.life-creature.motion-rest { animation: motionRest 3.6s ease-in-out infinite; }

.motion-move-right .front-face { transform: translateX(8px); }
.motion-move-left .front-face { transform: translateX(-8px); }
.motion-move-right .front-body { transform: translateX(3px) skewX(-3deg) scaleX(0.94); }
.motion-move-left .front-body { transform: translateX(-3px) skewX(3deg) scaleX(0.94); }
.motion-move-right .front-face .spirit-eye.left,
.motion-move-left .front-face .spirit-eye.right { opacity: 0.38; scale: 0.78 0.94; }

.motion-move-left .spirit-tail { animation: moveTailLeft 900ms ease-in-out both; }
.motion-move-right .spirit-tail { animation: moveTailRight 900ms ease-in-out both; }
.motion-move-left .spirit-arm.left,
.motion-move-right .spirit-arm.left { animation: moveArmLeft 900ms ease-in-out both; }
.motion-move-left .spirit-arm.right,
.motion-move-right .spirit-arm.right { animation: moveArmRight 900ms ease-in-out both; }
.motion-move-up .spirit-tail { animation: jumpTail 900ms ease-in-out both; }
.motion-move-down .spirit-tail { animation: downTail 900ms ease-in-out both; }
.motion-move-down .spirit-arm.left { animation: downArmLeft 900ms ease-in-out both; }
.motion-move-down .spirit-arm.right { animation: downArmRight 900ms ease-in-out both; }

.motion-joy .spirit-arm.left { animation: joyArmLeft 1.15s ease-in-out infinite; }
.motion-joy .spirit-arm.right { animation: joyArmRight 1.15s ease-in-out infinite; }
.motion-joy .spirit-eye { animation: joyEyes 1.15s ease-in-out infinite; }
.motion-joy .spirit-halo { animation-duration: 1.15s; }

.motion-surprise .spirit-arm.left { animation: surpriseArmLeft 1.7s ease-in-out infinite; }
.motion-surprise .spirit-arm.right { animation: surpriseArmRight 1.7s ease-in-out infinite; }
.motion-surprise .spirit-eye { animation: surpriseEyes 1.7s ease-in-out infinite; }
.motion-surprise .spirit-mouth { opacity: 0; }
.motion-surprise .spirit-mouth-surprise { animation: surpriseMouth 1.7s ease-in-out infinite; }
.motion-surprise .spirit-core { animation: surpriseCore 0.5s ease-in-out infinite; }

.motion-puzzled .spirit-arm.left { animation: puzzledArmLeft 2.4s ease-in-out infinite; }
.motion-puzzled .spirit-arm.right { animation: puzzledArmRight 2.4s ease-in-out infinite; }
.motion-puzzled .spirit-mouth { transform-box: fill-box; transform-origin: center; animation: puzzledMouth 2.4s ease-in-out infinite; }
.motion-puzzled .spirit-halo { animation: puzzledHalo 2.4s ease-in-out infinite; }

.motion-rest .spirit-arm.left,
.motion-rest .spirit-arm.right { animation: none; }
.motion-rest .spirit-eye { animation: restEyes 3.6s ease-in-out infinite; }
.motion-rest .spirit-form { animation: restGlow 3.6s ease-in-out infinite; }
.motion-rest .spirit-particles { opacity: 0.25; }

.projection-rings { position: absolute; right: 12px; bottom: 22px; left: 12px; height: 42px; border: 1px solid currentColor; border-radius: 50%; opacity: 0.48; animation: ringPulse 2.4s ease-in-out infinite; }
.projection-rings span { position: absolute; inset: 8px 28px; border: 1px dashed currentColor; border-radius: 50%; }
.projection-rings span:last-child { inset: 16px 62px; opacity: 0.65; }
.life-label { position: absolute; right: 0; bottom: 0; left: 0; color: rgba(216, 251, 255, 0.66); font-size: 10px; letter-spacing: 0.18em; text-align: center; }
.move-hint { position: absolute; z-index: 2; top: 90px; left: 50%; margin: 0; color: rgba(176, 247, 255, 0.72); font-size: 10px; letter-spacing: 0.12em; transform: translateX(-50%); pointer-events: none; }

.motion-panel { display: flex; min-height: 0; flex-direction: column; padding: 10px; background: rgba(4, 13, 16, 0.94); }
.motion-panel-heading { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 8px; color: var(--life-cyan); font-size: 11px; font-weight: 700; letter-spacing: 0.12em; }
.motion-panel-heading output { color: rgba(216, 251, 255, 0.68); letter-spacing: 0; }
.form-buttons { display: grid; grid-template-columns: minmax(0, 1fr) 88px 88px; align-items: center; gap: 6px; margin-bottom: 8px; color: rgba(109, 245, 255, 0.72); font-size: 10px; font-weight: 700; letter-spacing: 0.1em; }
.form-buttons button { width: 100% !important; min-height: 32px; padding: 3px 8px; background: rgba(4, 31, 36, 0.76); font-size: 12px; }
.form-buttons button.active { border-color: #b9fbff; background: rgba(24, 117, 132, 0.74); box-shadow: inset 0 0 12px rgba(109, 245, 255, 0.2); }
.motion-buttons { display: grid; width: 100%; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: 70px; align-content: start; gap: 6px; }
.motion-buttons button { box-sizing: border-box; display: grid; width: 100% !important; min-width: 0; gap: 2px; padding: 6px 4px; background: rgba(4, 31, 36, 0.76); font-size: 14px; transition: background 140ms ease, box-shadow 140ms ease, transform 140ms ease; }
.motion-code { color: rgba(109, 245, 255, 0.66); font-size: 9px; }
.motion-buttons button:hover,
.motion-buttons button.active { background: rgba(24, 117, 132, 0.74); box-shadow: inset 0 0 16px rgba(109, 245, 255, 0.24), 0 0 13px rgba(109, 245, 255, 0.2); }
.motion-buttons button:active { transform: translateY(1px); }

@keyframes scan { to { transform: translateY(540%); } }
@keyframes creatureFloat { 0%, 100% { transform: translateX(-50%) translateY(5px); } 50% { transform: translateX(-50%) translateY(-7px); } }
@keyframes corePulse { 0%, 100% { scale: 0.86; opacity: 0.65; } 50% { scale: 1.08; opacity: 1; } }
@keyframes eyeBlink { 0%, 45%, 49%, 100% { scale: 1 1; } 47% { scale: 1 0.12; } }
@keyframes auraPulse { 0%, 100% { scale: 0.96; opacity: 0.35; } 50% { scale: 1.04; opacity: 0.72; } }
@keyframes ringPulse { 0%, 100% { scale: 0.92; opacity: 0.3; } 50% { scale: 1.02; opacity: 0.62; } }
@keyframes haloDrift { 0%, 100% { transform: translateY(1px) rotate(-2deg); } 50% { transform: translateY(-4px) rotate(2deg); } }
@keyframes headWispBack { 0%, 100% { transform: rotate(-4deg) skewX(-3deg); } 50% { transform: rotate(5deg) skewX(4deg); } }
@keyframes headWispFront { 0%, 100% { transform: rotate(4deg) scaleY(0.94); } 50% { transform: rotate(-5deg) scaleY(1.06); } }
@keyframes spiritTailSway { 0%, 100% { transform: rotate(-3deg) skewX(-2deg); } 50% { transform: rotate(5deg) skewX(4deg); } }
@keyframes spiritArmLeft { 0%, 100% { transform: rotate(3deg); } 50% { transform: rotate(-8deg) translateY(-3px); } }
@keyframes spiritArmRight { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(8deg) translateY(-5px); } }
@keyframes particleBlink { 0%, 100% { opacity: 0.2; scale: 0.6; } 50% { opacity: 1; scale: 1.25; } }
@keyframes motionFloat { 0%, 100% { transform: translateX(-50%) translateY(10px); } 50% { transform: translateX(-50%) translateY(-18px); } }
@keyframes motionMoveLeft { 0%, 100% { transform: translateX(-50%); } 18% { transform: translateX(-50%) translateX(8px) rotate(3deg) scale(0.98, 1.02); } 55% { transform: translateX(-50%) translateX(-18px) rotate(-7deg); } }
@keyframes motionMoveRight { 0%, 100% { transform: translateX(-50%); } 18% { transform: translateX(-50%) translateX(-8px) rotate(-3deg) scale(0.98, 1.02); } 55% { transform: translateX(-50%) translateX(18px) rotate(7deg); } }
@keyframes motionMoveUp { 0%, 100% { transform: translateX(-50%); } 18% { transform: translateX(-50%) translateY(14px) scale(1.1, 0.86); } 55% { transform: translateX(-50%) translateY(-42px) scale(0.94, 1.08); } 78% { transform: translateX(-50%) translateY(-8px); } }
@keyframes motionMoveDown { 0%, 100% { transform: translateX(-50%); } 22% { transform: translateX(-50%) translateY(-12px) scale(0.96, 1.05); } 62% { transform: translateX(-50%) translateY(20px) scale(1.05, 0.92); } }
@keyframes motionJoy { 0%, 100% { transform: translateX(-50%) translateY(5px) rotate(-2deg); } 50% { transform: translateX(-50%) translateY(-18px) rotate(2deg) scale(1.04); } }
@keyframes motionSurprise { 0%, 14%, 100% { transform: translateX(-50%) translateY(5px) scale(1); } 25% { transform: translateX(-50%) translateY(-20px) scale(1.12, 0.92); } 42%, 72% { transform: translateX(-50%) translateY(-10px) scale(1.04); } }
@keyframes motionPuzzled { 0%, 100% { transform: translateX(-50%) translateY(4px) rotate(-5deg); } 50% { transform: translateX(-50%) translateY(-7px) rotate(7deg); } }
@keyframes motionRest { 0%, 100% { transform: translateX(-50%) translateY(18px) scale(0.97); opacity: 0.64; } 50% { transform: translateX(-50%) translateY(13px) scale(0.99); opacity: 0.78; } }

@keyframes moveArmLeft { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(8deg); } }
@keyframes moveArmRight { 0%, 100% { transform: rotate(14deg); } 50% { transform: rotate(-8deg); } }
@keyframes moveTailLeft { 0%, 100% { transform: rotate(0deg) skewX(0deg); } 52% { transform: rotate(9deg) skewX(8deg); } }
@keyframes moveTailRight { 0%, 100% { transform: rotate(0deg) skewX(0deg); } 52% { transform: rotate(-9deg) skewX(-8deg); } }
@keyframes jumpTail { 0%, 100% { transform: scaleY(0.88) skewX(-2deg); } 45% { transform: scaleY(1.12) skewX(3deg); } }
@keyframes downTail { 0%, 100% { transform: scaleY(1); } 52% { transform: translateY(-8px) scaleY(0.82) skewX(4deg); } }
@keyframes downArmLeft { 0%, 100% { transform: rotate(3deg); } 52% { transform: rotate(26deg) translateY(-5px); } }
@keyframes downArmRight { 0%, 100% { transform: rotate(-4deg); } 52% { transform: rotate(-26deg) translateY(-5px); } }
@keyframes joyArmLeft { 0%, 100% { transform: rotate(56deg); } 50% { transform: rotate(74deg) translateY(-3px); } }
@keyframes joyArmRight { 0%, 100% { transform: rotate(-56deg); } 50% { transform: rotate(-74deg) translateY(-3px); } }
@keyframes joyEyes { 0%, 100% { scale: 1 0.42; } 50% { scale: 1.08 0.24; } }
@keyframes surpriseArmLeft { 0%, 14%, 100% { transform: rotate(2deg); } 28%, 74% { transform: rotate(62deg); } }
@keyframes surpriseArmRight { 0%, 14%, 100% { transform: rotate(-2deg); } 28%, 74% { transform: rotate(-62deg); } }
@keyframes surpriseEyes { 0%, 14%, 100% { scale: 1; } 28%, 74% { scale: 1.45 1.25; } }
@keyframes surpriseMouth { 0%, 14%, 100% { opacity: 0; scale: 0.3; } 28%, 74% { opacity: 1; scale: 1.15; } }
@keyframes surpriseCore { 0%, 100% { scale: 0.88; opacity: 0.6; } 50% { scale: 1.28; opacity: 1; } }
@keyframes puzzledArmLeft { 0%, 100% { transform: rotate(2deg); } 50% { transform: rotate(-8deg); } }
@keyframes puzzledArmRight { 0%, 100% { transform: rotate(-58deg); } 50% { transform: rotate(-72deg) translateY(-3px); } }
@keyframes puzzledMouth { 0%, 100% { transform: rotate(-8deg) translateY(1px); } 50% { transform: rotate(8deg) translateY(-1px); } }
@keyframes puzzledHalo { 0%, 100% { transform: translate(-8px, 1px) rotate(-12deg); } 50% { transform: translate(8px, -3px) rotate(10deg); } }
@keyframes restEyes { 0%, 100% { scale: 1 0.16; opacity: 0.62; } 50% { scale: 1 0.1; opacity: 0.45; } }
@keyframes restGlow { 0%, 100% { opacity: 0.48; } 50% { opacity: 0.68; } }

@media (max-width: 720px) {
  .life-lab { padding: 12px; }
  .life-header { top: 10px; right: 10px; left: 10px; }
}
</style>
