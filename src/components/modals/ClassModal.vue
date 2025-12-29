<template>
  <teleport to="body">
    <div class="modal-overlay" >
      <!-- @click.self="$emit('close')" -->
      <div class="modal-content" id="Classe-modal" >
        <h2 class="modal-header">種類を選ぶ</h2>

        <!-- タブ -->
        <div class="tabs scroll-tabs" ref="tabsRef">
          <button
            v-for="type in tabTypes"
            :key="type"
            :class="{ active: activeTab === type }"
            @click="handleTabClick(type)"
          >
            {{ type }}
          </button>
        </div>


        <!-- 一覧 -->
        <ul class="Classe-list">
          <li
            v-for="(Classe, index) in filteredClasses"
            :key="Classe.名前"
          >
            <button @click="openDetail(index)" class="Classe-button">
              <span class="Classe-content">
                <img
                  :src="getRollIcon(Classe.名前)"
                  :alt="Classe.名前"
                  class="Classe-image"
                />
                <span class="Classe-name">{{ Classe.名前 }}</span>
              </span>
            </button>
          </li>
        </ul>

        <!-- 種族説明 -->
        <!-- <div class="Classe-description" v-if="selectedClasseCategory">
          <p>{{ ClasseDescriptions[selectedClasseCategory]?.description }}</p>
        </div> -->

        <div class="confirm-button">
          <div class="confirm" @click="emit('close')">閉じる</div>
        </div>

        <!-- 詳細モーダル -->
        <ClasseDetailModal
          v-if="showDetailModal"
          :classeList="filteredClasses"
          :currentIndex="selectedIndex"
          @close="showDetailModal = false"
          @confirm="handleClasseConfirm"
        />
      </div>
    </div>
  </teleport>
</template>


<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import ClasseDetailModal from '@/components/modals/ClasseDetailModal.vue'
import { applyGlobalScale } from '@/components/useScale.js'
import { allData,
  getAttrIcon, getAttackIcon, getCharIllust, getRollIcon
 } from '@/constants/statData.js';

const emit = defineEmits(['select', 'close'])

const tabTypes = ref(["戦士", "狩人", "魔道士", "神官"]);
const activeTab = ref('戦士')
const selectedClasseCategory = ref('戦士')

// ref for the scrollable tab element (enable drag-to-scroll)
const tabsRef = ref(null)


function handleTabClick(type) {
  activeTab.value = type
  selectedClasseCategory.value = type
}
const ClasseDescriptions = {
  人族: {
    description: '人族はバランスの取れた能力を持ち、どんな職業にも適応可能です。種族としての特殊能力を持たず総合ステータスが低くなりやすいです。',
    background: 'bg-human.jpg',
  },
  亜人: {
    description: '亜人は身体能力に優れた種族で、特定の職に特化しやすい特長があります。またどこかの能力値が極端に低い場合が多く、全体的に精神が低いです。',
    background: 'bg-demi.jpg',
  },
  魔族: {
    description: '魔族は強力な魔力や特殊能力を持ちます。基礎ステータスもかなり高く一部に強力な耐性を持ちますが、その分、弱点の属性を複数持っています。',
    background: 'bg-demon.jpg',
  }
};

// src="getImageUrl(currentClasse.画像url)
const allClasses = ref([])

// 習得済みクラスの集合（重複排除用）
const acquiredClasses = ref(new Set())

const filteredClasses = computed(() =>
  allClasses.value.filter(r => r.技能分類 === activeTab.value && !acquiredClasses.value.has(r.名前))
)
console.log("filteredClasses :")
console.log(filteredClasses)

const showDetailModal = ref(false)
const selectedIndex = ref(0)

const openDetail = (index) => {
  selectedIndex.value = index
  showDetailModal.value = true
}

const handleClasseConfirm = (Classe) => {
  emit('select', Classe.名前)  // CharacterCreateView.vue に伝える
  showDetailModal.value = false
}

const props = defineProps({
  selectedRace: { type: Object, required: true },
  playerData: { type: Object, required: true } // ★追加
})

function normalize(v) {
  return (v ?? "").toString().trim();
}

// クラスデータとプレイヤーデータを渡すと称号して条件を満たしているか確認できる
function meetsConditions(classData, playerData) {

  // ① 条件クラス_1
  if (classData.条件クラス_1) {
    const lv1 = playerData.classLevels[classData.条件クラス_1] || 0;
    if (lv1 < Number(classData.条件Lv_1 || 0)) return false;
  }

  // ② 条件クラス_2
  if (classData.条件クラス_2) {
    const lv2 = playerData.classLevels[classData.条件クラス_2] || 0;
    if (lv2 < Number(classData.条件Lv_2 || 0)) return false;
  }

  // ③ 条件職群（＝職業系統）取得分類
  if (normalize(classData.取得分類)) {
    const targetGroup = normalize(classData.取得分類);

    const systemLv = Object.entries(playerData.classLevels)
      .filter(([className]) => normalize(playerData.classInfo[className]?.技能分類) === targetGroup)
      .reduce((sum, [, lv]) => sum + lv, 0);

    if (systemLv < Number(classData.条件分類Lv || 0)) return false;
  }

  // ④ 合計レベル
  if (classData.合計Lv) {
    const totalLv = Object.values(playerData.classLevels)
      .reduce((sum, lv) => sum + lv, 0);

    if (totalLv < Number(classData.合計Lv || 0)) return false;
  }
  // console.log("classData keys:", Object.keys(classData));
  // console.log("取得分類 raw:", JSON.stringify(classData.取得分類));
  // console.log("技能分類 raw:", JSON.stringify(playerData.classInfo["ファイター"].技能分類));

  // ⑤ 条件スキル（未実装ならスキップか false）
  if (classData.条件スキル) {
    // TODO: スキル所持チェック
    return false; // とりあえず満たさない
  }

  // ⑥ 条件属性（未実装）
  if (classData.条件属性) {
    // TODO: 属性レベルチェック
    return false;
  }

  return true;
}


/**
 * クラス条件判定用の playerInfo を生成する。
 *
 * 期待される構造：
 * {
 *   classLevels: { "戦士": 3, "魔術師": 2 },
 *   classInfo:   { "戦士": {技能分類: "戦士"}, ... }
 * }
 *
 * @param {Array} classMaster  - allData（Excelの職業マスタ）
 * @param {Object} playerData  - キャラ1体 or playerGlobalData
 * @returns {Object} playerInfo
 */
function createPlayerInfo(classMaster, playerData) {
  const info = {
    classLevels: {},
    classInfo: {}
  };

  if (!playerData) return info;

  // --- ① Role 配列を安全に抽出（キャラ or playerGlobalData どちらでもOK） ---
  let roles = [];

  if (Array.isArray(playerData.Role)) {
    // キャラ1体パターン
    roles = playerData.Role;
  } else if (Array.isArray(playerData.party)) {
    // playerGlobalData パターン → 主人公だけ見ればいい
    const mainChar = playerData.party[0];
    roles = mainChar?.Role || [];
  }

  // --- ② Role をループして info を作る ---
  for (const r of roles) {
    const name = r?.roleName;
    const lv = Number(r?.Lv) || 0;

    if (!name || lv <= 0) continue;

    // クラスLv
    info.classLevels[name] = lv;

    // クラスの技能分類をマスタから検索
    const base = classMaster.find(c => c.名前 === name);
    if (base) {
      info.classInfo[name] = {
        技能分類: base.技能分類
      };
    }
  }

  console.log("== createPlayerInfo ==", info)

  return info;
}


/**
 * クラスデータを初期化し、タブ構成と習得済みクラスをセットアップ
 */
function setupClassData() {
  const data = allData.value;
  const currentRace = props.selectedRace?.名前 || props.selectedRace;

  console.log("== setupClassData ==", props);

  const isNoCondition = (c) => {
    return !c.取得分類 &&
           !c.条件分類Lv &&
           !c.条件クラス_1 &&
           !c.条件Lv_1 &&
           !c.合計Lv &&
           !c.条件技 &&
           !c.条件属性;
  };

  const hasPlayerData = !!props.playerData;

  let jobData = [];

  if (!hasPlayerData) {
    jobData = data.filter(c =>
      c.分類 === '職業' &&
      (
        isNoCondition(c) ||
        (c.条件クラス_1 === currentRace && Number(c.条件Lv_1) <= 1)
      )
    );
  } else {
    const playerInfo = createPlayerInfo(data, props.playerData);
    jobData = data.filter(c =>
      c.分類 === '職業' &&
      (isNoCondition(c) || meetsConditions(c, playerInfo))
    );
  }

  if (hasPlayerData) {
    const playerInfo = createPlayerInfo(data, props.playerData);
    acquiredClasses.value = new Set(Object.keys(playerInfo.classLevels));
  }

  const uniqueTypes = [...new Set(jobData.map(c => c.技能分類))];
  tabTypes.value = uniqueTypes;

  let maxTotalLv = -1;
  let maxTypeIndex = 0;
  if (hasPlayerData) {
    const playerInfo = createPlayerInfo(data, props.playerData);
    uniqueTypes.forEach((type, idx) => {
      const totalLvForType = Object.entries(playerInfo.classLevels)
        .filter(([className]) => {
          const base = data.find(c => c.名前 === className);
          return base && base.技能分類 === type;
        })
        .reduce((sum, [, lv]) => sum + lv, 0);
      if (totalLvForType > maxTotalLv) {
        maxTotalLv = totalLvForType;
        maxTypeIndex = idx;
      }
    });
  }

  activeTab.value = uniqueTypes[maxTypeIndex];
  selectedClasseCategory.value = uniqueTypes[maxTypeIndex];
  console.log("== jobData ==", jobData);
  console.log("== uniqueTypes ==", uniqueTypes);
  console.log("== acquiredClasses ==", acquiredClasses.value);
  allClasses.value = jobData;
}

/**
 * タブ要素にドラッグ→横スクロール機能を付与
 */
function setupTabDragScroll() {
  const el = tabsRef.value;
  if (!el) return;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let didDrag = false;

  const pointerDown = (e) => {
    isDown = true;
    didDrag = false;
    startX = e.clientX;
    scrollLeft = el.scrollLeft;

    const startedOnInteractive = e.target && e.target.closest && e.target.closest('button, a, input, select, textarea');
    pointerDown.startedOnInteractive = startedOnInteractive;
    try {
      if (e.pointerId != null && !startedOnInteractive) el.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const pointerMove = (e) => {
    if (!isDown) return;
    const x = e.clientX;
    const walk = (x - startX);

    if (!didDrag && Math.abs(walk) > 6) {
      didDrag = true;
      el.classList.add('dragging');
    }

    if (didDrag) {
      el.scrollLeft = scrollLeft - walk;
    }
  };

  const pointerUp = (e) => {
    if (didDrag) {
      const preventClick = (ev) => {
        ev.stopImmediatePropagation();
        ev.preventDefault();
      };
      document.addEventListener('click', preventClick, true);
      setTimeout(() => document.removeEventListener('click', preventClick, true), 0);
    }

    isDown = false;
    didDrag = false;
    el.classList.remove('dragging');
    try {
      if (e.pointerId != null && !pointerDown.startedOnInteractive) {
        el.releasePointerCapture && el.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
  };

  el.addEventListener('pointerdown', pointerDown);
  el.addEventListener('pointermove', pointerMove);
  el.addEventListener('pointerup', pointerUp);
  el.addEventListener('pointerleave', pointerUp);

  onBeforeUnmount(() => {
    el.removeEventListener('pointerdown', pointerDown);
    el.removeEventListener('pointermove', pointerMove);
    el.removeEventListener('pointerup', pointerUp);
    el.removeEventListener('pointerleave', pointerUp);
  });
}

// 統合された onMounted フック
onMounted(() => {
  applyGlobalScale('Classe-modal');
  setupClassData();
  setupTabDragScroll();
});



</script>

<style scoped>
/* ==================== モーダル ==================== */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  transform-origin: center center;
}

.modal-content {
  min-width: 700px;
  min-height: 1200px;
  max-width: 700px;
  max-height: 1200px;
  font-size: 20px;
  background: #222;
  padding: 20px;
  border-radius: 10px;
  overflow-y: auto;
  overflow-x: visible;
}

.modal-header {
  color: #ffffff;
}

/* ==================== タブ（横スクロール） ==================== */
.tabs {
  display: flex;
  flex-wrap: nowrap;
  width: 660px;
  max-width: 660px;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 8px;
  padding: 6px 4px;
  margin-bottom: 1rem;
  
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  scrollbar-width: none;
}

.tabs {
  cursor: grab;
}

.tabs.dragging {
  cursor: grabbing;
  user-select: none;
}

/* タッチ操作で横スクロールを行いやすくする */
.tabs {
  touch-action: pan-y;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tabs button {
  flex: 0 0 150px;
  width: 150px;
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 6px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 30px;
  font-weight: 600;
  white-space: nowrap;
}

.tabs .active {
  background-color: #0056b3;
}

/* ==================== クラス一覧 ==================== */
.Classe-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  font-size: 20px;
  max-height: 900px;
  overflow-y: auto;
  align-content: start;
}

.Classe-list button {
  width: 100%;
  height: 80px;
  padding: 0.5rem;
  background-color: #eee;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  color: #000;
  font-size: 30px;
}

.Classe-list button:hover {
  background-color: #ddd;
}

/* ==================== クラスボタン詳細 ==================== */
.Classe-button {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
  text-align: left;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.Classe-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.Classe-image {
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.Classe-name {
  flex-grow: 1;
}

/* ==================== 説明エリア ==================== */
.Classe-description {
  position: absolute;
  margin-top: 8px;
  height: 13%;
  font-size: 30px;
  color: #ffeecc;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 6px;
  bottom: 15px;
  width: 605px;
}

/* ==================== 閉じるボタン ==================== */
.confirm-button {
  margin-top: 1rem;
  text-align: center;
}

.confirm {
  display: inline-block;
  padding: 0.6rem 2rem;
  background-color: #28a745;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 30px;
  font-weight: 600;
}

.confirm:hover {
  background-color: #218838;
}


</style>
