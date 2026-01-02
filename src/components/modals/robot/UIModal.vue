<template>
  <div class="ui-modal">
    <div class="hud-root">
      <div
        class="hud-panel"
        :class="{
          'eye-opening': eyeOpen,
          'damage-flash': damageFlash,
          shake: shakeView
        }"
      >
        <div class="hud-glow"></div>
        <div class="hud-corners"></div>
        <div class="hud-notch"></div>
        <div class="hud-scanlines"></div>
        <div class="hud-noise"></div>
        <div class="hud-lids"></div>
        <div class="hud-readout">ROBOT VISION</div>
      </div>

      <div class="hud-controls">
        <button @click="$emit('close')">閉じる</button>
        <button @click="triggerEyeOpen">眼を開く</button>
        <button @click="triggerDamage">ダメージ</button>
        <button @click="triggerShake">揺れ</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineEmits(['close'])

const eyeOpen = ref(false)
const damageFlash = ref(false)
const shakeView = ref(false)

const triggerEyeOpen = () => {
  eyeOpen.value = false
  requestAnimationFrame(() => {
    eyeOpen.value = true
    setTimeout(() => {
      eyeOpen.value = false
    }, 700)
  })
}

const triggerDamage = () => {
  damageFlash.value = true
  setTimeout(() => {
    damageFlash.value = false
  }, 300)
}

const triggerShake = () => {
  shakeView.value = true
  setTimeout(() => {
    shakeView.value = false
  }, 450)
}
</script>

<style scoped>
.ui-modal {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 50% 40%, #0b1423 0%, #060a12 55%, #04070d 100%);
}

.hud-root {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #8fefff;
  font-family: Consolas, monospace;
  pointer-events: none;
}

.hud-panel {
  width: min(520px, 82vw);
  height: min(220px, 36vw);
  position: relative;
  background: linear-gradient(135deg, rgba(10, 20, 36, 0.9), rgba(6, 12, 24, 0.95));
  border-radius: 12px;
  box-shadow:
    inset 0 0 18px rgba(0, 220, 255, 0.12),
    0 0 24px rgba(0, 220, 255, 0.25);
  overflow: hidden;
}

.hud-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid rgba(0, 220, 255, 0.8);
  border-radius: 12px;
  clip-path: polygon(
    0 12%,
    6% 0,
    94% 0,
    100% 12%,
    100% 88%,
    94% 100%,
    6% 100%,
    0 88%
  );
}

.hud-glow {
  position: absolute;
  inset: -10%;
  border-radius: 18px;
  background: radial-gradient(circle at 30% 40%, rgba(0, 240, 255, 0.2), transparent 55%),
    radial-gradient(circle at 80% 70%, rgba(0, 170, 255, 0.15), transparent 60%);
  filter: blur(8px);
}

.hud-corners {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(#6ffbff, #6ffbff) top left / 40px 2px no-repeat,
    linear-gradient(#6ffbff, #6ffbff) top right / 40px 2px no-repeat,
    linear-gradient(#6ffbff, #6ffbff) bottom left / 40px 2px no-repeat,
    linear-gradient(#6ffbff, #6ffbff) bottom right / 40px 2px no-repeat,
    linear-gradient(#6ffbff, #6ffbff) top left / 2px 40px no-repeat,
    linear-gradient(#6ffbff, #6ffbff) top right / 2px 40px no-repeat,
    linear-gradient(#6ffbff, #6ffbff) bottom left / 2px 40px no-repeat,
    linear-gradient(#6ffbff, #6ffbff) bottom right / 2px 40px no-repeat;
  opacity: 0.9;
}

.hud-notch {
  position: absolute;
  left: 12%;
  bottom: 8%;
  width: 28%;
  height: 16%;
  border: 2px solid rgba(0, 220, 255, 0.8);
  border-left: none;
  border-radius: 0 8px 8px 0;
  background: linear-gradient(90deg, rgba(0, 220, 255, 0.12), transparent);
}

.hud-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 200, 255, 0.08),
    rgba(0, 200, 255, 0.08) 2px,
    transparent 2px,
    transparent 6px
  );
  mix-blend-mode: screen;
  opacity: 0.25;
}

.hud-noise {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 3px 3px;
  opacity: 0.2;
}

.hud-lids {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, rgba(3, 8, 14, 0.95) 0 50%, transparent 50% 100%),
    linear-gradient(to top, rgba(3, 8, 14, 0.95) 0 50%, transparent 50% 100%);
  transform-origin: center;
  transform: scaleY(0);
  opacity: 0;
}

.hud-readout {
  position: absolute;
  top: 12%;
  right: 10%;
  font-size: 12px;
  letter-spacing: 3px;
  color: rgba(140, 250, 255, 0.85);
  text-shadow: 0 0 8px rgba(0, 220, 255, 0.4);
}

.hud-controls {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  width: min(520px, 82vw);
  pointer-events: auto;
}

.hud-controls button {
  padding: 8px 6px;
  background: rgba(6, 16, 26, 0.95);
  border: 1px solid rgba(120, 240, 255, 0.7);
  color: #8fefff;
  font-family: Consolas, monospace;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 220, 255, 0.2);
}

.hud-controls button:hover {
  background: rgba(10, 26, 40, 0.95);
}

.eye-opening .hud-lids {
  animation: eyeOpen 0.7s ease-out;
}

.damage-flash::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(255, 60, 60, 0.2);
  box-shadow: inset 0 0 40px rgba(255, 40, 40, 0.35);
}

.shake {
  animation: shake 0.45s ease-in-out;
}

@keyframes eyeOpen {
  0% {
    opacity: 1;
    transform: scaleY(1);
  }
  70% {
    opacity: 1;
    transform: scaleY(0.2);
  }
  100% {
    opacity: 0;
    transform: scaleY(0);
  }
}

@keyframes shake {
  0% { transform: translate(0, 0); }
  20% { transform: translate(-4px, 2px); }
  40% { transform: translate(3px, -3px); }
  60% { transform: translate(-2px, 3px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0, 0); }
}
</style>
