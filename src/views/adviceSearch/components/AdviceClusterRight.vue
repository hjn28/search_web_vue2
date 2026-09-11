<template>
  <div class="right-container" ref="rightContainer">
    <!-- ---- 任务队列弹窗 ---- -->
    <TaskQueueModal
      :visible="taskQueueVisible"
      :items="taskQueueItems"
      :refreshing="refreshing"
      @close="closeTaskQueue"
      @refresh="rwdlQuery"
      @delete-task="zyDel"
      @view-detail="onTaskViewDetail"
    />

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
            <!-- PDF 预览 -->
            <!-- <vue-office-pdf v-if="previewVisible && previewType === 'pdf'" :src="pdfSrc" style="height: 100%;overflow-y:auto;" /> -->
            <div v-if="previewVisible && previewType === 'pdf'" style="height: 100%;overflow-y:auto;text-align:center;">
              <img src="@/assets/img/流程图.png"/>
            </div>
            <!-- DOCX 预览 -->
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

    <!-- ---- 分析报告配置弹窗 ---- -->
    <div class="report-config-mask" :class="{ show: reportConfigVisible }" @click="cancelReportConfig"></div>
    <div class="report-config-modal report-config-modal-tree" :class="{ show: reportConfigVisible }">
      <div class="report-config-header">
        <div class="report-config-title">
          分析报告模板
          <el-radio class="report-type-radio" v-model="radio_zy" label="zhaibao">摘报</el-radio>
          <el-radio class="report-type-radio" v-model="radio_zy" label="minzheng">分析报告</el-radio>
          <!-- 代表团与承办单位参数区：仅分析报告（minzheng）模式下可见，摘报（zhaibao）隐藏；
               用 visibility 占位隐藏而非移除，保证两种模式下弹窗高度一致 -->
          <!-- 注意：main.js 只注册了 radio，未注册 RadioGroup，因此使用与 radio_zy 一致的独立 el-radio v-model 写法 -->
          <span class="unit-type-divider" :class="{ 'is-hidden': radio_zy !== 'minzheng' }"></span>
          <div class="unit-type-group" :class="{ 'is-hidden': radio_zy !== 'minzheng' }">
              <span class="unit-type-label">模板选择：</span>
              <el-radio v-model="reportUnitType" label="delegation">代表团</el-radio>
              <el-radio v-model="reportUnitType" label="cbdw">承办单位</el-radio>
              <el-select
                v-if="reportUnitType === 'delegation'"
                v-model="selectedDelegationForReport"
                placeholder="请选择代表团"
                size="small"
                class="unit-select"
                clearable
              >
                <el-option
                  v-for="d in delegationList"
                  :key="d.value != null ? d.value : d"
                  :label="d.label != null ? d.label : d"
                  :value="d.value != null ? d.value : d"
                ></el-option>
              </el-select>
              <el-select
                v-else
                v-model="selectedCbdwForReport"
                placeholder="请选择承办单位"
                size="small"
                class="unit-select"
                clearable
                filterable
              >
                <el-option
                  v-for="d in cbdwList"
                  :key="d.sysDeptId != null ? d.sysDeptId : (d.deptName != null ? d.deptName : d)"
                  :label="d.deptName != null ? d.deptName : d"
                  :value="d.deptName != null ? d.deptName : d"
                ></el-option>
              </el-select>
          </div>
        </div>
        <span class="report-config-close" @click="cancelReportConfig">×</span>
      </div>
      <div class="report-config-body report-config-body-tree">
        <sczdymb
          :key="reportConfigRenderKey"
          :initial-tree="reportConfigTree"
          :max-depth="2"
          mode="report"
          @save-template="handleReportConfigSave"
          @close-template="cancelReportConfig"
        />
      </div>
    </div>

    <!-- ---- 生成报告弹窗（三栏：文件上传/目录编辑 + 目录结构 + 新的内容） ---- -->
    <GenerateReportModal
      :visible="generateReportVisible"
      :initial-tree="generateReportTree"
      :initial-file-name="generateReportFileName"
      :initial-report-options="generateReportOptions"
      :show-summary-options="generateReportShowSummaryOptions"
      @close="generateReportVisible = false"
      @save="handleReportTemplateSave"
      @generate="handleGenerateReport"
    />

    <!-- ---- 主面板 ---- -->
    <div class="panel result-panel">
      <!-- 已去掉"聚类结果展示"标题栏，保留下方操作栏与内容区域 -->

      <div class="result-header">
        <button class="btn btn-outline btn-sm" @click="previewFlowChart">流程图预览</button>
        <button class="btn btn-outline btn-sm" @click="previewManual">使用手册预览</button>
      </div>
      <!-- ---- 操作栏 ---- -->
      <div class="action-bar">
        <div v-if="viewMode === 'table'" class="action-row">
          <button class="btn btn-outline btn-sm" :disabled="!tableData.length" @click="toggleSelectAll">{{ isAllChecked ? '取消全选' : '全选' }}</button>
          <button class="btn btn-outline btn-sm" :disabled="!selectedIds.length" @click="openGenerateReportModal">生成报告</button>
          <!-- 字体设置为楷体 -->
          <div style="font-family: 'KaiTi', 'STKaiti', '楷体', serif !important;font-size: 12px;">
            <div style="color: red; float:left; height:28px;font-family: inherit;">#</div>
            <div style="height:16px;line-height: 16px; float:left; margin-left: 5px;font-family: inherit;">
              <span style="font-family: inherit;">按分类汇总原文内容</span><br />
              <span style="font-family: inherit;">按模板生成分析报告</span>
            </div>
          </div>
          <!-- <button class="btn btn-outline btn-sm" :disabled="!selectedIds.length" @click="generateSummary">分类要点内容汇总</button>
          <button class="btn btn-outline btn-sm" :disabled="!selectedIds.length" @click="generateReportAll">生成分析报告</button> -->
          <button class="btn btn-outline btn-sm" :disabled="!selectedIds.length" @click="outputRepresentatives">输出列表</button>
          <button class="btn btn-outline btn-sm" @click="rwdlQuery">任务队列</button>
          <button class="btn btn-outline btn-sm" @click="resetTableSelection">重置</button>
          <!-- <button class="btn btn-outline btn-sm">打入标签</button> -->
        </div>
        <div v-else-if="viewMode === 'summary'" class="detail-header-actions">
          <button class="btn btn-outline btn-sm" @click="backToTable">返回列表</button>
          <button class="btn btn-outline btn-sm" @click="rwdlQuery">任务队列</button>
          <template v-if="currentSummaryType === '1'">
            <button class="btn btn-outline btn-sm" @click="exportSummary">导出汇总要点</button>
            <button class="btn btn-outline btn-sm" @click="openGenerateReportModal({ hideSummaryOptions: true, fromTaskQueue: generateReportFromTaskQueue })">生成报告</button>
          </template>
          <template v-else>
            <button class="btn btn-outline btn-sm" @click="exportOverview">导出分析报告</button>
            <button class="btn btn-outline btn-sm" @click="toggleZsbgEditMode">{{ zsbgEditMode ? '关闭编辑' : '开始编辑' }}</button>
            <button class="btn btn-outline btn-sm" @click="saveLocalZsbgEdits">保存编辑</button>
            <button class="btn btn-outline btn-sm" @click="resetLocalZsbgEdits">重置编辑</button>
          </template>
        </div>
        <div v-else class="detail-header-actions">
          <button class="btn btn-outline btn-sm" @click="backToTable">返回列表</button>
        </div>
      </div>

      <!-- ---- 可滚动内容区域 ---- -->
      <div class="result-content" ref="resultContent">
        <ClusterResultTable v-if="viewMode === 'table'"
          :table-data="tableData"
          :pagination="pagination"
          :selected-ids="selectedIds"
          :tagging-map="taggingMap"
          :has-searched="hasSearched"
          @update:selected-ids="$emit('update:selected-ids', $event)"
          @update:pagination="$emit('update:pagination', $event)"
          @view-detail="onViewDetail"
        />
        <template v-else-if="viewMode === 'summary'">
          <OverviewReportView v-if="currentSummaryType === '2'"
            :zsbg-render-nodes="zsbgRenderNodes"
            :active-key-id="activeKeyId"
            :zsbg-edit-mode="zsbgEditMode"
            :jljgzs-data="jljgzsData"
            @citation-click="onOverviewCitationClick"
            @field-blur="handleZsbgFieldBlur"
          />
          <SummaryReportView v-else :zhaiyao-data="zhaiyaoData" />
        </template>
        <ExpandResultsView v-else-if="viewMode === 'expand'"
          :expand-results="expandResults"
          :expand-selection="expandSelection"
          @expand-item-check="$emit('expand-item-check', $event)"
          @expand-keyword-click="onExpandKeywordClick"
          @expand-segment-change="$emit('expand-segment-change', $event)"
        />
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
 */
// 引入组件
import VueOfficeDocx from '@vue-office/docx'
import { saveAs } from 'file-saver'
// 引入相关样式
// import '@vue-office/pdf/lib/index.css'
import '@vue-office/docx/lib/index.css'
// import { renderAsync } from 'docx-preview'
import { searchZFZhaiyao, taskQuery, taskIdQuery, deletIds, updateResult, getNewResult } from '../../../api/zytask'
import Sczdymb from './sczdymb.vue'
import TemplateModalBus from '../../../utils/classes/TemplateModalBus'
import ClusterResultTable from './ClusterResultTable.vue'
import ExpandResultsView from './ExpandResultsView.vue'
import SummaryReportView from './SummaryReportView.vue'
import OverviewReportView from './OverviewReportView.vue'
import DetailView from './DetailView.vue'
import TaskQueueModal from './TaskQueueModal.vue'
import GenerateReportModal from './GenerateReportModal.vue'
import SummaryFormatter from '../../../utils/classes/SummaryFormatter'
import DataExporter from '../../../utils/classes/DataExporter'
import * as echarts from 'echarts'
import ReportBuilder from '../../../utils/classes/ReportBuilder'
import TreeHelper from '../../../utils/classes/TreeHelper'
import EditableReportStore from '../utils/EditableReportStore'
import DebounceHelper from '../../../utils/classes/DebounceHelper'
import { mapState } from 'vuex'

export default {
  name: 'AdviceClusterRight',
  components: {
    Sczdymb,
    ClusterResultTable,
    ExpandResultsView,
    SummaryReportView,
    OverviewReportView,
    DetailView,
    TaskQueueModal,
    GenerateReportModal,
    VueOfficeDocx
  },
  props: {
    tableData: { type: Array, default: () => [] },
    pagination: { type: Object, default: () => ({ page: 1, page_size: 10, total: 0 }) },
    viewMode: { type: String, default: 'table' },
    detail: { type: Object, default: () => ({ visible: false, html: '', matchType: '' }) },
    leftKeywords: { type: Array, default: () => [] },
    zhaiyaoData: { type: Array, default: () => [] },
    summaryContent: { type: String, default: '' },
    selectedIds: { type: Array, default: () => [] },
    taggingMap: { type: Object, default: () => ({}) },
    zhaiyaoTitle: { type: String, default: '' },
    taskQueueItems: { type: Array, default: () => [] },
    activeKeyId: { type: String, default: '' },
    /* ---- 拓展结果 ---- */
    expandResults: { type: Array, default: () => [] },
    expandSelection: {
      type: Object,
      default: () => ({ selectedPrimary: [], selectedKeywords: [], selectedSegmentContents: [], highlightedPrimary: [] })
    }
  },
  emits: [
    'update:selected-ids', 'update:view-mode', 'update:detail', 'update:zhaiyao-data',
    'update:summary-content', 'update:tagging-map', 'update:table-data',
    'update:pagination', 'update:task-queue-items', 'add-history',
    'expand-item-check', 'expand-keyword-click', 'expand-segment-change',
    'citation-click',
    'summary-changed'
  ],
  data() {
    return {
      showBackTop: false,
      userId: '',
      hasSearched: false,

      /* ---- 汇总要点 ---- */
      currentSummaryType: '1',

      /* ---- 分析报告 ---- */
      templateLeafWords: [],
      zsbgRenderNodes: [],
      reportConfigVisible: false,
      reportWordInputs: [],
      lastReportWords: [],
      reportConfigTree: [],
      reportConfigRenderKey: 0,
      detailRequestSeq: 0,
      radio_zy: 'minzheng',
      sczsType: 'single',
      jljgzsData: [],
      zsbgEditableTree: [],
      zsbgEditMode: false,
      currentTaskId: '',
      zsbgLocalEdits: {},

      /* ---- 任务队列 ---- */
      taskQueueVisible: false,
      refreshing: false,

      /* ---- 当前页面内预览 ---- */
      previewVisible: false,
      previewType: 'pdf',
      previewTitle: '',
      previewUrl: '',
      docxSrc: 'static/综合分析功能说明手册.docx',
      // pdfSrc: 'static/综合分析流程图.pdf',
      pdfSrc: '@/assets/img/流程图.png',

      /* ---- 标签树弹窗 ---- */
      bqTreeVisible: false,
      bqCurrentItem: null,
      bqTreeData: [],
      bqSelection: { rootId: '', childId: '', leafId: '' },

      /* ---- 生成报告弹窗（GenerateReportModal） ---- */
      generateReportVisible: false,
      generateReportTree: [],
      generateReportFileName: '',
      generateReportOptions: {},
      generateReportShowSummaryOptions: true,
      generateReportFromTaskQueue: false,
      taskQueueReportTree: [],

      /* ---- 汇总要点生成模板流程 ---- */
      generateAfterTemplateSave: false,

      /* ---- 分析报告参数确认（代表团/承办单位二选一） ---- */
      reportUnitType: 'delegation',
      selectedDelegationForReport: '',
      selectedCbdwForReport: '',
      module: ''
    }
  },
  computed: {
    // 代表团/承办单位全量与当前选中值统一从 dict store 读取（接口由 store action 拉取）
    ...mapState('dict', {
      cbdwList: 'allCbdw',
      delegationList: 'allDelegations',
      delegationValue: 'delegationValue',
      cbdwValue: 'cbdwValue'
    }),
    ...mapState('taskAiParams', {
      taskAiParams: state => ({
        data_base: state.data_base,
        theme: state.theme,
        term_theme: state.term_theme
      })
    }),
    SummaryFormatter() { return SummaryFormatter },
    currentBqChildren() {
      const root = (this.bqTreeData || []).find(item => item.id === this.bqSelection.rootId)
      return Array.isArray(root && root.children) ? root.children : []
    },
    currentBqLeaves() {
      const child = this.currentBqChildren.find(item => item.id === this.bqSelection.childId)
      return Array.isArray(child && child.children) ? child.children : []
    },
    isAllChecked() {
      const items = Array.isArray(this.tableData) ? this.tableData : []
      const enabled = items.filter(item => !item.disabled).map(item => item.id).filter(Boolean)
      return enabled.length > 0 && enabled.every(id => this.selectedIds.includes(id))
    },
    resultTitle() {
      if (this.viewMode === 'summary') return this.currentSummaryType === '2' ? '分析报告结果展示' : '汇总要点结果展示'
      if (this.viewMode === 'expand') return '拓展结果'
      return '聚类结果展示'
    }
  },
  watch: {
    // 切换代表团/承办单位单选时，清空另一侧的选中值，避免执行时两个参数都带值
    reportUnitType(val) {
      if (val === 'delegation') {
        this.selectedCbdwForReport = ''
      } else {
        this.selectedDelegationForReport = ''
      }
    }
  },
  created() {
    this.generateSummary = DebounceHelper.debounce(this.generateSummary, 1000, this)
    this.generateReportAll = DebounceHelper.debounce(this.generateReportAll, 1000, this)
    this.zyDel = DebounceHelper.debounceImmediate(this.zyDel, 500, this)
  },
  mounted() {
    const el = this.$refs.resultContent
    if (el) {
      el.addEventListener('scroll', this.handleRightScroll)
      this.handleRightScroll()
    }
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'))
      this.userId = userInfo?.userId || '1234'
    } catch (e) { this.userId = '1234' }
  },
  beforeDestroy() {
    const el = this.$refs.resultContent
    if (el) el.removeEventListener('scroll', this.handleRightScroll)
  },
  methods: {
    showAlert(msg) { this.$alert(msg, '提示', { confirmButtonText: '确定' }) },
    addHistory(action, content) { this.$emit('add-history', action, content) },

    /* ==================== 事件桥接（子组件 → 父组件） ==================== */
    onExpandKeywordClick(kw, item, index, ki) {
      this.$emit('expand-keyword-click', kw, item, index, ki)
    },
    previewFlowChart() {
      // const flowChartUrl = '/static/综合分析流程图.pdf'
      // if (!this.flowChartUrl) {
      //   this.showAlert('流程图文件不存在')
      //   return
      // }
      this.previewType = 'pdf'
      this.previewTitle = '综合分析流程图'
      // this.previewUrl = this.flowChartUrl
      this.previewVisible = true
    },
    async previewManual() {
      // const manualUrl = '/static/综合分析功能说明手册.docx'
      // if (!this.manualUrl) {
      //   this.showAlert('使用手册文件不存在')
      //   return
      // }
      this.previewType = 'docx'
      this.previewTitle = '综合分析功能说明手册'
      this.previewVisible = true
      // try {
      //   // 1. 从 public 获取文件（注意路径以 / 开头）
      //   const response = await fetch(this.manualUrl);
      //   const arrayBuffer = await response.arrayBuffer();

      //   // 2. 渲染
      //   const container = this.$refs.docxContainer;
      //   await renderAsync(arrayBuffer, container, null, {
      //     experimental: true,
      //   });
      // } catch (error) {
      //   console.error('加载本地文档失败:', error);
      // }
      // const absoluteUrl = new URL(this.manualUrl, window.location.origin).href
      // this.previewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`
    },
    closePreview() {
      this.previewVisible = false
      this.previewType = 'pdf'
      this.previewTitle = ''
      this.previewUrl = ''
    },
    async downloadCurrentDocx() {
      const src = this.docxSrc || this.previewUrl || ''
      if (!src) {
        this.showAlert('没有可下载的文档')
        return
      }
      const fileName = (this.previewTitle || 'document') + '.docx'
      try {
        const response = await fetch(src)
        if (!response.ok) throw new Error('fetch failed')
        const blob = await response.blob()
        saveAs(blob, fileName)
      } catch (error) {
        console.warn('[downloadCurrentDocx] Blob 下载失败，回退到链接下载', error)
        const link = document.createElement('a')
        link.href = src
        link.download = fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        link.remove()
      }
    },
    closeBqTreeModal() {
      this.bqTreeVisible = false
      // this.bqCurrentItem = null
      // this.bqSelection = { rootId: '', childId: '', leafId: '' }
    },

    /* ==================== 滚动 ==================== */
    scrollRightToTop() { const el = this.$refs.resultContent; el && el.scrollTo({ top: 0, behavior: 'smooth' }) },
    handleRightScroll() {
      const el = this.$refs.resultContent
      if (!el) return
      this.showBackTop = el.scrollTop > 0
    },

    /* ==================== 行选择（全选/重置） ==================== */
    selectAllRows() { this.$emit('update:selected-ids', this.tableData.filter(item => !item.disabled).map(item => item.id).filter(Boolean)) },
    cancelSelectRows() { this.$emit('update:selected-ids', []) },
    toggleSelectAll() { this.isAllChecked ? this.cancelSelectRows() : this.selectAllRows() },
    resetTableSelection() { this.$emit('update:selected-ids', []); this.backToTable() },

    /* ==================== 查看详情 ==================== */
    onViewDetail(proposal) {
      if (!proposal) return
      const rawContent = typeof proposal.content === 'string' ? proposal.content
        : (proposal.content && typeof proposal.content === 'string' ? proposal.content : '')
      const exactWords = SummaryFormatter.parseExactWordList('')
      const highlighted = SummaryFormatter.highlightWords(rawContent, exactWords)
      const html = rawContent ? highlighted.replace(/\n/g, '<br/>') : '暂无正文内容'
      this.$emit('update:detail', { visible: true, html, matchType: proposal.matchType || '正文' })
      this.$emit('update:view-mode', 'detail')
      this.addHistory('查看详情', proposal.id ? `查看了议案【${proposal.id}】的内容` : '查看了一条议案内容')
    },
    backToTable() {
      this.generateReportFromTaskQueue = false
      this.taskQueueReportTree = []
      this.$emit('update:view-mode', 'table')
      this.$emit('update:detail', { visible: false, html: '', matchType: '' })
    },

    /* ==================== 汇总要点视图切换 ==================== */
    switchToSummary() {
      this.currentSummaryType = '1'
      this.$emit('update:view-mode', 'summary')
      // 分析报告视图切到汇总要点视图（viewMode 可能不变），通知父组件关闭引文详情
      this.$emit('summary-changed')
    },

    /* ==================== 生成报告（打开三栏弹窗） ==================== */
    openGenerateReportModal(options = {}) {
      const fromTaskQueue = Boolean(options.fromTaskQueue)
      this.generateReportShowSummaryOptions = !options.hideSummaryOptions
      if (fromTaskQueue && this.taskQueueReportTree.length) {
        this.generateReportTree = this.taskQueueReportTree
        this.generateReportFileName = ''
      } else {
        // 普通入口优先使用左侧上传模板目录；没有时回退到共享模板。
        const wordTemplate = this.$store?.state?.wordTemplate
        const savedTemplate = this.$store?.state?.template
        if (wordTemplate?.hasData && Array.isArray(wordTemplate?.tree) && wordTemplate.tree.length) {
          this.generateReportTree = wordTemplate.tree
          this.generateReportFileName = wordTemplate.wordFileName || ''
        } else if (savedTemplate?.hasData && Array.isArray(savedTemplate?.tree) && savedTemplate.tree.length) {
          this.generateReportTree = savedTemplate.tree
          this.generateReportFileName = ''
        } else {
          const classificationWords = Array.isArray(this.leftKeywords) ? this.leftKeywords : []
          this.generateReportTree = TreeHelper.buildTreeFromWords(classificationWords)
          this.generateReportFileName = ''
        }
      }
      this.generateReportVisible = true
    },

    /* ==================== 保存生成报告模板 ==================== */
    handleReportTemplateSave(payload) {
      const tree = Array.isArray(payload && payload.tree) ? payload.tree : []
      this.generateReportTree = tree
      this.generateReportFileName = payload && payload.wordFileName ? payload.wordFileName : ''
      this.generateReportOptions = {
        selectedOption: payload.selectedOption || '',
        delegation: payload.delegation || '',
        cbdw: payload.cbdw || ''
      }
      this.$store.dispatch('wordTemplate/saveTemplate', {
        tree,
        words: TreeHelper.collectNodeNames(tree),
        wordFileName: this.generateReportFileName
      })
      this.showAlert('目录结构和右侧选项已保存')
    },

    /* ==================== 生成报告弹窗提交（GenerateReportModal @generate） ==================== */
    handleGenerateReport(payload) {
      const tree = Array.isArray(payload && payload.tree) ? payload.tree : []
      const option = payload && payload.selectedOption ? String(payload.selectedOption) : ''
      const supportedOptions = [
        'summary-current',
        'summary-plan',
        'summary-representative',
        'report-default',
        'report-digest',
        'report-delegation',
        'report-undertaker'
      ]
      if (supportedOptions.indexOf(option) === -1) { this.showAlert('请选择有效的生成方式'); return }
      if (this.generateReportFromTaskQueue) {
        this.generateReportVisible = false
        this.submitTaskReportGenerate(option, payload, tree)
        return
      }
      // 汇总/报告均基于已勾选的记录生成（与原"生成分析报告"按钮要求一致）
      const selected = this.tableData.filter(item => item.id && this.selectedIds.includes(item.id))
      if (!selected.length) { this.showAlert('请先勾选要生成汇总/报告的记录'); return }
      // 生成的目录树写入共享模板 store，供汇总要点/分析报告后续复用（与原有生成流程一致）
      if (tree.length) {
        this.$store.dispatch('wordTemplate/saveTemplate', { tree, words: TreeHelper.collectNodeNames(tree) })
      }
      // 提交后关闭弹窗（与原有分析报告/汇总要点流程一致，目录树已入共享 store，重开可回显）
      this.generateReportVisible = false
      if (option.indexOf('summary-') === 0) {
        this.submitSummaryGenerate(option, tree, selected)
      } else {
        this.submitReportGenerate(option, payload, tree, selected)
      }
    },
    /* 分类要点汇总（type '1'）：与原有生成汇总要点接口一致，三个选项以 aiObj.module 区分 */
    submitSummaryGenerate(option, tree, selected) {
      const moduleMap = {
        'summary-current': '',
        'summary-plan': 'shiwuwu',
        'summary-representative': 'representative'
      }
      // 与原有生成汇总要点一致：叶子词去重
      const word = Array.from(new Set(this.extractLeafWords(tree)))
      const qdNeedObj = tree.length ? { words: word, tree, module: moduleMap[option] } : { words: word, module: moduleMap[option] }
      this.addHistory('分类要点汇总', '使用模板目录结构提交分类要点汇总生成')
      taskQuery(this.userId).then(res => {
        if ((res.data || []).some(item => item.status === '0')) { this.showAlert('当前已存在正在执行的任务，请点击任务队列进行查看'); return }
        searchZFZhaiyao({ userId: this.userId, aiObj: { word, obj: selected, module: moduleMap[option] || '', ...this.taskAiParams }, type: '1', qdNeedObj })
          .then(r => { if (r.code === 0) this.$alert(r.data); else if (r.code === 999) this.showAlert(r.message); else this.showAlert(r.data) })
          .catch(err => { console.error('[submitSummaryGenerate] 分类要点汇总接口异常：', err); this.showAlert('分类要点汇总生成失败') })
      }).catch(err => { console.error('[submitSummaryGenerate] 任务查询接口异常：', err) })
    },
    /* 分析报告（type '3'）：与生成分析报告模板一致的参数——默认模板输出=正常生成分析报告（type minzheng、不带单位参数），
       摘报=原摘报参数（type zhaibao），代表团/承办单位=分析报告下增加对应单位参数，调用模板生成原接口 */
    submitReportGenerate(option, payload, tree, selected) {
      const words = TreeHelper.collectNodeNames(tree)
      const qdNeedObj = tree.length ? { words, tree } : { words }
      // 代表团与承办单位参数：接口参数使用显示名（label），未选中的为默认空值
      const extraParam = { delegation: '', cbdw: '' }
      if (option === 'report-delegation' && payload && payload.delegation) {
        extraParam.delegation = this.resolveDelegationLabel(payload.delegation)
      } else if (option === 'report-undertaker' && payload && payload.cbdw) {
        extraParam.cbdw = this.resolveCbdwLabel(payload.cbdw)
      }
      const presetSubtopics = ReportBuilder.buildPresetSubtopics(TreeHelper.treeToInputs(tree))
      const reportType = option === 'report-digest' ? 'zhaibao' : 'minzheng'
      const reportLabels = { 'report-default': '默认', 'report-digest': '摘报', 'report-delegation': '代表团', 'report-undertaker': '承办单位' }
      this.addHistory('生成分析报告', `按${reportLabels[option] || ''}模板生成分析报告`)
      taskQuery(this.userId).then(res => {
        if ((res.data || []).some(item => item.status === '0')) { this.showAlert('当前已存在正在执行的任务，请点击任务队列进行查看'); return }
        searchZFZhaiyao({ userId: this.userId, aiObj: { obj: selected, preset_subtopics: presetSubtopics, type: reportType, ...extraParam, ...this.taskAiParams }, type: '3', qdNeedObj })
          .then(r => { if (r.code === 0) this.$alert(r.data); else this.showAlert(r.data) })
          .catch(err => { console.error('[submitReportGenerate] 分析报告生成接口异常：', err); this.showAlert('分析报告生成失败') })
      }).catch(err => { console.error('[submitReportGenerate] 任务查询异常：', err) })
    },
    submitTaskReportGenerate(option, payload, tree) {
      const qdNeedObj = tree.length
        ? { words: TreeHelper.collectNodeNames(tree), tree }
        : { words: this.lastReportWords }
      const extraParam = { delegation: '', cbdw: '' }
      if (option === 'report-delegation' && payload && payload.delegation) {
        extraParam.delegation = this.resolveDelegationLabel(payload.delegation)
      } else if (option === 'report-undertaker' && payload && payload.cbdw) {
        extraParam.cbdw = this.resolveCbdwLabel(payload.cbdw)
      }
      const presetSubtopics = ReportBuilder.buildPresetSubtopics(TreeHelper.treeToInputs(tree))
      const reportType = option === 'report-digest' ? 'zhaibao' : 'minzheng'
      taskQuery(this.userId).then(res => {
        if ((res.data || []).some(item => item.status === '0')) { this.showAlert('当前已存在正在执行的任务，请点击任务队列进行查看'); return }
        searchZFZhaiyao({ userId: this.userId, aiObj: { data: this.jljgzsData, preset_subtopics: presetSubtopics, type: reportType, ...extraParam, ...this.taskAiParams }, type: '2', qdNeedObj })
          .then(r => { if (r.code === 0) this.$alert(r.data); else this.showAlert(r.data) })
          .catch(err => { console.error('[submitTaskReportGenerate] 任务汇总要点生成接口异常：', err); this.showAlert('分析报告生成失败') })
      }).catch(err => { console.error('[submitTaskReportGenerate] 任务查询异常：', err) })
    },

    /* ==================== 生成汇总要点 ==================== */
    generateSummary() {
      // if (!this.selectedIds.length) { this.showAlert('请先勾选要生成汇总要点的记录'); return }
      // 汇总要点借用规则：模糊词有模板时优先借用其目录树；否则用汇总要点自身保存的共享模板；最后回退到关键词
      const wordTemplate = this.$store?.state?.wordTemplate
      const savedTemplate = this.$store?.state?.template
      var initialTree
      if (wordTemplate?.hasData && Array.isArray(wordTemplate?.tree) && wordTemplate.tree.length) {
        initialTree = wordTemplate.tree
      } else if (savedTemplate?.hasData && Array.isArray(savedTemplate?.tree) && savedTemplate.tree.length) {
        initialTree = savedTemplate.tree
      } else {
        var keywords = Array.isArray(this.leftKeywords) && this.leftKeywords.length
          ? this.leftKeywords : SummaryFormatter.parseExactWordList('')
        initialTree = keywords.length
          ? TreeHelper.buildTreeFromWords(keywords) : TreeHelper.buildTreeFromWords(SummaryFormatter.parseExactWordList(''))
      }
      this.generateAfterTemplateSave = true

      TemplateModalBus.$emit('open-template-modal', {
        type: 'summary',
        initialTree: initialTree,
        initialFileName: '',
        onSave: (payload) => { this.handleTemplateSave(payload) },
        onClose: () => { this.generateAfterTemplateSave = false }
      })
    },
    doGenerateSummary() {
      var selected = this.tableData.filter(item => item.id && this.selectedIds.includes(item.id))
      var word = this.templateLeafWords.length
        ? Array.from(new Set(this.templateLeafWords)) : SummaryFormatter.parseExactWordList('')
      var params = { word, obj: selected, module: '', ...this.taskAiParams }
      // words 保持扁平数组，树形结构单独传 tree 字段
      const savedTemplate = this.$store?.state?.template
      const qdNeedObj = savedTemplate?.hasData && Array.isArray(savedTemplate?.tree) && savedTemplate.tree.length
        ? { words: word, tree: savedTemplate.tree }
        : { words: word }
      taskQuery(this.userId).then(res => {
        var running = (res.data || []).some(item => item.status === '0')
        if (running) { this.showAlert('当前已存在正在执行的任务，请点击任务队列进行查看'); return }
        searchZFZhaiyao({ userId: this.userId, aiObj: params, type: '1', qdNeedObj })
          .then(r => { if (r.code === 0) this.$alert(r.data); else if (r.code === 999) this.showAlert(r.message); else this.showAlert(r.data) })
          .catch(err => { console.error('[doGenerateSummary] 汇总要点生成接口异常：', err); this.showAlert('汇总要点生成接口异常') })
      }).catch(err => { console.error('[doGenerateSummary] 任务查询接口异常：', err) })
    },
    handleTemplateSave(payload) {
      this.templateLeafWords = this.extractLeafWords(payload.tree)
      // 汇总要点模板保存到共用的 template store（供后续汇总要点/分析报告复用，不回写模糊词 wordTemplate）
      this.$store.dispatch('template/saveTemplate', payload)
      this.addHistory('生成目录模板', '生成了目录模板')
      if (this.generateAfterTemplateSave) {
        this.generateAfterTemplateSave = false
        this.addHistory('生成汇总要点', '使用模板目录结构提交汇总要点生成')
        this.doGenerateSummary()
      }
    },
    closeTemplateConfirm() { this.generateAfterTemplateSave = false },
    extractLeafWords(tree) {
      const result = []
      const walk = function (nodes) {
        if (!Array.isArray(nodes)) return
        nodes.forEach(function (item) {
          if (!item) return
          var hasChildren = Array.isArray(item.children) && item.children.length > 0
          if (hasChildren) { walk(item.children) } else { var name = String(item.name || '').trim(); if (name) result.push(name) }
        })
      }
      walk(tree)
      return result
    },

    /* ==================== 导出汇总要点 ==================== */
    exportSummary() {
      DataExporter.exportSummaryDoc({
        rootEl: this.$el,
        zhaiyaoData: this.zhaiyaoData,
        summaryContent: this.summaryContent,
        title: this.zhaiyaoTitle,
        isDuplicateBigtitle: SummaryFormatter.isDuplicateBigtitle,
        convertToChineseNumeral: SummaryFormatter.convertToChineseNumeral,
        formatSummaryCountText: SummaryFormatter.formatCountText,
        formatSummaryParagraph: (arr, sections, i) => SummaryFormatter.formatParagraph(arr, SummaryFormatter.parseExactWordList(''), sections, i),
        addHistory: (t, c) => this.addHistory(t, c),
        showAlert: this.showAlert
      })
    },

    /* ==================== 输出列表 CSV ==================== */
    outputRepresentatives() {
      const selected = this.tableData.filter(item => this.selectedIds.includes(item.id))
      if (!selected.length) { this.showAlert('请先勾选要输出的代表记录'); return }
      DataExporter.exportCsv(selected, '代表信息', ['建议编号', '标题', '届次', '代表', '代表团'],
        r => [r.id, r.title, r.session, r.representative, r.delegation])
      this.addHistory('输出列表', `导出代表记录${selected.length}条`)
    },

    /* ==================== 任务队列 ==================== */
    openTaskQueue() { this.taskQueueVisible = true },
    closeTaskQueue() { this.taskQueueVisible = false },
    rwdlQuery() {
      this.refreshing = true; this.taskQueueVisible = true
      taskQuery(this.userId).then(res => { this.$emit('update:task-queue-items', res.data || []) })
        .catch(err => { console.error('[rwdlQuery] 任务查询异常：', err) })
        .finally(() => { this.refreshing = false })
    },
    onTaskViewDetail(payload) {
      // 根据传递过来的moudle的值 去控制生成报告的显示与隐藏
      this.module = payload.module
      this.generateReportFromTaskQueue = String(payload.type) === '1'
      this.taskQueueReportTree = this.generateReportFromTaskQueue && Array.isArray(payload.tree)
        ? TreeHelper.normalizeToTwoLevels(payload.tree)
        : []
      this.zyDetail(payload.id, payload.type, payload.words, payload.tree)
    },
    zyDel(id) {
      deletIds([id]).then(res => {
        if (res.code === 0) { this.$message({ message: '删除成功', type: 'success' }); this.rwdlQuery() }
      }).catch(err => { console.error('[zyDel] 删除任务异常：', err); this.$message && this.$message({ message: '删除失败', type: 'error' }) })
    },
    zyDetail(id, type, words, tree) {
      const seq = ++this.detailRequestSeq
      this.lastReportWords = ReportBuilder.normalizeWordArray(words)
      // tree 为单独的树形结构字段，有值则用来展示目录树
      if (Array.isArray(tree) && tree.length) {
        this.reportConfigTree = TreeHelper.normalizeToTwoLevels(tree)
        this.reportWordInputs = TreeHelper.treeToInputs(this.reportConfigTree)
      } else {
        this.reportWordInputs = []
        this.reportConfigTree = []
      }
      this.currentTaskId = String(id || '')
      if (String(type) === '2' || String(type) === '3') {
        this.zsbgEditMode = false; this.reportConfigVisible = false
        this.reportConfigRenderKey += 1
      }
      taskIdQuery(id).then(res => {
        if (seq !== this.detailRequestSeq) return
        if (res.code === 0) {
          this.jljgzsData = res.data?.data || []
          this.taskQueueVisible = false
          if (String(type) === '1') { this.currentSummaryType = '1'; this.handleZhaiyaoResult(res.data?.data) } else { this.currentSummaryType = '2'; this.renderZsbgTree(res.data?.data); this.$emit('update:view-mode', 'summary'); this.reportConfigVisible = false }
        }
      }).catch(err => { console.error('[zyDetail] 任务结果查询异常：', err); this.$message && this.$message({ message: '查询任务结果失败', type: 'error' }) })
    },

    /* ==================== 处理汇总要点结果 ==================== */
    handleZhaiyaoResult(apiData) {
      const list = SummaryFormatter.normalizeZhaiyaoList(apiData || [])
      this.$emit('update:zhaiyao-data', list)
      this.$emit('update:summary-content', SummaryFormatter.formatZhaiyaoText(list))
      this.currentSummaryType = '1'
      this.$emit('update:view-mode', 'summary')
      if (!list.length) this.showAlert('汇总要点无数据')
      // 汇总要点数据更新，通知父组件关闭引文详情
      this.$emit('summary-changed')
    },

    /* ==================== 分析报告 ==================== */
    async renderZsbgTree(payload, skipApiLoad = false) {
      const tree = TreeHelper.extractTreeFromPayload(payload)
      this.zsbgEditableTree = EditableReportStore.cloneTree(tree)
      let edits = {}
      if (!skipApiLoad && this.currentTaskId) {
        try { const res = await getNewResult(this.currentTaskId); if (res.code === 0 && res.data) edits = typeof res.data === 'object' ? res.data : {} } catch (e) { console.warn('[renderZsbgTree] getNewResult 失败，使用空编辑', e) }
      }
      this.zsbgLocalEdits = edits
      EditableReportStore.applyEditsToTree(this.zsbgEditableTree, this.zsbgLocalEdits)
      this.renderFlattenedTree()
      // 分析报告树重新渲染（查看/切换任务、重置编辑等），通知父组件关闭引文详情
      this.$emit('summary-changed')
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
    onOverviewCitationClick(payload) {
      this.$emit('citation-click', payload)
    },
    handleZsbgFieldBlur(payload) {
      if (!payload) return
      const evt = payload.event
      const nd = payload.node
      if (!this.zsbgEditMode || !evt || !nd || !nd.editableMeta) return
      if (!EditableReportStore.canEditMeta(nd.editableMeta)) return
      const text = EditableReportStore.normalizeEditorText(evt.target && evt.target.innerText)
      const updated = EditableReportStore.updateTreeField(this.zsbgEditableTree, nd.editableMeta, text)
      if (!updated) return
      this.zsbgLocalEdits = EditableReportStore.setFieldValue(this.zsbgLocalEdits, nd.editableMeta.keyId, nd.editableMeta.field, text)
      this.renderFlattenedTree()
    },
    async saveLocalZsbgEdits() {
      if (!this.currentTaskId) { this.$message({ type: 'warning', message: '无任务 ID，无法保存' }); return }
      try {
        const res = await updateResult({ taskId: this.currentTaskId, userId: this.userId, resultData: { ...this.zsbgLocalEdits } })
        if (res.code === 0) { this.zsbgEditMode = false; this.$message({ type: 'success', message: '已保存到服务器，编辑模式已关闭' }) } else { this.$message({ type: 'error', message: res.message || '保存失败' }) }
      } catch (e) { console.error('[saveLocalZsbgEdits] updateResult 异常:', e); this.$message({ type: 'error', message: '保存异常' }) }
    },
    async resetLocalZsbgEdits() {
      try { await this.$confirm('确定要重置所有编辑吗？重置后将清空所有已保存的编辑内容，恢复为原始报告。', '确认重置', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }) } catch (_) { return }
      this.zsbgLocalEdits = {}; this.zsbgEditMode = false
      if (this.currentTaskId) { try { await updateResult({ taskId: this.currentTaskId, userId: this.userId, resultData: {} }) } catch (e) { console.warn('[resetLocalZsbgEdits] 清空服务端数据失败', e) } }
      await this.renderZsbgTree(this.jljgzsData, true)
      this.$message({ type: 'success', message: '已清空编辑并恢复当前报告' })
    },

    /* ==================== 分析报告配置 ==================== */
    openReportConfigModal(opts = {}) {
      this.resetReportUnitSelection()
      this.reportWordInputs = []
      if (opts.forceRefreshFromWords) this.reportConfigRenderKey += 1

      if (this.sczsType === 'single') {
        // type '2' — 从任务队列已查看汇总要点结果继续生成
        // 仅使用任务数据：tree 优先，words 次之；不读 Vuex 共享模板。
        if (!this.reportConfigTree.length) {
          const sourceWords = ReportBuilder.normalizeWordArray(this.lastReportWords)
          if (sourceWords.length) {
            this.reportConfigTree = TreeHelper.normalizeToTwoLevels(TreeHelper.buildTreeFromWords(sourceWords))
          } else {
            this.reportConfigTree = []
          }
        }
      } else {
        // type '3' — 从选中记录生成：模糊词有模板时借用其值；否则用汇总要点/分析报告共用的共享模板
        const wordTemplate = this.$store?.state?.wordTemplate
        const savedTemplate = this.$store?.state?.template
        if (wordTemplate?.hasData && Array.isArray(wordTemplate?.tree) && wordTemplate.tree.length) {
          this.reportConfigTree = TreeHelper.normalizeToTwoLevels(wordTemplate.tree)
        } else if (savedTemplate?.hasData && Array.isArray(savedTemplate?.tree) && savedTemplate.tree.length) {
          this.reportConfigTree = TreeHelper.normalizeToTwoLevels(savedTemplate.tree)
        } else if (savedTemplate?.hasData && Array.isArray(savedTemplate?.words) && savedTemplate.words.length) {
          this.reportConfigTree = TreeHelper.normalizeToTwoLevels(TreeHelper.buildTreeFromWords(savedTemplate.words))
        } else {
          // 回退到 lastReportWords → 输入框关键词（与汇总要点逻辑一致）
          const sourceWords = ReportBuilder.normalizeWordArray(this.lastReportWords)
          let fallbackWords = []
          if (sourceWords.length) {
            fallbackWords = sourceWords
          } else if (Array.isArray(this.leftKeywords) && this.leftKeywords.length) {
            fallbackWords = this.leftKeywords
          } else {
            fallbackWords = SummaryFormatter.parseExactWordList('')
          }
          if (fallbackWords.length) {
            this.reportConfigTree = TreeHelper.normalizeToTwoLevels(TreeHelper.buildTreeFromWords(fallbackWords))
          } else {
            this.reportConfigTree = []
          }
        }
      }

      // 从树结构直接构建 reportWordInputs，保留父-子关系
      this.reportWordInputs = TreeHelper.treeToInputs(this.reportConfigTree)
      this.reportConfigVisible = true
    },
    cancelReportConfig() { this.reportConfigVisible = false },
    /* 初始化选中状态：先清空上一次的选中残留，再按"当前值"初始化；
       优先使用单独传入的"当前值"（代表团优先于承办单位），
       其次回退到单一列表自动选中，最后默认代表团 */
    resetReportUnitSelection() {
      this.selectedDelegationForReport = ''
      this.selectedCbdwForReport = ''
      if (this.delegationValue) {
        // 传入值可能是 label（单代表团自动选中存的是 label），下拉 value 是字典 id，需反查为 option 的 value 才能正确高亮
        const dItem = this.delegationList.find(d => d && (d.value === this.delegationValue || d.label === this.delegationValue))
        this.reportUnitType = 'delegation'
        this.selectedDelegationForReport = dItem ? dItem.value : this.delegationValue
      } else if (this.cbdwValue) {
        // 传入值可能是 sysDeptId（编号）也可能是 deptName（显示名），统一反查为 deptName（下拉 value 与接口参数均使用显示名）
        const cItem = this.cbdwList.find(d => d && (String(d.deptName) === String(this.cbdwValue) || String(d.sysDeptId) === String(this.cbdwValue)))
        this.reportUnitType = 'cbdw'
        this.selectedCbdwForReport = cItem ? cItem.deptName : this.cbdwValue
        this.selectedDelegationForReport = ''
      } else if (this.delegationList.length === 1) {
        // 下拉 option 的 value 是字典 id，存 value 保证高亮；提交时再反查为 label
        const d = this.delegationList[0]
        this.reportUnitType = 'delegation'
        this.selectedDelegationForReport = d != null && d.value != null ? d.value : (d != null && d.label != null ? d.label : (d || ''))
      } else if (this.cbdwList.length === 1) {
        const d = this.cbdwList[0]
        this.reportUnitType = 'cbdw'
        this.selectedCbdwForReport = d != null && d.deptName != null ? d.deptName : (d || '')
      } else {
        this.reportUnitType = 'delegation'
        this.selectedDelegationForReport = ''
        this.selectedCbdwForReport = ''
      }
    },
    handleReportConfigSave(payload) {
      const tree = TreeHelper.normalizeToTwoLevels(payload && payload.tree)
      this.reportConfigTree = tree
      this.reportWordInputs = TreeHelper.treeToInputs(tree).map(item => ({ ...item }))
      this.lastReportWords = TreeHelper.collectNodeNames(tree)
      // type '3'（全部记录）时才写入 Vuex 共享模板（与汇总要点共用，不回写模糊词 wordTemplate）；type '2'（已有数据）不写共享
      if (this.sczsType !== 'single') {
        this.$store.dispatch('template/saveTemplate', payload)
      }
      this.reportConfigVisible = false
      this.generateReportRequest()
    },
    generateReport() { this.sczsType = 'single'; this.openReportConfigModal() },
    generateReportAll() { this.sczsType = 'all'; this.lastReportWords = SummaryFormatter.parseExactWordList(''); this.openReportConfigModal() },
    /* 将代表团下拉值（value 可能是字典 id 或显示名 label）解析为接口参数用的显示名，绝不传编号 */
    resolveDelegationLabel(val) {
      const item = this.delegationList.find(d => d && (d.value === val || d.label === val))
      return item ? item.label : val
    },
    /* 将承办单位下拉值（value 是 deptName 显示名）解析为接口参数用的显示名，不传 sysDeptId 编号 */
    resolveCbdwLabel(val) {
      const item = this.cbdwList.find(d => d && (String(d.deptName) === String(val) || String(d.sysDeptId) === String(val)))
      return item ? item.deptName : val
    },
    generateReportRequest() {
      /* 分析报告参数：代表团与承办单位始终都带；接口参数使用显示名（label），不能是编号；
         按 radio 选中项取对应下拉值，未选中的为默认空值 */
      const extraParam = { delegation: '', cbdw: '' }
      if (this.reportUnitType === 'delegation' && this.selectedDelegationForReport) {
        extraParam.delegation = this.resolveDelegationLabel(this.selectedDelegationForReport)
      } else if (this.reportUnitType === 'cbdw' && this.selectedCbdwForReport) {
        extraParam.cbdw = this.resolveCbdwLabel(this.selectedCbdwForReport)
      }
      if (this.sczsType === 'single') {
        if (!this.jljgzsData.length) { this.showAlert('暂无分析报告基础数据，请先在任务队列单击查看后再生成'); return }
        const presetSubtopics = ReportBuilder.buildPresetSubtopics(this.reportWordInputs)
        const qdNeedObj = this.reportConfigTree.length
          ? { words: this.lastReportWords, tree: this.reportConfigTree }
          : { words: this.lastReportWords }
        taskQuery(this.userId).then(res => {
          if ((res.data || []).some(item => item.status === '0')) { this.showAlert('当前已存在正在执行的任务'); return }
          searchZFZhaiyao({ userId: this.userId, aiObj: { data: this.jljgzsData, preset_subtopics: presetSubtopics, type: this.radio_zy, ...extraParam, ...this.taskAiParams }, type: '2', qdNeedObj })
            .then(r => { if (r.code === 0) this.$alert(r.data); else this.showAlert(r.data) })
            .catch(err => { console.error('[generateReport] 分析报告生成接口异常：', err); this.showAlert('分析报告生成失败') })
        }).catch(err => { console.error('[generateReport] 任务查询异常：', err) })
      } else {
        const presetSubtopics = ReportBuilder.buildPresetSubtopics(this.reportWordInputs)
        const qdNeedObj = this.reportConfigTree.length
          ? { words: this.lastReportWords, tree: this.reportConfigTree }
          : { words: this.lastReportWords }
        taskQuery(this.userId).then(res => {
          if ((res.data || []).some(item => item.status === '0')) { this.showAlert('当前已存在正在执行的任务'); return }
          searchZFZhaiyao({ userId: this.userId, aiObj: { obj: this.tableData.filter(item => this.selectedIds.includes(item.id)), preset_subtopics: presetSubtopics, type: this.radio_zy, ...extraParam, ...this.taskAiParams }, type: '3', qdNeedObj })
            .then(r => { if (r.code === 0) this.$alert(r.data); else this.showAlert(r.data) })
            .catch(err => { console.error('[generateReportAll] 分析报告生成接口异常：', err); this.showAlert('分析报告生成失败') })
        }).catch(err => { console.error('[generateReportAll] 任务查询异常：', err) })
      }
    },

    /* ==================== 导出分析报告 ==================== */
    async exportOverview() {
      await DataExporter.exportOverviewReport({
        renderNodes: this.zsbgRenderNodes,
        captureChartImage: async (idx) => {
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
            instance.dispatchAction({ type: 'downplay' }); instance.dispatchAction({ type: 'hideTip' })
            await new Promise(resolve => window.setTimeout(resolve, 16))
            instance.resize()
            const base64 = instance.getDataURL({ type: 'png', pixelRatio: 3, backgroundColor: '#fff', excludeComponents: ['toolbox'] })
            if (base64 && base64.length > 50) {
              const rawWidth = instance.getWidth() || chartDom.offsetWidth || 600
              const rawHeight = instance.getHeight() || chartDom.offsetHeight || 320
              const enhanced = await this._enhanceChartImage(base64)
              if (enhanced) return { imageDataUrl: enhanced.dataUrl || enhanced, width: enhanced.width || rawWidth, height: enhanced.height || rawHeight }
              return { imageDataUrl: base64, width: rawWidth, height: rawHeight }
            }
          }
          const canvas = wrap.querySelector('canvas')
          if (canvas && canvas.toDataURL) {
            const url = canvas.toDataURL('image/png')
            if (url && url.length > 50) {
              const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: 0, height: 0 }
              return { imageDataUrl: url, width: Math.round(rect.width) || canvas.width || 600, height: Math.round(rect.height) || canvas.height || 320 }
            }
          }
          return null
        },
        addHistory: (t, c) => this.addHistory(t, c),
        showAlert: this.showAlert
      })
    },
    _enhanceChartImage(base64) {
      if (!base64) return Promise.resolve(null)
      return new Promise(function (resolve) {
        var img = new Image()
        img.onload = function () {
          try {
            var borderPx = 2; var padding = 8
            var cvs = document.createElement('canvas')
            cvs.width = img.width + 2 * (borderPx + padding)
            cvs.height = img.height + 2 * (borderPx + padding)
            var ctx = cvs.getContext('2d')
            if (!ctx) { resolve(null); return }
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cvs.width, cvs.height)
            ctx.strokeStyle = '#999'; ctx.lineWidth = borderPx
            ctx.strokeRect(borderPx / 2, borderPx / 2, cvs.width - borderPx, cvs.height - borderPx)
            ctx.drawImage(img, borderPx + padding, borderPx + padding, img.width, img.height)
            resolve({ dataUrl: cvs.toDataURL('image/png'), width: cvs.width, height: cvs.height })
          } catch (e) { resolve(null) }
        }
        img.onerror = function () { resolve(null) }
        img.src = base64
      })
    }
  }
}
</script>

<style scoped>
/* 分析报告/摘报 与 代表团/承办单位 参数区的视觉区分 */
/* 标题"分析报告模板"与"分析报告/摘报"radio 之间的间距 */
.report-type-radio {
  margin-left: 24px;
}
.report-type-radio + .report-type-radio {
  margin-left: 10px;
}
/* 摘报模式下参数区占位隐藏（保留布局，弹窗高度与分析报告模式一致） */
.is-hidden {
  visibility: hidden;
}
.unit-type-divider {
  display: inline-block;
  width: 1px;
  height: 18px;
  background: #d8dce3;
  margin: 0 12px;
  vertical-align: middle;
}
.unit-type-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 3px 10px;
  vertical-align: middle;
}
.unit-type-group :deep(.el-radio) {
  margin-right: 4px;
}
.unit-type-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  margin-right: 6px;
  white-space: nowrap;
}
.unit-select {
  width: 180px;
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
.preview-body :deep(.vue-office-pdf) {
  display: block;
  width: 100%;
  height: 100%;
  text-align: left;
  overflow: hidden;
  background: transparent;
}
.preview-body :deep(.vue-office-pdf-wrapper) {
  width: 100% !important;
  padding: 0 !important;
  background: transparent !important;
  box-sizing: border-box !important;
}
.preview-body >>> table,
.preview-body >>> td,
.preview-body >>> th {
  border: 1px solid #ccc !important;
  border-collapse: collapse !important;
  padding: 6px 10px;
}
.preview-body iframe {
  width: 100%;
  height: 100%;
  display: block;
  border: none;
  background: #fff;
}

.report-header {
  font-family: 'KaiTi', 'STKaiti', '楷体', serif;
  font-size: 12px;
  /* 如需清除浮动可在容器后加 clearfix，这里暂不添加以保持原样 */
}

/* ===== 红色 # 图标 ===== */
.report-icon {
  float: left;
  height: 28px;
  color: red;          /* 红色移入类中，同样可灵活控制 */
  /* font-family 继承自父容器，无需重复 */
}

/* ===== 文字区块 ===== */
.report-text {
  float: left;
  height: 16px;
  line-height: 16px;
  margin-left: 5px;
  /* 同样继承父级字体，无需额外设置 */
}

/* （可选）清除浮动，避免父容器高度塌陷 */
.clearfix::after {
  content: '';
  display: table;
  clear: both;
}
.docx-preview-container table {
  border-collapse: collapse;
  width: 100%;
}
.docx-preview-container td,
.docx-preview-container th {
  border: 1px solid #000;
  padding: 8px;
}
.result-header .btn {
  margin-left: 8px;
}
</style>
