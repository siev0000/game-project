<template>
  <section class="sound-designer">
    <aside class="sound-presets">
      <p>SE TYPE</p>
      <div class="category-tabs">
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          :class="{ active: selectedCategory === category.id }"
          @click="selectedCategory = category.id"
        >{{ category.label }}</button>
      </div>
      <button
        v-for="preset in visiblePresets"
        :key="preset.id"
        type="button"
        class="preset-button"
        :class="{ active: draft.id === preset.id }"
        @click="loadPreset(preset)"
      >
        <strong>{{ preset.label }}</strong>
        <small>{{ presetSummary(preset) }}</small>
      </button>
    </aside>

    <div class="sound-workspace">
      <header class="designer-heading">
        <div>
          <p>SE DESIGN / {{ skillLabel }}</p>
          <h3>{{ draft.label }}</h3>
        </div>
        <div class="designer-actions">
          <button type="button" @click="preview">試聴</button>
          <button type="button" class="apply-sound" @click="applyToSkill">このスキルに適用</button>
        </div>
      </header>

      <div class="wave-monitor" aria-hidden="true">
        <svg viewBox="0 0 800 100" preserveAspectRatio="none">
          <path class="wave-grid" d="M0 50 H800 M200 0 V100 M400 0 V100 M600 0 V100" />
          <polyline class="wave-line" :points="wavePoints" />
        </svg>
        <span>{{ draft.durationMs }}ms</span>
      </div>

      <div class="designer-settings">
        <section class="designer-group">
          <label>波形
            <select v-model="draft.waveform" @change="markCustom">
              <option value="sine">サイン波</option>
              <option value="triangle">三角波</option>
              <option value="sawtooth">ノコギリ波</option>
              <option value="square">矩形波</option>
            </select>
          </label>
          <label class="designer-range"><span>開始音程</span><input v-model.number="draft.startFrequency" type="range" min="30" max="8000" step="10" @input="markCustom"><output>{{ draft.startFrequency }}Hz</output></label>
          <label class="designer-range"><span>終了音程</span><input v-model.number="draft.endFrequency" type="range" min="20" max="8000" step="10" @input="markCustom"><output>{{ draft.endFrequency }}Hz</output></label>
          <label class="designer-range"><span>長さ</span><input v-model.number="draft.durationMs" type="range" min="50" max="2000" step="10" @input="markCustom"><output>{{ draft.durationMs }}ms</output></label>
          <label class="designer-range"><span>立ち上がり</span><input v-model.number="draft.attackMs" type="range" min="0" max="500" step="5" @input="markCustom"><output>{{ draft.attackMs }}ms</output></label>
        </section>

        <section class="designer-group">
          <label class="designer-range"><span>電子波</span><input v-model.number="draft.oscillatorMix" type="range" min="0" max="100" step="1" @input="markCustom"><output>{{ draft.oscillatorMix }}%</output></label>
          <label class="designer-range"><span>ノイズ</span><input v-model.number="draft.noiseMix" type="range" min="0" max="100" step="1" @input="markCustom"><output>{{ draft.noiseMix }}%</output></label>
          <label class="designer-range"><span>重低音</span><input v-model.number="draft.bodyMix" type="range" min="0" max="100" step="1" @input="markCustom"><output>{{ draft.bodyMix }}%</output></label>
          <label class="designer-range"><span>衝撃音</span><input v-model.number="draft.transientMix" type="range" min="0" max="100" step="1" @input="markCustom"><output>{{ draft.transientMix }}%</output></label>
          <label class="designer-range"><span>高域</span><input v-model.number="draft.filterCutoff" type="range" min="200" max="16000" step="100" @input="markCustom"><output>{{ draft.filterCutoff }}Hz</output></label>
          <label class="designer-range"><span>共鳴</span><input v-model.number="draft.resonance" type="range" min="0" max="20" step="1" @input="markCustom"><output>{{ draft.resonance }}</output></label>
          <label class="designer-range"><span>歪み</span><input v-model.number="draft.distortion" type="range" min="0" max="100" step="1" @input="markCustom"><output>{{ draft.distortion }}%</output></label>
          <label class="designer-range"><span>音量</span><input v-model.number="draft.volume" type="range" min="0" max="100" step="1" @input="markCustom"><output>{{ draft.volume }}%</output></label>
        </section>

        <section class="designer-group">
          <label class="designer-range"><span>金属成分</span><input v-model.number="draft.metalMix" type="range" min="0" max="100" step="1" @input="markCustom"><output>{{ draft.metalMix }}%</output></label>
          <label class="designer-range"><span>金属音程</span><input v-model.number="draft.metalFrequency" type="range" min="200" max="8000" step="10" @input="markCustom"><output>{{ draft.metalFrequency }}Hz</output></label>
          <label class="designer-range"><span>金属余韻</span><input v-model.number="draft.metalDecayMs" type="range" min="30" max="2000" step="10" @input="markCustom"><output>{{ draft.metalDecayMs }}ms</output></label>
          <label class="designer-range"><span>不協和</span><input v-model.number="draft.metalDissonance" type="range" min="0" max="100" step="1" @input="markCustom"><output>{{ draft.metalDissonance }}%</output></label>
          <label class="designer-range"><span>振動速度</span><input v-model.number="draft.modulationRate" type="range" min="0" max="50" step="1" @input="markCustom"><output>{{ draft.modulationRate }}Hz</output></label>
          <label class="designer-range"><span>振動幅</span><input v-model.number="draft.modulationDepth" type="range" min="0" max="100" step="1" @input="markCustom"><output>{{ draft.modulationDepth }}%</output></label>
          <label class="designer-range"><span>残響間隔</span><input v-model.number="draft.echoMs" type="range" min="0" max="500" step="5" @input="markCustom"><output>{{ draft.echoMs }}ms</output></label>
          <label class="designer-range"><span>残響量</span><input v-model.number="draft.echoMix" type="range" min="0" max="80" step="1" @input="markCustom"><output>{{ draft.echoMix }}%</output></label>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  DEFAULT_SOUND_SYNTH,
  SOUND_SYNTH_PRESETS,
  normalizeSoundSynth,
  playSynthSE
} from '@/components/effects/soundEffectSynth.js'

const props = defineProps({
  skillLabel: { type: String, default: '' },
  settings: { type: Object, default: null }
})
const emit = defineEmits(['apply'])

const categories = [
  { id: 'elemental', label: '属性系' },
  { id: 'weapon', label: '武器系' },
  { id: 'electronic', label: '電子系' },
  { id: 'physical', label: '物理系' },
  { id: 'hybrid', label: '複合系' }
]
const selectedCategory = ref(props.settings?.category || 'elemental')
const draft = ref(normalizeSoundSynth(props.settings || DEFAULT_SOUND_SYNTH))
const visiblePresets = computed(() => SOUND_SYNTH_PRESETS.filter(preset => preset.category === selectedCategory.value))
const wavePoints = computed(() => {
  const points = []
  const frequencyRatio = Math.max(0.5, draft.value.startFrequency / 320)
  const noiseRatio = draft.value.noiseMix / 100
  for (let index = 0; index <= 80; index += 1) {
    const progress = index / 80
    const decay = 1 - progress
    const cycles = frequencyRatio * 8 * progress + (draft.value.endFrequency / 500) * progress * progress * 6
    const wave = Math.sin(cycles * Math.PI * 2) * 30 * decay * (draft.value.oscillatorMix / 100)
    const modulationDepth = draft.value.modulationDepth / 100
    const modulation = 1 - modulationDepth * 0.5 + Math.sin(progress * draft.value.modulationRate * Math.PI * 2) * modulationDepth * 0.5
    const deterministicNoise = Math.sin(index * 12.9898) * 13 * noiseRatio * decay
    points.push(`${index * 10},${50 - wave * modulation - deterministicNoise}`)
  }
  return points.join(' ')
})

const presetSummary = preset => `${preset.durationMs}ms / 波形${preset.oscillatorMix}% / ノイズ${preset.noiseMix}%`
const loadPreset = preset => {
  draft.value = normalizeSoundSynth({ ...preset, volume: draft.value.volume })
}
const markCustom = () => {
  draft.value.id = 'custom'
  draft.value.label = 'カスタムSE'
}
const preview = () => playSynthSE(draft.value)
const applyToSkill = () => emit('apply', normalizeSoundSynth(draft.value))

watch(() => props.settings, settings => {
  draft.value = normalizeSoundSynth(settings || DEFAULT_SOUND_SYNTH)
  selectedCategory.value = draft.value.category
})
</script>

<style scoped>
.sound-designer { min-height: 0; overflow: hidden; display: grid; grid-template-columns: clamp(180px, 22vw, 250px) minmax(0, 1fr); border: 1px solid #286275; color: #d9f8ff; background: rgba(1, 13, 21, .72); }
.sound-presets { min-width: 0; overflow-y: auto; display: grid; align-content: start; gap: 7px; padding: 8px; border-right: 1px solid #286275; }
.sound-presets > p, .designer-heading p { margin: 0; color: #70e9ff; font-size: 11px; letter-spacing: .16em; }
.category-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; }
.category-tabs button:last-child:nth-child(odd) { grid-column: 1 / -1; }
button, select, input { font: inherit; }
button { min-width: 0; border: 1px solid #286275; color: #d9f8ff; background: #061b27; cursor: pointer; }
.category-tabs button { min-height: 30px; padding: 0 3px; font-size: 12px; }
.category-tabs button.active, .preset-button.active { border-color: #8ff3ff; background: #17556a; }
.preset-button { display: grid; gap: 4px; padding: 11px; text-align: left; }
.preset-button strong { font-size: 16px; }
.preset-button small { color: #8eb8c2; overflow: hidden; text-overflow: ellipsis; font-size: 11px; line-height: 1.4; }
.sound-workspace { min-width: 0; min-height: 0; overflow: hidden; display: grid; grid-template-rows: auto 116px minmax(0, 1fr); gap: 8px; padding: 10px; }
.designer-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.designer-heading h3 { margin: 3px 0 0; font-size: 22px; }
.designer-actions { display: flex; gap: 7px; }
.designer-actions button { min-height: 36px; padding: 0 14px; font-size: 14px; font-weight: 700; white-space: nowrap; }
.designer-actions .apply-sound { border-color: #9af5ff; background: #236d80; }
.wave-monitor { position: relative; overflow: hidden; border: 1px solid #245668; background: linear-gradient(rgba(6, 28, 39, .9), rgba(2, 14, 22, .96)); }
.wave-monitor svg { display: block; width: 100%; height: 100%; }
.wave-grid { fill: none; stroke: rgba(92, 204, 225, .15); stroke-width: 1; }
.wave-line { fill: none; stroke: #71edff; stroke-width: 2; filter: drop-shadow(0 0 5px #42dff6); }
.wave-monitor span { position: absolute; right: 8px; bottom: 5px; color: #ffe58b; font-size: 12px; }
.designer-settings { min-height: 0; overflow-y: auto; overflow-x: hidden; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-content: start; gap: 8px; padding-right: 5px; }
.designer-group { min-width: 0; display: grid; align-content: start; gap: 9px; padding: 12px; border: 1px solid #245668; background: rgba(3, 27, 39, .72); }
label { min-width: 0; display: grid; gap: 4px; color: #c5ecf2; font-size: 14px; }
select { min-width: 0; width: 100%; min-height: 36px; box-sizing: border-box; border: 1px solid #38798d; color: #e1fbff; background: #061a26; padding: 0 7px; }
.designer-range { grid-template-columns: 82px minmax(0, 1fr) 72px; align-items: center; gap: 7px; min-height: 30px; }
.designer-range input { min-width: 0; width: 100%; accent-color: #60e8ff; }
.designer-range output { color: #ffe58b; text-align: right; white-space: nowrap; }
@media (max-width: 850px) {
  .sound-designer { grid-template-columns: 160px minmax(0, 1fr); }
  .designer-heading { display: grid; grid-template-columns: minmax(0, 1fr) 200px; }
  .designer-actions { display: grid; grid-template-columns: 62px minmax(0, 1fr); gap: 5px; }
  .designer-settings { grid-template-columns: 1fr; }
  .designer-actions button { padding: 0 4px; font-size: 11px; }
}
</style>
