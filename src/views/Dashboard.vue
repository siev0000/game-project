<template>
  <div id="scalable-root">
    <div class="container">
        <h1>ようこそ、<span>{{ username }}</span> さん！</h1>
        <p>次のアクションを選択してください。</p>
        <div class="actions">
        <button class="select" @click="goToSelect">キャラクターを選択</button>
        <button @click="goToCreate">キャラクターを作成</button>
        </div>
    </div>
  </div>
</template>
<style scoped>
@import '/src/css/useScale.css';
</style>
<script setup>
import { ref, onMounted } from 'vue'
import { applyGlobalScale } from '@/components/useScale.js'
import { useRouter } from 'vue-router'
onMounted(() => {
  applyGlobalScale()
})


const router = useRouter()
const username = ref('')
const userId = localStorage.getItem('userId')
const token = localStorage.getItem('authToken')

onMounted(() => {
  const storedUsername = localStorage.getItem('username')
  if (!storedUsername || !token) {
    router.push('/login') // Vue Router のパスに合わせる
  } else {
    username.value = storedUsername
  }
})

const goToSelect = () => {
  router.push('/character-select') // vue-router に合わせたルート
}

const goToCreate = () => {
  router.push('/CharacterCreateView') // vue-router に合わせたルート
}
</script>

<style scoped>
.container {
  text-align: center;
  padding: 2rem;
}

.actions {
  margin-top: 2rem;
}

button {
  margin: 0 1rem;
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
  margin-bottom: 15px;
}
</style>
<style>
.container {
  /* これだけあれば中央配置される */
  max-width: 400px;
  width: 100%;
  box-sizing: border-box;

  /* 以下は装飾 */
  padding: 20px 30px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  background-image: url('/images/入力ホーム.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: white;
  text-align: center;
}
/* ラベル */
label {
  display: block;
  font-size: 16px;
  margin-bottom: 5px;
  text-align: left;
  color: #fff59b;
  font-weight: 600;
}

/* 入力欄 */
input {
  width: 100%;
  padding: 8px;
  margin-bottom: 15px;
  border-radius: 4px;
  border: none;
  box-sizing: border-box;
}

/* ボタン */
.select {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: 600;
}

button:hover {
  background-color: #0056b3;
}

/* リンク */
.register-link {
  margin-top: 20px;
  font-size: 16px;
  text-align: center;
  font-weight: 600;

}

.register-link a {
  color: #eeff00;
  text-decoration: none;
  font-size: 18px;
  text-align: center;
  /* font-weight: 600; */
  text-shadow:
  -1px -1px 0 rgb(255, 255, 255),
      1px -1px 0 rgb(255, 255, 255),
  -1px  1px 0 rgb(255, 255, 255),
      1px  1px 0 rgb(255, 255, 255),
}

.register-link a:hover {
  text-decoration: underline;
}
</style>