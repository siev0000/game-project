<template>
  <div class="tab-panel equipment-tab">
    <h3 class="tab-title">装備中一覧</h3>

    <ul class="equipment-list">
      <li
        v-for="slot in slotOrder"
        :key="slot"
        class="equipment-slot"
      >
        <span class="slot-name">{{ slot }}</span>

        <template v-if="getEquippedItem(slot)">
          <span class="slot-item">
            {{ getEquippedItem(slot).名前 }}
            <small v-if="getEquippedItem(slot).素材">
              （{{ getEquippedItem(slot).素材 }}）
            </small>
          </span>
        </template>

        <span v-else class="slot-empty">なし</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  character: { type: Object, required: true },
  player: { type: Object, required: true },
});

// 装備スロット順
const slotOrder = ["武器", "武器2", "頭", "体", "足", "装飾", "装飾2"];

// インベントリ内から装備中のアイテムだけを抽出してマップ化
const equippedItems = computed(() => {
  const inv = props.character?.inventory || [];
  const result = {};

  for (const item of inv) {
    if (item?.装備中 && slotOrder.includes(item.装備中)) {
      result[item.装備中] = item;
    }
  }
  return result;
});

// 指定スロットの装備を取得
const getEquippedItem = (slot) => equippedItems.value[slot] || null;
</script>

<style scoped>
.equipment-tab {
  background: rgba(255, 255, 240, 0.9);
  border: 2px solid #8b5a2b;
  border-radius: 8px;
  padding: 10px;
  color: #3b2f1c;
  height: 930px;
}

.tab-title {
  font-size: 24px;
  font-weight: bold;
  color: #8b5a2b;
  margin-bottom: 8px;
  text-align: center;
}

.equipment-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.equipment-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(139, 90, 43, 0.3);
  font-size: 22px;
}

.slot-name {
  font-weight: bold;
  color: #5e4630;
  width: 100px;
}

.slot-item {
  color: #000;
  font-weight: 500;
}

.slot-empty {
  color: #777;
  font-style: italic;
}
</style>
