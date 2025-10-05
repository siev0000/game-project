<template>
  <div class="tab-panel">
    <p>ステータスタブ（仮表示）</p>
    <p>Lv: {{ character?.stats?.allLv }}</p>
  </div>
</template>

<script setup>
defineProps({
  character: { type: Object, required: true },
  player: { type: Object, required: true }
});
</script>
