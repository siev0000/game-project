<template>
  <div id="character-select">
    <h1 class="title">キャラクター選択</h1>

    <!-- キャラがいない場合 -->
    <div v-if="characters.length === 0" class="empty">
      キャラクターが登録されていません。
    </div>

    <!-- キャラ一覧 -->
    <div v-else class="grid">
      <div
        v-for="(char, index) in characters"
        :key="index"
        class="card"
        @click="selectCharacter(index)"
      >
        <div class="icons">
          <img :src="getRaceImage(char.party[0])" class="icon race" />
          <img :src="getClassImage(char.party[0])" class="icon class" />
        </div>
        <p class="info">{{ char.name }} : Lv{{ char.party[0].stats.allLv }}</p>
      </div>
    </div>

    <button class="back" @click="$router.push('/dashboard')">戻る</button>
  </div>
  <!-- モーダルを呼び出し -->
  <CharacterStatusModal
    v-if="selectedCharacter"
    :character="selectedCharacter"
    @close="selectedCharacter = null"
    @ok="handleOk"
  />
</template>

<script>
import { buildCharacterStats, loadGameData, getRollIcon } from "@/constants/statData.js";
import CharacterStatusModal from "../components/modals/CharacterStatusModal.vue";

export default {
  name: "CharacterSelectView",
  components: { CharacterStatusModal },
  data() {
    return {
      characters: [],
      selectedCharacter: null,  // ← これを追加
    };
  },
  methods: {
    async loadCharacters() {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.characters) return;

      await loadGameData();
      this.characters = user.characters.map((c) => buildCharacterStats(c));
    },
    getRaceImage(char) {
      return getRollIcon(char.Role?.[1]?.roleName);
    },
    getClassImage(char) {
      return getRollIcon(char.Role?.[0]?.roleName);
    },
    selectCharacter(index) {
      const selected = this.characters[index];
      if (!selected) return;
      
      console.log("全キャラクター:", this.characters);
      // TODO: 後でモーダル呼び出しにつなげる
      if (!selected) return;
      this.selectedCharacter = selected;
      console.log("キャラクター選択:", this.selectedCharacter);
      
    },
    handleOk(data) {
      console.log("OKで返ってきたデータ:", data);
      this.selectedCharacter = null; // モーダルを閉じる
    }
  },
  mounted() {
    this.loadCharacters();
  },
};
</script>

<style scoped>
#character-select {
  width: 720px ;   /* 横幅いっぱいに */
  max-width: none !important;
  min-height: 1200px;
  background: #1f1f23;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  padding: 20px;
  font-size: 25px;
  font-weight: 600;
}

.title {
  font-size: 28px;
  margin: 0 0 20px;
  text-align: center;
}

.empty {
  font-size: 18px;
  opacity: 0.85;
  margin-top: 40px;
  text-align: center;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 上段：カードグリッド（2列） */
.grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 横2列固定 */
  gap: 20px;
  justify-items: center;
  align-items: start;
  align-content: start;  /* ← これを center にすると中央寄せ */
  padding: 10px 0;
  overflow-y: auto;
}

/* カード */
.card {
  width: 320px;
  height: 200px;
  background: #2a2b2f;
  border-radius: 12px;
  padding: 12px;
  box-sizing: border-box;
  text-align: center;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
}

/* アイコン部分 */
.card .icons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}
.card img {
  width: 68px;
  height:68px;
  object-fit: contain;
}

/* キャラ名・レベル */
.char-name {
  font-size: 18px;
  margin: 6px 0 2px;
}
.char-level {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

/* 下段：戻るボタン（中央下に固定） */
.back-button {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
}

.info {
  font-size: 22px;
  margin: 6px 0 2px;
  text-align: center;
}
</style>
