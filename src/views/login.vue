<template>
  <div id="scalable-root">
    <div class="container">
      <h2>ログイン</h2>
      <form @submit.prevent="handleLogin">
        <label for="username">ユーザーID</label>
        <input v-model="username" type="text" id="username" required />

        <label for="password">パスワード</label>
        <input v-model="password" type="password" id="password" required />

        <button type="submit">ログイン</button>
      </form>

      <div class="register-link">
        アカウントをお持ちでない方は <a href="/Register">こちら</a>
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

onMounted(() => {
  applyGlobalScale()
})
const username = ref('')
const password = ref('')
const message = ref('')

const handleLogin = async () => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value }),
    })

    const result = await response.json()

    if (response.ok) {
      localStorage.setItem('authToken', result.token)
      localStorage.setItem('username', result.username)
      localStorage.setItem('userId', result.userId)
      window.location.href = '/Dashboard'
    } else {
      message.value = `ログイン失敗: ${result.error}`
    }
  } catch (err) {
    message.value = 'エラー: サーバーと通信できません'
  }
}
</script>

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
button {
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