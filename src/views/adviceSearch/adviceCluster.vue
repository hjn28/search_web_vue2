<template>
  <div class="advice-cluster">
    <!-- <ClusterHeaderHistory
      title="议案建议聚类与汇总要点综合系统"
      :visible="historyModalVisible"
      :records="historyRecords"
      @toggle="toggleHistoryModal"
      @close="historyModalVisible = false"
      @clear="clearHistory"
    /> -->

    <!-- <div class="modal-overlay" :class="{ show: overlayVisible }" @click="closeAllModals"></div> -->

    <div class="main-container">
      <AdviceClusterLeft
        ref="leftPanel"
        :citation-data="citationData"
        :active-key-id="activeKeyId"
        @add-history="addHistory"
        @cluster-results="onClusterResults"
        @add-to-cluster="onAddToCluster"
        @close-citation="closeCitationDialog"
        @keywords-change="onLeftKeywordsChange"
        @expand-results="onExpandResults"
      />
      <AdviceClusterRight
        ref="rightPanel"
        :left-keywords="leftKeywords"
        :table-data="rightTableData"
        :pagination="rightPagination"
        :view-mode="rightViewMode"
        :detail="rightDetail"
        :zhaiyao-data="rightZhaiyaoData"
        :summary-content="rightSummaryContent"
        :selected-ids="rightSelectedIds"
        :tagging-map="rightTaggingMap"
        :zhaiyao-title="zhaiyaoTitle"
        :task-queue-items="taskQueueItems"
        :active-key-id="activeKeyId"
        :expand-results="expandResults"
        :expand-selection="expandSelection"
        @update:selected-ids="val => rightSelectedIds = val"
        @update:view-mode="val => rightViewMode = val"
        @update:detail="val => rightDetail = val"
        @update:zhaiyao-data="val => rightZhaiyaoData = val"
        @update:summary-content="val => rightSummaryContent = val"
        @update:tagging-map="val => rightTaggingMap = val"
        @update:table-data="val => rightTableData = val"
        @update:pagination="val => rightPagination = val"
        @update:task-queue-items="val => taskQueueItems = val"
        @add-history="addHistory"
        @citation-click="openCitationDialog"
        @summary-changed="closeCitationDialog"
        @expand-item-check="handleExpandItemCheck"
        @expand-keyword-click="handleExpandKeywordClick"
        @expand-segment-change="handleExpandSegmentChange"
      />
    </div>

    <!-- 统一的目录模板弹窗（与生成报告共用左中界面） -->
    <GenerateReportModal
      :visible="templateModalVisible"
      :initial-tree="templateInitialTree"
      :initial-file-name="templateInitialFileName"
      :mode="templateModalType"
      :show-summary-options="false"
      @save="onTemplateSave"
      @close="onTemplateClose"
    />
  </div>
</template>

<script>
import { searchZFSearch2 } from '../../api/login'
import AdviceClusterLeft from './components/AdviceClusterLeft.vue'
import AdviceClusterRight from './components/AdviceClusterRight.vue'
import GenerateReportModal from './components/GenerateReportModal.vue'
import TemplateModalBus from '../../utils/classes/TemplateModalBus'
import zsbgNew from './zsbgNew.json'

export default {
  name: 'adviceCluster',
  components: {
    AdviceClusterLeft,
    AdviceClusterRight,
    GenerateReportModal
  },
  data() {
    return {
      /* ---- 跨面板状态 ---- */
      historyRecords: JSON.parse(localStorage.getItem('operationHistory') || '[]'),
      taskQueueItems: [],

      /* ---- 右侧面板数据（父组件中转） ---- */
      rightTableData: [],
      rightPagination: { page: 1, page_size: 10, total: 0 },
      rightViewMode: 'table',
      rightDetail: { visible: false, html: '', matchType: '' },
      rightZhaiyaoData: [],
      rightSummaryContent: '',
      rightSelectedIds: [],
      rightTaggingMap: {},
      zhaiyaoTitle: `截至${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日，`,

      /* ---- 模态框 ---- */
      historyModalVisible: false,

      /* ---- 引文数据（转发给左侧面板） ---- */
      citationData: [],
      activeKeyId: '',

      /* ---- 左侧面板关键词（转发给右侧面板用于生成汇总要点） ---- */
      leftKeywords: [],

      /* ---- 一次拓展结果（左侧发射 → 右侧展示） ---- */
      expandResults: [],
      expandSelection: {
        selectedPrimary: [],
        selectedKeywords: [],
        selectedSegmentContents: [],
        highlightedPrimary: []
      },

      /* ---- 统一目录模板弹窗状态 ---- */
      templateModalVisible: false,
      templateInitialTree: [],
      templateInitialFileName: '',
      templateModalType: '', // 'word-edit' | 'upload' | 'summary'
      pendingTemplateCallback: null // { onSave, onClose } for non-word-edit
    }
  },
  watch: {
    /**
     * 右侧面板视图切换（表格/详情/拓展/汇总要点/分析报告）时，同步关闭引文详情；
     * 分析报告/汇总要点数据变化（viewMode 不变）由 summary-changed 事件兜底
     */
    rightViewMode() {
      this.closeCitationDialog()
    }
  },
  mounted() {
    // 统一目录模板弹窗事件总线
    TemplateModalBus.$on('open-template-modal', this.handleOpenTemplateModal)
    TemplateModalBus.$on('clear-word-edit', this.handleClearWordEdit)
    // 代表团/承办单位字典数据统一由 dict store 在父级拉取（幂等，FilterConditions 也会兜底触发）
    this.$store.dispatch('dict/fetchAll')

    // 开发调试口径：在控制台调用 window.localYwTest(keyId) 用 zsbgNew.json 数据渲染左侧引文视图
    // 可选参数 keyId：传入则高亮并跳转到对应位置；不传默认取第一个 keyId
    window.localYwTest = (keyId) => {
      this.citationData = Array.isArray(zsbgNew.data) ? zsbgNew.data : []
      if (keyId) {
        this.activeKeyId = keyId
      } else {
        // 默认取第一个 content 中的 keyId
        var data = Array.isArray(zsbgNew.data) ? zsbgNew.data : []
        for (var i = 0; i < data.length; i++) {
          var item = data[i]
          if (item.isyinwen && Array.isArray(item.content) && item.content.length && item.content[0].keyId) {
            this.activeKeyId = item.content[0].keyId
            break
          }
          // 递归找子节点
          var walk = function (nodes) {
            if (!Array.isArray(nodes)) return null
            for (var j = 0; j < nodes.length; j++) {
              var n = nodes[j]
              if (Array.isArray(n.content) && n.content.length && n.content[0].keyId) return n.content[0].keyId
              var found = walk(n.children)
              if (found) return found
            }
            return null
          }
          var firstKeyId = walk(item.children)
          if (firstKeyId) { this.activeKeyId = firstKeyId; break }
        }
      }
    }
    // 开发调试口径：在控制台调用 window.zsbgLocal() 用 zsbgNew.json 数据渲染右侧分析报告界面
    window.zsbgLocal = () => {
      this.citationData = []
      this.activeKeyId = ''
      this.rightDetail = { visible: false, html: '', matchType: '' }
      var data = Array.isArray(zsbgNew.data) ? zsbgNew.data : []
      if (!data.length) { this.showAlert('zsbgNew.json 无数据'); return }
      var right = this.$refs.rightPanel
      if (!right) return
      right.currentSummaryType = '2'
      right.renderZsbgTree(data)
      this.rightViewMode = 'summary'
    }
  },
  methods: {
    showAlert(message) {
      this.$alert(message, '提示', { confirmButtonText: '确定' })
    },

    /* ==================== 操作历史 ==================== */
    addHistory(action, content) {
      const record = { time: new Date().toLocaleString(), action, content }
      this.historyRecords.unshift(record)
      if (this.historyRecords.length > 50) this.historyRecords = this.historyRecords.slice(0, 50)
      localStorage.setItem('operationHistory', JSON.stringify(this.historyRecords))
    },
    toggleHistoryModal() { this.historyModalVisible = !this.historyModalVisible },
    clearHistory() {
      this.$confirm('确定要清空所有操作历史吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
        .then(() => {
          this.historyRecords = []
          localStorage.removeItem('operationHistory')
          this.addHistory('清空历史', '删除了所有操作历史记录')
        }).catch(() => {})
    },

    /* ==================== 聚类结果接收（Left → Right） ==================== */
    onClusterResults({ params, historyText }) {
      // 点击检索聚类时，右侧面板回到列表展示页面
      this.rightViewMode = 'table'
      // 分析报告数据发生变化时关闭引文详情
      this.closeCitationDialog()
      // 直接调用接口，不再使用本地缓存
      this.addHistory('检索聚类（接口）', historyText)
      this.rightTableData = []
      this.rightPagination = { page: 1, page_size: this.rightPagination.page_size, total: 0 }
      this.rightSelectedIds = []
      // 清除一次拓展结果
      this.expandResults = []
      searchZFSearch2(params).then(res => {
        const rawList = (res && res.data && res.data.all_item) ? res.data.all_item
          : (res && Array.isArray(res.data) ? res.data
            : (Array.isArray(res) ? res : []))
        this.rightTableData = rawList.map((item, idx) => ({
          checked: false,
          disabled: false,
          ...(item || {}),
          // 确保 id 存在且唯一，避免 undefined id 导致 selection 全量匹配
          id: item && item.id != null ? item.id : `_row_${Date.now()}_${idx}`
        }))
        this.rightPagination = { page: 1, page_size: this.rightPagination.page_size, total: this.rightTableData.length }
      }).catch(err => {
        console.error('searchZFSearch2 error:', err)
        this.rightTableData = []
        this.rightPagination = { ...this.rightPagination, total: 0 }
      })
    },

    /* ==================== 从左侧文件搜索添加到右侧 ==================== */
    onAddToCluster(item) {
      if (!item) return
      const exists = this.rightTableData.some(r => r.id === item.id || r.id === item.id)
      if (!exists) {
        this.rightTableData = [...this.rightTableData, {
          id: item.id || `FS-${Date.now()}`,
          title: item.title || '未命名',
          session: item.session || '-',
          representative: item.representative || '-',
          delegation: item.delegation || '-',
          content: item.content || ''
        }]
      }
    },

    /* ==================== 引文（数据转发给左侧面板） ==================== */
    openCitationDialog(payload) {
      // payload = { data: 完整接口树结构, keyId: 当前点击的 keyId }
      if (payload && payload.data) {
        this.citationData = Array.isArray(payload.data) ? payload.data : []
        this.activeKeyId = payload.keyId || ''
      }
    },
    closeCitationDialog() {
      this.citationData = []
      this.activeKeyId = ''
    },

    /* ==================== 左侧关键词变化 ==================== */
    onLeftKeywordsChange(words) {
      this.leftKeywords = Array.isArray(words) ? words : []
    },

    /* ==================== 一次拓展结果（左侧 → 右侧） ==================== */
    onExpandResults(results) {
      this.expandResults = Array.isArray(results) ? results : []
      this.rightViewMode = 'expand'
    },

    handleExpandItemCheck(item) {
      if (this.$refs.leftPanel) this.$refs.leftPanel.onItemTitleChange(item)
      this.syncExpandSelection()
    },
    handleExpandKeywordClick(kw, item, index, ki) {
      if (this.$refs.leftPanel) this.$refs.leftPanel.togglePrimaryHighlight(kw, item, index, ki)
      this.syncExpandSelection()
    },
    handleExpandSegmentChange(payload) {
      if (this.$refs.leftPanel && payload) {
        const left = this.$refs.leftPanel
        if (payload.checked) {
          if (!left.selectedSegmentContents.includes(payload.content)) {
            left.selectedSegmentContents.push(payload.content)
          }
        } else {
          const idx = left.selectedSegmentContents.indexOf(payload.content)
          if (idx > -1) left.selectedSegmentContents.splice(idx, 1)
        }
      }
      this.syncExpandSelection()
    },
    syncExpandSelection() {
      const left = this.$refs.leftPanel
      if (!left) return
      this.expandSelection = {
        selectedPrimary: Array.isArray(left.selectedPrimary) ? [...left.selectedPrimary] : [],
        selectedKeywords: Array.isArray(left.selectedKeywords) ? [...left.selectedKeywords] : [],
        selectedSegmentContents: Array.isArray(left.selectedSegmentContents) ? [...left.selectedSegmentContents] : [],
        highlightedPrimary: Array.isArray(left.highlightedPrimary) ? [...left.highlightedPrimary] : []
      }
    },

    /* ==================== 统一目录模板弹窗 ==================== */

    /** 接收总线事件：打开模板弹窗 */
    handleOpenTemplateModal(opts) {
      this.templateModalVisible = true
      this.templateInitialTree = opts.initialTree || []
      this.templateInitialFileName = opts.initialFileName || ''
      this.templateModalType = opts.type

      if (opts.type !== 'word-edit') {
        this.pendingTemplateCallback = { onSave: opts.onSave, onClose: opts.onClose }
      } else {
        this.pendingTemplateCallback = null
      }
    },

    /** 模板保存 — 按场景路由写入独立 Vuex store，组件自动同步 */
    onTemplateSave(payload) {
      // 1. 模糊词生成写入 wordTemplate（独立模板，回显仅由模糊词触发）；
      //    汇总要点/分析报告写入 template（共用模板，保存不回显到模糊词）
      if (this.templateModalType === 'word-edit') {
        this.$store.dispatch('wordTemplate/saveTemplate', payload)
      } else {
        this.$store.dispatch('template/saveTemplate', payload)
      }

      // 2. 非 word-edit 类型需要透传 payload 给原始回调
      if (this.templateModalType !== 'word-edit' && this.pendingTemplateCallback && this.pendingTemplateCallback.onSave) {
        this.pendingTemplateCallback.onSave(payload)
      }
      this.closeTemplateModal()
    },

    /** 模板关闭 */
    onTemplateClose() {
      if (this.templateModalType !== 'word-edit' && this.pendingTemplateCallback && this.pendingTemplateCallback.onClose) {
        this.pendingTemplateCallback.onClose()
      }
      this.closeTemplateModal()
    },

    /** 关闭模板弹窗并重置状态 */
    closeTemplateModal() {
      this.templateModalVisible = false
      this.templateInitialTree = []
      this.templateInitialFileName = ''
      this.templateModalType = ''
      this.pendingTemplateCallback = null
    },

    /** 接收总线事件：清除模糊词模板数据（wordTemplate 独立模板） */
    handleClearWordEdit() {
      this.$store.dispatch('wordTemplate/clearTemplate')
    }
  },

  beforeDestroy() {
    TemplateModalBus.$off('open-template-modal', this.handleOpenTemplateModal)
    TemplateModalBus.$off('clear-word-edit', this.handleClearWordEdit)
  }
}
</script>
