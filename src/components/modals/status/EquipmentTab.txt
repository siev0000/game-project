<template>
  <div class="tab-panel">
    <p>装備タブ（仮表示）</p>
    <ul>
      <li v-for="(val, key) in character?.equipmentSlot || {}" :key="key">
        {{ key }}: {{ val || 'なし' }}
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  character: { type: Object, required: true },
  player: { type: Object, required: true }
});
</script>
