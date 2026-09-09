/**
 * 任务 AI 参数模块
 *
 * 保存分类要点汇总和分析报告共用的检索上下文。
 */
export default {
  namespaced: true,
  state: {
    data_base: 'jianyi',
    theme: [],
    term_theme: []
  },
  mutations: {
    SET_PARAMS(state, params = {}) {
      state.data_base = params.data_base || 'jianyi'
      state.theme = Array.isArray(params.theme) ? params.theme : []
      state.term_theme = Array.isArray(params.term_theme) ? params.term_theme : []
    }
  }
}
