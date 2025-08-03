// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import fontAwesomePlugin from './plugins/fontawesome'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(fontAwesomePlugin)

app.mount('#app')