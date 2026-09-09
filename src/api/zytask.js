/**
 * ============================================================================
 * 汇总要点生成任务队列 API 模块
 * ============================================================================
 *
 * 提供汇总要点生成任务的异步队列管理：
 *   1. 新增任务（提交汇总要点/分析报告生成请求）
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
 * 将汇总要点/分析报告生成请求加入异步任务队列
 * @param {Object} data 任务参数 { userId, aiObj, type, qdNeedObj }
 * @returns {Promise<Object>} 创建结果
 */
export const searchZFZhaiyao = (data) =>
  httpPost({ url: API.TASK_ADD, data, loading: true })

/**
 * 根据用户 ID 查询当前所有任务
 * @param {string} userId 用户 ID
 * @returns {Promise<Object>} 任务列表
 *   status: 0=未完成 1=已完成 2=失败
 */
export const taskQuery = (userId) =>
  httpGet({ url: API.TASK_USER, params: { userId } })

/**
 * 根据任务 ID 查询任务结果
 * @param {string} taskId 任务 ID
 * @returns {Promise<Object>} 任务执行结果
 */
export const taskIdQuery = (taskId) =>
  httpGet({ url: API.TASK_RESULT, params: { taskId } })

/**
 * 批量删除指定 ID 的任务
 * @param {string[]} data 任务 ID 数组
 * @returns {Promise<Object>} 删除结果
 */
export const deletIds = (data) =>
  httpPost({ url: API.TASK_DELETE, data, loading: true })

/**
 * 更新任务结果
 * @param {Object} data 任务结果数据 { taskId, userId, resultData }
 * @returns {Promise<Object>} 更新结果
 */
export const updateResult = (data) =>
  httpPost({ url: API.TASK_UPDATE_RESULT, data, loading: true })

/**
 * 获取旧任务结果
 * @param {string} taskId 任务 ID
 * @returns {Promise<Object>} 旧任务结果
 */
export const getNewResult = (taskId) =>
  httpGet({ url: API.TASK_GET_NEW_RESULT, params: { taskId } })
