<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <!-- ヘッダー -->
      <div class="character-header">
        <button @click="prevCharacter" class="arrow-btn">〈</button>
        <div class="character-info">
          <img :src="getRollIcon(currentRace)" alt="種族" class="icon" />
          <img :src="getRollIcon(currentClass)" alt="クラス" class="icon" />
          <span class="name">{{ currentCharacter.name }}</span>
          <span class="level-tag">Lv {{ currentCharacter.stats.allLv }}</span>
        </div>
        <button @click="nextCharacter" class="arrow-btn">〉</button>
      </div>

      <!-- タブバー -->
      <div class="tab-bar">
        <div v-for="tab in tabs" :key="tab.name"
             :class="['tab-btn', { active: currentTab === tab.name }]"
             @click="currentTab = tab.name">
          <div class="tab-icon">{{ tab.icon }}</div>
          <div class="tab-label">{{ tab.label }}</div>
        </div>
      </div>

      <!-- タブ内容 -->
      <div class="tab-content">
        <component :is="currentTabComponent"
                   :character="currentCharacter"
                   :player="character" />
      </div>

      <!-- フッター -->
      <div class="footer">
        <button class="btn confirm" @click="ok">冒険を続ける</button>
        <button class="btn cancel" @click="close">選択に戻る</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { getRollIcon } from "@/constants/statData";

// 各タブコンポーネントを読み込み
import BaseTab from "./status/BaseTab.vue";
import StatsTab from "./status/StatsTab.vue";
import SkillsTab from "./status/SkillsTab.vue";
import EquipmentTab from "./status/EquipmentTab.vue";
import InventoryTab from "./status/InventoryTab.vue";
import ProgressTab from "./status/ProgressTab.vue";

export default {
  name: "CharacterStatusModal",
  props: { character: { type: Object, required: true } },
  emits: ["close", "ok"],
  setup(props, { emit }) {
    const index = ref(0);
    const currentTab = ref("基本");

    const tabs = [
      { name: "基本", label: "基本", icon: "👤", component: BaseTab },
      { name: "ステータス", label: "ステータス", icon: "⚔️", component: StatsTab },
      { name: "技", label: "技", icon: "📖", component: SkillsTab },
      // { name: "装備", label: "装備", icon: "🛡️", component: EquipmentTab },
      { name: "手持ち", label: "手持ち", icon: "🎒", component: InventoryTab },
      { name: "進行", label: "進行", icon: "🗺️", component: ProgressTab },
    ];

    const party = computed(() => props.character?.party ?? []);
    const currentCharacter = computed(() => party.value[index.value] || {});
    const currentRace = computed(() => currentCharacter.value?.Role?.[0]?.roleName || "");
    const currentClass = computed(() => currentCharacter.value?.Role?.[1]?.roleName || "");

    const currentTabComponent = computed(() => {
      const tab = tabs.find(t => t.name === currentTab.value);
      return tab ? tab.component : null;
    });


    return {
      index, currentTab, tabs,
      currentCharacter, currentRace, currentClass,
      currentTabComponent,
      getRollIcon,
      prevCharacter: () => { if (index.value > 0) index.value--; },
      nextCharacter: () => { if (index.value < party.value.length - 1) index.value++; },
      close: () => emit("close"),
      ok: () => emit("ok", currentCharacter.value),
    };
  },
};
</script>


<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex; justify-content: center; align-items: center;
}
.modal-content {
  /* width: 720px; height: 1220px; */
  width: 720px; height: 1240px;
  background: url('/src/assets/images/illust/帰巣本能.webp');
  background-size: cover;
  border: 12px solid #5b3a1a;
  border-radius: 16px;
  display: flex; flex-direction: column;
  font-family: "Georgia", serif;
  color: #2b1a0f;
  margin-bottom: 60px;
  padding: 5px;
}
/* .modal-content::before {
  content: "";
  position: absolute;
  inset: 0;
  background: url('/src/assets/images/frame-border.png') no-repeat center/100% 100%;
  pointer-events: none;
} */
.character-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px;
  background: #4d3216; color: #f0e6d2;
}
.character-info { display: flex; align-items: center; gap: 2px; }
.icon { width: 75px; height: 75px; }
.name { 
  width: 360px; font-size: 28px; font-weight: bold; color: #f6e6b5; 
  flex: 1;
  white-space: nowrap;    /* ← 折り返し禁止 */
  overflow: hidden;       /* ← はみ出し制御（お好みで） */
  text-overflow: ellipsis;/* ← 長すぎる場合「…」表示（任意） */
}
.level-tag { 
  width: 95px; background: #d9c087; padding: 2px 6px; border-radius: 6px; 
  flex-shrink: 0;
  font-size: 30px;
  font-weight: 600;
  /* 改行させない */
  white-space: nowrap;
  /* 黒縁取り（上下左右4方向に影を付ける） */
  -webkit-text-stroke: 2px #867d00;
}
.tab-bar {
  font-size: 25px;
  display: flex; justify-content: space-around;
  background: #3a2612; padding: 6px 0;
}
.tab-icon{
  font-size: 25px;
}
.tab-btn {
  display: flex; flex-direction: column; align-items: center;
  color: #e6d5a3; font-size: 14px; cursor: pointer;
}
.tab-btn.active { color: #fff; font-weight: bold; text-shadow: 0 0 6px #ffd700; }
.tab-content { flex: 1; padding: 5px 7px; overflow-y: auto; }
.tab-panel {
  background: rgba(255,255,240,0.9);
  border: 2px solid #8b5a2b;
  padding: 12px; border-radius: 8px;
}
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.footer {
  display: flex; justify-content: space-around; padding: 6px;
  padding-bottom: 1px;
  background: #4d3216;
}
.btn {
  min-width: 140px; padding: 10px 18px;
  min-height: 45px;
  font-size: 18px; cursor: pointer;
  border-radius: 8px; border: none;
  margin-bottom: 0px;
}
.confirm { background: #2f6b2f; color: #fff; }
.cancel { background: #8b2f2f; color: #fff; }
.arrow-btn {
  background: none; border: none; font-size: 28px;
  cursor: pointer; color: #f6e6b5;
}
</style>
