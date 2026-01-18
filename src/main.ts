// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import fontAwesomePlugin from './plugins/fontawesome'

import './assets/main.css'
import './assets/properties.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(fontAwesomePlugin)

async function bootstrap() {
  // Mock 状态提示（避免 top-level await 影响构建 target）
  const { isMockEnabled } = await import('./mock')
  if (isMockEnabled()) {
    console.log('🎭 Mock 模式已启用')
    console.log('📝 默认账号: admin / 123456 或 user / 123456')
    console.log('🔧 环境:', import.meta.env.MODE)
  } else {
    console.log('🌐 真实 API 模式')
    console.log('🔗 API 地址:', import.meta.env.VITE_API_BASE_URL)
  }

  app.mount('#app')
}

void bootstrap()