import axios from 'axios'
import Vue from 'vue'

// 生产环境启用相对路径（rest/），开发环境走代理
if (process.env.NODE_ENV !== 'development') {
  axios.defaults.baseURL = 'rest/'
}
axios.defaults.timeout = Number(process.env.VUE_APP_API_TIMEOUT || 20000)
axios.defaults.withCredentials =
  String(process.env.VUE_APP_API_WITH_CREDENTIALS || 'false') === 'true'

/**
 * 错误提示展示时长（毫秒）。
 * Element Message 默认 3000ms，且鼠标悬停在提示上会暂停计时、移开后按完整时长重新计时，
 * 实际停留时间往往远大于 3 秒，故显式收敛并用定时器兜底关闭。
 */
const ERROR_TOAST_DURATION = 2000

/**
 * 相同文案的去重窗口（毫秒）：取展示时长，保证同一提示不会前后堆叠。
 * 页面初始化/并发操作会同时发出多个请求，全部失败时若不合并会出现一整列相同提示。
 */
const ERROR_TOAST_DEDUPE_WINDOW = ERROR_TOAST_DURATION

/** 最近一次错误提示的文案与时间，用于去重 */
let lastErrorText = ''
let lastErrorAt = 0

/**
 * 统一错误提示（兼容 Element-UI $message 和 Vant $toast）
 * @param {string} message 提示文案
 */
function notifyError(message) {
  const text = String(message || '')
  const now = Date.now()
  if (text && text === lastErrorText && now - lastErrorAt < ERROR_TOAST_DEDUPE_WINDOW) return
  lastErrorText = text
  lastErrorAt = now

  if (
    Vue.prototype.$message &&
    typeof Vue.prototype.$message.error === 'function'
  ) {
    const instance = Vue.prototype.$message.error({
      message: text,
      duration: ERROR_TOAST_DURATION
    })
    // 兜底关闭：Element 的鼠标悬停会 clearTimer，仅靠 duration 无法保证按时消失
    if (instance && typeof instance.close === 'function') {
      setTimeout(() => instance.close(), ERROR_TOAST_DURATION)
    }
    return
  }
  if (Vue.prototype.$toast && typeof Vue.prototype.$toast === 'function') {
    Vue.prototype.$toast({ message: text, position: 'bottom', duration: ERROR_TOAST_DURATION })
  }
}

/** 鉴权失效处理锁：避免多个请求同时 401 时弹多次、跳多次 */
let authErrorLock = false

/**
 * 鉴权失效处理：提示并跳转到登录页
 * 加锁防止并发请求导致重复提示/重复跳转
 */
function solveAuthError() {
  if (authErrorLock) return
  authErrorLock = true
  notifyError('登录状态已失效，请刷新页面重试')
  setTimeout(() => {
    authErrorLock = false
  }, 1500)
}
/**
 * 根据 HTTP 响应错误对象，获取可读的错误消息
 * @param {Object} error Axios 错误对象
 * @returns {string}
 * 涉及到的响应接口方式 包括：信息化平台result 0 成功， 综合分析 code 0 成功，非这两项的是失败
 */
function getHttpErrorMessage(error) {
  if (!error || !error.response) {
    return error && error.code === 'ECONNABORTED'
      ? '请求超时，请稍后重试'
      : '网络异常，请检查连接后重试'
  }

  const { status } = error.response
  if (status === 401) return '登录失效，请重新登录'
  if (status === 403) return '无权限访问'
  if (status === 404) return '请求的资源不存在'
  if (status === 500) return '服务异常，请稍后重试'
  if (status >= 500) return '服务异常，请稍后重试'
  if (status >= 400) return '请求失败，请检查参数后重试'
  return '请求失败，请稍后重试'
}

// 全局加载动画管理器（计数器方案，支持并发）根据请求中的参数loading来决定是否显示加载动画
let loadingInstance = null
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
 * 请求拦截器：注入 Token 和加载动画
 */
axios.interceptors.request.use(
  (config) => {
    if (config.loading) startLoading()

    const token = window.localStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = token
    }
    return config
  },
  (error) => {
    // 请求拦截器自身出错时，也要归还 loading 计数
    if (error && error.config && error.config.loading) endLoading()
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器：统一处理鉴权失效和后端错误码
 */
axios.interceptors.response.use(
  (response) => {
    // 关闭加载动画
    if (response && response.config && response.config.loading) endLoading()

    const data = response && response.data

    // 统一判断未登录 / 鉴权失效（result=100 或 code=401）
    if (
      data &&
      typeof data === 'object' &&
      (data.result === 100 || data.code === 401)
    ) {
      solveAuthError()
      const authErr = new Error('没有登录')
      authErr.__handledByInterceptor = true
      return Promise.reject(authErr)
    }

    return response
  },
  (error) => {
    // 关闭加载动画
    if (error && error.config && error.config.loading) endLoading()

    // 调用方主动跳过错误处理时，直接透传
    if (error && error.config && error.config.skipErrorHandling) {
      return Promise.reject(error)
    }

    // 401 / 403 走鉴权处理，其他走通用错误提示
    const status = error && error.response && error.response.status
    if (status === 401 || status === 403) {
      solveAuthError()
    } else {
      notifyError(getHttpErrorMessage(error))
    }

    error.__handledByInterceptor = true
    return Promise.reject(error)
  }
)

/**
 * 通用请求封装（内部函数）
 * 统一返回 response.data，避免各调用方重复解套
 *
 * @param {Object} options
 * @param {string} options.method HTTP 方法
 * @param {string} options.url 请求 URL
 * @param {Object} [options.params] URL 参数
 * @param {Object} [options.data] 请求体数据
 * @param {string} [options.responseType] 响应类型（blob / arraybuffer）
 * @param {boolean} [options.loading] 是否显示加载动画
 * @param {Object} [options.headers] 自定义请求头
 * @returns {Promise<any>} response.data
 */
function request({
  method = 'get',
  url,
  params = {},
  data = {},
  responseType,
  loading,
  headers
} = {}) {
  const opts = { method, url, params, data, loading }
  if (responseType) opts.responseType = responseType
  if (headers && typeof headers === 'object') opts.headers = headers
  return axios(opts).then((res) => res.data)
}

// ---------------------------------------------------------------------------
// 6. 对外导出的便捷方法
// ---------------------------------------------------------------------------

/**
 * HTTP GET 请求
 * @param {Object} opts { url, params, loading }
 * @returns {Promise<any>}
 */
export function httpGet({ url, params = {}, loading }) {
  return request({ method: 'get', url, params, loading })
}

/**
 * HTTP DELETE 请求
 * @param {Object} opts { url, params }
 * @returns {Promise<any>}
 */
export function httpDelete({ url, params = {} }) {
  return request({ method: 'delete', url, params })
}

/**
 * HTTP POST 请求
 * @param {Object} opts { url, data, params, loading }
 * @returns {Promise<any>}
 */
export function httpPost({ url, data = {}, params = {}, loading }) {
  return request({ method: 'post', url, params, data, loading })
}

/**
 * HTTP PUT 请求
 * @param {Object} opts { url, data, params }
 * @returns {Promise<any>}
 */
export function httpPut({ url, data = {}, params = {} }) {
  return request({ method: 'put', url, params, data })
}

/**
 * GET 请求并返回 ArrayBuffer（用于 Base64 文件下载）
 * @param {Object} opts { url, params }
 * @returns {Promise<ArrayBuffer>}
 */
export function getBase64({ url, params = {} }) {
  return request({ method: 'get', url, params, responseType: 'arraybuffer' })
}

/**
 * GET 请求获取文件（Blob 响应）
 * @param {Object} opts { url, params }
 * @returns {Promise<Blob>}
 */
export function getFile({ url, params = {} }) {
  return request({ method: 'get', url, params, responseType: 'blob' })
}

/**
 * POST 请求上传文件
 * @param {Object} opts { url, data }
 * @returns {Promise<any>}
 */
export function postFile({ url, data = {} }) {
  return request({ method: 'post', url, data })
}
