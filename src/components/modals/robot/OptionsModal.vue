<template>
  <Teleport to="body">
  <BaseHudModal
    :closeOnOverlay="false"
    frameWidth="min(1180px, 94vw)"
    frameHeight="min(90vh, 1050px)"
    frameMaxHeight="90vh"
    frameOverflow="hidden"
    @close="$emit('close')"
  >
    <div class="options-modal">
      <div class="options-header">
        <div class="options-title">OPTIONS</div>
        <button type="button" class="options-close" @click="$emit('close')">
          CLOSE
        </button>
      </div>
      <div class="options-body">
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
        <div class="options-section-title">EFFECT TEST</div>
        <label class="options-toggle-row">
          <span class="options-label">SPARK ON CLICK</span>
          <input type="checkbox" :checked="sparkEffectEnabled" @change="emit('update-spark-effect-enabled', $event.target.checked)" />
          <span class="options-toggle-value">{{ sparkEffectEnabled ? 'ON' : 'OFF' }}</span>
        </label>
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
    </div>
  </BaseHudModal>
  </Teleport>
</template>

<script setup>
import BaseHudModal from './BaseHudModal.vue'

const { seVolume, sparkEffectEnabled, gen4MarkerNodes, gen45MarkerNodes } = defineProps({
  seVolume: { type: Number, default: 100 },
  sparkEffectEnabled: { type: Boolean, default: false },
  gen4MarkerNodes: { type: Array, default: () => [] },
  gen45MarkerNodes: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'close',
  'update-se-volume',
  'update-spark-effect-enabled',
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
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 22px 26px;
  color: #bff6ff;
  font-family: Consolas, monospace;
}

.options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(95, 225, 255, 0.36);
}

.options-title {
  font-size: 22px;
  letter-spacing: 0.2em;
}

.options-close {
  min-width: 124px;
  padding: 10px 16px;
  border-radius: 6px;
  border: 1px solid rgba(160, 230, 255, 0.45);
  background: rgba(8, 16, 24, 0.8);
  color: #bff6ff;
  font-size: 16px;
  cursor: pointer;
}

.options-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  gap: 16px;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 10px 20px 2px;
  scrollbar-color: #53dcf4 #07131c;
  scrollbar-width: thin;
}

.options-body::-webkit-scrollbar { width: 12px; }
.options-body::-webkit-scrollbar-track { background: #07131c; border-left: 1px solid #1b5970; }
.options-body::-webkit-scrollbar-thumb { background: linear-gradient(#9cf8ff, #2086ab); border: 2px solid #07131c; border-radius: 8px; }

.options-section {
  border: 1px solid rgba(160, 230, 255, 0.2);
  border-radius: 10px;
  min-width: 0;
  padding: 16px;
  background: rgba(6, 12, 20, 0.6);
}

.options-section-title {
  font-size: 16px;
  letter-spacing: 0.12em;
  color: rgba(180, 245, 255, 0.8);
  margin-bottom: 10px;
}

.options-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  font-size: 16px;
}

.options-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  cursor: pointer;
}

.options-toggle-row input {
  accent-color: #60eaff;
}

.options-toggle-value {
  min-width: 28px;
  color: #fff1a8;
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
  font-size: 15px;
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
