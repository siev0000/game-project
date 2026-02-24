<template>
  <BaseHudModal @close="$emit('close')">
    <div class="options-modal">
      <div class="options-header">
        <div class="options-title">OPTIONS</div>
        <button type="button" class="options-close" @click="$emit('close')">
          CLOSE
        </button>
      </div>
      <div class="options-section">
        <div class="options-section-title">SOUND</div>
        <div class="options-row">
          <span class="options-label">SE</span>
          <input
            class="options-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="seVolume"
            @input="onSeVolumeInput"
          />
          <span class="options-value">{{ seVolume }}%</span>
        </div>
      </div>
      <div class="options-section">
        <div class="options-section-title">ALLY TARGET</div>
        <div class="options-gen-row">
          <button
            v-for="gen in generationOptions"
            :key="gen"
            type="button"
            class="options-gen-button"
            :class="{ active: gen === allyTargetGeneration }"
            @click="emit('update-ally-target-generation', gen)"
          >
            {{ generationLabel(gen) }}
          </button>
        </div>
      </div>
    </div>
  </BaseHudModal>
</template>

<script setup>
import BaseHudModal from './BaseHudModal.vue'

const { seVolume, allyTargetGeneration } = defineProps({
  seVolume: { type: Number, default: 100 },
  allyTargetGeneration: { type: Number, default: 1 }
})

const emit = defineEmits(['close', 'update-se-volume', 'update-ally-target-generation'])

const onSeVolumeInput = (event) => {
  const raw = Number(event?.target?.value)
  const clamped = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 0))
  if (event?.target) {
    event.target.value = clamped
  }
  emit('update-se-volume', clamped)
}

const generationOptions = [1, 2, 3, 4, 5, 6, 9]
const generationLabel = (gen) => (gen === 9 ? 'SP' : `G${gen}`)
</script>

<style scoped>
.options-modal {
  padding: 18px 20px 22px;
  color: #bff6ff;
  font-family: Consolas, monospace;
}

.options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.options-title {
  font-size: 16px;
  letter-spacing: 0.2em;
}

.options-close {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(160, 230, 255, 0.45);
  background: rgba(8, 16, 24, 0.8);
  color: #bff6ff;
  font-size: 12px;
  cursor: pointer;
}

.options-section {
  border: 1px solid rgba(160, 230, 255, 0.2);
  border-radius: 10px;
  padding: 12px;
  background: rgba(6, 12, 20, 0.6);
}

.options-section-title {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: rgba(180, 245, 255, 0.8);
  margin-bottom: 10px;
}

.options-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  font-size: 12px;
}

.options-gen-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.options-gen-button {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(160, 230, 255, 0.35);
  background: rgba(6, 12, 20, 0.7);
  color: rgba(190, 245, 255, 0.9);
  font-size: 12px;
  cursor: pointer;
}

.options-gen-button.active {
  border-color: rgba(190, 245, 255, 0.85);
  background: rgba(20, 60, 80, 0.9);
  box-shadow: 0 0 12px rgba(90, 200, 255, 0.35);
}

.options-slider {
  width: 100%;
}

.options-value {
  min-width: 46px;
  text-align: right;
}
</style>
