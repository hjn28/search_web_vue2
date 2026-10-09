/**
 * Vuex 模块 - reportOption（生成报告弹窗的配置）
 *
 * 为什么这几个字段要放在 store：
 *   GenerateReportModal 由两个入口打开（左侧「上传分类模板」的目录编辑、
 *   右侧结果列表/汇总要点视图的「生成报告」），用户上一次选择的生成方式
 *   与单位模板参数需要在关闭弹窗后保留、下次打开时回显。
 *   由 store 作为唯一数据源、弹窗只通过 v-model 读写、不维护本地副本，
 *   从根源上避免「本地缓存滞后覆盖 store」造成的两个入口互相污染。
 *
 * 边界（原实现的问题所在）：
 *   ① selectedOption 原先挂在 wordTemplate（模糊词模板）模块上，导致生成方式与
 *      「上传分类模板」两个不相干的场景共用一个字段，模板编辑弹窗也会读写它；
 *   ② 代表团/承办单位原先是弹窗本地 data，由右侧组件保存后再通过 initialReportOptions
 *      prop 回传，形成「子 → 父 → 子」的环形数据流，弹窗重开时反而会丢编辑。
 *   现在两类配置都收敛到本模块；模板编辑模式（mode === 'word-edit'）不渲染生成选项、
 *   不读写本模块，两个场景彻底解耦。
 *
 * 生成方式的取值同时导出常量与校验集合，供弹窗与右侧结果面板共用，
 * 避免同一组字符串在两处各写一遍。
 *
 * @module store/modules/reportOption
 */

/** 生成方式取值 */
export const REPORT_OPTION = {
  /* 按分类汇总原文内容 */
  SUMMARY_CURRENT: 'summary-current',
  SUMMARY_PLAN: 'summary-plan',
  SUMMARY_REPRESENTATIVE: 'summary-representative',
  /* 输出分析报告 */
  REPORT_DEFAULT: 'report-default',
  REPORT_DIGEST: 'report-digest',
  REPORT_DELEGATION: 'report-delegation',
  REPORT_UNDERTAKER: 'report-undertaker'
}

/** 全部合法生成方式 */
export const VALID_REPORT_OPTIONS = new Set(Object.values(REPORT_OPTION))

/** 属于「按分类汇总原文内容」的生成方式 */
export const SUMMARY_OPTIONS = new Set([
  REPORT_OPTION.SUMMARY_CURRENT,
  REPORT_OPTION.SUMMARY_PLAN,
  REPORT_OPTION.SUMMARY_REPRESENTATIVE
])

/** 汇总方式 → 提交接口时使用的 module 参数 */
export const SUMMARY_MODULE_MAP = {
  [REPORT_OPTION.SUMMARY_CURRENT]: '',
  [REPORT_OPTION.SUMMARY_PLAN]: 'shiwuwu',
  [REPORT_OPTION.SUMMARY_REPRESENTATIVE]: 'representative'
}

/** 生成方式 → 操作历史中展示的名称 */
export const REPORT_LABELS = {
  [REPORT_OPTION.REPORT_DEFAULT]: '默认',
  [REPORT_OPTION.REPORT_DIGEST]: '摘报',
  [REPORT_OPTION.REPORT_DELEGATION]: '代表团',
  [REPORT_OPTION.REPORT_UNDERTAKER]: '承办单位'
}

/** 默认生成方式：按当前分类体系输出 */
export const DEFAULT_REPORT_OPTION = REPORT_OPTION.SUMMARY_CURRENT

export default {
  namespaced: true,
  state: {
    /** 当前选中的生成方式 */
    selectedOption: DEFAULT_REPORT_OPTION,
    /** 代表团模板参数（显示名，与 dict.allDelegations 的 value 一致），空串表示未选择 */
    delegation: '',
    /** 承办单位模板参数（显示名，与 dict.allCbdw 的 deptName 一致），空串表示未选择 */
    cbdw: ''
  },
  mutations: {
    SET_SELECTED_OPTION(state, option) {
      state.selectedOption = VALID_REPORT_OPTIONS.has(option) ? option : DEFAULT_REPORT_OPTION
    },
    SET_DELEGATION(state, value) {
      state.delegation = String(value || '')
    },
    SET_CBDW(state, value) {
      state.cbdw = String(value || '')
    }
  },
  actions: {
    /**
     * 打开生成报告弹窗时初始化单位模板参数：
     * 用户上次在弹窗内的选择优先，从未选择过时用左侧筛选的当前值兜底。
     * @param {Object} context
     */
    initTargets({ state, commit, rootState }) {
      if (!state.delegation && rootState.dict.delegationValue) {
        commit('SET_DELEGATION', rootState.dict.delegationValue)
      }
      if (!state.cbdw && rootState.dict.cbdwValue) {
        commit('SET_CBDW', rootState.dict.cbdwValue)
      }
    }
  }
}
