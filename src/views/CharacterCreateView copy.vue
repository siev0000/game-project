<template>
  <div id="scalable-root">
    <div class="container">
      <h1>キャラクター作成</h1>

      <form @submit.prevent="openLevelModal">
        <label for="name">キャラクター名</label>
        <input
          type="text"
          id="name"
          v-model="characterName"
          placeholder="名前を入力"
          required
          autocomplete="off"
        />
        <button type="button" @click="confirmName">名前を確定</button>

        <!-- 種族選択 -->
        <div v-if="nameConfirmed" class="selection">
          <h2>種族を選択してください</h2>
          <button type="button" @click="showRaceModal = true">種族を見る</button>
          <p v-if="selectedRace">選択された種族: <strong>{{ selectedRace }}</strong></p>
        </div>

        <!-- クラス選択 -->
        <div v-if="selectedRace" class="selection">
          <h2>クラスを選択してください</h2>
          <button type="button" @click="showClassModal = true">クラスを見る</button>
          <p v-if="selectedClass">選択されたクラス: <strong>{{ selectedClass }}</strong></p>
        </div>

        <!-- 作成ボタン -->
        <button type="submit" :disabled="!selectedClass">レベルを割り振る</button>
        
      </form>

      <div id="message">{{ message }}</div>

      <!-- 種族モーダル -->
      <RaceModal v-if="showRaceModal" @close="showRaceModal = false" @select="selectRace" />

      <!-- クラスモーダル -->
      <ClassModal
        v-if="showClassModal"
        :selectedRace="selectedRace"
        @close="showClassModal = false"
        @select="selectClass"
      />

      <!-- レベル配分モーダル（仮実装） -->
      <LevelModal
        v-if="showLevelModal"
        :selectedRace="selectedRace"
        :selectedClass="selectedClass"
        @close="showLevelModal = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { applyGlobalScale } from '@/components/useScale.js'
import RaceModal from '@/components/modals/RaceModal.vue'
import ClassModal from '@/components/modals/ClassModal.vue'
import LevelModal from '@/components/modals/LevelModal.vue'

const router = useRouter()
onMounted(() => {
  applyGlobalScale()
})

const characterName = ref('')
const nameConfirmed = ref(false)
const selectedRace = ref('')
const selectedClass = ref('')
const message = ref('')

const showRaceModal = ref(false)
const showClassModal = ref(false)
const showLevelModal = ref(false)

function confirmName() {
  if (characterName.value.trim() === '') {
    message.value = '名前を入力してください'
    return
  }
  nameConfirmed.value = true
  message.value = ''
}

function selectRace(raceName) {
  selectedRace.value = raceName
  showRaceModal.value = false
}

function selectClass(className) {
  selectedClass.value = className
  showClassModal.value = false
}

function openLevelModal() {
  if (!selectedRace.value || !selectedClass.value) {
    message.value = '種族とクラスを選択してください'
    return
  }
  showLevelModal.value = true
}
</script>

<style scoped>
@import '/src/css/useScale.css';
.modal-content {
  background: white;
  color: black;
  padding: 1rem;
  border-radius: 10px;
  max-width: 600px;
  width: 90%;
  box-shadow: 0 0 10px black;
  /* font-size: 20px; */
}

</style>
