<template>
  <Teleport to="body">
    <BaseHudModal
      frame-width="calc(100vw - 16px)"
      frame-height="calc(100vh - 16px)"
      frame-max-height="none"
      frame-overflow="hidden"
      :frame-scale="1"
      :close-on-overlay="false"
      @close="close"
    >
      <section class="skill-effect-editor">
        <header class="editor-header">
          <div>
            <p>{{ editorMode === 'skill' ? 'SKILL EFFECT CONFIGURATION' : 'SOUND EFFECT DESIGNER' }}</p>
            <h2>{{ editorMode === 'skill' ? '技演出設定' : 'SE作成' }}</h2>
          </div>
          <button type="button" class="close-button" @click="close">閉じる</button>
        </header>

        <main v-if="editorMode === 'skill'" class="editor-main">
          <aside class="skill-list">
            <p>SKILL LIST</p>
            <button
              v-for="skill in draftSkills"
              :key="skill.id"
              type="button"
              :class="{ active: selectedSkillId === skill.id }"
              @click="selectedSkillId = skill.id"
            >
              <span>{{ skill.label }}</span>
              <small>{{ skill.effectName }}</small>
            </button>
          </aside>

          <div class="editor-detail">
            <section class="skill-preview">
              <div class="preview-heading">
                <p>PREVIEW</p>
                <h3>{{ selectedSkill.label }}</h3>
              </div>
              <div ref="previewStageRef" class="preview-stage">
                <div ref="previewCanvasRef" class="preview-effect-canvas" aria-hidden="true"></div>
                <div class="preview-target">TARGET</div>
              </div>
            </section>

            <section class="setting-panel">
              <div class="setting-scroll">
                <section class="setting-group">
                  <label>エフェクト
                    <select v-model="selectedSkill.effectName">
                      <option v-for="effect in effectOptions" :key="effect" :value="effect">{{ effect }}</option>
                    </select>
                  </label>
                  <label class="range-setting"><span>再生速度</span>
                    <input v-model.number="selectedSkill.speed" type="range" min="25" max="300" step="5">
                    <output>{{ selectedSkill.speed }}%</output>
                  </label>
                  <label class="range-setting"><span>大きさ</span>
                    <input v-model.number="selectedSkill.size" type="range" min="10" max="400" step="5">
                    <output>{{ selectedSkill.size }}%</output>
                  </label>
                  <label class="range-setting"><span>角度</span>
                    <input v-model.number="selectedSkill.angleDeg" type="range" min="-180" max="180" step="5">
                    <output>{{ selectedSkill.angleDeg }}deg</output>
                  </label>
                  <label class="range-setting"><span>開始遅延</span>
                    <input v-model.number="selectedSkill.effectDelayMs" type="range" min="0" max="2000" step="25">
                    <output>{{ selectedSkill.effectDelayMs }}ms</output>
                  </label>
                  <label class="range-setting"><span>ヒット回数</span>
                    <input v-model.number="selectedSkill.hitCount" type="range" min="1" max="8" step="1">
                    <output>{{ selectedSkill.hitCount }}</output>
                  </label>
                </section>
                <section class="setting-group sound-setting-group">
                  <div class="se-select-row">
                    <label>SE
                      <select v-model="selectedSkill.seKey" @change="selectedSkill.seMode = 'asset'">
                        <option value="">なし</option>
                        <option v-for="sound in soundOptions" :key="sound" :value="sound">{{ sound }}</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      class="sub-button"
                      :disabled="selectedSkill.seMode === 'synth' ? !selectedSkill.seSynth : !selectedSkill.seKey"
                      @click="previewSE"
                    >再生</button>
                  </div>
                  <label class="range-setting"><span>音量</span>
                    <input v-model.number="selectedSkill.seVolume" type="range" min="0" max="100" step="1">
                    <output>{{ selectedSkill.seVolume }}%</output>
                  </label>
                  <label class="range-setting"><span>開始遅延</span>
                    <input v-model.number="selectedSkill.seDelayMs" type="range" min="0" max="2000" step="25">
                    <output>{{ selectedSkill.seDelayMs }}ms</output>
                  </label>
                </section>
              </div>
            </section>
          </div>
        </main>

        <SoundEffectDesigner
          v-else
          :skill-label="selectedSkill.label"
          :settings="selectedSkill.seSynth"
          @apply="applySynthToSkill"
        />

        <footer class="editor-footer">
          <button type="button" class="mode-switch-button" @click="toggleEditorMode">
            {{ editorMode === 'skill' ? 'SE作成' : '技設定へ' }}
          </button>
          <div class="footer-actions">
            <input ref="settingsFileInput" class="settings-file-input" type="file" accept="application/json,.json" @change="importSettings">
            <button v-if="editorMode === 'skill'" type="button" class="preview-button" @click="previewSkill">演出を再生</button>
            <button type="button" class="sub-button" @click="openSettingsFile">JSON読込</button>
            <button type="button" class="sub-button" @click="resetSelectedSkill">選択中を初期化</button>
            <button type="button" class="apply-button" @click="save">JSON出力して反映</button>
          </div>
        </footer>
      </section>
    </BaseHudModal>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import Phaser from 'phaser'
import PhaserEffectPlayer from '@/components/effects/phaser-effect-player.mjs'
import BaseHudModal from './BaseHudModal.vue'
import SoundEffectDesigner from './SoundEffectDesigner.vue'
import { normalizeSoundSynth, playSynthSE } from '@/components/effects/soundEffectSynth.js'
import { SE_SOUNDS, playSE } from '@/constants/statData.js'

const props = defineProps({
  initialMode: { type: String, default: 'skill' },
  effectOptions: { type: Array, default: () => [] },
  skills: { type: Array, default: () => [] },
  getEffectSprite: { type: Function, default: null }
})
const emit = defineEmits(['close', 'apply'])

const normalizeSkill = (skill, fallback) => ({
  id: String(skill?.id || fallback.id),
  label: String(skill?.label || fallback.label),
  effectName: props.effectOptions.includes(skill?.effectName) ? skill.effectName : fallback.effectName,
  seKey: typeof skill?.seKey === 'string' ? skill.seKey : '',
  seMode: skill?.seMode === 'synth' ? 'synth' : 'asset',
  seSynth: skill?.seSynth ? normalizeSoundSynth(skill.seSynth) : null,
  seVolume: Math.max(0, Math.min(100, Number.isFinite(Number(skill?.seVolume)) ? Number(skill.seVolume) : 80)),
  seDelayMs: Math.max(0, Number(skill?.seDelayMs) || 0),
  speed: Math.max(25, Math.min(300, Number(skill?.speed) || 100)),
  size: Math.max(10, Math.min(400, Number(skill?.size) || 100)),
  angleDeg: Math.max(-180, Math.min(180, Number(skill?.angleDeg) || 0)),
  effectDelayMs: Math.max(0, Number(skill?.effectDelayMs) || 0),
  hitCount: Math.max(1, Math.min(8, Number(skill?.hitCount) || 1))
})
const defaultSkills = computed(() => props.skills.map(skill => normalizeSkill(skill, skill)))
const draftSkills = ref(defaultSkills.value)
const selectedSkillId = ref(draftSkills.value[0]?.id || '')
const editorMode = ref(props.initialMode === 'sound' ? 'sound' : 'skill')
const settingsFileInput = ref(null)
const previewStageRef = ref(null)
const previewCanvasRef = ref(null)
const soundOptions = computed(() => Object.keys(SE_SOUNDS).sort((a, b) => a.localeCompare(b, 'ja')))
const selectedSkill = computed(() => draftSkills.value.find(skill => skill.id === selectedSkillId.value) || draftSkills.value[0])
let previewGame = null
let previewScene = null
let previewResizeObserver = null
const previewPlayers = new Set()

const resizePreviewCanvas = () => {
  const stage = previewStageRef.value
  if (!previewGame || !stage) return
  previewGame.scale.resize(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight))
}
const createPreviewCanvas = async () => {
  await nextTick()
  const stage = previewStageRef.value
  const canvas = previewCanvasRef.value
  if (!stage || !canvas) return
  previewGame = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: canvas,
    width: Math.max(1, stage.clientWidth),
    height: Math.max(1, stage.clientHeight),
    transparent: true,
    banner: false,
    scene: { create () { previewScene = this } }
  })
  previewResizeObserver = new ResizeObserver(resizePreviewCanvas)
  previewResizeObserver.observe(stage)
}

const previewSE = () => {
  if (selectedSkill.value.seMode === 'synth' && selectedSkill.value.seSynth) {
    playSynthSE(selectedSkill.value.seSynth, { volume: selectedSkill.value.seVolume / 100 })
    return
  }
  if (!selectedSkill.value.seKey) return
  playSE(selectedSkill.value.seKey, { volume: selectedSkill.value.seVolume / 100 })
}
const applySynthToSkill = settings => {
  selectedSkill.value.seMode = 'synth'
  selectedSkill.value.seSynth = normalizeSoundSynth(settings)
  selectedSkill.value.seKey = ''
}
const toggleEditorMode = () => {
  editorMode.value = editorMode.value === 'skill' ? 'sound' : 'skill'
}
const previewSkill = async () => {
  const stage = previewStageRef.value
  const sprite = props.getEffectSprite?.(selectedSkill.value.effectName)
  if (!stage || !previewScene || !sprite?.source) return
  const player = new PhaserEffectPlayer(previewScene)
  previewPlayers.add(player)
  try {
    await player.play({
      src: sprite.source,
      x: stage.clientWidth / 2,
      y: stage.clientHeight / 2,
      angleDeg: selectedSkill.value.angleDeg,
      scalePercent: Math.max(1, selectedSkill.value.size),
      frameDurationMs: Math.max(16, Math.round(100 / Math.max(0.25, selectedSkill.value.speed / 100)))
    })
  } finally {
    player.destroy()
    previewPlayers.delete(player)
  }
}
const resetSelectedSkill = () => {
  const fallback = defaultSkills.value.find(skill => skill.id === selectedSkill.value.id)
  if (!fallback) return
  Object.assign(selectedSkill.value, structuredClone(fallback))
}
const openSettingsFile = () => settingsFileInput.value?.click()
const importSettings = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const parsed = JSON.parse(await file.text())
    const sourceSkills = Array.isArray(parsed) ? parsed : parsed?.skills
    if (!Array.isArray(sourceSkills)) return
    const byId = new Map(sourceSkills.map(skill => [String(skill?.id), skill]))
    draftSkills.value = defaultSkills.value.map(fallback => normalizeSkill(byId.get(fallback.id), fallback))
    selectedSkillId.value = draftSkills.value[0]?.id || ''
  } catch {
    // Keep the current draft when the selected file is invalid.
  } finally {
    event.target.value = ''
  }
}
const save = () => {
  const payload = draftSkills.value.map(skill => ({ ...skill }))
  const blob = new Blob([JSON.stringify({ version: 1, skills: payload }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'skillEffectSettings.json'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
  emit('apply', payload)
}
const close = () => emit('close')
onMounted(() => { void createPreviewCanvas() })
onBeforeUnmount(() => {
  previewResizeObserver?.disconnect()
  previewPlayers.forEach(player => player.destroy())
  previewPlayers.clear()
  previewGame?.destroy(true)
  previewGame = null
  previewScene = null
})
</script>

<style scoped>
.skill-effect-editor { height: 100%; min-width: 0; overflow: hidden; box-sizing: border-box; color: #d9f8ff; font-family: Consolas, monospace; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: 6px; padding: 4px; background: linear-gradient(135deg, rgba(3, 19, 29, .98), rgba(7, 39, 52, .96)); }
.editor-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.editor-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; }
.footer-actions { min-width: 0; display: flex; justify-content: flex-end; gap: 8px; }
.editor-header p, .skill-list > p, .preview-heading p { margin: 0; color: #70e9ff; font-size: 11px; letter-spacing: .16em; }
h2, h3, h4 { margin: 3px 0 0; } h2 { font-size: 28px; } h3 { font-size: 24px; } h4 { color: #ffe58b; font-size: 16px; letter-spacing: .1em; }
button, select, input { font: inherit; } button { cursor: pointer; }
.close-button, .sub-button, .apply-button, .preview-button, .mode-switch-button { min-width: 0; min-height: 36px; border: 1px solid #51dff8; color: #dcfbff; background: #06202d; padding: 0 10px; font-weight: 700; white-space: nowrap; }
.mode-switch-button { flex: 0 0 100px; border-color: #ffe078; color: #fff0ac; background: #302a0b; }
.footer-actions .preview-button { width: 110px; }
.footer-actions .sub-button { width: 130px; }
.footer-actions .apply-button { width: 170px; }
.apply-button, .preview-button { background: linear-gradient(135deg, #267a8e, #164454); border-color: #9af5ff; }
.editor-main { min-height: 0; overflow: hidden; display: grid; grid-template-columns: clamp(180px, 22vw, 250px) minmax(0, 1fr); border: 1px solid #286275; }
.editor-detail { min-width: 0; min-height: 0; display: grid; grid-template-rows: minmax(300px, 360px) minmax(0, 1fr); }
.skill-list, .skill-preview, .setting-panel { min-width: 0; max-width: 100%; box-sizing: border-box; padding: 6px; background: rgba(1, 13, 21, .68); }
.skill-list { display: grid; align-content: start; gap: 7px; border-right: 1px solid #286275; overflow-y: auto; }
.skill-list button { display: grid; gap: 4px; padding: 12px; text-align: left; border: 1px solid #1d5366; color: #d9f8ff; background: #061b27; font-size: 17px; }
.skill-list button.active { border-color: #91f7ff; background: #15546a; box-shadow: inset 0 0 16px rgba(84, 224, 247, .22); }
.skill-list small { color: #91b9c4; }
.skill-preview { display: grid; grid-template-columns: 1fr; align-content: start; gap: 12px; border-bottom: 1px solid #286275; }
.preview-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.preview-heading h3 { margin: 0; font-size: 20px; }
.preview-stage { position: relative; min-height: 240px; overflow: hidden; border: 1px solid #245668; background: radial-gradient(circle, #133d49 0%, #071a26 58%, #020c13); }
.preview-effect-canvas { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.preview-effect-canvas :deep(canvas) { display: block; width: 100% !important; height: 100% !important; }
.preview-target { position: absolute; z-index: 2; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px; display: grid; place-items: center; border: 1px dashed #a0eefa; border-radius: 50%; color: #a0eefa; font-size: 11px; pointer-events: none; }
.setting-panel { display: grid; min-height: 0; grid-template-rows: minmax(0, 1fr); }
.setting-scroll { min-width: 0; overflow-y: auto; overflow-x: hidden; display: grid; align-content: start; gap: 12px; padding-right: 8px; }
.setting-group { min-width: 0; max-width: 100%; box-sizing: border-box; display: grid; gap: 10px; padding: 13px; border: 1px solid #245668; background: rgba(3, 27, 39, .72); }
label { display: grid; gap: 5px; color: #c5ecf2; font-size: 15px; }
.se-select-row { display: grid; grid-template-columns: minmax(0, 1fr) 76px; align-items: end; gap: 8px; }
.se-select-row .sub-button { min-height: 40px; padding: 0 6px; }
.range-setting { grid-template-columns: clamp(68px, 16vw, 90px) minmax(0, 1fr) 54px; align-items: center; gap: 8px; min-height: 32px; }
.range-setting output { color: #ffe58b; text-align: right; white-space: nowrap; }
select { min-width: 0; max-width: 100%; min-height: 40px; box-sizing: border-box; border: 1px solid #38798d; color: #e1fbff; background: #061a26; padding: 0 8px; font-size: 15px; } input { min-width: 0; width: 100%; max-width: 100%; accent-color: #60e8ff; }
.settings-file-input { display: none; }
@media (max-width: 850px) { .editor-main { grid-template-columns: 160px minmax(0, 1fr); } .editor-footer, .footer-actions { gap: 5px; } .editor-footer button { padding: 0 4px; font-size: 11px; } .mode-switch-button { flex-basis: 78px; } .footer-actions .preview-button { width: 90px; } .footer-actions .sub-button { width: 104px; } .footer-actions .apply-button { width: 138px; } }
</style>
