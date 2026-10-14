/**
 * ============================================================================
 * bz 登录会话模块
 * ============================================================================
 *
 * 人大平台后端依赖 cookie 会话鉴权。整体时序约定：
 *   1. 路由守卫调用 ensureBzSession()：登录成功（cookie 写入）后才放行页面加载，
 *      因此页面内所有接口（届次、部门、重点建议等）天然在登录之后调用；
 *   2. 唯一例外是开发环境：守卫跳过登录，页面先于 cookie 加载，
 *      FilterConditions 在拉取重点建议（keyProposalSelect）前显式等待
 *      ensureBzSession() 完成，保证 cookie 写入后再调用。
 *
 * 注意：登录接口只有 openlogin/bz（OPEN_LOGIN）；platloginBz 仅是获取代表团
 * 字典的数据接口，不建立会话。
 *
 * 本模块提供 ensureBzSession()：以模块级 Promise 缓存 openlogin/bz 登录结果，
 * 并发调用共享同一个 Promise（天然防并发重复登录）；
 * 登录失败时清空缓存，下一次调用自动重试。
 *
 * @module utils/session
 */

import axios from 'axios'
import API from '../api/config'

/** 缓存的 openlogin/bz 登录 Promise（成功后复用；失败清空下次重试） */
let bzPromise = null

/**
 * 获取登录 userId：优先 iframe parent 传入，其次 localStorage userInfo
 * @returns {string} userId
 */
export function getUserId() {
  const userId = new URLSearchParams(window.location.hash.split('?')[1] || '').get('userid')
  if (userId) return userId
  try {
    const info = JSON.parse(localStorage.getItem('userInfo') || '{}')
    return info.userId || ''
  } catch (e) {
    return ''
  }
}

/**
 * 确保 openlogin/bz 登录会话已建立（幂等，可安全并发重复调用）
 * @returns {Promise<Object>} openlogin/bz 成功响应数据
 */
export function ensureBzSession() {
  if (!bzPromise) {
    bzPromise = doBzLogin().catch(err => {
      // 失败清空缓存，下次调用自动重试
      bzPromise = null
      throw err
    })
  }
  return bzPromise
}

/**
 * 执行 openlogin/bz 登录：成功后把 userInfo 写入 localStorage
 * @returns {Promise<Object>} 登录成功响应数据
 */
export function doBzLogin() {
  return axios.post(API.auth.platLoginBz, { userId: getUserId() }).then(res => {
    const data = res && res.data
    if (data && data.result === 0) {
      localStorage.setItem('userInfo', JSON.stringify(data.data.user_info || data.data.userInfo))
      return data
    }
    throw new Error('bz 登录失败：' + (data && data.msg ? data.msg : JSON.stringify(data)))
  })
}
