<template>
  <teleport to="body">
    <div class="modal-overlay" >
      <!-- @click.self="$emit('close')" -->
      <div class="modal-content" id="race-modal" >
        <h2 class="modal-header">種族を選ぶ</h2>

        <!-- タブ -->
        <div class="tabs">
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
        <ul class="race-list">
          <li
            v-for="(race, index) in filteredRaces"
            :key="race.名前"
          >
            <button @click="openDetail(index)" class="race-button">
              <span class="race-content">
                <img
                  :src="getImageUrl(race.画像url)"
                  :alt="race.名前"
                  class="race-image"
                />
                <span class="race-name">{{ race.名前 }}</span>
              </span>
            </button>
          </li>
        </ul>

        <!-- 種族説明 -->
        <div class="race-description" v-if="selectedRaceCategory">
          <p>{{ raceDescriptions[selectedRaceCategory]?.description }}</p>
        </div>

        <div class="confirm-button">
          <div class="confirm" @click="emit('close')">閉じる</div>
        </div>

        <!-- 詳細モーダル -->
        <RaceDetailModal
          v-if="showDetailModal"
          :raceList="filteredRaces"
          :currentIndex="selectedIndex"
          @close="showDetailModal = false"
          @confirm="handleRaceConfirm"
        />
      </div>
    </div>
  </teleport>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue'
import RaceDetailModal from '@/components/modals/RaceDetailModal.vue'
import { applyGlobalScale } from '@/components/useScale.js'

onMounted(() => {
  applyGlobalScale('race-modal') // ← ここで ID を渡す
})
const emit = defineEmits(['select', 'close'])

const tabTypes = ['人族', '亜人', '魔族']
const activeTab = ref('人族')
const selectedRaceCategory = ref('人族')


function handleTabClick(type) {
  activeTab.value = type
  selectedRaceCategory.value = type
}
const raceDescriptions = {
  人族: {
    description: '人族はバランスの取れた能力を持ち、どんな職業にも適応可能です。種族としての特殊能力を持たず総合ステータスが低くなりやすいです。',
    background: 'bg-human.jpg',
  },
  亜人: {
    description: '亜人は身体能力に優れた種族で、特定の職に特化しやすい特長があります。またどこかの能力値が極端に低い場合が多く、全体敵に精神が低いです。',
    background: 'bg-demi.jpg',
  },
  魔族: {
    description: '魔族は強力な魔力や特殊能力を持ちます。基礎ステータスもかなり高く一部に強力な耐性を持ちますが、その分、弱点の属性を複数持っています。',
    background: 'bg-demon.jpg',
  }
};

// src="getImageUrl(currentRace.画像url)
const allRaces = ref([])
const filteredRaces = computed(() =>
  allRaces.value.filter(r => r.分類 === activeTab.value)
)
console.log("filteredRaces :")
console.log(filteredRaces)

const showDetailModal = ref(false)
const selectedIndex = ref(0)

const openDetail = (index) => {
  selectedIndex.value = index
  showDetailModal.value = true
}

const handleRaceConfirm = (race) => {
  emit('select', race.名前)  // CharacterCreateView.vue に伝える
  showDetailModal.value = false
}

onMounted(async () => {
  const res = await fetch('/api/excel/classes')
  const data = await res.json()
  allRaces.value = data.filter(r => tabTypes.includes(r.分類))
})

const imageMap = import.meta.glob('@/assets/images/**/*', { eager: true, import: 'default' })
const getImageUrl = (relativePath) => {
  try {
    const match = Object.entries(imageMap).find(([key]) => key.endsWith(relativePath))
    console.log("getImageUrl : ", match, relativePath)

    return match ? match[1] : ''
  } catch {
    return ''
  }
}

</script>

<style scoped>
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  /* width: 100%;
  height: 100%; */
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  
  /* 中央に配置するための設定 */
  display: flex;
  justify-content: center;
  align-items: center;

  transform-origin: center center;
}

.modal-content {
  min-width: 700px ;
  min-height: 1200px;
  max-width: 700px ;
  max-height: 1200px;
  
  /* max-width: none !important; */
  font-size: 20px;

  background: #222;
  padding: 20px;
  border-radius: 10px;
  /* max-width: 90%;
  max-height: 90%; */
  overflow-y: auto;
  overflow-x: hidden;
}


.modal-header{
  color: #ffffff;;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 30px;
  font-weight: 600;
}
.tabs button {
  margin: 0 0.5rem;
  padding: 0.4rem 1rem;
  border: none;
  border-radius: 6px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 30px;
  font-weight: 600;
}

.tabs .active {
  background-color: #0056b3;
}

.race-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  font-size: 20px;
  max-height: 900px;
  overflow-y: auto;

  /* 上寄せを強制 */
  align-content: start;
}

.race-list button {
  width: 100%;
  height: 60px;
  padding: 0.5rem;
  background-color: #eee;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  color: #000;
  font-size: 30px;
}

button {
  font-size: 30px;
  font-weight: 600;
}

.race-list button:hover {
  background-color: #ddd;
}

.race-description {
  position: absolute;
  margin-top: 8px;
  height: 13%;
  font-size: 30px;
  color: #ffeecc;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 6px;
  bottom: 65px;
  width: 605px;
}
.race-button {
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

.race-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.race-image {
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.race-name {
  flex-grow: 1;
}
.confirm-button {
  position: absolute;
  bottom: 15px;
  width: 350px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;

  display: flex;             /* 横並びにする */
  justify-content: space-between; /* ボタン間に余白 */
  gap: 10px;                 /* ボタンの間隔 */
}

</style>
