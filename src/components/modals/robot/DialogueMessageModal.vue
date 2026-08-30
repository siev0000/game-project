<template>
  <Teleport to="body" :disabled="embedded">
    <div class="dialogue-overlay" :class="{ embedded }" @click.self="$emit('close')">
      <div class="dialogue-modal" @click.stop>
        <div v-if="testMode && showTestControls" class="dialogue-test-panel">
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
          v-if="testMode && showTestControls && showTestSettingsDialog"
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
              <span>MESSAGE SE</span>
              <select :value="testSeName" @change="setTestSeName($event.target.value)">
                <option value="">TYPE DEFAULT（{{ formatSeName(activeTypeProfile.se || 'なし') }}）</option>
                <option v-for="seName in seOptions" :key="`test-se-${seName}`" :value="seName">
                  {{ formatSeName(seName) }}
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
        <div
          ref="dialogueWindow"
          class="dialogue-window"
          :class="[fontTypeClass, { 'with-portrait': showPortrait }]"
          :style="dialogueFontStyle"
          role="button"
          tabindex="0"
          aria-label="メッセージを進める"
          @click="handleDialogueAdvance"
          @keydown.enter.prevent="handleDialogueAdvance"
          @keydown.space.prevent="handleDialogueAdvance"
        >
          <div v-if="showPortrait" class="dialogue-portrait" :class="`effect-${portraitEffect}`" aria-hidden="true">
            <img v-if="portraitSource" :src="portraitSource" alt="" :style="portraitStyle">
            <span v-else>FACE<br>未設定</span>
          </div>
          <div ref="dialogueContent" class="dialogue-content">
            <p v-if="name" class="dialogue-speaker">{{ name }}</p>
            <div ref="dialogueBody" class="dialogue-body" :class="{ typing: isTyping }">
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as Tone from 'tone'
import { playSE, stopSE, SE_SOUNDS } from '@/constants/statData.js'
import { getDialogueFontOption } from '@/constants/dialogueFonts.js'
import { TEXT_FONT_FAMILY_MAP } from '../data/textFontPresets.js'
import defaultDialogueMessageSettings from '../../../../data/dialogueMessageSettings.json'

const TYPE_PROFILES = Object.fromEntries(Object.entries(defaultDialogueMessageSettings.typeProfiles || {})
  .map(([type, profile]) => [type, profile?.default || {}]))
const TYPE_ALIAS_MAP = {
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
  testMode: { type: Boolean, default: false },
  profileSettings: { type: Object, default: null },
  emotion: { type: String, default: 'default' },
  showPortrait: { type: Boolean, default: false },
  portraitSource: { type: String, default: '' },
  portraitStyle: { type: Object, default: () => ({}) },
  portraitEffect: { type: String, default: 'none' },
  embedded: { type: Boolean, default: false },
  showTestControls: { type: Boolean, default: true },
  autoAdvancePages: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'typing-complete'])

// 名前表示と待機マーカーを含めても、140pxの本文枠に収まる実表示行数。
const MAX_MESSAGE_LINES = 3
const visibleCharCount = ref(0)
const isTyping = ref(false)
const messagePageIndex = ref(0)
const dialogueWindow = ref(null)
const dialogueContent = ref(null)
const dialogueBody = ref(null)
const messageTextWidth = ref(320)
const messageMeasureSeed = ref(0)
let typingTimer = null
let pageAdvanceTimer = null
let messageResizeObserver = null
const COMMA_BREAK_CHARS = /[、,]/
const SENTENCE_BREAK_CHARS = /[。.!?！？]/
const DIALOGUE_VOICE_LOOP_ID = 'dialogue-message-typing'
const DIALOGUE_VOICE_CHAR_ID = 'dialogue-message-char'
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
const testSeName = ref('')
const seOptions = Object.keys(SE_SOUNDS).sort((left, right) => left.localeCompare(right, 'ja'))
const formatSeName = (name) => {
  const text = String(name || '')
  return text.length <= 32 ? text : `${text.slice(0, 19)}…${text.slice(-10)}`
}

const hasTypeProfile = (value) =>
  Object.prototype.hasOwnProperty.call(
    props.profileSettings?.typeProfiles || TYPE_PROFILES,
    String(value)
  )

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
const typeOptions = computed(() =>
  Object.keys(props.profileSettings?.typeProfiles || TYPE_PROFILES)
    .map(value => Number(value))
    .filter(value => Number.isFinite(value))
    .sort((a, b) => a - b)
)

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const numberOr = (value, fallback) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}
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
const setTestSeName = (value) => {
  testSeName.value = String(value || '')
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
  setTestSeName('')
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

const splitVisualLines = (text) => {
  const value = String(text ?? '')
  if (!value) return ['']
  if (typeof window === 'undefined') return value.split(/\r?\n/)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const style = dialogueBody.value ? window.getComputedStyle(dialogueBody.value) : null
  if (context && style) context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const maxWidth = Math.max(96, messageTextWidth.value)
  const measured = item => context ? context.measureText(item).width : item.length * 12
  const lines = []
  for (const paragraph of value.split(/\r?\n/)) {
    if (!paragraph) { lines.push(''); continue }
    let line = ''
    for (const character of Array.from(paragraph)) {
      const candidate = `${line}${character}`
      if (line && measured(candidate) > maxWidth) {
        lines.push(line)
        line = character
      } else {
        line = candidate
      }
    }
    lines.push(line)
  }
  return lines
}
const messagePages = computed(() => {
  // messageMeasureSeed はフォント／表示幅変更時に、見た目の折り返し単位で再分割するための依存値。
  void messageMeasureSeed.value
  const lines = sourceLines.value.flatMap(splitVisualLines)
  const pages = []
  for (let index = 0; index < lines.length; index += MAX_MESSAGE_LINES) {
    pages.push(lines.slice(index, index + MAX_MESSAGE_LINES))
  }
  return pages
})
const currentPageLines = computed(() => messagePages.value[messagePageIndex.value] || [])
const fullText = computed(() => currentPageLines.value.join('\n'))
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

const activeTypeProfile = computed(() => {
  const typeKey = String(normalizedType.value)
  const fallback = TYPE_PROFILES[typeKey] || TYPE_PROFILES[0] || {}
  const configured = props.profileSettings?.typeProfiles?.[typeKey]
    || defaultDialogueMessageSettings.typeProfiles?.[typeKey]
  if (!configured) return fallback
  return {
    ...fallback,
    ...(configured.default || {}),
    ...(configured.emotions?.[props.emotion] || {})
  }
})
const effectiveSeName = computed(() =>
  props.testMode && testSeName.value ? testSeName.value : activeTypeProfile.value.se
)
const fontTypeClass = computed(() => `font-type-${activeTypeProfile.value.fontType}`)
const dialogueFontStyle = computed(() => {
  const option = getDialogueFontOption(
    activeTypeProfile.value.fontFamily,
    activeTypeProfile.value.fontType
  )
  const preset = activeTypeProfile.value.fontPreset
  const customFamily = String(activeTypeProfile.value.customFontFamily || '').trim()
  const family = preset === 'custom' && customFamily
    ? customFamily
    : (TEXT_FONT_FAMILY_MAP[preset] || option.stack)
  const size = clamp(Number(activeTypeProfile.value.fontSize) || 20, 6, 40)
  const weight = Math.round(clamp(Number(activeTypeProfile.value.fontWeight) || 400, 300, 900) / 100) * 100
  const spacing = clamp(Number(activeTypeProfile.value.letterSpacing) || 0, -1, 6)
  const textColor = /^#[0-9a-f]{6}$/i.test(activeTypeProfile.value.textColor)
    ? activeTypeProfile.value.textColor
    : null
  return {
    '--dialogue-font': family,
    '--dialogue-font-size': `${size}px`,
    '--dialogue-font-weight': weight,
    '--dialogue-letter-spacing': `${spacing}px`,
    ...(textColor ? { '--dialogue-color': textColor } : {})
  }
})
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
const activeAudioEffects = computed(() => {
  const effects = activeTypeProfile.value.audioEffects || {}
  return {
    echoEnabled: Boolean(effects.echoEnabled),
    echoDelay: clamp(numberOr(effects.echoDelay, 0.11), 0.03, 0.8),
    echoFeedback: clamp(numberOr(effects.echoFeedback, 38) / 100, 0, 0.85),
    echoMix: clamp(numberOr(effects.echoMix, 14) / 100, 0, 1),
    distortionEnabled: Boolean(effects.distortionEnabled),
    distortionAmount: clamp(numberOr(effects.distortionAmount, 50) / 100, 0, 1),
    distortionMix: clamp(numberOr(effects.distortionMix, 45) / 100, 0, 1),
    bitCrusherEnabled: Boolean(effects.bitCrusherEnabled),
    bitDepth: Math.round(clamp(numberOr(effects.bitDepth, 3), 1, 8)),
    bitCrusherMix: clamp(numberOr(effects.bitCrusherMix, 50) / 100, 0, 1),
    filterEnabled: Boolean(effects.filterEnabled),
    filterType: ['bandpass', 'lowpass', 'highpass'].includes(effects.filterType)
      ? effects.filterType
      : 'bandpass',
    filterFrequency: clamp(numberOr(effects.filterFrequency, 1400), 200, 8000),
    reverbEnabled: Boolean(effects.reverbEnabled),
    reverbDecay: clamp(numberOr(effects.reverbDecay, 1.8), 0.1, 8),
    reverbPreDelay: clamp(numberOr(effects.reverbPreDelay, 0.02), 0, 0.2),
    reverbMix: clamp(numberOr(effects.reverbMix, 28) / 100, 0, 1),
    ringModEnabled: Boolean(effects.ringModEnabled),
    ringModFrequency: clamp(numberOr(effects.ringModFrequency, 42), 5, 200),
    ringModMix: clamp(numberOr(effects.ringModMix, 40) / 100, 0, 1),
    frequencyShiftEnabled: Boolean(effects.frequencyShiftEnabled),
    frequencyShift: clamp(numberOr(effects.frequencyShift, 180), -1000, 1000),
    frequencyShiftMix: clamp(numberOr(effects.frequencyShiftMix, 40) / 100, 0, 1),
    noiseEnabled: Boolean(effects.noiseEnabled),
    noiseType: ['white', 'pink', 'brown'].includes(effects.noiseType) ? effects.noiseType : 'pink',
    noiseMix: clamp(numberOr(effects.noiseMix, 14) / 100, 0, 1),
    panEnabled: Boolean(effects.panEnabled),
    pan: clamp(numberOr(effects.pan, 0), -1, 1),
    variationEnabled: Boolean(effects.variationEnabled),
    pitchRandom: clamp(numberOr(effects.pitchRandom, 1.5), 0, 8),
    speedRandom: clamp(numberOr(effects.speedRandom, 12) / 100, 0, 0.4),
    volumeRandom: clamp(numberOr(effects.volumeRandom, 10) / 100, 0, 0.5),
    variationInterval: clamp(numberOr(effects.variationInterval, 180), 40, 2000),
    fadeEnabled: Boolean(effects.fadeEnabled),
    fadeIn: clamp(numberOr(effects.fadeIn, 0.02), 0, 1),
    fadeOut: clamp(numberOr(effects.fadeOut, 0.12), 0, 2),
    preserveTail: effects.preserveTail !== false
  }
})
const hasActiveAudioEffects = computed(() => {
  const effects = activeAudioEffects.value
  return effects.echoEnabled
    || effects.distortionEnabled
    || effects.bitCrusherEnabled
    || effects.filterEnabled
    || effects.reverbEnabled
    || effects.ringModEnabled
    || effects.frequencyShiftEnabled
    || effects.noiseEnabled
    || effects.panEnabled
    || effects.variationEnabled
    || effects.fadeEnabled
})
const audioEffectSignature = computed(() => JSON.stringify(activeAudioEffects.value))

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
const clearPageAdvanceTimer = () => {
  if (!pageAdvanceTimer) return
  clearTimeout(pageAdvanceTimer)
  pageAdvanceTimer = null
}
const updateMessageMeasure = () => {
  const element = dialogueContent.value
  if (!element) return
  // 左右paddingに加えて文字間隔・カーソル分の余白を確保する。
  const nextWidth = Math.max(96, Math.floor(element.clientWidth - 32))
  if (nextWidth !== messageTextWidth.value) messageTextWidth.value = nextWidth
  messageMeasureSeed.value += 1
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
const shouldUseTonePlayback = computed(() => Boolean(props.testMode) || hasActiveAudioEffects.value)

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
  if (nodes.variationTimer) {
    clearInterval(nodes.variationTimer)
    nodes.variationTimer = null
  }
  if (nodes.disposeTimer) {
    clearTimeout(nodes.disposeTimer)
    nodes.disposeTimer = null
  }
  try { nodes.noise?.stop() } catch {}
  try { nodes.player?.stop() } catch {}
  try { nodes.noise?.disconnect() } catch {}
  try { nodes.noiseGain?.disconnect() } catch {}
  try { nodes.player?.disconnect() } catch {}
  try { nodes.pitchShift?.disconnect() } catch {}
  for (const effect of nodes.effects || []) {
    try { effect.disconnect() } catch {}
  }
  try { nodes.gain?.disconnect() } catch {}
  try { nodes.noise?.dispose() } catch {}
  try { nodes.noiseGain?.dispose() } catch {}
  try { nodes.player?.dispose() } catch {}
  try { nodes.pitchShift?.dispose() } catch {}
  for (const effect of nodes.effects || []) {
    try { effect.dispose() } catch {}
  }
  try { nodes.gain?.dispose() } catch {}
}

const createToneNodes = async (url, { loop = false } = {}) => {
  const started = await ensureToneStarted()
  if (!started) return null

  const effectSettings = activeAudioEffects.value
  const player = new Tone.Player({
    url,
    loop,
    autostart: false,
    fadeIn: effectSettings.fadeEnabled ? effectSettings.fadeIn : 0,
    fadeOut: effectSettings.fadeEnabled ? effectSettings.fadeOut : 0
  })
  await player.load(url)
  player.playbackRate = effectiveSePlaybackRate.value

  const pitchShift = new Tone.PitchShift({ pitch: tonePitchShiftSemitones.value })
  const gain = new Tone.Gain(normalizedVoiceVolume.value)
  const effects = []
  let outputNode = pitchShift

  player.connect(pitchShift)
  if (effectSettings.frequencyShiftEnabled) {
    const frequencyShift = new Tone.FrequencyShifter({
      frequency: effectSettings.frequencyShift,
      wet: effectSettings.frequencyShiftMix
    })
    outputNode.connect(frequencyShift)
    outputNode = frequencyShift
    effects.push(frequencyShift)
  }
  if (effectSettings.ringModEnabled) {
    const ringMod = new Tone.Tremolo({
      frequency: effectSettings.ringModFrequency,
      depth: 1,
      wet: effectSettings.ringModMix
    }).start()
    outputNode.connect(ringMod)
    outputNode = ringMod
    effects.push(ringMod)
  }
  if (effectSettings.filterEnabled) {
    const filter = new Tone.Filter({
      type: effectSettings.filterType,
      frequency: effectSettings.filterFrequency,
      rolloff: -24
    })
    outputNode.connect(filter)
    outputNode = filter
    effects.push(filter)
  }
  if (effectSettings.distortionEnabled) {
    const distortion = new Tone.Distortion({
      distortion: effectSettings.distortionAmount,
      wet: effectSettings.distortionMix
    })
    outputNode.connect(distortion)
    outputNode = distortion
    effects.push(distortion)
  }
  if (effectSettings.bitCrusherEnabled) {
    const bitCrusher = new Tone.BitCrusher({
      bits: effectSettings.bitDepth,
      wet: effectSettings.bitCrusherMix
    })
    outputNode.connect(bitCrusher)
    outputNode = bitCrusher
    effects.push(bitCrusher)
  }
  if (effectSettings.echoEnabled) {
    const echo = new Tone.FeedbackDelay({
      delayTime: effectSettings.echoDelay,
      feedback: effectSettings.echoFeedback,
      wet: effectSettings.echoMix
    })
    outputNode.connect(echo)
    outputNode = echo
    effects.push(echo)
  }
  if (effectSettings.reverbEnabled) {
    const reverb = new Tone.Reverb({
      decay: effectSettings.reverbDecay,
      preDelay: effectSettings.reverbPreDelay,
      wet: effectSettings.reverbMix
    })
    await reverb.generate()
    outputNode.connect(reverb)
    outputNode = reverb
    effects.push(reverb)
  }
  if (effectSettings.panEnabled) {
    const panner = new Tone.Panner(effectSettings.pan)
    outputNode.connect(panner)
    outputNode = panner
    effects.push(panner)
  }
  outputNode.connect(gain)
  gain.toDestination()

  let noise = null
  let noiseGain = null
  if (effectSettings.noiseEnabled) {
    noise = new Tone.Noise(effectSettings.noiseType)
    noiseGain = new Tone.Gain(effectSettings.noiseMix * 0.18)
    noise.connect(noiseGain)
    noiseGain.connect(gain)
  }

  return { player, pitchShift, effects, gain, noise, noiseGain, variationTimer: null, disposeTimer: null }
}

const randomSigned = () => Math.random() * 2 - 1
const applyToneVariation = (nodes) => {
  const settings = activeAudioEffects.value
  const speedFactor = settings.variationEnabled ? 1 + randomSigned() * settings.speedRandom : 1
  const pitchOffset = settings.variationEnabled ? randomSigned() * settings.pitchRandom : 0
  const volumeFactor = settings.variationEnabled ? 1 + randomSigned() * settings.volumeRandom : 1
  try { nodes.player.playbackRate = effectiveSePlaybackRate.value * speedFactor } catch {}
  try { nodes.pitchShift.pitch = tonePitchShiftSemitones.value + pitchOffset } catch {}
  try { nodes.gain.gain.rampTo(normalizedVoiceVolume.value * volumeFactor, 0.02) } catch {}
}
const startToneNodes = (nodes) => {
  applyToneVariation(nodes)
  try { nodes.noise?.start() } catch {}
  nodes.player.start()
  if (activeAudioEffects.value.variationEnabled) {
    nodes.variationTimer = setInterval(
      () => applyToneVariation(nodes),
      activeAudioEffects.value.variationInterval
    )
  }
}
const toneTailDurationMs = () => {
  const settings = activeAudioEffects.value
  const echoTail = settings.echoEnabled ? settings.echoDelay * 5 : 0
  const reverbTail = settings.reverbEnabled ? settings.reverbDecay : 0
  return Math.round(Math.min(4, Math.max(echoTail, reverbTail)) * 1000)
}
const releaseToneNodes = (nodes, preserveTail = false) => {
  if (!nodes) return
  if (nodes.variationTimer) {
    clearInterval(nodes.variationTimer)
    nodes.variationTimer = null
  }
  try { nodes.noise?.stop() } catch {}
  try { nodes.player?.stop() } catch {}
  const tailMs = preserveTail ? toneTailDurationMs() : 0
  if (tailMs > 0) {
    nodes.disposeTimer = setTimeout(() => disposeToneNodes(nodes), tailMs)
    return
  }
  disposeToneNodes(nodes)
}

const clearToneLoopState = ({ preserveTail = false } = {}) => {
  toneLoopState.requestId += 1
  toneLoopState.pending = false
  toneLoopState.active = false

  if (toneLoopState.nodes) {
    releaseToneNodes(toneLoopState.nodes, preserveTail)
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
    startToneNodes(nodes)
  })()
}

const playToneOneShot = (seName) => {
  // A file may still be loading while the next character arrives. Keep that
  // one request alive, but never start a second overlapping message SE.
  if (toneOneShotStates.size > 0) return true
  const url = resolveSEUrl(seName)
  if (!url) return false

  const state = { disposed: false, nodes: null }
  toneOneShotStates.add(state)

  ;(async () => {
    const nodes = await createToneNodes(url, { loop: false })
    if (state.disposed) {
      if (nodes) disposeToneNodes(nodes)
      toneOneShotStates.delete(state)
      return
    }
    if (!nodes) {
      toneOneShotStates.delete(state)
      stopSE(DIALOGUE_VOICE_CHAR_ID)
      playSE(seName, {
        volume: normalizedVoiceVolume.value,
        rate: fallbackPlaybackRate.value,
        id: DIALOGUE_VOICE_CHAR_ID
      })
      return
    }

    state.nodes = nodes
    nodes.player.onstop = () => {
      if (state.disposed) return
      state.disposed = true
      toneOneShotStates.delete(state)
      try { nodes.noise?.stop() } catch {}
      const preserveTail = activeAudioEffects.value.preserveTail
      const tailMs = preserveTail ? toneTailDurationMs() : 0
      if (tailMs > 0) {
        nodes.disposeTimer = setTimeout(() => disposeToneNodes(nodes), tailMs)
        return
      }
      disposeToneNodes(nodes)
    }
    startToneNodes(nodes)
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

const stopTypeCharVoice = () => {
  disposeAllToneOneShots()
  stopSE(DIALOGUE_VOICE_CHAR_ID)
}

const startTypeVoiceLoop = () => {
  const profile = activeTypeProfile.value
  const seName = effectiveSeName.value
  if (!seName) return
  if (isVoiceLooping) return
  if (shouldUseTonePlayback.value) {
    stopTypeCharVoice()
    startToneLoop(seName)
    return
  }
  playSE(seName, {
    volume: normalizedVoiceVolume.value,
    rate: fallbackPlaybackRate.value,
    loop: true,
    id: DIALOGUE_VOICE_LOOP_ID
  })
  isVoiceLooping = true
}

const stopTypeVoiceLoop = ({ immediate = false } = {}) => {
  clearToneLoopState({
    preserveTail: !immediate && activeAudioEffects.value.preserveTail
  })
  stopSE(DIALOGUE_VOICE_LOOP_ID)
  isVoiceLooping = false
}

const shouldPlayCharVoice = (char, index) => {
  const profile = activeTypeProfile.value
  if (!effectiveSeName.value) return false
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
  const seName = effectiveSeName.value
  if (shouldUseTonePlayback.value) {
    playToneOneShot(seName)
    return
  }
  stopSE(DIALOGUE_VOICE_CHAR_ID)
  playSE(seName, {
    volume: normalizedVoiceVolume.value,
    rate: fallbackPlaybackRate.value,
    id: DIALOGUE_VOICE_CHAR_ID
  })
}

const syncTypeVoiceForChar = (char, index) => {
  const profile = activeTypeProfile.value
  if (!effectiveSeName.value) {
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

const finishTypewriter = () => {
  isTyping.value = false
  stopTypeVoiceLoop()
  clearTypingTimer()
  if (props.autoAdvancePages && messagePageIndex.value < messagePages.value.length - 1) {
    clearPageAdvanceTimer()
    pageAdvanceTimer = setTimeout(() => {
      pageAdvanceTimer = null
      messagePageIndex.value += 1
    }, 750)
    return
  }
  emit('typing-complete', props.messageId)
}

const runTypewriterTick = () => {
  const text = fullText.value
  const next = visibleCharCount.value + 1
  const char = text[next - 1] || ''
  visibleCharCount.value = next
  syncTypeVoiceForChar(char, next)

  if (next >= text.length) {
    finishTypewriter()
    return
  }
  const speed = Math.max(0, Math.round(Number(effectiveMessageSpeed.value) || 0))
  typingTimer = setTimeout(runTypewriterTick, getTypingDelay(char, speed))
}

const startTypewriter = () => {
  clearTypingTimer()
  stopTypeVoiceLoop()
  stopTypeCharVoice()
  visibleCharCount.value = 0
  isTyping.value = false
  lastCharVoiceTime = 0

  const text = fullText.value
  if (!text) return

  const speed = Math.max(0, Math.round(Number(effectiveMessageSpeed.value) || 0))
  if (speed === 0) {
    visibleCharCount.value = text.length
    finishTypewriter()
    return
  }

  isTyping.value = true
  typingTimer = setTimeout(runTypewriterTick, speed)
}

const findNextSentenceEnd = (text, startIndex) => {
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index]
    if (char === '\n' || SENTENCE_BREAK_CHARS.test(char)) return index + 1
  }
  return text.length
}

const handleDialogueAdvance = () => {
  if (showTestSettingsDialog.value) return
  const text = fullText.value
  if (isTyping.value) {
    clearTypingTimer()
    stopTypeVoiceLoop()
    visibleCharCount.value = findNextSentenceEnd(text, visibleCharCount.value)
    if (visibleCharCount.value >= text.length) {
      finishTypewriter()
      return
    }
    isTyping.value = true
    const speed = Math.max(0, Math.round(Number(effectiveMessageSpeed.value) || 0))
    typingTimer = setTimeout(runTypewriterTick, speed)
    return
  }
  if (text && visibleCharCount.value >= text.length && messagePageIndex.value < messagePages.value.length - 1) {
    messagePageIndex.value += 1
    return
  }
  if (text && visibleCharCount.value >= text.length) {
    emit('close')
  }
}

watch(
  () => [props.message, effectiveMessageId.value],
  () => {
    clearPageAdvanceTimer()
    messagePageIndex.value = 0
  }
)
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
watch(
  audioEffectSignature,
  () => {
    if (!toneLoopState.active && !toneLoopState.pending && !isVoiceLooping) return
    stopTypeVoiceLoop({ immediate: true })
    if (isTyping.value) {
      startTypeVoiceLoop()
    }
  }
)

onMounted(() => {
  nextTick(() => {
    updateMessageMeasure()
    if (typeof ResizeObserver !== 'undefined' && dialogueContent.value) {
      messageResizeObserver = new ResizeObserver(updateMessageMeasure)
      messageResizeObserver.observe(dialogueContent.value)
    }
  })
  if (props.testMode) return
  nextTick(() => dialogueWindow.value?.focus())
})

onBeforeUnmount(() => {
  stopTypeVoiceLoop({ immediate: true })
  disposeAllToneOneShots()
  clearTypingTimer()
  clearPageAdvanceTimer()
  messageResizeObserver?.disconnect()
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

.dialogue-overlay.embedded {
  position: relative;
  inset: auto;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
}

.dialogue-modal {
  width: min(860px, 100%);
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

.dialogue-overlay.embedded .dialogue-modal {
  width: 100%;
  max-width: none;
  max-height: none;
  height: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.dialogue-overlay.embedded .dialogue-window {
  height: auto;
  box-sizing: border-box;
}

.dialogue-overlay.embedded .dialogue-content {
  height: 140px;
  min-height: 140px;
  max-height: 140px;
  overflow: hidden;
  box-sizing: border-box;
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
  background: transparent;
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
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 30px;
  overflow: hidden;
  border: 1px solid rgba(120, 220, 255, 0.65);
  background: rgba(8, 20, 30, 0.95);
  color: #d9f8ff;
  font-family: Consolas, monospace;
  font-size: 12px;
  padding: 4px 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  cursor: pointer;
  outline: none;
}

.dialogue-window.with-portrait {
  grid-template-columns: 128px minmax(0, 1fr);
}

.dialogue-portrait {
  position: relative;
  display: grid;
  width: 128px;
  height: 140px;
  min-height: 140px;
  max-height: 140px;
  align-self: end;
  overflow: hidden;
  place-items: end center;
  overflow: hidden;
  border: 1px solid rgba(120, 220, 255, 0.75);
  background:
    linear-gradient(180deg, rgba(45, 121, 146, 0.28), rgba(4, 13, 22, 0.92)),
    repeating-linear-gradient(90deg, rgba(115, 234, 255, 0.08) 0 1px, transparent 1px 8px);
}

.dialogue-portrait img {
  position: relative;
  z-index: 0;
  width: 100%;
  height: 140px;
  min-height: 140px;
  max-height: 140px;
  object-fit: contain;
  object-position: center bottom;
  transform-origin: center bottom;
  image-rendering: pixelated;
}

.dialogue-portrait span {
  padding: 10px;
  color: rgba(202, 244, 255, 0.65);
  font-size: 12px;
  line-height: 1.45;
  text-align: center;
}

.dialogue-portrait::after {
  position: absolute;
  z-index: 1;
  inset: 0;
  content: '';
  pointer-events: none;
}

.dialogue-portrait.effect-noise::after {
  opacity: 0.28;
  background-image: repeating-radial-gradient(circle at 30% 35%, rgba(225, 251, 255, 0.8) 0 1px, transparent 1px 3px);
  background-size: 5px 5px;
  animation: dialoguePortraitNoise 0.14s steps(2) infinite;
}

.dialogue-portrait.effect-monitor::after {
  background: repeating-linear-gradient(180deg, rgba(169, 245, 255, 0.16) 0 1px, transparent 1px 4px);
  box-shadow: inset 0 0 28px rgba(55, 184, 211, 0.4);
}

@keyframes dialoguePortraitNoise {
  0% { transform: translate(0, 0); }
  50% { transform: translate(2px, -1px); }
  100% { transform: translate(-1px, 2px); }
}

.dialogue-window:focus-visible {
  box-shadow: 0 0 0 2px rgba(141, 232, 255, 0.9);
}

.dialogue-content {
  height: 140px;
  min-height: 140px;
  max-height: 140px;
  overflow: hidden;
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
  font-size: var(--dialogue-font-size, 20px);
  font-weight: var(--dialogue-font-weight, 400);
  letter-spacing: var(--dialogue-letter-spacing, 0);
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

@media (max-width: 600px) {
  .dialogue-overlay {
    padding: 4px;
  }

  .dialogue-modal {
    width: 100%;
  }
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
