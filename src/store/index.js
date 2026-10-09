/**
 * ============================================================================
 * Vuex 状态管理 - 入口
 * ============================================================================
 *
 * 配置全局状态管理：
 *   1. 模块：app（用户信息、文件数据、编辑内容等）
 *   2. Actions：全局异步操作派发
 *   3. Getters：全局状态派生计算
 *   4. 持久化：通过 vuex-persistedstate 将 userInfo 持久化到 localStorage
 *
 * @module store/index
 */

import Vue from 'vue'
import Vuex from 'vuex'
import app from './modules/app.js'
import template from './modules/template.js'
import wordTemplate from './modules/wordTemplate.js'
import dict from './modules/dict.js'
import taskAiParams from './modules/taskAiParams.js'
import adviceCluster from './modules/adviceCluster.js'
import reportOption from './modules/reportOption.js'
import actions from './actions.js'
import getters from './getters'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export default new Vuex.Store({
  plugins: [
    // 持久化插件：将 app.userInfo 保存到 localStorage，key 为 search_web_store
    createPersistedState({
      key: 'search_web_store',
      paths: ['app.userInfo']
    })
  ],
  modules: { app, template, wordTemplate, dict, taskAiParams, adviceCluster, reportOption },
  actions,
  getters
})
