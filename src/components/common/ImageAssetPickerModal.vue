<template>
  <Teleport to="body">
    <div class="image-picker-backdrop" @pointerdown.self="$emit('close')">
      <section class="image-picker" role="dialog" aria-modal="true" aria-labelledby="image-picker-title">
        <header>
          <div><small>COMMON IMAGE LIBRARY</small><h2 id="image-picker-title">{{ title }}</h2></div>
          <button type="button" aria-label="画像選択を閉じる" @click="$emit('close')">×</button>
        </header>

        <div class="image-picker-toolbar">
          <label>検索<input v-model.trim="search" type="search" placeholder="画像名・パス"></label>
          <label>フォルダ
            <select v-model="directory">
              <option value="">すべて</option>
              <option v-for="item in availableDirectories" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>
          <span>{{ filteredAssets.length }} IMAGES</span>
        </div>

        <div class="image-picker-body">
          <div class="image-picker-grid">
            <button
              v-for="asset in filteredAssets"
              :key="asset.id"
              type="button"
              :class="{ selected: candidateId === asset.id }"
              :aria-label="`${asset.name}を候補にする`"
              @click="candidateId = asset.id"
              @dblclick="confirmAsset(asset.id)"
            >
              <span class="asset-thumbnail"><img :src="asset.source || mapAssetSource(asset.id)" :alt="asset.name" loading="lazy"></span>
              <strong>{{ asset.name }}</strong>
              <small>{{ asset.id }}</small>
            </button>
            <p v-if="loading" class="picker-message">画像を読み込んでいます…</p>
            <p v-else-if="loadError" class="picker-message error">{{ loadError }}</p>
            <p v-else-if="!filteredAssets.length" class="picker-message">条件に合う画像がありません。</p>
          </div>

          <aside class="selected-image-preview">
            <span>選択中</span>
            <div><img v-if="candidateAsset" :src="candidateAsset.source || mapAssetSource(candidateAsset.id)" :alt="candidateAsset.name"></div>
            <strong>{{ candidateAsset?.name || '未選択' }}</strong>
            <small>{{ candidateAsset?.id || '画像をクリックして選択' }}</small>
          </aside>
        </div>

        <footer>
          <button v-if="allowClear" type="button" class="clear-button" @click="$emit('clear')">画像を解除</button>
          <button type="button" @click="$emit('close')">キャンセル</button>
          <button type="button" class="confirm-button" :disabled="!candidateAsset" @click="confirmAsset(candidateId)">この画像を選択</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { mapAssetSource } from '@/utils/explorationMapAssets.js'

const props = defineProps({
  title: { type: String, default: '画像を選択' },
  selectedId: { type: String, default: '' },
  directories: { type: Array, default: () => [] },
  allowClear: { type: Boolean, default: true }
})
const emit = defineEmits(['close', 'select', 'clear'])
const assets = ref([])
const loading = ref(true)
const loadError = ref('')
const search = ref('')
const directory = ref(props.directories.length === 1 ? props.directories[0] : '')
const candidateId = ref(props.selectedId)

const availableDirectories = computed(() => {
  const values = [...new Set(assets.value.map(asset => asset.directory).filter(Boolean))]
  return props.directories.length ? values.filter(value => props.directories.includes(value)) : values
})
const filteredAssets = computed(() => {
  const query = search.value.toLocaleLowerCase('ja')
  return assets.value.filter(asset => {
    if (props.directories.length && !props.directories.includes(asset.directory)) return false
    if (directory.value && asset.directory !== directory.value) return false
    return !query || `${asset.name} ${asset.id}`.toLocaleLowerCase('ja').includes(query)
  })
})
const candidateAsset = computed(() => assets.value.find(asset => asset.id === candidateId.value))
const confirmAsset = id => {
  const asset = assets.value.find(item => item.id === id)
  if (asset) emit('select', asset)
}

onMounted(async () => {
  try {
    const response = await fetch('/api/local/image-assets')
    const payload = await response.json()
    if (!response.ok || !Array.isArray(payload.assets)) throw new Error(payload.error || '画像一覧の読み込みに失敗しました')
    assets.value = payload.assets
  } catch (error) {
    loadError.value = error.message || '画像一覧の読み込みに失敗しました'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.image-picker-backdrop { position:fixed; z-index:220; inset:0; display:grid; place-items:center; box-sizing:border-box; padding:20px; background:rgba(0,5,8,.9); color:#e8fbff; font-family:"Consolas","Noto Sans JP",sans-serif; }
.image-picker { display:grid; width:min(1180px,100%); height:min(820px,100%); min-height:0; grid-template-rows:auto auto minmax(0,1fr) auto; border:1px solid rgba(100,232,255,.55); background:#06141a; box-shadow:0 20px 70px #000; }
.image-picker > header,.image-picker > footer { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid rgba(100,232,255,.28); }
.image-picker > header { justify-content:space-between; }.image-picker > header small { color:#64e8ff; font-size:13px; }.image-picker h2 { margin:2px 0 0; font-size:22px; }
.image-picker button,.image-picker input,.image-picker select { min-height:38px; box-sizing:border-box; border:1px solid rgba(100,232,255,.35); background:#081a21; color:inherit; font-size:15px; }
.image-picker > header button { width:40px; font-size:22px; }
.image-picker-toolbar { display:grid; grid-template-columns:minmax(220px,1fr) minmax(180px,280px) auto; align-items:end; gap:10px; padding:10px 16px; border-bottom:1px solid rgba(100,232,255,.2); }
.image-picker-toolbar label { display:grid; gap:4px; color:rgba(220,248,255,.7); font-size:15px; }.image-picker-toolbar input,.image-picker-toolbar select { width:100%; padding:5px 8px; }.image-picker-toolbar span { padding-bottom:9px; color:#64e8ff; font-size:13px; }
.image-picker-body { display:grid; min-height:0; grid-template-columns:minmax(0,1fr) 300px; }
.image-picker-grid { display:grid; min-height:0; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); align-content:start; gap:10px; overflow:auto; padding:14px; }
.image-picker-grid > button { display:grid; min-width:0; height:170px; grid-template-rows:112px auto auto; gap:4px; padding:7px; text-align:left; }.image-picker-grid > button.selected { border-color:#ffe079; background:rgba(255,224,121,.12); box-shadow:0 0 0 2px rgba(255,224,121,.22); }
.asset-thumbnail { display:grid; min-width:0; min-height:0; place-items:center; overflow:hidden; background:repeating-conic-gradient(#0a1b22 0 25%,#102832 0 50%) 0/18px 18px; }.asset-thumbnail img { width:100%; height:100%; object-fit:contain; }
.image-picker-grid strong,.image-picker-grid small { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.image-picker-grid strong { font-size:15px; }.image-picker-grid small { color:rgba(220,248,255,.6); font-size:11px; }
.selected-image-preview { display:grid; min-height:0; grid-template-rows:auto minmax(0,1fr) auto auto; gap:8px; padding:14px; border-left:1px solid rgba(100,232,255,.22); }.selected-image-preview > span { color:#64e8ff; font-size:13px; }.selected-image-preview > div { display:grid; min-height:180px; place-items:center; overflow:hidden; background:#02090d; }.selected-image-preview img { max-width:100%; max-height:100%; object-fit:contain; }.selected-image-preview strong { font-size:16px; }.selected-image-preview small { overflow-wrap:anywhere; color:rgba(220,248,255,.6); font-size:13px; }
.picker-message { grid-column:1/-1; color:rgba(220,248,255,.65); font-size:15px; }.picker-message.error { color:#ff9f91; }
.image-picker > footer { justify-content:flex-end; border-top:1px solid rgba(100,232,255,.28); border-bottom:0; }.image-picker > footer button { min-width:130px; padding:0 14px; }.image-picker > footer .clear-button { margin-right:auto; border-color:rgba(255,120,100,.5); color:#ffb0a6; }.image-picker > footer .confirm-button { background:rgba(100,232,255,.16); color:#8af0ff; font-weight:700; }.image-picker > footer .confirm-button:disabled { opacity:.4; }
@media(max-width:720px){.image-picker-backdrop{padding:0}.image-picker{width:100%;height:100%;border:0}.image-picker-toolbar{grid-template-columns:1fr 1fr}.image-picker-toolbar span{grid-column:1/-1;padding:0}.image-picker-body{grid-template-columns:1fr}.image-picker-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.selected-image-preview{display:none}.image-picker > footer button{min-width:0;flex:1}.image-picker > footer .clear-button{margin-right:0}}
</style>
