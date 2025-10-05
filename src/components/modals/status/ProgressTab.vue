<template>
  <div class="tab-panel">
    <p>進行タブ（仮表示）</p>
    <p>転移可能な街:</p>
    <ul>
      <li v-for="town in player?.memoryStreet || []" :key="town">{{ town }}</li>
    </ul>
    <p>クエスト進行:</p>
    <ul>
      <li v-for="q in player?.questProgress || []" :key="q.id">
        {{ q.id }}: {{ q.state }}
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
