/**
 * ============================================================================
 * 汇总要点生成任务队列 API 模块
 * ============================================================================
 *
 * 提供汇总要点生成任务的异步队列管理：
 *   1. 新增任务
 *   2. 查询用户任务列表
 *   3. 查看单任务结果
 *   4. 删除任务
 *
 * @module api/zytask
 */

import { httpPost, httpGet } from '../utils/req'
import API from './config'

/**
 * 新增汇总要点生成任务
 * @param {Object} data { userId, aiObj, type, qdNeedObj }
 */
export const searchZFZhaiyao = (data) =>
  httpPost({ url: API.task.add, data, loading: true })

/**
 * 根据用户 ID 查询当前所有任务
 * @param {string} userId
 * @returns {Promise<Object>} 任务列表（status: 0=未完成 1=已完成 2=失败）
 */
export const taskQuery = (userId) =>
  httpGet({ url: API.task.user, params: { userId } })

/**
 * 根据任务 ID 查询任务结果
 * @param {string} taskId
 */
export const taskIdQuery = (taskId) =>
  httpGet({ url: API.task.result, params: { taskId } })

/**
 * 批量删除指定 ID 的任务
 * @param {string[]} data 任务 ID 数组
 */
export const deleteIds = (data) =>
  httpPost({ url: API.task.delete, data, loading: true })

/**
 * 更新任务结果
 * @param {Object} data { taskId, userId, resultData }
 */
export const updateResult = (data) =>
  httpPost({ url: API.task.updateResult, data, loading: true })

/**
 * 获取旧任务结果
 * @param {string} taskId
 */
export const getNewResult = (taskId) =>
  httpGet({ url: API.task.getNewResult, params: { taskId } })
