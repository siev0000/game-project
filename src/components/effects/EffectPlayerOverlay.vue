<template>
  <div class="effect-player-root">
    <div class="effect-player-bar">
      <label class="effect-player-label" for="effect-select">再生エフェクト</label>
      <select id="effect-select" v-model="selectedEffectName" class="effect-player-select">
        <option
          v-for="name in effectOptions"
          :key="name"
          :value="name"
        >
          {{ name }}
        </option>
      </select>
      <button
        class="effect-player-button"
        :disabled="!selectedEffectName"
        @click="playSelectedEffect"
      >
        再生
      </button>
    </div>

    <div v-if="isEffectPlaying && playingEffectSrc" class="effect-preview-layer" aria-live="polite">
      <img
        :key="effectPlaybackKey"
        class="effect-preview-image"
        :src="playingEffectSrc"
        :alt="`effect-${playingEffectName}`"
      >
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import effectList from '@/assets/effect/320×240/effect_list.json'

const effectOptions = Array.isArray(effectList) ? effectList : []
const selectedEffectName = ref(effectOptions[0] || '')
const playingEffectName = ref('')
const playingEffectSrc = ref('')
const effectPlaybackKey = ref(0)
const isEffectPlaying = ref(false)
let effectPlaybackTimerId = null

const effectImageModules = import.meta.glob('/src/assets/effect/320×240/*.webp', {
  eager: true,
  import: 'default'
})
const effectImageMap = Object.fromEntries(
  Object.entries(effectImageModules).map(([filePath, fileUrl]) => {
    const fileName = filePath.split('/').pop() || ''
    const effectName = fileName.replace(/\.webp$/i, '')
    return [effectName, fileUrl]
  })
)

const playSelectedEffect = () => {
  const effectName = selectedEffectName.value
  if (!effectName) return
  const src = effectImageMap[effectName]
  if (!src) {
    console.warn(`[effect-player] エフェクト画像が見つかりません: ${effectName}`)
    return
  }
  if (effectPlaybackTimerId) {
    clearTimeout(effectPlaybackTimerId)
    effectPlaybackTimerId = null
  }
  playingEffectName.value = effectName
  playingEffectSrc.value = src
  effectPlaybackKey.value += 1
  isEffectPlaying.value = true
  effectPlaybackTimerId = setTimeout(() => {
    isEffectPlaying.value = false
    effectPlaybackTimerId = null
  }, 900)
}

onUnmounted(() => {
  if (effectPlaybackTimerId) {
    clearTimeout(effectPlaybackTimerId)
    effectPlaybackTimerId = null
  }
})
</script>

<style scoped>
.effect-player-bar {
  position: fixed;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 2200;
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(92vw, 720px);
  padding: 8px 10px;
  border: 1px solid #3aaed8;
  border-radius: 8px;
  background: rgba(6, 16, 24, 0.92);
  box-shadow: 0 0 10px rgba(58, 174, 216, 0.35);
}

.effect-player-label {
  font-size: 12px;
  color: #8fefff;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.effect-player-select {
  flex: 1 1 auto;
  min-width: 0;
  height: 32px;
  border: 1px solid #2a7f9e;
  border-radius: 6px;
  background: #0a1620;
  color: #d9f8ff;
  padding: 0 8px;
}

.effect-player-button {
  flex: 0 0 auto;
  height: 32px;
  padding: 0 14px;
  border: 1px solid #4cc9f0;
  border-radius: 6px;
  background: linear-gradient(180deg, #1f4f66, #163a4d);
  color: #e6fcff;
  font-weight: 700;
  cursor: pointer;
}

.effect-player-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.effect-preview-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2100;
  display: grid;
  place-items: center;
}

.effect-preview-image {
  width: min(52vw, 640px);
  image-rendering: auto;
  filter: drop-shadow(0 0 14px rgba(120, 220, 255, 0.55));
  opacity: 0;
  transform: scale(0.82);
  animation: effectPop 900ms ease-out forwards;
}

@keyframes effectPop {
  0% {
    opacity: 0;
    transform: scale(0.82);
  }
  12% {
    opacity: 1;
    transform: scale(1);
  }
  72% {
    opacity: 0.95;
    transform: scale(1.02);
  }
  100% {
    opacity: 0;
    transform: scale(1.1);
  }
}
</style>
