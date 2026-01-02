<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-frame">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 5, 10, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-frame {
  width: 680px;
  max-height: 1200px;
  overflow-y: auto;

  background: rgba(10, 20, 30, 0.95);
  border: 2px solid #3aaed8;
  box-shadow:
    0 0 25px rgba(58, 174, 216, 0.45),
    inset 0 0 12px rgba(0, 255, 255, 0.1);
}
</style>
