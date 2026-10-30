<template>
  <div class="right-container" ref="rightContainer">
    <!-- ---- 任务队列弹窗 ---- -->
    <TaskQueueModal
      :visible="taskQueueVisible"
      :items="taskQueueItems"
      :refreshing="refreshing"
      :deleting-task-ids="deletingTaskIds"
      :detail-loading="detailLoading"
      @close="closeTaskQueue"
      @refresh="rwdlQuery"
      @delete-task="zyDel"
      @view-detail="onTaskViewDetail"
    />

    <!-- ---- 流程图 / 使用手册预览 ---- -->
    <div class="preview-mask" :class="{ show: previewVisible }" @click="closePreview"></div>
    <div class="preview-modal" :class="{ show: previewVisible }">
      <div class="preview-header">
        <div class="preview-title">{{ previewTitle }}</div>
        <div class="preview-header-actions">
          <button
            v-if="previewVisible && previewType === 'docx'"
            class="preview-download"
            type="button"
            @click="downloadCurrentDocx"
          >
            下载
          </button>
          <span class="preview-close" @click="closePreview">×</span>
        </div>
      </div>
      <div class="preview-body">
        <div v-if="previewVisible && previewType === 'pdf'" style="height: 100%;overflow-y:auto;text-align:center;">
          <img src="@/assets/img/流程图.png" />
        </div>
        <vue-office-docx v-else-if="previewVisible && previewType === 'docx'" :src="docxSrc" style="height: 100%;overflow-y:auto;" />
      </div>
    </div>

    <!-- ---- 标签树弹窗（与任务队列弹窗保持同样尺寸与区域） ---- -->
    <div class="task-queue-mask" :class="{ show: bqTreeVisible }" @click="closeBqTreeModal"></div>
    <div class="task-queue-modal bq-tree-modal" :class="{ show: bqTreeVisible }">
      <div class="task-queue-header">
        <div class="task-queue-header-left">
          <div class="task-queue-title">标签结构</div>
        </div>
        <span class="task-queue-close" @click="closeBqTreeModal">×</span>
      </div>
    </div>

    <!-- ---- 主面板 ---- -->
    <div class="panel result-panel">
      <div class="result-header">
        <button class="btn btn-outline btn-sm" @click="previewFlowChart">流程图预览</button>
        <button class="btn btn-outline btn-sm" @click="previewManual">使用手册预览</button>
      </div>

      <!-- ---- 操作栏 ---- -->
      <div class="action-bar">
        <div v-if="viewMode === viewModeEnum.table" class="action-row">
          <button class="btn btn-outline btn-sm" :disabled="!tableData.length" @click="toggleSelectAll">
            {{ isAllChecked ? '取消全选' : '全选' }}
          </button>
          <button class="btn btn-outline btn-sm" :disabled="!selectedIds.length" @click="openGenerateReportModal()">生成报告</button>
          <!-- 字体设置为楷体 -->
          <div style="font-family: 'KaiTi', 'STKaiti', '楷体', serif !important;font-size: 12px;margin-right:10px;">
            <div style="color: red; float:left; height:28px;font-family: inherit;">#</div>
            <div style="height:16px;line-height: 16px; float:left; margin-left: 5px;font-family: inherit;">
              <span style="font-family: inherit;">按分类汇总原文内容</span><br />
              <span style="font-family: inherit;">按模板生成分析报告</span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" :disabled="!selectedIds.length" @click="outputRepresentatives">输出列表</button>
          <button class="btn btn-outline btn-sm" @click="rwdlQuery">任务队列</button>
          <button class="btn btn-outline btn-sm" @click="resetTableSelection">重置</button>
        </div>

        <div v-else-if="viewMode === viewModeEnum.summary" class="detail-header-actions">
          <button class="btn btn-outline btn-sm" @click="backToTable">返回列表</button>
          <button class="btn btn-outline btn-sm" @click="rwdlQuery">任务队列</button>
          <template v-if="currentSummaryType === summaryType.digest">
            <button class="btn btn-outline btn-sm" @click="exportSummary">导出汇总要点</button>
            <button
              class="btn btn-outline btn-sm"
              @click="openGenerateReportModal({ hideSummaryOptions: true, fromTaskQueue: generateReportFromTaskQueue })"
            >
              生成报告
            </button>
          </template>
          <template v-else>
            <button class="btn btn-outline btn-sm" @click="exportOverview">导出分析报告</button>
            <button class="btn btn-outline btn-sm" @click="toggleZsbgEditMode">{{ zsbgEditMode ? '关闭编辑' : '开始编辑' }}</button>
            <button class="btn btn-outline btn-sm" @click="saveLocalZsbgEdits">保存编辑</button>
            <button class="btn btn-outline btn-sm" @click="resetLocalZsbgEdits">重置编辑</button>
          </template>
        </div>

        <div v-else-if="viewMode === viewModeEnum.importantFile" class="detail-header-actions">
          <button class="btn btn-outline btn-sm" @click="backToTable">返回</button>
        </div>
        <div v-else class="detail-header-actions">
          <button class="btn btn-outline btn-sm" @click="backToTable">返回列表</button>
        </div>
      </div>

      <!-- ---- 可滚动内容区域 ---- -->
      <div class="result-content" ref="resultContent">
        <ClusterResultTable v-if="viewMode === viewModeEnum.table"
          :table-data="tableData"
          :pagination="pagination"
          :selected-ids="selectedIds"
          :has-searched="hasSearched"
          :show-cbxx="showCbxx"
          @update:selected-ids="onUpdateSelectedIds"
          @update:pagination="onUpdatePagination"
          @view-detail="onViewDetail"
        />
        <template v-else-if="viewMode === viewModeEnum.summary">
          <OverviewReportView v-if="currentSummaryType === summaryType.report"
            :zsbg-render-nodes="zsbgRenderNodes"
            :active-key-id="activeKeyId"
            :zsbg-edit-mode="zsbgEditMode"
            :jljgzs-data="jljgzsData"
            @citation-click="onCitationClick"
            @field-blur="handleZsbgFieldBlur"
          />
          <SummaryReportView v-else :zhaiyao-data="zhaiyaoData" />
        </template>
        <ExpandResultsView v-else-if="viewMode === viewModeEnum.expand"
          :expand-results="expandResults"
          :expand-selection="expandSelection"
          @expand-item-check="onExpandItemCheck"
          @expand-keyword-click="onExpandKeywordClick"
          @expand-segment-change="onExpandSegmentChange"
        />
        <div v-else-if="viewMode === viewModeEnum.importantFile" class="important-file-right-view">
          <div class="important-file-right-title">{{ importantFile && importantFile.name }}</div>
          <div v-loading="importantContentLoading" class="important-file-right-content" v-html="importantFileHtml"></div>
        </div>
        <DetailView v-else :detail="detail" @back="backToTable" />
      </div>
    </div>

    <button v-if="showBackTop" class="back-top-btn" @click="scrollRightToTop">↑ 回到顶部</button>
  </div>
</template>

<script>
/**
 * AdviceClusterRight - 右侧面板组件（视图调度壳）
 *
 * 职责：管理操作栏、弹窗及视图切换，具体视图渲染委托给子组件。
 *
 * 数据边界：
 *   - 与左侧面板共享的状态（结果列表、分页、勾选、视图模式、详情、引文、
 *     一次拓展结果与勾选）全部读写 adviceCluster store，组件自身不做中转；
 *   - 仅本组件使用的状态（汇总要点/分析报告数据、任务队列列表、预览弹窗等）
 *     留在 data 中；
 *   - 「生成报告」弹窗全页只有一个，挂在父组件上由 adviceCluster.templateModal
 *     驱动。本组件不自行实例化弹窗，只负责：
 *     ① 按入口准备初始目录树后 dispatch openTemplateModal 打开它；
 *     ② 监听 store 转交的「立即生成」载荷并调用对应接口。
 *
 * 生成方式枚举（ReportOption / validReportOptions 等）统一从
 * report/GenerateReportModal.vue 导入，避免多份定义不同步。
 */
import VueOfficeDocx from '@vue-office/docx'
import { saveAs } from 'file-saver'
import '@vue-office/docx/lib/index.css'
import { searchZFZhaiyao, taskQuery, taskIdQuery, deleteIds, updateResult, getNewResult } from '../../../api/zytask'
import { uploadFlieToHtml } from '../../../api/login'
import ClusterResultTable from './ClusterResultTable.vue'
import ExpandResultsView from './ExpandResultsView.vue'
import SummaryReportView from '../report/SummaryReportView.vue'
import OverviewReportView from '../report/OverviewReportView.vue'
import DetailView from './DetailView.vue'
import TaskQueueModal from './TaskQueueModal.vue'
import SummaryFormatter from '../../../utils/classes/SummaryFormatter'
import DataExporter from '../../../utils/classes/DataExporter'
import * as echarts from 'echarts'
import ReportBuilder from '../../../utils/classes/ReportBuilder'
import TreeHelper from '../../../utils/classes/TreeHelper'
import EditableReportStore from '../utils/EditableReportStore'
import { mapState, mapGetters } from 'vuex'
import { TEMPLATE_MODAL_MODE, VIEW_MODE } from '../../../store/modules/adviceCluster'
import {
  ReportOption,
  validReportOptions,
  summaryOptions,
  summaryModuleMap,
  reportLabels
} from '../report/GenerateReportModal.vue'

/** 结果类型：'1' 汇总要点，'2' 分析报告 */
const summaryType = { digest: '1', report: '2' }

/** 任务状态：'0' 执行中 */
const taskStatus = { running: '0' }

/** 接口返回码 */
const apiCode = { ok: 0, conflict: 999 }

/** 预览弹窗的文档类型 */
const previewType = { pdf: 'pdf', docx: 'docx' }

export default {
  name: 'AdviceClusterRight',
  components: {
    ClusterResultTable,
    ExpandResultsView,
    SummaryReportView,
    OverviewReportView,
    DetailView,
    TaskQueueModal,
    VueOfficeDocx
  },
  data() {
    return {
      showBackTop: false,
      userId: '',
      importantContentLoading: false,

      /* ---- 汇总要点 / 分析报告结果（仅本组件消费） ---- */
      currentSummaryType: summaryType.digest,
      zhaiyaoData: [],
      summaryContent: '',

      /* ---- 分析报告 ---- */
      zsbgRenderNodes: [],
      zsbgEditableTree: [],
      zsbgEditMode: false,
      zsbgLocalEdits: {},
      currentTaskId: '',
      /** 任务详情的请求序号，用于丢弃乱序返回的旧响应 */
      detailRequestSeq: 0,
      detailLoading: false,
      jljgzsData: [],

      /* ---- 任务队列 ---- */
      taskQueueVisible: false,
      taskQueueItems: [],
      refreshing: false,
      deletingTaskIds: [],
      /** 当前是否从任务队列进入生成报告流程 */
      generateReportFromTaskQueue: false,
      taskQueueReportTree: [],
      /** 任务返回的词数组（无 tree 时作为生成报告的目录兜底） */
      lastReportWords: [],

      /* ---- 当前页面内预览 ---- */
      previewVisible: false,
      previewType: previewType.pdf,
      previewTitle: '',
      docxSrc: 'static/综合分析功能说明手册.docx',

      /* ---- 标签树弹窗 ---- */
      bqTreeVisible: false
    }
  },
  computed: {
    ...mapState('dict', {
      cbdwList: 'allCbdw',
      delegationList: 'allDelegations'
    }),
    ...mapState('taskAiParams', {
      taskAiParams: state => ({
        data_base: state.data_base,
        theme: state.theme,
        term_theme: state.term_theme
      })
    }),
    ...mapState('adviceCluster', [
      'tableData',
      'resultDataBase',
      'pagination',
      'selectedIds',
      'hasSearched',
      'viewMode',
      'detail',
      'importantFile',
      'importantFileHtml',
      'leftKeywords',
      'expandResults',
      'expandSelection',
      'activeKeyId',
      'templateGenerate'
    ]),
    ...mapGetters('adviceCluster', ['selectedRows', 'isAllChecked']),

    /* ---- 模板中直接引用的常量（避免魔法字符串） ---- */
    viewModeEnum() { return VIEW_MODE },
    summaryType() { return summaryType },
    SummaryFormatter() { return SummaryFormatter },

    /**
     * 承办信息仅建议库（来源库 jianyi）有数据，其他来源库不展示该列。
     * 取当前结果集的来源库（检索返回时写入），不跟随左侧库类型的即时切换。
     */
    showCbxx() {
      return this.resultDataBase === 'jianyi'
    }
  },
  watch: {
    /** 共享弹窗的「立即生成」载荷（由父组件经 store 转交） */
    templateGenerate(payload) {
      if (payload) this.handleTemplateGenerate(payload)
    },
    importantFile(file) {
      if (file) this.loadImportantFile(file)
    }
  },
  mounted() {
    if (this.viewMode === VIEW_MODE.importantFile && this.importantFile) this.loadImportantFile(this.importantFile)
    const el = this.$refs.resultContent
    if (el) {
      el.addEventListener('scroll', this.handleRightScroll)
      this.handleRightScroll()
    }
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'))
      this.userId = userInfo?.userId || '1234'
    } catch (_) {
      this.userId = '1234'
    }
  },
  beforeDestroy() {
    const el = this.$refs.resultContent
    if (el) el.removeEventListener('scroll', this.handleRightScroll)
  },
  methods: {
    showAlert(msg) { this.$alert(msg, '提示', { confirmButtonText: '确定' }) },
    addHistory(action, content) { this.$store.dispatch('adviceCluster/addHistory', { action, content }) },
    loadImportantFile(file) {
      this.importantContentLoading = false
      if (!file || !file.file) {
        this.$store.commit('adviceCluster/SET_IMPORTANT_FILE_HTML', '<div class="important-empty-content">暂无可展示的文件正文，请上传对应文件后查看。</div>')
        return
      }
      const formData = new FormData()
      formData.append('file', file.file)
      this.importantContentLoading = true
      uploadFlieToHtml(formData)
        .then(res => {
          const content = res && res.data !== undefined ? res.data : res
          let html = ''
          if (typeof content === 'string') html = content
          else if (content && typeof content === 'object') html = String(content.html || content.content || content.data || '')
          this.$store.commit('adviceCluster/SET_IMPORTANT_FILE_HTML', html || '<div class="important-empty-content">暂无可展示的文件正文</div>')
        })
        .catch(() => {
          this.$store.commit('adviceCluster/SET_IMPORTANT_FILE_HTML', '<div class="important-empty-content">文件内容加载失败，请重试</div>')
        })
        .finally(() => {
          this.importantContentLoading = false
        })
    },

    /* ==================== 子组件事件 → store ==================== */
    onUpdateSelectedIds(ids) {
      this.$store.commit('adviceCluster/SET_SELECTED_IDS', ids)
    },
    onUpdatePagination(pagination) {
      this.$store.commit('adviceCluster/SET_PAGINATION', pagination)
    },
    onExpandItemCheck(item) {
      this.$store.commit('adviceCluster/TOGGLE_EXPAND_ITEM', item)
    },
    onExpandKeywordClick(keyword, item, index, keywordIndex) {
      this.$store.commit('adviceCluster/TOGGLE_EXPAND_KEYWORD', {
        keyword,
        title: item && item.title,
        index,
        keywordIndex
      })
    },
    onExpandSegmentChange({ content, checked }) {
      this.$store.commit('adviceCluster/SET_EXPAND_SEGMENT', { content, checked })
    },
    /** 点击引文：写入 store，由左侧整屏展示 */
    onCitationClick({ data, keyId }) {
      this.$store.commit('adviceCluster/SET_CITATION', { data, keyId })
    },

    /* ==================== 流程图 / 使用手册预览 ==================== */
    previewFlowChart() {
      this.previewType = previewType.pdf
      this.previewTitle = '综合分析流程图'
      this.previewVisible = true
    },
    previewManual() {
      this.previewType = previewType.docx
      this.previewTitle = '综合分析功能说明手册'
      this.previewVisible = true
    },
    closePreview() {
      this.previewVisible = false
      this.previewType = previewType.pdf
      this.previewTitle = ''
    },
    async downloadCurrentDocx() {
      const src = this.docxSrc
      if (!src) {
        this.showAlert('没有可下载的文档')
        return
      }
      const fileName = (this.previewTitle || 'document') + '.docx'
      try {
        const response = await fetch(src)
        if (!response.ok) throw new Error('fetch failed')
        saveAs(await response.blob(), fileName)
      } catch (_) {
        const link = document.createElement('a')
        link.href = src
        link.download = fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        link.remove()
      }
    },

    /* ==================== 滚动 ==================== */
    scrollRightToTop() {
      const el = this.$refs.resultContent
      el && el.scrollTo({ top: 0, behavior: 'smooth' })
    },
    handleRightScroll() {
      if (this._rafPending) return
      this._rafPending = true
      requestAnimationFrame(() => {
        const el = this.$refs.resultContent
        if (el) this.showBackTop = el.scrollTop > 0
        this._rafPending = false
      })
    },

    /* ==================== 行选择（全选/重置） ==================== */
    selectAllRows() {
      this.$store.commit(
        'adviceCluster/SET_SELECTED_IDS',
        this.tableData.filter(item => !item.disabled && item.id).map(item => item.id)
      )
    },
    cancelSelectRows() {
      this.$store.commit('adviceCluster/SET_SELECTED_IDS', [])
    },
    toggleSelectAll() {
      this.isAllChecked ? this.cancelSelectRows() : this.selectAllRows()
    },
    resetTableSelection() {
      this.cancelSelectRows()
      this.backToTable()
    },

    /* ==================== 查看详情 ==================== */
    onViewDetail(proposal) {
      if (!proposal) return
      const rawContent = typeof proposal.content === 'string' ? proposal.content : ''
      const highlighted = SummaryFormatter.highlightWords(rawContent, SummaryFormatter.parseExactWordList(''))
      const html = rawContent ? highlighted.replace(/\n/g, '<br/>') : '暂无正文内容'
      this.$store.commit('adviceCluster/SET_DETAIL', {
        visible: true,
        html,
        matchType: proposal.matchType || '正文'
      })
      this.$store.commit('adviceCluster/SET_VIEW_MODE', VIEW_MODE.detail)
      this.addHistory('查看详情', proposal.id ? `查看了议案【${proposal.id}】的内容` : '查看了一条议案内容')
    },
    backToTable() {
      this.generateReportFromTaskQueue = false
      this.taskQueueReportTree = []
      this.$store.commit('adviceCluster/SET_VIEW_MODE', VIEW_MODE.table)
      this.$store.commit('adviceCluster/SET_DETAIL', { visible: false })
      this.$store.commit('adviceCluster/SET_IMPORTANT_FILE', null)
    },

    /* ==================== 打开生成报告弹窗（全页共用一个） ==================== */
    openGenerateReportModal(options = {}) {
      const fromTaskQueue = Boolean(options.fromTaskQueue)
      let initialTree = []
      let initialFileName = ''

      if (fromTaskQueue && this.taskQueueReportTree.length) {
        initialTree = this.taskQueueReportTree
      } else {
        const wordTemplate = this.$store.state.wordTemplate
        const savedTemplate = this.$store.state.template
        if (wordTemplate.hasData && Array.isArray(wordTemplate.tree) && wordTemplate.tree.length) {
          initialTree = wordTemplate.tree
          initialFileName = wordTemplate.wordFileName || ''
        } else if (savedTemplate.hasData && Array.isArray(savedTemplate.tree) && savedTemplate.tree.length) {
          initialTree = savedTemplate.tree
        } else {
          initialTree = TreeHelper.buildTreeFromWords(Array.isArray(this.leftKeywords) ? this.leftKeywords : [])
        }
      }

      this.$store.dispatch('adviceCluster/openTemplateModal', {
        mode: TEMPLATE_MODAL_MODE.report,
        initialTree,
        initialFileName,
        showSummaryOptions: !options.hideSummaryOptions
      })
    },

    /* ==================== 生成报告弹窗提交（消费 store 载荷） ==================== */
    handleTemplateGenerate(payload) {
      this.$store.dispatch('adviceCluster/clearTemplateGenerate')

      const option = payload.selectedOption ? String(payload.selectedOption) : ''
      if (!validReportOptions.has(option)) {
        this.showAlert('请选择有效的生成方式')
        return
      }
      const tree = Array.isArray(payload.tree) ? payload.tree : []

      if (this.generateReportFromTaskQueue) {
        this.$store.dispatch('adviceCluster/closeTemplateModal')
        this.submitTaskReportGenerate(option, payload, tree)
        return
      }

      const selected = this.selectedRows
      if (!selected.length) {
        this.showAlert('请先勾选要生成汇总/报告的记录')
        return
      }
      if (tree.length) {
        this.$store.dispatch('template/saveTemplate', {
          tree,
          words: TreeHelper.collectNodeNames(tree)
        })
      }
      this.$store.dispatch('adviceCluster/closeTemplateModal')

      if (summaryOptions.has(option)) this.submitSummaryGenerate(option, tree, selected)
      else this.submitReportGenerate(option, payload, tree, selected)
    },
    /**
     * 按分类汇总原文内容（type '1'）：三个选项以 aiObj.module 区分
     */
    submitSummaryGenerate(option, tree, selected) {
      const module = summaryModuleMap[option] || ''
      const word = Array.from(new Set(TreeHelper.collectLeafNames(tree)))
      const qdNeedObj = tree.length
        ? { words: word, tree, module }
        : { words: word, module }

      this.addHistory('分类要点汇总', '使用模板目录结构提交分类要点汇总生成')
      taskQuery(this.userId)
        .then(res => {
          if ((res.data || []).some(item => item.status === taskStatus.running)) {
            this.showAlert('当前已存在正在执行的任务，请点击任务队列进行查看')
            return
          }
          return searchZFZhaiyao({
            userId: this.userId,
            aiObj: { word, obj: selected, module, ...this.taskAiParams },
            type: '1',
            qdNeedObj
          })
            .then(r => {
              if (r.code === apiCode.ok) this.$alert(r.data)
              else if (r.code === apiCode.conflict) this.showAlert(r.message)
              else this.showAlert(r.data)
            })
            .catch(() => this.showAlert('分类要点汇总生成失败'))
        })
        .catch(() => {})
    },
    /**
     * 输出分析报告（type '3'）：默认模板输出＝正常生成分析报告（minzheng、不带单位参数），
     * 摘报＝原摘报参数（zhaibao），代表团/承办单位＝分析报告下增加对应单位参数（显示名）
     */
    submitReportGenerate(option, payload, tree, selected) {
      const words = TreeHelper.collectNodeNames(tree)
      const qdNeedObj = tree.length ? { words, tree } : { words }
      const extraParam = this.buildUnitParam(option, payload)
      const presetSubtopics = ReportBuilder.buildPresetSubtopics(TreeHelper.treeToInputs(tree))
      const reportType = option === ReportOption.reportDigest ? 'zhaibao' : 'minzheng'

      this.addHistory('生成分析报告', `按${reportLabels[option] || ''}模板生成分析报告`)
      taskQuery(this.userId)
        .then(res => {
          if ((res.data || []).some(item => item.status === taskStatus.running)) {
            this.showAlert('当前已存在正在执行的任务，请点击任务队列进行查看')
            return
          }
          return searchZFZhaiyao({
            userId: this.userId,
            aiObj: {
              obj: selected,
              preset_subtopics: presetSubtopics,
              type: reportType,
              ...extraParam,
              ...this.taskAiParams
            },
            type: '3',
            qdNeedObj
          })
            .then(r => {
              if (r.code === apiCode.ok) this.$alert(r.data)
              else this.showAlert(r.data)
            })
            .catch(() => this.showAlert('分析报告生成失败'))
        })
        .catch(() => {})
    },
    /** 从任务队列继续生成分析报告（type '2'）：数据源为已取回的任务结果 */
    submitTaskReportGenerate(option, payload, tree) {
      const qdNeedObj = tree.length
        ? { words: TreeHelper.collectNodeNames(tree), tree }
        : { words: this.lastReportWords }
      const extraParam = this.buildUnitParam(option, payload)
      const presetSubtopics = ReportBuilder.buildPresetSubtopics(TreeHelper.treeToInputs(tree))
      const reportType = option === ReportOption.reportDigest ? 'zhaibao' : 'minzheng'

      taskQuery(this.userId)
        .then(res => {
          if ((res.data || []).some(item => item.status === taskStatus.running)) {
            this.showAlert('当前已存在正在执行的任务，请点击任务队列进行查看')
            return
          }
          return searchZFZhaiyao({
            userId: this.userId,
            aiObj: {
              data: this.jljgzsData,
              preset_subtopics: presetSubtopics,
              type: reportType,
              ...extraParam,
              ...this.taskAiParams
            },
            type: '2',
            qdNeedObj
          })
            .then(r => {
              if (r.code === apiCode.ok) this.$alert(r.data)
              else this.showAlert(r.data)
            })
            .catch(() => this.showAlert('分析报告生成失败'))
        })
        .catch(() => {})
    },
    /**
     * 代表团/承办单位参数：接口只接受显示名。
     */
    buildUnitParam(option, payload) {
      const extraParam = { delegation: '', cbdw: '' }
      if (option === ReportOption.reportDelegation && payload && payload.delegation) {
        extraParam.delegation = String(payload.delegation)
      } else if (option === ReportOption.reportUndertaker && payload && payload.cbdw) {
        extraParam.cbdw = String(payload.cbdw)
      }
      return extraParam
    },

    /* ==================== 输出列表 CSV ==================== */
    outputRepresentatives() {
      const selected = this.selectedRows
      if (!selected.length) {
        this.showAlert('请先勾选要输出的列表记录')
        return
      }
      DataExporter.exportExcel(
        selected,
        '列表信息',
        ['建议编号', '标题', '届次', '代表', '代表团', '承办单位信息'],
        r => [r.id, r.title, r.session, r.representative, r.delegation, r.cbxx],
        { widths: [90, 320, 90, 90, 90, 360], alignments: ['center', 'left', 'center', 'center', 'center', 'left'] }
      )
      this.addHistory('输出列表', `导出列表记录${selected.length}条`)
    },

    /* ==================== 任务队列 ==================== */
    closeTaskQueue() { this.taskQueueVisible = false },
    rwdlQuery() {
      this.refreshing = true
      this.taskQueueVisible = true
      return taskQuery(this.userId)
        .then(res => { this.taskQueueItems = res.data || [] })
        .catch(() => {})
        .finally(() => { this.refreshing = false })
    },
    onTaskViewDetail(payload) {
      this.generateReportFromTaskQueue = String(payload.type) === '1'
      this.taskQueueReportTree = this.generateReportFromTaskQueue && Array.isArray(payload.tree)
        ? TreeHelper.normalizeToTwoLevels(payload.tree)
        : []
      this.zyDetail(payload.id, payload.type, payload.words)
    },
    async zyDel(id) {
      const taskId = String(id)
      if (this.deletingTaskIds.includes(taskId)) return
      this.deletingTaskIds.push(taskId)
      try {
        const res = await deleteIds([id])
        if (res.code === apiCode.ok) {
          this.$message({ message: '删除成功', type: 'success', duration: 1500 })
          await this.rwdlQuery()
        } else {
          this.$message && this.$message({ message: res.message || '删除失败', type: 'error' })
        }
      } catch (_) {
        this.$message && this.$message({ message: '删除失败', type: 'error' })
      } finally {
        this.deletingTaskIds = this.deletingTaskIds.filter(item => item !== taskId)
      }
    },
    zyDetail(id, type, words) {
      const seq = ++this.detailRequestSeq
      this.detailLoading = true
      this.lastReportWords = ReportBuilder.normalizeWordArray(words)
      this.currentTaskId = String(id || '')
      if (String(type) === '2' || String(type) === '3') {
        this.zsbgEditMode = false
      }
      taskIdQuery(id)
        .then(res => {
          if (seq !== this.detailRequestSeq) return
          if (res.code !== apiCode.ok) {
            this.$message && this.$message({ message: res.message || '查询任务结果失败', type: 'error' })
            return
          }
          this.jljgzsData = res.data?.data || []
          this.taskQueueVisible = false
          if (String(type) === '1') {
            this.currentSummaryType = summaryType.digest
            this.handleZhaiyaoResult(res.data?.data)
          } else {
            this.currentSummaryType = summaryType.report
            this.renderZsbgTree(res.data?.data)
            this.$store.commit('adviceCluster/SET_VIEW_MODE', VIEW_MODE.summary)
          }
        })
        .catch(() => {
          if (seq === this.detailRequestSeq) {
            this.$message && this.$message({ message: '查询任务结果失败', type: 'error' })
          }
        })
        .finally(() => {
          if (seq === this.detailRequestSeq) this.detailLoading = false
        })
    },

    /* ==================== 处理汇总要点结果 ==================== */
    handleZhaiyaoResult(apiData) {
      const list = SummaryFormatter.normalizeZhaiyaoList(apiData || [])
      this.zhaiyaoData = list
      this.summaryContent = SummaryFormatter.formatZhaiyaoText(list)
      this.currentSummaryType = summaryType.digest
      this.$store.commit('adviceCluster/SET_VIEW_MODE', VIEW_MODE.summary)
      this.$store.commit('adviceCluster/CLEAR_CITATION')
      if (!list.length) this.showAlert('汇总要点无数据')
    },

    /* ==================== 分析报告 ==================== */
    async renderZsbgTree(payload, skipApiLoad = false) {
      const tree = TreeHelper.extractTreeFromPayload(payload)
      this.zsbgEditableTree = EditableReportStore.cloneTree(tree)
      let edits = {}
      if (!skipApiLoad && this.currentTaskId) {
        try {
          const res = await getNewResult(this.currentTaskId)
          if (res.code === apiCode.ok && res.data) edits = typeof res.data === 'object' ? res.data : {}
        } catch (_) {}
      }
      this.zsbgLocalEdits = edits
      EditableReportStore.applyEditsToTree(this.zsbgEditableTree, this.zsbgLocalEdits)
      this.renderFlattenedTree()
      this.$store.commit('adviceCluster/CLEAR_CITATION')
    },
    renderFlattenedTree() {
      this.zsbgRenderNodes = TreeHelper.flattenTree(this.zsbgEditableTree, {
        normalizeContent: ReportBuilder.normalizeContent,
        appendCountSuffix: ReportBuilder.appendCountSuffix,
        buildCountTableNode: (count, level) => ReportBuilder.buildCountTableNode(count, level),
        buildChartNode: (otherItem, level, name, idx) => ReportBuilder.buildChartNode(otherItem, level, name, idx),
        toContentHtml: text => ReportBuilder.toContentHtml(text, v => String(v || ''))
      })
    },
    toggleZsbgEditMode() { this.zsbgEditMode = !this.zsbgEditMode },
    handleZsbgFieldBlur(payload) {
      if (!payload) return
      const evt = payload.event
      const nd = payload.node
      if (!this.zsbgEditMode || !evt || !nd || !nd.editableMeta) return
      if (!EditableReportStore.canEditMeta(nd.editableMeta)) return
      const text = EditableReportStore.normalizeEditorText(evt.target && evt.target.innerText)
      const updated = EditableReportStore.updateTreeField(this.zsbgEditableTree, nd.editableMeta, text)
      if (!updated) return
      this.zsbgLocalEdits = EditableReportStore.setFieldValue(
        this.zsbgLocalEdits,
        nd.editableMeta.keyId,
        nd.editableMeta.field,
        text
      )
      this.renderFlattenedTree()
    },
    async saveLocalZsbgEdits() {
      if (!this.currentTaskId) {
        this.$message({ type: 'warning', message: '无任务 ID，无法保存' })
        return
      }
      try {
        const res = await updateResult({
          taskId: this.currentTaskId,
          userId: this.userId,
          resultData: { ...this.zsbgLocalEdits }
        })
        if (res.code === apiCode.ok) {
          this.zsbgEditMode = false
          this.$message({ type: 'success', message: '已保存到服务器，编辑模式已关闭' })
        } else {
          this.$message({ type: 'error', message: res.message || '保存失败' })
        }
      } catch (_) {
        this.$message({ type: 'error', message: '保存异常' })
      }
    },
    async resetLocalZsbgEdits() {
      try {
        await this.$confirm('确定要重置所有编辑吗？重置后将清空所有已保存的编辑内容，恢复为原始报告。', '确认重置', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch (_) {
        return
      }
      this.zsbgLocalEdits = {}
      this.zsbgEditMode = false
      if (this.currentTaskId) {
        try {
          await updateResult({ taskId: this.currentTaskId, userId: this.userId, resultData: {} })
        } catch (_) {}
      }
      await this.renderZsbgTree(this.jljgzsData, true)
      this.$message({ type: 'success', message: '已清空编辑并恢复当前报告' })
    },

    /* ==================== 导出汇总要点 ==================== */
    exportSummary() {
      DataExporter.exportSummaryDoc({
        rootEl: this.$el,
        zhaiyaoData: this.zhaiyaoData,
        summaryContent: this.summaryContent,
        title: '',
        isDuplicateBigtitle: SummaryFormatter.isDuplicateBigtitle,
        convertToChineseNumeral: SummaryFormatter.convertToChineseNumeral,
        formatSummaryCountText: SummaryFormatter.formatCountText,
        formatSummaryParagraph: (arr, sections, i) =>
          SummaryFormatter.formatParagraph(arr, SummaryFormatter.parseExactWordList(''), sections, i),
        addHistory: (t, c) => this.addHistory(t, c),
        showAlert: this.showAlert
      })
    },

    /* ==================== 导出分析报告 ==================== */
    async exportOverview() {
      await DataExporter.exportOverviewReport({
        renderNodes: this.zsbgRenderNodes,
        captureChartImage: async idx => {
          const wrap = this.$el && this.$el.querySelector(`.zsbg-chart-block[data-export-chart-index="${idx}"]`)
          if (!wrap) return null
          await this.$nextTick()
          await new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)))
          const chartDom = wrap.querySelector('.chart-canvas') || wrap.querySelector('[ref="chartRef"]')
          if (!chartDom) return null
          let instance = echarts.getInstanceByDom(chartDom)
          if (!instance) {
            const anyCanvas = chartDom.querySelector('canvas') || wrap.querySelector('canvas')
            if (anyCanvas && anyCanvas.parentElement) instance = echarts.getInstanceByDom(anyCanvas.parentElement)
          }
          if (instance) {
            instance.dispatchAction({ type: 'downplay' })
            instance.dispatchAction({ type: 'hideTip' })
            await new Promise(resolve => window.setTimeout(resolve, 16))
            instance.resize()
            const base64 = instance.getDataURL({ type: 'png', pixelRatio: 3, backgroundColor: '#fff', excludeComponents: ['toolbox'] })
            if (base64 && base64.length > 50) {
              const rawWidth = instance.getWidth() || chartDom.offsetWidth || 600
              const rawHeight = instance.getHeight() || chartDom.offsetHeight || 320
              const enhanced = await this.enhanceChartImage(base64)
              if (enhanced) {
                return { imageDataUrl: enhanced.dataUrl || enhanced, width: enhanced.width || rawWidth, height: enhanced.height || rawHeight }
              }
              return { imageDataUrl: base64, width: rawWidth, height: rawHeight }
            }
          }
          const canvas = wrap.querySelector('canvas')
          if (canvas && canvas.toDataURL) {
            const url = canvas.toDataURL('image/png')
            if (url && url.length > 50) {
              const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: 0, height: 0 }
              return {
                imageDataUrl: url,
                width: Math.round(rect.width) || canvas.width || 600,
                height: Math.round(rect.height) || canvas.height || 320
              }
            }
          }
          return null
        },
        addHistory: (t, c) => this.addHistory(t, c),
        showAlert: this.showAlert
      })
    },
    enhanceChartImage(base64) {
      if (!base64) return Promise.resolve(null)
      return new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
          try {
            const borderPx = 2
            const padding = 8
            const cvs = document.createElement('canvas')
            cvs.width = img.width + 2 * (borderPx + padding)
            cvs.height = img.height + 2 * (borderPx + padding)
            const ctx = cvs.getContext('2d')
            if (!ctx) {
              resolve(null)
              return
            }
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, cvs.width, cvs.height)
            ctx.strokeStyle = '#999'
            ctx.lineWidth = borderPx
            ctx.strokeRect(borderPx / 2, borderPx / 2, cvs.width - borderPx, cvs.height - borderPx)
            ctx.drawImage(img, borderPx + padding, borderPx + padding, img.width, img.height)
            resolve({ dataUrl: cvs.toDataURL('image/png'), width: cvs.width, height: cvs.height })
          } catch (_) {
            resolve(null)
          }
        }
        img.onerror = () => resolve(null)
        img.src = base64
      })
    },

    /* ==================== 标签树弹窗 ==================== */
    closeBqTreeModal() { this.bqTreeVisible = false },

    /* ==================== 开发调试 ==================== */
    showLocalReport(data) {
      this.jljgzsData = Array.isArray(data) ? data : []
      this.currentTaskId = ''
      this.currentSummaryType = summaryType.report
      this.$store.commit('adviceCluster/SET_VIEW_MODE', VIEW_MODE.summary)
      this.renderZsbgTree(this.jljgzsData, true)
    }
  }
}
</script>

<style scoped>
.important-file-right-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
}
.important-file-right-title {
  flex-shrink: 0;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.important-file-right-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  border: 1px solid #e8e8e8;
  background: #fff;
  font-size: 14px;
  line-height: 1.8;
}
:deep(.detail-exact-word) { color: red; font-weight: 600; }
:deep(.summary-rep-meta) { color: #c9190b; }
:deep(.summary-rep-distinguish) { color: green; }
:deep(.summary-exact-word) { color: red; font-weight: 500; }
:deep(.summary-yuanwen-word) { color: blue; font-weight: 400; font-size: 16px; scale: 0.8; }

.preview-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 1999;
}
.preview-mask.show {
  opacity: 1;
  visibility: visible;
}
.preview-modal {
  position: fixed;
  left: 50%;
  top: 50%;
  width: min(1100px, 82vw);
  height: min(820px, 82vh);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%) scale(0.96);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 2000;
  overflow: hidden;
}
.preview-modal.show {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -50%) scale(1);
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 20px;
  border-bottom: 1px solid #e8eaef;
  background: #f7f9fc;
}
.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.preview-header-actions {
  display: flex;
  align-items: center;
}
.preview-header-actions > * {
  margin-left: 10px;
}
.preview-header-actions > *:first-child {
  margin-left: 0;
}
.preview-download {
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #606266;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}
.preview-download:hover {
  color: #409eff;
  border-color: #a0cfff;
}
.preview-close {
  font-size: 28px;
  color: #909399;
  cursor: pointer;
  line-height: 1;
}
.preview-body {
  width: 100%;
  height: calc(100% - 52px);
  background: #fff;
}
.preview-body >>> table,
.preview-body >>> td,
.preview-body >>> th {
  border: 1px solid #ccc !important;
  border-collapse: collapse !important;
  padding: 6px 10px;
}

.result-header .btn {
  margin-left: 8px;
}
</style>
