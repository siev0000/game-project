<template>
  <Teleport to="body">
    <div class="dialogue-overlay" @click.self="$emit('close')">
      <div class="dialogue-modal" @click.stop>
        <div v-if="testMode" class="dialogue-test-panel">
          <div class="dialogue-test-summary">
            <p>TYPE-{{ testType }}</p>
            <p>
              P{{ testVoicePitchLabel }} / R{{ testSeRateLabel }} / V{{ testVoiceVolumeLabel }}
            </p>
          </div>
          <div class="dialogue-test-actions">
            <button type="button" class="dialogue-test-settings" @click="openTestSettingsDialog">
              SETTINGS
            </button>
            <button type="button" class="dialogue-test-replay" @click="replayTestMessage">
              REPLAY
            </button>
          </div>
        </div>
        <div
          v-if="testMode && showTestSettingsDialog"
          class="dialogue-test-dialog-overlay"
          @click.self="closeTestSettingsDialog"
        >
          <div class="dialogue-test-dialog">
            <p class="dialogue-test-dialog-title">TEST SETTINGS</p>
            <label class="dialogue-test-field">
              <span>TYPE PROFILE</span>
              <select :value="testType" @change="setTestType($event.target.value)">
                <option
                  v-for="typeValue in typeOptions"
                  :key="`test-type-${typeValue}`"
                  :value="typeValue"
                >
                  TYPE-{{ typeValue }}
                </option>
              </select>
            </label>
            <label class="dialogue-test-field">
              <span>PITCH {{ testVoicePitchLabel }}</span>
              <input
                type="range"
                min="0.6"
                max="1.6"
                step="0.01"
                :value="testVoicePitch"
                @input="setTestVoicePitch($event.target.value)"
              >
            </label>
            <label class="dialogue-test-field">
              <span>SE RATE {{ testSeRateLabel }}</span>
              <input
                type="range"
                min="0.5"
                max="1.8"
                step="0.01"
                :value="testSeRate"
                @input="setTestSeRate($event.target.value)"
              >
            </label>
            <label class="dialogue-test-field">
              <span>VOLUME {{ testVoiceVolumeLabel }}</span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                :value="testVoiceVolume"
                @input="setTestVoiceVolume($event.target.value)"
              >
            </label>
            <div class="dialogue-test-dialog-actions">
              <button type="button" class="dialogue-test-reset" @click="resetTestAudioSettings">
                RESET
              </button>
              <button type="button" class="dialogue-test-apply" @click="replayTestMessage">
                REPLAY NOW
              </button>
              <button type="button" class="dialogue-test-close" @click="closeTestSettingsDialog">
                CLOSE
              </button>
            </div>
          </div>
        </div>
        <div class="dialogue-window" :class="fontTypeClass">
          <div class="dialogue-content">
            <p v-if="name" class="dialogue-speaker">{{ name }}</p>
            <div class="dialogue-body" :class="{ typing: isTyping }">
              <p v-for="(line, index) in visibleLines" :key="`line-${index}`" class="dialogue-line">
                {{ line }}
              </p>
            </div>
            <p v-if="showWaitMarker" class="dialogue-wait">▼</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import * as Tone from 'tone'
import { playSE, stopSE, SE_SOUNDS } from '@/constants/statData.js'

const TYPE_PROFILES = {
  // voiceMode: 'char' = 1文字ごと, 'segment' = 文/句ごと
  0: { se: '', rate: 1, step: 1, fontType: 1, voiceMode: 'char' },
  // 1: 第1世代 アームギア（物理文明）
  1: { se: 'robot-say_第一世代', rate: 0.98, step: 2, fontType: 1, voiceMode: 'segment' },
  // 2: 第2世代 エレクトロニクス（電子文明）
  2: { se: '362373__shapingwaves__sw003_robot_voice_18_high_register_cute_squeaky_14', rate: 1.16, step: 2, fontType: 2, voiceMode: 'segment' },
  // 2.5: 第2.5世代（過渡電子）
  2.5: { se: 'robot_第二世代', rate: 1.06, step: 2, fontType: 2, voiceMode: 'segment' },
  // 3: 第3世代 オートマトン（融合文明）
  3: { se: '348643__v4cuum__vocal-robotic-sound', rate: 0.92, step: 3, fontType: 3, voiceMode: 'segment' },
  // 3.5: 第3.5世代 ウォーフレーム（戦闘改造）
  3.5: { se: '196905__ionicsmusic__race-robot-nitro', rate: 1.22, step: 1, fontType: 5, voiceMode: 'segment' },
  // 4: 第4世代 マギテック（魔導文明）
  4: { se: '362373__shapingwaves__sw003_robot_voice_18_high_register_cute_squeaky_14', rate: 1.08, step: 3, fontType: 4, voiceMode: 'segment' },
  // 4.5: 第4.5世代 インテグラル（統合完成）
  4.5: { se: '825574__akelley6__robot-cry-ui', rate: 0.8, step: 4, fontType: 6, voiceMode: 'segment' }
}
const TYPE_ALIAS_MAP = {
  5: 3.5,
  6: 4.5
}

const props = defineProps({
  name: { type: String, default: '' },
  message: { type: [String, Array], default: '' },
  type: { type: [String, Number], default: 1 },
  messageSpeed: { type: Number, default: 28 },
  voicePitch: { type: Number, default: 1 },
  voiceVolume: { type: Number, default: 0.5 },
  messageId: { type: [String, Number], default: '' },
  waitInput: { type: Boolean, default: false },
  testMode: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'typing-complete'])

const visibleCharCount = ref(0)
const isTyping = ref(false)
let typingTimer = null
const COMMA_BREAK_CHARS = /[、,]/
const SENTENCE_BREAK_CHARS = /[。.!?！？]/
const DIALOGUE_VOICE_LOOP_ID = 'dialogue-message-typing'
let isVoiceLooping = false
let lastCharVoiceTime = 0
const toneLoopState = {
  pending: false,
  active: false,
  nodes: null,
  requestId: 0
}
const toneOneShotStates = new Set()
const testType = ref(1)
const testReplaySeed = ref(0)
const showTestSettingsDialog = ref(false)
const testVoicePitch = ref(1)
const testSeRate = ref(1)
const testVoiceVolume = ref(50)

const hasTypeProfile = (value) =>
  Object.prototype.hasOwnProperty.call(TYPE_PROFILES, String(value))

const normalizeTypeValue = (raw) => {
  if (raw == null || raw === '' || raw === 'none' || raw === '0' || raw === 0) {
    return 0
  }
  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return 0
  if (hasTypeProfile(numeric)) return numeric
  const alias = TYPE_ALIAS_MAP[numeric]
  if (alias != null && hasTypeProfile(alias)) return alias
  return 0
}
const typeOptions = Object.keys(TYPE_PROFILES)
  .map(value => Number(value))
  .filter(value => Number.isFinite(value))
  .sort((a, b) => a - b)

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const normalizeVoiceVolumePercent = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 50
  if (numeric <= 1) return Math.round(clamp(numeric, 0, 1) * 100)
  return Math.round(clamp(numeric, 0, 100))
}
const setTestType = (value) => {
  testType.value = normalizeTypeValue(value)
}
const setTestVoicePitch = (value) => {
  const numeric = Number(value)
  const fallback = Number(props.voicePitch)
  const safe = Number.isFinite(numeric) ? numeric : (Number.isFinite(fallback) ? fallback : 1)
  testVoicePitch.value = Number(clamp(safe, 0.6, 1.6).toFixed(2))
}
const setTestSeRate = (value) => {
  const numeric = Number(value)
  const safe = Number.isFinite(numeric) ? numeric : 1
  testSeRate.value = Number(clamp(safe, 0.5, 1.8).toFixed(2))
}
const setTestVoiceVolume = (value) => {
  const numeric = Number(value)
  const safe = Number.isFinite(numeric) ? Math.round(numeric) : 50
  testVoiceVolume.value = clamp(safe, 0, 100)
}
const openTestSettingsDialog = () => {
  showTestSettingsDialog.value = true
}
const closeTestSettingsDialog = () => {
  showTestSettingsDialog.value = false
}
const resetTestAudioSettings = () => {
  setTestVoicePitch(props.voicePitch)
  setTestSeRate(1)
  setTestVoiceVolume(normalizeVoiceVolumePercent(props.voiceVolume))
}
const replayTestMessage = () => {
  testReplaySeed.value += 1
}
const testVoicePitchLabel = computed(() => testVoicePitch.value.toFixed(2))
const testSeRateLabel = computed(() => testSeRate.value.toFixed(2))
const testVoiceVolumeLabel = computed(() => `${testVoiceVolume.value}%`)

const sourceLines = computed(() => {
  if (Array.isArray(props.message)) {
    return props.message.map(line => String(line ?? ''))
  }
  const text = String(props.message ?? '')
  if (!text) return []
  return text.split(/\r?\n/)
})

const fullText = computed(() => sourceLines.value.join('\n'))
const effectiveType = computed(() => (props.testMode ? testType.value : props.type))
const effectiveMessageSpeed = computed(() => props.messageSpeed)
const effectiveVoicePitch = computed(() => (props.testMode ? testVoicePitch.value : props.voicePitch))
const effectiveVoiceVolume = computed(() =>
  props.testMode ? testVoiceVolume.value / 100 : props.voiceVolume
)
const effectiveSeRate = computed(() => (props.testMode ? testSeRate.value : 1))
const effectiveMessageId = computed(() =>
  props.testMode ? `${props.messageId}:${testReplaySeed.value}` : props.messageId
)

const normalizedType = computed(() => {
  return normalizeTypeValue(effectiveType.value)
})

const activeTypeProfile = computed(() => TYPE_PROFILES[normalizedType.value] || TYPE_PROFILES[0])
const fontTypeClass = computed(() => `font-type-${activeTypeProfile.value.fontType}`)
const normalizedVoicePitch = computed(() => {
  const numeric = Number(effectiveVoicePitch.value)
  if (!Number.isFinite(numeric)) return 1
  return Math.max(0.6, Math.min(1.6, numeric))
})
const normalizedVoiceVolume = computed(() => {
  const numeric = Number(effectiveVoiceVolume.value)
  if (!Number.isFinite(numeric)) return 0.5
  return Math.max(0, Math.min(1, numeric))
})
const normalizedSeRate = computed(() => {
  const numeric = Number(effectiveSeRate.value)
  if (!Number.isFinite(numeric)) return 1
  return Math.max(0.5, Math.min(1.8, numeric))
})
const effectiveSePlaybackRate = computed(() =>
  activeTypeProfile.value.rate * normalizedSeRate.value
)
const tonePitchShiftSemitones = computed(() =>
  12 * Math.log2(Math.max(0.01, normalizedVoicePitch.value))
)
const fallbackPlaybackRate = computed(() =>
  effectiveSePlaybackRate.value * normalizedVoicePitch.value
)

const visibleLines = computed(() => {
  const text = fullText.value.slice(0, visibleCharCount.value)
  if (!text) return []
  return text.split('\n')
})

const showWaitMarker = computed(() =>
  Boolean(props.waitInput) &&
  !isTyping.value &&
  visibleCharCount.value >= fullText.value.length &&
  fullText.value.length > 0
)

const clearTypingTimer = () => {
  if (!typingTimer) return
  clearTimeout(typingTimer)
  typingTimer = null
}

const isBreakChar = (char) => {
  if (char === '\n') return true
  if (COMMA_BREAK_CHARS.test(char)) return true
  if (SENTENCE_BREAK_CHARS.test(char)) return true
  return false
}

const getVoiceMode = (profile) => {
  if (profile?.voiceMode === 'char') return 'char'
  return 'segment'
}

const stripAudioExtension = (value) => String(value ?? '').replace(/\.(mp3|wav|flac)$/i, '')
const resolveSEUrl = (seName) => {
  if (!seName) return ''
  if (SE_SOUNDS[seName]) return SE_SOUNDS[seName]

  const target = stripAudioExtension(seName)
  const matchedKey = Object.keys(SE_SOUNDS).find((key) => stripAudioExtension(key) === target)
  return matchedKey ? SE_SOUNDS[matchedKey] : ''
}
const shouldUseTonePlayback = computed(() => Boolean(props.testMode))

const ensureToneStarted = async () => {
  if (typeof window === 'undefined') return false
  try {
    await Tone.start()
    return true
  } catch {
    return false
  }
}

const disposeToneNodes = (nodes) => {
  if (!nodes) return
  try { nodes.player?.stop() } catch {}
  try { nodes.player?.disconnect() } catch {}
  try { nodes.pitchShift?.disconnect() } catch {}
  try { nodes.gain?.disconnect() } catch {}
  try { nodes.player?.dispose() } catch {}
  try { nodes.pitchShift?.dispose() } catch {}
  try { nodes.gain?.dispose() } catch {}
}

const createToneNodes = async (url, { loop = false } = {}) => {
  const started = await ensureToneStarted()
  if (!started) return null

  const player = new Tone.Player({ url, loop, autostart: false })
  await player.load(url)
  player.playbackRate = effectiveSePlaybackRate.value

  const pitchShift = new Tone.PitchShift({ pitch: tonePitchShiftSemitones.value })
  const gain = new Tone.Gain(normalizedVoiceVolume.value)

  player.connect(pitchShift)
  pitchShift.connect(gain)
  gain.toDestination()

  return { player, pitchShift, gain }
}

const clearToneLoopState = () => {
  toneLoopState.requestId += 1
  toneLoopState.pending = false
  toneLoopState.active = false

  if (toneLoopState.nodes) {
    disposeToneNodes(toneLoopState.nodes)
    toneLoopState.nodes = null
  }
}

const updateToneLoopParams = () => {
  const nodes = toneLoopState.nodes
  if (!nodes || !toneLoopState.active) return

  try { nodes.player.playbackRate = effectiveSePlaybackRate.value } catch {}
  try { nodes.pitchShift.pitch = tonePitchShiftSemitones.value } catch {}
  try { nodes.gain.gain.rampTo(normalizedVoiceVolume.value, 0.02) } catch {}
}

const startToneLoop = (seName) => {
  if (toneLoopState.pending || toneLoopState.active) return

  const url = resolveSEUrl(seName)
  if (!url) return

  toneLoopState.pending = true
  toneLoopState.requestId += 1
  const requestId = toneLoopState.requestId
  isVoiceLooping = true

  ;(async () => {
    const nodes = await createToneNodes(url, { loop: true })

    if (requestId !== toneLoopState.requestId) {
      if (nodes) disposeToneNodes(nodes)
      toneLoopState.pending = false
      isVoiceLooping = false
      return
    }

    if (!nodes) {
      toneLoopState.pending = false
      isVoiceLooping = false
      playSE(seName, {
        volume: normalizedVoiceVolume.value,
        rate: fallbackPlaybackRate.value,
        loop: true,
        id: DIALOGUE_VOICE_LOOP_ID
      })
      isVoiceLooping = true
      return
    }

    toneLoopState.nodes = nodes
    toneLoopState.pending = false
    toneLoopState.active = true
    nodes.player.start()
  })()
}

const playToneOneShot = (seName) => {
  const url = resolveSEUrl(seName)
  if (!url) return false

  const state = { disposed: false, nodes: null }
  toneOneShotStates.add(state)

  ;(async () => {
    const nodes = await createToneNodes(url, { loop: false })
    if (!nodes || state.disposed) {
      if (nodes) disposeToneNodes(nodes)
      toneOneShotStates.delete(state)
      playSE(seName, {
        volume: normalizedVoiceVolume.value,
        rate: fallbackPlaybackRate.value
      })
      return
    }

    state.nodes = nodes
    nodes.player.onstop = () => {
      if (state.disposed) return
      state.disposed = true
      toneOneShotStates.delete(state)
      disposeToneNodes(nodes)
    }
    nodes.player.start()
  })()

  return true
}

const disposeAllToneOneShots = () => {
  for (const state of toneOneShotStates) {
    state.disposed = true
    if (state.nodes) {
      disposeToneNodes(state.nodes)
    }
  }
  toneOneShotStates.clear()
}

const startTypeVoiceLoop = () => {
  const profile = activeTypeProfile.value
  if (!profile.se) return
  if (isVoiceLooping) return
  if (shouldUseTonePlayback.value) {
    startToneLoop(profile.se)
    return
  }
  playSE(profile.se, {
    volume: normalizedVoiceVolume.value,
    rate: fallbackPlaybackRate.value,
    loop: true,
    id: DIALOGUE_VOICE_LOOP_ID
  })
  isVoiceLooping = true
}

const stopTypeVoiceLoop = () => {
  clearToneLoopState()
  stopSE(DIALOGUE_VOICE_LOOP_ID)
  isVoiceLooping = false
}

const shouldPlayCharVoice = (char, index) => {
  const profile = activeTypeProfile.value
  if (!profile.se) return false
  if (!char) return false
  if (isBreakChar(char)) return false
  if (/\s/.test(char)) return false
  const step = Math.max(1, Number(profile.step) || 1)
  if (index % step !== 0) return false
  const now = Date.now()
  if (now - lastCharVoiceTime < 24) return false
  lastCharVoiceTime = now
  return true
}

const playTypeVoiceByChar = (char, index) => {
  if (!shouldPlayCharVoice(char, index)) return
  const profile = activeTypeProfile.value
  if (shouldUseTonePlayback.value) {
    playToneOneShot(profile.se)
    return
  }
  playSE(profile.se, {
    volume: normalizedVoiceVolume.value,
    rate: fallbackPlaybackRate.value
  })
}

const syncTypeVoiceForChar = (char, index) => {
  const profile = activeTypeProfile.value
  if (!profile.se) {
    stopTypeVoiceLoop()
    return
  }

  if (getVoiceMode(profile) === 'char') {
    stopTypeVoiceLoop()
    playTypeVoiceByChar(char, index)
    return
  }

  if (!char) return
  if (isBreakChar(char)) {
    stopTypeVoiceLoop()
    return
  }
  if (/\s/.test(char)) return
  startTypeVoiceLoop()
}

const getTypingDelay = (char, baseSpeed) => {
  if (char === '\n') return Math.max(baseSpeed, 320)
  if (COMMA_BREAK_CHARS.test(char)) return Math.max(baseSpeed, 220)
  if (SENTENCE_BREAK_CHARS.test(char)) return Math.max(baseSpeed, 360)
  return baseSpeed
}

const startTypewriter = () => {
  clearTypingTimer()
  stopTypeVoiceLoop()
  visibleCharCount.value = 0
  isTyping.value = false
  lastCharVoiceTime = 0

  const text = fullText.value
  if (!text) return

  const speed = Math.max(0, Math.round(Number(effectiveMessageSpeed.value) || 0))
  if (speed === 0) {
    visibleCharCount.value = text.length
    emit('typing-complete', props.messageId)
    return
  }

  isTyping.value = true
  const tick = () => {
    const next = visibleCharCount.value + 1
    const char = text[next - 1] || ''
    visibleCharCount.value = next
    syncTypeVoiceForChar(char, next)

    if (next >= text.length) {
      isTyping.value = false
      stopTypeVoiceLoop()
      clearTypingTimer()
      emit('typing-complete', props.messageId)
      return
    }
    const nextDelay = getTypingDelay(char, speed)
    typingTimer = setTimeout(tick, nextDelay)
  }

  typingTimer = setTimeout(tick, speed)
}

watch(
  () => [fullText.value, effectiveMessageSpeed.value, normalizedType.value, effectiveMessageId.value],
  () => {
    startTypewriter()
  },
  { immediate: true }
)
watch(
  () => props.testMode,
  (enabled) => {
    if (enabled) {
      testType.value = normalizeTypeValue(props.type)
      resetTestAudioSettings()
      showTestSettingsDialog.value = true
      return
    }
    testReplaySeed.value = 0
    showTestSettingsDialog.value = false
  },
  { immediate: true }
)
watch(
  () => [normalizedVoicePitch.value, normalizedVoiceVolume.value, normalizedSeRate.value],
  () => {
    if (toneLoopState.active) {
      updateToneLoopParams()
      return
    }
    if (!isVoiceLooping) return
    stopTypeVoiceLoop()
    if (isTyping.value) {
      startTypeVoiceLoop()
    }
  }
)

onBeforeUnmount(() => {
  stopTypeVoiceLoop()
  disposeAllToneOneShots()
  clearTypingTimer()
})
</script>

<style scoped>
.dialogue-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 12px;
  box-sizing: border-box;
}

.dialogue-modal {
  width: min(720px, 100%);
  max-width: 100%;
  max-height: calc(100vh - 24px);
  padding: 8px 8px 10px;
  position: relative;
  overflow-y: auto;
  box-sizing: border-box;
  background: linear-gradient(180deg, rgba(7, 18, 28, 0.9), rgba(4, 10, 16, 0.95));
  border: 2px solid rgba(120, 220, 255, 0.75);
  box-shadow:
    0 0 18px rgba(60, 190, 255, 0.3),
    inset 0 0 10px rgba(90, 220, 255, 0.12);
  color: #d9f8ff;
  font-family: Consolas, monospace;
  pointer-events: auto;
}

.dialogue-test-panel {
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid rgba(120, 220, 255, 0.55);
  background: rgba(6, 20, 30, 0.9);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: end;
}

.dialogue-test-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px;
}

.dialogue-test-summary p {
  margin: 0;
  font-size: 11px;
  color: #bff0ff;
  letter-spacing: 0.05em;
  text-align: left;
}

.dialogue-test-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.dialogue-test-settings,
.dialogue-test-replay {
  min-width: 88px;
  min-height: 30px;
  border: 1px solid rgba(140, 220, 255, 0.75);
  background: rgba(10, 28, 40, 0.95);
  color: #d9f8ff;
  font-size: 11px;
  letter-spacing: 0.05em;
  font-weight: 700;
  cursor: pointer;
}

.dialogue-test-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(2, 8, 14, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  box-sizing: border-box;
}

.dialogue-test-dialog {
  width: min(420px, 100%);
  max-height: calc(100vh - 24px);
  overflow-y: auto;
  border: 1px solid rgba(130, 220, 255, 0.7);
  background: rgba(6, 18, 28, 0.96);
  box-shadow: 0 0 14px rgba(80, 200, 255, 0.35);
  padding: 10px;
  display: grid;
  gap: 8px;
}

.dialogue-test-dialog-title {
  margin: 0;
  font-size: 12px;
  color: #d7f6ff;
  letter-spacing: 0.08em;
  text-align: left;
}

.dialogue-test-field {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}

.dialogue-test-field span {
  font-size: 11px;
  color: #bff0ff;
  letter-spacing: 0.05em;
  font-weight: 700;
  text-align: left;
}

.dialogue-test-field select {
  min-height: 30px;
  border: 1px solid rgba(120, 220, 255, 0.65);
  background: rgba(8, 20, 30, 0.95);
  color: #d9f8ff;
  font-family: Consolas, monospace;
  font-size: 12px;
  padding: 4px 8px;
}

.dialogue-test-field input[type='range'] {
  width: 100%;
}

.dialogue-test-dialog-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.dialogue-test-reset,
.dialogue-test-apply,
.dialogue-test-close {
  min-height: 30px;
  border: 1px solid rgba(150, 220, 255, 0.7);
  background: rgba(12, 28, 40, 0.95);
  color: #d9f8ff;
  font-size: 11px;
  letter-spacing: 0.05em;
  font-weight: 700;
  cursor: pointer;
}

.dialogue-window {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  align-items: stretch;
  --dialogue-font: Consolas, 'Courier New', monospace;
  --dialogue-color: #d9f8ff;
  --speaker-color: #8de8ff;
}

.dialogue-content {
  min-height: 140px;
  border: 1px solid rgba(120, 220, 255, 0.75);
  background: linear-gradient(180deg, rgba(10, 30, 42, 0.75), rgba(5, 15, 24, 0.85));
  padding: 10px 12px;
  font-family: var(--dialogue-font);
  color: var(--dialogue-color);
  position: relative;
}

.dialogue-speaker {
  margin: 0 0 6px;
  font-size: 13px;
  letter-spacing: 0.12em;
  color: var(--speaker-color);
  text-align: left;
}

.dialogue-body {
  font-size: 20px;
  line-height: 1.5;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
  text-align: left;
}

.dialogue-body.typing::after {
  content: '▌';
  margin-left: 2px;
  animation: cursorBlink 1s steps(2) infinite;
}

.dialogue-line {
  margin: 0;
  white-space: pre-wrap;
  text-align: left;
}

.dialogue-line + .dialogue-line {
  margin-top: 4px;
}

.dialogue-wait {
  position: absolute;
  right: 8px;
  bottom: 4px;
  margin: 0;
  font-size: 14px;
  color: #bdf2ff;
  animation: waitBlink 1s steps(2) infinite;
}

.dialogue-window.font-type-1 {
  --dialogue-font: Consolas, 'Courier New', monospace;
  --dialogue-color: #d9f8ff;
  --speaker-color: #8de8ff;
}

.dialogue-window.font-type-2 {
  --dialogue-font: 'Yu Gothic UI', Meiryo, sans-serif;
  --dialogue-color: #e9fdff;
  --speaker-color: #94f0ff;
}

.dialogue-window.font-type-3 {
  --dialogue-font: 'MS Gothic', 'Courier New', monospace;
  --dialogue-color: #ddf9ff;
  --speaker-color: #7fddff;
}

.dialogue-window.font-type-4 {
  --dialogue-font: 'Trebuchet MS', Verdana, sans-serif;
  --dialogue-color: #f1f8ff;
  --speaker-color: #9fcaff;
}

.dialogue-window.font-type-5 {
  --dialogue-font: 'Times New Roman', 'Yu Mincho', serif;
  --dialogue-color: #f7f3eb;
  --speaker-color: #f0d8a4;
}

.dialogue-window.font-type-6 {
  --dialogue-font: Tahoma, 'Segoe UI', sans-serif;
  --dialogue-color: #d3ffe6;
  --speaker-color: #8dffb2;
}

@keyframes cursorBlink {
  50% {
    opacity: 0;
  }
}

@keyframes waitBlink {
  50% {
    opacity: 0.35;
  }
}
</style>
