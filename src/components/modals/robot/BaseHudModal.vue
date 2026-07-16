<template>
  <div class="modal-overlay" @click.self="closeOnOverlay && $emit('close')">
    <div
      class="modal-frame"
      :style="{
        width: frameWidth,
        height: frameHeight,
        maxHeight: frameMaxHeight,
        overflow: frameOverflow,
        transform: `scale(${frameScale})`
      }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  closeOnOverlay: { type: Boolean, default: true },
  frameWidth: { type: String, default: '680px' },
  frameHeight: { type: String, default: 'auto' },
  frameMaxHeight: { type: String, default: '1200px' },
  frameScale: { type: Number, default: 1 },
  frameOverflow: { type: String, default: 'auto' }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 5, 10, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  /* 戦闘モーダルより前面に出す設定画面用のレイヤー。 */
  z-index: 3000;
}

.modal-frame {
  flex: 0 0 auto;
  width: 680px;
  max-height: 1200px;
  overflow-y: auto;
  transform-origin: center center;

  background: rgba(10, 20, 30, 0.95);
  border: 2px solid #3aaed8;
  box-shadow:
    0 0 25px rgba(58, 174, 216, 0.45),
    inset 0 0 12px rgba(0, 255, 255, 0.1);
}
</style>
