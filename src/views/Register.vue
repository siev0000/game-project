<template>
  <div id="scalable-root">
    <div class="container">
      <h1>新規登録</h1>
      <form @submit.prevent="handleRegister">
        <label for="username">ユーザー名</label>
        <input type="text" id="username" v-model="username" required placeholder="ユーザー名を入力" />

        <label for="password">パスワード</label>
        <input type="password" id="password" v-model="password" required placeholder="パスワードを入力" />

        <label for="confirmPassword">パスワード（確認）</label>
        <input type="password" id="confirmPassword" v-model="confirmPassword" required placeholder="もう一度パスワードを入力" />

        <button type="submit">登録</button>
      </form>
      <div id="message">{{ message }}</div>
      <p class="login-link">
        すでにアカウントをお持ちの場合は、<br />
        <a href="/login">こちらでログイン</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { applyGlobalScale } from '@/components/useScale.js'

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const message = ref('')

onMounted(() => {
  applyGlobalScale('scalable-root')
})

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    message.value = 'パスワードが一致しません'
    return
  }

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })

    const result = await res.json()

    if (res.ok) {
      message.value = '登録成功！ログイン画面に移動します...'
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } else {
      message.value = '登録失敗: ' + result.error
    }
  } catch (err) {
    message.value = '通信エラー'
  }
}
</script>

<style scoped>
@import '/src/css/useScale.css';

.container {
  background-image: url('/images/入力ホーム.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 8px;
  padding: 20px 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  color: white;
  margin: auto;
}

label {
  display: block;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
  text-align: left;
  color: #fff59b;
}
</style>
