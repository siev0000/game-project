<template>
  <div class="container sf-terminal">
    <div class="panel">
      <h2 class="title">SYSTEM ACCESS</h2>

      <div class="log-box">
        <p>> Boot sequence initiated...</p>
        <p>> Core module: ONLINE</p>
        <p>> Environment scan: OK</p>
        <p>> User authentication: GUEST</p>
        <p>> Awaiting command.</p>
      </div>

      <div class="menu">
        <button @click="goDemo">▶ デモ起動</button>
        <button @click="showTutorial = true">▶ 操作ガイド</button>
        <button @click="showWorld = true">▶ ワールド情報</button>
        <button @click="showStats = true">▶ ステータス情報</button>
        <button @click="showBattle = true">▶ バトル情報</button>
        <button @click="showUI = true">▶ UI情報</button>
      </div>

      <div class="back">
        <a @click.prevent="goBack">← ログイン画面に戻る</a>
      </div>
    </div>
    <TutorialModal
      v-if="showTutorial"
      @close="showTutorial = false"
    />

    <WorldModal
      v-if="showWorld"
      @close="showWorld = false"
    />

    <StatsModal
      v-if="showStats"
      @close="showStats = false"
    />

    <BattleModal
      v-if="showBattle"
      @close="showBattle = false"
    />
    <UIModal
      v-if="showUI"
      @close="showUI = false"
    />
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { applyGlobalScale } from '@/components/useScale.js'
import TutorialModal from '../components/modals/robot/TutorialModal.vue'
import WorldModal from '../components/modals/robot/WorldModal.vue'
import StatsModal from '../components/modals/robot/StatsView.vue'
import BattleModal from '../components/modals/robot/BattleView.vue'
import UIModal from '../components/modals/robot/UIModal.vue'

const showTutorial = ref(false)
const showWorld = ref(false)
const showStats = ref(false)
const showBattle = ref(false)
const showUI = ref(false)

const router = useRouter()

onMounted(() => {
  applyGlobalScale()
})

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
@import '/src/css/useScale.css';
</style>

<style>
/* ===== 全体 ===== */
.sf-terminal {
  max-width: 700px;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  color: #aefcff;
  font-family: "Consolas", "Courier New", monospace;
}

/* ===== パネル ===== */
.panel {
  background: linear-gradient(
    180deg,
    rgba(10, 20, 30, 0.95),
    rgba(5, 10, 15, 0.95)
  );
  border: 2px solid #3aaed8;
  border-radius: 8px;
  padding: 24px;
  box-shadow:
    0 0 20px rgba(58, 174, 216, 0.4),
    inset 0 0 10px rgba(0, 255, 255, 0.1);
}

/* ===== タイトル ===== */
.title {
  text-align: center;
  margin-bottom: 20px;
  letter-spacing: 2px;
  color: #e0faff;
}

/* ===== ログ表示 ===== */
.log-box {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #2fa4c7;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.6;
}

.log-box p {
  margin: 0;
}

/* ===== メニュー ===== */
.menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu button {
  background: linear-gradient(
    180deg,
    #1f4f66,
    #163a4d
  );
  border: 1px solid #4cc9f0;
  color: #e6fcff;
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
  text-align: left;
  font-weight: 600;
}

.menu button:hover {
  background: linear-gradient(
    180deg,
    #2a6b88,
    #1f556e
  );
}

/* ===== 戻る ===== */
.back {
  margin-top: 20px;
  text-align: center;
  width: 100%;
}

.back a {
  color: #88e7ff;
  cursor: pointer;
  text-decoration: none;
}

.back a:hover {
  text-decoration: underline;
}
</style>
