<template>
  <main class="dialogue-workspace" :class="`screen-${screen}`">
    <header class="workspace-header">
      <div>
        <p>LOCAL SOURCE / DIALOGUE EVENTS</p>
        <h1>{{ screen === 'list' ? '会話イベント一覧' : selectedEvent?.name || '会話イベント編集' }}</h1>
      </div>
      <div class="header-actions">
        <span>{{ library.events.length }} EVENTS</span>
        <button type="button" class="close-button" aria-label="ゲストメニューへ戻る" @click="leaveWorkspace">×</button>
      </div>
    </header>

    <template v-if="screen === 'list'">
      <section class="list-toolbar">
        <div><span>EVENT LIBRARY</span><strong>編集する会話イベントを選択</strong></div>
        <label class="search-box"><span>検索</span><input v-model.trim="searchText" placeholder="イベント名・ID"></label>
        <button type="button" class="create-event" @click="addEvent">＋ 会話イベントを追加</button>
      </section>

      <section class="event-index">
        <header class="list-heading">
          <div><span>DIALOGUE EVENT INDEX</span><h2>会話イベント</h2></div>
          <p>カードを押すと内容設定画面を開きます。</p>
        </header>
        <div class="event-grid">
          <button v-for="event in visibleEvents" :key="event.id" type="button" class="event-card" @click="openEvent(event.id)">
            <span class="status-badge" :class="event.status">{{ statusLabel(event.status) }}</span>
            <div class="event-card-copy">
              <strong>{{ event.name || '名称未設定' }}</strong>
              <code>{{ event.id }}</code>
              <p>{{ event.memo || 'イベントメモは未設定です。' }}</p>
            </div>
            <dl>
              <div><dt>発言</dt><dd>{{ event.entries.length }}</dd></div>
              <div><dt>話者</dt><dd>{{ eventSpeakerCount(event) }}</dd></div>
            </dl>
            <span class="edit-arrow">内容を編集 ›</span>
          </button>
          <p v-if="!visibleEvents.length" class="empty-state">条件に一致する会話イベントがありません。</p>
        </div>
      </section>
    </template>

    <template v-else-if="selectedEvent">
      <section class="edit-toolbar">
        <button type="button" class="back-button" @click="returnToList">‹ イベント一覧へ</button>
        <label class="event-name"><span>イベント名</span><input v-model.trim="selectedEvent.name"></label>
        <label class="event-id"><span>イベントID</span><input v-model.trim="selectedEvent.id" @change="normalizeEventId"></label>
        <label class="event-status"><span>状態</span><select v-model="selectedEvent.status"><option value="draft">下書き</option><option value="review">確認中</option><option value="confirmed">確定</option></select></label>
      </section>

      <section class="edit-body">
        <section class="sequence-panel">
          <header>
            <div><span>PLAY ORDER</span><h2>発言の再生順</h2></div>
            <div class="sequence-actions">
              <button type="button" class="play-button" :disabled="!selectedEvent.entries.length" @click="playEvent">▶ 全体を再生</button>
              <button type="button" class="add-line" @click="addEntry">＋ 発言を追加</button>
            </div>
          </header>
          <p class="sequence-help">上から順に会話ウィンドウへ表示されます。カードをドラッグして順番を変更できます。</p>
          <div class="sequence-list">
            <article
              v-for="(entry, index) in selectedEvent.entries"
              :key="entry.id"
              class="sequence-card"
              :class="{ active: entry.id === selectedEntryId, dragging: entry.id === draggedEntryId, 'drop-target': entry.id === dragTargetEntryId && entry.id !== draggedEntryId }"
              draggable="true"
              title="ドラッグして再生順を変更"
              @click="selectedEntryId = entry.id"
              @dragstart="startEntryDrag($event, entry.id)"
              @dragenter.prevent="setEntryDragTarget(entry.id)"
              @dragover.prevent
              @drop.prevent="dropEntry(entry.id)"
              @dragend="endEntryDrag"
            >
              <button type="button" class="card-main" @click="selectedEntryId = entry.id">
                <span class="order-number">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="card-copy"><strong>{{ entry.speakerName || characterName(entry.speakerId) || '話者未設定' }}</strong><small>{{ entry.message || '本文未入力' }}</small></span>
                <span class="type-badge">{{ typeLabel(entry.type) }}<small>{{ emotionLabel(entry.emotion) }}</small></span>
              </button>
              <div class="order-actions">
                <button type="button" :disabled="index === 0" title="一つ前へ" @click.stop="moveEntry(index, -1)">↑</button>
                <button type="button" :disabled="index === selectedEvent.entries.length - 1" title="一つ後へ" @click.stop="moveEntry(index, 1)">↓</button>
              </div>
            </article>
            <div v-if="!selectedEvent.entries.length" class="empty-sequence">
              <strong>発言がありません</strong>
              <p>「＋ 発言を追加」で最初の会話を作成します。</p>
            </div>
          </div>
        </section>

        <aside class="inspector-panel">
          <template v-if="selectedEntry">
            <header><div><span>MESSAGE INSPECTOR</span><h2>選択中の発言を設定</h2></div></header>
            <div class="inspector-scroll">
              <section class="speaker-section">
                <h3>話者</h3>
                <label>キャラクター<select v-model="selectedEntry.speakerId" @change="applySpeakerName"><option v-for="character in speakerOptions" :key="character.id" :value="character.id">{{ character.name }}</option></select></label>
                <label>ウィンドウ表示名<input v-model.trim="selectedEntry.speakerName" placeholder="表示する話者名"></label>
              </section>
              <section class="appearance-section">
                <h3>表情・顔エフェクト</h3>
                <div class="live-face-preview">
                  <div class="live-face-frame" :class="[`effect-${selectedEntry.portraitEffect}`, { 'face-disabled': selectedEntry.displayMode !== 'portrait' }]">
                    <img v-if="selectedEntryPortrait.source" :src="selectedEntryPortrait.source" :alt="`${emotionLabel(selectedEntry.emotion)}の顔`" :style="selectedEntryPortrait.style">
                    <span v-else>FACE<br>未設定</span>
                  </div>
                  <small>{{ selectedEntry.displayMode === 'portrait' ? selectedEntryPortrait.description : '顔なし・設定確認中' }}</small>
                </div>
                <div class="appearance-controls">
                  <label>表情<select v-model="selectedEntry.emotion"><option v-for="option in emotionOptions" :key="option.id" :value="option.id">{{ option.label }}</option></select></label>
                  <div class="character-message-type"><span>メッセージタイプ</span><strong>{{ typeLabel(selectedEntry.type) }}</strong><small>キャラクター設定を使用</small></div>
                  <div class="field-pair">
                    <label>顔表示<select v-model="selectedEntry.displayMode"><option value="plain">顔なし</option><option value="portrait">顔あり</option></select></label>
                    <label>顔エフェクト<select v-model="selectedEntry.portraitEffect"><option value="none">なし</option><option value="noise">ノイズ</option><option value="monitor">モニター表示</option></select></label>
                  </div>
                </div>
                <p class="profile-note">選択中の表情とエフェクトを常に表示します。メッセージタイプはキャラクター設定から自動取得します。</p>
              </section>
              <section class="message-section">
                <h3>本文</h3>
                <textarea v-model="selectedEntry.message" rows="6" placeholder="表示する会話を入力"></textarea>
                <small>{{ selectedEntry.message.length }}文字</small>
              </section>
              <button type="button" class="preview-line" :disabled="!selectedEntry.message.trim()" @click="playSelectedEntry">▶ この発言を確認</button>
              <section class="message-danger">
                <h3>発言操作</h3>
                <p>現在選択している発言だけを削除します。</p>
                <button type="button" class="remove-line" @click="removeEntry">この発言を削除</button>
              </section>
              <section class="event-danger">
                <h3>イベント操作</h3>
                <p>イベント全体を削除します。発言もすべて削除されます。</p>
                <button type="button" class="delete-event" @click="removeEvent">イベント全体を削除</button>
              </section>
            </div>
          </template>
          <div v-else class="no-selection"><strong>発言を選択してください</strong><p>左側の発言を選ぶと、内容設定がここに表示されます。</p></div>
        </aside>
      </section>
    </template>

    <footer class="workspace-footer">
      <label v-if="screen === 'edit' && selectedEvent" class="event-memo"><span>イベントメモ</span><input v-model.trim="selectedEvent.memo" placeholder="発生条件や用途など"></label>
      <p>保存先: <code>dialogueEvents.json</code></p>
      <span :class="{ error: saveError || !canSave }">{{ saveMessage || validationMessage }}</span>
      <button type="button" class="save-button" :disabled="!canSave" @click="saveLibrary">JSONへ保存</button>
    </footer>

    <section v-if="previewOpen && previewEntry" class="preview-overlay" aria-label="会話イベントプレビュー">
      <div class="preview-stage">
        <header>
          <div><span>GAME PREVIEW / 1280 × 720</span><strong>{{ selectedEvent?.name }}</strong></div>
          <p>{{ previewIndex + 1 }} / {{ selectedEvent?.entries.length }}</p>
          <button type="button" @click="stopPreview">■ 停止</button>
        </header>
        <div class="preview-screen">
          <p class="preview-hint">クリックで文字送り・次ページ・次の発言へ進めます。</p>
          <DialogueMessageModal
            :key="previewKey"
            embedded
            :show-test-controls="false"
            :name="previewEntry.speakerName || characterName(previewEntry.speakerId)"
            :message="previewEntry.message"
            :type="previewEntry.type"
            :emotion="previewEntry.emotion"
            :show-portrait="previewEntry.displayMode === 'portrait'"
            :portrait-source="previewPortrait.source"
            :portrait-style="previewPortrait.style"
            :portrait-effect="previewEntry.portraitEffect"
            :message-speed="previewPlayback.messageSpeed"
            :voice-pitch="previewPlayback.voicePitch"
            :voice-volume="previewPlayback.voiceVolume / 100"
            :message-id="previewKey"
            :wait-input="true"
            :profile-settings="dialogueMessageSettings"
            @close="advancePreview"
          />
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import DialogueMessageModal from '@/components/modals/robot/DialogueMessageModal.vue'
import sourceLibrary from '@/data/exploration/dialogueEvents.json'
import sourceCharacterLibrary from '@/data/exploration/characterLibrary.json'
import dialogueMessageSettings from '../../data/dialogueMessageSettings.json'

const clone = value => JSON.parse(JSON.stringify(value))
const router = useRouter()
const library = reactive(clone(sourceLibrary))
// キャラクター側で保存した顔画像・表情を、会話編集画面を開いたままでも読み直せるようにする。
// 静的 import だけでは別画面で保存した内容がこの画面のメモリに残ってしまうため、API の最新値を優先する。
const characterLibrary = reactive(clone(sourceCharacterLibrary))
const screen = ref('list')
const selectedEventId = ref(library.events[0]?.id || '')
const selectedEntryId = ref(library.events[0]?.entries[0]?.id || '')
const searchText = ref('')
const saveMessage = ref('')
const saveError = ref(false)
const previewOpen = ref(false)
const previewIndex = ref(0)
const previewSingle = ref(false)
const previewSeed = ref(0)
const draggedEntryId = ref('')
const dragTargetEntryId = ref('')
let previewAdvanceTimer = null

for (const event of library.events) {
  for (const entry of event.entries || []) {
    entry.displayMode = entry.displayMode === 'portrait' ? 'portrait' : 'plain'
    entry.portraitEffect = ['none', 'noise', 'monitor'].includes(entry.portraitEffect) ? entry.portraitEffect : 'none'
  }
}

const emotionOptions = [
  { id: 'default', label: '通常' },
  { id: 'joy', label: '喜び' },
  { id: 'anger', label: '怒り' },
  { id: 'sorrow', label: '悲しみ' },
  { id: 'fun', label: '楽しい' },
  { id: 'surprise', label: '驚き' },
  { id: 'confusion', label: '困惑' },
  { id: 'tense', label: '緊張' },
  { id: 'serious', label: '真剣' }
]
const statusLabels = { draft: '下書き', review: '確認中', confirmed: '確定' }
const speakerOptions = computed(() => characterLibrary.characters || [])
const typeOptions = computed(() => Object.entries(dialogueMessageSettings.typeProfiles || {})
  .sort(([left], [right]) => Number(left) - Number(right))
  .map(([id, profile]) => ({ id, label: profile.label || `TYPE-${id}` })))
const selectedEvent = computed(() => library.events.find(event => event.id === selectedEventId.value) || null)
const selectedEntry = computed(() => selectedEvent.value?.entries.find(entry => entry.id === selectedEntryId.value) || null)
const visibleEvents = computed(() => {
  const query = searchText.value.toLocaleLowerCase('ja')
  if (!query) return library.events
  return library.events.filter(event => `${event.name} ${event.id}`.toLocaleLowerCase('ja').includes(query))
})
const allIdsUnique = computed(() => {
  const eventIds = library.events.map(event => event.id)
  if (new Set(eventIds).size !== eventIds.length) return false
  return library.events.every(event => {
    const entryIds = event.entries.map(entry => entry.id)
    return new Set(entryIds).size === entryIds.length
  })
})
const canSave = computed(() => library.events.length > 0
  && allIdsUnique.value
  && library.events.every(event => event.id.trim() && event.name.trim()
    && event.entries.every(entry => entry.id.trim() && entry.message.trim())))
const validationMessage = computed(() => {
  if (!library.events.length) return '会話イベントを1件以上作成してください'
  if (!allIdsUnique.value) return 'イベントIDまたは発言IDが重複しています'
  if (library.events.some(event => !event.id.trim() || !event.name.trim())) return 'イベント名とIDを入力してください'
  if (library.events.some(event => event.entries.some(entry => !entry.id.trim()))) return '発言データのIDが不正です'
  if (library.events.some(event => event.entries.some(entry => !entry.message.trim()))) return '本文を入力してください'
  return ''
})
const previewEntry = computed(() => selectedEvent.value?.entries[previewIndex.value] || null)
const previewProfile = computed(() => {
  const entry = previewEntry.value
  const profile = dialogueMessageSettings.typeProfiles?.[String(entry?.type)]
  if (!profile) return {}
  return { ...(profile.default || {}), ...(profile.emotions?.[entry?.emotion] || {}) }
})
const previewPlayback = computed(() => ({
  messageSpeed: Number(previewProfile.value.messageSpeed) || 0,
  voicePitch: Number(previewProfile.value.voicePitch) || 1,
  voiceVolume: Number(previewProfile.value.voiceVolume) || 0
}))
const previewKey = computed(() => `${selectedEventId.value}:${previewEntry.value?.id}:${previewSeed.value}`)

const slug = value => String(value || '').trim().toLowerCase()
  .replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
const uniqueId = (prefix, existing) => {
  let index = existing.length + 1
  let candidate = `${prefix}_${String(index).padStart(3, '0')}`
  while (existing.includes(candidate)) {
    index += 1
    candidate = `${prefix}_${String(index).padStart(3, '0')}`
  }
  return candidate
}
const characterName = id => speakerOptions.value.find(character => character.id === id)?.name || ''
const characterMessageType = id => {
  const type = String(speakerOptions.value.find(character => character.id === id)?.messageType || '')
  return typeOptions.value.some(option => option.id === type) ? type : (typeOptions.value.some(option => option.id === '1') ? '1' : typeOptions.value[0]?.id || '0')
}
for (const event of library.events) {
  for (const entry of event.entries || []) {
    if (entry.speakerId) entry.type = characterMessageType(entry.speakerId)
  }
}
const syncEntryMessageTypes = () => {
  for (const event of library.events) {
    for (const entry of event.entries || []) {
      if (entry.speakerId) entry.type = characterMessageType(entry.speakerId)
    }
  }
}
syncEntryMessageTypes()
const speakerPortrait = (id, emotion = 'default') => {
  const character = speakerOptions.value.find(candidate => candidate.id === id)
  const portrait = character?.portrait || {}
  const images = portrait.images || {}
  const expressionSource = images[emotion]
  const defaultSource = images.default || portrait.imageSource
  const idleSource = character?.animations?.idle?.imageSource
  const source = expressionSource || defaultSource || idleSource || ''
  return {
    source,
    description: expressionSource
      ? `${emotionLabel(emotion)}の顔画像を使用`
      : defaultSource
        ? `${emotionLabel(emotion)}は未設定：通常の顔画像を使用`
        : idleSource
          ? `${emotionLabel(emotion)}は未設定：待機画像を代用`
          : `${emotionLabel(emotion)}の顔画像が未設定`,
    style: { transform: `translate(${Number.isFinite(portrait.offsetX) ? portrait.offsetX : 0}px, ${Number.isFinite(portrait.offsetY) ? portrait.offsetY : 150}px) scale(${Number.isFinite(portrait.scale) ? portrait.scale : 2})` }
  }
}
const selectedEntryPortrait = computed(() => speakerPortrait(selectedEntry.value?.speakerId, selectedEntry.value?.emotion))
const previewPortrait = computed(() => speakerPortrait(previewEntry.value?.speakerId, previewEntry.value?.emotion))
const typeLabel = id => typeOptions.value.find(option => option.id === String(id))?.label || `TYPE-${id}`
const emotionLabel = id => emotionOptions.find(option => option.id === id)?.label || id
const statusLabel = id => statusLabels[id] || '未設定'
const eventSpeakerCount = event => new Set(event.entries.map(entry => entry.speakerId || entry.speakerName).filter(Boolean)).size
const openEvent = id => {
  selectedEventId.value = id
  selectedEntryId.value = selectedEvent.value?.entries[0]?.id || ''
  screen.value = 'edit'
  stopPreview()
}
const refreshCharacterLibrary = async () => {
  try {
    const response = await fetch('/api/local/character-library', { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok || !Array.isArray(payload.characters)) return
    characterLibrary.characters.splice(0, characterLibrary.characters.length, ...clone(payload.characters))
    syncEntryMessageTypes()
  } catch {
    // 本番ビルドなどローカル保存 API がない場合は、import した初期データで動作を継続する。
  }
}
const returnToList = () => {
  screen.value = 'list'
  stopPreview()
}
const addEvent = () => {
  const id = uniqueId('dialogue_event', library.events.map(event => event.id))
  library.events.push({ id, name: '新しい会話イベント', status: 'draft', memo: '', entries: [] })
  selectedEventId.value = id
  selectedEntryId.value = ''
  screen.value = 'edit'
}
const removeEvent = () => {
  if (!selectedEvent.value || !window.confirm(`「${selectedEvent.value.name || '名称未設定'}」を削除しますか？`)) return
  const index = library.events.findIndex(event => event.id === selectedEventId.value)
  if (index < 0) return
  library.events.splice(index, 1)
  const next = library.events[Math.min(index, library.events.length - 1)]
  selectedEventId.value = next?.id || ''
  selectedEntryId.value = next?.entries[0]?.id || ''
  screen.value = 'list'
  stopPreview()
}
const addEntry = () => {
  if (!selectedEvent.value) return
  const id = uniqueId('line', selectedEvent.value.entries.map(entry => entry.id))
  const firstSpeaker = speakerOptions.value[0]
  selectedEvent.value.entries.push({
    id,
    speakerId: firstSpeaker?.id || '',
    speakerName: firstSpeaker?.name || '',
    type: characterMessageType(firstSpeaker?.id),
    emotion: 'default',
    displayMode: 'plain',
    portraitEffect: 'none',
    message: ''
  })
  selectedEntryId.value = id
}
const removeEntry = () => {
  if (!selectedEvent.value || !selectedEntry.value) return
  if (!window.confirm(`「${selectedEntry.value.speakerName || '名称未設定'}」の発言を削除しますか？`)) return
  const index = selectedEvent.value.entries.findIndex(entry => entry.id === selectedEntryId.value)
  selectedEvent.value.entries.splice(index, 1)
  selectedEntryId.value = selectedEvent.value.entries[Math.min(index, selectedEvent.value.entries.length - 1)]?.id || ''
}
const moveEntry = (index, direction) => {
  const target = index + direction
  if (!selectedEvent.value || target < 0 || target >= selectedEvent.value.entries.length) return
  const [entry] = selectedEvent.value.entries.splice(index, 1)
  selectedEvent.value.entries.splice(target, 0, entry)
}
const startEntryDrag = (event, entryId) => {
  draggedEntryId.value = entryId
  dragTargetEntryId.value = ''
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', entryId)
}
const setEntryDragTarget = entryId => {
  if (draggedEntryId.value && entryId !== draggedEntryId.value) dragTargetEntryId.value = entryId
}
const dropEntry = targetId => {
  const sourceId = draggedEntryId.value
  if (!selectedEvent.value || !sourceId || sourceId === targetId) return
  const sourceIndex = selectedEvent.value.entries.findIndex(entry => entry.id === sourceId)
  if (sourceIndex < 0 || !selectedEvent.value.entries.some(entry => entry.id === targetId)) return
  const [entry] = selectedEvent.value.entries.splice(sourceIndex, 1)
  const targetIndex = selectedEvent.value.entries.findIndex(candidate => candidate.id === targetId)
  selectedEvent.value.entries.splice(targetIndex, 0, entry)
  selectedEntryId.value = sourceId
  endEntryDrag()
}
const endEntryDrag = () => {
  draggedEntryId.value = ''
  dragTargetEntryId.value = ''
}
const applySpeakerName = () => {
  if (!selectedEntry.value?.speakerId) return
  selectedEntry.value.speakerName = characterName(selectedEntry.value.speakerId)
  selectedEntry.value.type = characterMessageType(selectedEntry.value.speakerId)
}
const normalizeEventId = () => {
  if (!selectedEvent.value) return
  const before = selectedEventId.value
  const next = slug(selectedEvent.value.id) || before
  selectedEvent.value.id = next
  selectedEventId.value = next
}
const startPreview = async (index, single) => {
  if (!selectedEvent.value?.entries[index]?.message.trim()) return
  // 再生ボタンを押した時点でも最新のキャラクター設定を取得する。
  // 表情タブで保存後、会話画面を開き直さなくても同じ表情が使われる。
  await refreshCharacterLibrary()
  clearTimeout(previewAdvanceTimer)
  previewIndex.value = index
  previewSingle.value = single
  previewSeed.value += 1
  previewOpen.value = true
}
const playEvent = () => startPreview(0, false)
const playSelectedEntry = () => {
  const index = selectedEvent.value?.entries.findIndex(entry => entry.id === selectedEntryId.value) ?? -1
  if (index >= 0) startPreview(index, true)
}
const advancePreview = () => {
  clearTimeout(previewAdvanceTimer)
  if (previewSingle.value || previewIndex.value >= (selectedEvent.value?.entries.length || 0) - 1) {
    stopPreview()
    return
  }
  previewIndex.value += 1
  previewSeed.value += 1
}
const stopPreview = () => {
  clearTimeout(previewAdvanceTimer)
  previewOpen.value = false
}
const leaveWorkspace = () => router.push('/guest')
const saveLibrary = async () => {
  if (!canSave.value) return
  saveMessage.value = '保存しています…'
  saveError.value = false
  try {
    const response = await fetch('/api/local/dialogue-events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ library: clone(library) })
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || '保存に失敗しました')
    library.events.splice(0, library.events.length, ...clone(payload.events))
    saveMessage.value = 'dialogueEvents.jsonへ保存しました'
  } catch (error) {
    saveError.value = true
    saveMessage.value = error.message || '保存に失敗しました'
  }
}

onMounted(() => {
  refreshCharacterLibrary()
  window.render_game_to_text = () => JSON.stringify({
    mode: previewOpen.value ? 'dialogue-preview' : `dialogue-${screen.value}`,
    selectedEventId: selectedEventId.value,
    selectedEntryId: selectedEntryId.value,
    eventCount: library.events.length,
    entryCount: selectedEvent.value?.entries.length || 0,
    selectedMessageType: selectedEntry.value?.type || null,
    selectedEmotion: selectedEntry.value?.emotion || null,
    selectedPortraitEffect: selectedEntry.value?.portraitEffect || null,
    selectedFaceSource: selectedEntryPortrait.value?.source || null,
    previewIndex: previewOpen.value ? previewIndex.value : null,
    previewSpeaker: previewOpen.value ? previewEntry.value?.speakerName : null,
    previewMessage: previewOpen.value ? previewEntry.value?.message : null,
    previewEmotion: previewOpen.value ? previewEntry.value?.emotion : null,
    previewFaceSource: previewOpen.value ? previewPortrait.value?.source : null,
    previewPortraitEffect: previewOpen.value ? previewEntry.value?.portraitEffect : null
  })
})
onBeforeUnmount(() => {
  clearTimeout(previewAdvanceTimer)
  if (window.render_game_to_text) delete window.render_game_to_text
})
</script>

<style scoped>
.dialogue-workspace{--cyan:#64e8ff;--line:rgba(100,232,255,.27);display:grid;width:100vw;height:100vh;grid-template-rows:74px 76px minmax(0,1fr) 58px;overflow:hidden;color:#dffbff;background:#030c11;font:15px Consolas,'Yu Gothic UI',monospace}.dialogue-workspace.screen-list{grid-template-rows:74px 64px minmax(0,1fr) 58px}
button,input,select,textarea{box-sizing:border-box;font:inherit;font-size:15px}button{width:auto;min-height:38px;border:1px solid rgba(100,232,255,.44);color:#dffbff;background:#09242f;cursor:pointer}button:hover:not(:disabled),button.active{border-color:var(--cyan);background:#103744}button:disabled{opacity:.38;cursor:default}input,select,textarea{width:100%;min-height:38px;padding:7px 10px;border:1px solid rgba(100,232,255,.36);color:#f2fdff;background:#031117}textarea{resize:vertical;line-height:1.65}label{display:grid;gap:5px;color:#c7eef5}label>span{color:#75ddec;font-size:13px}
.workspace-header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 24px;border-bottom:1px solid var(--line);background:#08212c}.workspace-header p,.list-toolbar>div span,.list-heading span,.sequence-panel header span,.inspector-panel header span,.preview-stage header span{margin:0;color:var(--cyan);font-size:12px;letter-spacing:.13em}.workspace-header h1{margin:3px 0 0;font-size:23px}.header-actions{display:flex;align-items:center;gap:16px;color:var(--cyan);font-size:13px}.close-button{width:44px;font-size:24px}
.list-toolbar{display:flex;align-items:center;gap:18px;padding:9px 24px;border-bottom:1px solid var(--line);background:#06171f}.list-toolbar>div{display:grid;gap:4px;min-width:245px}.list-toolbar>div strong{font-size:16px}.search-box{display:flex;align-items:center;gap:10px;margin-left:auto}.search-box input{width:280px}.create-event{min-width:190px;border-color:var(--cyan);color:var(--cyan);background:rgba(100,232,255,.1)}
.search-box>span{white-space:nowrap}
.event-index{min-height:0;overflow:auto;padding:24px clamp(24px,5vw,72px) 70px;scrollbar-color:#36c4dd #06141b;scrollbar-width:thin;background:radial-gradient(circle at 85% 0,rgba(34,129,153,.14),transparent 38%),#030c11}.list-heading{display:flex;align-items:end;justify-content:space-between;gap:20px}.list-heading h2{margin:4px 0 0;font-size:22px}.list-heading p{margin:0;color:#9dbdc4;font-size:13px}.event-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.event-card{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:16px;min-height:180px;padding:22px;border-color:var(--line);text-align:left;background:linear-gradient(120deg,rgba(9,39,50,.95),rgba(4,18,24,.96))}.event-card:hover{border-color:var(--cyan)}.status-badge{position:absolute;top:15px;right:16px;padding:4px 8px;border:1px solid rgba(100,232,255,.32);color:#b4dde4;font-size:12px;text-transform:uppercase}.status-badge.confirmed{border-color:#64e89d;color:#8dffc0}.status-badge.review{border-color:#e7c466;color:#ffe49a}.event-card-copy{display:grid;align-content:start;gap:8px;min-width:0;padding-top:18px}.event-card-copy strong{overflow:hidden;font-size:20px;text-overflow:ellipsis;white-space:nowrap}.event-card-copy code{color:#76ddef;font-size:13px}.event-card-copy p{display:-webkit-box;overflow:hidden;margin:6px 0 0;color:#a9c6cc;font-size:13px;line-height:1.6;-webkit-box-orient:vertical;-webkit-line-clamp:2}.event-card dl{display:grid;align-content:center;gap:9px;margin:26px 0 0}.event-card dl div{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(100,232,255,.18)}.event-card dt{color:#9bbbc2}.event-card dd{margin:0;color:var(--cyan);font-weight:700}.edit-arrow{position:absolute;right:18px;bottom:16px;color:var(--cyan);font-size:13px}.empty-state{grid-column:1/-1;padding:40px;border:1px dashed var(--line);color:#9dbdc4;text-align:center}
.edit-toolbar{display:grid;grid-template-columns:150px minmax(180px,1.25fr) minmax(190px,1fr) 125px;align-items:end;gap:9px;padding:8px 14px;border-bottom:1px solid var(--line);background:#06171f}.back-button{align-self:center}.play-button,.save-button{border-color:var(--cyan);background:#0c3d4c;font-weight:700}.delete-event,.remove-line{border-color:rgba(242,108,108,.55);color:#ffb3b3;background:rgba(73,15,22,.5)}.delete-event{margin:0}.edit-body{display:grid;min-height:0;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.edit-toolbar>button{align-self:center;height:42px;min-height:42px;padding:0 10px}
.sequence-panel,.inspector-panel{min-width:0;min-height:0;background:#04131a}.sequence-panel{display:grid;grid-template-rows:54px 40px minmax(0,1fr)}.sequence-panel>header,.inspector-panel>header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 14px;border-bottom:1px solid var(--line);background:#08212b}.sequence-panel h2,.inspector-panel h2{margin:2px 0 0;font-size:18px}.sequence-actions{display:flex;align-items:center;gap:8px}.sequence-actions .play-button{min-width:126px}.add-line{min-width:145px}.sequence-help{margin:0;padding:10px 14px;border-bottom:1px solid rgba(100,232,255,.17);color:#a8c5cb;font-size:13px}.sequence-list,.inspector-scroll{min-height:0;overflow:auto;scrollbar-color:#36c4dd #06141b;scrollbar-width:thin}.sequence-list{display:grid;align-content:start;gap:8px;padding:12px 14px 28px}.sequence-card{display:grid;grid-template-columns:minmax(0,1fr) 42px;border:1px solid rgba(100,232,255,.25);background:#08202a;cursor:grab}.sequence-card.dragging{opacity:.42;cursor:grabbing}.sequence-card.drop-target{border-color:#f0cf6d;box-shadow:inset 0 3px #f0cf6d}.sequence-card.active{border-color:var(--cyan);box-shadow:inset 3px 0 var(--cyan)}.sequence-card.active.drop-target{border-color:#f0cf6d;box-shadow:inset 0 3px #f0cf6d}.card-main{display:grid;grid-template-columns:44px minmax(0,1fr) 92px;align-items:center;gap:10px;min-height:78px;padding:10px;border:0;text-align:left;background:transparent}.order-number{display:grid;width:36px;height:36px;place-items:center;border:1px solid var(--cyan);color:var(--cyan);font-weight:700}.card-copy{display:grid;min-width:0;gap:5px}.card-copy strong{font-size:16px}.card-copy small{overflow:hidden;color:#bad1d6;font-size:13px;line-height:1.45;text-overflow:ellipsis;white-space:nowrap}.type-badge{justify-self:end;color:#6de3f5;font-size:13px;text-align:right}.type-badge small{display:block;margin-top:4px;color:#ebd07c}.order-actions{display:grid;grid-template-rows:1fr 1fr;border-left:1px solid rgba(100,232,255,.2)}.order-actions button{min-height:0;border:0;background:transparent}.empty-sequence,.no-selection{display:grid;place-items:center;align-content:center;gap:8px;min-height:200px;padding:24px;color:#98b8bf;text-align:center}.empty-sequence p,.no-selection p{margin:0;font-size:13px}
.inspector-panel{display:grid;grid-template-rows:54px minmax(0,1fr);border-left:1px solid var(--line)}.remove-line{min-width:110px}.inspector-scroll{padding-bottom:20px}.inspector-scroll section{display:grid;gap:8px;padding:12px 14px;border-bottom:1px solid rgba(100,232,255,.19)}.inspector-scroll h3{margin:0;color:var(--cyan);font-size:16px}.speaker-section{grid-template-columns:1fr 1fr}.speaker-section h3{grid-column:1/-1}.field-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.profile-note{margin:0;color:#a3c1c7;font-size:13px;line-height:1.5}.message-section small{justify-self:end;color:#86abb3;font-size:13px}.preview-line{width:calc(100% - 28px);margin:12px 14px}.message-danger,.event-danger{margin:12px 14px;border:1px solid rgba(242,108,108,.35);background:rgba(74,16,23,.22)}.message-danger p,.event-danger p{margin:0;color:#d5afb2;font-size:13px;line-height:1.5}.message-danger .remove-line,.event-danger .delete-event{justify-self:start;padding-inline:14px}.message-danger{border-color:rgba(242,180,108,.42);background:rgba(74,48,16,.2)}.message-danger p{color:#d9c7aa}
.portrait-effect-section{background:linear-gradient(90deg,rgba(100,232,255,.08),transparent)}.portrait-effect-section h3::before{content:'◉';margin-right:8px;color:#8fffc0}.portrait-effect-section select{border-color:rgba(100,232,255,.55)}
.appearance-section{grid-template-columns:154px minmax(0,1fr);align-items:start;background:linear-gradient(90deg,rgba(100,232,255,.08),transparent)}.appearance-section>h3,.appearance-section>.profile-note{grid-column:1/-1}.live-face-preview{display:grid;justify-items:center;gap:5px}.live-face-frame{position:relative;width:128px;height:140px;overflow:hidden;border:1px solid rgba(100,232,255,.72);background:linear-gradient(180deg,rgba(45,121,146,.28),rgba(4,13,22,.92))}.live-face-frame img{width:100%;height:100%;object-fit:contain;object-position:center bottom;transform-origin:center bottom;image-rendering:pixelated}.live-face-frame>span{display:grid;height:100%;place-items:center;color:#9fcbd3;font-size:13px;line-height:1.4;text-align:center}.live-face-frame::after{position:absolute;z-index:2;inset:0;content:'';pointer-events:none}.live-face-frame.effect-noise::after{opacity:.3;background-image:repeating-radial-gradient(circle at 30% 35%,rgba(225,251,255,.8) 0 1px,transparent 1px 3px);background-size:5px 5px}.live-face-frame.effect-monitor::after{background:repeating-linear-gradient(180deg,rgba(169,245,255,.18) 0 1px,transparent 1px 4px);box-shadow:inset 0 0 28px rgba(55,184,211,.45)}.live-face-frame.face-disabled{opacity:.58}.live-face-preview small{color:#a3c1c7;font-size:13px}.appearance-controls{display:grid;gap:9px;min-width:0}.character-message-type{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:3px 10px;padding:8px 10px;border:1px solid rgba(100,232,255,.24);background:#031117}.character-message-type span{color:#c7eef5}.character-message-type strong{color:var(--cyan)}.character-message-type small{grid-column:1/-1;color:#91b4bc;font-size:13px}
.workspace-footer{display:grid;grid-template-columns:minmax(280px,1fr) auto minmax(170px,300px) 165px;align-items:center;gap:14px;padding:8px 18px;border-top:1px solid var(--line);background:#071b24}.workspace-footer p{margin:0;color:#96b7be;font-size:13px}.workspace-footer code{color:#72deef}.workspace-footer>span{color:#79e7a8;font-size:13px;text-align:right}.workspace-footer>span.error{color:#ff9f9f}.event-memo{grid-template-columns:auto minmax(180px,1fr);align-items:center}.event-memo input{min-height:36px}.screen-list .workspace-footer{grid-template-columns:1fr minmax(170px,300px) 165px}.screen-list .workspace-footer p{grid-column:1}
.preview-overlay{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:24px;background:rgba(0,6,10,.84)}.preview-stage{width:min(1280px,94vw,148vh);overflow:hidden;border:1px solid var(--cyan);background:#031017;box-shadow:0 0 45px rgba(26,191,224,.22)}.preview-stage>header{display:grid;grid-template-columns:1fr auto 100px;align-items:center;gap:16px;height:48px;box-sizing:border-box;padding:7px 12px;border-bottom:1px solid var(--line);background:#082330}.preview-stage header div{display:grid;gap:2px}.preview-stage header p{margin:0;color:#8eeeff}.preview-screen{position:relative;display:grid;aspect-ratio:16/9;min-height:0;overflow:hidden;background:radial-gradient(circle at 50% 90%,rgba(26,119,143,.24),transparent 60%),#020b10}.preview-hint{position:absolute;z-index:3;top:15px;left:50%;margin:0;padding:7px 12px;transform:translateX(-50%);border:1px solid rgba(93,219,241,.25);color:#a9c7cc;background:rgba(3,18,25,.85);font-size:13px;white-space:nowrap}.preview-screen :deep(.dialogue-overlay.embedded){position:absolute;inset:0;z-index:2;display:flex;align-items:flex-end;justify-content:center;padding:0 0 28px}.preview-screen :deep(.dialogue-overlay.embedded .dialogue-modal){width:min(860px,calc(100% - 24px));height:auto;max-height:none;padding:8px 8px 10px;overflow:visible;border:2px solid rgba(120,220,255,.75);background:linear-gradient(180deg,rgba(7,18,28,.9),rgba(4,10,16,.95));box-shadow:0 0 18px rgba(60,190,255,.3),inset 0 0 10px rgba(90,220,255,.12)}.preview-screen :deep(.dialogue-overlay.embedded .dialogue-window){height:auto}.preview-screen :deep(.dialogue-overlay.embedded .dialogue-content){height:140px;min-height:140px;max-height:140px;overflow:hidden}
@media(max-width:600px){.preview-overlay{padding:0}.preview-stage{width:100vw;border-inline:0}.preview-stage>header{grid-template-columns:minmax(0,1fr) auto 78px;gap:8px;padding-inline:8px}.preview-stage>header span{font-size:11px}.preview-hint{display:none}.preview-screen :deep(.dialogue-overlay.embedded){padding-bottom:14px}.preview-screen :deep(.dialogue-overlay.embedded .dialogue-modal){width:calc(100% - 8px);padding:5px;border-width:1px}}
@media(max-width:1050px){.edit-toolbar{grid-template-columns:140px 1fr 1fr 120px}.edit-body{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.event-grid{grid-template-columns:1fr}.workspace-footer{grid-template-columns:minmax(0,1fr) minmax(120px,220px) 160px}.workspace-footer p{display:none}.event-memo{grid-column:auto}.screen-list .workspace-footer{grid-template-columns:minmax(0,1fr) 160px}.dialogue-workspace{grid-template-rows:74px 76px minmax(0,1fr) 58px}.dialogue-workspace.screen-list{grid-template-rows:74px 64px minmax(0,1fr) 58px}.appearance-section{grid-template-columns:140px minmax(0,1fr)}}
.event-card,.card-main,.order-actions button{width:100%}
.event-memo{display:flex;height:42px;min-height:0;align-items:center;gap:10px}.event-memo>span{flex:0 0 auto;white-space:nowrap}.event-memo input{flex:1 1 auto;width:auto;height:38px;min-height:38px}
</style>
