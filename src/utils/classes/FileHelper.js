/**
 * FileHelper - 文件处理工具类
 *
 * 功能：文件读取、格式转换（Base64/Blob/URL）、上传管理
 * 统一管理浏览器端的文件处理操作
 *
 * @module FileHelper
 */

class FileHelper {
  /**
   * 读取本地文件内容（文本），返回 Promise
   * @param {File} file - 文件对象
   * @returns {Promise<string>} 文件文本内容
   */
  static readLocalFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target.result)
      reader.onerror = () => reject(new Error('readLocalFile error'))
      reader.onabort = () => reject(new Error('readLocalFile aborted'))
      reader.readAsText(file)
    })
  }

  /**
   * 文件转 Base64（DataURL 格式）
   * @param {File} file - 文件对象
   * @returns {Promise<string>} Base64 字符串
   */
  static fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (evt) => resolve(evt.target.result)
      reader.onerror = () => reject(new Error('fileToBase64 error'))
      reader.onabort = () => reject(new Error('fileToBase64 aborted'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Blob 转 Base64
   * @param {Blob} blob - Blob 对象
   * @returns {Promise<string>} Base64 字符串
   */
  static blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('blobToBase64 error'))
      reader.onabort = () => reject(new Error('blobToBase64 aborted'))
      reader.readAsDataURL(blob)
    })
  }

  /**
   * 获取文件的 Object URL
   * @param {File} file - 文件对象
   * @returns {string|null} 对象 URL 或 null
   */
  static getObjectURL(file) {
    try {
      if (window.createObjectURL !== undefined) return window.createObjectURL(file)
      if (window.webkitURL !== undefined) return window.webkitURL.createObjectURL(file)
      if (window.URL !== undefined) return window.URL.createObjectURL(file)
    } catch (error) {
      return null
    }
    return null
  }

  /**
   * Base64 数据转换为 Blob
   * @param {string} base64Data - Base64 编码的数据
   * @param {string} contentType - MIME 类型
   * @returns {Blob} Blob 对象
   */
  static base64ToBlob(base64Data, contentType) {
    const raw = atob(base64Data)
    const rawLength = raw.length
    const uInt8Array = new Uint8Array(rawLength)
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i)
    }
    return new Blob([uInt8Array], { type: contentType })
  }

  /**
   * 格式化文件大小为人类可读字符串
   * @param {number} size - 文件字节数
   * @returns {string} 格式化后的大小（如 "1.5 MB"）
   */
  static humanFileSize(size) {
    if (size === 0) return '0 B'
    const i = Math.floor(Math.log(size) / Math.log(1024))
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    return (size / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + sizes[i]
  }

  /**
   * 检查文件是否为 Word 文档
   * @param {string} fileName - 文件名
   * @returns {boolean} 是否为 .doc 或 .docx
   */
  static isWordFile(fileName) {
    const name = String(fileName || '').toLowerCase()
    return name.endsWith('.doc') || name.endsWith('.docx')
  }

  /**
   * 检查文件是否为图片
   * @param {string} fileType - 文件 MIME 类型
   * @returns {boolean} 是否为图片
   */
  static isImageFile(fileType) {
    return String(fileType || '').startsWith('image/')
  }

  /**
   * 触发浏览器下载 Blob 文件
   * @param {Blob} blob - 文件数据
   * @param {string} filename - 下载文件名
   */
  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 从 HTML 字符串中提取纯文本
   * @param {string} html - HTML 内容
   * @returns {string} 纯文本
   */
  static htmlToText(html) {
    if (!html) return ''
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }

  /**
   * 将 Word 上传文件转为 FormData
   * @param {File} file - 上传的文件
   * @returns {FormData} 表单数据
   */
  static createFileFormData(file) {
    const formData = new FormData()
    formData.append('file', file)
    return formData
  }

  /**
   * 生成稳定文件 ID（用于列表渲染）
   * @param {File} file - 文件对象
   * @returns {string} 唯一 ID
   */
  static generateFileId(file) {
    return `${Date.now()}_${file.name}`
  }

  /**
   * 为上传文件创建预览 URL（仅图片），并返回增强的文件信息对象
   * @param {File} file - 上传的原始文件
   * @returns {Object} 增强的文件信息
   */
  static enhanceFileInfo(file) {
    const isImage = this.isImageFile(file.type)
    return {
      id: this.generateFileId(file),
      name: file.name,
      size: file.size,
      humanSize: this.humanFileSize(file.size),
      isImage,
      url: isImage ? this.getObjectURL(file) : null,
      raw: file
    }
  }

  /**
   * 释放文件对象的 URL 资源，防止内存泄漏
   * @param {Object} fileInfo - 文件信息对象（含 url 字段）
   */
  static revokeFileUrl(fileInfo) {
    if (fileInfo && fileInfo.url) {
      URL.revokeObjectURL(fileInfo.url)
    }
  }
}

export default FileHelper
