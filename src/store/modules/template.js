/**
 * Vuex 共享目录模板模块 - template
 *
 * 汇总要点生成、分析报告（含上传 Word）共用的模板 store，保存后组件通过 mapState 自动同步。
 * 模糊词编辑模板已独立到 wordTemplate 模块：
 * - 汇总要点/分析报告在模糊词有模板时借用其值作为初始树，但保存/清空只写本模块，不会回显到模糊词
 * - 模糊词的回显展示（FilterConditions）只由 wordTemplate 触发
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
    /** 保存模板数据 */
    saveTemplate({ commit }, payload) {
      commit('SET_TEMPLATE', {
        tree: payload.tree || [],
        words: (payload.words || []).filter(Boolean)
      })
    },
    /** 清除模板数据 */
    clearTemplate({ commit }) {
      commit('CLEAR_TEMPLATE')
    }
  }
}
