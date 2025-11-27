<template>
  <div id="app">
    <Login v-if="!isLoggedIn" @login-success="handleLoginSuccess" />
    <ChatBot v-else @logout="handleLogout" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ChatBot from './components/ChatBot.vue'
import Login from './components/Login.vue'
import { isLoggedIn as checkLoginStatus, logout } from './services/authService.js'

const isLoggedIn = ref(false)

const handleLoginSuccess = () => {
  isLoggedIn.value = true
}

const handleLogout = () => {
  logout()
  isLoggedIn.value = false
}

onMounted(() => {
  // 检查登录状态
  isLoggedIn.value = checkLoginStatus()
})
</script>

<style scoped>
#app {
  width: 100%;
  height: 100vh;
  background: #ffffff;
  overflow: hidden;
}
</style>


