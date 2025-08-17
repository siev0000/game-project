<template>
  <teleport to="body">
    <div class="modal-overlay" >
      <!-- @click.self="$emit('close')" -->
      <div class="modal-content" id="Classe-modal" >
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
        <ul class="Classe-list">
          <li
            v-for="(Classe, index) in filteredClasses"
            :key="Classe.名前"
          >
            <button @click="openDetail(index)" class="Classe-button">
              <span class="Classe-content">
                <img
                  :src="getImageUrl(Classe.画像url)"
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
import { ref, onMounted, computed } from 'vue'
import ClasseDetailModal from '@/components/modals/ClasseDetailModal.vue'
import { applyGlobalScale } from '@/components/useScale.js'

onMounted(() => {
  applyGlobalScale('Classe-modal') // ← ここで ID を渡す
})
const emit = defineEmits(['select', 'close'])

const tabTypes = ['戦士', '狩人', '魔道士','神官']
const activeTab = ref('戦士')
const selectedClasseCategory = ref('戦士')


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
    description: '亜人は身体能力に優れた種族で、特定の職に特化しやすい特長があります。またどこかの能力値が極端に低い場合が多く、全体敵に精神が低いです。',
    background: 'bg-demi.jpg',
  },
  魔族: {
    description: '魔族は強力な魔力や特殊能力を持ちます。基礎ステータスもかなり高く一部に強力な耐性を持ちますが、その分、弱点の属性を複数持っています。',
    background: 'bg-demon.jpg',
  }
};

// src="getImageUrl(currentClasse.画像url)
const allClasses = ref([])
const filteredClasses = computed(() =>
  allClasses.value.filter(r => r.技能分類 === activeTab.value)
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
  selectedRace: {
    type: Object, // Object指定OK
    required: true
  }
})

onMounted(async () => {
  const res = await fetch('/api/excel/classes')
  const data = await res.json()

  const currentRace = props.selectedRace?.名前 || props.selectedRace

  // 条件なし判定関数
  const isNoCondition = (c) => {
    return !c.条件系統 &&
           !c.条件系統Lv &&
           !c.条件クラス_1 &&
           !c.条件Lv_1 &&
           !c.合計Lv &&
           !c.条件スキル &&
           !c.条件属性
  }

  // 分類が職業 & 条件なし or 条件を満たすもの
  const jobData = data.filter(c =>
    c.分類 === '職業' &&
    (
      isNoCondition(c) ||
      (c.条件クラス_1 === currentRace && Number(c.条件Lv_1) <= 1)
    )
  )

  const uniqueTypes = [...new Set(jobData.map(c => c.技能分類))]
  tabTypes.value = uniqueTypes

  activeTab.value = uniqueTypes[0]
  selectedClasseCategory.value = uniqueTypes[0]
  allClasses.value = jobData
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

// クラスデータとプレイヤーデータを渡すと称号して条件を満たしているか確認できる
function meetsConditions(classData, playerData) {
  // 条件クラス判定
  if (classData.条件クラス_1) {
    const lv1 = playerData.classLevels[classData.条件クラス_1] || 0
    if (lv1 < classData.条件Lv_1) return false
  }
  if (classData.条件クラス_2) {
    const lv2 = playerData.classLevels[classData.条件クラス_2] || 0
    if (lv2 < classData.条件Lv_2) return false
  }

  // 条件系統判定
  if (classData.条件系統) {
    const systemLv = Object.entries(playerData.classLevels)
      .filter(([className]) => playerData.classInfo[className]?.技能分類 === classData.条件系統)
      .reduce((sum, [, lv]) => sum + lv, 0)
    if (systemLv < classData.条件系統Lv) return false
  }

  // 合計Lv判定
  if (classData.合計Lv) {
    const totalLv = Object.values(playerData.classLevels).reduce((sum, lv) => sum + lv, 0)
    if (totalLv < classData.合計Lv) return false
  }

  return true
}
</script>

<style scoped>
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
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

  /* 上寄せを強制 */
  align-content: start;
}

.Classe-list button {
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

.Classe-list button:hover {
  background-color: #ddd;
}

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


</style>
