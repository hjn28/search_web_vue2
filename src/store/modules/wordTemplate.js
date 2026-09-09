/**
 * Vuex 模糊词模板模块 - wordTemplate
 *
 * 模糊词编辑使用的目录模板单独存储（仅由模糊词生成产生/回显），
 * 与汇总要点、分析报告共用的共享模板（template 模块）互不影响：
 * - 汇总要点/分析报告保存目录时不会覆盖模糊词模板
 * - 模糊词保存目录时也不会覆盖汇总要点/分析报告使用的共享模板
 */
export default {
  namespaced: true,
  state: {
    hasData: false, // 是否有模板数据
    tree: [], // 目录树结构 [{ id, name, children }]
    words: [] // 所有节点名称列表（叶子节点文本）
  },
  mutations: {
    SET_TEMPLATE(state, { tree, words }) {
      state.hasData = true
      state.tree = tree || []
      state.words = words || []
    },
    CLEAR_TEMPLATE(state) {
      state.hasData = false
      state.tree = []
      state.words = []
    }
  },
  actions: {
    /** 保存模糊词模板数据 */
    saveTemplate({ commit }, payload) {
      commit('SET_TEMPLATE', {
        tree: payload.tree || [],
        words: (payload.words || []).filter(Boolean)
      })
    },
    /** 清除模糊词模板数据 */
    clearTemplate({ commit }) {
      commit('CLEAR_TEMPLATE')
    }
  }
}
