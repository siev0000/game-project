<template>
  <div id="character-select" :class="`world-${activeWorld}`">
    <header class="select-header">
      <p>{{ activeWorld === 'machine' ? 'MACHINE WORLD' : 'FANTASY WORLD' }}</p>
      <h1 class="title">キャラクター選択</h1>
      <span>{{ activeWorld === 'machine' ? '機械世界へ接続するユニットを選択' : '冒険に使用するキャラクターを選択' }}</span>
    </header>

    <!-- キャラがいない場合 -->
    <section v-if="characters.length === 0" class="empty machine-empty">
      <p>キャラクターが登録されていません。</p>
      <p class="default-machine-note">オートマン Lv10 ／ 標準装備で機械世界を開始できます。</p>
      <button type="button" class="card card-machine default-machine-card" @click="openDefaultMachineDetails">
        <span class="world-badge">MACHINE</span>
        <div class="icons"><span class="default-icon">Ω</span><span class="default-level">Lv 10</span></div>
        <p class="info">オートマン</p>
        <small>標準装備で開始</small>
      </button>
    </section>

    <!-- キャラ一覧 -->
    <template v-else>
      <nav class="world-tabs" aria-label="ワールド選択">
        <button type="button" :class="{ active: activeWorld === 'fantasy' }" @click="activeWorld = 'fantasy'">ファンタジー</button>
        <button type="button" :class="{ active: activeWorld === 'machine' }" @click="activeWorld = 'machine'">機械世界</button>
      </nav>
      <section v-if="worldCharacters.length === 0" class="empty" :class="{ 'machine-empty': activeWorld === 'machine' }">
          <p>この世界に使用できるキャラクターはいません。</p>
          <template v-if="activeWorld === 'machine'">
            <p class="default-machine-note">オートマン Lv10 ／ 標準装備で機械世界を開始できます。</p>
          <button type="button" class="card card-machine default-machine-card" @click="openDefaultMachineDetails">
            <span class="world-badge">MACHINE</span>
            <div class="icons"><span class="default-icon">Ω</span><span class="default-level">Lv 10</span></div>
            <p class="info">オートマン</p>
            <small>標準装備で開始</small>
          </button>
        </template>
      </section>
      <div v-else class="grid">
      <div
        v-for="char in worldCharacters"
        :key="char.id || char.name"
        class="card"
        :class="`card-${characterWorld(char)}`"
        @click="selectCharacter(char)"
      >
        <span class="world-badge">{{ characterWorld(char) === 'machine' ? 'MACHINE' : 'FANTASY' }}</span>
        <div class="icons">
          <img :src="getRaceImage(char.party[0])" class="icon race" />
          <img :src="getClassImage(char.party[0])" class="icon class" />
        </div>
        <p class="info">{{ char.name }} : Lv{{ char.party[0].stats.allLv }}</p>
      </div>
      </div>
    </template>

    <button class="back" @click="$router.push('/dashboard')">戻る</button>
  </div>
  <!-- モーダルを呼び出し -->
  <CharacterStatusModal
    v-if="selectedCharacter"
    :character="selectedCharacter"
    :theme="characterWorld(selectedCharacter)"
    @close="selectedCharacter = null"
    @ok="handleOk"
  />
</template>

<script>
import { buildCharacterStats, loadGameData, getRollIcon, 
  createEquipTotalSkill, statusUpdate 
  } from "@/constants/statData.js";
import CharacterStatusModal from "../components/modals/CharacterStatusModal.vue";
import { loadItemData, rebuildInventory } from "../constants/itemFactory"
import { toRaw } from 'vue'
export default {
  name: "CharacterSelectView",
  components: { CharacterStatusModal },
  data() {
    return {
      characters: [],
      selectedCharacter: null,
      activeWorld: 'fantasy',
    };
  },
  computed: {
    worldCharacters() {
      return this.characters.filter(character => this.characterWorld(character) === this.activeWorld);
    },
  },
  methods: {
    async loadCharacters() {
      const token = localStorage.getItem("authToken"); // ← JWTトークンを取得
      if (!token) {
        alert("ログイン情報がありません。再ログインしてください。");
        this.$router.push("/login");
        return;
      }

      try {
        // ゲームデータを先にロード（クラス・技など）
        await loadGameData();
        await loadItemData();
        // サーバーから最新キャラクター一覧を取得
        const res = await fetch("/api/getCharacters", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // ← トークンを送る
          },
        });

        const data = await res.json();

        if (res.ok) {
          // サーバーから取得したキャラクターをビルド
          this.characters = await Promise.all((data.characters || []).map(async (c) => await buildCharacterStats(c)));
          if (!this.characters.length || !this.characters.some(character => this.characterWorld(character) === this.activeWorld)) {
            this.activeWorld = this.characters.some(character => this.characterWorld(character) === 'fantasy') ? 'fantasy' : 'machine';
          }
          console.log("🎯 最新キャラクター一覧取得:", this.characters);
        } else {
          console.error("取得失敗:", data.error);
          alert("キャラクター一覧の取得に失敗しました。");
          this.$router.push("/login");
        }
      } catch (err) {
        console.error("通信エラー:", err);
        alert("サーバーに接続できません。");
      }
    },

    getRaceImage(char) {
      return getRollIcon(char.Role?.[1]?.roleName);
    },

    getClassImage(char) {
      return getRollIcon(char.Role?.[0]?.roleName);
    },

    characterWorld(character) {
      if (character?.world === 'machine') return 'machine';
      if (character?.world === 'fantasy') return 'fantasy';
      const roleNames = (character?.party || []).flatMap(member => (member?.Role || []).map(role => role?.roleName));
      return roleNames.includes('オートマン') ? 'machine' : 'fantasy';
    },

    async selectCharacter(selected) {
      if (!selected) return;

      // ★ パーティ全員分のインベントリを rebuildInventory で更新
      if (Array.isArray(selected.party)) {
        await Promise.all(
          selected.party.map(async member => {
            member.inventory = await rebuildInventory(member.inventory);
            // console.log("== inventory ==", toRaw(member.inventory))
            member = await statusUpdate(member)
            // 装備合計スキルを生成
            // const { equipStats, equipSkills } = await createEquipTotalSkill(member.inventory);
            // console.log("== equipSkill ==", equipStats)
            // // スキル一覧へ追加
            // member.skills.push(equipStats);
            // member.stats.activePassives.push(equipStats);

            // if (Array.isArray(equipSkills)) {
            //   for (const skill of equipSkills) {
            //     member.skills.push(skill);
            //   }
            // }

          })
        );
      }

      // console.log("全キャラクター:", this.characters);
      this.selectedCharacter = selected;
      // console.log("キャラクター選択:", toRaw(this.selectedCharacter));
    },

    async handleOk() {
      if (this.characterWorld(this.selectedCharacter) === 'machine') {
        try {
          await this.registerAutoGeneratedMachineCharacter(this.selectedCharacter);
        } catch (error) {
          console.error('自動作成オートマンの登録に失敗:', error);
          alert('キャラクターをコレクションへ登録できませんでした。登録後に開始できるよう、接続を確認してもう一度お試しください。');
          return;
        }
        const serializedCharacter = JSON.stringify(this.selectedCharacter);
        window.sessionStorage.setItem('active-adventure-character', serializedCharacter);
        window.sessionStorage.setItem('machine-world-character', serializedCharacter);
        this.$router.push('/machine-adventure');
        return;
      }
      this.selectedCharacter = null;
    },

    async registerAutoGeneratedMachineCharacter(character) {
      if (!character?.isAutoGeneratedMachineCharacter) return;
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('ログイン情報がありません');

      const collectionCharacter = {
        ...character,
        isAutoGeneratedMachineCharacter: false
      };
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(collectionCharacter)
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'コレクション登録に失敗しました');
      }

      character.isAutoGeneratedMachineCharacter = false;
      if (!this.characters.some(item => item.id === character.id)) {
        this.characters.push(character);
      }
    },

    async openDefaultMachineDetails() {
      const defaultCharacter = await buildCharacterStats({
        id: 'default_automaton_lv10',
        name: 'オートマン',
        world: 'machine',
        race: 'オートマン',
        raceLevel: 10,
        equipmentPreset: 'standard',
        party: [{
          id: 'default_automaton_lv10',
          name: 'オートマン',
          Role: [{ roleName: 'オートマン', Lv: 10, Ef: 0 }],
          stats: { baseStats: {} },
          inventory: []
        }]
      });
      defaultCharacter.world = 'machine';
      defaultCharacter.raceLevel = 10;
      defaultCharacter.equipmentPreset = 'standard';
      defaultCharacter.isAutoGeneratedMachineCharacter = true;
      this.selectedCharacter = defaultCharacter;
    },
    applyWorldBackground(world) {
      document.documentElement.style.backgroundImage = world === 'machine'
        ? 'url("/src/assets/images/歯車の背景.png")'
        : 'url("/src/assets/images/background-image.webp")';
    },
  },

  mounted() {
    this.applyWorldBackground(this.activeWorld);
    this.loadCharacters(); // ← 起動時にサーバーから最新データ取得
  },
  beforeUnmount() {
    document.documentElement.style.backgroundImage = '';
  },
  watch: {
    activeWorld(world) {
      this.applyWorldBackground(world);
    },
  },
};
</script>


<style scoped>
#character-select {
  width: 720px ;   /* 横幅いっぱいに */
  max-width: none !important;
  min-height: 1200px;
  background: linear-gradient(180deg, #251a14, #120e0b);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  padding: 20px;
  font-size: 25px;
  font-weight: 600;
}

#character-select.world-machine {
  background: radial-gradient(circle at 50% 0, #163a50, #071018 66%);
  color: #e7fbff;
}

.select-header { margin-bottom: 16px; text-align: center; }
.select-header p { margin: 0; color: #e8bd72; font-size: 15px; letter-spacing: .14em; }
.select-header span { display: block; color: rgba(255, 237, 204, .72); font-size: 15px; }
.world-machine .select-header p { color: #72e6f4; }
.world-machine .select-header span { color: rgba(203, 246, 255, .72); }

.title {
  font-size: 28px;
  margin: 4px 0;
  text-align: center;
}

.world-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.world-tabs button { min-height: 48px; border: 1px solid #8d6539; background: rgba(79, 51, 28, .75); color: #f6e0b5; font-size: 16px; cursor: pointer; }
.world-tabs button.active { background: #b57a36; color: #1e1307; }
.world-machine .world-tabs button { border-color: #3a94b4; background: rgba(13, 55, 75, .75); color: #d4f7ff; }
.world-machine .world-tabs button.active { background: #4bc6e2; color: #06141c; }

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
  background: linear-gradient(145deg, #4d301d, #24150d);
  border: 1px solid rgba(244, 195, 117, .42);
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
.machine-empty { gap: 14px; color: #c9f5ff; }
.machine-empty p { margin: 0; }
.default-machine-note { color: #a3dbe8; font-size: 15px; }
.card-machine { background: linear-gradient(145deg, #164c65, #0a202d); border-color: rgba(93, 223, 246, .6); }
.world-badge { align-self: flex-start; padding: 3px 7px; border: 1px solid rgba(255, 218, 151, .7); color: #f9d791; font-size: 13px; letter-spacing: .1em; }
.card-machine .world-badge { border-color: rgba(110, 230, 249, .75); color: #9df5ff; }
.default-machine-card { align-items: center; justify-content: center; color: #effdff; font: inherit; }
.default-machine-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(72, 218, 244, .38); }
.default-machine-card .world-badge { align-self: flex-start; }
.default-machine-card small { color: #9ee9f5; font-size: 15px; }
.default-icon, .default-level { display: grid; width: 68px; height: 68px; place-items: center; border: 1px solid #7ce7f4; background: rgba(5, 31, 43, .72); color: #b4f8ff; font-size: 30px; }
.default-level { font-size: 17px; }
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
  font-size: 18px;
  margin: 6px 0 2px;
  text-align: center;
}
</style>
