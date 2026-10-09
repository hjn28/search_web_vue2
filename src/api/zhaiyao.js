/**
 * ============================================================================
 * 汇总要点（生成 / 删除 / 重生成）API 模块
 * ============================================================================
 *
 * 提供汇总要点生命周期管理接口，以及相关元数据接口。
 *
 * @module api/zhaiyao
 */

import { httpPost, httpGet } from '../utils/req'
import API from './config'

/**
 * 生成当前时间戳（秒级）
 * @returns {number}
 */
export const getTimestamp = () => Math.floor(Date.now() / 1000)

/**
 * 获取汇总要点 billId（根据建议编号查询）
 * @param {number|string} ynbh 建议编号
 */
export const getBillId = (ynbh) =>
  httpGet({
    url: API.summary.billId,
    params: { flType: 3, type: 1, begin: 1, step: 10, ynbh, _r: getTimestamp() }
  })

/**
 * 删除指定建议的 Redis 汇总要点缓存
 * @param {string} billId
 */
export const delZhaiyao = (billId) =>
  httpGet({
    url: API.summary.del,
    params: { key: 'proposal:summary:' + billId }
  })

/**
 * 获取指定建议的汇总要点结果
 * @param {string} billId
 */
export const getSummary = (billId) =>
  httpGet({
    url: API.summary.get,
    params: { jyId: billId, _r: getTimestamp() }
  })

/**
 * 重新根据关键字生成汇总要点（调用 AI 接口）
 */
export const reGetZhaiyao = (data) =>
  httpPost({
    url: API.summary.aiChat,
    headers: { 'Content-Type': 'application/json' },
    data
  })

/**
 * 获取部门信息
 */
export const getDeptInfo = () =>
  httpGet({
    url: API.meta.deptInfo,
    params: { _r: getTimestamp() }
  })

/**
 * 获取重点议题下拉列表
 */
export const keyProposalSelect = () =>
  httpGet({
    url: API.meta.keyProposal,
    params: { _r: getTimestamp() }
  })

/**
 * 获取届次信息
 */
export const getjc = () =>
  httpGet({
    url: API.meta.session,
    params: { _r: getTimestamp() }
  })

/**
 * 平台登录（bz）
 */
export const platloginBz = (userid) =>
  httpGet({
    url: API.auth.platLoginBz(userid),
    params: { _r: getTimestamp() }
  })