<template>
  <div class="modal-overlay">
    <div class="modal-content" :class="`theme-${theme}`">
      <!-- ヘッダー -->
      <div class="character-header">
        <button @click="prevCharacter" class="arrow-btn">〈</button>
        <div class="character-info">
          <img v-if="getRollIcon(currentRace)" :src="getRollIcon(currentRace)" :alt="currentRace" class="icon" />
          <span v-else class="role-fallback" aria-label="種族">Ω</span>
          <img v-if="getRollIcon(currentClass)" :src="getRollIcon(currentClass)" :alt="currentClass" class="icon" />
          <span v-else class="role-fallback role-fallback-class" aria-label="クラス">—</span>
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
                   :player="character"
                   :theme="theme" />
      </div>

      <!-- フッター -->
      <div class="footer">
        <button class="btn confirm" @click="ok">{{ confirmLabel }}</button>
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
  props: {
    character: { type: Object, required: true },
    theme: { type: String, default: 'fantasy', validator: value => ['fantasy', 'machine'].includes(value) },
    confirmLabel: { type: String, default: '冒険を続ける' }
  },
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
  width: 720px; height: 1200px;
  background: url('/src/assets/images/illust/帰巣本能.webp');
  background-size: cover;
  border: 4px solid #5b3a1a;
  border-radius: 16px;
  display: flex; flex-direction: column;
  font-family: "Georgia", serif;
  color: #2b1a0f;
  margin-bottom: 60px;
  padding: 5px;
  margin-top: -15px;
}
.modal-content.theme-machine {
  background: linear-gradient(145deg, rgba(7, 24, 36, .96), rgba(15, 55, 73, .96));
  border-color: #3ec4de;
  color: #e7fbff;
  font-family: "Consolas", "Courier New", monospace;
  box-shadow: 0 0 32px rgba(74, 216, 240, .35);
  border-width: 3px;
}
.theme-machine .character-header, .theme-machine .footer, .theme-machine .tab-bar { background: rgba(5, 29, 43, .94); }
.theme-machine .name, .theme-machine .arrow-btn { color: #c5f7ff; }
.theme-machine .level-tag { background: #246e85; color: #efffff; -webkit-text-stroke: 1px #0a3e51; }
.theme-machine .tab-btn { color: #a8dce7; }.theme-machine .tab-btn.active { color: #fff; text-shadow: 0 0 7px #52e6ff; }
.theme-machine .confirm { background: linear-gradient(180deg, #1685a0, #0b5065); border: 1px solid #6ee9ff; }
.theme-machine .cancel { background: linear-gradient(180deg, #385664, #1e333d); border: 1px solid #79b9c7; }
.theme-machine .tab-content {
  scrollbar-color: #3ec4de #071d29;
}

/* Machine-world tab contents live in separate scoped components. */
.theme-machine .tab-content :deep(.container),
.theme-machine .tab-content :deep(.tab-panel),
.theme-machine .tab-content :deep(.tab-panel_skill),
.theme-machine .tab-content :deep(.inventory-tab) {
  background: linear-gradient(145deg, rgba(11, 50, 65, .97), rgba(5, 29, 43, .97));
  background-image: none;
  border-color: #46d3eb;
  color: #d9faff;
  box-shadow: inset 0 0 18px rgba(49, 197, 225, .12);
}
.theme-machine .tab-content :deep(.container h1),
.theme-machine .tab-content :deep(.container h2),
.theme-machine .tab-content :deep(.container h3),
.theme-machine .tab-content :deep(.tab-panel h3),
.theme-machine .tab-content :deep(.detail-title) {
  color: #8ceeff;
  text-shadow: 0 0 7px rgba(70, 211, 235, .35);
}
.theme-machine .tab-content :deep(hr) { border-color: rgba(111, 225, 244, .35); }

/* Status */
.theme-machine .tab-content :deep(.container .tabs button),
.theme-machine .tab-content :deep(.container button) {
  background: linear-gradient(180deg, #1a667b, #0b3f52);
  border-color: #51d7ed;
  color: #e7fcff;
  box-shadow: 0 2px 0 #062936;
}
.theme-machine .tab-content :deep(.container .tabs button.active),
.theme-machine .tab-content :deep(.container button.lvup-active) {
  background: linear-gradient(180deg, #2ca3bd, #12667d);
  border-color: #a5f5ff;
}
.theme-machine .tab-content :deep(.table-wrapper),
.theme-machine .tab-content :deep(.magic-table-wrapper),
.theme-machine .tab-content :deep(table) {
  background: rgba(3, 22, 32, .9);
  border-color: #318da2;
  color: #d9faff;
}
.theme-machine .tab-content :deep(th) {
  background: #123f51;
  border-color: #318da2;
  color: #bcefff;
}
.theme-machine .tab-content :deep(td) {
  border-color: #285f70;
  color: #e7fcff;
}

/* Skills */
.theme-machine .tab-content :deep(.create-skill-panel) { display: none; }
.theme-machine .tab-content :deep(.tab-panel_skill) { min-height: 760px; }
.theme-machine .tab-content :deep(.skill-list),
.theme-machine .tab-content :deep(.skill-detail-box),
.theme-machine .tab-content :deep(.selected-skill-bar) {
  background: rgba(3, 22, 32, .92);
  border-color: #318da2;
  color: #e7fcff;
}
.theme-machine .tab-content :deep(.sub-tab-btn) {
  background: #163f50;
  border-color: #3eaac1;
  color: #bdefff;
}
.theme-machine .tab-content :deep(.sub-tab-btn.active) {
  filter: brightness(1.35) saturate(.8);
  box-shadow: inset 0 -3px 0 #7cecff;
}

/* Inventory */
.theme-machine .tab-content :deep(.inventory-list),
.theme-machine .tab-content :deep(.inventory-detail) {
  background: rgba(3, 22, 32, .92);
  border-color: #318da2;
  color: #e7fcff;
}
.theme-machine .tab-content :deep(.inventory-item) { border-bottom-color: rgba(103, 218, 238, .18); }
.theme-machine .tab-content :deep(.inventory-item:hover) { background: rgba(71, 206, 229, .14); }
.theme-machine .tab-content :deep(.inventory-item.selected) { background: rgba(71, 206, 229, .28); }
.theme-machine .tab-content :deep(.inventory-detail .label) { color: #78e9fa; }
.theme-machine .tab-content :deep(.inventory-detail .value),
.theme-machine .tab-content :deep(.inventory-detail .sub-value) { color: #e7fcff; }
.theme-machine .tab-content :deep(.inventory-detail .strong),
.theme-machine .tab-content :deep(.inventory-detail .highlight) { color: #67f1c6; }
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
.role-fallback {
  display: inline-grid; place-items: center;
  width: 56px; height: 56px; flex: 0 0 56px;
  color: #72efff; font-size: 36px; font-weight: 700;
  border: 1px solid rgba(114, 239, 255, .6); border-radius: 50%;
  background: rgba(12, 98, 121, .45); text-shadow: 0 0 9px #36dff6;
}
.role-fallback-class { color: #b7dce5; font-size: 30px; text-shadow: none; }
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
