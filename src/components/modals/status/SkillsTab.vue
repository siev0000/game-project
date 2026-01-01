<template>
  <!-- 作成技一覧 -->
  <div class="create-skill-panel">
  </div>
  <div class="tab-panel_skill">

    <!-- 内部タブ -->
  <div class="sub-tab-bar">
    <button
      v-for="type in skillTypes"
      :key="type"
      :class="['sub-tab-btn', type, { active: currentSkillType === type }]"
      @click="currentSkillType = type"
    >
      {{ type }}
    </button>
  </div>
  <!-- 合計表示 -->
  <div class="skill-total-bar">
    <div class="total-left">
      威力: {{ totalPower + totalAttribute }}
      <!-- 属性: {{ totalAttribute }} -->
      状態: {{ totalStates }}
      守り: {{ totalDefense }}
    </div>
    <!-- <div class="total-left">
      属性: {{ totalAttribute }}
    </div> -->
    <div class="total-right">
      <span v-if="totalHits > 0">x{{ totalHits }}</span>
      <span v-if="totalCrit.率"> Cr率 {{ totalCrit.率 }}%</span>
      <span v-if="totalCrit.威力"> Cr威力+{{ totalCrit.威力 }}</span>
    </div>
  </div>
<!-- サブタブバーの下に選択枠 -->
<div class="selected-skill-bar">

  <div class="selected-skill-slot A"
    @click="clearSelectedSkill('A')">
    <span v-if="selectedSkills.A">
      {{ selectedSkills.A.名前 }} 
      ({{ selectedSkills.A.威力?.合計 || 0  + selectedSkills.A.属性?.合計 || 0 +  selectedSkills.A.状態?.合計 || 0 }}
       / {{ selectedSkills.A.守り?.合計 || 0  + selectedSkills.A.回復量?.合計 }})
    </span>
    <span v-else>未選択</span>
  </div>

  <div class="selected-skill-slot S"
  @click="clearSelectedSkill('S')">
    <span v-if="selectedSkills.S">
      {{ selectedSkills.S.名前 }} 
      ({{ selectedSkills.S.威力?.合計 || 0  + selectedSkills.S.属性?.合計 || 0 +  selectedSkills.S.状態?.合計 || 0 }}
       / {{ selectedSkills.S.守り?.合計 || 0  + selectedSkills.S.回復量?.合計 }})
    </span>
    <span v-else>未選択</span>
  </div>

  <div class="selected-skill-slot Q"
  @click="clearSelectedSkill('Q')">
    <span v-if="selectedSkills.Q">
      {{ selectedSkills.Q.名前 }} 
      ({{ selectedSkills.Q.威力?.合計 || 0  + selectedSkills.Q.属性?.合計 || 0 +  selectedSkills.Q.状態?.合計 || 0 }}
       / {{ selectedSkills.Q.守り?.合計 || 0  + selectedSkills.Q.回復量?.合計 }})
    </span>
    <span v-else>未選択</span>
  </div>
</div>


<!-- 🔽 横並びに変更 -->
    <div class="skills-container">
      <!-- 左：技一覧 -->
      <ul class="skill-list">
        <li
          v-for="skill in filteredSkills"
          :key="skill.名前"
          @click="selectSkill(skill)"
          :class="{ selected: selectedSkill?.名前 === skill.名前 }"
        >
          <img
            v-if="getAttackIcon(skill.攻撃手段)"
            :src="getAttackIcon(skill.攻撃手段)"
            :alt="skill.攻撃手段 || ''"
            class="skill-keito__icon"
          />
          <img
            v-else
            src="@/assets/images/攻撃手段/強化.webp"
            alt="強化"
            class="skill-keito__icon"
          />
          
          <span ref="labelEl" class="skill-name">
            <ruby class="skill-name-detail-box">
            {{ skill.名前 }}
            <rt>{{ displayRuby(skill?.ルビ) }}</rt>
          </ruby>
            <!-- {{ skill.名前 }} -->
            <!-- <rt>{{ displayRuby(skill?.ルビ) }}</rt> -->
          </span>
        </li>
      </ul>

      <!-- 右：詳細 -->
      <div class="skill-detail-box" v-if="selectedSkill">
        <div class="skill-header">
          <span class="skill-keito">{{ selectedSkill.系統 === 0 ? '' : selectedSkill.系統 }}</span>
          <ruby class="skill-name-detail-box" :class="typeClass(selectedSkill.行動)" @click="setSkill(selectedSkill)">
            {{ selectedSkill.名前 }}
            <rt>{{ displayRuby(selectedSkill?.ルビ) }}</rt>
          </ruby>
          
          <span class="skill-type" :class="typeClass2(selectedSkill.行動)">{{ selectedSkill.行動 }}</span>
        </div>
        <hr />
        <div class="skill-keito_atk">
          <!-- アイコン＋ラベルをセットで -->
          <div class="skill-keito__icon-label">
            <img
              v-if="getAttackIcon(selectedSkill?.攻撃手段)"
              :src="getAttackIcon(selectedSkill?.攻撃手段)"
              :alt="selectedSkill?.攻撃手段 || ''"
              class="skill-keito__icon"
            />
            <span class="skill-keito__label">
              {{ selectedSkill?.攻撃手段 }}
            </span>
          </div>

          <!-- 消費リソース -->
          <div class="skill-costs">
            <span v-if="selectedSkill.HP消費" class="hp">HP: {{ selectedSkill.HP消費 }}</span>
            <span v-if="selectedSkill.MP消費" class="mp">MP: {{ selectedSkill.MP消費 }}</span>
            <span v-if="selectedSkill.ST消費" class="st">ST: {{ selectedSkill.ST消費 }}</span>
          </div>
        </div>


        <hr />
        <span class="label">判定:</span>
        <span class="values">
          <template v-if="selectedSkill.判定">
            {{ selectedSkill.判定 }} <span class="arrow up2">⬆⬆</span>
          </template>
          <span v-if="selectedSkill.判定 && selectedSkill.追加威力" class="separator"></span>
          <template v-if="selectedSkill.追加威力">
            {{ selectedSkill.追加威力 }} <span class="arrow up1">⬆</span>
          </template>
          <template v-if="!selectedSkill.判定 && !selectedSkill.追加威力">なし</template>
        </span>
        <hr />

        <!-- 説明 or 詳細を切り替え -->
        <div class="skill-description" @click="toggleDetail">
          <!-- 通常: 説明（なければ概要） -->
          <template v-if="!showDetail">
            <template v-if="selectedSkill.説明 && selectedSkill.説明.trim()">
              {{ selectedSkill.説明 }}
            </template>
            <template v-else>
              {{ cleanEffectOverview(selectedSkill.効果概要) }}
            </template>
          </template>

          <!-- クリックで切り替え: 詳細 -->
          <template v-else>
            <div class="skill-summary">
              {{ cleanEffectOverview(selectedSkill.効果概要) }}
            </div>
          </template>
        </div>

      </div>
      <div class="skill-detail-box empty" v-else>
        <p>技を選択すると詳細が表示されます</p>
      </div>
    </div>


  </div>
</template>

<style scoped>
.skill-total-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2px 0;
  padding: 3px 5px;
  height: 40px;
  font-weight: bold;
  background: rgba(0,0,0,0.7);
  border: 2px solid #8b5a2b;
  border-radius: 6px;
  color: #ffeecc;
}

.skill-total-bar .total-left {
  font-size: 20px;
}

.skill-total-bar .total-right {
  font-size: 18px;
  display: flex;
  gap: 10px;
}
</style>

<script setup>
import { ref, computed } from "vue";
import { getAttackIcon, fitTextToWidth } from "@/constants/statData";
import { summarizeSkill, cleanEffectOverview } from "@/constants/battleLogic";
import { toRaw } from "vue";

function flattenMagicByAttr(magicByAttr) {
  if (!magicByAttr) return [];

  return Object.entries(toRaw(magicByAttr)).flatMap(
    ([attr, list]) =>
      (list || []).map(m => ({
        ...toRaw(m),
        // ★ スキルと同じUI構造に寄せる
        種別: "魔法",
        属性: attr,
      }))
  );
}

const props = defineProps({
  character: { type: Object, required: true },
  player: { type: Object, required: true }
});

console.log("== skillsTab ==",props)

const skillTypes = ["A", "S", "Q", "P"];
const currentSkillType = ref("A");
const selectedSkill = ref(null);

// 🔽 ここで定義してから computed で使う
const selectedSkills = ref({
  A: null,
  S: null,
  Q: null
});

const allDisplaySkills = computed(() => {
  const skills = props.character.skills || [];

  const magics = flattenMagicByAttr(
    props.character.magic?.magicListByAttr
  );

  return [...skills, ...magics];
});

const filteredSkills = computed(() => {
  return allDisplaySkills.value.filter(
    s => s.行動 === currentSkillType.value
  );
});

const typeClass = (type) => {
  switch (type) {
    case "A": return "type-action";
    case "S": return "type-support";
    case "Q": return "type-quick";
    case "P": return "type-passive";
    default: return "";
  }
};

const typeClass2 = (type) => {
  switch (type) {
    case "A": return "type-a";
    case "S": return "type-s";
    case "Q": return "type-q";
    case "P": return "type-p";
    default: return "";
  }
};

const displayRuby = (val) => {
  return val === 0 ? '' : val;
};

// 選択した技（リストクリック → 詳細に反映）
const selectSkill = (skill) => {
  if (!skill) return;

  const enriched = {
    ...skill,
    ...summarizeSkill(skill, props.character),
  };

  selectedSkill.value = enriched;
  fitTextToWidth("skill-name-detail-box", 185, skill.名前 || "", 30);
};

// 決定（大きな技名ボタンをクリック）
const setSkill = (skill) => {
  if (!skill) return;
  const type = skill.行動;
  if (!['A','S','Q'].includes(type)) return;

  // 同じ技なら解除
  if (selectedSkills.value[type]?.名前 === skill.名前) {
    selectedSkills.value[type] = null;
  } else {
    selectedSkills.value[type] = skill;
  }
};

const showDetail = ref(false);
const toggleDetail = () => {
  showDetail.value = !showDetail.value;
};

// 選択中の技をクリア（確認あり）
const clearSelectedSkill = (type) => {
  if (!['A', 'S', 'Q'].includes(type)) return;
  if (!selectedSkills.value[type]) return;

  const skillName = selectedSkills.value[type].名前;

  const ok = window.confirm(
    `「${skillName}」を解除しますか？`
  );

  if (ok) {
    selectedSkills.value[type] = null;
  }
};


// 合計威力（A+S+Q）
const totalPower = computed(() => {
  return ["A","S","Q"].reduce((sum, t) => {
    return sum + (selectedSkills.value[t]?.威力?.合計 || 0);
  }, 0);
});

// 合計属性（A+S+Q）
const totalAttribute = computed(() => {
  return ["A","S","Q"].reduce((sum, t) => {
    return sum + (selectedSkills.value[t]?.属性?.合計 || 0);
  }, 0);
});

// 合計守り（A+S+Q）
const totalDefense = computed(() => {
  return ["A","S","Q"].reduce((sum, t) => {
    return sum + (selectedSkills.value[t]?.守り?.合計 || 0);
  }, 0);
});

// 合計状態（A+S+Q）
const totalStates = computed(() => {
  return ["A","S","Q"].reduce((sum, t) => {
    return sum + (selectedSkills.value[t]?.状態?.合計 || 0);
  }, 0);
});

// 攻撃回数合計
const totalHits = computed(() => {
  return ["A","S","Q"].reduce((sum, t) => {
    return sum + (selectedSkills.value[t]?.連撃?.回数 || 0);
  }, 0);
});

// クリティカル合計
const totalCrit = computed(() => {
  return ["A","S","Q"].reduce(
    (acc, t) => {
      acc.率 += selectedSkills.value[t]?.クリティカル?.率 || 0;
      acc.威力 += selectedSkills.value[t]?.クリティカル?.威力 || 0;
      return acc;
    },
    { 率: 0, 威力: 0 }
  );
});

</script>
<style scoped>
.create-skill-panel{
  /* height: 340px; */
  height: 375px;
  margin-bottom: 5px;
  background: rgba(255,255,240,0.9);
  border: 2px solid #8b5a2b;
  padding: 5px; border-radius: 8px;
}
.tab-panel_skill{
  position: relative;
  /* margin-top: 350px; */
  background: rgba(255,255,240,0.9);
  border: 2px solid #8b5a2b;
  padding: 6px; border-radius: 8px;
}
.skills-container {
  display: flex;
}

/* 267-72 */
.skill-list{
  /* color: white; */
  color: #ffeecc;
  border: 2px solid #8b5a2b;
  background: radial-gradient(circle at center, #5e5b54 0%, #423d2f 100%);
  height: 400px;
  list-style: none;
  padding-left: 0;  /* 左の余白も調整 */
  margin: 0;        /* 必要なら余白も消す */
  /* 合計620 */
  /* width: 280px; */
  width: 315px;
  list-style: none;
  padding: 6px;
  margin: 0;
  border-radius: 6px;
  border: 2px solid #8b5a2b;
  background: radial-gradient(circle at center, #5e5b54 0%, #423d2f 100%);
  color: #ffeecc;
  overflow-y: auto;
  margin-right: 6px;
}

.skill-detail-box {
  padding: 10px;
  border: 2px solid #8b5a2b;
  border-radius: 6px;
  background: rgba(37, 37, 37, 0.9);

  /* width: 350px; */
  width: 375px;
  height: 400px;
  font-size: 20px;
  padding: 6px;
  border-radius: 6px;
    /* color: white; */
  color: #ffeecc;
  overflow-y: auto;
}

.sub-tab-bar {
  display: flex;
  gap: 8px;
  /* margin-bottom: 12px; */
}

.sub-tab-btn {
  flex: 1;
  padding: 6px;
  cursor: pointer;
  background: #c8b48a;
  background-color: #b58b4c67;
  border: 1px solid #8b5a2b;
  border-radius: 6px;
  font-size: 16px;       /* フォントサイズ統一 */
  margin-bottom: 0px;
  font-weight: bold;     /* 太字 */
  text-align: center;
  transition: background 0.2s, transform 0.1s;
}
.sub-tab-btn:hover {
  transform: scale(1.05);
}

/* 選択中のタブ共通 */
.sub-tab-btn.active {
  color: #fff;
  border: 2px solid #000;
  font-size: 18px;       /* 選択時は少し大きく */
}

/* ==== サブタブ（A/S/Q） ==== */
.sub-tab-btn.A {
  background: rgb(83, 0, 0);   /* 赤系（行動） */
}
.sub-tab-btn.A.active {
  background: #990000;                /* 選択中は濃い赤 */
}

.sub-tab-btn.S {
  background: rgba(83, 83, 0); /* 黄系（強化） */
}
.sub-tab-btn.S.active {
  background: #b3b300;                /* 選択中は濃い黄 */
}

.sub-tab-btn.Q {
  background: rgba(0, 83, 0);   /* 緑系（基礎強化） */
}
.sub-tab-btn.Q.active {
  background: #009900;                /* 選択中は濃い緑 */
}
.sub-tab-btn.P {
  background: rgb(83, 83, 83);
}
.sub-tab-btn.P.active {
  background: rgb(141, 141, 141);
}
/* ==== 技行の色（背景帯） ==== */
.type-a { background-color: rgba(83, 0, 0); }   /* 赤系 */
.type-s { background-color: rgba(83, 83, 0); } /* 黄系 */
.type-q { background-color: rgba(0, 83, 0); }   /* 緑系 */

/* ==== 詳細表示のタイプタグ ==== */
.type-action  { 
  background: rgba(83, 0, 0, 0.9); 
  border: 2px solid rgb(255, 0, 0);    /* 赤枠 */
}

.type-support { 
  background: rgba(83, 83, 0, 0.9); 
  border: 2px solid rgb(255, 255, 0);  /* 黄枠 */
}

.type-quick   { 
  background: rgba(0, 83, 0, 0.9); 
  border: 2px solid rgb(0, 255, 0);    /* 緑枠 */
}


/* ============================ */


.skill-header {
  height: 52px;
  display: grid;
  grid-template-columns: 1.8fr 6.4fr 1.8fr; /* ルビ:名前:系統:行動 */
  align-items: center;
  gap: 4px;
  text-align: center;
  /* transform は削除！ */
}

.skill-keito {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  height: 46px;
}

.skill-keito_atk{
  display: grid;
  grid-template-columns: 40% 60%; /* アイコン20% / 名前40% / コスト40% */
  align-items: center;
  gap: 0px;
  height: 46px;
}

.skill-keito-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 52px; /* アイコンが無くても高さを確保 */
}
.skill-keito__icon-label {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 46px;
}
.skill-keito__icon {
  width: 55px;
  height: 55px;
  /* width: 45px;
  height: 45px; */
  /* margin-bottom は削除！ */
}
/* ================== */
.skill-attack__icon{
  width: 45px;
  height: 45px;
}
.skill-list li {
  display: flex;
  align-items: center; /* ← 縦方向中央揃え */
}
/* ================== */
/* .skill-keito__label {
  font-size: 14px;
  font-weight: bold;
  -webkit-text-stroke: 0.2px black;
  text-shadow: 0 0 6px black;
  color: #ffeecc;
} */
.skill-name {
  font-weight: normal;
  transition: all 0.2s;
}

.skill-list li.selected .skill-name {
  font-weight: bold;
  background: rgba(255, 215, 0, 0.3); /* 金色の背景 */
  border-radius: 4px;
  /* padding: 2px 4px; */
}


.skill-name-detail-box {
  font-size: 30px;
  font-weight: bold;
  height: 52px;

  /* ボタン風に追加 */
  display: ruby;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.skill-name-detail-box:hover {
  transform: scale(1.03);
}

.skill-name-detail-box:active {
  transform: scale(0.97);
}
.skill-type {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 30px;
}


.skill-power {
  margin: 6px 0;
}
.skill-power .label {
  font-weight: bold;
  margin-right: 6px;
}
.skill-description {
  margin-top: 6px;
  height: 202px;
  white-space: pre-line;
  overflow-y: auto;
}
.arrow.up2 { color: red; font-weight: bold; }
.arrow.up1 { color: orange; }
.separator { margin: 0 4px; }

.skill-costs {
  margin-top: 6px;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  gap: 12px; /* / の代わりに間隔で区切る */
}

.skill-costs .hp {
  color: #4caf50; /* 緑 */
}

.skill-costs .mp {
  color: #2196f3; /* 青 */
}

.skill-costs .st {
  color: #ffeb3b; /* 黄色 */
}

.selected-skill-bar {
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
  padding: 0px;
  border: 2px solid #8b5a2b;
  height: 38px;
  border-radius: 6px;
  background: rgba(37, 37, 37, 0.8);
  color: #ffeecc;
}

.selected-skill-slot {
  flex: 1;
  font-size: 25px;
  /* padding: 4px; */
  text-align: center;
  border-right: 1px solid #8b5a2b;
  /* max50px */
  height: 39px;
}
.selected-skill-slot:last-child {
  border-right: none;
}

.slot-label {
  font-weight: bold;
  margin-right: 4px;
}

.selected-skill-slot.A { background: rgba(120,0,0,0.3); }
.selected-skill-slot.S { background: rgba(120,120,0,0.3); }
.selected-skill-slot.Q { background: rgba(0,120,0,0.3); }

.skill-total {
  margin-top: 6px;
  padding: 6px;
  font-weight: bold;
  text-align: right;
  background: rgba(0,0,0,0.6);
  border-radius: 4px;
}


</style>
