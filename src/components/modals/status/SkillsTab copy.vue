<template>
  <div class="tab-panel">
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


<!-- 技一覧 -->
<ul class="skill-list">
  <li
    v-for="skill in filteredSkills"
    :key="skill.名前"
    @click="selectSkill(skill)"
    :class="{ selected: selectedSkill?.名前 === skill.名前 }"
  >
    <!-- 攻撃手段アイコン -->
    <img
      v-if="getAttackIcon(skill.攻撃手段)"
      :src="getAttackIcon(skill.攻撃手段)"
      :alt="skill.攻撃手段 || ''"
      class="skill-keito__icon"
    />

    <!-- ない場合は強化.webp -->
    <img
      v-else
      src="@/assets/images/攻撃手段/強化.webp"
      alt="強化"
      class="skill-keito__icon"
    />

    {{ skill.名前 }}
  </li>
</ul>


    <!-- 詳細表示 -->
    <div class="skill-detail-box" v-if="selectedSkill">
      <div class="skill-header">
        <!-- <div class="skill-keito">
          <div class="skill-keito-wrap">
            <img v-if="getAttackIcon(selectedSkill?.攻撃手段)"
                :src="getAttackIcon(selectedSkill?.攻撃手段)"
                :alt="selectedSkill?.攻撃手段 || ''"
                class="skill-keito__icon"/>
            <div class="skill-keito__label">
              {{ selectedSkill?.攻撃手段 }}
            </div>
          </div>
        </div> -->
        <span class="skill-keito">
          <img
            v-if="getAttackIcon(selectedSkill?.攻撃手段)"
            :src="getAttackIcon(selectedSkill?.攻撃手段)"
            :alt="selectedSkill?.攻撃手段 || ''"
            class="skill-keito__icon"
          />
          <span class="skill-keito__label">{{ selectedSkill?.攻撃手段 }}</span>
        </span>
        <ruby class="skill-name-detail-box" :class="typeClass(selectedSkill.行動)">
          {{ selectedSkill.名前 }}
          <rt>{{ displayRuby(selectedSkill?.ルビ) }}</rt>
        </ruby>

        <span class="skill-keito">{{ selectedSkill.系統 === 0 ? '' : selectedSkill.系統 }}</span>
        <span class="skill-type" :class="typeClass(selectedSkill.行動)">{{ selectedSkill.行動 }}</span>
      </div>
      <hr />

      <div class="skill-power">
        <span class="label">使用するステータス:</span>
        <span class="values">
          <template v-if="selectedSkill.判定">
            {{ selectedSkill.判定 }}
            <span class="arrow up2">⬆⬆</span>
          </template>

          <span v-if="selectedSkill.判定 && selectedSkill.追加威力" class="separator"></span>

          <template v-if="selectedSkill.追加威力">
            {{ selectedSkill.追加威力 }}
            <span class="arrow up1">⬆</span>
          </template>

          <template v-if="!selectedSkill.判定 && !selectedSkill.追加威力">
            なし
          </template>
        </span>
      </div>

      <!-- 🔽 消費リソースを追記 -->
      <div class="skill-costs">
        <span v-if="selectedSkill.HP消費" class="hp">HP: {{ selectedSkill.HP消費 }}</span>
        <span v-if="selectedSkill.MP消費" class="mp">MP: {{ selectedSkill.MP消費 }}</span>
        <span v-if="selectedSkill.ST消費" class="st">ST: {{ selectedSkill.ST消費 }}</span>
      </div>

      <hr />
      <div class="skill-description">{{ selectedSkill.説明 }}</div>
    </div>
    <div class="skill-detail-box empty" v-else>
      <p>技を選択すると詳細が表示されます</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { getAttackIcon } from "@/constants/statData";

const props = defineProps({
  character: { type: Object, required: true },
  player: { type: Object, required: true }
});

const skillTypes = ["A", "S", "Q", "P"];
const currentSkillType = ref("A");
const selectedSkill = ref(null);

const filteredSkills = computed(() => {
  return (props.character.skills || []).filter(
    (s) => s.行動 === currentSkillType.value
  );
});

const selectSkill = (skill) => {
  selectedSkill.value = skill;
};

const typeClass = (type) => {
  switch (type) {
    case "A": return "type-action";
    case "S": return "type-support";
    case "Q": return "type-quick";
    case "P": return "type-passive";
    default: return "";
  }
};
const displayRuby = (val) => {
  console.log("displayRuby called:", val, typeof val);
  return val === 0 ? '' : val;
};
</script>

<style scoped>
.skill-list{
  /* color: white; */
  color: #ffeecc;
  border: 2px solid #8b5a2b;
  background: radial-gradient(circle at center, #5e5b54 0%, #423d2f 100%);
  height: 520px;
  list-style: none;
  padding-left: 0;  /* 左の余白も調整 */
  margin: 0;        /* 必要なら余白も消す */
}
.sub-tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
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
.type-action  { background: rgba(83, 0, 0, 0.9);  }
.type-support { background: rgba(83, 83, 0, 0.9); }
.type-quick   { background: rgba(0, 83, 0, 0.9); }

/* ============================ */

.skill-detail-box {
  margin-top: 12px;
  padding: 10px;
  border: 2px solid #8b5a2b;
  border-radius: 6px;
  background: rgba(37, 37, 37, 0.9);
}
.skill-detail-box {
  height: 270px;
  margin-top: 8px;
  font-size: 20px;
  padding: 6px;
  border-radius: 6px;
    /* color: white; */
  color: #ffeecc;
  overflow-y: auto;
}

.skill-header {
  height: 52px;
  display: grid;
  grid-template-columns: 2fr 5.5fr 1.5fr 1fr; /* ルビ:名前:系統:行動 */
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
}

.skill-keito-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 52px; /* アイコンが無くても高さを確保 */
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
  gap: 6px;            /* アイコンと文字の間隔 */
}
/* ================== */
/* .skill-keito__label {
  font-size: 14px;
  font-weight: bold;
  -webkit-text-stroke: 0.2px black;
  text-shadow: 0 0 6px black;
  color: #ffeecc;
} */

.skill-name-detail-box {
  font-size: 30px;
  font-weight: bold;
  height: 52px;
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
  height: 105px;
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

</style>
