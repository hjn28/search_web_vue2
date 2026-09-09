/**
 * ============================================================================
 * 路由配置
 * ============================================================================
 *
 * 定义应用的所有页面路由：
 *   1. 默认路由：/adviceCluster（议案建议聚类主页）
 *   2. 搜索页：/adviceSearch
 *   3. 本地数据页：/localZhaiyaoData
 *   4. RAG 流程页：/ragflow
 *   5. 公安相关：/police, /searchDetail
 *   6. 测试页：/test
 *
 * 路由守卫：自动从 iframe 父容器获取 userId 进行登录鉴权
 *
 * @module router/index
 */

import Vue from 'vue'
import VueRouter from 'vue-router'

import { ensureBzSession } from '../utils/session'
Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/adviceCluster' },
  {
    path: '/adviceSearch',
    name: 'adviceSearch',
    component: () => import('../views/adviceSearch/index.vue')
  },
  {
    path: '/adviceCluster',
    name: 'adviceCluster',
    component: () => import('../views/adviceSearch/adviceCluster.vue')
  },
  { path: '/index', redirect: '/adviceSearch' },
  {
    path: '/localZhaiyaoData',
    name: 'localZhaiyaoData',
    component: () => import('../views/adviceSearch/localZhaiyaoData.vue')
  },
  {
    path: '/ragflow',
    name: 'ragflow',
    component: () => import('../views/ragflow.vue')
  },
  {
    path: '/police',
    name: 'police',
    component: () => import('../views/police/index.vue')
  },
  {
    path: '/searchDetail',
    name: 'searchDetail',
    component: () => import('../views/police/detail.vue')
  },
  {
    path: '/test',
    name: 'test',
    component: () => import('../views/test.vue')
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
