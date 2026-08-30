<template>
  <section class="formation-editor-panel" aria-label="配置面調整">
    <header class="panel-header">
      <div class="panel-title">
        <strong>配置面調整</strong>
        <span :class="{ error: saveError }">{{ saveMessage }}</span>
      </div>
      <nav class="editor-tabs" aria-label="調整項目">
        <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">{{ tab.label }}</button>
      </nav>
      <button type="button" class="finish-button" @click="$emit('close')">調整終了</button>
    </header>

    <div v-if="activeTab === 'points'" class="panel-content point-grid">
      <fieldset v-for="control in pointControls" :key="control.key">
        <legend>{{ control.label }}</legend>
        <label>
          <span>X</span>
          <input v-model.number="control.point.x" type="range" min="0" max="100" step="0.5" @input="emitPreview" />
          <input v-model.number="control.point.x" type="number" min="0" max="100" step="0.5" @input="emitPreview" />
        </label>
        <label>
          <span>Y</span>
          <input v-model.number="control.point.y" type="range" min="0" max="100" step="0.5" @input="emitPreview" />
          <input v-model.number="control.point.y" type="number" min="0" max="100" step="0.5" @input="emitPreview" />
        </label>
      </fieldset>
    </div>

    <div v-else-if="activeTab === 'divisions'" class="panel-content division-grid">
      <label v-for="(value, index) in draft.columnBreaks" :key="`column-${index}`">
        <span>列 {{ index + 1 }}</span>
        <input v-model.number="draft.columnBreaks[index]" type="range" min="0.05" max="0.95" step="0.01" @input="emitPreview" />
        <input v-model.number="draft.columnBreaks[index]" type="number" min="0.05" max="0.95" step="0.01" @input="emitPreview" />
      </label>
      <label v-for="(value, index) in draft.rowBreaks" :key="`row-${index}`">
        <span>行 {{ index + 1 }}</span>
        <input v-model.number="draft.rowBreaks[index]" type="range" min="0.05" max="0.95" step="0.01" @input="emitPreview" />
        <input v-model.number="draft.rowBreaks[index]" type="number" min="0.05" max="0.95" step="0.01" @input="emitPreview" />
      </label>
      <p>列・行の値は0～1です。小さいほど左側／上側へ移動します。</p>
    </div>

    <div v-else-if="activeTab === 'characters'" class="panel-content character-settings">
      <div class="common-position-settings">
        <strong>全体位置（X：敵＋／味方－）</strong>
        <label>
          <span>X</span>
          <input v-model.number="draftPlacements.baseline.offsetX" type="range" min="-300" max="300" step="1" @input="emitPlacementPreview" />
          <input v-model.number="draftPlacements.baseline.offsetX" type="number" min="-300" max="300" step="1" @input="emitPlacementPreview" />
          <em>px</em>
        </label>
        <label>
          <span>Y</span>
          <input v-model.number="draftPlacements.baseline.offsetY" type="range" min="-200" max="200" step="1" @input="emitPlacementPreview" />
          <input v-model.number="draftPlacements.baseline.offsetY" type="number" min="-200" max="200" step="1" @input="emitPlacementPreview" />
          <em>px</em>
        </label>
      </div>
      <div class="unit-selector" aria-label="配置するキャラクター">
        <button
          v-for="control in placementControls"
          :key="control.key"
          type="button"
          :class="{ active: selectedUnitKey === control.key }"
          @click="selectPlacementUnit(control.key)"
        >
          <span>{{ control.side === 'enemy' ? '敵' : '味方' }}</span>{{ control.name }}
        </button>
      </div>
      <div v-if="selectedPlacementControl" class="placement-control">
        <strong>{{ selectedPlacementControl.name }}</strong>
        <label>
          <span>列</span>
          <select v-model="selectedPlacementControl.placement.column" @change="emitPlacementPreview">
            <option v-for="column in formationColumnOrder[selectedPlacementControl.side]" :key="column" :value="column">{{ columnLabels[column] }}</option>
          </select>
        </label>
        <label>
          <span>行</span>
          <select v-model.number="selectedPlacementControl.placement.row" @change="emitPlacementPreview">
            <option :value="0">1</option><option :value="1">2</option><option :value="2">3</option>
          </select>
        </label>
        <label class="offset-control">
          <span>X微調整</span>
          <input v-model.number="selectedPlacementControl.placement.offsetX" type="range" min="-300" max="300" step="1" @input="emitPlacementPreview" />
          <input v-model.number="selectedPlacementControl.placement.offsetX" type="number" min="-300" max="300" step="1" @input="emitPlacementPreview" />
          <em>px</em>
        </label>
        <label class="offset-control">
          <span>Y微調整</span>
          <input v-model.number="selectedPlacementControl.placement.offsetY" type="range" min="-200" max="200" step="1" @input="emitPlacementPreview" />
          <input v-model.number="selectedPlacementControl.placement.offsetY" type="number" min="-200" max="200" step="1" @input="emitPlacementPreview" />
          <em>px</em>
        </label>
        <button type="button" class="reset-offset-button" @click="resetSelectedOffset">微調整を0へ戻す</button>
      </div>
    </div>

    <div v-else-if="activeTab === 'appearance'" class="panel-content appearance-settings">
      <label>
        <span>線の太さ</span>
        <input v-model.number="draft.style.lineWidth" type="range" min="0.25" max="4" step="0.05" @input="emitPreview" />
        <input v-model.number="draft.style.lineWidth" type="number" min="0.25" max="4" step="0.05" @input="emitPreview" />
        <em>px</em>
      </label>
      <p>敵側・味方側のグリッド線へ共通で反映します。位置や区切りは変更しません。</p>
    </div>

    <div v-else class="panel-content json-panel">
      <p>保存先：<strong>battleFormationLayout.json / battleFormationUnits.json</strong></p>
      <textarea readonly :value="formattedJson"></textarea>
    </div>

    <footer class="panel-footer">
      <span>上の画面では色付きの基準点を直接ドラッグできます。</span>
      <button type="button" @click="restoreSaved">保存値へ戻す</button>
      <button type="button" class="save-button" :disabled="saving" @click="saveLayout">{{ saving ? '保存中…' : 'JSONへ保存' }}</button>
    </footer>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { formationColumnOrder, normalizeBattleFormationLayout, normalizeBattleFormationUnits } from '@/utils/battleFormationGeometry.js'

const props = defineProps({
  layout: { type: Object, required: true },
  placements: { type: Object, required: true },
  units: { type: Array, default: () => [] },
  selectedUnitKey: { type: String, default: '' }
})
const emit = defineEmits(['close', 'preview', 'saved', 'placement-preview', 'placement-saved', 'placement-select', 'mode-change'])
const clone = value => JSON.parse(JSON.stringify(value))
const savedLayout = ref(normalizeBattleFormationLayout(props.layout))
const draft = reactive(clone(savedLayout.value))
const unitGroups = computed(() => ({
  enemy: props.units.filter(unit => unit.side === 'enemy'),
  ally: props.units.filter(unit => unit.side === 'ally')
}))
const savedPlacements = ref(normalizeBattleFormationUnits(props.placements, unitGroups.value))
const draftPlacements = reactive(clone(savedPlacements.value))
const activeTab = ref('points')
const selectedUnitKey = ref(props.selectedUnitKey || props.units[0]?.key || '')
const saving = ref(false)
const saveError = ref(false)
const saveMessage = ref('実画面へリアルタイム反映中')
const tabs = [
  { id: 'points', label: '基準点' },
  { id: 'divisions', label: '3×3区切り' },
  { id: 'characters', label: 'キャラ配置' },
  { id: 'appearance', label: '表示' },
  { id: 'json', label: 'JSON' }
]

const pointControls = computed(() => [
  { key: 'enemyOuterTop', label: '敵・外側上', point: draft.field.enemyOuterTop },
  { key: 'enemyOuterBottom', label: '敵・外側下', point: draft.field.enemyOuterBottom },
  { key: 'centerTop', label: '中央・上', point: draft.field.centerTop },
  { key: 'centerBottom', label: '中央・下', point: draft.field.centerBottom },
  { key: 'allyOuterTop', label: '味方・外側上', point: draft.field.allyOuterTop },
  { key: 'allyOuterBottom', label: '味方・外側下', point: draft.field.allyOuterBottom }
])
const normalizedDraft = computed(() => normalizeBattleFormationLayout(draft))
const normalizedPlacements = computed(() => normalizeBattleFormationUnits(draftPlacements, unitGroups.value))
const formattedJson = computed(() => JSON.stringify({
  layout: normalizedDraft.value,
  placements: normalizedPlacements.value
}, null, 2))
const columnLabels = { back: '後列', middle: '中列', front: '前列' }
const placementControls = computed(() => props.units.map(unit => ({
  ...unit,
  placement: draftPlacements[unit.side]?.[String(unit.id)]
})).filter(control => control.placement))
const selectedPlacementControl = computed(() => placementControls.value.find(control => control.key === selectedUnitKey.value) || placementControls.value[0] || null)

const replaceDraft = value => {
  const next = normalizeBattleFormationLayout(value)
  Object.assign(draft.field, clone(next.field))
  draft.columnBreaks.splice(0, draft.columnBreaks.length, ...next.columnBreaks)
  draft.rowBreaks.splice(0, draft.rowBreaks.length, ...next.rowBreaks)
  Object.assign(draft.style, clone(next.style))
}
const replacePlacementDraft = value => {
  const next = normalizeBattleFormationUnits(value, unitGroups.value)
  Object.assign(draftPlacements.baseline, clone(next.baseline))
  draftPlacements.enemy = clone(next.enemy)
  draftPlacements.ally = clone(next.ally)
}
watch(() => props.layout, value => replaceDraft(value), { deep: true })
watch(() => props.placements, value => replacePlacementDraft(value), { deep: true })
watch(() => props.selectedUnitKey, value => { if (value) selectedUnitKey.value = value })
watch(activeTab, value => emit('mode-change', value), { immediate: true })
const emitPreview = () => emit('preview', clone(normalizedDraft.value))
const emitPlacementPreview = () => emit('placement-preview', clone(normalizedPlacements.value))
const selectPlacementUnit = key => {
  selectedUnitKey.value = key
  emit('placement-select', key)
}
const resetSelectedOffset = () => {
  if (!selectedPlacementControl.value) return
  selectedPlacementControl.value.placement.offsetX = 0
  selectedPlacementControl.value.placement.offsetY = 0
  emitPlacementPreview()
}
const restoreSaved = () => {
  replaceDraft(savedLayout.value)
  replacePlacementDraft(savedPlacements.value)
  emitPreview()
  emitPlacementPreview()
  saveError.value = false
  saveMessage.value = '保存済みのJSONへ戻しました'
}
const saveLayout = async () => {
  saving.value = true
  saveError.value = false
  saveMessage.value = '保存しています…'
  try {
    const [layoutResponse, placementResponse] = await Promise.all([
      fetch('/api/local/battle-formation-layout', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ layout: normalizedDraft.value })
      }),
      fetch('/api/local/battle-formation-units', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placements: normalizedPlacements.value })
      })
    ])
    const [layoutPayload, placementPayload] = await Promise.all([layoutResponse.json(), placementResponse.json()])
    if (!layoutResponse.ok) throw new Error(layoutPayload.error || '配置面の保存に失敗しました')
    if (!placementResponse.ok) throw new Error(placementPayload.error || 'キャラ配置の保存に失敗しました')
    savedLayout.value = normalizeBattleFormationLayout(layoutPayload)
    savedPlacements.value = normalizeBattleFormationUnits(placementPayload, unitGroups.value)
    replaceDraft(savedLayout.value)
    replacePlacementDraft(savedPlacements.value)
    emit('saved', clone(savedLayout.value))
    emit('placement-saved', clone(savedPlacements.value))
    saveMessage.value = '配置面とキャラ配置をJSONへ保存しました'
  } catch (error) {
    saveError.value = true
    saveMessage.value = error.message || '保存に失敗しました'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.formation-editor-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  color: #d8faff;
  background: #06161d;
  border: 1px solid #2fa4c7;
  font: 15px Consolas, monospace;
}
.panel-header {
  display: grid;
  grid-template-columns: minmax(170px, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  padding: 7px;
  border-bottom: 1px solid #245b6d;
}
.panel-title { display: grid; gap: 2px; min-width: 0; }
.panel-title strong { color: #62e3ff; font-size: 17px; }
.panel-title span { overflow: hidden; color: #a8ffc8; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.panel-title span.error { color: #ff9d9d; }
.editor-tabs { display: flex; gap: 5px; }
button {
  min-height: 36px;
  padding: 6px 10px;
  color: #e4fbff;
  background: #123746;
  border: 1px solid #4cc9f0;
  font: 15px Consolas, monospace;
  cursor: pointer;
}
button.active { color: #dfffea; background: #185b40; border-color: #8affbd; }
.finish-button { border-color: #f0ce77; }
.panel-content { min-height: 0; overflow: auto; padding: 8px; }
.point-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
fieldset { min-width: 0; margin: 0; padding: 5px 7px; border: 1px solid #245b6d; }
legend { padding: 0 4px; color: #effcff; font-size: 13px; }
label { display: grid; grid-template-columns: 20px minmax(70px, 1fr) 64px; align-items: center; gap: 6px; margin: 3px 0; }
input[type='range'] { width: 100%; accent-color: #45d8ff; }
input[type='number'] {
  width: 100%;
  box-sizing: border-box;
  padding: 4px 5px;
  color: #effcff;
  background: #031015;
  border: 1px solid #32758a;
  font: 15px Consolas, monospace;
}
.division-grid { display: grid; grid-template-columns: 1fr 1fr; align-content: start; gap: 8px 14px; }
.division-grid label { grid-template-columns: 42px minmax(100px, 1fr) 70px; margin: 0; padding: 8px; border: 1px solid #245b6d; }
.division-grid p { grid-column: 1 / -1; margin: 3px 0; color: #bad6dc; }
.character-settings { display: grid; align-content: start; gap: 8px; }
.common-position-settings { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 6px 10px; padding: 7px; border: 1px solid #3c7688; background: #0a222b; }
.common-position-settings > strong { grid-column: 1 / -1; color: #7ee8ff; font-size: 15px; }
.common-position-settings label { grid-template-columns: 18px minmax(80px, 1fr) 52px 16px; margin: 0; }
.common-position-settings em { color: #bad6dc; font-size: 13px; font-style: normal; }
.unit-selector { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
.unit-selector button { min-width: 0; min-height: 34px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.unit-selector button span { margin-right: 5px; color: #7ee8ff; font-size: 13px; }
.placement-control { display: grid; grid-template-columns: minmax(110px, 1fr) 120px 120px auto; align-items: center; gap: 7px; padding: 8px; border: 1px solid #245b6d; }
.placement-control > strong { overflow: hidden; color: #effcff; text-overflow: ellipsis; white-space: nowrap; }
.placement-control label { grid-template-columns: 34px minmax(70px, 1fr); margin: 0; }
.placement-control .offset-control { grid-column: span 2; grid-template-columns: 72px minmax(80px, 1fr) 62px 18px; }
.placement-control select { min-height: 32px; padding: 4px; color: #effcff; background: #031015; border: 1px solid #32758a; font: 15px Consolas, monospace; }
.placement-control em { color: #bad6dc; font-size: 13px; font-style: normal; }
.reset-offset-button { white-space: nowrap; }
.appearance-settings { display: grid; align-content: start; gap: 8px; }
.appearance-settings label { grid-template-columns: 90px minmax(160px, 1fr) 76px 24px; margin: 0; padding: 10px; border: 1px solid #245b6d; }
.appearance-settings label > span { color: #effcff; font-size: 15px; }
.appearance-settings em { color: #bad6dc; font-size: 13px; font-style: normal; }
.appearance-settings p { margin: 0; color: #bad6dc; font-size: 13px; }
.json-panel { display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 5px; }
.json-panel p { margin: 0; }
textarea { width: 100%; height: 100%; min-height: 100px; box-sizing: border-box; padding: 7px; color: #bcefff; background: #020b0f; border: 1px solid #32758a; font: 13px Consolas, monospace; resize: none; }
.panel-footer { display: flex; align-items: center; justify-content: flex-end; gap: 7px; padding: 7px; border-top: 1px solid #245b6d; }
.panel-footer span { margin-right: auto; color: #bad6dc; font-size: 13px; }
.save-button { min-width: 140px; color: #dcffea; background: #185b40; border-color: #8affbd; }
@media (max-width: 700px) {
  .panel-header { grid-template-columns: 1fr auto; }
  .panel-title { grid-column: 1 / -1; }
  .point-grid, .division-grid { grid-template-columns: 1fr; }
  .division-grid p { grid-column: 1; }
  .appearance-settings label { grid-template-columns: 78px minmax(90px, 1fr) 70px 20px; }
  .placement-control { grid-template-columns: 1fr 1fr; }
  .placement-control .offset-control { grid-column: 1 / -1; }
  .unit-selector { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .common-position-settings { grid-template-columns: 1fr; }
  .panel-footer span { display: none; }
}
</style>
