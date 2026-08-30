<template>
  <BaseHudModal
    frame-width="min(680px, calc(100vw - 16px))"
    frame-height="min(900px, calc(100dvh - 16px))"
    frame-max-height="none"
    frame-overflow="hidden"
    :close-on-overlay="false"
    @close="$emit('close')"
  >
    <div class="font-select-modal">
      <header class="font-select-header">
        <div>
          <span>TEXT FONT</span>
          <h2>フォントを選択</h2>
        </div>
        <button type="button" @click="$emit('close')">閉じる</button>
      </header>

      <p>{{ description }}</p>

      <div class="font-select-list">
        <button
          v-for="font in fonts"
          :key="font.key"
          type="button"
          class="font-select-card"
          :class="{ selected: selectedKey === font.key }"
          @click="$emit('select', font.key)"
        >
          <span class="font-card-meta">
            <strong>{{ font.label }}</strong>
            <small>{{ font.category }}</small>
          </span>
          <span class="font-card-sample" :style="{ fontFamily: font.family }">
            {{ sampleFor(font.key) }}
          </span>
        </button>

        <button
          type="button"
          class="font-select-card"
          :class="{ selected: selectedKey === 'custom' }"
          @click="$emit('select', 'custom')"
        >
          <span class="font-card-meta">
            <strong>カスタム指定</strong>
            <small>入力したfont-family</small>
          </span>
          <span class="font-card-sample" :style="{ fontFamily: customFamily || 'inherit' }">
            魔法陣 TARGET 123
          </span>
        </button>
      </div>
    </div>
  </BaseHudModal>
</template>

<script setup>
import BaseHudModal from './BaseHudModal.vue'
import { VISIBLE_TEXT_FONT_PRESETS } from '../data/textFontPresets.js'

defineProps({
  selectedKey: {
    type: String,
    default: 'standard'
  },
  customFamily: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: 'カード内の文字が実際の表示例です。選択するとすぐ文字レイヤーへ反映します。'
  }
})

defineEmits(['close', 'select'])

const fonts = VISIBLE_TEXT_FONT_PRESETS
const runeFonts = new Set(['rune'])
const symbolFonts = new Set(['magicRing', 'alienScript', 'isekai'])
const japaneseFonts = new Set(['standard', 'jpMagic', 'nekoNoMezame'])
const sampleFor = key => {
  if (runeFonts.has(key)) return 'ᚠᚢᚦᚨᚱᚲ'
  if (symbolFonts.has(key)) return 'MAGIC 123'
  if (japaneseFonts.has(key)) return '魔法陣 ターゲット'
  return 'MAGIC TARGET 123'
}
</script>

<style scoped>
.font-select-modal {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 10px;
  width: 100%;
  height: 100%;
  padding: 14px;
  overflow: hidden;
  color: #d7f7ff;
  background:
    linear-gradient(145deg, rgba(3, 19, 29, .99), rgba(7, 39, 52, .98)),
    repeating-linear-gradient(0deg, transparent 0 9px, rgba(112, 231, 255, .035) 9px 10px);
  font-family: Consolas, monospace;
}
.font-select-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.font-select-header span {
  color: #71dff4;
  font-size: 12px;
  letter-spacing: .16em;
}
.font-select-header h2 { margin: 3px 0 0; font-size: 24px; }
.font-select-header button {
  min-height: 40px;
  padding: 5px 12px;
  border: 1px solid rgba(126, 224, 245, .5);
  background: rgba(8, 28, 40, .9);
  color: #d7f7ff;
}
.font-select-modal > p {
  margin: 0;
  color: rgba(200, 240, 250, .72);
  font-size: 13px;
}
.font-select-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 4px 2px 2px;
}
.font-select-card {
  display: grid;
  grid-template-rows: auto minmax(62px, 1fr);
  min-width: 0;
  min-height: 118px;
  padding: 9px 10px;
  overflow: hidden;
  border: 1px solid rgba(126, 224, 245, .3);
  background: rgba(5, 23, 34, .8);
  color: #d7f7ff;
  text-align: left;
}
.font-select-card.selected {
  border-color: #fff0a8;
  background: rgba(34, 112, 134, .55);
  box-shadow: 0 0 12px rgba(89, 220, 250, .3);
}
.font-card-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.font-card-meta strong {
  overflow: hidden;
  color: #fff0a8;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.font-card-meta small {
  flex: 0 1 auto;
  overflow: hidden;
  color: rgba(200, 240, 250, .62);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.font-card-sample {
  display: grid;
  place-items: center;
  min-width: 0;
  margin-top: 7px;
  overflow: hidden;
  border-top: 1px solid rgba(126, 224, 245, .2);
  color: #effeff;
  font-size: 24px;
  line-height: 1.15;
  text-align: center;
  text-shadow: 0 0 10px rgba(95, 229, 255, .68);
  white-space: nowrap;
}
@media (max-width: 560px) {
  .font-select-modal { padding: 9px; gap: 7px; }
  .font-select-header h2 { font-size: 20px; }
  .font-select-list { grid-template-columns: 1fr; }
  .font-select-card {
    grid-template-rows: auto minmax(52px, 1fr);
    min-height: 102px;
  }
  .font-card-sample { font-size: 21px; }
}
</style>
