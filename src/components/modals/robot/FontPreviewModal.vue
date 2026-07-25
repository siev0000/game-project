<template>
  <Teleport to="body">
    <BaseHudModal
      frame-width="min(980px, calc(100vw - 16px))"
      frame-height="min(920px, calc(100dvh - 16px))"
      frame-max-height="none"
      frame-overflow="hidden"
      :close-on-overlay="false"
      @close="$emit('close')"
    >
      <div class="font-preview-modal">
        <header class="font-preview-header">
          <div>
            <span class="font-preview-kicker">FONT LAB</span>
            <h2>フォント確認</h2>
          </div>
          <button type="button" @click="$emit('close')">閉じる</button>
        </header>

        <section class="font-preview-controls">
          <label>
            <span>確認する文字</span>
            <input v-model="previewText" type="text" maxlength="64" @input="sanitizePreviewText" />
          </label>
          <label>
            <span>サイズ</span>
            <input v-model.number="previewSize" type="range" min="12" max="64" step="1" />
            <output>{{ previewSize }}px</output>
          </label>
          <label>
            <span>太さ</span>
            <select v-model="previewWeight">
              <option value="normal">標準</option>
              <option value="bold">太字</option>
            </select>
          </label>
          <label>
            <span>カスタムフォント</span>
            <input v-model="customFontFamily" type="text" placeholder='例: "Cinzel Decorative", serif' />
          </label>
        </section>

        <p class="font-preview-note">候補を見比べるための画面です。実際の文字レイヤー設定はターゲットマーカー作成画面から行います。</p>

        <main class="font-preview-list">
          <article
            v-for="font in textFontPresets"
            :key="font.key"
            class="font-preview-card"
            :class="{ selected: selectedFontKey === font.key }"
            @click="selectFont(font.key)"
          >
            <header>
              <div>
                <strong>{{ font.label }}</strong>
                <small>{{ font.category }}</small>
              </div>
              <code>{{ font.family }}</code>
            </header>
            <div
              class="font-preview-sample"
              :style="sampleStyle(font.family)"
            >
              {{ previewText || 'TARGET LOCKED' }}
            </div>
          </article>

          <article class="font-preview-card custom-card" :class="{ selected: selectedFontKey === 'custom' }" @click="selectedFontKey = 'custom'">
            <header>
              <div>
                <strong>入力フォント</strong>
                <small>カスタム指定</small>
              </div>
              <code>{{ customFontFamily || '未指定' }}</code>
            </header>
            <div class="font-preview-sample" :style="sampleStyle(customFontFamily, true)">
              {{ previewText || 'TARGET LOCKED' }}
            </div>
          </article>
        </main>
      </div>
    </BaseHudModal>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import BaseHudModal from './BaseHudModal.vue'
import { VISIBLE_TEXT_FONT_PRESETS } from '../data/textFontPresets.js'

defineEmits(['close'])

const textFontPresets = VISIBLE_TEXT_FONT_PRESETS
const selectedFontKey = ref('cyber')
const previewText = ref('TARGET LOCKED')
const previewSize = ref(30)
const previewWeight = ref('bold')
const customFontFamily = ref('')
const isRuneFont = key => ['rune', 'runeJs'].includes(key)
const sanitizeRuneText = value => Array.from(String(value || ''))
  .filter(character => /[\u16A0-\u16FF\s]/u.test(character))
  .join('')
const selectFont = key => {
  selectedFontKey.value = key
  if (isRuneFont(key)) {
    const sanitized = sanitizeRuneText(previewText.value)
    previewText.value = sanitized.trim() ? sanitized : 'ᚠᚢᚦᚨᚱᚲ'
  }
}
const sanitizePreviewText = event => {
  if (!isRuneFont(selectedFontKey.value)) return
  event.target.value = sanitizeRuneText(event.target.value)
  previewText.value = event.target.value
}
const sampleStyle = (family, isCustom = false) => ({
  fontFamily: isCustom && customFontFamily.value.trim()
    ? customFontFamily.value.trim()
    : family,
  fontSize: `${previewSize.value}px`,
  fontWeight: previewWeight.value
})
</script>

<style scoped>
.font-preview-modal {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow: hidden;
  color: #d7f7ff;
  background:
    linear-gradient(135deg, rgba(3, 19, 29, .98), rgba(7, 39, 52, .96)),
    repeating-linear-gradient(0deg, transparent 0 9px, rgba(112, 231, 255, .035) 9px 10px);
  font-family: Consolas, monospace;
}
.font-preview-header,
.font-preview-controls,
.font-preview-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.font-preview-header { min-height: 48px; }
.font-preview-header > button {
  width: auto;
  flex: 0 0 auto;
  white-space: nowrap;
}
.font-preview-kicker {
  color: #71dff4;
  font-size: 13px;
  letter-spacing: .16em;
}
h2 { margin: 2px 0 0; font-size: 28px; }
button,
input,
select { font: inherit; }
button,
select,
input[type='text'] {
  min-height: 42px;
  border: 1px solid rgba(126, 224, 245, .5);
  background: rgba(8, 28, 40, .9);
  color: #d7f7ff;
}
button { padding: 6px 14px; cursor: pointer; }
input[type='text'],
select { box-sizing: border-box; width: 100%; padding: 6px 10px; }
.font-preview-controls {
  display: grid;
  grid-template-columns: minmax(180px, 1.5fr) minmax(150px, 1fr) 120px minmax(180px, 1fr);
  align-items: end;
  padding: 10px;
  border: 1px solid rgba(126, 224, 245, .28);
  background: rgba(2, 14, 23, .72);
}
.font-preview-controls label {
  display: grid;
  gap: 5px;
  min-width: 0;
  color: #fff0a8;
  font-size: 13px;
}
.font-preview-controls output { color: #9fefff; text-align: right; }
.font-preview-note { margin: 0; color: rgba(200, 240, 250, .7); font-size: 14px; }
.font-preview-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}
.font-preview-card {
  box-sizing: border-box;
  min-width: 0;
  min-height: 136px;
  padding: 10px 12px;
  border: 1px solid rgba(126, 224, 245, .28);
  background: rgba(5, 23, 34, .78);
  cursor: pointer;
}
.font-preview-card.selected {
  border-color: #c4faff;
  background: rgba(34, 112, 134, .48);
  box-shadow: 0 0 12px rgba(89, 220, 250, .28);
}
.font-preview-card header {
  align-items: start;
  min-width: 0;
}
.font-preview-card header div {
  display: grid;
  min-width: 0;
  gap: 3px;
}
.font-preview-card strong,
.font-preview-card small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.font-preview-card strong {
  color: #fff0a8;
  font-size: 16px;
  line-height: 1.25;
}
.font-preview-card small {
  color: rgba(200, 240, 250, .64);
  font-size: 13px;
  line-height: 1.25;
}
.font-preview-card code {
  display: block;
  max-width: 48%;
  overflow: hidden;
  color: rgba(159, 239, 255, .7);
  font-size: 11px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.font-preview-sample {
  display: grid;
  min-height: 74px;
  margin-top: 10px;
  place-items: center;
  overflow: hidden;
  border-top: 1px solid rgba(126, 224, 245, .2);
  color: #e9fdff;
  text-align: center;
  text-shadow: 0 0 12px rgba(95, 229, 255, .72);
  white-space: nowrap;
  line-height: 1.1;
}
@media (max-width: 700px) {
  .font-preview-modal { padding: 10px; gap: 8px; }
  .font-preview-header { min-height: 40px; }
  h2 { font-size: 21px; }
  .font-preview-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .font-preview-list { grid-template-columns: 1fr; }
  .font-preview-card { min-height: 126px; padding: 9px 10px; }
  .font-preview-card code { max-width: 42%; }
  .font-preview-sample { min-height: 66px; margin-top: 8px; }
}
</style>
