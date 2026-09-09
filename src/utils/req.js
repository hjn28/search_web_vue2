/**
 * ============================================================================
 * HTTP 请求模块（基于 Axios）
 * ============================================================================
 *
 * 统一封装项目的所有 HTTP 请求，提供：
 *   1. 统一的基础 URL、超时、跨域配置
 *   2. 请求拦截器：自动注入 Token、加载动画
 *   3. 响应拦截器：统一鉴权校验、错误处理
 *   4. 便捷方法：httpGet / httpPost / httpPut / httpDelete / getFile / postFile
 *
 * 使用方式：
 *   import { httpGet, httpPost } from '@/utils/req'
 *   httpGet({ url: '/api/data', params: { id: 1 }, loading: true })
 *
 * @module utils/req
 */

import axios from 'axios'
import Vue from 'vue'
import router from '../router'

// 生产环境启用相对路径（rest/），开发环境走代理
if (process.env.NODE_ENV !== 'development') {
  axios.defaults.baseURL = 'rest/'
}
axios.defaults.timeout = Number(process.env.VUE_APP_API_TIMEOUT || 20000)
axios.defaults.withCredentials = String(process.env.VUE_APP_API_WITH_CREDENTIALS || 'false') === 'true'

/**
 * 统一错误提示（兼容 Element-UI $message 和 Vant $toast）
 * @param {string} message 错误消息
 */
function notifyError(message) {
  if (Vue.prototype.$message && typeof Vue.prototype.$message.error === 'function') {
    Vue.prototype.$message.error(message)
    return
  }
  if (Vue.prototype.$toast && typeof Vue.prototype.$toast === 'function') {
    Vue.prototype.$toast({ message, position: 'bottom' })
  }
}

/**
 * 鉴权失效处理：提示并跳转到登录页
 */
function solveAuthError() {
  notifyError('登录失效，请重新登录')
  router.push('/')
}

/**
 * 根据 HTTP 响应错误对象，获取可读的错误消息
 * @param {Object} error Axios 错误对象
 * @returns {string} 可读的错误消息
 */
function getHttpErrorMessage(error) {
  if (!error || !error.response) {
    return error && error.code === 'ECONNABORTED' ? '请求超时，请稍后重试' : '网络异常，请检查连接后重试'
  }
  const { status } = error.response
  if (status === 401 || status === 403) return '无权限访问，请重新登录'
  if (status >= 500) return '服务异常，请稍后重试'
  if (status >= 400) return '请求失败，请检查参数后重试'
  return '请求失败，请稍后重试'
}

/**
 * 全局加载动画管理器（基于计数器，支持并发请求）
 * 只有第一个请求开始和最后一个请求结束才显示/关闭 loading
 */
let loadingInstance
let loadingCount = 0

/** 开启加载动画（首次调用时创建实例） */
function startLoading() {
  if (loadingCount === 0) {
    loadingInstance = Vue.prototype.$loading({
      lock: true,
      text: '加载中...',
      spinner: 'el-icon-loading',
      background: 'rgba(9, 8, 8, 0.45)',
      customClass: 'req-loading-mask'
    })
  }
  loadingCount += 1
}

/** 关闭加载动画（计数器归零时销毁实例） */
function endLoading() {
  if (loadingCount > 0) loadingCount -= 1
  if (loadingCount === 0 && loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }
}

/**
 * 响应拦截器：统一处理鉴权失效和后端错误码
 */
axios.interceptors.response.use(response => {
  // 关闭加载动画
  if (response && response.config && response.config.loading) endLoading()

  try {
    const data = response && response.data
    // 统一判断未登录/鉴权失效（result=100 或 code=401）
    if (data && typeof data === 'object' && (data.result === 100 || data.code === 401)) {
      solveAuthError()
      var authErr = new Error('没有登录')
      authErr.__handledByInterceptor = true
      return Promise.reject(authErr)
    }
  } catch (e) {
    // 忽略解析异常
  }
  return response
}, error => {
  // 关闭加载动画
  if (error && error.config && error.config.loading) endLoading()

  if (error && error.config && error.config.skipErrorHandling) {
    return Promise.reject(error)
  }

  const message = getHttpErrorMessage(error)
  if (error && error.response && (error.response.status === 401 || error.response.status === 403)) {
    solveAuthError()
  } else {
    notifyError(message)
  }
  error.__handledByInterceptor = true
  return Promise.reject(error)
})

/**
 * 请求拦截器：注入 Token 和加载动画
 */
axios.interceptors.request.use(config => {
  if (config.loading) startLoading()
  const token = window.localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = token
  }
  return config
})

/**
 * HTTP GET 请求
 * @param {Object} opts 请求配置
 * @param {string} opts.url 请求 URL
 * @param {Object} [opts.params={}] URL 参数
 * @param {boolean} [opts.loading] 是否显示加载动画
 * @returns {Promise<any>} response.data
 */
export function httpGet({ url, params = {}, loading }) {
  return request({ method: 'get', url, params, loading })
}

/**
 * HTTP DELETE 请求
 * @param {Object} opts 请求配置
 * @param {string} opts.url 请求 URL
 * @param {Object} [opts.params={}] URL 参数
 * @returns {Promise<any>} response.data
 */
export function httpDelete({ url, params = {} }) {
  return request({ method: 'delete', url, params })
}

/**
 * HTTP POST 请求
 * @param {Object} opts 请求配置
 * @param {string} opts.url 请求 URL
 * @param {Object} [opts.data={}] 请求体数据
 * @param {Object} [opts.params={}] URL 参数
 * @param {boolean} [opts.loading] 是否显示加载动画
 * @returns {Promise<any>} response.data
 */
export function httpPost({ url, data = {}, params = {}, loading }) {
  return request({ method: 'post', url, params, data, loading })
}

/**
 * HTTP PUT 请求
 * @param {Object} opts 请求配置
 * @param {string} opts.url 请求 URL
 * @param {Object} [opts.data={}] 请求体数据
 * @param {Object} [opts.params={}] URL 参数
 * @returns {Promise<any>} response.data
 */
export function httpPut({ url, data = {}, params = {} }) {
  return request({ method: 'put', url, params, data })
}

/**
 * 发起 GET 请求并获取 ArrayBuffer 响应（用于 Base64 文件下载）
 * @param {Object} opts 请求配置
 * @param {string} opts.url 请求 URL
 * @param {Object} [opts.params={}] URL 参数
 * @returns {Promise<ArrayBuffer>} response.data
 */
export function getBase64({ url, params = {} }) {
  return request({ method: 'get', url, params, responseType: 'arraybuffer' })
}

/**
 * 发起 GET 请求获取文件（Blob 响应）
 * @param {Object} opts 请求配置
 * @param {string} opts.url 请求 URL
 * @param {Object} [opts.params={}] URL 参数
 * @returns {Promise<Blob>} response.data
 */
export function getFile({ url, params = {} }) {
  return request({ method: 'get', url, params, responseType: 'blob' })
}

/**
 * 发起 POST 请求上传文件
 * @param {Object} opts 请求配置
 * @param {string} opts.url 请求 URL
 * @param {Object} [opts.data={}] 表单数据
 * @returns {Promise<any>} response.data
 */
export function postFile({ url, data = {} }) {
  return request({ method: 'post', url, data })
}

/**
 * 通用请求封装（内部函数）
 * 统一返回 response.data，避免各调用方重复解套
 *
 * @param {Object} options 请求选项
 * @param {string} options.method HTTP 方法
 * @param {string} options.url 请求 URL
 * @param {Object} [options.params={}] URL 参数
 * @param {Object} [options.data={}] 请求体数据
 * @param {string} [options.responseType] 响应类型
 * @param {boolean} [options.loading] 是否显示加载动画
 * @returns {Promise<any>} response.data
 */
function request({ method = 'get', url, params = {}, data = {}, responseType, loading, headers } = {}) {
  const opts = { method, url, params, data, loading }
  if (responseType) opts.responseType = responseType
  if (headers) opts.headers = headers
  return axios(opts).then(res => res.data)
}
