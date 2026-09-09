/**
 * ============================================================================
 * 登录与检索 API 模块
 * ============================================================================
 *
 * 提供用户认证、语义检索、文件转换等核心接口。
 * 所有接口均基于 @/utils/req 封装，自动处理 Token 注入和错误提示。
 *
 * @module api/login
 */

import { httpPost } from '../utils/req'
import API from './config'

/**
 * 用户登录接口
 * @param {Object} data 登录信息 { userName, password }
 * @returns {Promise<Object>} 响应数据
 */
export const login = (data) =>
  httpPost({ url: API.LOGIN, data: { userName: data.userName, password: data.password } })

/**
 * 政策搜索接口
 * @param {Object} data 搜索参数
 * @returns {Promise<Object>} 搜索结果
 */
export const zcSearch = (data) =>
  httpPost({ url: API.SEARCH, data })

/**
 * 一次拓展检索：根据词/句/段进行语义拓展
 * 输入关键词/句子/段落，返回语义相关的拓展结果
 * @param {Object} data 检索参数 { text, content }
 * @returns {Promise<Object>} 拓展结果列表
 */
export const searchZF = (data) =>
  httpPost({ url: API.SEARCH_ZF, data, loading: true })

/**
 * 二次检索聚类：携带筛选条件返回列表结果
 * 在一次拓展基础上，加入来源库、届次、代表团等过滤条件
 * @param {Object} data 检索参数（含筛选条件）
 * @returns {Promise<Object>} 聚类结果列表
 */
export const searchZFSearch2 = (data) =>
  httpPost({ url: API.SEARCH_ZF_2, data, loading: true })

/**
 * 汇总要点综合接口：对选中记录进行汇总要点生成
 * @param {Object} data 汇总要点请求参数（含 word, term_theme, database, obj, module）
 * @returns {Promise<Object>} 汇总要点生成结果
 */
export const searchZFZhaiyao = (data) =>
  httpPost({ url: API.SEARCH_ZF_ZS, data, loading: true })

/**
 * Word 文件转 HTML/文本
 * 用于汇总要点综合时融合上传正文内容
 * @param {Object} data FormData 表单数据（含 file 字段）
 * @returns {Promise<Object>} 转换后的 HTML/文本
 */
export const uploadFlieToHtml = (data) =>
  httpPost({ url: API.UPLOAD_FILE_TO_HTML, data })
