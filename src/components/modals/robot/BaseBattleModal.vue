<template>
  <div class="modal-overlay">
    <div class="battle-modal">
      <slot />
      <button class="close-btn" @click="$emit('close')">
        EXIT BATTLE
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.battle-modal {
  width: 700px;
  height: 1200px;
  top: -25px;
  background: linear-gradient(
    180deg,
    rgba(10, 25, 35, 0.97),
    rgba(5, 15, 25, 0.97)
  );
  border: 2px solid #3aaed8;
  box-shadow:
    0 0 30px rgba(0, 200, 255, 0.35),
    inset 0 0 20px rgba(0, 255, 255, 0.1);
  padding: 8px;
  position: relative;
}

.close-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 6px 10px;
  background: linear-gradient(#1f4f66, #122c3a);
  border: 1px solid #4cc9f0;
  color: #e6fcff;
  font-family: Consolas, monospace;
  font-size: 12px;
  cursor: pointer;
}
</style>
