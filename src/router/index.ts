import { createRouter, createWebHistory } from 'vue-router'
import PageView from '../views/PageView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'page',
      component: PageView,
    },
    {
      path: '/flow',
      name: 'flow',
      // 流程图编辑页面
      component: () => import('../views/FlowView.vue'),
    },
    {
      path: '/data',
      name: 'data',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/DataView.vue'),
    },
  ],
})

export default router
