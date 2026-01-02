<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-panel">
      <h3>OPERATION MANUAL</h3>

      <div class="content">
        <p>▶ ユニットを選択して行動を決定します</p>
        <p>▶ 行動はスキル・装備・状況に依存します</p>
        <p>▶ 数値は確率ではなく判定式で処理されます</p>
        <p>▶ ランダム性は極力排除されています</p>
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

h3 {
  text-align: center;
  margin-bottom: 15px;
}

.content p {
  margin: 6px 0;
}

button {
  margin-top: 15px;
  width: 100%;
  padding: 8px;
  background: #1f4f66;
  border: 1px solid #4cc9f0;
  color: #e6fcff;
  cursor: pointer;
}
</style>
