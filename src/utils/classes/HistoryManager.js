/**
 * HistoryManager - 操作历史记录管理工具类
 *
 * 功能：操作记录添加、查询、清理、持久化（localStorage）
 * 统一管理用户操作历史，支持最多 50 条记录循环覆盖
 *
 * @module HistoryManager
 * @example
 *   import HistoryManager from '@/utils/classes/HistoryManager'
 *   const mgr = new HistoryManager()
 *   mgr.addRecord('检索聚类', '条件：关键词=环保')
 *   const records = mgr.getRecords()
 */

class HistoryManager {
  /**
   * 最大记录条数
   * @type {number}
   */
  static MAX_RECORDS = 50

  /**
   * localStorage 存储键名
   * @type {string}
   */
  static STORAGE_KEY = 'operationHistory'

  /**
   * 创建一个历史记录管理器实例
   * @param {number} maxRecords - 最大记录数（默认 50）
   */
  constructor(maxRecords = HistoryManager.MAX_RECORDS) {
    this.maxRecords = maxRecords
    this.records = this._load()
  }

  /**
   * 从 localStorage 加载历史记录
   * @returns {Array} 记录数组
   * @private
   */
  _load() {
    try {
      const data = localStorage.getItem(HistoryManager.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (e) {
      return []
    }
  }

  /**
   * 将当前记录持久化到 localStorage
   * @private
   */
  _save() {
    try {
      localStorage.setItem(HistoryManager.STORAGE_KEY, JSON.stringify(this.records))
    } catch (e) {
      // localStorage 可能已满，静默失败
    }
  }

  /**
   * 添加一条操作记录
   * @param {string} action - 操作类型（如 '检索聚类', '生成摘要'）
   * @param {string} content - 操作内容描述
   * @returns {Object} 新添加的记录
   */
  addRecord(action, content) {
    const record = {
      time: new Date().toLocaleString(),
      action,
      content
    }
    this.records.unshift(record)
    // 超出最大条数时截断
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(0, this.maxRecords)
    }
    this._save()
    return record
  }

  /**
   * 获取所有历史记录
   * @returns {Array} 记录列表（最新在前）
   */
  getRecords() {
    return [...this.records]
  }

  /**
   * 清空所有历史记录
   */
  clear() {
    this.records = []
    localStorage.removeItem(HistoryManager.STORAGE_KEY)
  }

  /**
   * 获取记录总数
   * @returns {number}
   */
  getCount() {
    return this.records.length
  }
}

export default HistoryManager
