<template>
  <main class="area-console">
    <div class="console-grid" aria-hidden="true"></div>

    <header class="console-header">
      <button
        type="button"
        class="icon-button"
        :aria-label="selectedArea ? 'エリア選択へ戻る' : 'ゲストメニューへ戻る'"
        @click="goBack"
      >
        ‹
      </button>
      <div>
        <p class="eyebrow">SIDE-SCROLL EXPLORATION / AREA MASTER</p>
        <h1>{{ selectedArea ? selectedArea.name : '階層・エリア選択' }}</h1>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="guide-button"
          @click="showCreationGuide = true"
        >
          作成手順
        </button>
        <button
          v-if="selectedArea"
          type="button"
          class="parts-button"
          @click="showPartEditor = true"
        >
          素材・部品
        </button>
        <button
          v-if="selectedArea"
          type="button"
          class="map-button"
          @click="openMap"
        >
          マップを開く
        </button>
        <button
          v-if="selectedArea && selectedMapDraft"
          type="button"
          class="map-edit-button"
          @click="showMapEditor = true"
        >
          マップ作成
        </button>
        <button
          v-if="selectedArea"
          type="button"
          class="edit-button"
          @click="showEditor = true"
        >
          エリア情報
        </button>
        <button
          v-if="!selectedArea"
          type="button"
          class="create-area-button"
          @click="showCreateWizard = true"
        >
          ＋ 新規エリア
        </button>
        <span v-if="!selectedArea" class="readonly-badge">SOURCE JSON</span>
      </div>
    </header>

    <section v-if="!selectedArea" class="selection-screen" aria-label="探索エリア選択">
      <div class="selection-toolbar">
        <div>
          <span>STEP 01</span>
          <h2>階層を選択</h2>
        </div>
        <button
          type="button"
          class="selection-help-button"
          aria-label="階層・エリア選択の説明を開く"
          @click="showSelectionHelp = true"
        >?</button>
      </div>

      <nav class="floor-tabs" aria-label="探索階層">
        <button
          v-for="floor in floorTabs"
          :key="floor.id"
          type="button"
          :class="{ active: activeLayer === floor.id }"
          :data-layer="floor.id"
          @click="selectLayer(floor.id)"
        >
          <span>{{ floor.code }}</span>
          <strong>{{ floor.label }}</strong>
          <small>{{ layerAreaCount(floor.id) }} AREAS</small>
        </button>
      </nav>

      <div class="selection-step-heading">
        <span>STEP 02</span>
        <div>
          <h2>{{ activeLayer === 'exterior' ? '外界用の地形' : `${activeFloor.label}のエリアを選択` }}</h2>
          <p>{{ activeFloor.description }}</p>
        </div>
      </div>

      <section
        v-for="district in visibleDistricts"
        :key="district.id"
        class="district-section"
      >
        <div class="district-heading">
          <div>
            <span>DISTRICT</span>
            <h2>{{ district.name }}</h2>
          </div>
          <strong>{{ district.areaIds.length }} AREAS</strong>
        </div>
        <p class="district-description">{{ district.description }}</p>

        <div class="area-list">
          <button
            v-for="(area, index) in getDistrictAreas(district)"
            :key="area.id"
            type="button"
            class="area-card"
            :data-area-id="area.id"
            @click="openArea(area.id)"
          >
            <span class="area-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="area-card-main">
              <strong>{{ area.name }}</strong>
              <small>{{ area.id }}</small>
            </span>
            <span class="area-card-meta">
              <small v-if="activeLayer === 'exterior'">
                {{ getTerrainTypeById(area.terrainType)?.name || area.terrainType }}
              </small>
              <small>{{ area.width.toLocaleString() }} px</small>
              <small>{{ area.exits.length }} 接続</small>
            </span>
            <span class="area-arrow">›</span>
          </button>
        </div>
      </section>

      <div v-if="activeLayer !== 'exterior' && !visibleDistricts.length" class="floor-empty">
        <span>{{ activeFloor.code }}</span>
        <strong>{{ activeFloor.label }}のエリアデータは未作成です</strong>
        <p>areaMaster.json に `layer: "{{ activeLayer }}"` の地区とエリアを追加すると、ここに表示されます。</p>
      </div>

      <div class="architecture-note">
        <span>DATA FLOW</span>
        <p>AreaMaster → AreaScene / Map → AreaState → EventFlag</p>
      </div>
    </section>

    <template v-else>
      <nav class="detail-tabs" aria-label="エリア設定カテゴリ">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span>{{ tab.step }}</span>
          {{ tab.label }}
        </button>
      </nav>

      <section
        :class="['detail-scroll', { 'fantasy-scrollbar': selectedArea.mapUiTheme === 'fantasy' }]"
      >
        <div v-if="activeTab === 'basic'" class="detail-section">
          <div class="area-hero">
            <div>
              <span>AREA ID</span>
              <code>{{ selectedArea.id }}</code>
            </div>
            <strong>{{ selectedArea.width.toLocaleString() }}<small> px</small></strong>
          </div>

          <div class="setting-grid">
            <article class="setting-card">
              <span>表示名</span>
              <strong>{{ selectedArea.name }}</strong>
            </article>
            <article class="setting-card">
              <span>所属地区</span>
              <strong>{{ selectedDistrict?.name }}</strong>
            </article>
            <article class="setting-card">
              <span>エリア種別</span>
              <strong>{{ areaKindLabel(selectedArea.areaKind) }}</strong>
            </article>
            <article class="setting-card">
              <span>マップUIテーマ</span>
              <strong>{{ selectedArea.mapUiTheme === 'fantasy' ? 'ファンタジー' : '電子SF' }}</strong>
            </article>
            <article class="setting-card">
              <span>地形</span>
              <strong>{{ selectedTerrainType?.name || selectedArea.terrainType }}</strong>
            </article>
            <article class="setting-card wide">
              <span>概要</span>
              <p>{{ selectedArea.description || '未設定' }}</p>
            </article>
            <article class="setting-card wide">
              <span>読み込むシーン</span>
              <code>{{ selectedArea.scene }}</code>
            </article>
            <article class="setting-card wide">
              <span>マップデータ</span>
              <code>{{ selectedArea.map }}</code>
            </article>
            <article class="setting-card">
              <span>BGM</span>
              <code>{{ selectedArea.bgm }}</code>
            </article>
            <article class="setting-card">
              <span>初期出現位置</span>
              <code>{{ selectedArea.defaultSpawn }}</code>
            </article>
          </div>

          <article class="data-panel">
            <header><span>ENVIRONMENT</span><strong>環境設定</strong></header>
            <dl class="key-value-list">
              <div><dt>照明</dt><dd>{{ selectedArea.environment.lighting }}</dd></div>
              <div><dt>天候</dt><dd>{{ selectedArea.environment.weather }}</dd></div>
              <div><dt>カメラ</dt><dd>{{ selectedArea.environment.cameraMode }}</dd></div>
              <div>
                <dt>危険要素</dt>
                <dd>{{ formatList(selectedArea.environment.hazards) }}</dd>
              </div>
            </dl>
          </article>

          <article class="data-panel">
            <header><span>MAP VISUAL</span><strong>背景と素材・部品</strong></header>
            <ol class="layer-list">
              <li><span>色</span><code>上下左右4色グラデーション</code></li>
              <li><span>背景</span><code>{{ selectedMapDraft?.backgroundImages?.length ?? 0 }} レイヤー</code></li>
              <li><span>部品</span><code>{{ selectedMapDraft?.mapParts?.length ?? 0 }} 個配置</code></li>
            </ol>
          </article>
        </div>

        <div v-else-if="activeTab === 'map'" class="detail-section">
          <article class="data-panel">
            <header><span>SPAWN POINTS</span><strong>出現地点</strong></header>
            <div class="connection-list">
              <div v-for="spawn in selectedArea.spawns" :key="spawn.id" class="connection-card">
                <div>
                  <strong>{{ spawn.label }}</strong>
                  <code>{{ spawn.id }}</code>
                </div>
                <span>X {{ spawn.x }}</span>
              </div>
            </div>
          </article>

          <article class="data-panel">
            <header><span>AREA CONNECTION</span><strong>出口と接続先</strong></header>
            <div class="exit-list">
              <div v-for="exit in selectedArea.exits" :key="exit.id" class="exit-card">
                <div class="exit-top">
                  <strong>{{ exit.label }}</strong>
                  <code>{{ exit.id }}</code>
                </div>
                <div class="connection-route">
                  <span>{{ selectedArea.id }}</span>
                  <b>→</b>
                  <span>{{ exit.destinationArea }}</span>
                </div>
                <p>
                  {{ exit.connectionType === 'edge' ? `道路${exit.edge === 'left' ? '左' : '右'}端で自動移動` : `X ${exit.x} の${exit.connectionType === 'junction' ? '道路分岐' : '入口'}` }}
                </p>
                <p v-if="exit.connectionType !== 'edge'">
                  道の向き <strong>{{ exit.depthDirection === 'front' ? '手前側' : '奥側' }}</strong>
                </p>
                <p>出現地点 <code>{{ exit.destinationSpawn }}</code></p>
                <p v-if="exit.requiredEventFlags.length">
                  条件 <code>{{ exit.requiredEventFlags.join(', ') }}</code>
                </p>
              </div>
            </div>
          </article>

          <article class="data-panel">
            <header><span>MAP RESPONSIBILITY</span><strong>マップ側で持つ情報</strong></header>
            <div class="chip-list">
              <span v-for="item in mapResponsibilities" :key="item">{{ item }}</span>
            </div>
          </article>
        </div>

        <div v-else class="detail-section">
          <article class="data-panel">
            <header><span>AREA STATE</span><strong>初期状態とセーブ差分</strong></header>
            <p class="panel-note">
              下記は初期値です。プレイ中はセーブデータを上から適用し、AreaMaster自体は変更しません。
            </p>
            <dl class="key-value-list state-list">
              <div><dt>警報状態</dt><dd>{{ selectedAreaState.alarmState }}</dd></div>
              <div><dt>開いた扉</dt><dd>{{ formatList(selectedAreaState.openedDoors) }}</dd></div>
              <div><dt>撃破済み固定敵</dt><dd>{{ formatList(selectedAreaState.defeatedEnemies) }}</dd></div>
              <div><dt>回収済みアイテム</dt><dd>{{ formatList(selectedAreaState.collectedItems) }}</dd></div>
              <div><dt>修理済み設備</dt><dd>{{ formatList(selectedAreaState.repairedFacilities) }}</dd></div>
              <div><dt>救助済みNPC</dt><dd>{{ formatList(selectedAreaState.rescuedNpcs) }}</dd></div>
              <div><dt>有効な出口</dt><dd>{{ formatList(selectedAreaState.unlockedExits) }}</dd></div>
            </dl>
          </article>

          <article class="data-panel">
            <header><span>ENEMY FORMATION</span><strong>敵編成</strong></header>
            <div class="chip-list">
              <code v-for="formation in selectedArea.enemyFormations" :key="formation">{{ formation }}</code>
              <span v-if="!selectedArea.enemyFormations.length">なし</span>
            </div>
          </article>

          <article class="data-panel">
            <header><span>EVENT CONDITIONS</span><strong>必要なイベント条件</strong></header>
            <div v-if="requiredFlagDetails.length" class="flag-list">
              <div v-for="flag in requiredFlagDetails" :key="flag.id">
                <code>{{ flag.id }}</code>
                <strong>{{ flag.label }}</strong>
                <span>初期値: {{ flag.defaultValue ? 'ON' : 'OFF' }}</span>
              </div>
            </div>
            <p v-else class="empty-state">このエリア自体に入場条件はありません。</p>
          </article>

          <article class="load-flow">
            <span>AREA LOAD FLOW</span>
            <ol>
              <li v-for="(step, index) in loadFlow" :key="step">
                <b>{{ String(index + 1).padStart(2, '0') }}</b>
                <p>{{ step }}</p>
              </li>
            </ol>
          </article>
        </div>
      </section>
    </template>

    <div
      v-if="showCreationGuide"
      class="help-backdrop"
      role="presentation"
      @mousedown.self="showCreationGuide = false"
    >
      <section
        class="help-dialog creation-guide-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="creation-guide-title"
      >
        <header>
          <div>
            <span>AREA CREATION FLOW</span>
            <h2 id="creation-guide-title">横スクロールエリアの作成手順</h2>
          </div>
          <button type="button" aria-label="作成手順を閉じる" @click="showCreationGuide = false">×</button>
        </header>
        <div class="help-dialog-body creation-guide-body">
          <p class="creation-guide-lead">
            情報を決めてから素材を登録し、その部品をマップへ配置します。背景や配置画像はエリア情報では設定しません。
          </p>
          <ol class="creation-steps">
            <li>
              <b>01</b>
              <p>
                <strong>エリア情報を設定</strong>
                <span>名前、所属地区、種類、概要、BGM、シーン、接続先、必要なイベント条件を設定します。</span>
                <small><code>areaMaster.json</code> — エリアの意味と接続を管理</small>
              </p>
              <button v-if="selectedArea" type="button" @click="openAreaInfoFromGuide">エリア情報を開く</button>
            </li>
            <li>
              <b>02</b>
              <p>
                <strong>素材・部品を作成</strong>
                <span>元画像を選び、床・壁・配管・装飾として使う範囲を切り出します。配置方式と当たり判定の初期値も部品側へ保存します。</span>
                <small>一度登録した部品は複数のマップで再利用</small>
              </p>
              <button v-if="selectedArea" type="button" @click="openPartEditorFromGuide">素材・部品を開く</button>
            </li>
            <li>
              <b>03</b>
              <p>
                <strong>マップを作成</strong>
                <span>最奥の4方向色と必要な枚数の背景を設定し、登録済み部品、地形、当たり判定、NPC、敵、宝箱、出現地点、出口を配置します。</span>
                <small><code>areaMapDrafts.json</code> — 見た目と座標を管理</small>
              </p>
              <button v-if="selectedArea && selectedMapDraft" type="button" @click="openMapEditorFromGuide">マップ作成を開く</button>
            </li>
            <li>
              <b>04</b>
              <p>
                <strong>状態とイベントを確認</strong>
                <span>敵撃破、宝箱取得、扉解放など、探索中に変化する状態とイベント条件を確認します。</span>
                <small><code>areaStateDefaults.json</code> — 初期状態とセーブ差分を管理</small>
              </p>
            </li>
            <li>
              <b>05</b>
              <p>
                <strong>実マップで確認</strong>
                <span>マップを開き、背景、部品、移動、当たり判定、出入口が実際に反映されているか確認します。</span>
              </p>
              <button v-if="selectedArea" type="button" @click="openMapFromGuide">マップを開く</button>
            </li>
          </ol>
          <aside class="creation-guide-warning"><strong>設定場所</strong><span>背景と配置画像はエリア情報ではなく、素材・部品作成とマップ作成で設定します。</span></aside>
        </div>
        <footer>
          <span v-if="!selectedArea">先に一覧から編集するエリアを選択してください。</span>
          <button type="button" @click="showCreationGuide = false">閉じる</button>
        </footer>
      </section>
    </div>

    <AreaSettingsEditor
      v-if="showEditor && selectedArea"
      :area="selectedArea"
      :all-areas="sourceAreas"
      :event-flags="eventFlags"
      :terrain-types="terrainTypes"
      @close="showEditor = false"
      @save="saveAreaToSource"
    />
    <AreaMapDraftEditor
      v-if="showMapEditor && selectedArea && selectedMapDraft"
      :area="selectedArea"
      :map-draft="selectedMapDraft"
      :area-state="selectedAreaState"
      :all-areas="sourceAreas"
      :event-flags="eventFlags"
      :asset-catalog="explorationAssetCatalog"
      :character-library="characterLibrary"
      :map-part-library="sourceMapPartLibrary"
      @close="showMapEditor = false"
      @save="saveMapDraftToSource"
      @save-state="saveAreaStateToSource"
    />
    <MapPartLibraryEditor
      v-if="showPartEditor"
      :library="sourceMapPartLibrary"
      @close="showPartEditor = false"
      @save="saveMapPartLibraryToSource"
    />
    <AreaCreateWizard
      v-if="showCreateWizard"
      :districts="sourceDistricts"
      :terrain-types="terrainTypes"
      :all-areas="sourceAreas"
      :asset-catalog="explorationAssetCatalog"
      @close="showCreateWizard = false"
      @create="createAreaBundle"
    />

    <div
      v-if="showSelectionHelp"
      class="help-backdrop"
      role="presentation"
      @mousedown.self="showSelectionHelp = false"
    >
      <section
        class="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="area-help-title"
      >
        <header>
          <div>
            <span>AREA NAVIGATION HELP</span>
            <h2 id="area-help-title">階層・エリア選択について</h2>
          </div>
          <button type="button" aria-label="説明を閉じる" @click="showSelectionHelp = false">×</button>
        </header>
        <div class="help-dialog-body">
          <ol>
            <li><b>01</b><p><strong>階層を選択</strong><span>上層・中層・下層など、確認したい階層のタブを選びます。</span></p></li>
            <li><b>02</b><p><strong>エリアを選択</strong><span>選択した階層に属する道路・通路・施設だけが一覧に表示されます。</span></p></li>
            <li><b>03</b><p><strong>設定またはマップを開く</strong><span>エリア基本データを編集するか、横スクロールマップを確認します。</span></p></li>
          </ol>
          <p class="help-storage-note">
            設定編集から保存すると、ローカルの <code>src/data/exploration/areaMaster.json</code> を直接更新します。
          </p>
        </div>
        <footer>
          <button type="button" @click="showSelectionHelp = false">閉じる</button>
        </footer>
      </section>
    </div>
    <p v-if="saveMessage && !showEditor && !showMapEditor && !showPartEditor" :class="['save-message', { error: saveError }]">{{ saveMessage }}</p>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AreaCreateWizard from '@/components/exploration/AreaCreateWizard.vue'
import AreaMapDraftEditor from '@/components/exploration/AreaMapDraftEditor.vue'
import AreaSettingsEditor from '@/components/exploration/AreaSettingsEditor.vue'
import MapPartLibraryEditor from '@/components/exploration/MapPartLibraryEditor.vue'
import areaMapDrafts from '@/data/exploration/areaMapDrafts.json'
import areaStateDefaults from '@/data/exploration/areaStateDefaults.json'
import explorationAssetCatalog from '@/data/exploration/explorationAssetCatalog.json'
import characterLibrary from '@/data/exploration/characterLibrary.json'
import mapPartLibrary from '@/data/exploration/mapPartLibrary.json'
import {
  areas,
  districts,
  eventFlags,
  getAreaById,
  getAreaState,
  getTerrainTypeById,
  terrainTypes
} from '@/data/exploration/areaRepository.js'

const route = useRoute()
const router = useRouter()
const clone = value => JSON.parse(JSON.stringify(value))
const initialAreaId = typeof route.query.area === 'string' && getAreaById(route.query.area)
  ? route.query.area
  : null
const selectedAreaId = ref(initialAreaId)
const activeTab = ref('basic')
const showEditor = ref(false)
const showMapEditor = ref(false)
const showCreateWizard = ref(false)
const showSelectionHelp = ref(false)
const showCreationGuide = ref(false)
const showPartEditor = ref(false)
const sourceAreas = ref(clone(areas))
const sourceDistricts = ref(clone(districts))
const sourceMapDrafts = ref(clone(areaMapDrafts.maps))
const sourceAreaStates = ref(clone(areaStateDefaults.areaStates))
const sourceMapPartLibrary = ref(clone(mapPartLibrary))
const saveMessage = ref('')
const saveError = ref(false)

const tabs = [
  { id: 'basic', step: '01', label: '基本' },
  { id: 'map', step: '02', label: 'マップ・接続' },
  { id: 'state', step: '03', label: '状態・イベント' }
]
const floorTabs = [
  { id: 'upper', code: 'UPPER', label: '上層', description: '中央共有区、マギテック側、エイドロン側の研究・管理階層。' },
  { id: 'middle', code: 'MIDDLE', label: '中層', description: '生活、任務、工房、植物資源生産を担う一般活動階層。' },
  { id: 'lower', code: 'LOWER', label: '下層', description: '再生資源、廃棄物処理、重工業を担う産業階層。' },
  { id: 'hidden_middle', code: 'HIDDEN', label: '秘匿中層', description: '船体中枢と制御設備を収めた非公開階層。' },
  { id: 'bottom_expedition', code: 'BOTTOM', label: '底部外征区', description: '部隊の出撃、帰還、空中艦運用を担う船体底部区画。' },
  { id: 'exterior', code: 'EXTERIOR', label: '外界', description: '船外へ出た後に使用する自然地形と旧文明地形の仮エリア。' }
]
const areaLayer = area => (
  area?.layer
  ?? sourceDistricts.value.find(district => district.id === area?.districtId)?.layer
  ?? 'middle'
)
const requestedLayer = typeof route.query.layer === 'string'
  && floorTabs.some(floor => floor.id === route.query.layer)
  ? route.query.layer
  : null
const initialArea = initialAreaId ? areas.find(area => area.id === initialAreaId) : null
const activeLayer = ref(initialArea ? areaLayer(initialArea) : (requestedLayer ?? 'middle'))
const mapResponsibilities = [
  '背景配置',
  '床・壁の当たり判定',
  '扉',
  'NPC配置地点',
  '敵配置地点',
  'イベント地点'
]
const loadFlow = [
  '移動先エリアIDと出現地点を受け取る',
  'AreaMasterから基本データを検索する',
  '対応するシーンとマップを読み込む',
  'AreaStateへセーブ済みの変更状態を適用する',
  '指定された出現地点へプレイヤーを配置する',
  'EventFlagを反映して探索を開始する'
]

const selectedArea = computed(() => (
  sourceAreas.value.find(area => area.id === selectedAreaId.value) ?? null
))
const activeFloor = computed(() => (
  floorTabs.find(floor => floor.id === activeLayer.value) ?? floorTabs[1]
))
const visibleDistricts = computed(() => (
  sourceDistricts.value.filter(district => (
    (district.layer ?? getDistrictAreas(district)[0]?.layer ?? 'middle') === activeLayer.value
  ))
))
const selectedDistrict = computed(() => (
  sourceDistricts.value.find(district => district.id === selectedArea.value?.districtId) ?? null
))
const selectedAreaState = computed(() => (
  selectedArea.value ? getAreaState(selectedArea.value.id, sourceAreaStates.value) : {}
))
const selectedTerrainType = computed(() => (
  getTerrainTypeById(selectedArea.value?.terrainType ?? 'artificial')
))
const selectedMapDraft = computed(() => (
  selectedArea.value ? sourceMapDrafts.value[selectedArea.value.id] ?? null : null
))
const requiredFlagDetails = computed(() => {
  const required = new Set(selectedArea.value?.requiredEventFlags ?? [])
  return eventFlags.filter(flag => required.has(flag.id))
})

const getDistrictAreas = district => (
  district.areaIds
    .map(areaId => sourceAreas.value.find(area => area.id === areaId))
    .filter(Boolean)
)
const formatList = list => list?.length ? list.join(' / ') : 'なし'
const layerAreaCount = layer => sourceAreas.value.filter(area => areaLayer(area) === layer).length
const areaKindLabel = areaKind => ({
  route: '道路・通路',
  facility: '施設内部',
  field: '屋外フィールド'
}[areaKind] ?? areaKind)

const selectLayer = layer => {
  activeLayer.value = layer
}

const openArea = areaId => {
  selectedAreaId.value = areaId
  const area = sourceAreas.value.find(candidate => candidate.id === areaId)
  if (area) activeLayer.value = areaLayer(area)
  activeTab.value = 'basic'
}

const openMap = () => {
  if (!selectedArea.value) return
  router.push(`/area-map/${selectedArea.value.id}`)
}

const openAreaInfoFromGuide = () => {
  showCreationGuide.value = false
  showEditor.value = true
}

const openMapEditorFromGuide = () => {
  showCreationGuide.value = false
  showMapEditor.value = true
}

const openPartEditorFromGuide = () => {
  showCreationGuide.value = false
  showPartEditor.value = true
}

const openMapFromGuide = () => {
  showCreationGuide.value = false
  openMap()
}

const saveAreaToSource = async (area, notify) => {
  saveMessage.value = 'areaMaster.jsonへ保存しています…'
  saveError.value = false
  try {
    const response = await fetch('/api/local/area-master', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area })
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || '保存に失敗しました')
    sourceAreas.value = clone(payload.areas)
    sourceDistricts.value = clone(payload.districts)
    saveMessage.value = 'areaMaster.jsonへ保存しました'
    notify?.(true, saveMessage.value)
    window.setTimeout(() => {
      if (!saveError.value) saveMessage.value = ''
    }, 2400)
  } catch (error) {
    saveError.value = true
    saveMessage.value = error.message || '保存に失敗しました'
    notify?.(false, saveMessage.value)
  }
}

const saveMapDraftToSource = async (mapDraft, notify) => {
  if (!selectedArea.value) return
  saveMessage.value = 'areaMapDrafts.jsonへ保存しています…'
  saveError.value = false
  try {
    const response = await fetch('/api/local/area-map-draft', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areaId: selectedArea.value.id, mapDraft })
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || '保存に失敗しました')
    sourceMapDrafts.value = clone(payload.maps)
    saveMessage.value = 'areaMapDrafts.jsonへ保存しました'
    notify?.(true, saveMessage.value)
    window.setTimeout(() => {
      if (!saveError.value) saveMessage.value = ''
    }, 2400)
  } catch (error) {
    saveError.value = true
    saveMessage.value = error.message || '保存に失敗しました'
    notify?.(false, saveMessage.value)
  }
}

const saveAreaStateToSource = async (areaState, notify) => {
  if (!selectedArea.value) return
  saveMessage.value = 'areaStateDefaults.jsonへ保存しています…'
  saveError.value = false
  try {
    const response = await fetch('/api/local/area-state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areaId: selectedArea.value.id, areaState })
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || '状態保存に失敗しました')
    sourceAreaStates.value = clone(payload.areaStates)
    saveMessage.value = 'areaStateDefaults.jsonへ保存しました'
    notify?.(true, saveMessage.value)
    window.setTimeout(() => {
      if (!saveError.value) saveMessage.value = ''
    }, 2400)
  } catch (error) {
    saveError.value = true
    saveMessage.value = error.message || '状態保存に失敗しました'
    notify?.(false, saveMessage.value)
  }
}

const saveMapPartLibraryToSource = async (library, notify) => {
  saveMessage.value = 'mapPartLibrary.jsonへ保存しています…'
  saveError.value = false
  try {
    const response = await fetch('/api/local/map-part-library', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ library })
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || '素材・部品の保存に失敗しました')
    sourceMapPartLibrary.value = clone(payload)
    saveMessage.value = 'mapPartLibrary.jsonへ保存しました'
    notify?.(true, saveMessage.value)
    window.setTimeout(() => { if (!saveError.value) saveMessage.value = '' }, 2400)
  } catch (error) {
    saveError.value = true
    saveMessage.value = error.message || '素材・部品の保存に失敗しました'
    notify?.(false, saveMessage.value)
  }
}

const createAreaBundle = async bundle => {
  saveMessage.value = '新しいエリアJSONを作成しています…'
  saveError.value = false
  try {
    const response = await fetch('/api/local/area-bundle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundle)
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'エリア作成に失敗しました')
    sourceAreas.value = clone(payload.master.areas)
    sourceDistricts.value = clone(payload.master.districts)
    sourceMapDrafts.value = clone(payload.drafts.maps)
    sourceAreaStates.value = clone(payload.states.areaStates)
    showCreateWizard.value = false
    openArea(bundle.area.id)
    showMapEditor.value = true
    saveMessage.value = '新しいエリアを作成しました'
  } catch (error) {
    saveError.value = true
    saveMessage.value = error.message || 'エリア作成に失敗しました'
  }
}

const goBack = () => {
  if (selectedArea.value) {
    activeLayer.value = areaLayer(selectedArea.value)
    selectedAreaId.value = null
    activeTab.value = 'basic'
    return
  }
  router.push('/guest')
}

watch([selectedAreaId, activeLayer], ([areaId, layer]) => {
  router.replace({
    path: '/area-exploration',
    query: areaId ? { area: areaId } : { layer }
  })
})

const renderAreaState = () => JSON.stringify({
  screen: selectedArea.value ? 'area-settings' : 'area-selection',
  selectedAreaId: selectedArea.value?.id ?? null,
  selectedAreaName: selectedArea.value?.name ?? null,
  terrainType: selectedArea.value?.terrainType ?? null,
  backgroundImageCount: selectedMapDraft.value?.backgroundImages?.length ?? 0,
  mapPartCount: selectedMapDraft.value?.mapParts?.length ?? 0,
  activeTab: selectedArea.value ? activeTab.value : null,
  activeLayer: activeLayer.value,
  activeLayerLabel: activeFloor.value.label,
  isEditorOpen: showEditor.value,
  isMapEditorOpen: showMapEditor.value,
  isHelpOpen: showSelectionHelp.value,
  isCreationGuideOpen: showCreationGuide.value,
  isPartEditorOpen: showPartEditor.value,
  saveMessage: saveMessage.value,
  availableAreaIds: sourceAreas.value.map(area => area.id),
  visibleAreaIds: visibleDistricts.value.flatMap(district => getDistrictAreas(district).map(area => area.id)),
  visibleTerrainIds: activeLayer.value === 'exterior'
    ? visibleDistricts.value.flatMap(district => (
        getDistrictAreas(district).map(area => area.terrainType).filter(Boolean)
      ))
    : [],
  coordinateSystem: 'Map coordinates use left origin; x increases to the right.'
})

if (typeof window !== 'undefined') {
  window.render_game_to_text = renderAreaState
  window.advanceTime = () => {}
}

onBeforeUnmount(() => {
  if (window.render_game_to_text === renderAreaState) delete window.render_game_to_text
  delete window.advanceTime
})
</script>

<style scoped>
.area-console {
  --cyan: #64e8ff;
  --cyan-soft: rgba(100, 232, 255, 0.16);
  --line: rgba(126, 218, 239, 0.28);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid rgba(100, 232, 255, 0.32);
  background:
    radial-gradient(circle at 80% 0%, rgba(34, 126, 153, 0.22), transparent 35%),
    linear-gradient(155deg, #071117 0%, #03090d 62%, #07151c 100%);
  color: #dffaff;
  font-family: "Consolas", "Courier New", monospace;
}

.console-grid {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  background-image:
    linear-gradient(rgba(100, 232, 255, 0.35) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 232, 255, 0.35) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

button { font: inherit; }

.console-header {
  position: relative;
  z-index: 2;
  display: grid;
  height: 112px;
  box-sizing: border-box;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
  background: rgba(2, 10, 14, 0.82);
}

.console-header h1 {
  overflow: hidden;
  margin: 2px 0 0;
  font-size: 24px;
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eyebrow,
.step-label {
  margin: 0;
  color: var(--cyan);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.icon-button {
  width: 44px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--cyan-soft);
  color: var(--cyan);
  font-size: 34px;
  line-height: 1;
  cursor: pointer;
}

.readonly-badge {
  padding: 5px 8px;
  border: 1px solid rgba(255, 197, 106, 0.5);
  color: #ffd498;
  font-size: 9px;
  letter-spacing: 0.12em;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
}

.edit-button,
.map-button,
.map-edit-button,
.guide-button,
.parts-button,
.create-area-button {
  min-height: 30px;
  box-sizing: border-box;
  padding: 6px 9px;
  border: 1px solid rgba(100, 232, 255, 0.5);
  background: rgba(100, 232, 255, 0.12);
  color: #c9f8ff;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.edit-button,
.map-button,
.map-edit-button,
.guide-button,
.parts-button,
.create-area-button { cursor: pointer; }
.guide-button { border-color: rgba(255, 212, 108, 0.65); color: #ffe29a; }
.parts-button { border-color: rgba(221, 165, 255, 0.58); color: #e6bfff; }
.map-button { border-color: rgba(255, 197, 106, 0.55); color: #ffd498; }
.map-edit-button { border-color: rgba(166, 255, 152, 0.55); color: #baffaa; }
.create-area-button { border-color: rgba(166, 255, 152, 0.55); color: #baffaa; }

.selection-screen,
.detail-scroll {
  position: relative;
  z-index: 1;
  height: calc(100% - 112px);
  box-sizing: border-box;
  overflow-y: auto;
  padding: 22px 24px 32px;
}

.district-description,
.panel-note {
  margin: 0;
  color: rgba(215, 244, 250, 0.72);
  font-size: 13px;
  line-height: 1.75;
}

.selection-toolbar {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.selection-toolbar > div {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.selection-toolbar span {
  color: var(--cyan);
  font-size: 8px;
  letter-spacing: 0.13em;
}
.selection-toolbar h2 { margin: 0; font-size: 17px; }
.selection-help-button {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(100, 232, 255, 0.48);
  border-radius: 50%;
  background: rgba(100, 232, 255, 0.09);
  color: #bff7ff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}
.selection-help-button:hover,
.selection-help-button:focus-visible {
  border-color: var(--cyan);
  outline: none;
  background: rgba(100, 232, 255, 0.18);
}

.floor-tabs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  margin-top: 8px;
  border: 1px solid var(--line);
  background: rgba(2, 13, 18, 0.92);
}

.floor-tabs button {
  display: grid;
  min-width: 0;
  min-height: 82px;
  box-sizing: border-box;
  place-content: center;
  gap: 2px;
  padding: 10px 8px;
  border: 0;
  border-right: 1px solid var(--line);
  background: transparent;
  color: rgba(215, 244, 250, 0.56);
  text-align: center;
  cursor: pointer;
}

.floor-tabs button:last-child { border-right: 0; }
.floor-tabs button:hover,
.floor-tabs button:focus-visible {
  outline: none;
  background: rgba(100, 232, 255, 0.08);
  color: #e7fcff;
}
.floor-tabs button.active {
  box-shadow: inset 0 -3px var(--cyan);
  background: rgba(100, 232, 255, 0.16);
  color: #effdff;
}
.floor-tabs span { color: var(--cyan); font-size: 8px; letter-spacing: 0.13em; }
.floor-tabs strong { overflow: hidden; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.floor-tabs small { color: rgba(215, 244, 250, 0.46); font-size: 8px; }

.selection-step-heading {
  display: flex;
  align-items: start;
  gap: 14px;
  margin-top: 24px;
}
.selection-step-heading > span {
  flex: 0 0 auto;
  margin-top: 5px;
  color: var(--cyan);
  font-size: 9px;
  letter-spacing: 0.13em;
}
.selection-step-heading h2 { margin: 0; font-size: 20px; }
.selection-step-heading p {
  margin: 4px 0 0;
  color: rgba(215, 244, 250, 0.62);
  font-size: 11px;
}

.floor-empty {
  display: grid;
  min-height: 180px;
  place-content: center;
  gap: 7px;
  margin-top: 18px;
  border: 1px dashed var(--line);
  background: rgba(3, 17, 23, 0.66);
  text-align: center;
}
.floor-empty span { color: var(--cyan); font-size: 9px; letter-spacing: 0.14em; }
.floor-empty strong { font-size: 16px; }
.floor-empty p { margin: 0; color: rgba(215, 244, 250, 0.55); font-size: 10px; }

.help-backdrop {
  position: absolute;
  z-index: 40;
  inset: 0;
  display: grid;
  box-sizing: border-box;
  place-items: center;
  padding: 20px;
  background: rgba(0, 7, 10, 0.78);
  backdrop-filter: blur(4px);
}

.help-dialog {
  width: min(100%, 620px);
  overflow: hidden;
  border: 1px solid rgba(100, 232, 255, 0.52);
  background: #07151b;
  box-shadow: 0 0 36px rgba(41, 191, 222, 0.24);
}
.help-dialog > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
  background: rgba(10, 36, 46, 0.96);
}
.help-dialog > header span {
  color: var(--cyan);
  font-size: 8px;
  letter-spacing: 0.13em;
}
.help-dialog > header h2 { margin: 3px 0 0; font-size: 18px; }
.help-dialog > header button {
  width: 36px;
  height: 36px;
  border: 1px solid var(--line);
  background: rgba(100, 232, 255, 0.08);
  color: #dffaff;
  font-size: 21px;
  cursor: pointer;
}
.help-dialog-body { padding: 18px; }
.help-dialog-body ol {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.help-dialog-body li {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}
.help-dialog-body li > b {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid rgba(100, 232, 255, 0.4);
  color: var(--cyan);
  font-size: 9px;
}
.help-dialog-body li p { display: grid; gap: 3px; margin: 0; }
.help-dialog-body li strong { font-size: 12px; }
.help-dialog-body li span { color: rgba(215, 244, 250, 0.66); font-size: 10px; line-height: 1.6; }
.help-storage-note {
  margin: 16px 0 0;
  padding: 10px 12px;
  border: 1px solid rgba(255, 212, 152, 0.24);
  background: rgba(38, 27, 13, 0.38);
  color: rgba(255, 225, 183, 0.76);
  font-size: 9px;
  line-height: 1.6;
}
.help-storage-note code { color: #ffd498; }
.help-dialog > footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 18px;
  border-top: 1px solid var(--line);
}
.help-dialog > footer button {
  width: 96px;
  min-width: 88px;
  min-height: 34px;
  border: 1px solid rgba(100, 232, 255, 0.48);
  background: rgba(100, 232, 255, 0.12);
  color: #dffaff;
  font: 11px/1.2 "Consolas", "Courier New", monospace;
  cursor: pointer;
}

.creation-guide-dialog {
  width: min(100%, 820px);
  max-height: min(90vh, 820px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}
.creation-guide-body { overflow-y: auto; }
.creation-guide-lead {
  margin: 0 0 16px;
  color: #e6fbff;
  font-size: 15px;
  line-height: 1.7;
}
.creation-guide-body .creation-steps { gap: 8px; }
.creation-guide-body .creation-steps li {
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(100, 232, 255, 0.2);
  background: rgba(2, 15, 20, 0.62);
}
.creation-guide-body .creation-steps li > b {
  width: 36px;
  height: 36px;
  font-size: 13px;
}
.creation-guide-body .creation-steps li strong { font-size: 15px; }
.creation-guide-body .creation-steps li p > span {
  color: rgba(224, 248, 252, 0.76);
  font-size: 15px;
  line-height: 1.6;
}
.creation-guide-body .creation-steps li small {
  color: rgba(192, 225, 231, 0.68);
  font-size: 13px;
  line-height: 1.5;
}
.creation-guide-body .creation-steps li code { color: #9cefff; }
.creation-guide-body .creation-steps li em {
  display: inline-block;
  margin-left: 7px;
  padding: 2px 6px;
  border: 1px solid rgba(255, 190, 98, 0.48);
  color: #ffd18d;
  font-size: 12px;
  font-style: normal;
}
.creation-guide-body .creation-steps li > button {
  align-self: center;
  min-height: 36px;
  padding: 7px 10px;
  border: 1px solid rgba(100, 232, 255, 0.48);
  background: rgba(100, 232, 255, 0.1);
  color: #dffaff;
  font-size: 15px;
  cursor: pointer;
}
.creation-guide-body .planned-step { border-color: rgba(255, 190, 98, 0.3); }
.creation-guide-warning {
  display: grid;
  gap: 5px;
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 190, 98, 0.4);
  background: rgba(48, 30, 10, 0.46);
}
.creation-guide-warning strong { color: #ffd18d; font-size: 15px; }
.creation-guide-warning span { color: rgba(255, 232, 197, 0.82); font-size: 15px; line-height: 1.6; }
.creation-guide-dialog > footer { align-items: center; justify-content: space-between; gap: 12px; }
.creation-guide-dialog > footer span { color: #ffd18d; font-size: 13px; }

.district-section { margin-top: 28px; }

.district-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.district-heading span,
.data-panel header span,
.area-hero span,
.architecture-note span,
.load-flow > span {
  color: var(--cyan);
  font-size: 9px;
  letter-spacing: 0.14em;
}

.district-heading h2 {
  margin: 2px 0 0;
  font-size: 20px;
}

.district-heading > strong {
  color: rgba(215, 244, 250, 0.58);
  font-size: 11px;
}

.district-description { margin-top: 8px; }
.area-list { display: grid; gap: 8px; margin-top: 16px; }

.area-card {
  display: grid;
  min-height: 78px;
  grid-template-columns: 42px minmax(0, 1fr) auto 18px;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border: 1px solid var(--line);
  background: linear-gradient(100deg, rgba(11, 41, 52, 0.94), rgba(5, 20, 27, 0.94));
  color: #dffaff;
  text-align: left;
  cursor: pointer;
  transition: border-color 150ms ease, transform 150ms ease, background 150ms ease;
}

.area-card:hover,
.area-card:focus-visible {
  border-color: var(--cyan);
  background: linear-gradient(100deg, rgba(14, 59, 73, 0.96), rgba(6, 30, 39, 0.96));
  outline: none;
  transform: translateX(3px);
}

.area-index {
  color: var(--cyan);
  font-size: 18px;
}

.area-card-main,
.area-card-meta {
  display: grid;
  gap: 3px;
}

.area-card-main strong { font-size: 16px; }
.area-card-main small { color: rgba(170, 225, 237, 0.58); font-size: 10px; }
.save-message {
  position: absolute;
  z-index: 30;
  right: 18px;
  bottom: 18px;
  max-width: calc(100% - 36px);
  margin: 0;
  padding: 10px 13px;
  border: 1px solid rgba(100, 232, 255, 0.55);
  background: rgba(5, 34, 42, 0.97);
  color: #c9f8ff;
  font-size: 10px;
  box-shadow: 0 0 18px rgba(41, 191, 222, 0.2);
}
.save-message.error { border-color: rgba(255, 113, 113, 0.62); color: #ffc4c4; }
.area-card-meta { text-align: right; }
.area-card-meta small { color: rgba(215, 244, 250, 0.65); font-size: 10px; }
.area-arrow { color: var(--cyan); font-size: 26px; }

.architecture-note {
  margin-top: 20px;
  padding: 15px 18px;
  border: 1px dashed var(--line);
  background: rgba(2, 11, 16, 0.7);
}

.architecture-note p {
  margin: 4px 0 0;
  color: rgba(215, 244, 250, 0.76);
  font-size: 11px;
}

.detail-tabs {
  position: relative;
  z-index: 2;
  display: grid;
  height: 66px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--line);
  background: rgba(3, 13, 18, 0.94);
}

.detail-tabs button {
  border: 0;
  border-right: 1px solid var(--line);
  background: transparent;
  color: rgba(215, 244, 250, 0.6);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.detail-tabs button span {
  display: block;
  color: rgba(100, 232, 255, 0.46);
  font-size: 9px;
}

.detail-tabs button.active {
  box-shadow: inset 0 -3px var(--cyan);
  background: var(--cyan-soft);
  color: #ecfdff;
}

.detail-scroll { height: calc(100% - 178px); }
.detail-section { display: grid; gap: 16px; }

.area-hero {
  display: flex;
  min-height: 94px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
  border: 1px solid var(--line);
  background: linear-gradient(105deg, rgba(12, 48, 60, 0.9), rgba(4, 17, 23, 0.9));
}

.area-hero div { display: grid; gap: 5px; }
.area-hero code { color: #dffaff; font-size: 14px; }
.area-hero > strong { color: var(--cyan); font-size: 32px; }
.area-hero > strong small { font-size: 12px; }

.setting-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.setting-card {
  display: grid;
  min-width: 0;
  gap: 7px;
  padding: 14px;
  border: 1px solid var(--line);
  background: rgba(5, 20, 27, 0.84);
}

.setting-card.wide { grid-column: 1 / -1; }
.setting-card span { color: rgba(169, 225, 237, 0.62); font-size: 10px; }
.setting-card strong { font-size: 14px; }
.setting-card code { overflow-wrap: anywhere; color: #9decfa; font-size: 12px; }
.setting-card p { margin: 0; color: rgba(223, 250, 255, 0.78); font-size: 12px; line-height: 1.6; }
.area-image-card img { width: 100%; height: clamp(150px, 25vh, 280px); object-fit: cover; border: 1px solid rgba(126, 218, 239, 0.22); background: #02090c; }

.data-panel {
  border: 1px solid var(--line);
  background: rgba(4, 17, 23, 0.88);
}

.data-panel > header {
  display: flex;
  min-height: 50px;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 15px;
  border-bottom: 1px solid var(--line);
}

.data-panel > header strong { font-size: 13px; }

.key-value-list { margin: 0; padding: 8px 15px; }

.key-value-list > div {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(126, 218, 239, 0.13);
}

.key-value-list > div:last-child { border-bottom: 0; }
.key-value-list dt { color: rgba(169, 225, 237, 0.62); font-size: 11px; }
.key-value-list dd { margin: 0; overflow-wrap: anywhere; color: #e4faff; font-size: 12px; text-align: right; }

.layer-list {
  display: grid;
  gap: 1px;
  margin: 0;
  padding: 8px 15px 14px;
  list-style: none;
}

.layer-list li {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  padding: 9px 0;
}

.layer-list li span { color: var(--cyan); font-size: 10px; }
.layer-list code { color: #dffaff; font-size: 12px; }

.connection-list,
.exit-list,
.flag-list {
  display: grid;
  gap: 9px;
  padding: 14px;
}

.connection-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px;
  border: 1px solid rgba(126, 218, 239, 0.18);
  background: rgba(9, 35, 44, 0.72);
}

.connection-card > div { display: grid; gap: 3px; }
.connection-card strong { font-size: 13px; }
.connection-card code { color: rgba(169, 225, 237, 0.64); font-size: 10px; }
.connection-card > span { color: var(--cyan); font-size: 11px; }

.exit-card {
  padding: 14px;
  border: 1px solid rgba(126, 218, 239, 0.2);
  border-left: 3px solid var(--cyan);
  background: rgba(8, 31, 40, 0.78);
}

.exit-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.exit-top strong { font-size: 14px; }
.exit-top code { color: rgba(169, 225, 237, 0.58); font-size: 10px; }

.connection-route {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  margin: 12px 0 8px;
}

.connection-route span {
  overflow-wrap: anywhere;
  color: #dffaff;
  font-size: 10px;
}

.connection-route b { color: var(--cyan); text-align: center; }
.exit-card p { margin: 4px 0 0; color: rgba(215, 244, 250, 0.68); font-size: 10px; }
.exit-card p code { color: #a8eef9; }

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px;
}

.chip-list span,
.chip-list code {
  padding: 7px 9px;
  border: 1px solid rgba(126, 218, 239, 0.25);
  background: rgba(100, 232, 255, 0.08);
  color: #c9f7ff;
  font-size: 10px;
}

.panel-note { padding: 14px 15px 0; }
.state-list > div { grid-template-columns: 170px minmax(0, 1fr); }

.flag-list > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  padding: 12px;
  border: 1px solid rgba(126, 218, 239, 0.18);
  background: rgba(9, 35, 44, 0.72);
}

.flag-list code { color: var(--cyan); font-size: 10px; }
.flag-list strong { grid-column: 1; font-size: 12px; }
.flag-list span { grid-row: 1 / 3; grid-column: 2; align-self: center; color: rgba(215, 244, 250, 0.58); font-size: 9px; }

.empty-state {
  margin: 0;
  padding: 20px 15px;
  color: rgba(215, 244, 250, 0.62);
  font-size: 12px;
}

.load-flow {
  padding: 17px;
  border: 1px solid rgba(255, 197, 106, 0.3);
  background: rgba(38, 27, 13, 0.5);
}

.load-flow > span { color: #ffd498; }
.load-flow ol { display: grid; gap: 0; margin: 12px 0 0; padding: 0; list-style: none; }

.load-flow li {
  position: relative;
  display: grid;
  min-height: 46px;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.load-flow li:not(:last-child)::before {
  position: absolute;
  top: 24px;
  bottom: 0;
  left: 13px;
  width: 1px;
  background: rgba(255, 197, 106, 0.3);
  content: "";
}

.load-flow b {
  position: relative;
  z-index: 1;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid rgba(255, 197, 106, 0.45);
  border-radius: 50%;
  background: #16130f;
  color: #ffd498;
  font-size: 9px;
}

.load-flow p {
  margin: 4px 0 0;
  color: rgba(242, 235, 218, 0.8);
  font-size: 11px;
  line-height: 1.5;
}

@media (max-width: 520px) {
  .console-header { padding-inline: 16px; }
  .header-actions { overflow-x: auto; }
  .creation-guide-body .creation-steps li { grid-template-columns: 38px minmax(0, 1fr); }
  .creation-guide-body .creation-steps li > button { grid-column: 2; justify-self: start; }
  .creation-guide-dialog > footer { align-items: flex-end; }
  .selection-screen,
  .detail-scroll { padding-inline: 16px; }
  .floor-tabs {
    grid-template-columns: repeat(6, 112px);
    overflow-x: auto;
    scroll-snap-type: x proximity;
  }
  .floor-tabs button {
    min-height: 74px;
    scroll-snap-align: start;
  }
}

@media (min-width: 1000px) {
  .console-header {
    height: 92px;
    padding: 15px 34px;
  }

  .console-header h1 { font-size: 28px; }

  .selection-screen {
    height: calc(100% - 92px);
    padding: 28px clamp(34px, 5vw, 80px) 44px;
  }

  .intro-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: 24px;
    align-items: center;
  }

  .intro-card .step-label { grid-row: 1 / 4; }
  .intro-card h2 { font-size: 25px; }
  .area-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .area-card { min-height: 88px; padding-inline: 18px; }

  .detail-tabs {
    height: 58px;
    padding-inline: clamp(34px, 5vw, 80px);
  }

  .detail-scroll {
    height: calc(100% - 150px);
    padding: 24px clamp(34px, 5vw, 80px) 38px;
  }

  .detail-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .detail-section > .area-hero,
  .detail-section > .setting-grid,
  .detail-section > .load-flow {
    grid-column: 1 / -1;
  }

  .setting-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .setting-card.wide { grid-column: span 2; }
}

/* Project typography rule: readable operational text takes priority over dense decoration. */
.area-console :is(button, input, select, textarea, label, p, li, strong) {
  font-size: var(--ui-font-size-body, 15px);
}
.area-console :is(code, small, .eyebrow, .step-label, .readonly-badge) {
  font-size: var(--ui-font-size-micro, 11px);
}
</style>
