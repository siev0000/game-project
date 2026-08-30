<template>
  <Teleport to="body">
    <BaseHudModal frame-width="calc(100vw - 16px)" frame-height="calc(100vh - 16px)" frame-max-height="none" frame-overflow="hidden" :frame-scale="1" :close-on-overlay="false" @close="close">
      <section class="editor">
        <header class="editor-header">
          <div><p>EFFECT WORKBENCH / PHASER 2D</p><h2>技エフェクト作成</h2></div>
          <div class="header-summary"><strong>{{ draft.name || 'untitled' }}</strong><span>{{ draft.layers.length }} layers</span></div>
          <div class="header-actions"><button class="icon-button" type="button" title="JSON出力" aria-label="JSON出力" @click="download">⇩</button><button class="save icon-button" type="button" title="保存して反映" aria-label="保存して反映" @click="save">💾</button><button class="icon-button" type="button" title="閉じる" aria-label="閉じる" @click="close">×</button></div>
        </header>

        <main>
          <section class="preview-pane">
            <div class="preview-toolbar">
              <div class="position-settings">
                <strong>位置</strong>
                <div class="point-input origin-input" title="発射点"><span>●</span><label>X<input v-model.number="draft.preview.origin.x" aria-label="発射点X" type="number" min="0" max="100">%</label><label>Y<input v-model.number="draft.preview.origin.y" aria-label="発射点Y" type="number" min="0" max="100">%</label></div>
                <div class="point-input target-input" title="着弾点"><span>♦</span><label>X<input v-model.number="draft.preview.target.x" aria-label="着弾点X" type="number" min="0" max="100">%</label><label>Y<input v-model.number="draft.preview.target.y" aria-label="着弾点Y" type="number" min="0" max="100">%</label></div>
                <button class="icon-button reset-points" type="button" title="位置を初期化" aria-label="位置を初期化" @click="resetPreviewPoints">↺</button>
              </div>
              <div class="basic-settings">
                <label>エフェクト名<input v-model="draft.name"></label><label>FPS<input v-model.number="draft.fps" type="number" min="1" max="60"></label><label>総フレーム<input v-model.number="draft.frameCount" type="number" min="1" max="180"></label>
              </div>
            </div>
            <div ref="preview" class="preview" :class="{ playing: isPlaying }" data-testid="effect-preview">
              <div ref="stage" class="stage"></div>
              <div class="path-guide" :style="guideStyle"></div>
              <button class="point-handle origin" :style="pointStyle('origin')" type="button" title="発射点" aria-label="発射点を移動" @pointerdown="startPointDrag('origin', $event)">●</button>
              <button class="point-handle target" :style="pointStyle('target')" type="button" title="着弾点" aria-label="着弾点を移動" @pointerdown="startPointDrag('target', $event)">♦</button>
            </div>
            <div class="transport">
              <button class="icon-button" type="button" title="再生" aria-label="再生" @click="play">▶</button><button class="icon-button" type="button" title="停止" aria-label="停止" @click="stop">■</button>
              <label>確認フレーム <output>{{ frame }} / {{ Math.max(0, draft.frameCount - 1) }}</output><input v-model.number="frame" type="range" min="0" :max="Math.max(0, draft.frameCount - 1)"></label>
            </div>
          </section>

          <section class="settings-pane">
            <div class="edit-grid">
              <section class="layer-panel">
                <div class="section-title layer-title"><h3>レイヤー</h3><div class="template-add"><select v-model="selectedTemplateName" class="template-select" aria-label="追加するテンプレート"><option v-for="item in templates" :key="item.name" :value="item.name">{{ item.name }}</option></select><button class="icon-button" type="button" title="選択したテンプレートを追加" aria-label="選択したテンプレートを追加" @click="addSelectedTemplate">＋</button></div></div>
                <button v-for="(item,index) in draft.layers" :key="item.id" type="button" class="layer-row" :class="{ active:index === selected }" @click="selected = index">
                  <span>{{ index + 1 }}. {{ label(item.type) }}</span><small>{{ anchorLabel(item.anchor) }}</small><i><b :style="timelineBar(item)"></b></i>
                </button>
              </section>
              <section v-if="active" class="detail-panel">
                <div class="section-title detail-title">
                  <h3>{{ label(active.type) }}</h3>
                  <div class="detail-head-actions"><button type="button" :class="{ active: detailTab === 'motion' }" @click="detailTab = 'motion'">動き</button><button type="button" :class="{ active: detailTab === 'basic' }" @click="detailTab = 'basic'">基本</button><button class="danger icon-button" type="button" title="レイヤー削除" aria-label="レイヤー削除" @click="removeLayer">🗑</button></div>
                </div>

                <div v-if="detailTab === 'motion'" class="motion-editor">
                  <div class="motion-toolbar"><strong>フレーム <output>{{ frame }}</output></strong><div><button class="icon-button" type="button" title="現在フレームにキーフレームを追加" aria-label="キーフレーム追加" @click="addKeyframe">＋</button><button class="icon-button" type="button" title="現在のキーフレームを削除" aria-label="キーフレーム削除" :disabled="!currentKeyframe" @click="removeKeyframe">−</button></div></div>
                  <div class="frame-timeline" aria-label="モーションタイムライン">
                    <button v-for="index in Math.max(1, draft.frameCount)" :key="index" type="button" :aria-label="`フレーム ${index - 1}`" :class="{ current: frame === index - 1, keyed: hasKeyframe(active, index - 1) }" @click="frame = index - 1"><span>{{ index - 1 }}</span><i></i></button>
                  </div>
                  <div v-if="currentKeyframe" class="keyframe-settings">
                    <label>次のキーまで<select v-model="currentKeyframe.easing"><option value="linear">一定</option><option value="easeIn">ゆっくり開始</option><option value="easeOut">素早く開始</option><option value="easeInOut">両端を滑らかに</option></select></label>
                    <label>位置 X<input v-model.number="currentKeyframe.x" type="number"></label><label>位置 Y<input v-model.number="currentKeyframe.y" type="number"></label>
                    <label>サイズ<input v-model.number="currentKeyframe.size" type="number" min="1"></label><label>長さ<input v-model.number="currentKeyframe.length" type="number" min="1"></label>
                    <label>太さ<input v-model.number="currentKeyframe.thickness" type="number" min="1"></label><label>回転<input v-model.number="currentKeyframe.rotation" type="number"></label><label>透明度<input v-model.number="currentKeyframe.alpha" type="number" min="0" max="100"></label>
                  </div>
                  <div v-else class="keyframe-empty"><p>このフレームにはキーがありません</p><button type="button" @click="addKeyframe">キーフレームを追加</button></div>
                </div>

                <div v-else class="property-grid">
                  <label>種類<select v-model="active.type"><option v-for="item in types" :key="item" :value="item">{{ label(item) }}</option></select></label>
                  <label>発生位置<select v-model="active.anchor"><option value="origin">発射点</option><option value="path">発射点と着弾点の間</option><option value="target">着弾点</option></select></label>
                  <label v-if="active.anchor === 'path'">経路位置 <output>{{ Math.round(active.pathPosition * 100) }}%</output><input v-model.number="active.pathPosition" type="range" min="0" max="1" step="0.01"></label>
                  <label class="check"><input v-model="active.followPath" type="checkbox">着弾点の方向へ回転</label>
                  <label v-if="active.type === 'beam' || active.type === 'lightning'" class="check"><input v-model="active.fitPath" type="checkbox">発射点から着弾点まで伸ばす</label>
                  <div class="pair"><label>基準位置X<input v-model.number="active.x" type="number"></label><label>基準位置Y<input v-model.number="active.y" type="number"></label></div>
                  <div class="pair"><label>開始フレーム<input v-model.number="active.startFrame" type="number" min="0"></label><label>終了フレーム<input v-model.number="active.endFrame" type="number" min="0"></label></div>
                  <label>色<input v-model="active.color" type="color"></label><label>基準サイズ <output>{{ active.size }}</output><input v-model.number="active.size" type="range" min="1" max="600"></label>
                  <label>基準の長さ <output>{{ active.length }}</output><input v-model.number="active.length" type="range" min="1" max="1000"></label><label>基準の太さ <output>{{ active.thickness }}</output><input v-model.number="active.thickness" type="range" min="1" max="60"></label>
                  <label>基準の回転 <output>{{ active.rotation }}°</output><input v-model.number="active.rotation" type="range" min="-180" max="180"></label><label>基準透明度 <output>{{ active.alpha }}%</output><input v-model.number="active.alpha" type="range" min="0" max="100"></label>
                  <div v-if="active.type === 'lightning'" class="pair"><label>分岐数<input v-model.number="active.branches" type="number" min="1" max="12"></label><label>折れ曲がり<input v-model.number="active.jitter" type="number" min="0" max="200"></label></div>
                  <label v-if="active.type === 'particles'">粒子数 <output>{{ active.particleCount }}</output><input v-model.number="active.particleCount" type="range" min="1" max="60"></label>
                </div>
              </section>
            </div>
          </section>
        </main>

      </section>
    </BaseHudModal>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Phaser from 'phaser'
import BaseHudModal from './BaseHudModal.vue'
import EffectRenderer, { resolveEffectLayerFrame } from '@/components/effects/EffectRenderer.js'
import * as effectTemplateFunctions from '@/components/effects/effectTemplates.js'

const emit = defineEmits(['close', 'apply'])
const types = ['slash', 'ring', 'shockwave', 'beam', 'lightning', 'particles']
const names = { slash: '斬撃', ring: 'リング', shockwave: '衝撃波', beam: 'ビーム', lightning: '雷', particles: '粒子' }
const anchors = { origin: '発射点', path: '経路上', target: '着弾点' }
const label = type => names[type] || type
const anchorLabel = value => anchors[value] || anchors.target
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
let serial = 0
const layer = (type = 'slash', values = {}) => ({
  id: `layer-${++serial}`,
  type,
  anchor: 'target',
  pathPosition: 0.5,
  followPath: true,
  fitPath: false,
  x: 0,
  y: 0,
  size: type === 'slash' ? 48 : 160,
  length: type === 'slash' ? 64 : 250,
  thickness: type === 'slash' ? 2 : 7,
  rotation: 0,
  alpha: 100,
  fadeOut: 100,
  startFrame: 0,
  endFrame: 7,
  moveX: 0,
  moveY: 0,
  grow: 0,
  rotateBy: 0,
  color: '#aeefff',
  branches: 5,
  jitter: 42,
  particleCount: 16,
  keyframes: [],
  ...values
})
const templates = Object.entries(effectTemplateFunctions)
  .filter(([, create]) => typeof create === 'function')
  .map(([name, create]) => ({ name, create }))
const DEFAULT_PREVIEW_POINTS = Object.freeze({ origin: Object.freeze({ x: 24, y: 55 }), target: Object.freeze({ x: 76, y: 45 }) })
const draft = ref({ name: 'new_effect', fps: 12, frameCount: 8, preview: { origin: { ...DEFAULT_PREVIEW_POINTS.origin }, target: { ...DEFAULT_PREVIEW_POINTS.target } }, layers: [layer()] })
const selected = ref(0)
const frame = ref(0)
const isPlaying = ref(false)
const detailTab = ref('motion')
const selectedTemplateName = ref(templates.some(item => item.name === 'slash') ? 'slash' : templates[0]?.name || '')
const preview = ref(null)
const stage = ref(null)
const stageSize = ref({ width: 1, height: 1 })
const active = computed(() => draft.value.layers[selected.value])
const currentKeyframe = computed(() => active.value?.keyframes?.find(key => Math.floor(Number(key.frame)) === Math.floor(Number(frame.value))))
const resolvedMotion = computed(() => active.value ? resolveEffectLayerFrame(active.value, frame.value) : null)
let game
let renderer
let observer
let draggingPoint = null
let previousTextRenderer = null

const pointPixels = key => ({ x: clamp(draft.value.preview[key].x, 0, 100) / 100 * stageSize.value.width, y: clamp(draft.value.preview[key].y, 0, 100) / 100 * stageSize.value.height })
const pointStyle = key => ({ left: `${clamp(draft.value.preview[key].x, 0, 100)}%`, top: `${clamp(draft.value.preview[key].y, 0, 100)}%` })
const guideStyle = computed(() => { const a = pointPixels('origin'); const b = pointPixels('target'); return { left: `${a.x}px`, top: `${a.y}px`, width: `${Math.hypot(b.x - a.x, b.y - a.y)}px`, transform: `rotate(${Math.atan2(b.y - a.y, b.x - a.x)}rad)` } })
const redraw = () => { if (renderer) renderer.renderFrame(draft.value, Math.min(frame.value, Math.max(0, draft.value.frameCount - 1)), { origin: pointPixels('origin'), target: pointPixels('target') }) }
const resize = () => { if (!preview.value) return; stageSize.value = { width: Math.max(1, preview.value.clientWidth), height: Math.max(1, preview.value.clientHeight) }; game?.scale.resize(stageSize.value.width, stageSize.value.height); redraw() }
const create = async () => { await nextTick(); if (!stage.value) return; resize(); game = new Phaser.Game({ type: Phaser.CANVAS, parent: stage.value, width: stageSize.value.width, height: stageSize.value.height, transparent: true, banner: false, scene: { create () { renderer = new EffectRenderer(this); redraw() } } }); observer = new ResizeObserver(resize); observer.observe(preview.value) }
const play = () => {
  if (!renderer) return
  isPlaying.value = true
  renderer.play(draft.value, { origin: pointPixels('origin'), target: pointPixels('target'), onComplete: () => { isPlaying.value = false; redraw() } })
}
const stop = () => { isPlaying.value = false; renderer?.stop(); redraw() }
const startPointDrag = (key, event) => { draggingPoint = key; event.currentTarget.setPointerCapture?.(event.pointerId); movePoint(event) }
const movePoint = event => { if (!draggingPoint || !preview.value) return; const rect = preview.value.getBoundingClientRect(); draft.value.preview[draggingPoint].x = Math.round(clamp((event.clientX - rect.left) / rect.width * 100, 0, 100)); draft.value.preview[draggingPoint].y = Math.round(clamp((event.clientY - rect.top) / rect.height * 100, 0, 100)) }
const endPointDrag = () => { draggingPoint = null }
const resetPreviewPoints = () => { draft.value.preview.origin = { ...DEFAULT_PREVIEW_POINTS.origin }; draft.value.preview.target = { ...DEFAULT_PREVIEW_POINTS.target } }
const hasKeyframe = (item, targetFrame) => Array.isArray(item?.keyframes) && item.keyframes.some(key => Math.floor(Number(key.frame)) === targetFrame)
const addKeyframe = () => {
  if (!active.value || currentKeyframe.value) return
  if (!Array.isArray(active.value.keyframes)) active.value.keyframes = []
  const resolved = resolveEffectLayerFrame(active.value, frame.value)
  active.value.keyframes.push({
    frame: Math.floor(Number(frame.value) || 0),
    easing: 'easeOut',
    x: Number(resolved.x) || 0,
    y: Number(resolved.y) || 0,
    size: Number(resolved.size) || 1,
    length: Number(resolved.length) || 1,
    thickness: Number(resolved.thickness) || 1,
    rotation: Number(resolved.rotation) || 0,
    alpha: Number.isFinite(Number(resolved.alpha)) ? Number(resolved.alpha) : 100
  })
  active.value.keyframes.sort((a, b) => Number(a.frame) - Number(b.frame))
}
const removeKeyframe = () => {
  if (!active.value || !currentKeyframe.value) return
  const index = active.value.keyframes.indexOf(currentKeyframe.value)
  if (index >= 0) active.value.keyframes.splice(index, 1)
}
const removeLayer = () => { if (draft.value.layers.length < 2) return; draft.value.layers.splice(selected.value, 1); selected.value = Math.max(0, selected.value - 1) }
const addSelectedTemplate = () => {
  const item = templates.find(template => template.name === selectedTemplateName.value)
  if (!item) return
  const templateLayers = item.create()
  if (!Array.isArray(templateLayers)) return
  const firstAddedIndex = draft.value.layers.length
  draft.value.layers.push(...templateLayers.map(value => layer(value.type, { ...value })))
  selected.value = firstAddedIndex
}
const timelineBar = item => ({ left: `${clamp(item.startFrame / Math.max(1, draft.value.frameCount) * 100, 0, 100)}%`, width: `${Math.max(3, (item.endFrame - item.startFrame + 1) / Math.max(1, draft.value.frameCount) * 100)}%`, background: item.color })
const json = () => structuredClone(draft.value)
const download = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(json(), null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = `${draft.value.name || 'effect'}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0) }
const save = () => emit('apply', json())
const close = () => emit('close')

watch([draft, frame], redraw, { deep: true })
watch(() => draft.value.frameCount, value => { frame.value = clamp(frame.value, 0, Math.max(0, Math.floor(Number(value) || 1) - 1)) })
onMounted(() => {
  previousTextRenderer = window.render_game_to_text
  window.render_game_to_text = () => JSON.stringify({ screen: 'effect-editor', coordinateSystem: 'preview percent, origin top-left, x right, y down', origin: draft.value.preview.origin, target: draft.value.preview.target, selectedLayer: active.value?.type, selectedAnchor: active.value?.anchor, selectedSize: active.value?.size, selectedThickness: active.value?.thickness, frame: frame.value, layerCount: draft.value.layers.length, keyframeFrames: active.value?.keyframes?.map(key => key.frame) || [], activeKeyframe: currentKeyframe.value ? { ...currentKeyframe.value } : null, resolvedMotion: resolvedMotion.value ? { x: resolvedMotion.value.x, y: resolvedMotion.value.y, size: resolvedMotion.value.size, length: resolvedMotion.value.length, thickness: resolvedMotion.value.thickness, rotation: resolvedMotion.value.rotation, alpha: resolvedMotion.value.alpha } : null, playing: isPlaying.value })
  window.addEventListener('pointermove', movePoint)
  window.addEventListener('pointerup', endPointDrag)
  void create()
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', movePoint)
  window.removeEventListener('pointerup', endPointDrag)
  if (previousTextRenderer) window.render_game_to_text = previousTextRenderer
  observer?.disconnect(); renderer?.destroy(); game?.destroy(true)
})
</script>

<style scoped>
.editor{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:8px;padding:8px;color:#dffbff;background:#041521;font-family:Consolas,monospace}.editor-header,footer{display:flex;justify-content:space-between;align-items:center;gap:12px}.editor-header>div{min-width:260px}.editor-header>button{flex:0 0 120px!important;width:120px!important}.editor p,.editor h2,.editor h3{margin:0}.editor p{color:#72e9ff;font-size:12px;letter-spacing:.12em}.editor h2{font-size:24px;white-space:nowrap}.editor h3{color:#ffe889;font-size:17px}main{min-height:0;display:grid;grid-template-rows:minmax(300px,52%) minmax(0,48%);gap:8px}.preview-pane,.settings-pane{min-height:0;border:1px solid #276273;background:#06141e}.preview-pane{display:grid;grid-template-rows:auto minmax(210px,1fr) auto;padding:8px;gap:7px}.position-settings{display:flex;align-items:center;gap:16px;min-width:0}.position-settings strong{color:#ffe889;font-size:17px}.position-settings small{color:#acd1d8;font-size:13px}.point-input{display:flex;align-items:center;gap:7px;padding:5px 8px;border:1px solid}.point-input span{font-weight:700}.point-input label{display:flex;align-items:center;gap:3px}.point-input input{width:58px}.origin-input{border-color:#55dcff}.origin-input span{color:#7eeaff}.target-input{border-color:#ffb452}.target-input span{color:#ffc875}.preview{position:relative;min-height:0;overflow:hidden;border:1px solid #3b7182;background:linear-gradient(rgba(76,145,164,.11) 1px,transparent 1px),linear-gradient(90deg,rgba(76,145,164,.11) 1px,transparent 1px),radial-gradient(circle,#174c5b,#04131e 70%);background-size:32px 32px,32px 32px,auto}.stage{position:absolute;inset:0;pointer-events:none}.stage :deep(canvas){width:100%!important;height:100%!important}.path-guide{position:absolute;height:2px;transform-origin:left center;background:repeating-linear-gradient(90deg,#bdefff 0 8px,transparent 8px 13px);pointer-events:none}.point-handle{position:absolute!important;z-index:3;transform:translate(-50%,-50%);display:grid!important;place-items:center;width:88px!important;min-width:88px!important;max-width:88px!important;height:58px!important;min-height:58px!important;padding:2px 7px!important;border:2px solid;border-radius:8px;touch-action:none;cursor:grab}.point-handle b{font-size:23px;line-height:20px}.point-handle span{font-size:13px}.point-handle.origin{border-color:#55dcff;background:#07394a;color:#b9f5ff}.point-handle.target{border-color:#ffb452;background:#493011;color:#ffe0ad}.transport{display:flex;align-items:center;gap:8px}.transport>button{flex:0 0 110px!important;width:110px!important}.transport>label{flex:1;display:grid;grid-template-columns:120px 70px minmax(120px,1fr);align-items:center;gap:8px}.settings-pane{display:grid;grid-template-rows:auto minmax(0,1fr);padding:8px;gap:8px}.basic-settings{display:grid;grid-template-columns:220px 110px 130px minmax(430px,1fr);align-items:end;gap:10px}.templates{display:flex;align-items:center;justify-content:flex-end;gap:6px;min-width:0}.templates span{color:#ffe889}.templates button{flex:0 0 88px!important;width:88px!important}.edit-grid{min-height:0;display:grid;grid-template-columns:260px minmax(0,1fr);gap:8px}.layer-panel,.detail-panel{min-height:0;overflow:auto;padding:8px;border:1px solid #245668;background:#061e2a}.layer-panel{display:grid;align-content:start;gap:6px}.section-title{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px}.section-title>button{flex:0 0 90px!important;width:90px!important}.layer-row{display:grid;grid-template-columns:1fr auto;gap:3px;text-align:left;padding:7px}.layer-row i{grid-column:1/-1;position:relative;height:12px;background:#0b2029}.layer-row b{position:absolute;top:0;bottom:0;border:1px solid rgba(255,255,255,.5)}.layer-row small{color:#a8d5de}.property-grid{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:9px 12px}.property-grid label{align-content:start}.property-grid .pair{display:grid;grid-template-columns:1fr 1fr;gap:6px}.check{display:flex!important;align-items:center;gap:7px!important;padding-top:24px}.check input{width:18px;min-height:18px}label{display:grid;gap:4px;color:#c3ecf5;font-size:15px}input,select,button{font:inherit}input,select{min-width:0;min-height:34px;box-sizing:border-box;border:1px solid #458094;color:#effdff;background:#092936;padding:3px 6px}input[type=range]{min-height:22px;padding:0;accent-color:#63e7ff}button{min-height:36px;border:1px solid #3b91a8;color:#e5fcff;background:#0a3547;cursor:pointer;font-weight:700}button.active,.save{border-color:#fff09d;background:#6b571c;color:#fffbd5}.danger{border-color:#ff7777;color:#ffdada}output{color:#ffe889}footer div{display:flex;gap:8px}footer button{width:130px!important}@media(max-width:850px){main{grid-template-rows:minmax(300px,50%) minmax(0,50%)}.position-settings{gap:7px;flex-wrap:wrap}.position-settings small{width:100%}.edit-grid{grid-template-columns:190px minmax(0,1fr)}.property-grid{grid-template-columns:repeat(2,minmax(120px,1fr))}.templates{overflow-x:auto;justify-content:start}.templates span{display:none}.basic-settings{grid-template-columns:160px 90px 105px minmax(360px,1fr)}}
</style>

<style scoped>
.editor-header > button,
.icon-button {
  flex: 0 0 46px !important;
  width: 46px !important;
  min-width: 46px !important;
  max-width: 46px !important;
  height: 42px !important;
  min-height: 42px !important;
  padding: 0 !important;
  font-size: 21px;
  line-height: 1;
}
.point-handle {
  width: 34px !important;
  min-width: 34px !important;
  max-width: 34px !important;
  height: 34px !important;
  min-height: 34px !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 21px;
  line-height: 1;
  opacity: .9;
  transition: opacity .16s ease;
}
.path-guide {
  height: 1px;
  background: repeating-linear-gradient(90deg, #bdefff 0 4px, transparent 4px 8px);
  opacity: .24;
}
.preview.playing .path-guide { opacity: .14; }
.preview.playing .point-handle { opacity: .28; }
.transport > button,
.section-title > button,
footer button {
  flex-basis: 46px !important;
  width: 46px !important;
}
.reset-points { margin-left: 2px; }
.position-settings { gap: 8px; }
.point-input {
  gap: 4px;
  padding: 0 3px;
  border: 0;
  background: transparent;
}
.point-input span { font-size: 15px; }
.point-input input { width: 50px; min-height: 30px; }
.reset-points {
  flex-basis: 36px !important;
  width: 36px !important;
  min-width: 36px !important;
  max-width: 36px !important;
  height: 36px !important;
  min-height: 36px !important;
  border-color: #3b91a8;
  background: #0a3547;
  color: #e5fcff;
  font-size: 21px;
  font-weight: 700;
}
.basic-settings { grid-template-columns: 220px 90px 110px; justify-content: start; }
.template-add { display: flex; align-items: center; gap: 5px; }
.template-select { width: 116px; min-height: 34px; }
.template-add .icon-button {
  flex-basis: 36px !important;
  width: 36px !important;
  min-width: 36px !important;
  max-width: 36px !important;
  height: 34px !important;
  min-height: 34px !important;
}
.layer-row > span { font-size: 15px; }
.layer-row > small { font-size: 13px; line-height: 1; }
.editor { grid-template-rows: auto minmax(0, 1fr); }
.editor-header { display: grid; grid-template-columns: minmax(260px, auto) minmax(0, 1fr) auto; }
.editor-header > .header-summary,
.editor-header > .header-actions { min-width: 0; }
.header-summary { display: flex; justify-content: flex-end; align-items: baseline; gap: 9px; color: #acd1d8; }
.header-summary strong { overflow: hidden; color: #effdff; text-overflow: ellipsis; white-space: nowrap; }
.header-summary span { flex: none; font-size: 13px; }
.header-actions { display: flex; gap: 6px; }
.preview-toolbar { display: flex; align-items: end; gap: 20px; min-width: 0; }
.position-settings { flex: none; }
.basic-settings { flex: 1; display: grid; grid-template-columns: minmax(150px, 220px) 74px 100px; justify-content: end; gap: 8px; }
.settings-pane { display: block; }
.edit-grid { height: 100%; }
@media (max-width: 1050px) {
  .preview-toolbar { align-items: start; flex-direction: column; gap: 7px; }
  .basic-settings { width: 100%; grid-template-columns: minmax(150px, 220px) 74px 100px; justify-content: start; }
}
@media (max-width: 700px) {
  .editor-header { grid-template-columns: minmax(0, 1fr) auto; }
  .header-summary { display: none; }
  .position-settings { flex-wrap: wrap; }
}
.detail-title { position: sticky; top: -8px; z-index: 4; margin: -8px -8px 8px; padding: 8px; background: #061e2a; border-bottom: 1px solid #245668; }
.detail-head-actions { display: flex; align-items: center; gap: 5px; }
.detail-head-actions > button:not(.icon-button) { width: 66px; min-height: 34px; padding: 2px 8px; }
.detail-head-actions > .icon-button { width: 38px !important; min-width: 38px !important; max-width: 38px !important; height: 34px !important; min-height: 34px !important; }
.motion-editor { display: grid; align-content: start; gap: 10px; }
.motion-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.motion-toolbar strong { color: #c3ecf5; font-size: 15px; }
.motion-toolbar > div { display: flex; gap: 5px; }
.motion-toolbar .icon-button { width: 38px !important; min-width: 38px !important; max-width: 38px !important; height: 34px !important; min-height: 34px !important; }
.motion-toolbar button:disabled { cursor: default; opacity: .35; }
.frame-timeline { display: grid; grid-auto-flow: column; grid-auto-columns: 44px; gap: 4px; overflow-x: auto; padding: 3px 2px 7px; border-bottom: 1px solid #245668; }
.frame-timeline button { position: relative; min-height: 46px; padding: 4px 3px 12px; color: #9bc7d0; background: #071923; border-color: #28586a; }
.frame-timeline button.current { border-color: #ffe889; color: #fff6a9; background: #423b13; }
.frame-timeline button i { position: absolute; left: 50%; bottom: 5px; width: 7px; height: 7px; transform: translateX(-50%) rotate(45deg); background: transparent; }
.frame-timeline button.keyed i { background: #67e8ff; box-shadow: 0 0 5px rgba(103, 232, 255, .65); }
.frame-timeline button.current.keyed i { background: #ffe889; }
.keyframe-settings { display: grid; grid-template-columns: minmax(170px, 1.4fr) repeat(7, minmax(82px, 1fr)); gap: 8px; align-items: end; }
.keyframe-settings label { min-width: 0; }
.keyframe-empty { display: flex; align-items: center; justify-content: center; gap: 14px; min-height: 96px; border: 1px dashed #28586a; color: #91bbc4; }
.keyframe-empty p { margin: 0; }
.keyframe-empty button { width: 190px; }
@media (max-width: 1150px) {
  .keyframe-settings { grid-template-columns: repeat(4, minmax(100px, 1fr)); }
}
</style>
