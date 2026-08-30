<template>
  <Teleport to="body">
    <BaseHudModal
      frame-width="calc(100vw - 16px)"
      frame-height="calc(100vh - 16px)"
      frame-max-height="none"
      frame-overflow="hidden"
      :frame-scale="1"
      :close-on-overlay="false"
      @close="$emit('close')"
    >
      <section class="dialogue-editor">
        <header class="editor-header">
          <div class="header-title">
            <p>DIALOGUE VOICE CONFIGURATION</p>
            <h2>メッセージ設定</h2>
          </div>
          <div class="header-switches">
            <label class="type-switcher">
              <span>TYPE</span>
              <span class="type-controls">
                <select v-model="selectedType">
                  <option v-for="type in typeOptions" :key="type.key" :value="type.key">
                    {{ type.label }}
                  </option>
                </select>
                <button type="button" class="compact-button add-type-button" title="新しいTYPEを追加" aria-label="新しいTYPEを追加" @click="openAddTypeDialog">＋</button>
              </span>
            </label>
            <label class="emotion-switcher">
              <span>感情</span>
              <select v-model="selectedEmotion" aria-label="編集する感情を選択">
                <option v-for="emotion in emotionOptions" :key="emotion.key" :value="emotion.key">{{ emotion.label }}</option>
              </select>
            </label>
          </div>
          <div class="header-actions">
            <button type="button" class="utility-button" aria-label="ファイル・初期化メニュー" title="ファイル・初期化メニュー" @click="showUtilityMenu = !showUtilityMenu">…</button>
            <button type="button" class="close-button" @click="$emit('close')">閉じる</button>
            <div v-if="showUtilityMenu" class="utility-menu">
              <button type="button" @click="resetCurrentEmotion(); showUtilityMenu = false">選択中を初期化</button>
              <button type="button" @click="openSettingsFile(); showUtilityMenu = false">JSON読込</button>
              <button type="button" class="apply-button" @click="save(); showUtilityMenu = false">JSONへ保存して反映</button>
            </div>
            <input ref="settingsFileInput" class="settings-file-input" type="file" accept="application/json,.json" @change="importSettings">
          </div>
        </header>

        <main class="editor-main">
          <div class="editor-detail">
            <section class="preview-panel">
              <div class="preview-heading">
                <p>LIVE PREVIEW</p>
                <button type="button" class="font-settings-button" :class="{ active: showFontSettings }" @click="showFontSettings = !showFontSettings">フォント設定</button>
              </div>
              <div v-if="showFontSettings" class="font-settings-popover">
                <div class="font-popover-heading">
                  <strong>フォント設定</strong>
                  <button type="button" aria-label="フォント設定を閉じる" @click="showFontSettings = false">×</button>
                </div>
                <div class="font-picker-row">
                  <span>フォント</span>
                  <button type="button" class="font-picker-trigger" @click="fontPickerOpen = true">
                    <strong>{{ selectedFontLabel }}</strong>
                    <span :style="{ fontFamily: selectedFontFamily }">メッセージ MESSAGE 123</span>
                  </button>
                </div>
                <label v-if="currentEmotion.fontPreset === 'custom'" class="custom-font-row">
                  カスタムフォント
                  <input
                    v-model="currentEmotion.customFontFamily"
                    type="text"
                    maxlength="120"
                    placeholder='例: "Cinzel Decorative", serif'
                  >
                </label>
                <label class="font-color-row">
                  <span>文字色</span>
                  <input v-model="currentEmotion.textColor" type="color">
                  <code>{{ currentEmotion.textColor }}</code>
                </label>
                <label class="range-setting"><span>文字サイズ</span>
                  <input v-model.number="currentEmotion.fontSize" type="range" min="6" max="40" step="1">
                  <output>{{ currentEmotion.fontSize }}px</output>
                </label>
                <label class="font-bold-row">
                  <input
                    type="checkbox"
                    :checked="currentEmotion.fontWeight >= 700"
                    @change="currentEmotion.fontWeight = $event.target.checked ? 700 : 400"
                  >
                  <span>太字</span>
                </label>
              </div>
              <label>
                話者名
                <input v-model="previewName" type="text" maxlength="24">
              </label>
              <label>
                本文
                <textarea v-model="previewMessage" rows="3" maxlength="240"></textarea>
              </label>
              <div class="dialogue-preview-stage">
                <DialogueMessageModal
                  embedded
                  :profile-settings="draft"
                  :emotion="selectedEmotion"
                  :name="previewName"
                  :message="previewMessage"
                  :type="Number(selectedType)"
                  :message-speed="currentEmotion.messageSpeed"
                  :voice-pitch="currentEmotion.voicePitch"
                  :voice-volume="currentEmotion.voiceVolume / 100"
                  :message-id="previewSeed"
                  :wait-input="true"
                  @close="replay"
                />
              </div>
            </section>

            <section class="settings-panel">
              <div class="settings-scroll">
                <section class="setting-group">
                  <details class="setting-section" open>
                    <summary>音声・SE</summary>
                    <div class="setting-fields">
                      <label>
                        再生方式
                        <select v-model="currentEmotion.voiceMode">
                          <option value="segment">継続再生</option>
                          <option value="char">文字単位</option>
                        </select>
                      </label>
                      <label class="se-setting">
                        <span>使用SE</span>
                        <span class="se-controls">
                          <select v-model="currentEmotion.se">
                            <option value="">なし</option>
                            <option v-for="sound in soundOptions" :key="sound" :value="sound">{{ formatSeName(sound) }}</option>
                          </select>
                          <button type="button" class="compact-button play-button" title="メッセージを再生" aria-label="メッセージを再生" @click="replay">▷</button>
                        </span>
                      </label>
                      <label class="range-setting"><span>SE再生速度</span>
                        <input v-model.number="currentEmotion.rate" type="range" min="0.4" max="1.8" step="0.01">
                        <output>{{ currentEmotion.rate.toFixed(2) }}</output>
                      </label>
                      <label class="range-setting"><span>声のピッチ</span>
                        <input v-model.number="currentEmotion.voicePitch" type="range" min="0.6" max="1.6" step="0.01">
                        <output>{{ currentEmotion.voicePitch.toFixed(2) }}</output>
                      </label>
                      <label class="range-setting"><span>音量</span>
                        <input v-model.number="currentEmotion.voiceVolume" type="range" min="0" max="100" step="1">
                        <output>{{ currentEmotion.voiceVolume }}%</output>
                      </label>
                      <details class="audio-effect-section">
                        <summary>特殊音声エフェクト</summary>
                        <div class="audio-effect-list">
                          <section class="audio-effect-block">
                            <label class="effect-toggle">
                              <input v-model="currentEmotion.audioEffects.echoEnabled" type="checkbox">
                              <strong>エコー</strong>
                            </label>
                            <template v-if="currentEmotion.audioEffects.echoEnabled">
                              <label class="range-setting"><span>遅延時間</span>
                                <input v-model.number="currentEmotion.audioEffects.echoDelay" type="range" min="0.03" max="0.8" step="0.01">
                                <output>{{ currentEmotion.audioEffects.echoDelay.toFixed(2) }}s</output>
                              </label>
                              <label class="range-setting"><span>反復</span>
                                <input v-model.number="currentEmotion.audioEffects.echoFeedback" type="range" min="0" max="85" step="1">
                                <output>{{ currentEmotion.audioEffects.echoFeedback }}%</output>
                              </label>
                              <label class="range-setting"><span>ミックス</span>
                                <input v-model.number="currentEmotion.audioEffects.echoMix" type="range" min="0" max="100" step="1">
                                <output>{{ currentEmotion.audioEffects.echoMix }}%</output>
                              </label>
                            </template>
                          </section>
                          <section class="audio-effect-block">
                            <label class="effect-toggle">
                              <input v-model="currentEmotion.audioEffects.distortionEnabled" type="checkbox">
                              <strong>デジタル歪み</strong>
                            </label>
                            <template v-if="currentEmotion.audioEffects.distortionEnabled">
                              <label class="range-setting"><span>歪み量</span>
                                <input v-model.number="currentEmotion.audioEffects.distortionAmount" type="range" min="0" max="100" step="1">
                                <output>{{ currentEmotion.audioEffects.distortionAmount }}%</output>
                              </label>
                              <label class="range-setting"><span>ミックス</span>
                                <input v-model.number="currentEmotion.audioEffects.distortionMix" type="range" min="0" max="100" step="1">
                                <output>{{ currentEmotion.audioEffects.distortionMix }}%</output>
                              </label>
                            </template>
                          </section>
                          <section class="audio-effect-block">
                            <label class="effect-toggle">
                              <input v-model="currentEmotion.audioEffects.bitCrusherEnabled" type="checkbox">
                              <strong>ビットクラッシャー</strong>
                            </label>
                            <template v-if="currentEmotion.audioEffects.bitCrusherEnabled">
                              <label class="range-setting"><span>ビット深度</span>
                                <input v-model.number="currentEmotion.audioEffects.bitDepth" type="range" min="1" max="8" step="1">
                                <output>{{ currentEmotion.audioEffects.bitDepth }}bit</output>
                              </label>
                              <label class="range-setting"><span>ミックス</span>
                                <input v-model.number="currentEmotion.audioEffects.bitCrusherMix" type="range" min="0" max="100" step="1">
                                <output>{{ currentEmotion.audioEffects.bitCrusherMix }}%</output>
                              </label>
                            </template>
                          </section>
                          <section class="audio-effect-block">
                            <label class="effect-toggle">
                              <input v-model="currentEmotion.audioEffects.filterEnabled" type="checkbox">
                              <strong>通信フィルター</strong>
                            </label>
                            <template v-if="currentEmotion.audioEffects.filterEnabled">
                              <label>
                                フィルター種類
                                <select v-model="currentEmotion.audioEffects.filterType">
                                  <option value="bandpass">無線・通信</option>
                                  <option value="lowpass">こもった音</option>
                                  <option value="highpass">細い音</option>
                                </select>
                              </label>
                              <label class="range-setting"><span>周波数</span>
                                <input v-model.number="currentEmotion.audioEffects.filterFrequency" type="range" min="200" max="8000" step="50">
                                <output>{{ currentEmotion.audioEffects.filterFrequency }}Hz</output>
                              </label>
                            </template>
                          </section>
                          <section class="audio-effect-block">
                            <label class="effect-toggle">
                              <input v-model="currentEmotion.audioEffects.reverbEnabled" type="checkbox">
                              <strong>リバーブ</strong>
                            </label>
                            <template v-if="currentEmotion.audioEffects.reverbEnabled">
                              <label class="range-setting"><span>残響時間</span>
                                <input v-model.number="currentEmotion.audioEffects.reverbDecay" type="range" min="0.1" max="8" step="0.1">
                                <output>{{ currentEmotion.audioEffects.reverbDecay.toFixed(1) }}s</output>
                              </label>
                              <label class="range-setting"><span>先行遅延</span>
                                <input v-model.number="currentEmotion.audioEffects.reverbPreDelay" type="range" min="0" max="0.2" step="0.01">
                                <output>{{ currentEmotion.audioEffects.reverbPreDelay.toFixed(2) }}s</output>
                              </label>
                              <label class="range-setting"><span>ミックス</span>
                                <input v-model.number="currentEmotion.audioEffects.reverbMix" type="range" min="0" max="100" step="1">
                                <output>{{ currentEmotion.audioEffects.reverbMix }}%</output>
                              </label>
                            </template>
                          </section>
                          <section class="audio-effect-block">
                            <label class="effect-toggle">
                              <input v-model="currentEmotion.audioEffects.ringModEnabled" type="checkbox">
                              <strong>リングモジュレーター</strong>
                            </label>
                            <template v-if="currentEmotion.audioEffects.ringModEnabled">
                              <label class="range-setting"><span>変調周波数</span>
                                <input v-model.number="currentEmotion.audioEffects.ringModFrequency" type="range" min="5" max="200" step="1">
                                <output>{{ currentEmotion.audioEffects.ringModFrequency }}Hz</output>
                              </label>
                              <label class="range-setting"><span>ミックス</span>
                                <input v-model.number="currentEmotion.audioEffects.ringModMix" type="range" min="0" max="100" step="1">
                                <output>{{ currentEmotion.audioEffects.ringModMix }}%</output>
                              </label>
                            </template>
                          </section>
                          <section class="audio-effect-block">
                            <label class="effect-toggle">
                              <input v-model="currentEmotion.audioEffects.frequencyShiftEnabled" type="checkbox">
                              <strong>周波数シフター</strong>
                            </label>
                            <template v-if="currentEmotion.audioEffects.frequencyShiftEnabled">
                              <label class="range-setting"><span>移動量</span>
                                <input v-model.number="currentEmotion.audioEffects.frequencyShift" type="range" min="-1000" max="1000" step="10">
                                <output>{{ currentEmotion.audioEffects.frequencyShift }}Hz</output>
                              </label>
                              <label class="range-setting"><span>ミックス</span>
                                <input v-model.number="currentEmotion.audioEffects.frequencyShiftMix" type="range" min="0" max="100" step="1">
                                <output>{{ currentEmotion.audioEffects.frequencyShiftMix }}%</output>
                              </label>
                            </template>
                          </section>
                          <section class="audio-effect-block">
                            <label class="effect-toggle">
                              <input v-model="currentEmotion.audioEffects.noiseEnabled" type="checkbox">
                              <strong>ノイズ混合</strong>
                            </label>
                            <template v-if="currentEmotion.audioEffects.noiseEnabled">
                              <label>
                                ノイズ種類
                                <select v-model="currentEmotion.audioEffects.noiseType">
                                  <option value="white">ホワイト</option>
                                  <option value="pink">ピンク</option>
                                  <option value="brown">ブラウン</option>
                                </select>
                              </label>
                              <label class="range-setting"><span>ノイズ量</span>
                                <input v-model.number="currentEmotion.audioEffects.noiseMix" type="range" min="0" max="100" step="1">
                                <output>{{ currentEmotion.audioEffects.noiseMix }}%</output>
                              </label>
                            </template>
                          </section>
                          <section class="audio-effect-block">
                            <label class="effect-toggle">
                              <input v-model="currentEmotion.audioEffects.panEnabled" type="checkbox">
                              <strong>左右パン</strong>
                            </label>
                            <label v-if="currentEmotion.audioEffects.panEnabled" class="range-setting"><span>位置</span>
                              <input v-model.number="currentEmotion.audioEffects.pan" type="range" min="-1" max="1" step="0.05">
                              <output>{{ formatPan(currentEmotion.audioEffects.pan) }}</output>
                            </label>
                          </section>
                          <section class="audio-effect-block">
                            <label class="effect-toggle">
                              <input v-model="currentEmotion.audioEffects.variationEnabled" type="checkbox">
                              <strong>音声ランダム変化</strong>
                            </label>
                            <template v-if="currentEmotion.audioEffects.variationEnabled">
                              <label class="range-setting"><span>ピッチ揺れ幅</span>
                                <input v-model.number="currentEmotion.audioEffects.pitchRandom" type="range" min="0" max="8" step="0.1">
                                <output>±{{ currentEmotion.audioEffects.pitchRandom.toFixed(1) }}</output>
                              </label>
                              <label class="range-setting"><span>速度揺れ幅</span>
                                <input v-model.number="currentEmotion.audioEffects.speedRandom" type="range" min="0" max="40" step="1">
                                <output>±{{ currentEmotion.audioEffects.speedRandom }}%</output>
                              </label>
                              <label class="range-setting"><span>音量揺れ幅</span>
                                <input v-model.number="currentEmotion.audioEffects.volumeRandom" type="range" min="0" max="50" step="1">
                                <output>±{{ currentEmotion.audioEffects.volumeRandom }}%</output>
                              </label>
                              <label class="range-setting"><span>変化間隔</span>
                                <input v-model.number="currentEmotion.audioEffects.variationInterval" type="range" min="40" max="2000" step="20">
                                <output>{{ currentEmotion.audioEffects.variationInterval }}ms</output>
                              </label>
                            </template>
                          </section>
                          <section class="audio-effect-block">
                            <label class="effect-toggle">
                              <input v-model="currentEmotion.audioEffects.fadeEnabled" type="checkbox">
                              <strong>フェード</strong>
                            </label>
                            <template v-if="currentEmotion.audioEffects.fadeEnabled">
                              <label class="range-setting"><span>フェードイン</span>
                                <input v-model.number="currentEmotion.audioEffects.fadeIn" type="range" min="0" max="1" step="0.01">
                                <output>{{ currentEmotion.audioEffects.fadeIn.toFixed(2) }}s</output>
                              </label>
                              <label class="range-setting"><span>フェードアウト</span>
                                <input v-model.number="currentEmotion.audioEffects.fadeOut" type="range" min="0" max="2" step="0.01">
                                <output>{{ currentEmotion.audioEffects.fadeOut.toFixed(2) }}s</output>
                              </label>
                              <label class="effect-toggle">
                                <input v-model="currentEmotion.audioEffects.preserveTail" type="checkbox">
                                <span>文末で残響を残す</span>
                              </label>
                            </template>
                          </section>
                        </div>
                      </details>
                    </div>
                  </details>

                  <details class="setting-section">
                    <summary>音声プリセット・コピー</summary>
                    <div class="setting-fields">
                      <label>
                        プリセット
                        <select v-model="selectedAudioPreset">
                          <option value="">選択してください</option>
                          <option v-for="preset in audioPresetOptions" :key="preset.key" :value="preset.key">
                            {{ preset.label }}
                          </option>
                        </select>
                      </label>
                      <button type="button" :disabled="!selectedAudioPreset" @click="applyAudioPreset">現在の感情へ適用</button>
                      <div class="preset-save-row">
                        <input v-model="newPresetName" type="text" maxlength="40" placeholder="保存するプリセット名">
                        <button type="button" :disabled="!newPresetName.trim()" @click="saveAudioPreset">現在設定を保存</button>
                      </div>
                      <div class="copy-settings-grid">
                        <label>
                          コピー先TYPE
                          <select v-model="copyTargetType">
                            <option v-for="type in typeOptions" :key="type.key" :value="type.key">{{ type.label }}</option>
                          </select>
                        </label>
                        <label>
                          コピー先
                          <select v-model="copyTargetEmotion">
                            <option v-for="emotion in emotionOptions" :key="emotion.key" :value="emotion.key">{{ emotion.label }}</option>
                          </select>
                        </label>
                      </div>
                      <button type="button" class="apply-button" @click="copyAudioSettings">現在の音声設定をコピー</button>
                    </div>
                  </details>

                  <details class="setting-section" open>
                    <summary>文字送り</summary>
                    <div class="setting-fields">
                      <label class="range-setting"><span>文字送り間隔</span>
                        <input v-model.number="currentEmotion.messageSpeed" type="range" min="0" max="120" step="1">
                        <output>{{ currentEmotion.messageSpeed }}ms</output>
                      </label>
                      <label class="range-setting"><span>音の間隔</span>
                        <input v-model.number="currentEmotion.step" type="range" min="1" max="8" step="1">
                        <output>{{ currentEmotion.step }}</output>
                      </label>
                    </div>
                  </details>
                </section>
              </div>
            </section>
          </div>
        </main>
      </section>
    </BaseHudModal>
    <FontSelectModal
      v-if="fontPickerOpen"
      :selected-key="currentEmotion.fontPreset"
      :custom-family="currentEmotion.customFontFamily"
      description="カード内の文字が実際の表示例です。選択するとすぐメッセージへ反映します。"
      @close="fontPickerOpen = false"
      @select="selectFont"
    />
    <BaseHudModal
      v-if="addTypeDialogOpen"
      frame-width="min(440px, calc(100vw - 20px))"
      frame-height="auto"
      frame-max-height="calc(100dvh - 20px)"
      :close-on-overlay="false"
      @close="addTypeDialogOpen = false"
    >
      <form class="add-type-dialog" @submit.prevent="confirmAddType">
        <header>
          <div>
            <span>NEW MESSAGE TYPE</span>
            <h2>TYPEを追加</h2>
          </div>
          <button type="button" @click="addTypeDialogOpen = false">閉じる</button>
        </header>
        <p>現在選択中のTYPE設定を複製して、TYPE-{{ pendingTypeKey }}として追加します。</p>
        <label>
          表示名
          <input v-model="newTypeName" type="text" maxlength="48" placeholder="新しいTYPE名">
        </label>
        <div class="add-type-actions">
          <button type="button" @click="addTypeDialogOpen = false">キャンセル</button>
          <button type="submit" class="apply-button">追加</button>
        </div>
      </form>
    </BaseHudModal>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import BaseHudModal from './BaseHudModal.vue'
import DialogueMessageModal from './DialogueMessageModal.vue'
import FontSelectModal from './FontSelectModal.vue'
import { SE_SOUNDS } from '@/constants/statData.js'
import { DIALOGUE_FONT_OPTIONS, LEGACY_DIALOGUE_FONT_IDS } from '@/constants/dialogueFonts.js'
import { TEXT_FONT_PRESETS, VISIBLE_TEXT_FONT_PRESETS } from '../data/textFontPresets.js'
import defaultDialogueMessageSettings from '../../../../data/dialogueMessageSettings.json'

const props = defineProps({
  settings: { type: Object, default: () => defaultDialogueMessageSettings }
})
const emit = defineEmits(['close', 'apply'])

const emotionOptions = [
  { key: 'default', label: '通常' },
  { key: 'joy', label: '喜び' },
  { key: 'anger', label: '怒り' },
  { key: 'sorrow', label: '悲しみ' },
  { key: 'fun', label: '楽しい' },
  { key: 'surprise', label: '驚き' },
  { key: 'confusion', label: '困惑' },
  { key: 'tense', label: '緊張' },
  { key: 'serious', label: '真剣' }
]
const clone = value => JSON.parse(JSON.stringify(value))
const clamp = (value, min, max, fallback) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.max(min, Math.min(max, numeric)) : fallback
}
const normalizeAudioEffects = (value, fallback = {}) => ({
  echoEnabled: Boolean(value?.echoEnabled ?? fallback.echoEnabled ?? false),
  echoDelay: Number(clamp(value?.echoDelay, 0.03, 0.8, fallback.echoDelay ?? 0.11).toFixed(2)),
  echoFeedback: Math.round(clamp(value?.echoFeedback, 0, 85, fallback.echoFeedback ?? 38)),
  echoMix: Math.round(clamp(value?.echoMix, 0, 100, fallback.echoMix ?? 14)),
  distortionEnabled: Boolean(value?.distortionEnabled ?? fallback.distortionEnabled ?? false),
  distortionAmount: Math.round(clamp(value?.distortionAmount, 0, 100, fallback.distortionAmount ?? 50)),
  distortionMix: Math.round(clamp(value?.distortionMix, 0, 100, fallback.distortionMix ?? 45)),
  bitCrusherEnabled: Boolean(value?.bitCrusherEnabled ?? fallback.bitCrusherEnabled ?? false),
  bitDepth: Math.round(clamp(value?.bitDepth, 1, 8, fallback.bitDepth ?? 3)),
  bitCrusherMix: Math.round(clamp(value?.bitCrusherMix, 0, 100, fallback.bitCrusherMix ?? 50)),
  filterEnabled: Boolean(value?.filterEnabled ?? fallback.filterEnabled ?? false),
  filterType: ['bandpass', 'lowpass', 'highpass'].includes(value?.filterType)
    ? value.filterType
    : (fallback.filterType || 'bandpass'),
  filterFrequency: Math.round(clamp(value?.filterFrequency, 200, 8000, fallback.filterFrequency ?? 1400) / 50) * 50,
  reverbEnabled: Boolean(value?.reverbEnabled ?? fallback.reverbEnabled ?? false),
  reverbDecay: Number(clamp(value?.reverbDecay, 0.1, 8, fallback.reverbDecay ?? 1.8).toFixed(1)),
  reverbPreDelay: Number(clamp(value?.reverbPreDelay, 0, 0.2, fallback.reverbPreDelay ?? 0.02).toFixed(2)),
  reverbMix: Math.round(clamp(value?.reverbMix, 0, 100, fallback.reverbMix ?? 28)),
  ringModEnabled: Boolean(value?.ringModEnabled ?? fallback.ringModEnabled ?? false),
  ringModFrequency: Math.round(clamp(value?.ringModFrequency, 5, 200, fallback.ringModFrequency ?? 42)),
  ringModMix: Math.round(clamp(value?.ringModMix, 0, 100, fallback.ringModMix ?? 40)),
  frequencyShiftEnabled: Boolean(value?.frequencyShiftEnabled ?? fallback.frequencyShiftEnabled ?? false),
  frequencyShift: Math.round(clamp(value?.frequencyShift, -1000, 1000, fallback.frequencyShift ?? 180)),
  frequencyShiftMix: Math.round(clamp(value?.frequencyShiftMix, 0, 100, fallback.frequencyShiftMix ?? 40)),
  noiseEnabled: Boolean(value?.noiseEnabled ?? fallback.noiseEnabled ?? false),
  noiseType: ['white', 'pink', 'brown'].includes(value?.noiseType)
    ? value.noiseType
    : (fallback.noiseType || 'pink'),
  noiseMix: Math.round(clamp(value?.noiseMix, 0, 100, fallback.noiseMix ?? 14)),
  panEnabled: Boolean(value?.panEnabled ?? fallback.panEnabled ?? false),
  pan: Number(clamp(value?.pan, -1, 1, fallback.pan ?? 0).toFixed(2)),
  variationEnabled: Boolean(value?.variationEnabled ?? fallback.variationEnabled ?? false),
  pitchRandom: Number(clamp(value?.pitchRandom, 0, 8, fallback.pitchRandom ?? 1.5).toFixed(1)),
  speedRandom: Math.round(clamp(value?.speedRandom, 0, 40, fallback.speedRandom ?? 12)),
  volumeRandom: Math.round(clamp(value?.volumeRandom, 0, 50, fallback.volumeRandom ?? 10)),
  variationInterval: Math.round(clamp(value?.variationInterval, 40, 2000, fallback.variationInterval ?? 180)),
  fadeEnabled: Boolean(value?.fadeEnabled ?? fallback.fadeEnabled ?? false),
  fadeIn: Number(clamp(value?.fadeIn, 0, 1, fallback.fadeIn ?? 0.02).toFixed(2)),
  fadeOut: Number(clamp(value?.fadeOut, 0, 2, fallback.fadeOut ?? 0.12).toFixed(2)),
  preserveTail: Boolean(value?.preserveTail ?? fallback.preserveTail ?? true)
})
const BUILTIN_AUDIO_PRESETS = [
  {
    key: 'builtin-communication',
    label: '通信機',
    settings: {
      voicePitch: 1,
      rate: 1,
      audioEffects: normalizeAudioEffects({
        filterEnabled: true,
        filterType: 'bandpass',
        filterFrequency: 1400,
        noiseEnabled: true,
        noiseType: 'pink',
        noiseMix: 10,
        bitCrusherEnabled: true,
        bitDepth: 5,
        bitCrusherMix: 24
      })
    }
  },
  {
    key: 'builtin-damaged',
    label: '故障ロボット',
    settings: {
      voicePitch: 0.92,
      rate: 0.9,
      audioEffects: normalizeAudioEffects({
        distortionEnabled: true,
        distortionAmount: 58,
        distortionMix: 48,
        bitCrusherEnabled: true,
        bitDepth: 3,
        bitCrusherMix: 52,
        frequencyShiftEnabled: true,
        frequencyShift: 220,
        frequencyShiftMix: 28,
        noiseEnabled: true,
        noiseMix: 18,
        variationEnabled: true,
        pitchRandom: 2.4,
        speedRandom: 18,
        volumeRandom: 16,
        variationInterval: 120
      })
    }
  },
  {
    key: 'builtin-heavy',
    label: '大型機械',
    settings: {
      voicePitch: 0.72,
      rate: 0.78,
      audioEffects: normalizeAudioEffects({
        ringModEnabled: true,
        ringModFrequency: 24,
        ringModMix: 34,
        reverbEnabled: true,
        reverbDecay: 2.6,
        reverbMix: 24,
        fadeEnabled: true,
        fadeIn: 0.04,
        fadeOut: 0.18
      })
    }
  },
  {
    key: 'builtin-electronic',
    label: '電子生命',
    settings: {
      voicePitch: 1.18,
      rate: 1.12,
      audioEffects: normalizeAudioEffects({
        frequencyShiftEnabled: true,
        frequencyShift: 140,
        frequencyShiftMix: 36,
        ringModEnabled: true,
        ringModFrequency: 68,
        ringModMix: 28,
        echoEnabled: true,
        echoDelay: 0.09,
        echoFeedback: 34,
        echoMix: 12,
        variationEnabled: true,
        pitchRandom: 1,
        speedRandom: 8,
        volumeRandom: 6,
        variationInterval: 240
      })
    }
  }
]
const normalizeEmotion = (value, fallback) => ({
  se: typeof value?.se === 'string' ? value.se : fallback.se,
  rate: clamp(value?.rate, 0.4, 1.8, fallback.rate),
  step: Math.round(clamp(value?.step, 1, 8, fallback.step)),
  fontType: Math.round(clamp(value?.fontType, 1, 6, fallback.fontType)),
  fontPreset: TEXT_FONT_PRESETS.some(option => option.key === value?.fontPreset) || value?.fontPreset === 'custom'
    ? value.fontPreset
    : (fallback.fontPreset || 'cyber'),
  customFontFamily: String(value?.customFontFamily ?? fallback.customFontFamily ?? '').slice(0, 120),
  textColor: /^#[0-9a-f]{6}$/i.test(value?.textColor)
    ? value.textColor
    : (/^#[0-9a-f]{6}$/i.test(fallback.textColor) ? fallback.textColor : '#d9f8ff'),
  fontFamily: DIALOGUE_FONT_OPTIONS.some(option => option.id === value?.fontFamily)
    ? value.fontFamily
    : (fallback.fontFamily || LEGACY_DIALOGUE_FONT_IDS[fallback.fontType] || 'consolas'),
  fontSize: Math.round(clamp(value?.fontSize, 6, 40, fallback.fontSize || 20)),
  fontWeight: Math.round(clamp(value?.fontWeight, 300, 900, fallback.fontWeight || 400) / 100) * 100,
  letterSpacing: Number(clamp(value?.letterSpacing, -1, 6, fallback.letterSpacing || 0).toFixed(1)),
  voiceMode: value?.voiceMode === 'char' ? 'char' : 'segment',
  voicePitch: clamp(value?.voicePitch, 0.6, 1.6, fallback.voicePitch),
  voiceVolume: Math.round(clamp(value?.voiceVolume, 0, 100, fallback.voiceVolume)),
  messageSpeed: Math.round(clamp(value?.messageSpeed, 0, 120, fallback.messageSpeed)),
  audioEffects: normalizeAudioEffects(value?.audioEffects, fallback.audioEffects)
})
const normalizeSettings = (source) => {
  const input = source?.typeProfiles || {}
  const result = { version: 2, typeProfiles: {}, audioPresets: {} }
  const defaultProfiles = defaultDialogueMessageSettings.typeProfiles
  const keys = [...new Set([...Object.keys(defaultProfiles), ...Object.keys(input)])]
    .sort((left, right) => Number(left) - Number(right))
  for (const type of keys) {
    const defaultProfile = defaultProfiles[type] || defaultProfiles['0']
    const profile = input[type] || defaultProfile
    const base = normalizeEmotion(profile.default, defaultProfile.default)
    result.typeProfiles[type] = {
      label: String(profile.label || defaultProfile.label),
      default: base,
      emotions: Object.fromEntries(emotionOptions.map(({ key }) => [
        key,
        normalizeEmotion(profile.emotions?.[key], base)
      ]))
    }
  }
  for (const [key, preset] of Object.entries(source?.audioPresets || {})) {
    if (!preset || typeof preset !== 'object' || !preset.settings) continue
    result.audioPresets[String(key)] = {
      label: String(preset.label || '名称未設定').slice(0, 40),
      settings: clone(preset.settings)
    }
  }
  return result
}

const draft = ref(normalizeSettings(props.settings))
const initialSettings = ref(clone(draft.value))
const selectedType = ref(Object.keys(draft.value.typeProfiles)[0] || '0')
const selectedEmotion = ref('default')
const previewName = ref('TEST-UNIT')
const previewMessage = ref('感情プロファイルを確認します。\nSEと文字送りの設定を調整してください。')
const previewSeed = ref(1)
const settingsFileInput = ref(null)
const showUtilityMenu = ref(false)
const showFontSettings = ref(false)
const fontPickerOpen = ref(false)
const addTypeDialogOpen = ref(false)
const pendingTypeKey = ref('')
const newTypeName = ref('')
const selectedAudioPreset = ref('')
const newPresetName = ref('')
const copyTargetType = ref(selectedType.value)
const copyTargetEmotion = ref('default')
const soundOptions = Object.keys(SE_SOUNDS).sort((left, right) => left.localeCompare(right, 'ja'))
const fontOptions = [
  ...VISIBLE_TEXT_FONT_PRESETS,
  { key: 'custom', label: 'カスタム指定', family: 'inherit' }
]
const typeOptions = computed(() => Object.entries(draft.value.typeProfiles)
  .sort(([left], [right]) => Number(left) - Number(right))
  .map(([key, profile]) => ({ key, label: profile.label })))
const audioPresetOptions = computed(() => [
  ...BUILTIN_AUDIO_PRESETS,
  ...Object.entries(draft.value.audioPresets || {}).map(([key, preset]) => ({
    key,
    label: preset.label,
    settings: preset.settings
  }))
])
const currentProfile = computed(() => draft.value.typeProfiles[selectedType.value])
const currentEmotion = computed(() => currentProfile.value.emotions[selectedEmotion.value])
const selectedFontLabel = computed(() => (
  fontOptions.find(font => font.key === currentEmotion.value.fontPreset)?.label || 'フォントを選択'
))
const selectedFontFamily = computed(() => {
  if (currentEmotion.value.fontPreset === 'custom') {
    return currentEmotion.value.customFontFamily || 'inherit'
  }
  return fontOptions.find(font => font.key === currentEmotion.value.fontPreset)?.family || 'inherit'
})
const selectFont = key => {
  currentEmotion.value.fontPreset = key
  fontPickerOpen.value = false
}
const formatSeName = (name) => {
  const text = String(name || '')
  return text.length <= 36 ? text : `${text.slice(0, 22)}…${text.slice(-11)}`
}
const formatPan = value => {
  const numeric = Number(value) || 0
  if (Math.abs(numeric) < 0.01) return '中央'
  return numeric < 0 ? `左 ${Math.round(Math.abs(numeric) * 100)}%` : `右 ${Math.round(numeric * 100)}%`
}
const captureAudioSettings = emotion => ({
  se: emotion.se,
  rate: emotion.rate,
  step: emotion.step,
  voiceMode: emotion.voiceMode,
  voicePitch: emotion.voicePitch,
  voiceVolume: emotion.voiceVolume,
  audioEffects: clone(emotion.audioEffects)
})
const applyAudioSettingsTo = (emotion, settings) => {
  if (typeof settings.se === 'string') emotion.se = settings.se
  if (settings.rate != null) emotion.rate = clamp(settings.rate, 0.4, 1.8, emotion.rate)
  if (settings.step != null) emotion.step = Math.round(clamp(settings.step, 1, 8, emotion.step))
  if (settings.voiceMode != null) emotion.voiceMode = settings.voiceMode === 'char' ? 'char' : 'segment'
  if (settings.voicePitch != null) emotion.voicePitch = clamp(settings.voicePitch, 0.6, 1.6, emotion.voicePitch)
  if (settings.voiceVolume != null) emotion.voiceVolume = Math.round(clamp(settings.voiceVolume, 0, 100, emotion.voiceVolume))
  if (settings.audioEffects) emotion.audioEffects = normalizeAudioEffects(settings.audioEffects, emotion.audioEffects)
}
const applyAudioPreset = () => {
  const preset = audioPresetOptions.value.find(option => option.key === selectedAudioPreset.value)
  if (!preset) return
  applyAudioSettingsTo(currentEmotion.value, preset.settings)
  replay()
}
const saveAudioPreset = () => {
  const label = newPresetName.value.trim()
  if (!label) return
  const key = `custom-${Date.now()}`
  draft.value.audioPresets[key] = {
    label,
    settings: captureAudioSettings(currentEmotion.value)
  }
  selectedAudioPreset.value = key
  newPresetName.value = ''
}
const copyAudioSettings = () => {
  const target = draft.value.typeProfiles[copyTargetType.value]?.emotions?.[copyTargetEmotion.value]
  if (!target) return
  applyAudioSettingsTo(target, captureAudioSettings(currentEmotion.value))
  if (copyTargetType.value === selectedType.value && copyTargetEmotion.value === selectedEmotion.value) replay()
}
const replay = () => { previewSeed.value += 1 }
const getNextTypeKey = () => {
  const numericKeys = Object.keys(draft.value.typeProfiles)
    .map(Number)
    .filter(Number.isFinite)
  let nextValue = Math.round(((numericKeys.length ? Math.max(...numericKeys) : 0) + 0.5) * 2) / 2
  while (draft.value.typeProfiles[String(nextValue)]) nextValue += 0.5
  return String(nextValue)
}
const openAddTypeDialog = () => {
  pendingTypeKey.value = getNextTypeKey()
  newTypeName.value = `TYPE-${pendingTypeKey.value}`
  addTypeDialogOpen.value = true
}
const confirmAddType = () => {
  const key = pendingTypeKey.value || getNextTypeKey()
  const profile = clone(currentProfile.value)
  profile.label = newTypeName.value.trim() || `TYPE-${key}`
  draft.value.typeProfiles[key] = profile
  initialSettings.value.typeProfiles[key] = clone(profile)
  selectedType.value = key
  selectedEmotion.value = 'default'
  addTypeDialogOpen.value = false
  replay()
}
const resetCurrentEmotion = () => {
  const fallback = initialSettings.value.typeProfiles[selectedType.value]?.emotions?.[selectedEmotion.value]
  if (!fallback) return
  currentProfile.value.emotions[selectedEmotion.value] = clone(fallback)
  replay()
}
const openSettingsFile = () => settingsFileInput.value?.click()
const importSettings = async event => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  try {
    draft.value = normalizeSettings(JSON.parse(await file.text()))
    initialSettings.value = clone(draft.value)
    selectedType.value = Object.keys(draft.value.typeProfiles)[0] || '0'
    selectedEmotion.value = 'default'
    replay()
  } catch {
    // Invalid JSON is ignored so the current editor work remains intact.
  }
}
const save = async () => {
  const payload = clone(draft.value)
  try {
    const response = await fetch('/api/local/dialogue-message-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: payload })
    })
    const saved = await response.json()
    if (!response.ok) throw new Error(saved.error || 'dialogueMessageSettings.jsonの保存に失敗しました')
    initialSettings.value = clone(saved)
    draft.value = normalizeSettings(saved)
    emit('apply', clone(saved))
  } catch (error) {
    window.alert(error.message || 'dialogueMessageSettings.jsonの保存に失敗しました')
  }
}
</script>

<style scoped>
.dialogue-editor { display:grid; height:100%; grid-template-rows:auto minmax(0,1fr); gap:8px; padding:10px; box-sizing:border-box; color:#d9f8ff; background:linear-gradient(180deg,rgba(4,20,31,.98),rgba(2,10,17,.98)); font-family:Consolas,monospace; font-size:14px; }
.editor-header { position:sticky; top:0; z-index:30; display:grid; grid-template-columns:auto minmax(0,1fr) 136px; align-items:end; gap:8px; padding-bottom:7px; border-bottom:1px solid rgba(126,224,245,.35); background:linear-gradient(180deg,#04141f 72%,rgba(4,20,31,.96)); }
.header-title { flex:0 0 auto; }
.editor-header p,.preview-heading p { margin:0; color:#78e8ff; font-size:10px; letter-spacing:.1em; }
.editor-header h2 { margin:2px 0 0; font-size:21px; line-height:1.05; white-space:nowrap; }
button,select,input,textarea { font:inherit; font-size:14px; }
button { min-height:34px; border:1px solid rgba(126,224,245,.55); background:rgba(8,28,40,.9); color:#d9f8ff; cursor:pointer; }
button:hover,button.active { border-color:#d8fbff; background:rgba(30,102,125,.92); }
.close-button { width:96px; min-width:0; min-height:36px; padding:4px 8px; }
.header-actions { position:relative; display:grid; grid-template-columns:36px 96px; align-items:center; gap:4px; }
.utility-button { width:36px; min-width:0; min-height:36px; padding:0; font-size:20px; line-height:1; }
.settings-file-input { display:none; }
.utility-menu { position:absolute; top:calc(100% + 6px); right:0; z-index:40; display:grid; gap:4px; width:220px; padding:7px; box-sizing:border-box; border:1px solid rgba(126,224,245,.65); background:#061722; box-shadow:0 10px 28px rgba(0,0,0,.55); }
.utility-menu button { width:100%; min-height:36px; padding:6px 10px; text-align:left; }
.header-switches { display:grid; grid-template-columns:minmax(170px,240px) minmax(170px,240px); gap:6px; }
.type-switcher,.emotion-switcher { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:6px; color:#83eafa; font-size:11px; letter-spacing:.08em; }
.type-controls,.se-controls { display:grid; grid-template-columns:minmax(0,1fr) 38px; gap:4px; min-width:0; }
.type-switcher select { min-height:36px; padding-top:5px; padding-bottom:5px; }
.compact-button { min-width:0; min-height:36px; padding:0; font-size:18px; line-height:1; }
.emotion-switcher select { min-height:36px; padding-top:5px; padding-bottom:5px; }
.editor-main { display:grid; min-height:0; }
.settings-panel,.preview-panel { min-height:0; border:1px solid rgba(126,224,245,.35); background:rgba(3,17,27,.72); }
.editor-detail { display:grid; min-height:0; grid-template-columns:minmax(300px,.8fr) minmax(340px,1.2fr); gap:8px; }
.preview-panel { position:relative; display:grid; grid-template-rows:auto auto auto minmax(0,1fr); gap:7px; padding:9px; }
.preview-heading { display:flex; align-items:center; justify-content:space-between; gap:5px; }
.font-settings-button { width:auto; min-height:30px; padding:3px 9px; font-size:12px; }
.font-settings-popover { position:absolute; top:43px; right:9px; z-index:20; display:grid; gap:7px; width:min(360px,calc(100% - 18px)); padding:9px; box-sizing:border-box; border:1px solid rgba(126,224,245,.7); background:#061722; box-shadow:0 12px 30px rgba(0,0,0,.6); }
.font-settings-popover label { gap:4px; }
.font-popover-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; padding-bottom:5px; border-bottom:1px solid rgba(126,224,245,.25); }
.font-popover-heading button { width:30px; min-width:30px; min-height:28px; padding:0; }
.font-picker-row { display:grid; grid-template-columns:92px minmax(0,1fr); align-items:center; gap:6px; color:#bdf2ff; font-size:13px; }
.font-picker-trigger { display:grid; grid-template-columns:minmax(80px,.55fr) minmax(0,1fr); align-items:center; gap:8px; min-width:0; padding:6px 8px; text-align:left; }
.font-picker-trigger strong { overflow:hidden; color:#fff0a8; text-overflow:ellipsis; white-space:nowrap; }
.font-picker-trigger > span { overflow:hidden; padding-left:8px; border-left:1px solid rgba(126,224,245,.28); text-overflow:ellipsis; white-space:nowrap; }
.custom-font-row { grid-template-columns:110px minmax(0,1fr) !important; align-items:center; }
.font-color-row { display:grid !important; grid-template-columns:92px 48px minmax(0,1fr); align-items:center; gap:6px !important; }
.font-color-row input[type='color'] { min-height:34px; padding:3px; }
.font-color-row code { overflow:hidden; color:#aef6ff; text-overflow:ellipsis; }
.font-bold-row { display:flex !important; align-items:center; gap:7px !important; }
.font-bold-row input { width:auto; }
.add-type-dialog { display:grid; gap:12px; padding:14px; color:#d9f8ff; background:linear-gradient(145deg,rgba(3,19,29,.99),rgba(7,39,52,.98)); font-family:Consolas,monospace; }
.add-type-dialog header { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.add-type-dialog header > div { min-width:0; }
.add-type-dialog header > button { flex:0 0 auto; width:auto; min-width:96px; }
.add-type-dialog header span { color:#71dff4; font-size:11px; letter-spacing:.14em; }
.add-type-dialog h2 { margin:3px 0 0; font-size:22px; }
.add-type-dialog p { margin:0; color:rgba(200,240,250,.72); font-size:13px; line-height:1.55; }
.add-type-dialog label { display:grid; gap:5px; color:#fff0a8; font-size:13px; }
.add-type-dialog button { padding:5px 12px; }
.add-type-actions { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.preview-panel label,.setting-group label { display:grid; gap:3px; margin:0; font-size:13px; color:#bdf2ff; }
input,textarea,select { box-sizing:border-box; width:100%; border:1px solid rgba(126,224,245,.5); background:rgba(5,21,31,.95); color:#e5fcff; padding:6px 8px; }
textarea { resize:vertical; }
.dialogue-preview-stage { min-height:0; display:grid; align-items:end; overflow:hidden; border:1px solid rgba(126,224,245,.25); background:radial-gradient(circle at 50% 100%,rgba(49,149,181,.18),transparent 64%),#06131d; }
.settings-panel { display:grid; grid-template-rows:minmax(0,1fr); }
.settings-scroll { overflow:auto; padding:9px; }
.setting-group { display:grid; gap:6px; }
.setting-section { margin:0; border:1px solid rgba(126,224,245,.28); background:rgba(4,21,31,.58); }
.setting-section summary { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 8px; color:#d8f8ff; font-size:13px; font-weight:700; cursor:pointer; list-style:none; user-select:none; }
.setting-section summary::-webkit-details-marker { display:none; }
.setting-section summary::after { content:'＋'; color:#78e8ff; font-size:15px; line-height:1; }
.setting-section[open] summary { border-bottom:1px solid rgba(126,224,245,.22); }
.setting-section[open] summary::after { content:'－'; }
.setting-fields { display:grid; gap:6px; padding:7px 8px 8px; }
.se-setting { gap:3px; }
.play-button { color:#fff3a6; }
.audio-effect-section { margin-top:2px; border:1px solid rgba(126,224,245,.28); background:rgba(1,13,21,.58); }
.audio-effect-section > summary { display:flex; align-items:center; justify-content:space-between; padding:7px 8px; color:#fff0a8; font-weight:700; cursor:pointer; list-style:none; }
.audio-effect-section > summary::-webkit-details-marker { display:none; }
.audio-effect-section > summary::after { content:'＋'; color:#78e8ff; }
.audio-effect-section[open] > summary::after { content:'－'; }
.audio-effect-list { display:grid; gap:6px; padding:0 7px 7px; }
.audio-effect-block { display:grid; gap:6px; padding:7px; border:1px solid rgba(126,224,245,.2); background:rgba(5,23,34,.7); }
.effect-toggle { display:flex !important; align-items:center; gap:7px !important; color:#d9f8ff !important; }
.effect-toggle input { width:auto; }
.effect-toggle strong { color:#bdf2ff; }
.preset-save-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:5px; }
.preset-save-row button { width:auto; padding:5px 10px; white-space:nowrap; }
.copy-settings-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.range-setting { display:grid !important; grid-template-columns:120px minmax(0,1fr) 68px; align-items:center; gap:6px; }
.range-setting output { text-align:right; color:#aef6ff; font-size:13px; }
.apply-button { border-color:#e7e49d; color:#fff7be; }
@media (max-width:800px) {
  .dialogue-editor { grid-template-rows:auto auto; align-content:start; overflow-y:auto; overflow-x:hidden; gap:7px; padding:7px; }
  .editor-main,.editor-detail { grid-template-columns:1fr; min-height:auto; }
  .editor-header { grid-template-columns:minmax(0,1fr) 128px; grid-template-areas:"title actions" "switches switches"; align-items:center; margin:-7px -7px 0; padding:7px 7px 6px; }
  .header-title { grid-area:title; }
  .header-switches { grid-area:switches; }
  .header-actions { grid-area:actions; grid-template-columns:36px 88px; }
  .close-button { width:88px; min-height:34px; }
  .utility-menu { width:min(220px,calc(100vw - 28px)); }
  .header-switches { grid-template-columns:minmax(130px,.8fr) minmax(0,1.4fr); }
  .type-switcher { grid-template-columns:1fr; gap:3px; }
  .type-controls { grid-template-columns:minmax(0,1fr) 38px; }
  .type-switcher span { font-size:10px; }
  .emotion-switcher { grid-template-columns:1fr; gap:3px; }
  .preview-panel { min-height:330px; }
  .font-settings-popover .range-setting { grid-template-columns:92px minmax(0,1fr) 56px; }
  .font-settings-popover .range-setting span { grid-column:auto; }
  .font-picker-row { grid-template-columns:1fr; }
  .font-picker-trigger { grid-template-columns:minmax(76px,.5fr) minmax(0,1fr); }
  .custom-font-row { grid-template-columns:1fr !important; }
  .settings-panel { min-height:390px; }
  .preset-save-row,.copy-settings-grid { grid-template-columns:1fr; }
  .range-setting { grid-template-columns:1fr 76px; }
  .range-setting span { grid-column:1 / -1; }
}
</style>
