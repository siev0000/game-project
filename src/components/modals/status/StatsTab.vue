<template>
    <div class="container">
      <form @submit.prevent="openLevelModal">
        
      <td class="exp-btn-cell">
        <button 
          class="lvup-btn"
          :class="{ 'lvup-active': character.stats.experience >= character.stats.nextLevelExp }"
          :disabled="character.stats.experience < character.stats.nextLevelExp"
          @click="levelUpMode = !levelUpMode"
        >
          Lvアップ
        </button>
      </td>
      <td class="exp-btn-cell">
        <button
          class="addclass-btn"
          :class="{ 'lvup-active': character.stats.experience >= character.stats.nextLevelExp }"
          :disabled="character.stats.experience < character.stats.nextLevelExp"
          @click="openAddClassModal"
        >
          新規取得
        </button>
      </td>
      <td class="exp-cell">
        EXP {{ character.stats.experience }} / {{ character.stats.nextLevelExp }}
        （残り: {{ character.stats.nextLevelExp - character.stats.experience }}）
      </td>
        <!-- ★ テスト用：EXP増減ボタン -->
      <td class="exp-cell">
        <button @click="addExp(-500)" class="exp-btn minus">-500</button>
      </td>
      <td class="exp-cell">
        <button @click="addExp(500)"  class="exp-btn plus">+500</button>
      </td>

        <!-- タブ切り替え -->
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

        <!-- タブ内容 -->
        <div v-if="tabs.includes(activeTab)">
          <div class="table-wrapper" v-if="activeTab !== '魔法'">
            <!-- 基本のテーブル -->
            <table>
        <thead>
          <!-- 1行目：属性／合計／Role名 -->
          <tr class="header-row-1">
            <!-- 属性 -->
            <th class="role-list">
              <div class="attr-icon-wrap">
                <!-- <span class="attr-ruby">
                  {{ props.character?.attribute?.[0] || "属" }}
                </span> -->
                <img
                  v-if="props.character?.attribute && getAttrIcon(props.character.attribute)"
                  :src="getAttrIcon(props.character.attribute)"
                  :alt="props.character.attribute"
                  class="icon-Attribute-img"
                />
              </div>

            </th>
            <!-- 合計 -->
            <th class="all-list">合計</th>
            <th class="passive-header">P</th> <!-- ★ 追加 -->
            <!-- 1行目：Role名 -->
            <th
              v-for="(role, rIndex) in (props.character?.Role || []).filter(r => r.roleName)"
              :key="'role-name-' + rIndex"
              class="role-header role-with-bg"
              :data-role-index="rIndex"
            >
              <div class="role-header-content">
                <img
                  v-if="getRollIcon(role.roleName)"
                  :src="getRollIcon(role.roleName)"
                  :alt="role.roleName"
                  class="role-icon-bg role-bg-top"
                />
                <span class="role-name-text" :class="'role-name-' + rIndex">
                  {{ role.roleName }}
                </span>
              </div>
            </th>
          </tr>

          <!-- ヘッダー2行目：Lv表示 -->
          <tr class="header-row-2">
            <th>Lv</th>
            <th class="role-total-Lv">{{ totalLevel }}</th>
            <th class="passive-lv-cell">/</th>
            <th
              v-for="(role, rIndex) in (props.character?.Role || []).filter(r => r.roleName)"
              :key="'role-lv-' + rIndex"
              class="role-lv-cell role-with-bg"
            >
              <div class="role-header-content">
                <!-- <img
                  v-if="getRollIcon(role.roleName)"
                  :src="getRollIcon(role.roleName)"
                  :alt="role.roleName"
                  class="role-icon-bg role-bg-bottom"
                /> -->
                <button
                  class="lv-btn"
                  :class="{ 'lv-btn-active': levelUpMode, 'lv-btn-inactive': !levelUpMode }"
                  :disabled="!levelUpMode"
                  @click="levelUpMode && levelUpRole(role)"
                >
                  Lv{{ role.Lv }}
                </button>

              </div>
            </th>
          </tr>
        </thead>

            <!-- ステータス・技能・耐性 -->
            <tbody v-if="activeTab !== '技'">
              <tr v-for="stat in statMap[activeTab]" :key="stat">
                <td @click="selectKey(stat)">{{ stat }}</td>

                <!-- 合計値 -->
                <td>
                  <!-- {{ baseStatsTotal(stat, )  }} -->
                  {{ roundTo(applySizeBonus(props.character.stats.baseStats[stat], [stat], props.character.stats.totalStats["SIZ"] ) + calcPassiveStat(stat)) }}
                  <!-- props.character -->
                </td>
                
                <!-- ★ パッシブ -->
                <td>
                  {{ roundTo(calcPassiveStat(stat))}}
                  <!-- {{ props.character.stats.activePassives[stat] }} -->
                </td>

                <!-- 各Role -->
                <td v-for="(role, rIndex) in (props.character?.Role || []).filter(r => r.roleName)"
                  :key="'stat-' + rIndex"
                >
                  {{ roundTo(calcRoleStat(role, stat)) }}
                </td>

              </tr>
            </tbody>

            <!-- スキル -->
            <tbody v-else>
              <tr v-for="i in 10" :key="'skill-' + i">
                <td>技</td>
                <td>{{ i }}</td>
                <td>/</td>

                <td v-for="(role, rIndex) in (props.character?.Role || []).filter(r => r.roleName)"
                  :key="'skill-role-' + rIndex"
                >
                  <div v-if="i <= (role.Lv || 0)" class="skill-cell">
                    <div
                      class="skill-inner"
                      :class="typeClass(getSkillType(selectStatsData(role.roleName)?.[`Skill${i}`]))"
                      @click="onSkillSelect(selectStatsData(role.roleName)?.[`Skill${i}`])"
                    >
                      <div class="skill-name">
                        {{ selectStatsData(role.roleName)?.[`Skill${i}`] || "" }}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>

            </table>
          </div>
          <div class="magic-table-wrapper" v-if="activeTab === '魔法'" >
            <!-- 属性タブ専用テーブル -->
            <div class="scrollable-container">
              <table class="attr-table">
                <thead class="sticky-header">
                  <tr>
                    <th
                      v-for="(attr, idx) in Object.keys(magicByAttr)"
                      :key="'magic-head-' + idx"
                      class="attr-head-col"
                    >
                      <div class="magic-icon-wrap">
                        <img
                          v-if="getAttrIcon(attr)"
                          :src="getAttrIcon(attr)"
                          :alt="attr"
                          class="icon-Attribute-img"
                        />
                        <span class="attr-name-text">
                          {{ attr }}
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="rowIndex in magicMaxRows"
                    :key="'magic-row-' + rowIndex"
                  >
                    <td
                      v-for="(attr, idx) in Object.keys(magicByAttr)"
                      :key="'magic-cell-' + rowIndex + '-' + idx"
                      class="attr-magic-col"
                    >
                      <div
                        v-if="magicByAttr[attr]?.[rowIndex - 1]"
                        class="magic-cell-inner"
                        :class="typeClass(getSkillType(magicByAttr[attr][rowIndex - 1].名前))"
                        @click="onSkillSelect(magicByAttr[attr][rowIndex - 1].名前)"
                      >
                        <span class="magic-rank">
                          R{{ magicByAttr[attr][rowIndex - 1].Rank }}
                        </span>
                        <span class="magic-sep"></span>
                        <span class="magic-name">
                          {{ magicByAttr[attr][rowIndex - 1].名前 }}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </form>

      <!-- 選択項目の説明 -->
      <div class="skill-detail-box" v-if="hasSkillDetail()">
        <div v-html="renderSkillHtml(selectedSkillDetail)"></div>
      </div>

      <div v-else class="skill-detail-box">
        {{ selectedKey ? (statDescriptions[selectedKey] || '説明がありません') : '項目を選択すると説明が表示されます' }}
      </div>
      <!-- フッター -->
      <!-- <div class="footer">
        <button class="btn cancel" @click="returnDashboard">選択に戻る</button>
      </div> -->
      

      <!-- モーダル -->
      <RaceModal v-if="showRaceModal" @close="showRaceModal = false" @select="selectRace" />
      <ClassModal v-if="showClassModal" :playerData="character" @close="showClassModal = false" @select="selectClass" />
      <AttributeModal v-if="showAttributeModal" :attributes="availableAttributes" @close="showAttributeModal = false" @select="selectAttribute" />

    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import RaceModal from '@/components/modals/RaceModal.vue'
import ClassModal from '@/components/modals/ClassModal.vue'
import AttributeModal from '@/components/modals/AttributeModal.vue'
// 必ず使う
import { 
  loadGameData, statMap, statDescriptions, allData,  
  calcRoleStat, Skill_List , applySizeBonus, statusUpdate,
  getAttrIcon, getRollIcon , getExperience, renderSkillHtml, magicGetData
} from '@/constants/statData.js';



const router = useRouter()

const characterName = ref('')
const nameConfirmed = ref(false)
const selectedRace = ref(null)
const selectedClass = ref(null)
const selectedAttribute= ref(null)
const availableAttributes = ref([]);
const lookAttribute= ref(null)
const showRaceModal = ref(false)
const showClassModal = ref(false)
const showAttributeModal = ref(false)

const tabs = ['ステータス', '技能', '肉体', '耐性', '技', '魔法']
const activeTab = ref('ステータス')

const selectedSkillDetail = ref(null);
const levelUpMode = ref(false);



function hasSkillDetail() {
  return !!(selectedSkillDetail.value);
}

const props = defineProps({
  character: { type: Object, required: true },
  player: { type: Object, required: true }
});

// 行動色判定（A/S/Q 以外は無色）
const getSkillType = (name) => {
  if (!name) return null;
  const hit = Skill_List?.value?.find?.(s => s.名前 === name);
  // 期待値: 'A' | 'S' | 'Q'
  return hit?.行動 ?? null;
};

const typeClass = (t) => ({
  'type-a': t === 'A',
  'type-s': t === 'S',
  'type-q': t === 'Q',
});
const displayRuby = (val) => {
  return val === 0 ? '' : val;
};

onMounted(async () => {
  await loadGameData();
  // console.log("== ステータスタブ ==");
  // console.log(props.character);
  // console.log(props.character.skills);

  // await magicGetData2();

  recalcStats();

  // ★ DOM反映を待つ
  await nextTick();

  // ★ Role文字サイズ調整
  updateRoleNameFont();
});

const magicByAttr = computed(() => {
  return props.character.magic?.magicListByAttr || {};
});

const magicMaxRows = computed(() => {
  return Math.max(
    0,
    ...Object.values(magicByAttr.value).map(list => list.length)
  );
});

// const imageMap = import.meta.glob('@/assets/images/**/*', { eager: true, import: 'default' })
// const getImageUrl = (relativePath) => {
//   try {
//     const match = Object.entries(imageMap).find(([key]) => key.endsWith(relativePath))
//     // // console.log("getImageUrl : ", match, relativePath)

//     return match ? match[1] : ''
//   } catch {
//     return ''
//   }
// }

const attrIconMods = import.meta.glob(
  "/src/assets/images/属性アイコン/100/*.webp",
  { eager: true, as: "url" }
);
const ATTR_ICONS = {};
for (const [path, url] of Object.entries(attrIconMods)) {
  const filename = path.split("/").pop().replace(/\.webp$/i, "");
  ATTR_ICONS[filename] = url; // 例：ATTR_ICONS["力場"] = "blob:..."
}
// const getAttrIcon = (attr)=> {
//   const name = (attr?.属性名 || attr?.name || "").trim();
//   return name && ATTR_ICONS[name] ? ATTR_ICONS[name] : "";
// }

const selectedKey = ref('')
const selectKey = (key, detail) => {
  selectedKey.value = key;
  selectedSkillDetail.value = detail; // クリックした方のデータを直接代入
};

// 攻撃手段アイコン一括取り込み（/src/assets/images/攻撃手段/<名前>.webp）
const attackIconMods = import.meta.glob(
  "/src/assets/images/攻撃手段/*.webp",
  { eager: true, as: "url" }
);

// { "剣技": "blob:...", "魔法": "blob:..." } の形に整形（JS）
/** @type {{[k: string]: string}} */
const ATTACK_ICONS = Object.create(null);

for (const [path, url] of Object.entries(attackIconMods)) {
  const last = (path.split("/")?.pop() || "");          // ← 非TSで安全に
  const filename = last.replace(/\.webp$/i, "");        // 拡張子除去
  ATTACK_ICONS[filename] = /** @type {string} */ (url); // 型はJSDocで補助
}

// 表記ゆらぎにある程度強い取得関数（全角カッコ等を吸収）
// const getAttackIcon = (method) => {
//   const raw = (method ?? "").toString().trim();
//   if (!raw) return "";

//   const noSpace = raw.replace(/\s+/g, "");
//   const noParen = raw.replace(/[（(].*?[)）]/g, "").trim();
//   const noParenNoSpace = noParen.replace(/\s+/g, "");

//   return (
//     ATTACK_ICONS[raw] ||
//     ATTACK_ICONS[noSpace] ||
//     ATTACK_ICONS[noParen] ||
//     ATTACK_ICONS[noParenNoSpace] ||
//     ATTACK_ICONS["default"] || // あればフォールバック
//     ""
//   );
// };


// 役割: Role[] ベースで totalStats を再計算
const recalcStats = async () => {
  const roles = (props.character?.Role || []).filter(r => r.roleName);
  const newTotalStats = {};

  // 対象キー（必要に応じて耐性も含める）
  const keys = [...new Set([
    ...statMap['ステータス'],
    ...statMap['技能'],
    ...statMap['肉体'],
    ...(statMap['耐性'] || [])
  ])];

  // name -> データ行
  const getBase = (role, key) => (selectStatsData(role.roleName)?.[key] || 0);

  keys.forEach(key => {
    if (key === 'SIZ') {
      // SIZはLv無関係の最大値
      newTotalStats[key] = roles.reduce((max, role) => {
        const base = getBase(role, key);
        return Math.max(max, base);
      }, 0);
    } else {
      // それ以外は (/10 * Lv) を合算（丸めは最後の表示でapplySizeBonusに任せる）
      const sum = roles.reduce((acc, role) => {
        return acc + (getBase(role, key) / 10) * (role.Lv || 0);
      }, 0);
      newTotalStats[key] = sum;
    }
  });

  // ============================================================
  // ★★ スキル再構築処理（ここが今回追加すべき本体）★★
  // ============================================================

  // const allSkills = collectSkillsFromRoles(props.character) || [];  // 重複排除のためSet使用
  const characterData = await statusUpdate(props.character)
  props.character = characterData
  // Set → Array に変換
  // props.character.skills = Array.from(allSkills);

  // console.log("== recalcStats (skills updated) ==");
  // console.log("allSkills:", allSkills);
  // console.log("skills:", props.character.skills);
  console.log("totalStats:", newTotalStats);
};


const selectRace = (raceName) => {
  // 種族データ全体を検索してセット
  const raceObj = allData.value.find(r => r.名前 === raceName);
  if (raceObj) {
    selectedRace.value = raceObj;
    // raceLv.value = raceObj.Lv ?? 1; // 初期Lvをデータから、なければ1
  }
  // console.log(selectedRace.value)
  showRaceModal.value = false;
  recalcStats();
};

// 新規取得モーダルを開く
const openAddClassModal = () => {
  if (props.character.stats.experience < props.character.stats.nextLevelExp) return;
  showClassModal.value = true;
};

// ClassModal で選択されたクラス名を受け取る
const selectClass = (className) => {
  if (!className) return;

  // 新しいクラスを Role に追加（Lv1からスタート）
  props.character.Role.push({
    roleName: className,
    Lv: 1
  });

  console.log(`新規クラス取得: ${className}`);

  // ステータス再計算
  if (typeof recalcStats === "function") recalcStats();

  showClassModal.value = false;
};

// データ全体を検索して返す
const selectStatsData = (name) => {
  const statsDataObj = allData.value.find(c => c.名前 === name);
  return statsDataObj
};

const selectAttribute = (selectAttributes) => {
  // Attribute
  selectedAttribute.value = selectAttributes
  showAttributeModal.value = false;
};

/**
 * パッシブアビリティの合計値を返す
 * props.character.stats.activePassives から statKey に一致する数値を加算
 */
function calcPassiveStat(statKey) {
  const passives = props.character?.stats?.activePassives || [];
  if (!Array.isArray(passives)) return 0;

  let total = 0;

  for (const skill of passives) {
    if (!skill) continue;

    // skill[statKey] が数値 or 数値文字列の場合のみ加算
    const val = Number(skill[statKey]);
    if (!isNaN(val)) {
      total += val;
    }
  }

  // console.log("== calcPassiveStat ==",statKey,total, toRaw(passives))
  return total;
}

// 技選択時処理
const onSkillSelect = (skillName) => {
  if (!skillName) return;
  // console.log(Skill_List.value)

  const skill = Skill_List.value.find(s => s.名前 === skillName);
  if (!skill) {
    selectedSkillDetail.value = null;
    return;
  }

  selectedSkillDetail.value = {
    ルビ: skill.ルビ || '',
    名前: skill.名前 || '',
    系統: skill.系統 || '',
    分類: skill.分類 || '',
    行動: skill.行動 || '',
    攻撃手段: skill.攻撃手段 || '',
    追加威力: skill.追加威力 || '',
    判定: skill.判定 || '',
    説明: skill.説明 || ''
  };
};

function openAttributeModal() {
  // console.log("openAttributeModal チェック:", selectedRace, selectedClass)
  // 固定されているか確認
  if(lookAttribute.value == true){
    return;
  }

  // 種族未選択チェック
  if (!selectedRace.value.名前) {
    return;
  }

  // クラス未選択チェック
  if (!selectedClass.value.名前) {
    return;
  }

  // 条件を満たしたらモーダル表示
  showAttributeModal.value = true;
  
}



const totalLevel = computed(() =>
  (props.character?.Role || [])
    .filter(r => r.roleName)
    .reduce((sum, r) => sum + (r.Lv || 0), 0)
);


async function levelUpRole(role) {
  if (!role || !role.roleName) return;
  if (role.Lv >= 10) {
    alert(`${role.roleName}は最大Lvです`);
    return;
  }
  // -----------------------
  // 1. Role レベルアップ
  // -----------------------
  role.Lv++;
  console.log(`${role.roleName} Lvアップ → ${role.Lv}`);
  if (typeof recalcStats === "function") recalcStats();
  console.log("== Lvアップ ==");
  // ステータス更新
  const characterData = await statusUpdate(props.character);
  props.character = characterData;

  // -------------------------
  // 2. 成長タイプの取得
  // -------------------------
  // 例：種族 or クラスに growthType を置く
  const type = props.character.raceType || "人族";

  // -------------------------
  // 3. 累積必要経験値（nextLevelExp）の再計算
  // -------------------------
  const nextExp = getExperience(type, role.Lv + 1);

  // experience は累積なので変更しない
  props.character.stats.nextLevelExp = nextExp;

  console.log(
    `次のレベル(Lv${role.Lv + 1}) までの累積必要経験値 = `,
    nextExp
  );

  // -------------------------
  // 4. レベルアップモード終了
  // -------------------------
  levelUpMode.value = false;
}
const addExp = (amount) => {
  props.character.stats.experience =
    Math.max(0, props.character.stats.experience + amount);
  console.log("経験値:", props.character.stats.experience);
};

// 名前更新
function updateRoleNameFont() {
  const roles = (props.character?.Role || []).filter(r => r.roleName);
  console.log("名前更新:", roles);
  // roles.forEach((role, index) => {
  //   const el = document.getElementById(`role-name-${index}`);

  //   fitTextForElement({
  //     el,
  //     text: role.roleName, // ← 自動調整したい文字
  //     maxFontSize: 26,     // ← お好みで
  //     minFontSize: 12
  //   });
  // });
}

// 不要になる箇所
// Lvや選択が変わるたびに再計算
watch(
  [selectedRace, selectedClass, selectedAttribute],
  () => {
    recalcStats();
  }
);

// ★ 新しく追加したい監視
watch(
  () => selectedSkillDetail.value,
  (newVal, oldVal) => {
    console.log("Skill updated:", newVal);
    console.log(" selectedSkillDetail.value :", selectedSkillDetail.value);
  },
  { deep: true }
);

function roundTo(val, digit = 0) {
  const n = Number(val) || 0;
  const p = Math.pow(10, digit);
  return Math.round(n * p) / p;
}

</script>
<style scoped>
/* ================================
   魔法タブ専用テーブル（完全隔離）
================================ */

/* テーブル全体 */
.attr-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  /* 他CSSの影響を遮断 */
  background: transparent;
  color: #2b1a00;
  font-size: 28px;
}

/* ================================
   ヘッダー（固定＋色付き）
================================ */

.sticky-header th {
  background-color: #f2d9a6; /* ← ヘッダー専用色 */
  color: #2b1a00;

  border: 2px solid #9c7a3c;
  padding: 8px 4px;
  text-align: center;
  font-weight: bold;
}

/* ================================
   本文（色を付けない）
================================ */
.magic-table-wrapper[data-v-c6fc30c5] {
    height: 635px;
    max-width: 705px;
    background: radial-gradient(circle at center, #5e5b54 0%, #423d2f 100%);
    border: 5px solid #b58b4c;
    /* overflow: auto; を削除 */
}

.scrollable-container {
  height: 100%;
  overflow: auto;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f2d9a6;
  color: #2b1a00;
}

.attr-table tbody td {
  background: transparent; /* ★ 明示的に無色 */
  color: #ffffff;

  border: 2px solid #9c7a3c;
  padding: 6px 6px;
  vertical-align: top;
  width: 150px;
}

/* 行・セルに変な色が付かないよう保険 */
.attr-table tbody tr {
  background: transparent;
}

/* ================================
   Rank / 名前セル内部（前の続き）
================================ */

.attr-table .magic-cell-inner {
  display: grid;
  grid-template-columns: 40px 1px 1fr;
  align-items: center;
}

.attr-table .magic-rank {
  font-weight: bold;
  font-size: 24px;
  text-align: right;
  padding-right: 4px;
}

.attr-table .magic-sep {
  width: 1px;
  height: 100%;
  background-color: #9c7a3c;
}

.attr-table .magic-name {
  font-size: 28px;
  padding-left: 6px;
  white-space: nowrap;
}


</style>
<style scoped>
/* ==================== 
   基本レイアウト 
 ==================== */
:root {
  --header-height: 54px;
}

#scalable-root {
  display: flex;
  justify-content: center;
  font-family: 'Cinzel', serif;
}

.container {
  width: 705px;
  max-width: none !important;
  min-height: 820px;
  border: 3px solid #b58b4c;
  border-radius: 16px;
  padding: 2px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  background-image: url('/src/assets/images/入力ホーム.jpg');
  font-size: 20px;
}


/* ==================== 
   ヘッダー・タイトル 
   ==================== */
.container h1 {
  text-align: center;
  color: #5a3b12;
  text-shadow: 0 2px 2px rgba(0, 0, 0, 0.3);
  margin-top: 0;
  margin-bottom: 0;
}


/* ==================== 
   タブ 
   ==================== */
.container .tabs {
  margin-top: 1px;
  display: flex;
  gap: 6px;
  margin: 8px 0;
}

.tabs button {
  background: linear-gradient(#fceabb, #f8b500);
  border: 2px solid #b58b4c;
  border-radius: 10px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: bold;
  color: #5a3b12;
  box-shadow: 0 2px 0 #a0722a;
  margin-right: 5px;
  font-size: 20px;
  max-height: 50px;
}

.tabs button.active {
  background: linear-gradient(#fff6d6, #f0c04f);
  border-color: #a0722a;
  font-weight: bold;
}


/* ==================== 
   入力フィールド 
   ==================== */
#name {
  font-size: 20px;
  font-weight: bold;
  width: 250px;
  height: 40px;
}

.name_input {
  font-weight: bold;
  color: #ffe37b;
  margin-top: 8px;
  font-size: 20px;
  background-color: #b58b4c67;
  display: block;
  padding: 10px;
  text-align: center;
  border-radius: 10px;
}

input[type="text"], 
input[type="number"] {
  border: 2px solid #b58b4c;
  border-radius: 8px;
  margin: -4px 0;
  font-size: 20px;
  font-weight: bold;
  width: 150px;
  height: 40px;
  background: #fffdf6;
  text-align: center;
}

.name-and-button {
  width: 520px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.name-and-button input {
  flex: 1;
}

.name-and-button button {
  margin: 15px 0 0 20px;
  padding: 6px 12px;
  font-size: 1rem;
  white-space: nowrap;
}


/* ==================== 
   ボタン 
   ==================== */
/* StatsTab コンポーネント専用スコープ */
.container button {
  background: linear-gradient(#fceabb, #f8b500);
  border: 2px solid #b58b4c;
  border-radius: 999px;
  padding: 4px 3px;
  font-weight: bold;
  color: #5a3b12;
  cursor: pointer;
  margin: 0;
  box-shadow: 0 2px 0 #a0722a;
}

.container button:hover {
  filter: brightness(1.05);
}

.container button:disabled {
  background-color: #888;
  cursor: not-allowed;
  opacity: 0.6;
}

/* レベルアップ専用 */
.container .lvup-btn {
  transition: transform 0.2s;
}

.container .lvup-active {
  animation: bounceY 1.2s ease-in-out infinite;
  filter: brightness(1.15);
}

/* アニメーション */
@keyframes bounceY {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}



/* ==================== 
   テーブル共通 
   ==================== */
.container table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #b58b4c;
  padding: 6px;
  text-align: center;
  height: 33px;
  box-sizing: border-box;
}

th {
  background: #f5deb3;
}

/* 各列の幅を明確に固定 */
.table-wrapper th:nth-child(1),
.table-wrapper td:nth-child(1) {
  width: 95px;
  min-width: 95px;
  max-width: 95px;
}

.table-wrapper th:nth-child(2),
.table-wrapper td:nth-child(2) {
  width: 60px;
  min-width: 60px;
  max-width: 60px;
}

.table-wrapper th:nth-child(3),
.table-wrapper td:nth-child(3) {
  width: 50px;
  min-width: 50px;
  max-width: 50px;
}

table thead tr:first-child {
  /* height: var(--header-height); */
  background: linear-gradient(#f8e0a0, #f5deb3);
  height: 75px;
  max-height: 75px;
  min-height: 75px;
}

table thead th {
  font-weight: bold;
  font-size: 1.1em;
}

.role-header {
  max-width: 120px;
  min-width: 120px;
  position: relative;
  overflow: hidden;
}

.role-with-bg {
  position: relative;
  overflow: hidden;
}

.role-header-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.role-icon-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.15; /* 背景として薄く表示 */
  z-index: 1;
}
/* 上半分を表示（画像の上半分を見せる） */
.role-bg-top {
  top: 0%;
}

/* 下半分を表示（画像の下半分が見える） */
.role-bg-bottom {
  top: 0%;           /* ← 下半分だけが枠に表示される */
}
.role-name-text {
  position: relative;
  z-index: 2;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8); /* 文字を読みやすく */
}

.role-lv-cell {
  position: relative;
}

.role-lv-cell .lv-btn {
  position: relative;
  z-index: 2;

  /* 透明を廃止してしっかりした金色系ボタンに */
  background: linear-gradient(#fceabb, #f5c76b);
  border: 2px solid #b58b4c;
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: bold;
  color: #5a3b12;
  box-shadow: 0 2px 0 #a0722a;

  font-size: 20px;
  min-width: 68px;
}
.lv-btn-active {
  background: linear-gradient(#ffe9a3, #ffce55);
  border-color: #d9a84f;
  color: #4c2f0a;
  filter: brightness(1.15);
  box-shadow: 0 2px 5px rgba(255, 210, 120, 0.6);
}
.lv-btn-inactive {
  background: linear-gradient(#d2c7a1, #b8ab86);
  border-color: #a89a7a;
  color: #6a5a38;
  box-shadow: none;
  filter: brightness(0.95);
}


.role-total-Lv {
  font-size: 28px;
  font-weight: bold;
  max-height: 40px;
  padding: 0;
}

.role-list {
  min-width: 75px;
}

.all-list {
  min-width: 50px;
}

.passive-header {
  min-width: 22px;
}

.left-col {
  width: 60px;
  text-align: left;
}

.attr-head-col,
.attr-magic-col {
  width: 225px;
  min-width: 225px;
  max-width: 225px;
}

.exp-cell, 
.exp-btn-cell {
  padding: 5px;
  border: 0 solid #b58b4c;
}


/* ==================== 
   スクロール可能テーブル 
   ==================== */
.table-wrapper {
  height: 635px;
  max-width: 705px;
  background: radial-gradient(circle at center, #5e5b54 0%, #423d2f 100%);
  border: 5px solid #b58b4c;
  overflow: auto;
}

.table-wrapper table {
  width: auto;
  border-collapse: separate; /* collapseからseparateに変更 */
  border-spacing: 0; /* セル間の隙間をなくす */
}

/* ヘッダー行の固定（上方向） */
.table-wrapper thead th,
.table-wrapper thead td {
  border: 1px solid #b58b4c; /* 2pxから1pxに統一 */
  background: #f5deb3;
  position: sticky;
  color: #3b2f1e;
  padding: 0;
  box-sizing: border-box;
}

.header-row-1 th {
  top: 0;
  height: 50px;
  z-index: 30;
}

.header-row-2 th {
  top: 75px; /* 実測値に合わせて調整 */
  height: 48px;
  z-index: 30;
}

/* tbody のセルにもborderを個別に設定 */
.table-wrapper tbody td {
  border: 1px solid #b58b4c;
  box-sizing: border-box;
}

/* 左3列の固定（横方向） */
.table-wrapper tbody td:nth-child(1),
.table-wrapper tbody td:nth-child(2),
.table-wrapper tbody td:nth-child(3) {
  position: sticky;
  background: #f5deb3;
  color: #3b2f1e;
  font-weight: 800;
  z-index: 10;
}

.table-wrapper tbody td:nth-child(1) {
  left: 0;
  border-right: 2px solid #b58b4c;
}

.table-wrapper tbody td:nth-child(2) {
  left: 95px;
  border-right: 2px solid #b58b4c;
}

.table-wrapper tbody td:nth-child(3) {
  left: 155px;
  border-right: 2px solid #b58b4c;
}

/* ヘッダーの左3列も固定 */
.header-row-1 th:nth-child(1),
.header-row-2 th:nth-child(1) {
  left: 0;
  z-index: 40;
  border-right: 2px solid #b58b4c;
}

.header-row-1 th:nth-child(2),
.header-row-2 th:nth-child(2) {
  left: 95px;
  z-index: 40;
  border-right: 2px solid #b58b4c;
}

.header-row-1 th:nth-child(3),
.header-row-2 th:nth-child(3) {
  left: 155px;
  z-index: 40;
  border-right: 2px solid #b58b4c;
}


/* ==================== 
   属性関連 
   ==================== */
.attr-cell {
  height: 0;
  position: relative;
  transform: translate(0%, 100%);
}
.magic-icon-wrap {
  position: relative;
  width: 150px;
  height: 50px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attr-icon-wrap {
  position: relative;
  width: 50px;
  height: 50px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-Attribute-img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.attr-cell-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.icon-Attribute-header {
  width: 32px;
  height: 32px;
}

.clickable_Attribute {
  position: relative;
  text-align: center;
  cursor: pointer;
}

.clickable_Attribute.ready {
  background-color: #f5deb3;
}

.clickable_Attribute:not(.ready) {
  background-color: #d3bf9b;
}


/* ==================== 
   スキル関連 
   ==================== */
.skill-cell {
  padding: 0;
}

.skill-inner {
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  border-left: 6px solid transparent;
  border-radius: 6px;
}

.type-a { background-color: rgba(255, 0, 0, 0.2); }
.type-s { background-color: rgba(255, 255, 0, 0.2); }
.type-q { background-color: rgba(0, 255, 0, 0.2); }

.skill-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: bold;
}

.skill-clickable {
  cursor: pointer;
  text-decoration: underline;
}

.skill-clickable:hover {
  color: #ffcc00;
}

.skill-detail-box {
  height: 185px;
  margin-top: 4px;
  font-size: 20px;
  color: #ffeecc;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 10px;
  border-radius: 6px;
}

.skill-name-detail-box {
  font-size: 30px;
  height: 48px;
  margin-top: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: bold;
}

.skill-header {
  height: 45px;
  display: grid;
  grid-template-columns: 2fr 5.5fr 1.5fr 1fr;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.skill-ruby {
  text-align: center;
  font-size: 0.85em;
}

.skill-keito {
  font-size: 30px;
  text-align: center;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.skill-keito__icon {
  width: 25px;
  height: 25px;
  object-fit: contain;
  vertical-align: middle;
}

.skill-type {
  font-size: 30px;
  text-align: center;
}

.skill-power {
  display: flex;
  align-items: center;
  height: 20px;
  gap: 0.5em;
}

.skill-power .label {
  min-width: 8em;
  font-weight: bold;
}

.skill-description {
  font-size: 23px;
  display: flex;
  height: 78px;
  overflow-y: auto;
}

.arrow {
  font-size: 25px;
  font-weight: bold;
  line-height: 0;
}

.arrow.up1 {
  color: #ff6600;
}

.arrow.up2 {
  color: #ff0000;
}

.separator {
  display: inline-block;
  width: 15px;
}


/* ==================== 
   クリック可能要素 
   ==================== */
.clickable {
  position: relative;
  text-align: center;
  cursor: pointer;
  color: blue;
  text-decoration: underline;
}
</style>

