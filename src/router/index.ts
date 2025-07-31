// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import PageView from '../views/PageView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'page',
      component: PageView,
      meta: { requiresAuth: true }
    },
    {
      path: '/flow',
      name: 'flow',
      component: () => import('../views/FlowView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/data',
      name: 'data',
      component: () => import('../views/DataView.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 需要认证的路由
  if (to.meta.requiresAuth !== false) {
    if (!userStore.isLoggedIn) {
      next('/login')
      return
    }
  }
  
  // 已登录用户访问登录页，重定向到首页
  if (to.name === 'login' && userStore.isLoggedIn) {
    next('/')
    return
  }
  
  next()
})

export default router