// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import PageView from '../views/PageView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'page',
      component: PageView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
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

// 修复：异步路由守卫，等待用户状态初始化
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // 等待用户状态初始化完成
  if (!userStore.isInitialized) {
    console.log('等待用户状态初始化...')
    await userStore.initAuth()
  }

  console.log('路由守卫检查:', {
    to: to.path,
    requiresAuth: to.meta.requiresAuth,
    isLoggedIn: userStore.isLoggedIn,
    hasToken: !!userStore.token,
    hasUser: !!userStore.user
  })

  // 需要认证的路由
  if (to.meta.requiresAuth !== false) {
    if (!userStore.isLoggedIn) {
      console.log('用户未登录，跳转到登录页')
      next('/login')
      return
    }
  }

  // 已登录用户访问登录页，重定向到首页
  if (to.name === 'login' && userStore.isLoggedIn) {
    console.log('用户已登录，跳转到首页')
    next('/')
    return
  }

  next()
})

export default router