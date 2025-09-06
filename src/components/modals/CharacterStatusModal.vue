<template>
  <div class="modal">
    <div class="modal-content">
      <h2>{{ character.name }} のステータス</h2>
      <p>Lv: {{ character.party[0].stats.allLv }}</p>

      <button @click="$emit('ok', character)">OK</button>
      <button @click="$emit('close')">閉じる</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "CharacterStatusModal",
  props: {
    character: { type: Object, required: true }
  }
};
</script>
