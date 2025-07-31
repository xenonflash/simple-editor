// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import fontAwesomePlugin from './plugins/fontawesome'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(fontAwesomePlugin)

// 初始化用户认证状态
const userStore = useUserStore()
userStore.initAuth()

app.mount('#app')