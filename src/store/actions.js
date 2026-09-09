/**
 * ============================================================================
 * Vuex Actions
 * ============================================================================
 *
 * 定义全局可派发（dispatch）的异步/同步操作。
 * 组件通过 mapActions 引入使用。
 *
 * @module store/actions
 */

const actions = {
  /**
   * 设置当前用户信息
   * @param {Function} options.commit Vuex commit
   * @param {Object} userInfo 用户信息对象
   */
  setUserInfo: ({ commit }, userInfo) => commit('SET_USERINFO', userInfo),

  /**
   * 设置文件数据
   * @param {Function} options.commit
   * @param {*} data 文件数据
   */
  setFiledata: ({ commit }, data) => commit('SET_FILEDATA', data),

  /**
   * 设置提交内容（纯文本）
   * @param {Function} options.commit
   * @param {string} data 提交内容
   */
  setSubmitContent: ({ commit }, data) => commit('SET_SUB_CONT', data),

  /**
   * 设置带样式的提交内容
   * @param {Function} options.commit
   * @param {string} data 带样式的内容
   */
  setSubmitContentWithStyle: ({ commit }, data) => commit('SET_SUB_CONT_STY', data),

  /**
   * 设置提交标题
   * @param {Function} options.commit
   * @param {string} data 标题
   */
  setSubmitTitle: ({ commit }, data) => commit('SET_SUB_TITLE', data),

  /**
   * 设置当前选中的数据项
   * @param {Function} options.commit
   * @param {*} data 数据项
   */
  setDataItem: ({ commit }, data) => commit('SET_DATA_ITEM', data),

  /**
   * 设置汇总要点列表
   * @param {Function} options.commit
   * @param {Array} data 汇总要点列表
   */
  setZhList: ({ commit }, data) => commit('SET_ZHLIST', data)
}

export default actions
