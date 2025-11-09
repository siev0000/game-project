<template>
    <div class="container">
      <form @submit.prevent="openLevelModal">

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
          <div class="table-wrapper">
<table>
  <thead>
    <!-- 1行目：属性／合計／Role名 -->
    <tr>
      <!-- 属性 -->
      <th class="role-list">
        <div class="attr-cell">
          <img
            v-if="props.character?.attribute && getAttrIcon(props.character.attribute)"
            :src="getAttrIcon(props.character.attribute)"
            :alt="props.character.attribute"
            class="icon-Attribute-img"
          />
          <span>{{ props.character?.attribute || "属性" }}</span>
        </div>
      </th>
      <!-- 合計 -->
      <th>合計</th>
      <!-- Role名（空のものは非表示） -->
      <th
        v-for="(role, rIndex) in (props.character?.Role || []).filter(r => r.roleName)"
        :key="'role-name-' + rIndex"
        class="role-header"
      >
        {{ role.roleName }}
      </th>
    </tr>

    <!-- 2行目：Lv表示 -->
    <tr>
      <td>Lv</td>
      <td class="role-total-Lv">{{ totalLevel }}</td>

      <!-- Lvボタン（名前がないRoleは非表示） -->
      <td
        v-for="(role, rIndex) in (props.character?.Role || []).filter(r => r.roleName)"
        :key="'role-lv-' + rIndex"
        class="role-lv-cell"
        @click="levelUpRole(role)"
      >
        <button class="lv-btn">Lv{{ role.Lv }}</button>
      </td>
    </tr>
  </thead>

  <!-- ステータス・技能・耐性 -->
  <tbody v-if="activeTab !== '技'">
    <tr v-for="stat in statMap[activeTab]" :key="stat">
      <td @click="selectKey(stat)">{{ stat }}</td>

      <!-- 合計値 -->
      <td>
        {{ getDisplayValue(calcTotalStat(stat), stat) }}
      </td>

      <!-- 各Role -->
      <td v-for="(role, rIndex) in (props.character?.Role || []).filter(r => r.roleName)"
        :key="'stat-' + rIndex"
      >
        {{ getDisplayValue(calcRoleStat(role, stat), stat) }}
      </td>

    </tr>
  </tbody>

  <!-- スキル -->
  <tbody v-else>
    <tr v-for="i in 10" :key="'skill-' + i">
      <td>技</td>
      <td>{{ i }}</td>

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
        </div>
      </form>

      <!-- 選択項目の説明 -->
      <div class="skill-detail-box" v-if="selectedSkillDetail">
        <div class="skill-header">
          <span class="skill-keito">
            <img
              v-if="getAttackIcon(selectedSkillDetail?.攻撃手段)"
              :src="getAttackIcon(selectedSkillDetail?.攻撃手段)"
              :alt="selectedSkillDetail?.攻撃手段 || ''"
              class="skill-keito__icon"
            />
            <span class="skill-keito__label">{{ selectedSkillDetail?.攻撃手段 }}</span>
          </span>
          <ruby class="skill-name-detail-box" :class="typeClass(selectedSkillDetail.行動)">
            {{ selectedSkillDetail.名前 }}
            <rt>{{ displayRuby(selectedSkillDetail?.ルビ) }}</rt>
          </ruby>
          
          <span class="skill-keito">
            {{ selectedSkillDetail.系統 === 0 ? '' : selectedSkillDetail.系統 }}
          </span>

          <span class="skill-type"  :class="typeClass(selectedSkillDetail.行動)">{{ selectedSkillDetail.行動 }}</span>
        </div>
        <hr />

        <div class="skill-power">
          <span class="label">使用するステータス:</span>
          <span class="values">
            <template v-if="selectedSkillDetail.判定">
              {{ selectedSkillDetail.判定 }}
              <span class="arrow up2">⬆⬆</span>
            </template>

            <span v-if="selectedSkillDetail.判定 && selectedSkillDetail.追加威力" class="separator"></span>

            <template v-if="selectedSkillDetail.追加威力">
              {{ selectedSkillDetail.追加威力 }}
              <span class="arrow up1">⬆</span>
            </template>

            <template v-if="!selectedSkillDetail.判定 && !selectedSkillDetail.追加威力">
              なし
            </template>
          </span>
        </div>

        <hr />
        <div class="skill-description">{{ selectedSkillDetail.説明 }}</div>
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
      <ClassModal v-if="showClassModal" :selectedRace="selectedRace" @close="showClassModal = false" @select="selectClass" />
      <AttributeModal v-if="showAttributeModal" :attributes="availableAttributes" @close="showAttributeModal = false" @select="selectAttribute" />

    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import RaceModal from '@/components/modals/RaceModal.vue'
import ClassModal from '@/components/modals/ClassModal.vue'
import AttributeModal from '@/components/modals/AttributeModal.vue'
// 必ず使う
import { loadGameData, statMap, statDescriptions, allData, attributeList, race_attributes, Skill_List } from '@/constants/statData.js';
import { playerGlobalData } from '@/scripts/characterData.js'

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

const tabs = ['ステータス', '技能', '耐性', '技']
const activeTab = ref('ステータス')


const raceStats = ref({})
const classStats = ref({})
const totalStats = ref({})

const selectedSkillDetail = ref(null);

const raceLv = ref(1)   // 初期値1
const classLv = ref(9)  // 初期値1

// 取得
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
  // console.log("displayRuby called:", val, typeof val);
  return val === 0 ? '' : val;
};

onMounted(async () => {
  await loadGameData();
  // console.log(allData.value, attributeList.value, Skill_List.value);
  console.log("== ステータスタブ ==")
  console.log(props.character)
  recalcStats();
})

const imageMap = import.meta.glob('@/assets/images/**/*', { eager: true, import: 'default' })
const getImageUrl = (relativePath) => {
  try {
    const match = Object.entries(imageMap).find(([key]) => key.endsWith(relativePath))
    // // console.log("getImageUrl : ", match, relativePath)

    return match ? match[1] : ''
  } catch {
    return ''
  }
}

const attrIconMods = import.meta.glob(
  "/src/assets/images/属性アイコン/100/*.webp",
  { eager: true, as: "url" }
);
const ATTR_ICONS = {};
for (const [path, url] of Object.entries(attrIconMods)) {
  const filename = path.split("/").pop().replace(/\.webp$/i, "");
  ATTR_ICONS[filename] = url; // 例：ATTR_ICONS["力場"] = "blob:..."
}
const getAttrIcon = (attr)=> {
  const name = (attr?.属性名 || attr?.name || "").trim();
  return name && ATTR_ICONS[name] ? ATTR_ICONS[name] : "";
}

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
const getAttackIcon = (method) => {
  const raw = (method ?? "").toString().trim();
  if (!raw) return "";

  const noSpace = raw.replace(/\s+/g, "");
  const noParen = raw.replace(/[（(].*?[)）]/g, "").trim();
  const noParenNoSpace = noParen.replace(/\s+/g, "");

  return (
    ATTACK_ICONS[raw] ||
    ATTACK_ICONS[noSpace] ||
    ATTACK_ICONS[noParen] ||
    ATTACK_ICONS[noParenNoSpace] ||
    ATTACK_ICONS["default"] || // あればフォールバック
    ""
  );
};


// 役割: Role[] ベースで totalStats を再計算
const recalcStats = () => {
  const roles = (props.character?.Role || []).filter(r => r.roleName);
  const newTotalStats = {};

  // 対象キー（必要に応じて耐性も含める）
  const keys = [...new Set([
    ...statMap['ステータス'],
    ...statMap['技能'],
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
      // それ以外は (/10 * Lv) を合算（丸めは最後の表示でgetDisplayValueに任せる）
      const sum = roles.reduce((acc, role) => {
        return acc + (getBase(role, key) / 10) * (role.Lv || 0);
      }, 0);
      newTotalStats[key] = sum;
    }
  });

  totalStats.value = newTotalStats;
  console.log("== recalcStats ==")
  console.log(newTotalStats)
};


const selectRace = (raceName) => {
  // console.log("selectRace raceName:", raceName)
  // console.log(allData)
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

const selectClass = (className) => {
  // console.log("selectClass className:", className)
  // console.log(allData)
  // クラスデータ全体を検索してセット
  const classObj = allData.value.find(c => c.名前 === className);
  if (classObj) {
    selectedClass.value = classObj;
    // classLv.value = classObj.Lv ?? 1;
  }
  // console.log(selectedClass.value)
  showClassModal.value = false;
  recalcStats();
};

// データ全体を検索して返す
const selectStatsData = (name) => {
  const statsDataObj = allData.value.find(c => c.名前 === name);
  return statsDataObj
};

const selectAttribute = (selectAttributes) => {
  // Attribute
  // console.log("selectAttribute selectAttributes:", selectAttributes)
  // console.log(showAttributeModal.value)
  // console.log("selectedAttribute 動作確認:")
  // console.log(selectAttributes)
  // console.log(selectAttributes.属性名)
  selectedAttribute.value = selectAttributes
  showAttributeModal.value = false;
  // recalcStats();
};

/**
 * 指定ステータスの合計値（Lv比例で全Role合算）
 * ※ SIZのみ例外：Lv関係なく最大値を返す
 * ※ 最終結果は四捨五入
 */
function calcTotalStat(statKey) {
  if (!props.character?.Role) return 0;

  const roles = props.character.Role.filter(r => r.roleName);

  // === SIZだけ特殊 ===
  if (statKey === "SIZ") {
    const maxValue = roles.reduce((max, role) => {
      const data = selectStatsData(role.roleName);
      const base = data?.[statKey] || 0;
      return Math.max(max, base);
    }, 0);
    return Math.round(maxValue);
  }

  // === 通常処理 ===
  const total = roles.reduce((sum, role) => sum + calcRoleStat(role, statKey), 0);
  return Math.round(total);
}

/**
 * 単一Roleの指定ステータス値を取得（Lv比例）
 * ※ SIZのみ例外：Lvによる補正なし（基礎値をそのまま返す）
 */
function calcRoleStat(role, statKey) {
  if (!role?.roleName) return 0;

  const data = selectStatsData(role.roleName);
  const base = data?.[statKey] || 0;

  // === SIZだけ特別扱い ===
  if (statKey === "SIZ") {
    return base; // レベル無関係にそのまま
  }

  // === 通常ステータス ===
  return base / 10 * (role.Lv || 0);
}


// 数値にSIZボーナスを適用して返す
function getDisplayValue(value, key) {
  if (key === "特徴") {
    return `${value || ""}`;
  }

  const baseValue = typeof value === "number" ? value : parseFloat(value) || 0;

  // SIZはtotalStatsから取得（SIZボーナス計算用）
  const siz = totalStats.value["SIZ"] ?? 100;
  const bonusPercent = getSizeBonus(siz);

  const bonusKeysPlus = ["HP", "攻撃", "威圧"];
  const bonusKeysMinus = ["回避", "隠密", "軽業"];

  if (bonusKeysPlus.includes(key)) {
    if (key === "威圧") {
      const TechniqueBonus = Math.round(bonusPercent);
      return baseValue + TechniqueBonus;
    } else {
      const multiplier = 1 + bonusPercent / 100;
      return Math.round(baseValue * multiplier);
    }
  } else if (bonusKeysMinus.includes(key)) {
    if (key === "隠密" || key === "軽業") {
      const TechniqueBonus = Math.round(bonusPercent);
      return baseValue - TechniqueBonus;
    } else {
      const multiplier = 1 + bonusPercent / 100;
      return Math.round(baseValue * (1 / multiplier));
    }
  } else {
    return baseValue;
  }
}

// サイズボーナスの計算
function getSizeBonus(siz) {
  if (siz >= 180) {
    return Math.round(siz / 50 + 8);;
  } else if (siz <= 150) {
    return -Math.round((160 - siz) / 3);
  } else {
    return 0;
  }
}

//Skillを取得
function getSkills(data, level) {
  const skills = [];
  for (let i = 1; i <= level; i++) {
    const key = `Skill${i}`;
    if (data[key]) skills.push(data[key]);
  }
  return skills;
}

// 技選択時処理
const onSkillSelect = (skillName) => {
  if (!skillName) return;

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

const isCharacterValid = computed(() => {
  return (
    characterName.value.trim() !== "" &&
    selectedRace.value &&
    selectedClass.value &&
    selectedAttribute.value &&
    raceLv.value + classLv.value === 10
  );
});

// ユニークIDをランダム生成（16桁ランダム英数字）
function generateId(length = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const totalLevel = computed(() =>
  (props.character?.Role || [])
    .filter(r => r.roleName)
    .reduce((sum, r) => sum + (r.Lv || 0), 0)
);

function levelUpRole(role) {
  if (!role || !role.roleName) return;
  if (role.Lv >= 10) {
    alert(`${role.roleName}は最大Lvです`);
    return;
  }
  role.Lv++;
  console.log(`${role.roleName} Lvアップ → ${role.Lv}`);
  if (typeof recalcStats === "function") recalcStats();
}


// 不要になる箇所
// Lvや選択が変わるたびに再計算
watch(
  [selectedRace, selectedClass, selectedAttribute, raceLv, classLv],
  (
    [newRace, , , newRaceLv, newClassLv],
    [oldRace, , , oldRaceLv, oldClassLv]
  ) => {
    if (newRace?.分類 === "人族") {
      raceLv.value = 0;
      classLv.value = 10;
    } else {
      if ( raceLv.value == 0){
        raceLv.value = 1;
      }
      raceLv.value = Math.min(10, raceLv.value);
      classLv.value = Math.min(10, classLv.value);

      const total = raceLv.value + classLv.value;

      if (total !== 10) {
        if (newRaceLv !== oldRaceLv) {
          // 種族側を動かした → クラス側を調整
          classLv.value = Math.max(0, 10 - raceLv.value);
        } else if (newClassLv !== oldClassLv) {
          // クラス側を動かした → 種族側を調整
          raceLv.value = Math.max(0, 10 - classLv.value);
        }
      }
    }
    recalcStats();
  }
);


// ★ 新しく追加したい監視
watch(
  () => selectedSkillDetail,
  (val, oldVal) => {
    // console.log("selectedSkillDetail が変化しました:", { newVal: val, oldVal });
  },
  { deep: true, immediate: true } // 初期値も出したいなら
);

const confirmCharacter = async () => {
  if (!isCharacterValid.value) return; // 念のため防御

  // テンプレートをコピー
  const characterData = structuredClone(playerGlobalData);

  // console.log("テンプレートをコピー:", characterData);

  // 主人公データを party[0] に格納する想定で処理
  const mainChar = characterData.party[0];

  // 入力内容を反映
  characterData.name = characterName.value; // グローバル側の名前
  mainChar.name = characterName.value;      // 主人公キャラの名前
  mainChar.race = selectedRace.value.名前;

  // クラス情報
  mainChar.Role[0] = {
    roleName: selectedClass.value.名前,
    Lv: classLv.value,
    Ef: 0,
  };
  mainChar.Role[1] = {
    roleName: selectedRace.value.名前,
    Lv: raceLv.value,
    Ef: 0,
  };

  // ステータス
  mainChar.stats.allLv = raceLv.value + classLv.value;
  mainChar.stats.baseStats = totalStats.value;
  mainChar.stats.abilities = {}; // 技は後で処理

  characterData.id = generateId(); // ランダムID
  characterData.name = characterName.value;
  characterData.race = selectedRace.value.名前;
  characterData.class = selectedClass.value.名前;


  // console.log("作成キャラクター:", characterData);
  alert("キャラクター作成が完了しました！");
  // 🔽 最後にDBへ保存
  await saveCharacterToDB(characterData);
};

// キャラ登録処理
async function saveCharacterToDB(characterData) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("ログインしてください");
    return;
  }

  try {
    const res = await fetch("/api/characters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(characterData),
    });

    const result = await res.json();
    if (res.ok) {
      // console.log("キャラクター登録成功:", result);
      alert("キャラクター登録が完了しました！");
      router.push('/Dashboard')

    } else {
      alert("登録失敗: " + result.error);
    }
  } catch (err) {
    console.error("キャラクター登録エラー:", err);
    alert("通信エラーでキャラクター登録できませんでした。");
  }
};

async function returnDashboard(){
  router.push('/Dashboard')
}


</script>



<style scoped>
.clickable {
  cursor: pointer;
  color: blue;
  text-decoration: underline;
}

.tabs {
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
  font-size: 25px;
}

.tabs button.active {
  background: linear-gradient(#fff6d6, #f0c04f);
  border-color: #a0722a;
  font-weight: bold;
}

.container {
  width: 705px ;   /* 横幅いっぱいに */
  max-width: none !important;
  min-height: 820px;
  /* background: rgba(255, 255, 255, 0.9); */
  border: 3px solid #b58b4c;
  border-radius: 16px;
  padding: 5px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  font-size: 20px;
}

#scalable-root {
  display: flex;
  justify-content: center;
  /* background: radial-gradient(circle at center, #fdf6e3 0%, #e4d2a0 100%); */
  font-family: 'Cinzel', serif;
}

.role-header {
  width: 200px;
}

.role-total-Lv {
  font-size: 28px;
  font-weight: bold;
  max-height: 40px;
  padding: 0px;
}

#name{
  font-size: 20px;
  font-weight: bold;
  width: 250px;
  height: 40px;
}
h1 {
  text-align: center;
  color: #5a3b12;
  text-shadow: 0 2px 2px rgba(0,0,0,0.3);
  margin-top: 0px;
  margin-bottom: 0px;
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
  text-align: center; /* 数値・テキストを中央寄せ */
}


.clickable {
  cursor: pointer;
  color: #004f7a;
  text-decoration: underline;
}

button {
  background: linear-gradient(#fceabb, #f8b500);
  border: 2px solid #b58b4c;
  border-radius: 999px;
  padding: 4px 12px;
  font-weight: bold;
  color: #5a3b12;
  cursor: pointer;
  margin-top: 0px;
  margin-bottom: 0px;
  box-shadow: 0 2px 0 #a0722a;
}

button:hover {
  filter: brightness(1.05);
}

:root {
  --header-height: 54px; /* ヘッダーの実際の高さ */
}

table {
  width: 100%;
  border-collapse: collapse;
}

/* ヘッダー行の高さと装飾 */
table thead tr:first-child {
  height: var(--header-height);
  background: linear-gradient(#f8e0a0, #f5deb3);
}

table thead th {
  font-weight: bold;
  font-size: 1.1em;
}

/* 1列目の幅固定 */
table th:first-child,
table td:first-child {
  width: 90px;
  height: 33px;
}
/* 2列目の幅固定 */
table th:first-child,
table td:first-child {
  width: 90px;
  height: 33px;
}

/* セル共通 */
th, td {
  border: 1px solid #b58b4c;
  padding: 6px;
  text-align: center;
  height: 33px;
}

th {
  background: #f5deb3;
}

/* スクロール用ラッパー */
.table-wrapper {
  height: 651px; /* 表全体の高さ */
  background: radial-gradient(circle at center, #5e5b54 0%, #423d2f 100%);
  border: 5px solid #b58b4c;
  overflow-y: auto;
  font-size: 21.6px;
}

.table-wrapper table {
  border-collapse: separate; /* collapse をやめる */
  border-spacing: 0; /* セル間の隙間を消す */
  width: 100%;
}

/* thead を固定 */
.table-wrapper thead th,
.table-wrapper thead td {
  border: 2px solid #b58b4c;
  background: #f5deb3; /* 背景透け防止 */
  position: sticky;
  z-index: 5; /* 高めに設定 */
  color: #3b2f1e;
}

/* 1行目の見出し固定 */
.table-wrapper thead tr:first-child th {
  height: 50px;
  top: 0;
  border-top: 2px solid #b58b4c;
  z-index: 3;
}

/* 2行目（Lv）を固定 */
.table-wrapper thead tr:nth-child(2) td {
  top: 66px; /* 1行目の高さに合わせる */
  border: 2px solid #b58b4c;
  z-index: 5;
}

.icon-img{
  width: 50px;
  height: 50px;
  position: absolute;
  left: 4px;
  object-fit: contain;
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
}
.icon-Attribute-img{
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.clickable {
  position: relative;
  text-align: center;
}
.clickable_Attribute{
  position: relative;
  text-align: center;
}
.attr-cell {
  display: flex;
  align-items: center; /* 縦中央揃え */
  flex-direction: row;   /* 横並び */
  gap: 6px; /* 画像と文字の間隔 */
}
.clickable_Attribute.ready {
  background-color: #f5deb3; /* 薄い緑 */
  cursor: pointer;
}
.clickable_Attribute:not(.ready) {
  background-color: #d3bf9b; /* 薄いグレー */
  cursor: pointer;
}

.skill-cell { padding: 0; }
.skill-inner {
  display: grid;
  grid-template-columns: 1fr; /* 名前のみ */
  align-items: center;
  border-left: 6px solid transparent; /* 色バー */
  border-radius: 6px;
}

/* 行動ごとの色 */
.type-a { background-color: rgba(255, 0, 0, 0.2); }   /* 赤系 */
.type-s { background-color: rgba(255, 255, 0, 0.2); } /* 黄系 */
.type-q { background-color: rgba(0, 255, 0, 0.2); }   /* 緑系 */

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
  height: 192px;
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
  margin-top: 0px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: bold;
}
.skill-header {
  height: 45px;
  display: grid;
  grid-template-columns: 2fr 5.5fr 1.5fr 1fr; /* ルビ:名前:系統:行動 */
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
  min-width: 8em; /* 左のラベル部分を固定幅にする */
  font-weight: bold;
}

.arrow {
  font-size: 25px;
  font-weight: bold;
  line-height: 0;
}
.arrow.up1 {
  color: #ff6600; /* 追加威力用の色 */
}
.arrow.up2 {
  color: #ff0000; /* 判定用の色 */
}

.skill-description{
  font-size: 23px;
  display: flex;
    /* align-items: center; */
  height: 78px;
  overflow-y: auto;
}
.skill-power {
  display: flex;
  align-items: center;
  gap: 0.5em;
}


.separator {
  display: inline-block;
  width: 15px; /* 判定と追加威力の間隔 */
}
.name-and-button {
  width: 520px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.name-and-button button {
  margin-top: 15px;
  margin-left: 20px;
  margin-bottom: 0px;
}

.name-and-button input {
  flex: 1;
}

.name-and-button button {
  padding: 6px 12px;
  font-size: 1rem;
  white-space: nowrap;
}
button:disabled {
  background-color: #888; /* 暗いグレー */
  cursor: not-allowed;
  opacity: 0.6;
}
.skill-keito {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.skill-keito__icon {
  width: 55x;
  height: 55px;
  object-fit: contain;
  vertical-align: middle;
}
.role-list {
  width: 85px;
}
</style>
