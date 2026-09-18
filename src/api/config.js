/**
 * ============================================================================
 * API 端点集中配置
 * ============================================================================
 *
 * 所有接口 URL 统一在此管理，避免各 API 模块硬编码。
 * 修改后端地址时只需改动本文件。
 *
 * 使用方式：
 *   import API from './config'
 *   httpGet({ url: API.LOGIN, params: { userName, password } })
 *
 * @module api/config
 */

import { base64Encode } from '@/utils'

const API = {
  // ========== 登录 & 鉴权 ==========
  LOGIN: '/login-info/login',
  OPEN_LOGIN: 'rest/2020/openlogin/bz', // 登录（生产环境由 baseURL='rest/' 拼接为 rest/2020/openlogin/bz）
  GET_DEPT_INFO: 'rest/2020/proposal/owner/myProposalPc/getDeptInfo', // 获取平台全量的部门信息
  GET_JC: 'rest/2020/jc/getjc', // 届次
  KEY_PROPOSAL_SELECT: 'rest/2020/proposal/keyproposaltopic/get/keyProposalSelect', // 获取重点议题下拉列表
  platlogin_bz: (userid) => `rest/2020/user/platlogin/bz/${base64Encode(userid)}=`, // 获取代表团字典（动态拼接 userid base64）
  // ========== 搜索 ==========
  SEARCH: '/api/search',
  SEARCH_ZF: '/searchZF/search',
  SEARCH_ZF_2: '/searchZF/search2',
  SEARCH_ZF_ZS: '/searchZF/zhaiyao',
  SEARCH_ZF_TREE: '/task/tree',

  // ========== 文件转换 ==========
  UPLOAD_FILE_TO_HTML: '/voice/uploadFlieToHtml',
  UPLOAD_TASK_FILE: '/task/uploadFile',

  // ========== 汇总要点 ==========
  GET_BILL_ID: '/proposal/pb/zy',
  DEL_ZHAIYAO: '/motion/owner/motionCfd/redis/del',
  GET_SUMMARY: '/resource/proposal/summary',
  AI_CHAT: '/v1/chat/completions/',

  // ========== 议案云图 ==========
  SESSION_INFO: '/session-time/list',
  CLOUD_DATA: '/bill/diagram/cloud',
  HOT_WORDS: '/bill/diagram/hots',
  WORD_RELATION: '/bill/diagram/relate',
  CLASSIFY: '/law/classify',

  // ========== 议案&建议列表 ==========
  BILL_LIST: '/proposal-info/selectProposalList',
  BILL_DEL: '/proposal-info/del',
  BILL_SEARCH: '/bill/search',
  LAW_SEARCH: '/law/search',
  LAW_RECOMMENDATION: '/law/recommendation',
  LAW_SEARCH_BRIEF: '/law/searchBrief',
  LAW_RECOGNITION: '/law/recognition',
  LAW_DETAIL: '/law/detail',
  RELEVANT_LAW: '/relevant-law/relevant',
  LAW_CLASSIFY: '/law/classifyByContent',
  ADVICE_LIST: '/advice-info/selectProposalList',
  ADVICE_DEL: '/advice-info/del',

  // ========== 汇总要点任务队列 ==========
  TASK_ADD: '/task/addTask',
  TASK_USER: '/task/user',
  TASK_RESULT: '/task/result',
  TASK_DELETE: '/task/deleteTask',
  TASK_UPDATE_RESULT: '/task/updateResult',
  TASK_GET_NEW_RESULT: '/task/getNewResult',

  // ========== 来源库 ==========
  GET_SOURCE_LIST: '/task/getSource'
}

export default API
