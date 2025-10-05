<template>
  <div class="tab-panel">
    <p>手持ちタブ（仮表示）</p>
    <p>所持上限: {{ player?.maxInventory }}</p>
    <ul>
      <li v-for="(item, idx) in player?.inventory || []" :key="idx">
        {{ item.name }} × {{ item.quantity }}
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
