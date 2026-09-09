/**
 * ============================================================================
 * 汇总要点（生成/删除/重生成）API 模块
 * ============================================================================
 *
 * 提供汇总要点生命周期管理接口：
 *   1. 获取汇总要点 billId
 *   2. 删除已有汇总要点
 *   3. 获取/重新生成汇总要点
 *   4. 本地化汇总要点生成（调用 AI 接口）
 *
 * @module api/zhaiyao
 */

import { httpPost, httpGet } from '../utils/req'
import API from './config'

/**
 * 生成当前时间戳（秒级）
 * @returns {number} 秒级时间戳
 */
export const getTimestamp = () => Math.floor(Date.now() / 1000)

/**
 * 获取汇总要点 billId（根据建议编号查询）
 * @param {number|string} ynbh 建议编号
 * @returns {Promise<Object>} 包含 billId 的响应
 */
export const getBillId = (ynbh) =>
  httpGet({
    url: API.GET_BILL_ID,
    params: { flType: 3, type: 1, begin: 1, step: 10, ynbh: ynbh, _r: getTimestamp() }
  })

/**
 * 删除指定建议的 Redis 汇总要点缓存
 * @param {string} billId 汇总要点 billId
 * @returns {Promise<Object>} 删除结果
 */
export const delZhaiyao = (billId) =>
  httpGet({
    url: API.DEL_ZHAIYAO,
    params: { key: 'proposal:summary:' + billId }
  })

/**
 * 获取指定建议的汇总要点结果
 * @param {string} billId 建议 billId
 * @returns {Promise<Object>} 汇总要点数据
 */
export const getSummary = (billId) =>
  httpGet({
    url: API.GET_SUMMARY,
    params: { jyId: billId, _r: getTimestamp() }
  })

/**
 * 本地打印：重新根据关键字生成汇总要点（调用 AI 接口）
 * @param {Object} data 请求参数（含 model, messages 等）
 * @returns {Promise<Object>} 生成的汇总要点内容
 */
export const reGetZhaiyao = (data) =>
  httpPost({
    url: API.AI_CHAT,
    headers: { 'Content-Type': 'application/json' },
    data: data
  })
export const getDeptInfo = () =>
  httpGet({
    url: API.GET_DEPT_INFO,
    params: { _r: getTimestamp() }
  })

export const keyProposalSelect = () =>
  httpGet({
    url: API.KEY_PROPOSAL_SELECT,
    params: { _r: getTimestamp() }
  })

export const getjc = () =>
  httpGet({
    url: API.GET_JC,
    params: { _r: getTimestamp() }
  })

export const platloginBz = (userid) =>
  httpGet({
    url: API.platlogin_bz(userid),
    params: { _r: getTimestamp() }
  })
