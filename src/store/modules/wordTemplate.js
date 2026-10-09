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
    words: [], // 所有节点名称列表（叶子节点文本）
    wordFileName: '' // 模板文件名称
    // 说明：生成报告弹窗的「生成方式」与模板无关，已独立到 reportOption 模块，
    //       避免模板编辑与生成报告两个场景共用同一字段而互相污染。
  },
  mutations: {
    SET_TEMPLATE(state, { tree, words, wordFileName }) {
      state.hasData = true
      state.tree = tree || []
      state.words = words || []
      state.wordFileName = wordFileName || ''
    },
    CLEAR_TEMPLATE(state) {
      state.hasData = false
      state.tree = []
      state.words = []
      state.wordFileName = ''
    }
  },
  actions: {
    /** 保存模糊词模板数据 */
    saveTemplate({ commit }, payload) {
      commit('SET_TEMPLATE', {
        tree: payload.tree || [],
        words: (payload.words || []).filter(Boolean),
        wordFileName: payload.wordFileName || ''
      })
    },
    /** 清除模糊词模板数据 */
    clearTemplate({ commit }) {
      commit('CLEAR_TEMPLATE')
    }
  }
}
