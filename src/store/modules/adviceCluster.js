/**
 * Vuex 模块 - adviceCluster
 *
 * 议案建议聚类页面的「跨面板共享状态」唯一数据源。
 *
 * 设计说明（为什么用 store 而不是 props/events）：
 *   AdviceClusterLeft 与 AdviceClusterRight 是兄弟组件，二者之间原本有
 *   十余项状态通过父组件 adviceCluster.vue 做「props 下行 + emit 上行」的中转，
 *   父组件还通过 $refs 直接调用子组件内部方法与数组，
 *   导致三个文件互相耦合、任何一项调整都要改三处。
 *   现将真正共享的状态收敛到本模块，父子三者都只与 store 交互：
 *
 *   - 左侧产生、右侧消费：tableData / pagination / selectedIds / hasSearched /
 *                          viewMode / leftKeywords / expandResults
 *   - 右侧产生、左侧消费：citationData + activeKeyId（引文整屏展示）
 *   - 双向：expandSelection（一次拓展的勾选结果，右侧操作、左侧做检索条件）
 *   - 页面级：templateModal（统一目录模板弹窗）、historyRecords（操作历史）
 *
 * 只被单一组件使用的状态（详情的 html、摘要数据、任务队列列表等）
 * 一律留在组件内部，不进 store，避免 store 变成组件的临时变量仓库。
 *
 * @module store/modules/adviceCluster
 */
import HistoryManager from '../../utils/classes/HistoryManager'
import { searchZFSearch2 } from '../../api/login'

/** 统一目录模板弹窗的模式，取值与 GenerateReportModal 的 mode prop 一致 */
export const TEMPLATE_MODAL_MODE = {
  /** 目录模板编辑：只编辑目录结构，不展示「生成方式」选项 */
  WORD_EDIT: 'word-edit',
  /** 生成报告：展示「生成方式 / 输出分析报告」选项与单位选择 */
  REPORT: 'report'
}

/** 右侧结果视图模式 */
export const VIEW_MODE = {
  TABLE: 'table',
  SUMMARY: 'summary',
  EXPAND: 'expand',
  DETAIL: 'detail'
}

const DEFAULT_PAGE_SIZE = 15

const createPagination = () => ({ page: 1, page_size: DEFAULT_PAGE_SIZE, total: 0 })
const createExpandSelection = () => ({
  selectedPrimary: [],
  selectedKeywords: [],
  selectedSegmentContents: [],
  highlightedPrimary: []
})

/**
 * 操作历史持久化管理器：模块级单例，
 * 页面刷新后由 HistoryManager 自行从 localStorage 回填。
 */
const history = new HistoryManager()

/**
 * 从接口响应中提取列表数据，兼容多种包裹层级
 * @param {any} res - 接口响应
 * @param {string} key - 列表字段名
 * @returns {Array} 列表数据
 */
function pickList(res, key = 'all_item') {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (res.data && Array.isArray(res.data[key])) return res.data[key]
  if (Array.isArray(res.data)) return res.data
  return []
}

/**
 * 为缺失 id 的行补齐唯一 id，避免 undefined id 造成勾选错乱
 * @param {Array} list - 原始列表
 * @returns {Array} 补充了 id、checked、disabled 的列表
 */
function normalizeRows(list) {
  return (Array.isArray(list) ? list : []).map((item, index) => {
    const row = item || {}
    return {
      checked: false,
      disabled: false,
      ...row,
      id: row.id != null ? row.id : `_row_${index + 1}`
    }
  })
}

export default {
  namespaced: true,
  state: {
    /* ---- 左侧检索条件 → 右侧结果列表 ---- */
    tableData: [],
    pagination: createPagination(),
    selectedIds: [],
    hasSearched: false,

    /* ---- 右侧视图模式与详情内容 ---- */
    viewMode: VIEW_MODE.TABLE,
    detail: { visible: false, html: '', matchType: '' },

    /* ---- 左侧关键词（右侧生成报告时作为目录树兜底数据） ---- */
    leftKeywords: [],

    /* ---- 一次拓展：左侧发起请求，右侧展示，勾选结果回流为检索条件 ---- */
    expandResults: [],
    expandSelection: createExpandSelection(),

    /* ---- 引文：右侧点击 → 左侧整屏展示 ---- */
    citationData: [],
    activeKeyId: '',

    /* ---- 统一目录模板弹窗 ---- */
    templateModal: {
      visible: false,
      mode: TEMPLATE_MODAL_MODE.REPORT,
      initialTree: [],
      initialFileName: '',
      /** 是否展示「按分类汇总原文内容」区块（从任务队列继续生成时置 false） */
      showSummaryOptions: true
    },
    /**
     * 「立即生成」的待处理载荷。
     * 弹窗在父组件挂载、右侧面板是兄弟组件，二者不能直接通信；
     * 由父组件接住弹窗的 generate 事件写到这里，右侧面板消费后立即清空。
     */
    templateGenerate: null,

    /* ---- 操作历史 ---- */
    historyRecords: history.getRecords()
  },
  getters: {
    /** 是否有引文数据，决定左侧渲染引文视图还是主面板 */
    citationVisible: state => state.citationData.length > 0,

    /** 已勾选 id 的集合，把 O(n) 的 includes 降为 O(1) */
    selectedIdSet: state => new Set(state.selectedIds),

    /** 当前勾选的行数据 */
    selectedRows: (state, getters) => {
      if (!state.selectedIds.length) return []
      return state.tableData.filter(item => item.id && getters.selectedIdSet.has(item.id))
    },

    /** 是否已全选（只统计可勾选且带 id 的行） */
    isAllChecked: (state, getters) => {
      const selectable = state.tableData.filter(item => !item.disabled && item.id)
      return selectable.length > 0 && selectable.every(item => getters.selectedIdSet.has(item.id))
    }
  },
  mutations: {
    /* ==================== 结果列表 ==================== */
    SET_TABLE_DATA(state, list) {
      state.tableData = Array.isArray(list) ? list : []
    },
    SET_PAGINATION(state, pagination) {
      state.pagination = { ...state.pagination, ...(pagination || {}) }
    },
    SET_SELECTED_IDS(state, ids) {
      state.selectedIds = Array.isArray(ids) ? ids : []
    },
    SET_HAS_SEARCHED(state, value) {
      state.hasSearched = !!value
    },
    SET_VIEW_MODE(state, mode) {
      state.viewMode = mode || VIEW_MODE.TABLE
    },
    SET_DETAIL(state, detail) {
      state.detail = { visible: false, html: '', matchType: '', ...(detail || {}) }
    },
    /** 清空检索结果（含分页、勾选与详情），一次拓展结果保留以便"查看结果"复用 */
    RESET_RESULTS(state) {
      state.tableData = []
      state.pagination = createPagination()
      state.selectedIds = []
      state.detail = { visible: false, html: '', matchType: '' }
    },

    /* ==================== 左侧关键词 ==================== */
    SET_LEFT_KEYWORDS(state, keywords) {
      state.leftKeywords = Array.isArray(keywords) ? keywords : []
    },

    /* ==================== 一次拓展 ==================== */
    SET_EXPAND_RESULTS(state, list) {
      state.expandResults = Array.isArray(list) ? list : []
      state.expandSelection = createExpandSelection()
    },
    /**
     * 勾选/取消勾选整条拓展结果：
     * 勾选时带上其下全部关键词与片段，取消时反向剔除并清掉本条的高亮标记
     */
    TOGGLE_EXPAND_ITEM(state, item) {
      if (!item || item.title == null) return
      const selection = state.expandSelection
      const index = state.expandResults.indexOf(item)
      const keywords = Array.isArray(item.keywords) ? item.keywords : []
      const segments = Array.isArray(item.segments) ? item.segments : []
      const checked = !selection.selectedPrimary.includes(item.title)

      if (checked) {
        selection.selectedPrimary.push(item.title)
        keywords.forEach(kw => {
          if (!selection.selectedKeywords.includes(kw)) selection.selectedKeywords.push(kw)
        })
        segments.forEach(seg => {
          const content = seg && seg.content
          if (content && !selection.selectedSegmentContents.includes(content)) {
            selection.selectedSegmentContents.push(content)
          }
        })
        return
      }

      selection.selectedPrimary = selection.selectedPrimary.filter(title => title !== item.title)
      selection.selectedKeywords = selection.selectedKeywords.filter(kw => !keywords.includes(kw))
      selection.selectedSegmentContents = selection.selectedSegmentContents.filter(
        content => !segments.some(seg => seg && seg.content === content)
      )
      const prefix = `primary:${index}:`
      selection.highlightedPrimary = selection.highlightedPrimary.filter(key => !key.startsWith(prefix))
    },
    /** 点击关键词标签：切换高亮，并同步关键词与所属条目的选中态 */
    TOGGLE_EXPAND_KEYWORD(state, { keyword, title, index, keywordIndex }) {
      if (!keyword) return
      const selection = state.expandSelection
      const key = `primary:${index}:${keywordIndex}`
      const hit = selection.highlightedPrimary.indexOf(key)

      if (hit === -1) {
        selection.highlightedPrimary.push(key)
        if (!selection.selectedKeywords.includes(keyword)) selection.selectedKeywords.push(keyword)
        if (title && !selection.selectedPrimary.includes(title)) selection.selectedPrimary.push(title)
        return
      }

      selection.highlightedPrimary.splice(hit, 1)
      selection.selectedKeywords = selection.selectedKeywords.filter(kw => kw !== keyword)
    },
    /** 勾选/取消勾选片段 */
    SET_EXPAND_SEGMENT(state, { content, checked }) {
      if (!content) return
      const list = state.expandSelection.selectedSegmentContents
      const index = list.indexOf(content)
      if (checked && index === -1) list.push(content)
      if (!checked && index > -1) list.splice(index, 1)
    },
    CLEAR_EXPAND_SELECTION(state) {
      state.expandSelection = createExpandSelection()
    },

    /* ==================== 引文 ==================== */
    SET_CITATION(state, { data, keyId }) {
      state.citationData = Array.isArray(data) ? data : []
      state.activeKeyId = keyId || ''
    },
    CLEAR_CITATION(state) {
      state.citationData = []
      state.activeKeyId = ''
    },

    /* ==================== 统一目录模板弹窗 ==================== */
    OPEN_TEMPLATE_MODAL(state, { mode, initialTree, initialFileName, showSummaryOptions }) {
      state.templateModal = {
        visible: true,
        mode: mode || TEMPLATE_MODAL_MODE.REPORT,
        initialTree: Array.isArray(initialTree) ? initialTree : [],
        initialFileName: initialFileName || '',
        showSummaryOptions: showSummaryOptions !== false
      }
    },
    /**
     * 关闭弹窗：只改 visible，其余字段保持原样。
     * 弹窗没有 v-if，关闭走的是 CSS 透明度过渡（0.2s），DOM 还会在屏幕上停留一会儿；
     * 若此刻把 mode 重置成 REPORT，处于 word-edit 模式的弹窗会在淡出过程中
     * 瞬间变成「生成报告」标题并冒出「立即生成」按钮。重新打开时
     * OPEN_TEMPLATE_MODAL 会重设全部字段，这里无需兜底。
     */
    CLOSE_TEMPLATE_MODAL(state) {
      state.templateModal = { ...state.templateModal, visible: false }
    },
    /** 记录弹窗提交的「立即生成」请求，等待右侧面板消费 */
    REQUEST_TEMPLATE_GENERATE(state, payload) {
      state.templateGenerate = payload || null
    },
    CLEAR_TEMPLATE_GENERATE(state) {
      state.templateGenerate = null
    },

    /* ==================== 操作历史 ==================== */
    SET_HISTORY_RECORDS(state, records) {
      state.historyRecords = Array.isArray(records) ? records : []
    }
  },
  actions: {
    /* ==================== 操作历史 ==================== */
    /**
     * 追加一条操作历史
     * @param {Object} payload
     * @param {string} payload.action - 操作类型
     * @param {string} payload.content - 操作内容描述
     */
    addHistory({ commit }, { action, content }) {
      history.addRecord(action, content)
      commit('SET_HISTORY_RECORDS', history.getRecords())
    },
    /** 清空操作历史（含 localStorage 持久化数据） */
    clearHistory({ commit }) {
      history.clear()
      commit('SET_HISTORY_RECORDS', [])
    },

    /* ==================== 检索聚类（左侧发起 → 右侧列表） ==================== */
    /**
     * 按左侧检索条件拉取聚类结果并写入右侧列表
     * @param {Object} payload
     * @param {Object} payload.params - 接口检索参数
     * @param {string} payload.historyText - 写入操作历史的描述文本
     */
    fetchClusterResults({ commit, dispatch }, { params, historyText }) {
      commit('SET_VIEW_MODE', VIEW_MODE.TABLE)
      commit('CLEAR_CITATION')
      commit('RESET_RESULTS')
      commit('SET_HAS_SEARCHED', true)
      dispatch('addHistory', { action: '检索聚类（接口）', content: historyText })

      return searchZFSearch2(params)
        .then(res => {
          const rows = normalizeRows(pickList(res))
          commit('SET_TABLE_DATA', rows)
          commit('SET_PAGINATION', { page: 1, total: rows.length })
        })
        .catch(() => {
          // 接口异常时清空列表，右侧以「暂无数据」呈现，hasSearched 已置位
          commit('SET_TABLE_DATA', [])
          commit('SET_PAGINATION', { page: 1, total: 0 })
        })
    },

    /**
     * 从左侧文件搜索把单条记录追加到右侧结果列表（按 id 去重）
     * @param {Object} item - 待追加的记录
     */
    addToCluster({ state, commit }, item) {
      if (!item) return
      if (item.id != null && state.tableData.some(row => row.id === item.id)) return

      commit('SET_TABLE_DATA', [
        ...state.tableData,
        {
          id: item.id != null ? item.id : `FS-${state.tableData.length + 1}`,
          title: item.title || '未命名',
          session: item.session || '-',
          representative: item.representative || '-',
          delegation: item.delegation || '-',
          content: item.content || ''
        }
      ])
      commit('SET_PAGINATION', { total: state.tableData.length })
    },

    /* ==================== 统一目录模板弹窗 ==================== */
    /**
     * 打开统一目录模板弹窗
     * @param {Object|string} payload - TEMPLATE_MODAL_MODE 字符串，或
     *   { mode, initialTree, initialFileName, showSummaryOptions }
     */
    openTemplateModal({ commit, rootState }, payload = {}) {
      const options = typeof payload === 'string' ? { mode: payload } : payload || {}
      const mode = options.mode || TEMPLATE_MODAL_MODE.REPORT
      const isWordEdit = mode === TEMPLATE_MODAL_MODE.WORD_EDIT
      // 调用方未显式给树时兜底：目录模板编辑复用模糊词模板；生成报告复用共享模板
      const source = (isWordEdit ? rootState.wordTemplate : rootState.template) || {}
      commit('OPEN_TEMPLATE_MODAL', {
        mode,
        initialTree: Array.isArray(options.initialTree) ? options.initialTree : source.tree,
        initialFileName:
          options.initialFileName != null
            ? options.initialFileName
            : isWordEdit
              ? source.wordFileName
              : '',
        showSummaryOptions: options.showSummaryOptions
      })
    },
    /**
     * 记录「立即生成」请求。
     * 生成接口需要右侧面板的任务数据与勾选行，故本模块只负责把载荷转交右侧，
     * 弹窗的关闭时机由右侧在参数校验通过后决定（校验不通过时保持打开）。
     */
    requestTemplateGenerate({ commit }, payload) {
      commit('REQUEST_TEMPLATE_GENERATE', payload)
    },
    clearTemplateGenerate({ commit }) {
      commit('CLEAR_TEMPLATE_GENERATE')
    },
    /**
     * 保存模板并关闭弹窗。
     * 按模式路由到对应模板 store：目录模板 → wordTemplate（独立，仅模糊词回显）；
     * 生成报告 → template（汇总要点/分析报告共用）。
     */
    saveTemplateModal({ state, commit, dispatch }, payload) {
      const isWordEdit = state.templateModal.mode === TEMPLATE_MODAL_MODE.WORD_EDIT
      dispatch(isWordEdit ? 'wordTemplate/saveTemplate' : 'template/saveTemplate', payload, { root: true })
      commit('CLOSE_TEMPLATE_MODAL')
    },
    closeTemplateModal({ commit }) {
      commit('CLOSE_TEMPLATE_MODAL')
    }
  }
}
