<template>
  <div class="gen-report-root">
    <div class="gen-report-mask" :class="{ show: visible }" @click="handleClose"></div>
    <div class="gen-report-modal" :class="{ show: visible }">
      <div class="gen-report-header">
        <div class="gen-report-title">{{ modalTitle }}</div>
        <button type="button" class="gen-report-close" aria-label="关闭" @click="handleClose">×</button>
      </div>

      <div class="gen-report-body">
        <div class="layout-left">
          <div class="upload-card">
            <input v-model="fileName" class="upload-file-name" type="text" readonly aria-label="已选文件" />
            <button type="button" class="upload-trigger" @click="handleUploadClick">文件上传</button>
            <input ref="fileInput" type="file" class="file-input" @change="handleFileChange" />
          </div>

          <div class="editor-card">
            <h3 class="card-title">目录编辑</h3>
            <label class="form-label" for="directory-name">目录名称：</label>
            <textarea id="directory-name" v-model="form.name" class="input" placeholder="请输入目录名称"></textarea>
          </div>
          <div class="btn-row">
            <button type="button" class="btn btn-success" @click="handleAddRoot">新增根目录</button>
            <button type="button" class="btn btn-success" @click="handleAdd">添加子目录</button>
            <button type="button" class="btn btn-danger" @click="handleDelete">删除目录</button>
            <button type="button" class="btn btn-primary" @click="handleSave">修改名称</button>
          </div>
        </div>

        <div class="layout-mid">
          <div class="tree-card">
            <h3 class="card-title">目录结构</h3>
            <ul class="tree-list">
              <li
                v-for="node in visibleNodesList"
                :key="node.id"
                class="tree-item"
                :class="{ active: activeId === node.id }"
                :style="{ paddingLeft: (12 + node.depth * 24) + 'px' }"
                @click="selectNode(node)"
              >
                <div class="tree-item-main">
                  <i :class="node.childrenCount ? 'el-icon-folder' : 'el-icon-document'" class="tree-icon"></i>
                  <span class="tree-label">{{ node.name }}</span>
                </div>
                <span class="tree-delete-btn" title="删除该目录" @click.stop="handleDeleteNode(node)">×</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="layout-right">
          <div class="action-card">
            <div class="summary-options">
              <h3 class="card-title">按分类汇总原文内容</h3>
              <label v-for="item in summaryOptionItems" :key="item.value" class="option-item">
                <input v-model="selectedOption" :disabled="!showSummaryOptions" type="radio" name="gen-report-mode" :value="item.value" />{{ item.label }}
              </label>
            </div>
            <div class="report-options">
              <h3 class="card-title output-title">输出分析报告</h3>
              <div class="report-options-grid">
                <label v-for="item in reportGridItems" :key="item.value" class="option-item">
                  <input v-model="selectedOption" type="radio" name="gen-report-mode" :value="item.value" />{{ item.label }}
                </label>
              </div>
              <label class="option-item">
                <input v-model="selectedOption" type="radio" name="gen-report-mode" :value="optionValues.REPORT_DELEGATION" />代表团模板
              </label>
              <select v-model="selectedDelegationForReport" :disabled="selectedOption !== optionValues.REPORT_DELEGATION" class="template-select">
                <option value="">请选择代表团</option>
                <option v-for="d in delegationList" :key="d.value" :value="d.value">{{ d.label }}</option>
              </select>
              <label class="option-item">
                <input v-model="selectedOption" type="radio" name="gen-report-mode" :value="optionValues.REPORT_UNDERTAKER" />承办单位模板
              </label>
              <select v-model="selectedCbdwForReport" :disabled="selectedOption !== optionValues.REPORT_UNDERTAKER" class="template-select">
                <option value="">请选择承办单位</option>
                <option v-for="d in cbdwList" :key="d.sysDeptId" :value="d.deptName">{{ d.deptName }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="gen-report-footer">
        <div class="btn-fotter">
          <button type="button" class="btn btn-primary" @click="handleSaveTemplate">保存</button>
          <button v-if="isReportMode" type="button" class="btn btn-primary" @click="handleGenerateReport">立即生成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * GenerateReportModal - 统一目录模板弹窗
 *
 * 两种模式共用同一套「文件上传 + 目录编辑 + 目录结构 + 生成方式」界面，
 * 右侧生成方式栏始终展示，模式只决定标题与底部按钮：
 *   - mode = 'report'    ：标题「生成报告」，底部可「立即生成」
 *   - mode = 'word-edit' ：标题「上传模板」，仅编辑并保存目录结构
 *
 * 数据边界：
 *   - 目录树、当前选中节点、上传文件名属于「本次弹窗会话」，用本地 data；
 *   - 生成方式与单位模板参数跨弹窗保留，唯一数据源是 reportOption store，
 *     组件内只通过 computed 的 get/set 读写，不维护本地副本。
 *
 * 事件约定（由使用方决定后续动作，组件自身不主动关闭弹窗）：
 *   - save     ：保存目录结构 → { tree, words, wordFileName, delegation, cbdw }
 *   - generate ：立即生成     → { tree, selectedOption, delegation, cbdw }
 *   - close    ：用户关闭
 */
import axios from 'axios'
import { mapState } from 'vuex'
import TreeHelper from '../../../utils/classes/TreeHelper'
import { REPORT_OPTION } from '../../../store/modules/reportOption'

/** 弹窗模式，取值由调用方（adviceCluster store / AdviceClusterRight）传入 */
export const MODAL_MODE = {
  REPORT: 'report',
  WORD_EDIT: 'word-edit'
}

/** 「按分类汇总原文内容」选项 */
const SUMMARY_OPTION_ITEMS = [
  { value: REPORT_OPTION.SUMMARY_CURRENT, label: '按当前分类体系输出' },
  { value: REPORT_OPTION.SUMMARY_PLAN, label: '按照“十五五规划纲要”篇章节句归类输出内容' },
  { value: REPORT_OPTION.SUMMARY_REPRESENTATIVE, label: '代表审议意见模板（预工委、代工委）' }
]

/** 「输出分析报告」中并排两列的选项 */
const REPORT_GRID_ITEMS = [
  { value: REPORT_OPTION.REPORT_DEFAULT, label: '默认模板输出' },
  { value: REPORT_OPTION.REPORT_DIGEST, label: '摘报模板' }
]

export default {
  name: 'GenerateReportModal',
  props: {
    visible: { type: Boolean, default: false },
    /** MODAL_MODE 之一 */
    mode: { type: String, default: MODAL_MODE.REPORT },
    /** 打开时的初始目录树 */
    initialTree: { type: Array, default: () => [] },
    /** 打开时的初始文件名 */
    initialFileName: { type: String, default: '' },
    /** 是否展示「按分类汇总原文内容」区块（从汇总要点结果继续生成报告时置 false） */
    showSummaryOptions: { type: Boolean, default: true }
  },
  emits: ['save', 'generate', 'close'],
  data() {
    return {
      treeData: [],
      activeId: null,
      activeNode: null,
      form: { name: '' },
      fileName: ''
    }
  },
  computed: {
    ...mapState('dict', {
      delegationList: 'allDelegations',
      cbdwList: 'allCbdw'
    }),
    isReportMode() {
      return this.mode === MODAL_MODE.REPORT
    },
    isWordEditMode() {
      return this.mode === MODAL_MODE.WORD_EDIT
    },
    modalTitle() {
      return this.isWordEditMode ? '上传模板' : '生成报告'
    },
    /** 模板中引用的生成方式常量，避免与 store 常量各写一份魔法字符串 */
    optionValues() {
      return REPORT_OPTION
    },
    summaryOptionItems() {
      return SUMMARY_OPTION_ITEMS
    },
    reportGridItems() {
      return REPORT_GRID_ITEMS
    },
    /** 生成方式：唯一数据源 = reportOption store */
    selectedOption: {
      get() {
        return !this.showSummaryOptions ? REPORT_OPTION.REPORT_DEFAULT : this.$store.state.reportOption.selectedOption
      },
      set(value) {
        this.$store.commit('reportOption/SET_SELECTED_OPTION', value)
      }
    },
    /** 代表团模板参数：唯一数据源 = reportOption store */
    selectedDelegationForReport: {
      get() {
        return this.$store.state.reportOption.delegation
      },
      set(value) {
        this.$store.commit('reportOption/SET_DELEGATION', value)
      }
    },
    /** 承办单位模板参数：唯一数据源 = reportOption store */
    selectedCbdwForReport: {
      get() {
        return this.$store.state.reportOption.cbdw
      },
      set(value) {
        this.$store.commit('reportOption/SET_CBDW', value)
      }
    },
    /** 目录树拍平成一维列表（带层级，用于缩进渲染） */
    visibleNodesList() {
      const list = []
      const walk = (nodes, depth) => {
        if (!Array.isArray(nodes)) return
        nodes.forEach(item => {
          list.push({
            id: item.id,
            name: item.name,
            depth,
            childrenCount: Array.isArray(item.children) ? item.children.length : 0
          })
          walk(item.children, depth + 1)
        })
      }
      walk(this.treeData, 0)
      return list
    }
  },
  watch: {
    /** 切换代表团/承办单位模板时清空另一侧，避免提交时两个参数都带值 */
    selectedOption(val) {
      if (!this.isReportMode) return
      if (val === REPORT_OPTION.REPORT_DELEGATION) {
        this.selectedCbdwForReport = ''
      } else if (val === REPORT_OPTION.REPORT_UNDERTAKER) {
        this.selectedDelegationForReport = ''
      }
    },
    /** 字典异步到达后补一次「唯一候选自动选中」 */
    delegationList() {
      this.autoSelectSingleUnit()
    },
    cbdwList() {
      this.autoSelectSingleUnit()
    },
    /**
     * 只在弹窗「打开」这一刻初始化。
     * 不再监听 initialTree：弹窗打开着时父级重新传入树（例如保存后回写）会打断用户
     * 正在进行的节点选择与编辑。
     */
    visible(val) {
      if (val) this.initOnOpen()
    }
  },
  created() {
    // 字典可能在本组件创建前就已就绪，这里先兜一次；未就绪时由上面的 watcher 补
    this.autoSelectSingleUnit()
  },
  methods: {
    /* ==================== 打开初始化 ==================== */
    initOnOpen() {
      this.fileName = this.initialFileName || ''
      this.treeData = this.normalizeTree(this.initialTree)
      const first = this.visibleNodesList[0]
      if (first) {
        this.selectNode(first)
      } else {
        this.activeId = null
        this.activeNode = null
        this.form.name = ''
      }
      // 单位模板参数：用户上次的选择优先，首次打开用左侧筛选值兜底
      this.$store.dispatch('reportOption/initTargets')
      this.$store.dispatch('dict/fetchAll')
      this.autoSelectSingleUnit()
    },
    /**
     * 候选唯一时自动选中：选中的代表团/承办单位不需要用户再手动选一次。
     * 已有值时不做覆盖，保证用户的选择不被字典的异步到达冲掉。
     */
    autoSelectSingleUnit() {
      if (!this.selectedDelegationForReport && this.delegationList.length === 1) {
        this.selectedDelegationForReport = this.delegationList[0].value
      }
      if (!this.selectedCbdwForReport && this.cbdwList.length === 1) {
        this.selectedCbdwForReport = this.cbdwList[0].deptName
      }
    },

    /* ==================== 提交 ==================== */
    handleSaveTemplate() {
      this.$emit('save', {
        tree: this.treeData,
        words: TreeHelper.collectNodeNames(this.treeData),
        wordFileName: this.fileName,
        delegation: this.selectedDelegationForReport,
        cbdw: this.selectedCbdwForReport
      })
    },
    handleGenerateReport() {
      // 选中代表团/承办单位模板时必须先指定具体单位
      if (this.selectedOption === REPORT_OPTION.REPORT_DELEGATION && !this.selectedDelegationForReport) {
        this.$message && this.$message.warning('请先选择代表团')
        return
      }
      if (this.selectedOption === REPORT_OPTION.REPORT_UNDERTAKER && !this.selectedCbdwForReport) {
        this.$message && this.$message.warning('请先选择承办单位')
        return
      }
      this.$emit('generate', {
        tree: this.treeData,
        selectedOption: this.selectedOption,
        delegation: this.selectedDelegationForReport,
        cbdw: this.selectedCbdwForReport
      })
    },
    handleClose() {
      this.$emit('close')
    },

    /* ==================== 目录树工具 ==================== */
    /** 递归补齐节点 id：非层级 id（如后端返回的业务 id）按位置重新编号，保证增删可靠 */
    normalizeTree(nodes, parentId, depth) {
      if (!Array.isArray(nodes)) return []
      const hasParent = parentId != null
      const currentDepth = typeof depth === 'number' ? depth : 0
      return nodes.map((item, index) => {
        const fallbackId = hasParent ? String(parentId) + '-' + String(index + 1) : String(index + 1)
        const rawId = item && item.id != null ? String(item.id) : ''
        const normalizedId = this.isHierarchicalId(rawId) ? rawId : fallbackId
        return {
          id: normalizedId,
          name: item && item.name ? String(item.name) : '未命名目录',
          text: item && item.text ? String(item.text) : '',
          children: this.normalizeTree(item && item.children, normalizedId, currentDepth + 1)
        }
      })
    },
    /** 层级 id 形如 1 / 1-2 / 1-2-3，深度即连接符个数 */
    isHierarchicalId(id) {
      return /^\d+(?:-\d+)*$/.test(String(id || ''))
    },
    getNextTreeId(nodes, parentId) {
      const siblings = Array.isArray(nodes) ? nodes : []
      const hasParent = parentId != null
      const parentPrefix = hasParent ? String(parentId) + '-' : ''
      let maxIndex = 0

      siblings.forEach(item => {
        const id = item && item.id != null ? String(item.id) : ''
        if (!id || !this.isHierarchicalId(id)) return
        if (!hasParent) {
          const rootMatch = id.match(/^(\d+)$/)
          if (rootMatch) maxIndex = Math.max(maxIndex, parseInt(rootMatch[1], 10) || 0)
          return
        }
        const escaped = parentPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const match = id.match(new RegExp('^' + escaped + '(\\d+)$'))
        if (match) maxIndex = Math.max(maxIndex, parseInt(match[1], 10) || 0)
      })
      return hasParent ? parentPrefix + String(maxIndex + 1) : String(maxIndex + 1)
    },
    findNodeById(nodes, id) {
      if (!Array.isArray(nodes)) return null
      const target = String(id)
      for (let i = 0; i < nodes.length; i++) {
        if (String(nodes[i].id) === target) return nodes[i]
        const child = this.findNodeById(nodes[i].children, id)
        if (child) return child
      }
      return null
    },
    deleteNodeById(nodes, id) {
      if (!Array.isArray(nodes)) return false
      const target = String(id)
      for (let i = 0; i < nodes.length; i++) {
        if (String(nodes[i].id) === target) {
          nodes.splice(i, 1)
          return true
        }
        if (this.deleteNodeById(nodes[i].children, id)) return true
      }
      return false
    },
    warn(message) {
      this.$message && this.$message.warning(message)
    },
    tip(message) {
      this.$message && this.$message.success(message)
    },

    /* ==================== 节点选择 ==================== */
    selectNode(item) {
      this.activeId = item.id
      this.form.name = item.name
      this.activeNode = this.findNodeById(this.treeData, item.id)
    },
    /** 删除节点后把选中态回退到第一个节点，没有节点则清空 */
    resetSelectionAfterRemove() {
      const first = this.visibleNodesList[0]
      if (first) {
        this.selectNode(first)
        return
      }
      this.activeId = null
      this.activeNode = null
      this.form.name = ''
    },
    /** 目录名必填校验，返回去空格后的名称（不合法时返回空串） */
    takeDirectoryName() {
      const name = (this.form.name || '').trim()
      if (!name) this.warn('添加目录前请先填写目录名称')
      return name
    },

    /* ==================== 目录编辑四个按钮 ==================== */
    handleAddRoot() {
      const name = this.takeDirectoryName()
      if (!name) return
      const node = { id: this.getNextTreeId(this.treeData, null), name, text: '', children: [] }
      this.treeData.push(node)
      this.selectNode(node)
      this.form.name = ''
      this.tip('新增根目录成功')
    },
    handleAdd() {
      if (!this.activeId) {
        this.warn('请先选择一个目录')
        return
      }
      const name = this.takeDirectoryName()
      if (!name) return
      const parent = this.findNodeById(this.treeData, this.activeId)
      if (!parent) {
        this.warn('未找到当前目录')
        return
      }
      if (!Array.isArray(parent.children)) parent.children = []
      parent.children.push({ id: this.getNextTreeId(parent.children, parent.id), name, text: '', children: [] })
      this.form.name = ''
      this.tip('添加子目录成功')
    },
    handleDelete() {
      if (!this.activeId) {
        this.warn('请先选择目录')
        return
      }
      if (!this.deleteNodeById(this.treeData, this.activeId)) {
        this.warn('未找到可删除目录')
        return
      }
      this.resetSelectionAfterRemove()
      this.tip('删除目录成功')
    },
    handleDeleteNode(node) {
      if (!node || node.id == null) return
      if (!this.deleteNodeById(this.treeData, node.id)) {
        this.warn('未找到可删除目录')
        return
      }
      // 删除的正好是当前选中节点时，选中态需要回退
      if (String(this.activeId) === String(node.id)) this.resetSelectionAfterRemove()
      this.tip('删除目录成功')
    },
    handleSave() {
      if (!this.activeId) {
        this.warn('请先选择目录')
        return
      }
      const name = (this.form.name || '').trim()
      if (!name) {
        this.warn('目录名称不能为空')
        return
      }
      const node = this.findNodeById(this.treeData, this.activeId)
      if (!node) {
        this.warn('未找到当前目录')
        return
      }
      node.name = name
      this.activeNode = node
      this.tip('保存修改成功')
    },

    /* ==================== 文件上传 ==================== */
    handleUploadClick() {
      this.$refs.fileInput && this.$refs.fileInput.click()
    },
    handleFileChange(e) {
      const file = e && e.target && e.target.files ? e.target.files[0] : null
      if (e && e.target) e.target.value = '' // 允许重复选择同一个文件
      if (!file) {
        this.fileName = ''
        return
      }
      const name = String(file.name || '').toLowerCase()
      if (!name.endsWith('.doc') && !name.endsWith('.docx')) {
        this.warn('仅支持上传Word文件')
        return
      }
      this.fileName = file.name

      const formData = new FormData()
      formData.append('file', file)
      formData.append('max_level', 2)
      formData.append('body_delimiter', '、')

      axios
        .post('/task/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(res => {
          if (res.data.code !== 0) {
            this.$message && this.$message.error((res.data && res.data.message) || '文件上传失败，请重试')
            return
          }
          const sourceTree = res.data.data && Array.isArray(res.data.data.tree) ? res.data.data.tree : []
          this.treeData = this.normalizeTree(sourceTree)
          this.resetSelectionAfterRemove()
          this.tip('已按模板加载目录结构')
        })
        .catch(error => {
          console.error('[GenerateReportModal] 目录模板上传失败：', error)
          this.$message && this.$message.error('文件上传失败，请重试')
        })
    }
  }
}
</script>

<!--
  样式说明：原实现经历了「大尺寸 → 中尺寸 → 紧凑尺寸」三轮叠加，
  同一批选择器被重复声明 2~3 次、后写覆盖先写，还残留了模板里已不存在的
  内容编辑区（.content-* / .clear-button / .template-group 等）样式。
  这里按最终生效值合并为一份，选择器不再重复。
-->
<style scoped>
/* ===== 遮罩与弹框 ===== */
.gen-report-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 1300;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
.gen-report-mask.show {
  opacity: 1;
  pointer-events: auto;
}

.gen-report-modal {
  position: fixed;
  top: 18%;
  left: 50%;
  width: min(970px, calc(100vw - 40px));
  height: min(440px, calc(100vh - 80px));
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid #d8dde4;
  border-radius: 7px;
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.24);
  z-index: 1301;
  opacity: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: opacity 0.2s;
}
.gen-report-modal.show {
  opacity: 1;
  pointer-events: auto;
}

.gen-report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 38px;
  padding: 0 14px;
  box-sizing: border-box;
  border-bottom: 1px solid #d8dde4;
}
.gen-report-title {
  font-size: 14px;
  font-weight: 700;
  color: #3d3d3d;
}
.gen-report-close {
  padding: 0;
  border: 0;
  background: transparent;
  color: #6c7480;
  font-size: 28px;
  font-weight: 200;
  line-height: 1;
  cursor: pointer;
}
.gen-report-close:hover {
  color: #c9190b;
}

/* ===== 三栏主体 ===== */
.gen-report-body {
  flex: 1;
  display: grid;
  grid-template-columns: 35.5% 39% 25.5%;
  overflow: hidden;
  padding: 0;
  background: #fff;
  box-sizing: border-box;
}
/* 列间隙：三栏各自留出右侧空白，右边界线因此左移 20px */
.gen-report-body > * {
  margin-right: 20px;
}
.gen-report-body > *:last-child {
  margin-right: 0;
}
/* 栅格子项会忽略 flex-* 属性，这里只保留节点内部真正生效的 flex 布局 */
.layout-left {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.layout-mid {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
}
.layout-right {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.layout-left,
.layout-mid {
  border-right: 1px solid #d8dde4;
}

/* ===== 左栏：文件上传 ===== */
.upload-card {
  display: flex;
  flex: 0 0 60px;
  flex-direction: row;
  align-items: center;
  padding: 0 14px;
  border-bottom: 1px dashed #d8dde4;
  box-sizing: border-box;
}
.upload-file-name {
  flex: 1;
  min-width: 0;
  height: 26px;
  margin: 0 12px 0 0;
  padding: 0 12px;
  border: 1px solid #d7dce3;
  border-radius: 3px;
  box-sizing: border-box;
  color: #555;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.upload-trigger {
  display: inline-block;
  height: 26px;
  padding: 0 9px;
  border: 1px solid #dc0606;
  border-radius: 4px;
  background: #fff;
  color: #d90000;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}
.file-input {
  display: none;
}

/* ===== 左栏：目录编辑 ===== */
.editor-card {
  padding: 10px 24px 0;
}
.card-title {
  margin: 0 0 16px 0;
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 700;
  color: #d60000;
}
.editor-card .card-title {
  align-self: center;
  margin-bottom: 16px;
}
.form-label {
  display: block;
  margin-bottom: 9px;
  color: #444;
  font-size: 14px;
}
.input {
  flex: 1;
  width: 100%;
  height: auto;
  min-height: 150px;
  padding: 8px 10px;
  border: 1px solid #e5999d;
  border-radius: 3px;
  box-sizing: border-box;
  color: #1f2d3d;
  resize: none;
  font: 13px/1.45 'Microsoft YaHei', sans-serif;
}
.input:focus {
  outline: none;
  border-color: #c9190b;
  box-shadow: 0 0 0 2px rgba(201, 25, 11, 0.1);
}

/* ===== 通用按钮 ===== */
.btn {
  height: 34px;
  width: 70px;
  padding: 0 12px;
  border: 1px solid #c9190b;
  border-radius: 4px;
  background: #c9190b;
  color: #fff;
  font-size: 11px;
  line-height: 32px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-primary,
.btn-success {
  background: #c9190b;
  border-color: #c9190b;
}
.btn-danger {
  background: #fff;
  color: #c9190b;
  border-color: #c9190b;
}
.btn-primary:hover,
.btn-success:hover {
  background: #a81609;
  border-color: #a81609;
}
.btn-danger:hover {
  background: #f8e8e6;
}
.btn-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 10px 0 0 10px;
}
.btn-row .btn {
  height: 25px;
  padding: 0 3px;
  border-radius: 5px;
  font-size: 11px;
  line-height: 23px;
}

/* ===== 中栏：目录结构 ===== */
.tree-card {
  flex: 1;
  padding: 12px 14px;
}
.tree-card .card-title {
  margin-bottom: 6px;
}
.tree-list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #d48f89 #f8e8e6;
}
.tree-list::-webkit-scrollbar {
  width: 8px;
}
.tree-list::-webkit-scrollbar-track {
  background: #f8e8e6;
  border-radius: 8px;
}
.tree-list::-webkit-scrollbar-thumb {
  background: #d48f89;
  border-radius: 8px;
}
.tree-list::-webkit-scrollbar-thumb:hover {
  background: #c9190b;
}
.tree-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 27px;
  /* 左内边距由行内 style 按层级计算 */
  padding: 1px 8px 1px 0;
  margin-bottom: 0;
  border-radius: 0;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.tree-item:hover,
.tree-item.active {
  background: #fff4f4;
}
.tree-item-main {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.tree-icon {
  margin-right: 7px;
  color: #ffad00;
  font-size: 18px;
}
.tree-item.active .tree-icon {
  color: #2779e9;
}
.tree-label {
  color: #4b4b4b;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tree-delete-btn {
  display: none;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-left: 8px;
  border: 1px solid #e23232;
  border-radius: 50%;
  background: #fff;
  color: #e23232;
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  cursor: pointer;
  user-select: none;
}
.tree-item:hover .tree-delete-btn {
  display: inline-block;
}
.tree-delete-btn:hover {
  background: #a81609;
}

/* ===== 右栏：生成选项 ===== */
.action-card {
  position: relative;
  flex: 1.18;
  padding: 12px 14px 52px;
}
.action-card .card-title {
  margin-bottom: 10px;
}
.action-card .output-title {
  margin-top: 18px;
}
.option-item {
  display: block;
  margin: 0 0 11px;
  color: #4d4d4d;
  font-size: 12px;
  line-height: 1.35;
}
.option-item input {
  width: 13px;
  height: 13px;
  margin: 0 5px 0 0;
  vertical-align: -2px;
}
/* 默认/摘报左右两列，代表团/承办单位上下排列 */
.report-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.report-options-grid .option-item {
  margin-bottom: 11px;
}
.report-options-grid .option-item:first-child {
  margin-right: 14px;
}
.template-select {
  display: block;
  width: calc(100% - 18px);
  height: 25px;
  margin: -5px 0 9px 18px;
  padding: 0 6px;
  border: 1px solid #d8dce2;
  background: #fff;
  color: #555;
  font-size: 11px;
}

/* ===== 底部 ===== */
.gen-report-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px;
  border-top: 1px solid #d8dde4;
  background: #fff;
}
.gen-report-footer .btn-fotter {
  margin-left: auto;
}
.btn-fotter .btn {
  margin-left: 12px;
}

@media (max-width: 1100px) {
  .gen-report-body {
    min-width: 900px;
    overflow: hidden;
  }
}
</style>
