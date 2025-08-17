<template>
  <div class="modal-overlay" >
    <div class="modal">
      <div class="modal-content" id="race-modal">
        <!-- 種族画像と名前 -->
        <div class="race-info" >
          <img @click="emit('close')" :src="getImageUrl(currentRace.画像url)" :alt="currentRace.名前" class="race-image" />
          <img
            v-if="(currentRace?.初期系統 || '').trim()"
            @click="emit('close')"
            :src="getAttrIcon(currentRace.初期系統)"
            :alt="currentRace.名前"
            class="race-image2"
          />
          
          <h2>{{ currentRace.名前 }}</h2>
        </div>

        <!-- タブ選択 -->
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="{ active: activeTab === tab }"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <!-- ステータス表示 -->
        <div class="stat-list-wrapper">
          <!-- ステータスは1列 -->
          <ul class="stat-list" v-if="activeTab === 'ステータス'">
            <li
              v-for="key in statKeys"
              :key="key"
              @click="selectKey(key)"
              :class="{ selected: selectedKey === key }"
            >
              {{ getDisplayValue(key) }}
            </li>
          </ul>

          <!-- 技能・耐性は2列表示 -->
          <div class="columns" v-else>
            <ul class="stat-list">
              <li
                v-for="key in leftKeys"
                :key="key"
                @click="selectKey(key)"
                :class="{ selected: selectedKey === key }"
              >
                {{ getDisplayValue(key) }}
              </li>
            </ul>
            <ul class="stat-list">
              <li
                v-for="key in rightKeys"
                :key="key"
                @click="selectKey(key)"
                :class="{ selected: selectedKey === key }"
              >
                {{ getDisplayValue(key) }}
              </li>
            </ul>
          </div>
        </div>


        <!-- 選択項目の説明 -->
        <p class="description">
          {{ selectedKey ? (statDescriptions[selectedKey] || '説明がありません') : '項目を選択すると説明が表示されます' }}
        </p>


        <!-- ナビゲーション -->
        <!-- <button class="side-arrow left" @click="prevRace" :disabled="currentIndex <= 0">&#8592;</button>
        <button class="side-arrow right" @click="nextRace" :disabled="currentIndex >= raceList.length - 1">&#8594;</button> -->
      </div>
      <div class="nav-buttons">
        <div class="side-arrow left" @click="prevRace">〈</div>
        <div class="side-arrow right" @click="nextRace">〉</div>
        <div class="confirm-button">
          <div class="confirm" @click="emit('close')">閉じる</div>
          <div class="confirm" @click="confirmSelection">決定</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { statMap, statDescriptions } from '@/constants/statData.js';

// 画像取得
const imageMap = import.meta.glob('@/assets/images/**/*', { eager: true, import: 'default' })
const getImageUrl = (relativePath) => {
  try {
    const match = Object.entries(imageMap).find(([key]) => key.endsWith(relativePath))
    return match ? match[1] : ''
  } catch {
    return ''
  }
}
// 属性アイコン/100 フォルダだけを対象にする
const attrIconMap = import.meta.glob(
  "/src/assets/images/属性アイコン/100/*.webp",
  { eager: true, as: "url" }
);

// ファイル名をキーにした辞書を作成
const ATTR_ICONS = {};
for (const [path, url] of Object.entries(attrIconMap)) {
  const filename = path.split("/").pop().replace(/\.webp$/i, "");
  ATTR_ICONS[filename] = url;
}

// 取得関数：currentRace.初期系統 をキーに探す
const getAttrIcon = (name) => {
  const key = (name || "").trim();
  return key && ATTR_ICONS[key] ? ATTR_ICONS[key] : "";
};


const props = defineProps({
  raceList: Array,
  currentIndex: Number
})
const emit = defineEmits(['close'])

const activeTab = ref('ステータス')
const currentIndex = ref(props.currentIndex)

watch(() => props.currentIndex, (val) => currentIndex.value = val)

const tabs = ['ステータス', '技能', '耐性']

const TechniqueKeys = statMap['技能']
const resistanceKeys = statMap['耐性']
const TechniqueSplitIndex = TechniqueKeys.indexOf('装置')
const resistSplitIndex = resistanceKeys.indexOf('毒耐性')

const currentRace = computed(() => props.raceList[currentIndex.value])
const statKeys = computed(() => statMap[activeTab.value])
console.log("ステータス:"+ currentRace)
console.log(currentRace)
const leftKeys = computed(() => {
  if (activeTab.value === '技能') return TechniqueKeys.slice(0, TechniqueSplitIndex)
  if (activeTab.value === '耐性') return resistanceKeys.slice(0, resistSplitIndex)
  return statKeys.value
})
const rightKeys = computed(() => {
  if (activeTab.value === '技能') return TechniqueKeys.slice(TechniqueSplitIndex)
  if (activeTab.value === '耐性') return resistanceKeys.slice(resistSplitIndex)
  return []
})

const selectedKey = ref('')
const selectKey = (key) => {
  selectedKey.value = key
}

const prevRace = () => {
  if (currentIndex.value > 0) currentIndex.value--
}
const nextRace = () => {
  if (currentIndex.value < props.raceList.length - 1) currentIndex.value++
}

function getSizeBonus(siz) {
  if (siz >= 180) {
    return Math.round(siz / 50 + 8);;
  } else if (siz <= 150) {
    return -Math.round((160 - siz) / 3);
  } else {
    return 0;
  }
}

// 表示用の値を返す
function getDisplayValue(key) {
  if (key === "特徴") {
    const value = currentRace.value[key];
    return `${key}: ${value || ""}`;
  }

  const rawValue = currentRace.value[key];
  const baseValue = typeof rawValue === "number" ? rawValue : parseFloat(rawValue) || 0;

  const siz = currentRace.value["SIZ"] ?? 100;
  const bonusPercent = getSizeBonus(siz);
  const bonusKeysPlus = ["HP", "攻撃", "威圧"];
  const bonusKeysMinus = ["速度", "隠密", "軽業"];

  const format = (val, suffix = "%") => {
    if (val === 0) return "";
    return val > 0 ? ` (+${val}${suffix})` : ` (${val}${suffix})`;
  };

  if (bonusKeysPlus.includes(key)) {
    if (key === "威圧") {
      const TechniqueBonus = Math.round(bonusPercent);
      const result = baseValue + TechniqueBonus;
      return `${key}: ${result}${format(TechniqueBonus, "")}`;
    } else {
      const multiplier = 1 + bonusPercent / 100;
      const result = baseValue * multiplier;
      return `${key}: ${Math.round(result)}${format(Math.round(bonusPercent))}`;
    }
  } else if (bonusKeysMinus.includes(key)) {
    if (key === "隠密" || key === "軽業") {
      const TechniqueBonus = Math.round(bonusPercent);
      const result = baseValue - TechniqueBonus;
      return `${key}: ${result}${format(-TechniqueBonus, "")}`;
    } else {
      const multiplier = 1 + bonusPercent / 100;
      const result = baseValue * (1 / multiplier);
      return `${key}: ${Math.round(result)}${format(Math.round(-bonusPercent))}`;
    }
  } else {
    return `${key}: ${baseValue}`;
  }
}

// 決定→閉じる
function confirmSelection() {
  if (!currentRace.value) return
  emit('confirm', currentRace.value) // 親へ「決定した値」を渡す
  emit('close')                      // モーダルを閉じる
}

</script>

<style>
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.modal-content {
  background: #222;
  color: white;
  padding: 0 35px;
  border-radius: 8px;
  width: 630px;
  height: 1190px;
  /* max-width: 600px;
  max-height: 90vh; */
  overflow-x: hidden;
  overflow-y: auto;
  font-size: 30px;
}

.race-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.race-image {
  width: 140px;
  height: 140px;
  object-fit: contain;
  border-radius: 8px;
}
.race-image2 {
  position: absolute;
  width: 60px;
  height: 60px;
  top: 75px;
  left: 135px;
  border-radius: 50%;
  z-index: 2;
}

.tabs {
  margin: 0px 0 10px;
  display: flex;
  gap: 10px;
}

.tabs button {
  padding: 6px 6px;
  font-size: 30px;
  border: none;
  border-radius: 6px;
  background: #444;
  color: white;
  cursor: pointer;
}

.tabs button.active {
  background: #ffee99;
  color: #000;
  font-weight: bold;
}

.stat-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.stat-list li {
  padding: 6px;
  font-size: 30px;
  border-bottom: 1px solid #555;
  cursor: pointer;
}

.stat-list li:last-child {
  border-bottom: none;
}

.stat-list li.selected {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: bold;
  border-left: 4px solid #ffeeaa;
}

.columns {
  display: flex;
  gap: 20px;
}

.stat-list-wrapper {
  border: 1px solid #888;
  padding: 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  height: 60.5%;
  overflow-y: auto;
}

.description {
  margin-top: 8px;
  margin-bottom: 8px;
  height: 13%;
  font-size: 30px;
  color: #ffeecc;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 6px;
}

/* .nav-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: -6px;
  margin-bottom: 0px;
}

.nav-buttons button {
  font-size: 25px;
  border: none;
  background-color: #444;
  color: white;
  cursor: pointer;
} */

/* .nav-buttons button:hover {
  background-color: #666;
} */

.nav-buttons {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.side-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: #564d3c1c;
  color: white;
  padding: 12px 9px;
  border-radius: 8px;
  font-size: 32px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  pointer-events: auto;
}

.side-arrow.left {
  left: -15px;
}

.side-arrow.right {
  right: -15px;
}

.confirm {
  background-color: #564d3c;
  color: white;
  padding: 1px 20px;
  border-radius: 8px;
  font-size: 39px;
  cursor: pointer;
  user-select: none;
  text-align: center;
  transition: background-color 0.2s;
  height: 45px;
  width: 200px;
}

.confirm:hover {
  background-color: #6e6049;
}

</style>
