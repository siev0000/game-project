<template>
  <div class="wizard-backdrop" role="presentation" @mousedown.self="$emit('close')">
    <form class="wizard" role="dialog" aria-modal="true" aria-labelledby="wizard-title" @submit.prevent="create">
      <header>
        <div><span>NEW AREA FROM TEMPLATE</span><h2 id="wizard-title">新しい探索エリアを作成</h2></div>
        <button type="button" aria-label="閉じる" @click="$emit('close')">×</button>
      </header>
      <div class="wizard-body">
        <section>
          <h3>01 保存場所</h3>
          <label>階層
            <select v-model="form.layer" @change="selectDefaultDistrict">
              <option v-for="layer in layers" :key="layer.id" :value="layer.id">{{ layer.label }}</option>
            </select>
          </label>
          <label>地区
            <select v-model="form.districtId" required>
              <option v-for="district in availableDistricts" :key="district.id" :value="district.id">{{ district.name }}</option>
            </select>
          </label>
        </section>
        <section>
          <h3>02 エリア基本</h3>
          <label>エリアID<input v-model.trim="form.id" required pattern="[a-z0-9_]+"></label>
          <label>表示名<input v-model.trim="form.name" required></label>
          <label>説明<textarea v-model.trim="form.description" rows="3"></textarea></label>
          <label>横幅<input v-model.number="form.width" type="number" min="640" max="50000" step="100"></label>
        </section>
        <section>
          <h3>03 テンプレート</h3>
          <label>地形
            <select v-model="form.terrainType">
              <option v-for="terrain in terrainTypes" :key="terrain.id" :value="terrain.id">{{ terrain.name }}</option>
            </select>
          </label>
          <label>UIテーマ
            <select v-model="form.mapUiTheme">
              <option value="electronic_sf">電子SF</option><option value="fantasy">ファンタジー</option>
            </select>
          </label>
          <label>エリア種別
            <select v-model="form.areaKind">
              <option value="route">道路・通路</option><option value="facility">施設内部</option><option value="field">屋外フィールド</option>
            </select>
          </label>
          <div class="template-preview">
            <span>{{ selectedTerrain?.category }}</span>
            <strong>{{ selectedTerrain?.name }}</strong>
            <p>{{ selectedTerrain?.description }}</p>
          </div>
        </section>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <footer>
        <p>3つのJSONへ基本・マップ・初期状態を同時に追加します。</p>
        <div><button type="button" @click="$emit('close')">キャンセル</button><button type="submit">作成して開く</button></div>
      </footer>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  districts: { type: Array, required: true },
  terrainTypes: { type: Array, required: true },
  allAreas: { type: Array, required: true },
  assetCatalog: { type: Object, required: true }
})
const emit = defineEmits(['close', 'create'])
const layers = [
  { id: 'upper', label: '上層' }, { id: 'middle', label: '中層' }, { id: 'lower', label: '下層' },
  { id: 'hidden_middle', label: '秘匿中層' }, { id: 'bottom_expedition', label: '底部外征区' }, { id: 'exterior', label: '外界' }
]
const form = reactive({
  layer: 'exterior',
  districtId: props.districts.find(item => item.layer === 'exterior')?.id ?? '',
  id: '',
  name: '',
  description: '',
  width: 3200,
  terrainType: 'grassland',
  mapUiTheme: 'fantasy',
  areaKind: 'field'
})
const error = ref('')
const availableDistricts = computed(() => props.districts.filter(item => item.layer === form.layer))
const selectedTerrain = computed(() => props.terrainTypes.find(item => item.id === form.terrainType))
const selectDefaultDistrict = () => {
  form.districtId = availableDistricts.value[0]?.id ?? ''
  if (form.layer === 'exterior') {
    form.mapUiTheme = 'fantasy'
    form.areaKind = 'field'
  }
}
const effectsByTerrain = {
  grassland: ['wind'], forest: ['leaves', 'magic_motes'], wetland: ['mist', 'rain'],
  coast: ['sea_spray', 'wind'], desert: ['dust', 'wind'], snowfield: ['snow', 'wind'],
  mountain: ['wind'], canyon: ['dust', 'wind'], cave: ['cave_dust'],
  underground_cave: ['glow_spores', 'cave_dust'], volcanic: ['ash', 'embers'], ruins: ['magic_motes', 'dust']
}
const create = () => {
  error.value = ''
  if (props.allAreas.some(area => area.id === form.id)) {
    error.value = '同じエリアIDがすでに存在します'
    return
  }
  const set = props.assetCatalog.backgroundSets.find(item => item.terrainType === form.terrainType)
  const tileSet = props.assetCatalog.tileSets.find(item => item.terrainType === form.terrainType)
  const area = {
    id: form.id, name: form.name, description: form.description, districtId: form.districtId, layer: form.layer,
    areaKind: form.areaKind, mapUiTheme: form.mapUiTheme, terrainType: form.terrainType,
    scene: `areas/${form.layer}/${form.id}`, map: `maps/${form.layer}/${form.id}`, bgm: `${form.terrainType}_field`,
    width: form.width, horizontalLoop: false, defaultSpawn: 'entrance_main',
    spawns: [{ id: 'entrance_main', label: '初期地点', x: 180 }],
    exits: [], enemyFormations: [], environment: [form.terrainType],
    backgrounds: [set?.far ?? '', set?.mid ?? '', set?.foreground ?? ''],
    requiredEventFlags: []
  }
  const mapDraft = {
    height: 720, groundY: 570,
    backgroundLayers: {
      far: { assetId: set?.far ?? '', parallax: .2, visible: true },
      mid: { assetId: set?.mid ?? '', parallax: .5, visible: true },
      foreground: { assetId: set?.foreground ?? '', parallax: 1.15, visible: true }
    },
    backgroundGradient: { top: '#102c38', right: '#173f4a', bottom: '#02080c', left: '#0a2029' },
    backgroundImages: [],
    playerPresentation: {
      characterId: 'placeholder_player', displayWidth: 42, displayHeight: 66,
      footOffsetX: 0, footOffsetY: 0, hitboxWidth: 26, hitboxHeight: 58
    },
    environmentEffects: effectsByTerrain[form.terrainType] ?? [],
    platforms: [], eventPoints: [], placements: [], collisionZones: [], mapParts: [],
    tileLayers: tileSet ? [{
      id: 'ground_detail', name: '地面装飾', tileSize: 64, visible: true,
      tiles: [{ id: 'ground_tile_1', assetId: tileSet.groundTop, x: 1024, y: 506, collision: false }]
    }] : [],
    minimap: { mode: 'auto', fogOfWar: true, showPlacements: true, showEvents: true, regionNotes: '', segments: [] },
    speechLines: [`${form.name}へ到着した。`, form.description || '新しい探索エリアだ。']
  }
  const areaState = {
    openedDoors: [], defeatedEnemies: [], collectedItems: [], repairedFacilities: [],
    rescuedNpcs: [], alarmState: 'normal', clearedBoss: false, unlockedExits: []
  }
  emit('create', { area, mapDraft, areaState })
}
</script>

<style scoped>
.wizard-backdrop{position:absolute;z-index:35;inset:0;display:grid;padding:10px;place-items:center;background:rgba(0,5,8,.92);backdrop-filter:blur(5px)}
.wizard{--accent:#64e8ff;--line:rgba(100,232,255,.3);display:flex;width:min(1100px,100%);max-height:100%;flex-direction:column;overflow:hidden;border:1px solid var(--line);background:#07151b;color:#def9ff;font:12px Consolas,monospace}
.wizard header,.wizard footer{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 18px;border-bottom:1px solid var(--line);background:#0b2933}.wizard footer{border-top:1px solid var(--line);border-bottom:0}.wizard header span{color:var(--accent);font-size:8px;letter-spacing:.14em}.wizard h2{margin:3px 0 0}.wizard header button{width:36px;height:36px}
.wizard button,.wizard input,.wizard select,.wizard textarea{box-sizing:border-box;border:1px solid var(--line);background:rgba(0,0,0,.28);color:inherit;font:inherit}.wizard button{cursor:pointer}.wizard-body{display:grid;min-height:0;grid-template-columns:repeat(3,1fr);gap:12px;overflow:auto;padding:16px}.wizard-body section{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid var(--line);background:rgba(4,22,28,.72)}h3{margin:0 0 4px;color:var(--accent);font-size:12px}label{display:grid;gap:4px;color:rgba(222,249,255,.65);font-size:9px}input,select,textarea{width:100%;min-height:34px;padding:6px 8px}.template-preview{margin-top:8px;padding:12px;border:1px solid var(--line)}.template-preview span{color:var(--accent);font-size:8px}.template-preview strong{display:block;margin-top:4px;font-size:17px}.template-preview p{opacity:.65;line-height:1.6}.wizard footer p{margin:0;font-size:9px;opacity:.58}.wizard footer div{display:flex;gap:8px}.wizard footer button{min-height:38px;padding:0 14px}.wizard footer button:last-child{background:rgba(100,232,255,.14);color:var(--accent)}.error{margin:0;padding:8px 18px;color:#ff9d8b}
@media(max-width:800px){.wizard-body{grid-template-columns:1fr}.wizard footer{align-items:flex-end;flex-direction:column}}

/* Project typography rule. */
.wizard { font-size: var(--ui-font-size-body, 15px); }
.wizard :is(button,input,select,textarea,label,p) { font-size: var(--ui-font-size-control, 15px); }
.wizard :is(header span,.template-preview span) { font-size: var(--ui-font-size-micro, 11px); }
</style>
