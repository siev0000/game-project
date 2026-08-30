<template>
  <main class="character-workspace">
    <header class="workspace-header">
      <div>
        <p>LOCAL SOURCE / CHARACTER LIBRARY</p>
        <h1>{{ screen === 'list' ? 'キャラクター一覧' : selectedCharacter?.name || 'キャラクター編集' }}</h1>
      </div>
      <div class="header-actions">
        <span>{{ library.characters.length }} CHARACTERS</span>
        <button type="button" class="close-button" aria-label="ゲストメニューへ戻る" @click="leaveWorkspace">×</button>
      </div>
    </header>

    <template v-if="screen === 'list'">
      <section class="list-toolbar">
        <nav aria-label="キャラクター種別">
          <button v-for="filter in kindFilters" :key="filter.id" type="button" :class="{ active: kindFilter === filter.id }" @click="kindFilter = filter.id">
            {{ filter.label }} <small>{{ filter.count() }}</small>
          </button>
        </nav>
        <label class="search-box"><span>検索</span><input v-model.trim="searchText" placeholder="名前・ID"></label>
        <div class="create-actions">
          <button type="button" @click="addCharacter('player')">＋ プレイヤー</button>
          <button type="button" @click="addCharacter('npc')">＋ NPC</button>
        </div>
      </section>

      <section class="character-list">
        <header class="list-heading">
          <div><span>CHARACTER INDEX</span><h2>編集するキャラクターを選択</h2></div>
          <p>カードを押すと編集画面を開きます。</p>
        </header>
        <div class="character-grid">
          <button v-for="character in visibleCharacters" :key="character.id" type="button" class="character-card" @click="editCharacter(character.id)">
            <div class="card-preview">
              <div class="mini-character" :class="{ 'has-image': character.animations.idle.imageSource }" :style="characterThumbStyle(character)"><i></i><b></b></div>
              <span>{{ character.kind === 'player' ? 'PLAYER' : 'NPC' }}</span>
            </div>
            <div class="card-body"><strong>{{ character.name }}</strong><code>{{ character.id }}</code><small>{{ graphicCount(character) }} / {{ animationStates.length }} 状態に画像</small><small v-if="character.motionProjectId" class="card-motion">モーション: {{ character.motionProjectName || character.motionProjectId }}</small></div>
            <i class="card-arrow">編集 ›</i>
          </button>
          <p v-if="!visibleCharacters.length" class="empty-state">条件に一致するキャラクターがありません。</p>
        </div>
      </section>
    </template>

    <template v-else-if="selectedCharacter">
      <nav class="edit-toolbar" aria-label="編集カテゴリ">
        <button type="button" class="back-button" @click="returnToList">‹ 一覧へ戻る</button>
        <button type="button" :class="{ active: editorTab === 'basic' }" @click="editorTab = 'basic'">基本設定</button>
        <button type="button" :class="{ active: editorTab === 'graphics' }" @click="editorTab = 'graphics'">状態別グラフィック</button>
        <button type="button" :class="{ active: editorTab === 'portrait' }" @click="editorTab = 'portrait'">表情・顔画像</button>
        <button type="button" class="delete-button" :disabled="sameKindCharacters.length < 2" @click="removeCharacter(selectedCharacter)">削除</button>
      </nav>

      <section class="edit-workspace">
        <aside class="preview-panel">
          <header><span>PREVIEW</span><strong>{{ editorTab === 'portrait' ? `${activePortraitEmotion.label}の顔画像` : activeStateDefinition.label }}</strong></header>
          <div v-if="editorTab === 'portrait'" class="preview-stage portrait-stage">
            <div class="stage-grid"></div>
            <div class="portrait-crop-frame" :class="{ dragging: portraitDragging }" @pointerdown="startPortraitDrag" @pointermove="movePortraitDrag" @pointerup="endPortraitDrag" @pointercancel="endPortraitDrag" @wheel.prevent="zoomPortrait">
              <img v-if="portraitPreviewSource" :src="portraitPreviewSource" :alt="`${activePortraitEmotion.label}の顔画像`" :style="portraitPreviewStyle" draggable="false">
              <span v-else>FACE IMAGE<br>未設定</span>
              <small>実際の顔枠 128 × 140pxを2倍表示</small>
            </div>
            <p class="portrait-operation-hint">ドラッグ: 移動　ホイール: 拡大・縮小</p>
          </div>
          <div v-else class="preview-stage">
            <div class="stage-grid"></div>
            <div class="ground-line"></div>
            <BoneMotionPlayer v-if="boneMotionPreviewUrl" class="character-motion-player" :project-id="selectedMotionProject.id" :animation-id="activeStateMotionId" :width="Math.max(24, selectedCharacter.displayWidth * 2)" :height="Math.max(40, selectedCharacter.displayHeight * 2)" :title="`${activeStateDefinition.label}モーションプレビュー`" />
            <div v-else class="preview-character" :class="{ 'has-image': activeAnimation.imageSource }" :style="previewCharacterStyle"><i></i><b></b></div>
            <span v-if="boneMotionPreviewUrl" class="motion-preview-label">{{ activeStateMotionLabel }}</span>
          </div>
          <nav v-if="editorTab !== 'portrait'" class="state-selector" aria-label="プレビュー状態">
            <button v-for="state in animationStates" :key="state.id" type="button" :class="{ active: activeAnimationState === state.id, configured: selectedCharacter.animations[state.id].imageSource || selectedCharacter.motionStates[state.id] }" @click="activeAnimationState = state.id">
              <span>{{ state.short }}</span><strong>{{ state.label }}</strong>
            </button>
          </nav>
          <nav v-else class="emotion-selector" aria-label="表情画像">
            <button v-for="emotion in portraitEmotions" :key="emotion.id" type="button" :class="{ active: selectedPortraitEmotion === emotion.id, configured: selectedCharacter.portrait.images[emotion.id] }" @click="selectedPortraitEmotion = emotion.id">
              <span>{{ emotion.short }}</span><strong>{{ emotion.label }}</strong>
            </button>
          </nav>
          <dl class="preview-meta"><template v-if="editorTab === 'portrait'"><div><dt>表情</dt><dd>{{ activePortraitEmotion.label }}</dd></div><div><dt>設定済み</dt><dd>{{ portraitGraphicCount }} / {{ portraitEmotions.length }}</dd></div></template><template v-else><div><dt>表示</dt><dd>{{ selectedCharacter.displayWidth }} × {{ selectedCharacter.displayHeight }}</dd></div><div><dt>当たり判定</dt><dd>{{ selectedCharacter.hitboxWidth }} × {{ selectedCharacter.hitboxHeight }}</dd></div></template></dl>
        </aside>

        <section class="inspector-panel">
          <header><span>INSPECTOR</span><h2>{{ editorTab === 'basic' ? '基本設定' : editorTab === 'graphics' ? `${activeStateDefinition.label}グラフィック` : `${activePortraitEmotion.label}の顔画像` }}</h2></header>
          <div v-if="editorTab === 'basic'" class="inspector-scroll">
            <section class="setting-section identity-section"><h3>識別情報</h3><div class="identity-grid"><label>表示名<input v-model.trim="selectedCharacter.name"></label><label>キャラクターID<input v-model.trim="selectedCharacter.id" @change="normalizeId(selectedCharacter)"></label></div><p>IDはマップから呼び出すときに使用します。</p></section>
            <section class="setting-section compact-settings"><h3>サイズ・位置</h3><div class="metric-groups">
              <article><strong>表示サイズ</strong><label>幅<input v-model.number="selectedCharacter.displayWidth" type="number" min="8" max="400"></label><label>高さ<input v-model.number="selectedCharacter.displayHeight" type="number" min="8" max="400"></label></article>
              <article><strong>当たり判定</strong><label>幅<input v-model.number="selectedCharacter.hitboxWidth" type="number" min="4" max="400"></label><label>高さ<input v-model.number="selectedCharacter.hitboxHeight" type="number" min="4" max="400"></label></article>
              <article><strong>足元補正</strong><label>X<input v-model.number="selectedCharacter.footOffsetX" type="number"></label><label>Y<input v-model.number="selectedCharacter.footOffsetY" type="number"></label></article>
            </div></section>
             <section class="setting-section dialogue-profile-section"><h3>会話設定</h3><label>メッセージタイプ<select v-model="selectedCharacter.messageType"><option v-for="option in messageTypeOptions" :key="option.id" :value="option.id">{{ option.label }}</option></select></label><p>このキャラクターを会話イベントで選ぶと、ここで設定したメッセージタイプが自動で使用されます。</p></section>
             <section class="setting-section motion-project-section">
               <div class="setting-title-row"><h3>使用モーション</h3><button type="button" class="reload-motion-button" :disabled="motionsLoading" @click="loadMotionProjects">{{ motionsLoading ? '読込中…' : '一覧を再読込' }}</button></div>
               <label>保存済みモーション
                 <select :value="selectedCharacter.motionProjectId" :disabled="motionsLoading" @change="selectMotionProject">
                   <option value="">使用しない（状態別グラフィックを使用）</option>
                   <option v-if="missingMotionProject" :value="selectedCharacter.motionProjectId">参照先なし: {{ selectedCharacter.motionProjectName || selectedCharacter.motionProjectId }}</option>
                   <option v-for="motion in motionProjects" :key="motion.id" :value="motion.id">{{ motion.name }}</option>
                 </select>
               </label>
               <article v-if="selectedMotionProject" class="motion-project-summary">
                 <strong>{{ selectedMotionProject.name }}</strong>
                 <span>{{ motionRigLabel(selectedMotionProject) }} / {{ selectedMotionProject.animations.length }} モーション</span>
                 <small>{{ selectedMotionProject.animations.map(animation => `${animation.name || animation.id} ${animation.frameCount}コマ`).join('　') || '派生モーションなし' }}</small>
               </article>
               <p v-else-if="missingMotionProject" class="motion-load-error">保存済みの参照先が見つかりません。モーション名を変更した場合は同じ保存IDなら自動で追従します。削除した場合は選び直してください。</p>
               <p v-else-if="motionLoadError" class="motion-load-error">{{ motionLoadError }}</p>
               <p v-else>2Dボーン・モーション作成画面でソースJSONへ保存したデータを、このキャラクターへ割り当てます。</p>
             </section>
             <section class="setting-section direction-section"><h3>向き</h3><button type="button" class="toggle-button" :class="{ active: selectedCharacter.mirrorLeft }" @click="selectedCharacter.mirrorLeft = !selectedCharacter.mirrorLeft"><span>↔</span>左向きを左右反転で作る</button></section>
           </div>
          <div v-else-if="editorTab === 'graphics'" class="inspector-scroll">
            <section class="setting-section state-summary"><span>{{ activeStateDefinition.code }}</span><div><h3>{{ activeStateDefinition.label }}</h3><p>{{ activeStateDefinition.description }}</p></div></section>
            <section class="setting-section state-motion-section">
              <h3>この状態で使うモーション</h3>
              <label>{{ activeStateDefinition.label }}モーション
                <select v-model="activeStateMotionId" :disabled="!selectedMotionProject">
                  <option value="">モーションを使わない（下の画像を使用）</option>
                  <option v-if="activeStateMotionMissing" :value="activeStateMotionId">参照先なし: {{ activeStateMotionId }}</option>
                  <option value="__default__">デフォルト姿勢（静止）</option>
                  <option v-for="motion in selectedMotionProject?.animations || []" :key="motion.id" :value="motion.id">{{ motion.name || motion.id }}（{{ motion.frameCount }}コマ）</option>
                </select>
              </label>
              <div v-if="selectedMotionProject" class="state-motion-current"><strong>{{ selectedMotionProject.name }}</strong><span>{{ activeStateMotionLabel }}</span></div>
              <p v-else>先に「基本設定」の使用モーションで、モーションデータを選択してください。</p>
              <p v-if="activeStateMotionMissing" class="motion-load-error">この状態へ割り当てたモーションが、現在選択中のモーションデータ内にありません。選び直してください。</p>
            </section>
            <section class="setting-section"><h3>画像</h3>
              <div class="selected-asset">
                <img v-if="activeAnimation.imageSource" :src="activeAnimation.imageSource" alt="選択中の画像">
                <span v-else>未選択</span>
                <div><strong>{{ activeImageAsset?.name || activeImageName || '画像未選択' }}</strong><small>{{ activeImageAsset?.id || activeImagePath || '状態の仮キャラクターを表示します。' }}</small></div>
                <button type="button" @click="openAssetPicker">画像一覧から選ぶ</button>
                <button v-if="activeAnimation.imageSource" type="button" class="secondary-button" @click="clearActiveImage">解除</button>
              </div>
              <p>選べるのは <code>src/assets/images</code> 内の画像だけです。複数コマは横列数・縦行数で区切ります。</p>
            </section>
            <section class="setting-section"><div class="setting-title-row"><h3>アニメーション</h3><button type="button" class="reset-frame-order" @click="resetActiveFrameOrder">通常順に戻す</button></div><div class="animation-grid-fields"><label>横列数<input v-model.number="activeAnimation.columns" type="number" min="1" max="64" @input="syncActiveAnimationGrid"></label><label>縦行数<input v-model.number="activeAnimation.rows" type="number" min="1" max="64" @input="syncActiveAnimationGrid"></label><label>fps<input v-model.number="activeAnimation.fps" type="number" min="1" max="60"></label></div><div class="frame-order-field"><strong>再生順</strong><div class="frame-order-list" @dragover.prevent @drop.prevent="dropFrameOrder"><div v-for="(frameNumber, index) in activeAnimationFrameOrder" :key="`${frameNumber}-${index}`" class="frame-order-card" :class="{ dragging: draggedFrameIndex === index, 'drop-target': frameDropIndex === index }" draggable="true" :aria-label="`再生${index + 1}番目・画像${frameNumber}番`" @dragstart="startFrameOrderDrag($event, index)" @dragenter.prevent="frameDropIndex = index" @dragend="endFrameOrderDrag"><span class="frame-order-preview" :style="frameOrderPreviewStyle(frameNumber)"></span><b>{{ frameNumber }}</b><small>{{ index + 1 }}番目</small></div></div></div><p>カードをドラッグして順番を変更します。数字は画像内のコマ番号です。画像 {{ activeAnimationFrameCount }} 枚／再生 {{ activeAnimationSequenceLength }} コマ。</p></section>
            <section class="setting-section fallback-info"><h3>画像がない場合</h3><p>{{ activeStateDefinition.fallback }}</p></section>
          </div>
          <div v-else class="inspector-scroll">
            <section class="setting-section portrait-emotion-section">
              <h3>表情を選択</h3>
              <label>設定する表情
                <select v-model="selectedPortraitEmotion">
                  <option v-for="emotion in portraitEmotions" :key="emotion.id" :value="emotion.id">{{ emotion.label }}</option>
                </select>
              </label>
              <p>会話イベントで選んだ感情と同じ顔画像が表示されます。未設定の場合は「通常」の顔画像、基本設定側の通常画像（待機画像）の順で代用します。</p>
            </section>
            <section class="setting-section portrait-section">
              <h3>{{ activePortraitEmotion.label }}の画像</h3>
              <div class="selected-asset portrait-asset">
                <img v-if="activePortraitImageSource" :src="activePortraitImageSource" :alt="`${activePortraitEmotion.label}の顔画像`">
                <span v-else>未選択</span>
                <div><strong>{{ portraitImageAsset?.name || portraitImageName || '顔画像未選択' }}</strong><small>{{ portraitImageAsset?.id || portraitImagePath || `${activePortraitEmotion.label}用の画像を選択してください。` }}</small></div>
                <button type="button" @click="openAssetPicker('portrait')">画像一覧から選ぶ</button>
                <button v-if="activePortraitImageSource" type="button" class="secondary-button" @click="clearPortraitImage">解除</button>
              </div>
            </section>
            <section class="setting-section">
              <h3>顔画像の表示位置</h3>
              <div class="portrait-controls"><label>X位置<input v-model.number="selectedCharacter.portrait.offsetX" type="number" min="-240" max="240"></label><label>Y位置<input v-model.number="selectedCharacter.portrait.offsetY" type="number" min="-240" max="240"></label><label>拡大率<input v-model.number="selectedCharacter.portrait.scale" type="number" min="0.25" max="8" step="0.05"></label></div>
              <button type="button" class="secondary-button reset-portrait" @click="resetPortraitTransform">位置・拡大率を初期値へ戻す</button>
              <p>左の顔画像をドラッグして位置を変更し、ホイールで拡大・縮小できます。位置と拡大率は、このキャラクターのすべての表情に共通で適用します。</p>
            </section>
          </div>
        </section>
      </section>
    </template>

    <Teleport to="body">
      <div v-if="assetPickerOpen" class="asset-picker-overlay" @click.self="assetPickerOpen = false">
        <section class="asset-picker asset-picker-modal" role="dialog" aria-modal="true" :aria-label="assetPickerTitle">
          <header><button v-if="selectedAssetDirectory" type="button" class="secondary-button folder-back" @click="selectedAssetDirectory = ''">‹ フォルダ一覧</button><strong>{{ selectedAssetDirectory || assetPickerTitle }}</strong><button type="button" class="secondary-button" @click="assetPickerOpen = false">閉じる</button></header>
          <label class="asset-search">絞り込み<input v-model.trim="assetSearch" :placeholder="selectedAssetDirectory ? '画像名' : 'フォルダ名'"></label>
          <p v-if="assetsLoading">画像一覧を読み込み中です…</p>
          <p v-else-if="assetLoadError" class="asset-error">{{ assetLoadError }}</p>
          <div v-else-if="!selectedAssetDirectory" class="folder-grid" aria-label="画像フォルダ一覧">
            <button v-for="directory in visibleAssetDirectories" :key="directory.id" type="button" class="folder-card" @click="selectAssetDirectory(directory.id)"><span>▣</span><strong>{{ directory.label }}</strong><small>{{ directory.count }}枚</small></button>
            <p v-if="!visibleAssetDirectories.length" class="empty-assets">一致するフォルダがありません。</p>
          </div>
          <div v-else class="asset-grid" role="listbox" aria-label="画像一覧">
            <button v-for="asset in filteredImageAssets" :key="asset.id" type="button" class="asset-card" :class="{ selected: asset.source === selectedAssetSource }" @click="selectImageAsset(asset)">
              <img :src="asset.source" :alt="asset.name" loading="lazy"><strong>{{ asset.name }}</strong><small>{{ asset.directory }}</small>
            </button>
            <p v-if="!filteredImageAssets.length" class="empty-assets">一致する画像がありません。</p>
          </div>
        </section>
      </div>
    </Teleport>

    <footer class="workspace-footer">
      <p>保存先: <code>characterLibrary.json</code></p>
      <span :class="{ error: saveError }">{{ saveMessage }}</span>
      <button type="button" class="save-button" :disabled="!canSave" @click="saveLibrary">JSONへ保存</button>
    </footer>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import BoneMotionPlayer from '@/components/motion/BoneMotionPlayer.vue'
import sourceLibrary from '@/data/exploration/characterLibrary.json'
import dialogueMessageSettings from '../../data/dialogueMessageSettings.json'
import { normalizeSpriteSheetAnimation, spriteSheetFrameOrder, spriteSheetFrameStyle, spriteSheetGrid, spriteSheetSourceFrame } from '@/utils/spriteSheet.js'

const router = useRouter()
const clone = value => JSON.parse(JSON.stringify(value))
const library = reactive(clone(sourceLibrary))
const screen = ref('list')
const kindFilter = ref('all')
const searchText = ref('')
const selectedId = ref('')
const editorTab = ref('basic')
const activeAnimationState = ref('idle')
const selectedPortraitEmotion = ref('default')
const saveMessage = ref('')
const saveError = ref(false)
const imageAssets = ref([])
const motionProjects = ref([])
const motionsLoading = ref(false)
const motionLoadError = ref('')
const assetPickerOpen = ref(false)
const assetPickerTarget = ref('animation')
const assetSearch = ref('')
const selectedAssetDirectory = ref('')
const assetsLoading = ref(false)
const assetLoadError = ref('')
const previewSpriteFrame = ref(0)
const draggedFrameIndex = ref(null)
const frameDropIndex = ref(null)
const portraitDragging = ref(false)
const portraitDragStart = reactive({ pointerId: null, x: 0, y: 0, offsetX: 0, offsetY: 0 })
let previewFrameId = 0
let previewPreviousTime = 0
let previewSpriteClock = 0
let previewSpriteKey = ''
const animationStates = [
  { id: 'idle', short: '待', code: 'IDLE', label: '待機', description: '停止しているとき', fallback: '画像なしの仮キャラクターを表示します。' },
  { id: 'walk', short: '移', code: 'WALK', label: '移動', description: '左右へ移動しているとき', fallback: '待機画像を使用します。' },
  { id: 'jump', short: '跳', code: 'JUMP', label: 'ジャンプ', description: 'ジャンプ上昇・滞空中', fallback: '移動画像、次に待機画像を使用します。' },
  { id: 'fall', short: '落', code: 'FALL', label: '落下', description: '段差やジャンプから落下中', fallback: 'ジャンプ画像、次に待機画像を使用します。' },
  { id: 'talk', short: '話', code: 'TALK', label: '会話', description: '吹き出しで会話しているとき', fallback: '待機画像を使用します。' }
]
const portraitEmotions = [
  { id: 'default', short: '通', label: '通常' },
  { id: 'joy', short: '喜', label: '喜び' },
  { id: 'anger', short: '怒', label: '怒り' },
  { id: 'sorrow', short: '悲', label: '悲しみ' },
  { id: 'fun', short: '楽', label: '楽しい' },
  { id: 'surprise', short: '驚', label: '驚き' },
  { id: 'confusion', short: '困', label: '困惑' },
  { id: 'tense', short: '緊', label: '緊張' },
  { id: 'serious', short: '真', label: '真剣' }
]
const messageTypeOptions = Object.entries(dialogueMessageSettings.typeProfiles || {})
  .sort(([left], [right]) => Number(left) - Number(right))
  .map(([id, profile]) => ({ id, label: profile.label || `TYPE-${id}` }))
const selectedCharacter = computed(() => library.characters.find(character => character.id === selectedId.value) ?? null)
const selectedMotionProject = computed(() => motionProjects.value.find(project => project.id === selectedCharacter.value?.motionProjectId) ?? null)
const missingMotionProject = computed(() => Boolean(selectedCharacter.value?.motionProjectId && !motionsLoading.value && !selectedMotionProject.value))
const activeStateMotionId = computed({
  get: () => selectedCharacter.value?.motionStates?.[activeAnimationState.value] || '',
  set: value => { if (selectedCharacter.value?.motionStates) selectedCharacter.value.motionStates[activeAnimationState.value] = value }
})
const activeStateMotion = computed(() => selectedMotionProject.value?.animations.find(motion => motion.id === activeStateMotionId.value) ?? null)
const activeStateMotionMissing = computed(() => Boolean(activeStateMotionId.value && activeStateMotionId.value !== '__default__' && selectedMotionProject.value && !activeStateMotion.value))
const activeStateMotionLabel = computed(() => {
  if (!activeStateMotionId.value) return '状態別画像を使用'
  if (activeStateMotionId.value === '__default__') return 'デフォルト姿勢（静止）'
  return activeStateMotion.value?.name || `参照先なし: ${activeStateMotionId.value}`
})
const boneMotionPreviewUrl = computed(() => {
  if (!selectedMotionProject.value || !activeStateMotionId.value || activeStateMotionMissing.value) return ''
  const query = new URLSearchParams({ preview: '1', project: selectedMotionProject.value.id, animation: activeStateMotionId.value })
  return `/2d_bone_editor_split/?${query}`
})
const sameKindCharacters = computed(() => library.characters.filter(character => character.kind === selectedCharacter.value?.kind))
const visibleCharacters = computed(() => {
  const query = searchText.value.toLowerCase()
  return library.characters.filter(character => (kindFilter.value === 'all' || character.kind === kindFilter.value)
    && (!query || character.name.toLowerCase().includes(query) || character.id.toLowerCase().includes(query)))
})
const kindFilters = [
  { id: 'all', label: 'すべて', count: () => library.characters.length },
  { id: 'player', label: 'プレイヤー', count: () => library.characters.filter(character => character.kind === 'player').length },
  { id: 'npc', label: 'NPC', count: () => library.characters.filter(character => character.kind === 'npc').length }
]
const activeStateDefinition = computed(() => animationStates.find(state => state.id === activeAnimationState.value) ?? animationStates[0])
const activePortraitEmotion = computed(() => portraitEmotions.find(emotion => emotion.id === selectedPortraitEmotion.value) ?? portraitEmotions[0])
const activeAnimation = computed(() => selectedCharacter.value?.animations[activeAnimationState.value] ?? { imageSource: '', frames: 1, fps: 1 })
const activeAnimationFrameCount = computed(() => spriteSheetGrid(activeAnimation.value).frames)
const activeAnimationFrameOrder = computed(() => spriteSheetFrameOrder(activeAnimation.value))
const activeAnimationSequenceLength = computed(() => activeAnimationFrameOrder.value.length)
const activeImageAsset = computed(() => imageAssets.value.find(asset => asset.source === activeAnimation.value.imageSource) ?? null)
const activePortraitImageSource = computed({
  get: () => selectedCharacter.value?.portrait?.images?.[selectedPortraitEmotion.value] || '',
  set: value => { if (selectedCharacter.value?.portrait?.images) selectedCharacter.value.portrait.images[selectedPortraitEmotion.value] = value }
})
const portraitPreviewSource = computed(() => activePortraitImageSource.value
  || selectedCharacter.value?.portrait?.images?.default
  || selectedCharacter.value?.animations?.idle?.imageSource
  || '')
const portraitGraphicCount = computed(() => portraitEmotions.filter(emotion => selectedCharacter.value?.portrait?.images?.[emotion.id]).length)
const portraitImageAsset = computed(() => imageAssets.value.find(asset => asset.source === activePortraitImageSource.value) ?? null)
const activeImagePath = computed(() => {
  const source = activeAnimation.value.imageSource
  if (!source) return ''
  try { return new URL(source, window.location.origin).searchParams.get('path') || source } catch { return source }
})
const activeImageName = computed(() => activeImagePath.value.split('/').at(-1)?.replace(/\.[^.]+$/, '') || '')
const portraitImagePath = computed(() => {
  const source = activePortraitImageSource.value
  if (!source) return ''
  try { return new URL(source, window.location.origin).searchParams.get('path') || source } catch { return source }
})
const portraitImageName = computed(() => portraitImagePath.value.split('/').at(-1)?.replace(/\.[^.]+$/, '') || '')
const assetPickerTitle = computed(() => assetPickerTarget.value === 'portrait' ? `${activePortraitEmotion.value.label}の顔画像フォルダを選ぶ` : `${activeStateDefinition.value.label}画像のフォルダを選ぶ`)
const selectedAssetSource = computed(() => assetPickerTarget.value === 'portrait' ? activePortraitImageSource.value : activeAnimation.value.imageSource)
const assetDirectories = computed(() => {
  const counts = new Map()
  for (const asset of imageAssets.value) counts.set(asset.directory, (counts.get(asset.directory) || 0) + 1)
  return [...counts.entries()].map(([id, count]) => ({ id, label: id === 'images' ? '直下の画像' : id, count }))
    .sort((left, right) => left.label.localeCompare(right.label, 'ja'))
})
const visibleAssetDirectories = computed(() => {
  const query = assetSearch.value.toLowerCase()
  return assetDirectories.value.filter(directory => !query || directory.label.toLowerCase().includes(query))
})
const filteredImageAssets = computed(() => {
  const query = assetSearch.value.toLowerCase()
  return imageAssets.value.filter(asset => asset.directory === selectedAssetDirectory.value
    && (!query || `${asset.name} ${asset.id}`.toLowerCase().includes(query)))
})
const canSave = computed(() => library.characters.length > 0 && library.characters.every(character => character.id && character.name && messageTypeOptions.some(option => option.id === character.messageType) && animationStates.every(state => character.animations?.[state.id])))
const graphicCount = character => animationStates.filter(state => character.animations[state.id]?.imageSource).length
const imageStyle = (animation, frame = 0) => spriteSheetFrameStyle(animation, frame)
const characterThumbStyle = character => imageStyle(character.animations.idle)
const previewCharacterStyle = computed(() => ({ width: `${Math.max(24, selectedCharacter.value.displayWidth * 2)}px`, height: `${Math.max(40, selectedCharacter.value.displayHeight * 2)}px`, ...imageStyle(activeAnimation.value, previewSpriteFrame.value) }))
const portraitPreviewMultiplier = 2
const portraitPreviewStyle = computed(() => ({ transform: `translate(${(selectedCharacter.value?.portrait?.offsetX || 0) * portraitPreviewMultiplier}px, ${(selectedCharacter.value?.portrait?.offsetY || 0) * portraitPreviewMultiplier}px) scale(${selectedCharacter.value?.portrait?.scale || 1})` }))
const clampPortraitOffset = value => Math.max(-240, Math.min(240, Math.round(value)))
const clampPortraitScale = value => Math.max(.25, Math.min(8, Math.round(value * 20) / 20))
const startPortraitDrag = event => {
  if (!portraitPreviewSource.value || event.button !== 0) return
  portraitDragging.value = true
  portraitDragStart.pointerId = event.pointerId
  portraitDragStart.x = event.clientX
  portraitDragStart.y = event.clientY
  portraitDragStart.offsetX = Number(selectedCharacter.value.portrait.offsetX) || 0
  portraitDragStart.offsetY = Number(selectedCharacter.value.portrait.offsetY) || 0
  event.currentTarget.setPointerCapture(event.pointerId)
}
const movePortraitDrag = event => {
  if (!portraitDragging.value || event.pointerId !== portraitDragStart.pointerId) return
  selectedCharacter.value.portrait.offsetX = clampPortraitOffset(portraitDragStart.offsetX + (event.clientX - portraitDragStart.x) / portraitPreviewMultiplier)
  selectedCharacter.value.portrait.offsetY = clampPortraitOffset(portraitDragStart.offsetY + (event.clientY - portraitDragStart.y) / portraitPreviewMultiplier)
}
const endPortraitDrag = event => {
  if (!portraitDragging.value || event.pointerId !== portraitDragStart.pointerId) return
  portraitDragging.value = false
  portraitDragStart.pointerId = null
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
}
const zoomPortrait = event => {
  if (!portraitPreviewSource.value) return
  const direction = event.deltaY < 0 ? .1 : -.1
  selectedCharacter.value.portrait.scale = clampPortraitScale((Number(selectedCharacter.value.portrait.scale) || 1) + direction)
}
const resetPortraitTransform = () => {
  selectedCharacter.value.portrait.offsetX = 0
  selectedCharacter.value.portrait.offsetY = 150
  selectedCharacter.value.portrait.scale = 2
}
const normalizeCharacter = character => {
  character.id ||= `${character.kind}_${library.characters.length + 1}`; character.name ||= character.kind === 'player' ? '新しいプレイヤー' : '新しいNPC'; character.status ||= 'draft'
  character.messageType = messageTypeOptions.some(option => option.id === String(character.messageType)) ? String(character.messageType) : (messageTypeOptions.some(option => option.id === '1') ? '1' : messageTypeOptions[0]?.id || '0')
  for (const key of ['displayWidth', 'displayHeight', 'hitboxWidth', 'hitboxHeight']) character[key] = Math.max(1, Number(character[key]) || 1)
  character.footOffsetX = Number(character.footOffsetX) || 0; character.footOffsetY = Number(character.footOffsetY) || 0; character.mirrorLeft = character.mirrorLeft !== false; character.animations ||= {}
  character.motionProjectId = typeof character.motionProjectId === 'string' ? character.motionProjectId : ''
  character.motionProjectName = typeof character.motionProjectName === 'string' ? character.motionProjectName : ''
  character.motionStates = character.motionStates && typeof character.motionStates === 'object' ? character.motionStates : {}
  for (const state of animationStates) character.motionStates[state.id] = typeof character.motionStates[state.id] === 'string' ? character.motionStates[state.id] : ''
  for (const state of animationStates) { character.animations[state.id] ||= { imageSource: '', columns: 1, rows: 1, frames: 1, fps: 1 }; character.animations[state.id].imageSource ||= ''; normalizeSpriteSheetAnimation(character.animations[state.id]); character.animations[state.id].fps = Math.max(1, Number(character.animations[state.id].fps) || 1) }
  character.portrait ||= {}
  const legacyPortraitSource = typeof character.portrait.imageSource === 'string' ? character.portrait.imageSource : ''
  character.portrait.images = character.portrait.images && typeof character.portrait.images === 'object' ? character.portrait.images : {}
  for (const emotion of portraitEmotions) character.portrait.images[emotion.id] = typeof character.portrait.images[emotion.id] === 'string' ? character.portrait.images[emotion.id] : ''
  if (!character.portrait.images.default && legacyPortraitSource) character.portrait.images.default = legacyPortraitSource
  delete character.portrait.imageSource
  character.portrait.offsetX = Number.isFinite(character.portrait.offsetX) ? Math.max(-240, Math.min(240, character.portrait.offsetX)) : 0
  character.portrait.offsetY = Number.isFinite(character.portrait.offsetY) ? Math.max(-240, Math.min(240, character.portrait.offsetY)) : 150
  character.portrait.scale = Number.isFinite(character.portrait.scale) ? Math.max(.25, Math.min(8, character.portrait.scale)) : 2
  delete character.portrait.effect
}
for (const character of library.characters) normalizeCharacter(character)
const nextId = kind => { let index = library.characters.filter(character => character.kind === kind).length + 1; while (library.characters.some(character => character.id === `${kind}_${index}`)) index += 1; return `${kind}_${index}` }
const editCharacter = id => { selectedId.value = id; editorTab.value = 'basic'; activeAnimationState.value = 'idle'; selectedPortraitEmotion.value = 'default'; screen.value = 'edit' }
const addCharacter = kind => { const character = { id: nextId(kind), kind, name: kind === 'player' ? '新しいプレイヤー' : '新しいNPC', status: 'draft', displayWidth: 42, displayHeight: 66, hitboxWidth: 26, hitboxHeight: 58, footOffsetX: 0, footOffsetY: 0, mirrorLeft: true, animations: {} }; normalizeCharacter(character); library.characters.push(character); editCharacter(character.id) }
const syncActiveAnimationGrid = () => normalizeSpriteSheetAnimation(activeAnimation.value)
const resetActiveFrameOrder = () => { activeAnimation.value.frameOrder = Array.from({ length: activeAnimationFrameCount.value }, (_, index) => index + 1) }
const frameOrderPreviewStyle = frameNumber => spriteSheetFrameStyle({ ...activeAnimation.value, frameOrder: [frameNumber] }, 0)
const startFrameOrderDrag = (event, index) => {
  draggedFrameIndex.value = index
  frameDropIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(index))
}
const dropFrameOrder = () => {
  const from = draggedFrameIndex.value
  const to = frameDropIndex.value
  if (from != null && to != null && from !== to) {
    const order = [...activeAnimationFrameOrder.value]
    const [moved] = order.splice(from, 1)
    order.splice(to, 0, moved)
    activeAnimation.value.frameOrder = order
  }
  endFrameOrderDrag()
}
const endFrameOrderDrag = () => { draggedFrameIndex.value = null; frameDropIndex.value = null }
const returnToList = () => { screen.value = 'list'; selectedId.value = '' }
const normalizeId = character => { const base = character.id.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || nextId(character.kind); let id = base; let suffix = 2; while (library.characters.some(item => item !== character && item.id === id)) id = `${base}_${suffix++}`; character.id = id; selectedId.value = id }
const removeCharacter = character => { if (!character || sameKindCharacters.value.length < 2) return; library.characters.splice(library.characters.indexOf(character), 1); returnToList() }
const openAssetPicker = async (target = 'animation') => {
  assetPickerTarget.value = target
  assetPickerOpen.value = true
  assetSearch.value = ''
  selectedAssetDirectory.value = ''
  if (imageAssets.value.length || assetsLoading.value) return
  assetsLoading.value = true
  assetLoadError.value = ''
  try {
    const response = await fetch('/api/local/image-assets')
    const payload = await response.json()
    if (!response.ok || !Array.isArray(payload.assets)) throw new Error(payload.error || '画像一覧の読み込みに失敗しました')
    imageAssets.value = payload.assets
  } catch (error) {
    assetLoadError.value = error.message || '画像一覧の読み込みに失敗しました'
  } finally {
    assetsLoading.value = false
  }
}
const selectAssetDirectory = directory => { selectedAssetDirectory.value = directory; assetSearch.value = '' }
const selectImageAsset = asset => { if (assetPickerTarget.value === 'portrait') activePortraitImageSource.value = asset.source; else activeAnimation.value.imageSource = asset.source; assetPickerOpen.value = false }
const clearActiveImage = () => { activeAnimation.value.imageSource = '' }
const clearPortraitImage = () => { activePortraitImageSource.value = '' }
const motionRigLabel = project => {
  const rig = project.rigType === 'pixel_simple' ? 'ドット2D' : '通常2D'
  const pose = project.poseType === 'front' ? '正面' : project.poseType === 'side' ? '横向き' : ''
  return [rig, pose].filter(Boolean).join('・')
}
const loadMotionProjects = async () => {
  motionsLoading.value = true
  motionLoadError.value = ''
  try {
    const response = await fetch('/api/local/bone-motion-projects?summary=1', { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok || !Array.isArray(payload.projects)) throw new Error(payload.error || 'モーション一覧を読み込めませんでした')
    motionProjects.value = payload.projects
    for (const character of library.characters) {
      const project = motionProjects.value.find(item => item.id === character.motionProjectId)
      if (project) character.motionProjectName = project.name
    }
  } catch (error) {
    motionLoadError.value = error.message || 'モーション一覧を読み込めませんでした'
  } finally {
    motionsLoading.value = false
  }
}
const selectMotionProject = event => {
  const id = event.target.value
  const project = motionProjects.value.find(item => item.id === id)
  selectedCharacter.value.motionProjectId = id
  selectedCharacter.value.motionProjectName = project?.name || ''
}
const leaveWorkspace = () => router.push('/guest')
const saveLibrary = async () => { saveMessage.value = '保存しています…'; saveError.value = false; try { const response = await fetch('/api/local/character-library', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ library }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || '保存に失敗しました'); library.characters.splice(0, library.characters.length, ...clone(payload.characters)); saveMessage.value = 'characterLibrary.jsonへ保存しました' } catch (error) { saveError.value = true; saveMessage.value = error.message || '保存に失敗しました' } }
const renderCharacterLibraryState = () => JSON.stringify({ screen: `character-${screen.value}`, filter: kindFilter.value, visibleCharacterIds: visibleCharacters.value.map(character => character.id), selectedCharacterId: selectedCharacter.value?.id ?? null, editorTab: screen.value === 'edit' ? editorTab.value : null, motionProject: selectedCharacter.value ? { id: selectedCharacter.value.motionProjectId, name: selectedCharacter.value.motionProjectName, available: Boolean(selectedMotionProject.value), states: selectedCharacter.value.motionStates } : null, animationState: screen.value === 'edit' ? activeAnimationState.value : null, activeStateMotion: activeStateMotionLabel.value, animationGrid: screen.value === 'edit' ? spriteSheetGrid(activeAnimation.value) : null, frameOrder: screen.value === 'edit' ? activeAnimationFrameOrder.value : null, portraitEmotion: screen.value === 'edit' && editorTab.value === 'portrait' ? selectedPortraitEmotion.value : null, previewFrame: screen.value === 'edit' ? previewSpriteFrame.value : 0, sourceFrame: screen.value === 'edit' ? spriteSheetSourceFrame(activeAnimation.value, previewSpriteFrame.value) + 1 : 0 })
const updatePreviewSprite = seconds => {
  const animation = activeAnimation.value
  const frameOrder = spriteSheetFrameOrder(animation)
  const frames = frameOrder.length
  const fps = Math.max(1, Number(animation.fps) || 1)
  const nextKey = `${activeAnimationState.value}:${animation.imageSource}:${frameOrder.join(',')}:${fps}`
  if (nextKey !== previewSpriteKey) {
    previewSpriteKey = nextKey
    previewSpriteClock = 0
    previewSpriteFrame.value = 0
  }
  if (frames === 1) return
  previewSpriteClock += seconds
  const nextFrame = Math.floor(previewSpriteClock * fps) % frames
  if (nextFrame !== previewSpriteFrame.value) previewSpriteFrame.value = nextFrame
}
const previewFrame = time => {
  if (!previewPreviousTime) previewPreviousTime = time
  const seconds = Math.min((time - previewPreviousTime) / 1000, .05)
  previewPreviousTime = time
  updatePreviewSprite(seconds)
  previewFrameId = window.requestAnimationFrame(previewFrame)
}
if (typeof window !== 'undefined') { window.render_game_to_text = renderCharacterLibraryState; window.advanceTime = milliseconds => updatePreviewSprite(Math.max(0, Number(milliseconds) || 0) / 1000) }
onMounted(() => { previewFrameId = window.requestAnimationFrame(previewFrame); loadMotionProjects() })
onBeforeUnmount(() => { window.cancelAnimationFrame(previewFrameId); if (window.render_game_to_text === renderCharacterLibraryState) delete window.render_game_to_text; delete window.advanceTime })
</script>

<style scoped>
.character-workspace{--cyan:#64e8ff;--line:rgba(100,232,255,.25);display:grid;width:100%;height:100%;min-height:0;grid-template-rows:74px minmax(0,1fr) 58px;background:#050d12;color:#dffaff;font:15px Consolas,"Courier New",monospace}.workspace-header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:12px 22px;border-bottom:1px solid var(--line);background:#09202a}.workspace-header p,.list-heading span,.preview-panel>header span,.inspector-panel>header span{margin:0;color:var(--cyan);font-size:11px;letter-spacing:.13em}.workspace-header h1{margin:3px 0 0;font-size:22px}.header-actions{display:flex;align-items:center;gap:14px}.header-actions>span{color:var(--cyan);font-size:11px}.close-button{width:40px;height:40px;border:1px solid var(--line);background:rgba(100,232,255,.08);color:var(--cyan);font-size:21px;cursor:pointer}.list-toolbar,.edit-toolbar{display:flex;min-height:62px;box-sizing:border-box;align-items:center;gap:12px;padding:10px 22px;border-bottom:1px solid var(--line);background:#06151b}.list-toolbar nav{display:flex;gap:7px}.list-toolbar button,.edit-toolbar button{min-height:38px;padding:0 14px;border:1px solid var(--line);background:transparent;color:#cfeff5;font:inherit;cursor:pointer}.list-toolbar nav button.active,.edit-toolbar button.active{border-color:var(--cyan);background:rgba(100,232,255,.14);color:var(--cyan)}.list-toolbar small{margin-left:5px;color:rgba(180,232,242,.65);font-size:11px}.search-box{display:flex;align-items:center;gap:8px;margin-left:auto;color:rgba(220,248,255,.7)}.search-box input{width:200px;min-height:38px;box-sizing:border-box;padding:7px 10px;border:1px solid var(--line);background:#050e13;color:inherit;font:inherit}.create-actions{display:flex;gap:7px}.create-actions button{border-color:rgba(100,232,255,.55);background:rgba(100,232,255,.1);color:var(--cyan)}.character-list{min-height:0;overflow:auto;padding:22px clamp(22px,4vw,60px) 80px;background:radial-gradient(circle at 85% 0,rgba(25,112,138,.16),transparent 36%),#050d12}.list-heading{display:flex;align-items:end;justify-content:space-between;gap:20px}.list-heading h2{margin:4px 0 0;font-size:22px}.list-heading p{margin:0;color:rgba(220,248,255,.65)}.character-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}.character-card{display:grid;min-width:0;min-height:126px;grid-template-columns:90px minmax(0,1fr) auto;align-items:center;gap:15px;padding:12px;border:1px solid var(--line);background:linear-gradient(115deg,rgba(8,36,46,.92),rgba(4,17,23,.92));color:inherit;text-align:left;cursor:pointer}.character-card:hover,.character-card:focus-visible{border-color:var(--cyan);outline:0;background:linear-gradient(115deg,rgba(12,55,67,.97),rgba(5,24,31,.97))}.card-preview{position:relative;display:grid;width:90px;height:100px;place-items:center;border:1px solid rgba(100,232,255,.2);overflow:hidden;background:linear-gradient(180deg,#0d3440,#07161c)}.card-preview>span{position:absolute;right:5px;bottom:4px;color:var(--cyan);font-size:11px}.mini-character{position:relative;width:34px;height:58px}.mini-character i,.preview-character i{position:absolute;top:0;left:50%;width:55%;aspect-ratio:1;border:2px solid var(--cyan);border-radius:50%;transform:translateX(-50%)}.mini-character b,.preview-character b{position:absolute;right:10%;bottom:0;left:10%;height:64%;border:2px solid var(--cyan);border-radius:9px 9px 4px 4px;background:rgba(100,232,255,.13)}.has-image>i,.has-image>b{display:none}.card-body{display:grid;min-width:0;gap:5px}.card-body strong{overflow:hidden;font-size:18px;text-overflow:ellipsis;white-space:nowrap}.card-body code{overflow:hidden;color:#9cdae5;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.card-body small{color:rgba(220,248,255,.62);font-size:11px}.card-arrow{color:var(--cyan);font-style:normal;white-space:nowrap}.empty-state{grid-column:1/-1;padding:30px;border:1px dashed var(--line);color:rgba(220,248,255,.62);text-align:center}.character-workspace:has(.edit-workspace){grid-template-rows:74px 54px minmax(0,1fr) 58px}.edit-toolbar{min-height:54px;padding-block:7px}.edit-toolbar .back-button{margin-right:auto}.edit-toolbar .delete-button{margin-left:auto;border-color:rgba(255,121,114,.45);color:#ffaaa2}.edit-toolbar .delete-button:disabled{opacity:.35;cursor:default}.edit-workspace{display:grid;min-height:0;grid-template-columns:minmax(420px,46%) minmax(360px,54%);overflow:hidden}.preview-panel,.inspector-panel{display:grid;min-height:0;background:#061218}.preview-panel{grid-template-rows:46px minmax(220px,1fr) auto auto;border-right:1px solid var(--line)}.preview-panel>header,.inspector-panel>header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 16px;border-bottom:1px solid var(--line);background:#09212a}.preview-panel>header strong{font-size:15px}.preview-stage{position:relative;display:grid;min-height:220px;place-items:end center;overflow:hidden;padding-bottom:42px;background:linear-gradient(180deg,rgba(17,60,72,.55),rgba(4,14,19,.95))}.stage-grid{position:absolute;inset:0;opacity:.14;background-image:linear-gradient(rgba(100,232,255,.42) 1px,transparent 1px),linear-gradient(90deg,rgba(100,232,255,.42) 1px,transparent 1px);background-size:32px 32px}.ground-line{position:absolute;right:8%;bottom:38px;left:8%;height:2px;background:var(--cyan);box-shadow:0 0 10px rgba(100,232,255,.5)}.preview-character{position:relative;z-index:1;max-width:220px;max-height:260px;image-rendering:pixelated}.state-selector{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:10px;border-top:1px solid var(--line)}.state-selector button{display:grid;min-width:0;min-height:54px;place-content:center;gap:2px;border:1px solid var(--line);background:#07171e;color:rgba(220,248,255,.66);font:inherit;cursor:pointer}.state-selector button span{font-size:11px}.state-selector button strong{font-size:13px}.state-selector button.configured{box-shadow:inset 0 -2px #8cffbb}.state-selector button.active{border-color:var(--cyan);background:rgba(100,232,255,.14);color:var(--cyan)}.preview-meta{display:grid;grid-template-columns:1fr 1fr;margin:0;padding:10px 14px;border-top:1px solid var(--line)}.preview-meta div{display:flex;justify-content:space-between;gap:10px;padding-right:18px}.preview-meta dt{color:rgba(220,248,255,.58)}.preview-meta dd{margin:0;color:var(--cyan)}.inspector-panel{grid-template-rows:58px minmax(0,1fr)}.inspector-panel>header{display:block;padding:10px 16px}.inspector-panel>header h2{margin:3px 0 0;font-size:18px}.inspector-scroll{overflow:auto;padding:14px 16px 70px}.setting-section{display:grid;gap:10px;padding:14px 0;border-bottom:1px solid var(--line)}.setting-section:first-child{padding-top:0}.setting-section h3{margin:0;color:var(--cyan);font-size:16px}.setting-section label{display:grid;gap:5px;color:rgba(220,248,255,.74)}.setting-section input{min-height:38px;box-sizing:border-box;padding:7px 9px;border:1px solid rgba(100,232,255,.3);background:#050d12;color:inherit;font:inherit}.setting-section p{margin:0;color:rgba(220,248,255,.58);font-size:13px;line-height:1.6}.field-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}.toggle-button{display:flex;min-height:42px;align-items:center;gap:10px;padding:0 12px;border:1px solid var(--line);background:#07171e;color:rgba(220,248,255,.7);font:inherit;cursor:pointer}.toggle-button span{color:var(--cyan);font-size:19px}.toggle-button.active{border-color:var(--cyan);background:rgba(100,232,255,.13);color:#eaffff}.state-summary{grid-template-columns:54px minmax(0,1fr);align-items:center}.state-summary>span{display:grid;width:52px;height:52px;place-items:center;border:1px solid var(--cyan);color:var(--cyan);font-size:11px}.state-summary p{margin-top:4px}.fallback-info{border:1px dashed var(--line);padding:12px;margin-top:14px}.workspace-footer{display:flex;align-items:center;gap:14px;padding:8px 22px;border-top:1px solid var(--line);background:#071820}.workspace-footer p,.workspace-footer span{margin:0;font-size:12px}.workspace-footer p{color:rgba(220,248,255,.62)}.workspace-footer code{color:#dffaff}.workspace-footer span{color:#8fffc0}.workspace-footer span.error{color:#ffaaa0}.save-button{min-width:150px;min-height:40px;margin-left:auto;border:1px solid var(--cyan);background:rgba(100,232,255,.14);color:var(--cyan);font:700 15px inherit;cursor:pointer}.save-button:disabled{opacity:.4;cursor:default}@media(max-width:900px){.list-toolbar{align-items:stretch;flex-wrap:wrap}.search-box{order:3;width:100%;margin-left:0}.search-box input{flex:1}.character-grid{grid-template-columns:1fr}.edit-workspace{grid-template-columns:1fr;overflow:auto}.preview-panel{min-height:520px;border-right:0;border-bottom:1px solid var(--line)}.inspector-panel{min-height:600px}.character-workspace:has(.edit-workspace){overflow:auto}.workspace-footer{position:sticky;bottom:0}.create-actions{margin-left:auto}}@media(max-width:560px){.workspace-header,.list-toolbar,.edit-toolbar,.workspace-footer{padding-inline:12px}.header-actions>span{display:none}.list-toolbar nav{width:100%}.list-toolbar nav button{flex:1;padding-inline:6px}.create-actions{width:100%}.create-actions button{flex:1}.character-list{padding-inline:12px}.character-card{grid-template-columns:72px minmax(0,1fr)}.card-preview{width:72px}.card-arrow{display:none}.edit-toolbar button:not(.back-button):not(.delete-button){font-size:13px;padding-inline:8px}.field-pair{grid-template-columns:1fr}.workspace-footer p{display:none}.save-button{width:100%;margin-left:0}}
.character-workspace{grid-template-rows:74px auto minmax(0,1fr) 58px}
.edit-workspace{grid-template-columns:minmax(330px,34%) minmax(540px,66%)}
.inspector-scroll{padding:12px 16px 70px}
.setting-section{gap:9px;padding:12px 0}
.setting-section h3{font-size:15px}
.setting-section input{min-height:36px;padding:6px 8px}
.animation-grid-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.setting-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.setting-title-row h3{margin:0;white-space:nowrap}.reset-frame-order{flex:0 0 auto!important;width:auto!important;min-width:130px;min-height:34px;padding:5px 10px;border:1px solid var(--line);background:transparent;color:#cfeff5;font:inherit;cursor:pointer}.reset-frame-order:hover{border-color:var(--cyan);color:var(--cyan)}
.frame-order-field{display:grid;gap:7px}.frame-order-field>strong{color:rgba(220,248,255,.74);font-weight:400}.frame-order-list{display:flex;min-height:84px;align-items:start;gap:7px;overflow-x:auto;padding:7px;border:1px solid rgba(100,232,255,.25);background:#040c11;scrollbar-color:#36c4dd #06141b;scrollbar-width:thin}.frame-order-card{position:relative;display:grid;flex:0 0 64px;height:72px;box-sizing:border-box;grid-template-columns:1fr auto;grid-template-rows:44px 18px;align-items:center;gap:2px 4px;padding:4px;border:1px solid rgba(100,232,255,.34);background:#08202a;cursor:grab;user-select:none}.frame-order-card::before{position:absolute;top:50%;left:-7px;color:rgba(100,232,255,.5);content:'›';transform:translateY(-50%)}.frame-order-card:first-child::before{display:none}.frame-order-card.dragging{opacity:.35;cursor:grabbing}.frame-order-card.drop-target{border-color:#ffe27a;box-shadow:0 0 0 1px #ffe27a}.frame-order-preview{grid-column:1/-1;width:100%;height:44px;background-color:#0a2731;image-rendering:pixelated}.frame-order-card b{color:var(--cyan);font-size:15px}.frame-order-card small{justify-self:end;color:#a9cbd2;font-size:11px}
.identity-grid{display:grid;grid-template-columns:minmax(180px,.8fr) minmax(260px,1.2fr);gap:10px}
.selected-asset{display:grid;grid-template-columns:64px minmax(0,1fr) auto auto;align-items:center;gap:9px;min-height:64px;padding:8px;border:1px solid var(--line);background:#07171e}.selected-asset>img,.selected-asset>span{display:grid;width:62px;height:62px;max-width:100%;box-sizing:border-box;place-items:center;object-fit:contain;overflow:hidden;border:1px solid rgba(100,232,255,.2);background:#0a2731;color:rgba(220,248,255,.6);font-size:12px}.selected-asset>div{display:grid;min-width:0;gap:4px}.selected-asset strong,.selected-asset small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.selected-asset small{color:rgba(220,248,255,.58);font-size:12px}.selected-asset button,.asset-picker button{min-height:36px;padding:6px 10px;border:1px solid var(--cyan);background:rgba(100,232,255,.12);color:var(--cyan);font:inherit;cursor:pointer}.selected-asset .secondary-button,.asset-picker .secondary-button{border-color:var(--line);background:transparent;color:#cfeff5}.asset-picker{display:grid;min-width:0;gap:9px;padding:10px;border:1px solid var(--line);overflow:hidden;background:#061218}.asset-picker header{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px}.asset-picker header strong{overflow:hidden;font-size:15px;text-align:center;text-overflow:ellipsis;white-space:nowrap}.asset-picker header strong:first-child{grid-column:1/3;text-align:left}.folder-back{white-space:nowrap}.asset-search{grid-template-columns:auto minmax(0,1fr);align-items:center}.folder-grid,.asset-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;max-height:300px;overflow:auto;padding-right:4px}.folder-card{display:grid;min-width:0;min-height:92px;place-content:center;gap:5px;overflow:hidden;text-align:center}.folder-card>span{color:#ffe58b;font-size:25px}.folder-card strong,.folder-card small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.folder-card small{color:rgba(220,248,255,.62);font-size:13px}.asset-card{display:grid;min-width:0;grid-template-rows:82px auto auto;gap:4px;padding:6px!important;overflow:hidden;border-color:var(--line)!important;background:#07171e!important;text-align:left}.asset-card:hover,.asset-card.selected{border-color:var(--cyan)!important;background:rgba(100,232,255,.14)!important}.asset-card img{display:block;width:100%;height:82px;max-width:100%;min-width:0;box-sizing:border-box;object-fit:contain;overflow:hidden;background:#0b2530}.asset-card strong,.asset-card small{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.asset-card strong{font-size:13px}.asset-card small{color:rgba(220,248,255,.57);font-size:11px}.asset-error{color:#ffaaa2!important}.empty-assets{grid-column:1/-1;padding:14px!important;border:1px dashed var(--line);text-align:center}
.portrait-section{gap:10px}.portrait-setting-preview{position:relative;display:grid;height:220px;place-items:center;overflow:hidden;border:1px solid var(--line);background:radial-gradient(circle at 50% 24%,rgba(46,145,172,.36),transparent 44%),#06131d}.portrait-setting-preview img{position:relative;z-index:1;max-width:100%;height:100%;object-fit:contain;transform-origin:center bottom;image-rendering:pixelated}.portrait-setting-preview>span{color:rgba(220,248,255,.58);font-size:13px;line-height:1.5;text-align:center}.portrait-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.portrait-controls label{display:grid;gap:5px;color:rgba(220,248,255,.74)}.portrait-controls input{min-height:38px;box-sizing:border-box;padding:7px 9px;border:1px solid rgba(100,232,255,.3);background:#050d12;color:inherit;font:inherit}
.portrait-stage{align-content:center;place-items:center;gap:12px;padding:22px;user-select:none}.portrait-crop-frame{position:relative;z-index:1;width:256px;height:280px;max-width:calc(100% - 16px);overflow:hidden;border:2px solid rgba(100,232,255,.72);background:linear-gradient(180deg,rgba(45,121,146,.28),rgba(4,13,22,.92));box-shadow:0 0 22px rgba(58,204,232,.2);cursor:grab;touch-action:none}.portrait-crop-frame.dragging{cursor:grabbing}.portrait-crop-frame img{position:absolute;z-index:1;inset:0;width:100%;height:100%;pointer-events:none;object-fit:contain;object-position:center bottom;transform-origin:center bottom;image-rendering:pixelated}.portrait-crop-frame>span{display:grid;height:100%;place-items:center;color:rgba(220,248,255,.58);font-size:15px;line-height:1.6;text-align:center}.portrait-crop-frame small{position:absolute;z-index:2;right:5px;bottom:5px;padding:3px 5px;background:rgba(3,13,18,.78);color:#9fcbd3;font-size:11px}.portrait-operation-hint{position:relative;z-index:2;margin:0;padding:5px 8px;border:1px solid rgba(100,232,255,.28);background:rgba(3,13,18,.82);color:#b8dce3;font-size:13px}.emotion-selector{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:10px;border-top:1px solid var(--line)}.emotion-selector button{display:grid;min-width:0;min-height:48px;grid-template-columns:auto 1fr;place-items:center;gap:7px;padding:5px 7px;border:1px solid var(--line);background:#07171e;color:rgba(220,248,255,.72);font:inherit;cursor:pointer}.emotion-selector button span{display:grid;width:25px;height:25px;place-items:center;border:1px solid rgba(100,232,255,.38);color:var(--cyan);font-size:13px}.emotion-selector button strong{justify-self:start;font-size:15px}.emotion-selector button.configured{box-shadow:inset 0 -2px #8cffbb}.emotion-selector button.active{border-color:var(--cyan);background:rgba(100,232,255,.14);color:var(--cyan)}.portrait-emotion-section select,.dialogue-profile-section select{width:100%;min-height:38px;box-sizing:border-box;padding:7px 9px;border:1px solid rgba(100,232,255,.3);background:#050d12;color:inherit;font:inherit}.dialogue-profile-section label{max-width:420px}.reset-portrait{justify-self:start;min-height:38px;padding:7px 12px;border:1px solid var(--line);background:transparent;color:#cfeff5;font:inherit;cursor:pointer}
.card-motion{color:#8fffc0!important}.motion-project-section select{width:100%;min-height:40px;box-sizing:border-box;padding:7px 9px;border:1px solid rgba(100,232,255,.4);background:#050d12;color:inherit;font:inherit}.reload-motion-button{min-height:36px;padding:6px 12px;border:1px solid var(--line);background:transparent;color:#cfeff5;font:inherit;cursor:pointer}.reload-motion-button:hover{border-color:var(--cyan);color:var(--cyan)}.reload-motion-button:disabled{opacity:.5;cursor:default}.motion-project-summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 14px;padding:11px 12px;border:1px solid rgba(100,232,255,.3);background:#071b23}.motion-project-summary strong{color:#eaffff;font-size:15px}.motion-project-summary span{color:#8fffc0;white-space:nowrap}.motion-project-summary small{grid-column:1/-1;overflow:hidden;color:#a9cbd2;font-size:13px;line-height:1.5;text-overflow:ellipsis}.motion-load-error{color:#ffb2aa!important}
.state-motion-section select{width:100%;min-height:40px;box-sizing:border-box;padding:7px 9px;border:1px solid rgba(100,232,255,.4);background:#050d12;color:inherit;font:inherit}.state-motion-section select:disabled{opacity:.48}.state-motion-current{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 11px;border:1px solid rgba(100,232,255,.24);background:#071b23}.state-motion-current strong{overflow:hidden;color:#eaffff;text-overflow:ellipsis;white-space:nowrap}.state-motion-current span{color:#8fffc0;text-align:right}
.character-motion-player{position:relative;z-index:2;align-self:end;margin-bottom:38px}.motion-preview-label{position:absolute;z-index:3;right:10px;bottom:10px;padding:5px 8px;border:1px solid rgba(100,232,255,.38);background:rgba(3,13,18,.82);color:#8fffc0;font-size:13px}.preview-stage:has(.character-motion-player)>.ground-line{display:none}
.asset-picker-overlay{position:fixed;z-index:10020;inset:0;display:grid;place-items:center;padding:16px;box-sizing:border-box;background:rgba(0,7,11,.86)}.asset-picker-modal{width:min(1040px,calc(100vw - 32px));height:min(720px,calc(100vh - 32px));grid-template-rows:auto auto minmax(0,1fr);box-sizing:border-box;padding:14px;border-color:rgba(100,232,255,.65);box-shadow:0 20px 70px rgba(0,0,0,.72),0 0 28px rgba(68,204,232,.18);color:#dffaff;font:15px Consolas,"Courier New",monospace}.asset-picker-modal input{min-height:38px;box-sizing:border-box;padding:7px 10px;border:1px solid rgba(100,232,255,.4);background:#041117;color:#e9fcff;font:inherit}.asset-picker-modal .folder-grid,.asset-picker-modal .asset-grid{max-height:none;min-height:0;align-content:start}.asset-picker-modal .asset-card{grid-template-rows:minmax(110px,1fr) auto auto;max-height:180px}.asset-picker-modal .asset-card img{height:100%;max-height:126px}.asset-picker-modal .folder-card{min-height:120px}.asset-picker-modal>p{margin:0;color:#b8dce3}
@media(max-width:1100px){.selected-asset{grid-template-columns:64px minmax(0,1fr)}.selected-asset button{grid-column:1/-1}.folder-grid,.asset-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:560px){.selected-asset{grid-template-columns:56px minmax(0,1fr)}.selected-asset>img,.selected-asset>span{width:54px;height:54px}.selected-asset button{grid-column:1/-1}.folder-grid,.asset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.metric-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.metric-groups article{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:end;gap:6px;padding:10px;border:1px solid rgba(100,232,255,.18);background:rgba(7,28,36,.72)}
.metric-groups article>strong{grid-column:1/-1;color:#dffaff;font-size:14px}
.metric-groups article label{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:6px}
.metric-groups article input{min-width:0}
.direction-section{grid-template-columns:auto minmax(240px,420px);align-items:center}
.toggle-button{min-height:38px}
@media(max-width:1100px) and (min-width:901px){.metric-groups{grid-template-columns:1fr}}
@media(max-width:560px){.identity-grid,.metric-groups,.animation-grid-fields{grid-template-columns:1fr}.direction-section{grid-template-columns:1fr}}
</style>
