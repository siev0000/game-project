<template>
  <div class="part-editor-backdrop" role="presentation">
    <section class="part-editor" role="dialog" aria-modal="true" aria-labelledby="part-editor-title">
      <header>
        <div><span>STEP 02 / MAP PART LIBRARY</span><h2 id="part-editor-title">素材・部品作成</h2></div>
        <button type="button" aria-label="素材・部品作成を閉じる" @click="$emit('close')">×</button>
      </header>

      <div class="part-editor-body">
        <aside class="part-list">
          <button type="button" class="new-part-button" @click="startNewPart">＋ 新しい部品</button>
          <p>{{ library.parts.length }} PARTS</p>
          <button
            v-for="part in library.parts"
            :key="part.id"
            type="button"
            :class="{ selected: selectedPartId === part.id }"
            @click="editPart(part)"
          >
            <i :style="partPreviewStyle(part)"></i>
            <span><strong>{{ part.name }}</strong><small>{{ categoryName(part.category) }} / {{ part.id }}</small></span>
          </button>
          <div v-if="!library.parts.length" class="empty-parts">元画像から最初の部品を作成してください。</div>
        </aside>

        <section class="crop-workspace">
          <div class="source-picker">
            <label>元画像
              <button type="button" class="source-image-picker-button" aria-label="元画像を選択" @click="imagePickerOpen = true">
                <i v-if="draft.imageAssetId" :style="{ backgroundImage: `url(&quot;${mapAssetSource(draft.imageAssetId)}&quot;)` }"></i>
                <span><strong>{{ draft.imageAssetId ? draft.imageAssetId.split('/').at(-1) : '画像を選択' }}</strong><small>{{ draft.imageAssetId || 'サムネイル一覧を開く' }}</small></span>
              </button>
            </label>
            <div class="crop-view-tools">
              <button type="button" title="縮小" @click="setViewZoom(viewZoom / 1.2)">−</button>
              <strong>{{ Math.round(viewZoom * 100) }}%</strong>
              <button type="button" title="拡大" @click="setViewZoom(viewZoom * 1.2)">＋</button>
              <button type="button" @click="resetView">全体表示</button>
            </div>
          </div>
          <div
            ref="cropStage"
            class="crop-stage"
            @wheel.prevent="zoomWithWheel"
            @pointerdown="beginPan"
            @pointermove="movePointer"
            @pointerup="endPointer"
            @pointercancel="endPointer"
          >
            <div
              v-if="draft.imageAssetId"
              ref="sourceFrame"
              class="source-frame"
              :style="sourceFrameStyle"
            >
              <img :src="mapAssetSource(draft.imageAssetId)" :alt="`${draft.imageAssetId}の切り出し元`" @load="onSourceLoaded">
              <div
                class="crop-selection"
                :style="cropSelectionStyle"
                @pointerdown.stop.prevent="beginSelectionMove"
              >
                <span>{{ draft.sourceRect.width }} × {{ draft.sourceRect.height }}</span>
                <button
                  v-for="handle in cropHandles"
                  :key="handle"
                  type="button"
                  class="crop-resize-handle"
                  :class="`handle-${handle}`"
                  :aria-label="`${handleName(handle)}をドラッグして切り出し範囲を変更`"
                  @pointerdown.stop.prevent="beginResize($event, handle)"
                ></button>
              </div>
            </div>
            <p v-else>左上の一覧から元画像を選択してください。</p>
            <div v-if="draft.imageAssetId" class="crop-operation-help">枠内ドラッグ: 範囲移動　枠の点: サイズ変更　枠外ドラッグ: 表示移動　ホイール: 拡大縮小</div>
          </div>
          <div class="crop-numbers">
            <label>X<input v-model.number="draft.sourceRect.x" type="number" min="0" :max="sourceSize.width" @change="normalizeSourceRect"></label>
            <label>Y<input v-model.number="draft.sourceRect.y" type="number" min="0" :max="sourceSize.height" @change="normalizeSourceRect"></label>
            <label>幅<input v-model.number="draft.sourceRect.width" type="number" min="1" :max="sourceSize.width" @change="normalizeSourceRect"></label>
            <label>高さ<input v-model.number="draft.sourceRect.height" type="number" min="1" :max="sourceSize.height" @change="normalizeSourceRect"></label>
          </div>
        </section>

        <aside class="part-settings">
          <h3>{{ selectedPartId ? '部品を編集' : '新しい部品' }}</h3>
          <label>部品ID<input v-model.trim="draft.id" :disabled="!!selectedPartId" placeholder="machine_floor_01"></label>
          <label>部品名<input v-model.trim="draft.name" placeholder="機械床01"></label>
          <label>種類
            <select v-model="draft.category">
              <option value="floor">床</option><option value="wall">壁</option><option value="pipe">配管</option>
              <option value="platform">足場</option><option value="decoration">装飾</option>
            </select>
          </label>
          <label>配置方法
            <select v-model="draft.placementMode"><option value="grid">グリッド配置</option><option value="free">自由配置</option></select>
          </label>
          <label>初期表示位置
            <select v-model="draft.defaultRenderLayer">
              <option value="background">地面の後ろ</option><option value="behindPlayer">地面の前・プレイヤーの後ろ</option>
              <option value="frontPlayer">プレイヤーの前</option><option value="foreground">最前面</option>
            </select>
          </label>
          <label class="switch"><input v-model="draft.defaultCollision" type="checkbox">初期状態で当たり判定あり</label>
          <div class="part-preview">
            <span>配置時の見た目</span>
            <div class="part-preview-stage">
              <i :style="partResultPreviewStyle"></i>
            </div>
            <small>初期サイズ {{ draft.sourceRect.width }} × {{ draft.sourceRect.height }}</small>
          </div>
          <p v-if="message" :class="['part-message', { error: messageError }]">{{ message }}</p>
          <div class="part-actions">
            <button v-if="selectedPartId" type="button" class="delete-button" @click="deletePart">削除</button>
            <button type="button" class="save-button" @click="savePart">部品を保存</button>
          </div>
        </aside>
      </div>
      <ImageAssetPickerModal
        v-if="imagePickerOpen"
        title="部品の元画像を選択"
        :selected-id="draft.imageAssetId"
        :directories="['locations']"
        @close="imagePickerOpen = false"
        @clear="clearSourceImage"
        @select="selectSourceImage"
      />
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import ImageAssetPickerModal from '@/components/common/ImageAssetPickerModal.vue'
import { croppedMapPartStyle, mapAssetSource } from '@/utils/explorationMapAssets.js'

const props = defineProps({ library: { type: Object, required: true } })
const emit = defineEmits(['close', 'save'])
const clone = value => JSON.parse(JSON.stringify(value))
const library = reactive(clone(props.library))
const imagePickerOpen = ref(false)
const selectedPartId = ref('')
const cropStage = ref(null)
const sourceFrame = ref(null)
const sourceSize = reactive({ width: 1, height: 1 })
const viewZoom = ref(1)
const viewPan = reactive({ x: 0, y: 0 })
const pointerAction = reactive({
  active: false, mode: '', direction: '', pointerId: null,
  startClientX: 0, startClientY: 0, startPanX: 0, startPanY: 0,
  startRect: { x: 0, y: 0, width: 1, height: 1 }
})
const message = ref('')
const messageError = ref(false)
const blankPart = () => ({
  id: '', name: '', category: 'floor', imageAssetId: '', sourceRect: { x: 0, y: 0, width: 1, height: 1 },
  sourceSize: { width: 1, height: 1 }, placementMode: 'grid', defaultRenderLayer: 'behindPlayer', defaultCollision: false
})
const draft = reactive(blankPart())

const categoryName = category => ({ floor: '床', wall: '壁', pipe: '配管', platform: '足場', decoration: '装飾' }[category] ?? category)
const fitScale = computed(() => Math.min(1, 620 / sourceSize.width, 420 / sourceSize.height))
const frameScale = computed(() => fitScale.value * viewZoom.value)
const sourceFrameStyle = computed(() => ({
  width: `${sourceSize.width * frameScale.value}px`,
  height: `${sourceSize.height * frameScale.value}px`,
  transform: `translate(calc(-50% + ${viewPan.x}px), calc(-50% + ${viewPan.y}px))`
}))
const cropSelectionStyle = computed(() => ({
  left: `${draft.sourceRect.x * frameScale.value}px`, top: `${draft.sourceRect.y * frameScale.value}px`,
  width: `${draft.sourceRect.width * frameScale.value}px`, height: `${draft.sourceRect.height * frameScale.value}px`
}))
const partPreviewStyle = part => croppedMapPartStyle(part, 64, 48)
const resultPreviewSize = computed(() => {
  const width = Math.max(1, Number(draft.sourceRect.width) || 1)
  const height = Math.max(1, Number(draft.sourceRect.height) || 1)
  const scale = Math.min(1, 240 / width, 160 / height)
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
})
const partResultPreviewStyle = computed(() => ({
  width: `${resultPreviewSize.value.width}px`,
  height: `${resultPreviewSize.value.height}px`,
  ...croppedMapPartStyle(draft, resultPreviewSize.value.width, resultPreviewSize.value.height)
}))
const cropHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const handleName = handle => ({ nw: '左上', n: '上', ne: '右上', e: '右', se: '右下', s: '下', sw: '左下', w: '左' }[handle])

const startNewPart = () => {
  selectedPartId.value = ''
  Object.assign(draft, blankPart())
  Object.assign(sourceSize, { width: 1, height: 1 })
  resetView()
  message.value = ''
}
const editPart = part => {
  selectedPartId.value = part.id
  Object.assign(draft, clone(part))
  Object.assign(sourceSize, part.sourceSize)
  resetView()
  message.value = ''
}
const resetSourceImage = () => {
  Object.assign(sourceSize, { width: 1, height: 1 })
  Object.assign(draft.sourceRect, { x: 0, y: 0, width: 1, height: 1 })
  resetView()
}
const selectSourceImage = asset => {
  draft.imageAssetId = asset.id
  resetSourceImage()
  imagePickerOpen.value = false
}
const clearSourceImage = () => {
  draft.imageAssetId = ''
  resetSourceImage()
  imagePickerOpen.value = false
}
const onSourceLoaded = event => {
  const image = event.currentTarget
  Object.assign(sourceSize, { width: image.naturalWidth, height: image.naturalHeight })
  draft.sourceSize = { ...sourceSize }
  const rect = draft.sourceRect
  if (rect.width <= 1 && rect.height <= 1) Object.assign(rect, { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight })
  normalizeSourceRect()
  nextTick(resetView)
}
const resetView = () => {
  viewZoom.value = 1
  viewPan.x = 0
  viewPan.y = 0
}
const setViewZoom = value => { viewZoom.value = Math.max(.25, Math.min(8, Number(value) || 1)) }
const zoomWithWheel = event => {
  if (!draft.imageAssetId || !cropStage.value) return
  const stageRect = cropStage.value.getBoundingClientRect()
  const oldScale = frameScale.value
  const oldZoom = viewZoom.value
  const nextZoom = Math.max(.25, Math.min(8, oldZoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15)))
  if (nextZoom === oldZoom) return
  const pointerX = event.clientX - stageRect.left
  const pointerY = event.clientY - stageRect.top
  const sourceX = sourceSize.width / 2 + (pointerX - stageRect.width / 2 - viewPan.x) / oldScale
  const sourceY = sourceSize.height / 2 + (pointerY - stageRect.height / 2 - viewPan.y) / oldScale
  viewZoom.value = nextZoom
  const nextScale = frameScale.value
  viewPan.x = pointerX - stageRect.width / 2 - (sourceX - sourceSize.width / 2) * nextScale
  viewPan.y = pointerY - stageRect.height / 2 - (sourceY - sourceSize.height / 2) * nextScale
}
const normalizeSourceRect = () => {
  const rect = draft.sourceRect
  rect.x = Math.max(0, Math.min(sourceSize.width - 1, Math.round(Number(rect.x) || 0)))
  rect.y = Math.max(0, Math.min(sourceSize.height - 1, Math.round(Number(rect.y) || 0)))
  rect.width = Math.max(1, Math.min(sourceSize.width - rect.x, Math.round(Number(rect.width) || 1)))
  rect.height = Math.max(1, Math.min(sourceSize.height - rect.y, Math.round(Number(rect.height) || 1)))
}
const startPointerAction = (event, mode, direction = '') => {
  if (event.button !== 0 || !cropStage.value) return
  Object.assign(pointerAction, {
    active: true, mode, direction, pointerId: event.pointerId,
    startClientX: event.clientX, startClientY: event.clientY,
    startPanX: viewPan.x, startPanY: viewPan.y,
    startRect: { ...draft.sourceRect }
  })
  cropStage.value.setPointerCapture(event.pointerId)
}
const beginPan = event => startPointerAction(event, 'pan')
const beginSelectionMove = event => startPointerAction(event, 'move')
const beginResize = (event, direction) => startPointerAction(event, 'resize', direction)
const movePointer = event => {
  if (!pointerAction.active) return
  const deltaClientX = event.clientX - pointerAction.startClientX
  const deltaClientY = event.clientY - pointerAction.startClientY
  if (pointerAction.mode === 'pan') {
    viewPan.x = pointerAction.startPanX + deltaClientX
    viewPan.y = pointerAction.startPanY + deltaClientY
    return
  }
  const deltaX = Math.round(deltaClientX / frameScale.value)
  const deltaY = Math.round(deltaClientY / frameScale.value)
  const start = pointerAction.startRect
  if (pointerAction.mode === 'move') {
    draft.sourceRect.x = Math.max(0, Math.min(sourceSize.width - start.width, start.x + deltaX))
    draft.sourceRect.y = Math.max(0, Math.min(sourceSize.height - start.height, start.y + deltaY))
    return
  }
  let left = start.x
  let top = start.y
  let right = start.x + start.width
  let bottom = start.y + start.height
  if (pointerAction.direction.includes('w')) left = Math.max(0, Math.min(right - 1, start.x + deltaX))
  if (pointerAction.direction.includes('e')) right = Math.max(left + 1, Math.min(sourceSize.width, start.x + start.width + deltaX))
  if (pointerAction.direction.includes('n')) top = Math.max(0, Math.min(bottom - 1, start.y + deltaY))
  if (pointerAction.direction.includes('s')) bottom = Math.max(top + 1, Math.min(sourceSize.height, start.y + start.height + deltaY))
  Object.assign(draft.sourceRect, { x: left, y: top, width: right - left, height: bottom - top })
}
const endPointer = event => {
  if (cropStage.value?.hasPointerCapture?.(event.pointerId)) cropStage.value.releasePointerCapture(event.pointerId)
  Object.assign(pointerAction, { active: false, mode: '', direction: '', pointerId: null })
}
const savePart = () => {
  messageError.value = true
  if (!draft.id || !/^[a-z0-9_]+$/.test(draft.id)) return void (message.value = '部品IDは半角英小文字・数字・_で入力してください')
  if (!draft.name || !draft.imageAssetId || draft.sourceRect.width < 1 || draft.sourceRect.height < 1) return void (message.value = '部品名、元画像、切り出し範囲を設定してください')
  normalizeSourceRect()
  draft.sourceSize = { ...sourceSize }
  const saved = clone(draft)
  const index = library.parts.findIndex(part => part.id === (selectedPartId.value || saved.id))
  if (index >= 0) library.parts[index] = saved
  else if (library.parts.some(part => part.id === saved.id)) return void (message.value = '同じ部品IDが存在します')
  else library.parts.push(saved)
  selectedPartId.value = saved.id
  messageError.value = false
  message.value = 'mapPartLibrary.jsonへ保存しています…'
  emit('save', clone(library), (ok, text) => {
    messageError.value = !ok
    message.value = text
  })
}
const deletePart = () => {
  const index = library.parts.findIndex(part => part.id === selectedPartId.value)
  if (index >= 0) library.parts.splice(index, 1)
  emit('save', clone(library))
  startNewPart()
}

</script>

<style scoped>
.part-editor-backdrop { position:fixed; z-index:90; inset:0; padding:18px; box-sizing:border-box; background:rgba(0,7,10,.9); color:#e9fcff; font-family:"Consolas","Noto Sans JP",sans-serif; }
.part-editor { display:grid; grid-template-rows:auto minmax(0,1fr); width:100%; height:100%; box-sizing:border-box; border:1px solid rgba(100,232,255,.55); background:#06141a; }
.part-editor > header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid rgba(100,232,255,.3); }
.part-editor header span { color:#64e8ff; font-size:13px; letter-spacing:.12em; }
.part-editor h2 { margin:3px 0 0; font-size:22px; }
.part-editor > header button { width:38px; height:38px; border:1px solid rgba(100,232,255,.4); background:#0b2832; color:#dffaff; font-size:22px; }
.part-editor-body { display:grid; min-height:0; grid-template-columns:240px minmax(420px,1fr) 300px; }
.part-list,.part-settings { min-height:0; overflow:auto; padding:14px; }
.part-list { border-right:1px solid rgba(100,232,255,.22); }
.part-settings { border-left:1px solid rgba(100,232,255,.22); }
.new-part-button,.part-list > button:not(.new-part-button) { width:100%; border:1px solid rgba(100,232,255,.3); background:rgba(100,232,255,.06); color:#dffaff; }
.new-part-button { min-height:40px; font-size:15px; }
.part-list > p { color:#64e8ff; font-size:13px; }
.part-list > button:not(.new-part-button) { display:grid; grid-template-columns:68px minmax(0,1fr); gap:9px; align-items:center; margin-top:8px; padding:7px; text-align:left; }
.part-list button.selected { border-color:#64e8ff; background:rgba(100,232,255,.17); }
.part-list i { display:block; width:64px; height:48px; background-color:#071117; }
.part-list span { display:grid; gap:4px; }
.part-list strong { font-size:15px; }.part-list small { overflow:hidden; color:rgba(220,247,251,.65); font-size:13px; text-overflow:ellipsis; }
.empty-parts { padding:18px 4px; color:rgba(220,247,251,.6); font-size:15px; line-height:1.6; }
.crop-workspace { display:grid; min-width:0; min-height:0; grid-template-columns:minmax(0,1fr); grid-template-rows:auto minmax(0,1fr) auto; padding:14px; }
.source-picker { display:flex; align-items:end; justify-content:space-between; gap:12px; padding-bottom:10px; }
.source-picker label { display:grid; min-width:0; flex:1; gap:5px; font-size:15px; }
.source-image-picker-button { display:grid; width:100%; min-width:0; min-height:58px; grid-template-columns:72px minmax(0,1fr); align-items:center; gap:9px; padding:6px; border:1px solid rgba(100,232,255,.35); background:#07141a; color:#e9fcff; text-align:left; }
.source-image-picker-button i { display:block; width:68px; height:44px; background-position:center; background-size:cover; }.source-image-picker-button span { display:grid; min-width:0; gap:3px; }.source-image-picker-button strong,.source-image-picker-button small { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.source-image-picker-button strong { font-size:15px; }.source-image-picker-button small { color:rgba(220,247,251,.62); font-size:13px; }
.crop-view-tools { display:flex; align-items:center; gap:6px; }
.crop-view-tools button { min-height:34px; padding:0 10px; border:1px solid rgba(100,232,255,.35); background:#07141a; color:#e9fcff; font-size:15px; white-space:nowrap; }
.crop-view-tools strong { min-width:52px; color:#64e8ff; font-size:15px; text-align:center; }
.crop-stage { position:relative; min-width:0; min-height:0; max-width:100%; overflow:hidden; border:1px solid rgba(100,232,255,.2); background:repeating-conic-gradient(#07151b 0 25%,#0b1d24 0 50%) 0/20px 20px; cursor:grab; touch-action:none; }
.crop-stage:active { cursor:grabbing; }
.crop-stage > p { color:rgba(220,247,251,.6); font-size:15px; }
.source-frame { position:absolute; top:50%; left:50%; flex:0 0 auto; touch-action:none; will-change:transform,width,height; }
.source-frame img { position:absolute; inset:0; width:100%; height:100%; user-select:none; pointer-events:none; }
.crop-selection { position:absolute; box-sizing:border-box; border:2px solid #ffe079; background:rgba(255,224,121,.12); box-shadow:0 0 0 9999px rgba(0,0,0,.42); cursor:move; touch-action:none; }
.crop-selection span { position:absolute; bottom:100%; left:-2px; padding:2px 5px; background:#3c3214; color:#ffe9a3; font-size:13px; white-space:nowrap; }
.crop-resize-handle { position:absolute; z-index:2; width:14px; min-width:14px; height:14px; min-height:14px; padding:0; border:2px solid #30270d; border-radius:2px; background:#ffe079; transform:translate(-50%,-50%); }
.handle-nw{top:0;left:0;cursor:nwse-resize}.handle-n{top:0;left:50%;cursor:ns-resize}.handle-ne{top:0;left:100%;cursor:nesw-resize}.handle-e{top:50%;left:100%;cursor:ew-resize}.handle-se{top:100%;left:100%;cursor:nwse-resize}.handle-s{top:100%;left:50%;cursor:ns-resize}.handle-sw{top:100%;left:0;cursor:nesw-resize}.handle-w{top:50%;left:0;cursor:ew-resize}
.crop-operation-help { position:absolute; z-index:5; right:8px; bottom:8px; padding:5px 8px; background:rgba(2,12,17,.88); color:rgba(224,249,253,.82); font-size:13px; pointer-events:none; }
.crop-numbers { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding-top:10px; }
.crop-numbers label,.part-settings label { display:grid; gap:5px; color:rgba(222,248,252,.78); font-size:15px; }
.crop-numbers input,.part-settings input,.part-settings select { min-height:36px; box-sizing:border-box; border:1px solid rgba(100,232,255,.3); background:#07141a; color:#e9fcff; font-size:15px; }
.part-settings { display:flex; flex-direction:column; gap:11px; }.part-settings h3 { margin:0; font-size:18px; }.part-settings .switch { display:flex; align-items:center; gap:8px; }.part-settings .switch input { min-height:0; }
.part-preview { display:grid; gap:7px; }.part-preview > span { color:#64e8ff; font-size:13px; }.part-preview-stage { display:grid; width:100%; height:170px; box-sizing:border-box; place-items:center; overflow:hidden; border:1px solid rgba(100,232,255,.3); background:repeating-conic-gradient(#071117 0 25%,#0c2028 0 50%) 0/16px 16px; }.part-preview-stage i { display:block; flex:0 0 auto; }.part-preview small { color:rgba(220,247,251,.68); font-size:13px; }
.part-message { margin:0; color:#9dffb6; font-size:13px; }.part-message.error { color:#ff9b8d; }
.part-actions { display:flex; gap:8px; margin-top:auto; }.part-actions button { min-height:40px; flex:1; border:1px solid rgba(100,232,255,.45); background:rgba(100,232,255,.12); color:#e9fcff; font-size:15px; }.part-actions .delete-button { border-color:rgba(255,107,91,.5); color:#ffb0a6; }
@media(max-width:900px){.part-editor-backdrop{padding:0}.part-editor-body{display:block;overflow:auto}.part-list,.part-settings{overflow:visible;border:0}.crop-workspace{height:620px}.part-list{max-height:none}.part-settings{border-top:1px solid rgba(100,232,255,.22)}}
</style>
