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

import { httpPost, httpGet } from './req'
import API from './config'

/**
 * 用户登录接口
 * @param {Object} data { userName, password }
 */
export const login = (data) =>
  httpPost({
    url: API.auth.login,
    data: { userName: data.userName, password: data.password }
  })

/**
 * 政策搜索接口
 */
export const zcSearch = (data) =>
  httpPost({ url: API.search.base, data })

/**
 * 辅助分类检索：根据词/句/段进行语义拓展
 */
export const searchZF = (data) =>
  httpPost({ url: API.search.zf, data, loading: true })

/**
 * 二次检索聚类：携带筛选条件返回列表结果
 */
export const searchZFSearch2 = (data) =>
  httpPost({ url: API.search.zf2, data, loading: true })
/**
 * Word 文件转 HTML/文本
 */
export const uploadFlieToHtml = (data) =>
  httpPost({ url: API.file.toHtml, data })

/**
 * 上传资料库文件（form-data）
 * @param {FormData} data { userId, indexName, file, fileName }
 */
export const uploadTaskFile = (data) =>
  httpPost({ url: API.file.uploadTask, data })

/**
 * 保存资料库（创建文件库记录）
 * @param {Object} data { fileName, indexName, userId }
 */
export const saveDatabase = (data) =>
  httpPost({ url: API.task.saveDatabase, data })

/**
 * 查询资料库（获取来源库数据）
 * @param {Object} [params] 附加查询参数
 */
export const getSourceList = (params) =>
  httpGet({ url: API.task.getSource, params })

/**
 * 获取检索树
 */
export const getSearchTree = (data) =>
  httpGet({ url: API.search.tree, data })
