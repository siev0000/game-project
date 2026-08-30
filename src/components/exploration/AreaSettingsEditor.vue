<template>
  <div class="editor-backdrop" role="presentation">
    <section class="area-editor" role="dialog" aria-modal="true" aria-labelledby="area-editor-title">
      <header class="editor-header">
        <div>
          <p>LOCAL SOURCE AREA EDITOR</p>
          <h2 id="area-editor-title">{{ area.name }}の設定</h2>
        </div>
        <button type="button" class="close-button" aria-label="編集を閉じる" @click="$emit('close')">×</button>
      </header>

      <form
        :class="['editor-form', { 'fantasy-scrollbar': draft.mapUiTheme === 'fantasy' }]"
        @submit.prevent="save"
      >
        <section class="editor-section">
          <header><span>01</span><h3>基本情報</h3></header>
          <div class="form-grid">
            <label>
              <span>エリアID（変更不可）</span>
              <input :value="draft.id" disabled>
            </label>
            <label>
              <span>表示名</span>
              <input v-model.trim="draft.name" required maxlength="60">
            </label>
            <label>
              <span>エリア種別</span>
              <select v-model="draft.areaKind">
                <option value="route">道路・通路</option>
                <option value="facility">施設内部</option>
                <option value="field">屋外フィールド</option>
              </select>
            </label>
            <label>
              <span>マップUIテーマ</span>
              <select v-model="draft.mapUiTheme">
                <option value="electronic_sf">電子SF</option>
                <option value="fantasy">ファンタジー</option>
              </select>
            </label>
            <label>
              <span>地形</span>
              <select v-model="draft.terrainType">
                <optgroup label="人工">
                  <option
                    v-for="terrain in terrainsByGroup.artificial"
                    :key="terrain.id"
                    :value="terrain.id"
                  >{{ terrain.name }}</option>
                </optgroup>
                <optgroup label="地表">
                  <option
                    v-for="terrain in terrainsByGroup.surface"
                    :key="terrain.id"
                    :value="terrain.id"
                  >{{ terrain.name }}</option>
                </optgroup>
                <optgroup label="地下">
                  <option
                    v-for="terrain in terrainsByGroup.underground"
                    :key="terrain.id"
                    :value="terrain.id"
                  >{{ terrain.name }}</option>
                </optgroup>
                <optgroup label="特殊">
                  <option
                    v-for="terrain in terrainsByGroup.special"
                    :key="terrain.id"
                    :value="terrain.id"
                  >{{ terrain.name }}</option>
                </optgroup>
              </select>
              <small>{{ selectedTerrainDescription }}</small>
            </label>
            <label class="loop-option wide">
              <input v-model="draft.horizontalLoop" type="checkbox">
              <span>
                <strong>横方向を一周ループさせる</strong>
                <small>背景・床・配置物を連続表示し、左右端を同じ地点として接続します。</small>
              </span>
            </label>
            <label class="wide">
              <span>概要</span>
              <textarea v-model.trim="draft.description" rows="3"></textarea>
            </label>
            <label class="wide">
              <span>読み込むシーン</span>
              <input v-model.trim="draft.scene" required>
            </label>
            <label class="wide">
              <span>マップデータ</span>
              <input v-model.trim="draft.map" required>
            </label>
            <label>
              <span>BGM</span>
              <input v-model.trim="draft.bgm" required>
            </label>
            <label>
              <span>横幅（px）</span>
              <input v-model.number="draft.width" type="number" min="640" max="50000" step="10" required>
            </label>
            <label class="wide">
              <span>初期出現位置</span>
              <select v-model="draft.defaultSpawn" required>
                <option v-for="spawn in draft.spawns" :key="spawn.id" :value="spawn.id">
                  {{ spawn.label || spawn.id }} / {{ spawn.id }}
                </option>
              </select>
            </label>
          </div>
        </section>

        <section class="editor-section">
          <header>
            <span>02</span><h3>出現地点</h3>
            <button type="button" class="add-button" @click="addSpawn">＋ 追加</button>
          </header>
          <div class="repeat-list">
            <article v-for="(spawn, index) in draft.spawns" :key="`spawn-${index}`" class="repeat-card">
              <div class="repeat-heading">
                <strong>SPAWN {{ String(index + 1).padStart(2, '0') }}</strong>
                <button
                  type="button"
                  :disabled="draft.spawns.length === 1"
                  @click="removeSpawn(index)"
                >
                  削除
                </button>
              </div>
              <div class="form-grid">
                <label><span>ID</span><input v-model.trim="spawn.id" required></label>
                <label><span>表示名</span><input v-model.trim="spawn.label" required></label>
                <label><span>X座標</span><input v-model.number="spawn.x" type="number" required></label>
                <label><span>Y座標</span><input v-model.number="spawn.y" type="number" required></label>
              </div>
            </article>
          </div>
        </section>

        <section class="editor-section">
          <header>
            <span>03</span><h3>出口と接続先</h3>
            <button type="button" class="add-button" @click="addExit">＋ 追加</button>
          </header>
          <div v-if="draft.exits.length" class="repeat-list">
            <article v-for="(exit, index) in draft.exits" :key="`exit-${index}`" class="repeat-card">
              <div class="repeat-heading">
                <strong>EXIT {{ String(index + 1).padStart(2, '0') }}</strong>
                <button type="button" @click="draft.exits.splice(index, 1)">削除</button>
              </div>
              <div class="form-grid">
                <label><span>ID</span><input v-model.trim="exit.id" required></label>
                <label><span>表示名</span><input v-model.trim="exit.label" required></label>
                <label>
                  <span>接続方法</span>
                  <select v-model="exit.connectionType">
                    <option value="edge">道路端で自動移動</option>
                    <option value="entrance">施設入口</option>
                    <option value="junction">道路分岐</option>
                    <option value="lift">リフト</option>
                  </select>
                </label>
                <label>
                  <span>配置X座標</span>
                  <input v-model.number="exit.x" type="number" min="0" :max="draft.width" required>
                </label>
                <label v-if="exit.connectionType === 'edge'">
                  <span>接続する端</span>
                  <select v-model="exit.edge">
                    <option value="left">左端</option>
                    <option value="right">右端</option>
                  </select>
                </label>
                <label v-else>
                  <span>道が伸びる方向</span>
                  <select v-model="exit.depthDirection">
                    <option value="rear">奥側</option>
                    <option value="front">手前側</option>
                  </select>
                </label>
                <label>
                  <span>移動先エリア</span>
                  <select v-model="exit.destinationArea" required>
                    <option v-for="candidate in allAreas" :key="candidate.id" :value="candidate.id">
                      {{ candidate.name }} / {{ candidate.id }}
                    </option>
                  </select>
                </label>
                <label>
                  <span>移動先の出現地点ID</span>
                  <input v-model.trim="exit.destinationSpawn" required>
                </label>
                <label class="wide">
                  <span>必要イベントフラグ（カンマ区切り）</span>
                  <input
                    :value="formatArray(exit.requiredEventFlags)"
                    placeholder="transport_route_open"
                    @input="exit.requiredEventFlags = parseArray($event.target.value)"
                  >
                </label>
              </div>
            </article>
          </div>
          <p v-else class="empty-note">出口は設定されていません。</p>
        </section>

        <section class="editor-section">
          <header><span>04</span><h3>探索設定</h3></header>
          <div class="form-grid">
            <label><span>照明</span><input v-model.trim="draft.environment.lighting" required></label>
            <label><span>天候</span><input v-model.trim="draft.environment.weather" required></label>
            <label><span>カメラ</span><input v-model.trim="draft.environment.cameraMode" required></label>
            <label>
              <span>危険要素（カンマ区切り）</span>
              <input
                :value="formatArray(draft.environment.hazards)"
                @input="draft.environment.hazards = parseArray($event.target.value)"
              >
            </label>
            <label class="wide">
              <span>敵編成ID（1行に1つ）</span>
              <textarea
                :value="formatLines(draft.enemyFormations)"
                rows="4"
                @input="draft.enemyFormations = parseLines($event.target.value)"
              ></textarea>
            </label>
          </div>
        </section>

        <section class="editor-section">
          <header><span>05</span><h3>エリア入場条件</h3></header>
          <div class="flag-options">
            <label v-for="flag in eventFlags" :key="flag.id">
              <input v-model="draft.requiredEventFlags" type="checkbox" :value="flag.id">
              <span><code>{{ flag.id }}</code><strong>{{ flag.label }}</strong></span>
            </label>
          </div>
        </section>

        <p v-if="validationMessages.length" class="validation-message" role="alert">
          {{ validationMessages.join(' / ') }}
        </p>

        <footer class="editor-footer">
          <p v-if="saveNotice" :class="['editor-save-notice', { error: saveNoticeError }]" role="status">{{ saveNotice }}</p>
          <p v-else>保存しても画面は閉じません。src/data/exploration/areaMaster.json を直接更新します。</p>
          <div>
            <button type="button" @click="$emit('close')">閉じる</button>
            <button type="submit" class="save-button">JSONへ保存</button>
          </div>
        </footer>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  area: { type: Object, required: true },
  allAreas: { type: Array, required: true },
  eventFlags: { type: Array, required: true },
  terrainTypes: { type: Array, required: true }
})
const emit = defineEmits(['close', 'save'])
const clone = value => JSON.parse(JSON.stringify(value))
const draft = reactive(clone(props.area))
const saveNotice = ref('')
const saveNoticeError = ref(false)
draft.areaKind ||= 'route'
draft.description ||= ''
draft.horizontalLoop = draft.horizontalLoop === true
draft.mapUiTheme = draft.mapUiTheme === 'fantasy' ? 'fantasy' : 'electronic_sf'
draft.terrainType ||= 'artificial'
for (const [index, exit] of draft.exits.entries()) {
  exit.connectionType ||= 'entrance'
  exit.x = Number.isFinite(exit.x) ? exit.x : (index === 0 ? 100 : draft.width - 130)
  if (exit.connectionType === 'edge') exit.edge ||= exit.x < draft.width / 2 ? 'left' : 'right'
  else exit.depthDirection ||= 'rear'
}

const parseArray = value => value
  .split(',')
  .map(item => item.trim())
  .filter(Boolean)
const parseLines = value => value
  .split(/\r?\n/)
  .map(item => item.trim())
  .filter(Boolean)
const formatArray = value => value.join(', ')
const formatLines = value => value.join('\n')
const terrainsByGroup = computed(() => (
  Object.groupBy
    ? Object.groupBy(props.terrainTypes, terrain => terrain.group)
    : props.terrainTypes.reduce((groups, terrain) => {
        groups[terrain.group] ||= []
        groups[terrain.group].push(terrain)
        return groups
      }, {})
))
const selectedTerrainDescription = computed(() => (
  props.terrainTypes.find(terrain => terrain.id === draft.terrainType)?.description ?? ''
))

const duplicateIds = values => {
  const ids = values.map(item => item.id.trim()).filter(Boolean)
  return new Set(ids).size !== ids.length
}

const validationMessages = computed(() => {
  const messages = []
  if (duplicateIds(draft.spawns)) messages.push('出現地点IDが重複しています')
  if (duplicateIds(draft.exits)) messages.push('出口IDが重複しています')
  if (!draft.spawns.some(spawn => spawn.id === draft.defaultSpawn)) {
    messages.push('初期出現位置が出現地点に存在しません')
  }
  const areaIds = new Set(props.allAreas.map(area => area.id))
  if (draft.exits.some(exit => !areaIds.has(exit.destinationArea))) {
    messages.push('存在しない移動先エリアがあります')
  }
  if (draft.exits.some(exit => !Number.isFinite(exit.x) || exit.x < 0 || exit.x > draft.width)) {
    messages.push('出口のX座標がマップ範囲外です')
  }
  if (draft.exits.some(exit => exit.connectionType === 'edge' && !['left', 'right'].includes(exit.edge))) {
    messages.push('道路端の左右指定が不足しています')
  }
  if (draft.exits.some(exit => exit.connectionType !== 'edge' && !['rear', 'front'].includes(exit.depthDirection))) {
    messages.push('入口・分岐の奥側／手前側指定が不足しています')
  }
  if (!props.terrainTypes.some(terrain => terrain.id === draft.terrainType)) {
    messages.push('地形の指定が不正です')
  }
  return messages
})

const addSpawn = () => {
  const id = `spawn_${draft.spawns.length + 1}`
  draft.spawns.push({ id, label: `出現地点 ${draft.spawns.length + 1}`, x: 0, y: 0 })
}

const removeSpawn = index => {
  const [removed] = draft.spawns.splice(index, 1)
  if (removed?.id === draft.defaultSpawn) {
    draft.defaultSpawn = draft.spawns[0]?.id ?? ''
  }
}

const addExit = () => {
  const destination = props.allAreas.find(area => area.id !== draft.id) ?? props.allAreas[0]
  draft.exits.push({
    id: `exit_${draft.exits.length + 1}`,
    label: '新しい出口',
    connectionType: 'entrance',
    depthDirection: 'rear',
    x: Math.round(draft.width / 2),
    destinationArea: destination?.id ?? '',
    destinationSpawn: destination?.defaultSpawn ?? '',
    requiredEventFlags: []
  })
}

const save = () => {
  if (validationMessages.value.length) return
  saveNotice.value = 'areaMaster.jsonへ保存しています…'
  saveNoticeError.value = false
  emit('save', clone(draft), (ok, text) => {
    saveNoticeError.value = !ok
    saveNotice.value = text
  })
}
</script>

<style scoped>
.editor-backdrop {
  position: absolute;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 22px;
  background: rgba(0, 5, 8, 0.82);
  backdrop-filter: blur(4px);
}

.area-editor {
  display: flex;
  width: min(100%, 1180px);
  height: min(100%, 920px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(100, 232, 255, 0.55);
  background: #071117;
  color: #dffaff;
  box-shadow: 0 0 42px rgba(41, 191, 222, 0.24);
}

.editor-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 17px 20px;
  border-bottom: 1px solid rgba(126, 218, 239, 0.28);
  background: rgba(10, 36, 46, 0.96);
}

.editor-header p {
  margin: 0;
  color: #64e8ff;
  font-size: 9px;
  letter-spacing: 0.14em;
}

.editor-header h2 { margin: 3px 0 0; font-size: 18px; }

.close-button {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(126, 218, 239, 0.35);
  background: rgba(100, 232, 255, 0.08);
  color: #dffaff;
  font-size: 23px;
  cursor: pointer;
}

.editor-form { min-height: 0; overflow-y: auto; }
.editor-section { padding: 18px 20px; border-bottom: 1px solid rgba(126, 218, 239, 0.18); }

.editor-section > header {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 13px;
}

.editor-section > header > span { color: #64e8ff; font-size: 10px; }
.editor-section h3 { margin: 0; font-size: 14px; }

.add-button {
  margin-left: auto;
  border: 1px solid rgba(100, 232, 255, 0.4);
  background: rgba(100, 232, 255, 0.09);
  color: #bff6ff;
  padding: 6px 10px;
  font-size: 10px;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
}

.form-grid label {
  display: grid;
  min-width: 0;
  gap: 5px;
  color: rgba(197, 236, 244, 0.68);
  font-size: 10px;
}

.form-grid label.wide { grid-column: 1 / -1; }
.location-image-field { display: grid; gap: 9px; }
.location-image-field.wide { grid-column: 1 / -1; }
.location-image-heading { display: flex; width: 100%; align-items: center; gap: 10px; color: rgba(197, 236, 244, 0.68); font-size: 15px; }
.location-image-heading > span { white-space: nowrap; }
.location-image-heading button { margin-left: auto; border: 0; background: transparent; color: #ffb4b4; font: 13px/1.2 "Consolas", "Courier New", monospace; cursor: pointer; }
.location-image-preview { display: grid; grid-template-columns: minmax(180px, 280px) minmax(0, 1fr); gap: 12px; align-items: center; padding: 9px; border: 1px solid rgba(100, 232, 255, 0.34); background: rgba(100, 232, 255, 0.06); }
.location-image-preview img { width: 100%; height: 118px; object-fit: cover; background: #02090c; }
.location-image-preview div { display: grid; min-width: 0; gap: 6px; }
.location-image-preview strong { color: #e7fcff; font-size: 15px; }
.location-image-preview code { overflow-wrap: anywhere; color: #64e8ff; font-size: 13px; }
.location-image-list { display: grid; grid-template-columns: repeat(5, minmax(110px, 1fr)); gap: 7px; max-height: 260px; overflow-y: auto; padding: 2px; }
.location-image-list button { position: relative; display: grid; min-width: 0; gap: 4px; padding: 5px; border: 1px solid rgba(126, 218, 239, 0.2); background: rgba(2, 12, 17, 0.88); color: #dffaff; text-align: left; cursor: pointer; }
.location-image-list button.selected { border-color: #ffe07b; background: rgba(83, 65, 15, 0.56); box-shadow: 0 0 0 1px rgba(255, 224, 123, 0.2); }
.location-image-list img { width: 100%; height: 74px; object-fit: cover; background: #02090c; }
.location-image-list span { overflow: hidden; padding-inline: 2px; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.location-image-list small { position: absolute; top: 8px; right: 8px; padding: 2px 4px; background: rgba(0, 0, 0, 0.72); color: rgba(223, 250, 255, 0.75); font-size: 10px; }
.location-image-field > small,
.image-loading,
.image-load-error { margin: 0; color: rgba(197, 236, 244, 0.58); font-size: 13px; }
.image-load-error { color: #ffb4b4; }
.form-grid .loop-option {
  display: flex;
  grid-template-columns: none;
  align-items: center;
  gap: 11px;
  padding: 11px 12px;
  border: 1px solid rgba(100, 232, 255, 0.25);
  background: rgba(100, 232, 255, 0.06);
  cursor: pointer;
}
.form-grid .loop-option input {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  padding: 0;
  accent-color: #64e8ff;
}
.form-grid .loop-option > span { display: grid; gap: 2px; }
.form-grid .loop-option strong { color: #dffaff; font-size: 11px; }
.form-grid .loop-option small { color: rgba(197, 236, 244, 0.58); font-size: 9px; }

input,
select,
textarea {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid rgba(126, 218, 239, 0.3);
  border-radius: 0;
  outline: none;
  background: rgba(1, 10, 14, 0.9);
  color: #e7fcff;
  font: 12px/1.4 "Consolas", "Courier New", monospace;
}

input,
select { height: 39px; padding: 0 10px; }
textarea { min-height: 82px; resize: vertical; padding: 9px 10px; }
input:focus, select:focus, textarea:focus { border-color: #64e8ff; }
input:disabled { color: rgba(197, 236, 244, 0.42); }

.repeat-list { display: grid; gap: 10px; }

.repeat-card {
  padding: 12px;
  border: 1px solid rgba(126, 218, 239, 0.2);
  background: rgba(8, 29, 37, 0.76);
}

.repeat-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.repeat-heading strong { color: #64e8ff; font-size: 9px; }
.repeat-heading button {
  border: 0;
  background: transparent;
  color: #ff9f9f;
  font-size: 10px;
  cursor: pointer;
}
.repeat-heading button:disabled { opacity: 0.3; cursor: not-allowed; }
.empty-note { color: rgba(197, 236, 244, 0.55); font-size: 11px; }

.flag-options { display: grid; gap: 8px; }
.flag-options label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(126, 218, 239, 0.18);
  cursor: pointer;
}
.flag-options input { width: 17px; height: 17px; accent-color: #64e8ff; }
.flag-options label > span { display: grid; gap: 2px; }
.flag-options code { color: #64e8ff; font-size: 9px; }
.flag-options strong { font-size: 11px; }

.validation-message {
  margin: 14px 20px 0;
  padding: 10px 12px;
  border: 1px solid rgba(255, 113, 113, 0.52);
  background: rgba(93, 15, 18, 0.4);
  color: #ffc4c4;
  font-size: 11px;
}

.editor-footer {
  position: sticky;
  bottom: 0;
  display: grid;
  gap: 11px;
  padding: 14px 20px;
  border-top: 1px solid rgba(126, 218, 239, 0.3);
  background: rgba(3, 14, 19, 0.98);
}

.editor-footer p { margin: 0; color: rgba(255, 212, 152, 0.72); font-size: 9px; }
.editor-footer > div { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.editor-footer button {
  min-height: 36px;
  padding: 7px 12px;
  border: 1px solid rgba(126, 218, 239, 0.3);
  background: rgba(100, 232, 255, 0.08);
  color: #dffaff;
  font-size: 10px;
  cursor: pointer;
}
.editor-footer .save-button { border-color: #64e8ff; background: rgba(36, 148, 171, 0.36); font-weight: 700; }
.editor-footer .editor-save-notice { color:#9dffb6; font-size:15px; opacity:1; }.editor-footer .editor-save-notice.error{color:#ff9b8d}

@media (max-width: 520px) {
  .editor-backdrop { padding: 12px; }
  .form-grid { grid-template-columns: 1fr; }
  .form-grid label.wide { grid-column: auto; }
  .location-image-field.wide { grid-column: auto; }
  .location-image-preview { grid-template-columns: 1fr; }
  .location-image-list { grid-template-columns: repeat(2, minmax(100px, 1fr)); }
}

@media (min-width: 1000px) {
  .editor-backdrop { padding: 34px; }
  .editor-header { padding: 18px 26px; }
  .editor-header h2 { font-size: 22px; }
  .editor-section { padding: 20px 26px; }
  .repeat-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .location-image-list { grid-template-columns: repeat(6, minmax(110px, 1fr)); }
  .editor-footer { padding-inline: 26px; }
}
</style>
