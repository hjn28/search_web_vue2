/**
 * ============================================================================
 * API 端点集中配置
 * ============================================================================
 *
 * 所有接口 URL 统一在此管理，按业务模块分组。
 *
 * 使用方式：
 *   import API from './config'
 *   httpGet({ url: API.auth.login })
 *   httpPost({ url: API.task.add, data })
 *
 * ⚠️ 命名规则：
 *   - 顶层 key：业务域（auth / meta / search / file / summary / cloud / bill / advice / law / task）
 *   - 二级 key：camelCase，语义清晰（zf2 = 二次检索，zf = 一次检索）
 *
 * @module api/config
 */

import { base64Encode } from '@/utils/index.js'

const API = {
  // ========== 鉴权 ==========
  auth: {
    login: '/login-info/login',
    openLogin: 'rest/2020/openlogin/bz',
    platLoginBz: (userId) => `rest/2020/user/platlogin/bz/${base64Encode(userId)}=`
  },

  // ========== 元数据（部门、届次、重点议题） ==========
  meta: {
    deptInfo: 'rest/2020/proposal/owner/myProposalPc/getDeptInfo',
    session: 'rest/2020/jc/getjc',
    keyProposal: 'rest/2020/proposal/keyproposaltopic/get/keyProposalSelect'
  },

  // ========== 检索 ==========
  search: {
    base: '/api/search',
    zf: '/searchZF/search',
    zf2: '/searchZF/search2',
    zhaiyao: '/searchZF/zhaiyao',
    tree: '/task/tree'
  },

  // ========== 文件处理 ==========
  file: {
    toHtml: '/voice/uploadFlieToHtml',
    uploadTask: '/task/uploadFile'
  },

  // ========== 汇总要点 / 摘要 ==========
  summary: {
    billId: '/proposal/pb/zy',
    del: '/motion/owner/motionCfd/redis/del',
    get: '/resource/proposal/summary',
    aiChat: '/v1/chat/completions/'
  },

  // ========== 议案云图 ==========
  cloud: {
    sessionInfo: '/session-time/list',
    data: '/bill/diagram/cloud',
    hotWords: '/bill/diagram/hots',
    wordRelation: '/bill/diagram/relate',
    classify: '/law/classify'
  },

  // ========== 议案 ==========
  bill: {
    list: '/proposal-info/selectProposalList',
    del: '/proposal-info/del',
    search: '/bill/search'
  },

  // ========== 建议 ==========
  advice: {
    list: '/advice-info/selectProposalList',
    del: '/advice-info/del'
  },

  // ========== 法规 ==========
  law: {
    search: '/law/search',
    recommendation: '/law/recommendation',
    searchBrief: '/law/searchBrief',
    recognition: '/law/recognition',
    detail: '/law/detail',
    relevant: '/relevant-law/relevant',
    classifyByContent: '/law/classifyByContent'
  },

  // ========== 异步任务队列 ==========
  task: {
    add: '/task/addTask',
    user: '/task/user',
    result: '/task/result',
    // ⚠️ delete 是 JS 保留字，但作为属性名访问是合法的（ES5+）
    delete: '/task/deleteTask',
    updateResult: '/task/updateResult',
    getNewResult: '/task/getNewResult',
    getSource: '/task/getSource'
  }
}

export default API
