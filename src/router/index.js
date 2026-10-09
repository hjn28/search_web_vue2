import Vue from 'vue'
import VueRouter from 'vue-router'

import { ensureBzSession } from '../utils/session'
Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/adviceCluster' },
  { path: '/index', redirect: '/adviceCluster' },
  {
    path: '/adviceCluster',
    name: 'adviceCluster',
    component: () => import('../views/adviceSearch/adviceCluster.vue')
  },
  // police searchDetail 是法律法规库对应的路由
  {
    path: '/police',
    name: 'police',
    component: () => import('../views/police/index.vue')
  },
  {
    path: '/searchDetail',
    name: 'searchDetail',
    component: () => import('../views/police/detail.vue')
  }
]

const router = new VueRouter({ routes })

/**
 * 全局前置守卫：自动从 iframe parent 获取 userId 并登录
 * 开发环境（development）跳过鉴权（由请求拦截器在业务请求前兜底建立会话）
 */
router.beforeEach((to, from, next) => {
  // 开发环境直接放行，不绕鉴权
  if (process.env.NODE_ENV === 'development') {
    next()
    return
  }

  // 等待 bz 登录完成后再放行（与请求拦截器共享同一 Promise，天然串行、防并发重复登录）
  ensureBzSession().then(() => {
    next()
  }).catch(function (err) {
    console.error('鉴权请求异常：', err)
    next() // 即使鉴权失败也放行，避免页面白屏
  })
})

export default router
