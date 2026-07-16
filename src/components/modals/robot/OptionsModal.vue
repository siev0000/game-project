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
        <div class="options-section-title">G4 TARGET MARKER</div>
        <div class="options-row">
          <span class="options-label">NODES</span>
          <div class="options-stepper">
            <button type="button" class="options-stepper-button" @click="emit('update-gen4-marker-node-count', gen4MarkerNodes.length - 1)">-</button>
            <span class="options-value">{{ gen4MarkerNodes.length }}</span>
            <button type="button" class="options-stepper-button" @click="emit('update-gen4-marker-node-count', gen4MarkerNodes.length + 1)">+</button>
          </div>
        </div>
        <div v-for="(node, index) in gen4MarkerNodes" :key="index" class="marker-node-row">
          <span class="options-label">NODE {{ index + 1 }}</span>
          <input
            class="marker-color-input"
            type="color"
            :value="node.color"
            :aria-label="`G4 node ${index + 1} color`"
            @input="emit('update-gen4-marker-node-color', index, $event.target.value)"
          />
          <input
            class="options-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="Math.round(node.connectionStrength * 100)"
            :aria-label="`G4 node ${index + 1} connection strength`"
            @input="emit('update-gen4-marker-node-strength', index, $event.target.value)"
          />
          <span class="options-value">{{ Math.round(node.connectionStrength * 100) }}%</span>
        </div>
      </div>
      <div class="options-section">
        <div class="options-section-title">G4.5 TARGET MARKER</div>
        <div class="options-row">
          <span class="options-label">NODES</span>
          <div class="options-stepper">
            <button type="button" class="options-stepper-button" @click="emit('update-marker-node-count', gen45MarkerNodes.length - 1)">-</button>
            <span class="options-value">{{ gen45MarkerNodes.length }}</span>
            <button type="button" class="options-stepper-button" @click="emit('update-marker-node-count', gen45MarkerNodes.length + 1)">+</button>
          </div>
        </div>
        <div v-for="(node, index) in gen45MarkerNodes" :key="index" class="marker-node-row">
          <span class="options-label">NODE {{ index + 1 }}</span>
          <input
            class="marker-color-input"
            type="color"
            :value="node.color"
            :aria-label="`G4.5 node ${index + 1} color`"
            @input="emit('update-marker-node-color', index, $event.target.value)"
          />
          <input
            class="options-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="Math.round(node.connectionStrength * 100)"
            :aria-label="`G4.5 node ${index + 1} connection strength`"
            @input="emit('update-marker-node-strength', index, $event.target.value)"
          />
          <span class="options-value">{{ Math.round(node.connectionStrength * 100) }}%</span>
        </div>
      </div>
    </div>
  </BaseHudModal>
</template>

<script setup>
import BaseHudModal from './BaseHudModal.vue'

const { seVolume, gen4MarkerNodes, gen45MarkerNodes } = defineProps({
  seVolume: { type: Number, default: 100 },
  gen4MarkerNodes: { type: Array, default: () => [] },
  gen45MarkerNodes: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'close',
  'update-se-volume',
  'update-marker-node-count',
  'update-marker-node-color',
  'update-marker-node-strength',
  'update-gen4-marker-node-count',
  'update-gen4-marker-node-color',
  'update-gen4-marker-node-strength'
])

const onSeVolumeInput = (event) => {
  const raw = Number(event?.target?.value)
  const clamped = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 0))
  if (event?.target) {
    event.target.value = clamped
  }
  emit('update-se-volume', clamped)
}

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

.options-section + .options-section {
  margin-top: 12px;
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

.options-stepper,
.marker-node-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.options-stepper-button {
  width: 26px;
  height: 24px;
  border: 1px solid rgba(160, 230, 255, 0.35);
  border-radius: 5px;
  background: rgba(6, 12, 20, 0.7);
  color: #bff6ff;
  cursor: pointer;
}

.marker-node-row {
  display: grid;
  grid-template-columns: 58px 28px 1fr 42px;
  margin-top: 8px;
  font-size: 11px;
}

.marker-color-input {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
</style>
