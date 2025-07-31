// src/plugins/fontawesome.ts
import type { App } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { initIcons } from '@/utils/icons'
import AppIcon from '@/components/icons/AppIcon.vue'

export default {
  install(app: App) {
    // 初始化图标库
    initIcons()
    
    // 注册组件
    app.component('font-awesome-icon', FontAwesomeIcon)
    app.component('AppIcon', AppIcon)
  }
}