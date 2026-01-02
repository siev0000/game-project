<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-panel">
      <h3>SYSTEM WORLD OVERVIEW</h3>

      <div class="content">
        <p>この世界は複数のレイヤーで構成されています。</p>
        <p>有機生命・無機存在・人工意識が共存しています。</p>
        <p>プレイヤーは「観測者」として介入します。</p>
      </div>

      <button @click="$emit('close')">CLOSE</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-panel {
  width: 600px;
  padding: 20px;
  background: linear-gradient(#0b1a22, #050c10);
  border: 2px solid #3aaed8;
  color: #aefcff;
  font-family: Consolas, monospace;
}
</style>
