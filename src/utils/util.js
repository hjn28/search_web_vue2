/**
 * ============================================================================
 * 通用工具函数集
 * ============================================================================
 *
 * 提供项目中广泛使用的杂项工具函数，涵盖：
 *   1. 滚动动画控制
 *   2. 文件格式转换（Base64、Blob、URL）
 *   3. 日期格式化
 *   4. 列表转树形结构
 *
 * 这些函数按功能独立导出，无外部依赖。
 *
 * @module utils/util
 * @see module:utils/classes/FileHelper 文件处理相关类封装
 * @see module:utils/classes/TreeHelper 树结构操作类封装
 */

/**
 * 向左滚动到指定位置（基于 setTimeout 的动画）
 * @param {Element} scroller 滚动容器元素
 * @param {number} to 目标 scrollLeft 值
 * @param {number} duration 动画时长（秒，默认 0.3）
 */
let rafId
export function scrollLeftTo(scroller, to, duration = 0.3) {
  clearTimeout(rafId)
  let count = 0
  const from = scroller.scrollLeft
  const frames = duration === 0 ? 1 : Math.round((duration * 1000) / 16)
  let prev = Date.now()
  function animate() {
    scroller.scrollLeft += (to - from) / frames
    if (++count < frames) {
      const curr = Date.now()
      const ms = Math.max(0, 16 - (curr - prev))
      rafId = setTimeout(animate, ms)
      prev = curr + ms
    }
  }
  animate()
}

/**
 * 文件转 Base64（DataURL 格式）
 * @param {File} file 文件对象
 * @returns {Promise<string>} Base64 字符串
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.onload = function (evt) {
      resolve(evt.target.result)
    }
    reader.onerror = function () {
      reject(new Error('fileToBase64 error'))
    }
    reader.onabort = function () {
      reject(new Error('fileToBase64 aborted'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Blob 转 Base64
 * @param {Blob} blob Blob 对象
 * @returns {Promise<string>} Base64 字符串
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    let fileReader = new FileReader()
    fileReader.onload = (e) => resolve(e.target.result)
    fileReader.readAsDataURL(blob)
    fileReader.onerror = () => reject(new Error('blobToBase64 error'))
    fileReader.onabort = () => reject(new Error('blobToBase64 aborted'))
  })
}

/**
 * 格式化日期时间
 *
 * @param {string|number|Date} time 传入的时间
 * @param {boolean} type 为 true 则返回带时分秒的完整时间，否则只返回日期
 * @returns {string} 格式化后的日期字符串（yyyy-MM-dd 或 yyyy-MM-dd hh:mm:ss）
 */
export const formatDate = (time = '', type) => {
  const d = new Date(time)
  const year = d.getFullYear()
  const month = getHandledValue(d.getMonth() + 1)
  const date = getHandledValue(d.getDate())
  const hours = getHandledValue(d.getHours())
  const minutes = getHandledValue(d.getMinutes())
  const second = getHandledValue(d.getSeconds())
  let resStr = ''
  if (type) {
    resStr = year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + second
  } else {
    resStr = year + '-' + month + '-' + date
  }
  return resStr
}

/**
 * 数字补零：如果数字小于 10，则在前面补充 0
 * @param {number} num 数值
 * @returns {string} 补零后的字符串
 */
const getHandledValue = num => {
  return num < 10 ? '0' + num : num
}

/**
 * 文件流转 Object URL
 * @param {File} file 文件对象
 * @returns {string|null} 对象 URL 或 null
 */
export function getObjectURL(file) {
  let url = null
  if (window.createObjectURL !== undefined) {
    url = window.createObjectURL(file)
  } else if (window.webkitURL !== undefined) {
    try {
      url = window.webkitURL.createObjectURL(file)
    } catch (error) {
      return null
    }
  } else if (window.URL !== undefined) {
    try {
      url = window.URL.createObjectURL(file)
    } catch (error) {
      return null
    }
  }
  return url
}

/**
 * 扁平列表转树形结构（可配置字段名）
 *
 * @param {Array} list 扁平数据列表
 * @param {string} nameField 名称字段名（默认 'name'）
 * @param {string} idField ID 字段名（默认 'id'）
 * @param {string} parentField 父级 ID 字段名（默认 'pid'）
 * @returns {Array} 树形结构数组
 */
export function listToTree(list, nameField = 'name', idField = 'id', parentField = 'pid') {
  const treeList = []
  const dataMap = {}
  if (!list || !list.length) return []

  list.map(item => {
    item.children = []
    item.appSysName = item[nameField]
    item.appSysId = item[idField]
    dataMap[item[idField]] = item
  })
  list.map(item => {
    if (!dataMap[item[parentField]]) {
      treeList.push(item)
    } else {
      dataMap[item[parentField]].children.push(item)
    }
  })
  return treeList
}

/**
 * Base64 数据转换为 Blob 对象
 * @param {string} base64Data Base64 编码的数据
 * @param {string} contentType MIME 类型
 * @returns {Blob} Blob 对象
 */
export function base64ToBlob(base64Data, contentType) {
  const raw = atob(base64Data)
  const rawLength = new Array(raw.length)
  for (let i = 0; i < raw.length; ++i) {
    rawLength[i] = raw.charCodeAt(i)
  }
  const uInt8Array = new Uint8Array(rawLength)
  return new Blob([uInt8Array], { type: contentType })
}
