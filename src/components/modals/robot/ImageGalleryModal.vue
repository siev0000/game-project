<template>
  <div class="image-gallery">
    <div class="image-panel">
      <header class="panel-header">
        <h2>画像一覧ビューア</h2>
        <button class="close-button" @click="emit('close')">閉じる</button>
      </header>

      <div v-if="selectedImage" class="preview">
        <div class="preview-canvas">
          <img
            class="preview-base"
            :src="selectedImage.url"
            :alt="selectedImage.name"
            :style="imageColorStyle(selectedImage)"
          />
        </div>
        <div class="preview-meta">
          <span class="preview-name">{{ selectedImage.name }}</span>
          <span class="preview-path">{{ selectedImage.file }}</span>
        </div>
      </div>
      <div v-else class="empty-state">
        画像が見つかりません
      </div>

      <div class="controls">
        <label class="color-control">
          色を指定<input type="color" v-model="selectedColorHex" />
        </label>
        <span class="color-value">{{ selectedSetColor }}</span>
        <label class="color-control">
          Brightness
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            v-model.number="selectedBrightness"
          />
        </label>
        <span class="color-value">{{ selectedBrightness }}</span>
      </div>

      <div class="list-header">
        <span>画像リスチE</span>
        <span class="list-count">{{ images.length }} 件</span>
      </div>

      <div class="image-list">
        <button
          v-for="img in images"
          :key="img.id"
          class="image-item"
          :class="{ active: img.id === selectedId }"
          @click="selectImage(img)"
        >
          <img :src="img.url" :alt="img.name" />
          <span>{{ img.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['close'])

const rawImages = import.meta.glob(
  '/src/assets/images/illust/*.{png,jpg,jpeg,webp}',
  { eager: true, as: 'url' }
)

const normalizeName = fileName =>
  decodeURIComponent(fileName)
    .replace(/\.(png|jpe?g|webp)$/i, '')

const images = Object.entries(rawImages)
  .map(([path, url]) => {
    const file = path.split('/').pop() || ''
    return {
      id: path,
      name: normalizeName(file),
      file,
      url
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'ja'))

const selectedId = ref(images[0]?.id ?? '')
const selectedImage = computed(
  () => images.find(img => img.id === selectedId.value) ?? null
)
const selectedSetColor = ref('hue-rotate(120deg) saturate(1.2)')
const selectedColorHex = ref('#00c8ff')
const selectedBrightness = ref(1)

const imageColorStyle = image => {
  if (!image?.setColor) return null
  return { filter: image.setColor }
}

const hexToHue = hex => {
  const normalized = hex.replace("#", "")
  if (normalized.length !== 6) return 0
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  if (delta === 0) return 0
  let hue = 0
  if (max === r) hue = ((g - b) / delta) % 6
  else if (max === g) hue = (b - r) / delta + 2
  else hue = (r - g) / delta + 4
  hue = Math.round(hue * 60)
  if (hue < 0) hue += 360
  return hue
}

const buildSetColor = (hex, brightness) => {
  const hue = hexToHue(hex)
  return `hue-rotate(${hue}deg) saturate(1.2) brightness(${brightness})`
}

watch([selectedColorHex, selectedBrightness], ([color, brightness]) => {
  selectedSetColor.value = buildSetColor(color, brightness)
})

watch([selectedSetColor, selectedImage], ([color, image]) => {
  if (image) {
    image.setColor = color
    console.log('setColor', color)
  }
})

const selectImage = img => {
  selectedId.value = img.id
}
</script>

<style scoped>
.image-gallery {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(0, 120, 170, 0.2), transparent 55%),
    radial-gradient(circle at 80% 70%, rgba(0, 60, 90, 0.35), transparent 60%),
    #050b12;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #c8f8ff;
  font-family: Consolas, "Courier New", monospace;
}

.image-panel {
  width: min(980px, 92vw);
  max-height: 1000px;
  background: rgba(8, 18, 28, 0.94);
  border: 1px solid rgba(90, 220, 255, 0.4);
  box-shadow: 0 0 30px rgba(0, 160, 200, 0.25);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(90, 220, 255, 0.25);
  padding-bottom: 8px;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 2px;
}

.close-button {
  background: transparent;
  border: 1px solid rgba(90, 220, 255, 0.5);
  color: #c8f8ff;
  padding: 6px 14px;
  cursor: pointer;
  border-radius: 6px;
}

.close-button:hover {
  background: rgba(90, 220, 255, 0.15);
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-canvas {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid rgba(90, 220, 255, 0.25);
  overflow: hidden;
  display: grid;
  place-items: center;
}

.preview-base {
  width: 100%;
  height: 400px;
  object-fit: contain;
}



.preview-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  opacity: 0.85;
  gap: 10px;
}

.preview-name {
  font-weight: 600;
}

.preview-path {
  opacity: 0.7;
}

.empty-state {
  padding: 24px;
  text-align: center;
  border: 1px dashed rgba(90, 220, 255, 0.25);
  border-radius: 12px;
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.color-control {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.color-control input[type="color"] {
  width: 40px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.color-control input[type="range"] {
  width: 160px;
}

.color-value {
  font-size: 12px;
  opacity: 0.8;
}

.list-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
}

.list-count {
  font-size: 12px;
}

.image-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  overflow: auto;
  padding-right: 6px;
}

.image-item {
  background: rgba(8, 24, 36, 0.9);
  border: 1px solid rgba(90, 220, 255, 0.2);
  color: inherit;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  gap: 6px;
  text-align: left;
}

.image-item img {
  width: 100%;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
}

.image-item span {
  font-size: 11px;
  line-height: 1.2;
}

.image-item.active {
  border-color: rgba(140, 255, 255, 0.8);
  box-shadow: 0 0 12px rgba(120, 240, 255, 0.35);
}

@media (max-width: 920px) {
  .image-panel {
    padding: 16px;
  }

  .preview-canvas {
    aspect-ratio: 5 / 4;
  }

  .image-list {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  }
}
</style>






