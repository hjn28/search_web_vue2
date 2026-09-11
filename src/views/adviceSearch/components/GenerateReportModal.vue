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
        <!-- v-if="isReportMode" -->
        <div  class="layout-right">
          <div class="action-card">
            <div v-if="showSummaryOptions" class="summary-options">
              <h3 class="card-title">按分类汇总原文内容</h3>
              <label class="option-item"><input v-model="selectedOption" type="radio" name="gen-report-mode" value="summary-current" />按当前分类体系输出</label>
              <label class="option-item"><input v-model="selectedOption" type="radio" name="gen-report-mode" value="summary-plan" />按照“十五五规划纲要”篇章节句归类输出内容</label>
              <label class="option-item"><input v-model="selectedOption" type="radio" name="gen-report-mode" value="summary-representative" />代表审议意见模板（预工委、代工委）</label>
            </div>
            <div class="report-options">
              <h3 class="card-title output-title">输出分析报告</h3>
            <div class="report-options-grid">
              <label class="option-item"><input v-model="selectedOption" type="radio" name="gen-report-mode" value="report-default" />默认模板输出</label>
              <label class="option-item"><input v-model="selectedOption" type="radio" name="gen-report-mode" value="report-digest" />摘报模板</label>
            </div>
            <label class="option-item"><input v-model="selectedOption" type="radio" name="gen-report-mode" value="report-delegation" />代表团模板</label>
            <select v-model="selectedDelegationForReport" :disabled="selectedOption !== 'report-delegation'" class="template-select">
              <option value="">请选择代表团</option>
              <option v-for="d in delegationList" :key="d.value" :value="d.value">{{ d.label }}</option>
            </select>
            <label class="option-item"><input v-model="selectedOption" type="radio" name="gen-report-mode" value="report-undertaker" />承办单位模板</label>
            <select v-model="selectedCbdwForReport" :disabled="selectedOption !== 'report-undertaker'" class="template-select">
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
import axios from 'axios'
import { mapState } from 'vuex'

export default {
  name: 'GenerateReportModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    initialTree: {
      type: Array,
      default: () => []
    },
    initialFileName: {
      type: String,
      default: ''
    },
    showSummaryOptions: {
      type: Boolean,
      default: true
    },
    mode: {
      type: String,
      default: 'report'
    },
    initialReportOptions: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'change', 'save', 'generate'],
  data() {
    return {
      treeData: [],
      activeId: null,
      activeNode: null,
      form: {
        name: ''
      },
      fileName: '',
      // 生成方式单选：按分类汇总原文内容（summary-*）与输出分析报告（report-*）合并为一组，只能选其一
      selectedOption: 'summary-current',
      selectedDelegationForReport: '',
      selectedCbdwForReport: ''
    }
  },
  watch: {
    // 切换代表团/承办单位单选时，清空另一侧的选中值，避免执行时两个参数都带值（与生成分析报告模板一致）
    selectedOption(val) {
      if (val === 'report-delegation') {
        this.selectedCbdwForReport = ''
      } else if (val === 'report-undertaker') {
        this.selectedDelegationForReport = ''
      }
    },
    // 代表团/承办单位字典异步加载完成后，单一列表时自动选中（与生成分析报告模板一致）
    delegationList: {
      immediate: true,
      handler(list) {
        if (this.selectedDelegationForReport) return
        if (!Array.isArray(list) || list.length !== 1) return
        const d = list[0]
        this.selectedDelegationForReport = d && d.value != null ? d.value : (d && d.label != null ? d.label : '')
      }
    },
    cbdwList: {
      immediate: true,
      handler(list) {
        if (this.selectedCbdwForReport) return
        if (!Array.isArray(list) || list.length !== 1) return
        const d = list[0]
        this.selectedCbdwForReport = d && d.deptName != null ? d.deptName : ''
      }
    },
    visible: {
      immediate: true,
      handler(val) {
        if (val) {
          const savedOptions = this.initialReportOptions || {}
          if (savedOptions.selectedOption) this.selectedOption = savedOptions.selectedOption
          this.selectedDelegationForReport = savedOptions.delegation || ''
          this.selectedCbdwForReport = savedOptions.cbdw || ''
          this.fileName = this.initialFileName || ''
          if (!this.showSummaryOptions && this.selectedOption.indexOf('summary-') === 0) {
            this.selectedOption = 'report-default'
          }
          // 打开时确保代表团/承办单位字典已拉取（store 幂等，重复调用无副作用）
          this.$store && this.$store.dispatch('dict/fetchAll')
          if (Array.isArray(this.initialTree) && this.initialTree.length) {
            this.treeData = this.normalizeTree(this.initialTree)
            const first = this.visibleNodesList[0]
            if (first) this.selectNode(first)
          } else {
            this.treeData = []
            this.activeId = null
            this.activeNode = null
            this.form.name = ''
          }
        }
      }
    },
    initialTree: {
      immediate: true,
      handler(val) {
        if (this.visible && Array.isArray(val) && val.length) {
          this.treeData = this.normalizeTree(val)
          const first = this.visibleNodesList[0]
          if (first) this.selectNode(first)
        }
      }
    }
  },
  computed: {
    isReportMode() {
      return this.mode === 'report'
    },
    modalTitle() {
      if (this.mode === 'word-edit') return '上传模板'
      // if (this.mode === 'summary') return '分类要点内容汇总模板'
      return '生成报告'
    },
    // 代表团/承办单位全量从 dict store 读取（与生成分析报告模板一致）
    ...mapState('dict', {
      delegationList: 'allDelegations',
      cbdwList: 'allCbdw'
    }),
    visibleNodesList() {
      const list = []
      const walk = (nodes, depth) => {
        if (!Array.isArray(nodes) || !nodes.length) return
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
    },
    nodeDepthText() {
      return this.getNodeDepthById(this.activeId) + 1
    }
  },
  methods: {
    handleSaveTemplate() {
      this.$emit('save', {
        tree: this.treeData,
        words: this.collectTreeNames(this.treeData),
        wordFileName: this.fileName,
        selectedOption: this.selectedOption,
        delegation: this.selectedDelegationForReport,
        cbdw: this.selectedCbdwForReport
      })
      if (this.mode !== 'report') this.$emit('close')
    },
    collectTreeNames(nodes) {
      const result = []
      const walk = items => {
        if (!Array.isArray(items)) return
        items.forEach(item => {
          if (item && item.name) result.push(String(item.name).trim())
          walk(item && item.children)
        })
      }
      walk(nodes)
      return result.filter(Boolean)
    },
    handleClose() {
      this.fileName = ''
      this.$emit('change', this.treeData)
      this.$emit('close')
    },

    // ========== 树工具 ==========
    normalizeTree(nodes, parentId, depth) {
      if (!Array.isArray(nodes)) return []
      const self = this
      const hasParent = parentId != null
      const currentDepth = typeof depth === 'number' ? depth : 0
      return nodes.map((item, index) => {
        const fallbackId = hasParent ? String(parentId) + '-' + String(index + 1) : String(index + 1)
        const rawId = item && item.id != null ? String(item.id) : ''
        const normalizedId = self.isHierarchicalId(rawId) ? rawId : fallbackId
        return {
          id: normalizedId,
          name: item && item.name ? String(item.name) : '未命名目录',
          text: item && item.text ? String(item.text) : '',
          children: self.normalizeTree(item && item.children, normalizedId, currentDepth + 1)
        }
      })
    },
    getNodeDepthById(id) {
      const text = String(id || '')
      if (!text) return 0
      return Math.max(0, text.split('-').length - 1)
    },
    isHierarchicalId(id) {
      return /^\d+(?:-\d+)*$/.test(String(id || ''))
    },
    getNextTreeId(nodes, parentId) {
      const siblings = Array.isArray(nodes) ? nodes : []
      const hasParent = parentId != null
      const parentKey = hasParent ? String(parentId) : ''
      const parentPrefix = hasParent ? parentKey + '-' : ''
      let maxIndex = 0
      const self = this

      siblings.forEach(item => {
        const id = item && item.id != null ? String(item.id) : ''
        if (!id) return
        if (!hasParent) {
          if (!self.isHierarchicalId(id)) return
          const rootMatch = id.match(/^(\d+)$/)
          if (rootMatch) {
            const rootIndex = parseInt(rootMatch[1], 10)
            if (!isNaN(rootIndex) && rootIndex > maxIndex) maxIndex = rootIndex
          }
          return
        }
        const match = id.match(new RegExp('^' + parentPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$'))
        if (match) {
          const childIndex = parseInt(match[1], 10)
          if (!isNaN(childIndex) && childIndex > maxIndex) maxIndex = childIndex
        }
      })
      return hasParent ? parentPrefix + String(maxIndex + 1) : String(maxIndex + 1)
    },
    findNodeById(nodes, id) {
      if (!nodes || !nodes.length) return null
      for (let i = 0; i < nodes.length; i++) {
        if (String(nodes[i].id) === String(id)) return nodes[i]
        const child = this.findNodeById(nodes[i].children, id)
        if (child) return child
      }
      return null
    },
    deleteNodeById(nodes, id) {
      if (!nodes || !nodes.length) return false
      for (let i = 0; i < nodes.length; i++) {
        if (String(nodes[i].id) === String(id)) {
          nodes.splice(i, 1)
          return true
        }
        if (this.deleteNodeById(nodes[i].children, id)) return true
      }
      return false
    },

    // ========== 节点选择 ==========
    selectNode(item) {
      this.activeId = item.id
      this.form.name = item.name
      this.activeNode = this.findNodeById(this.treeData, item.id)
    },
    refreshActiveNode() {
      this.activeNode = this.activeId ? this.findNodeById(this.treeData, this.activeId) : null
    },
    clearActiveContent() {
      if (this.activeNode) this.activeNode.text = ''
    },

    // ========== 目录编辑四个按钮 ==========
    getValidatedDirectoryName() {
      const name = (this.form.name || '').trim()
      if (!name) {
        this.$message && this.$message.warning('添加目录前请先填写目录名称')
        return ''
      }
      return name
    },
    handleAddRoot() {
      const newName = this.getValidatedDirectoryName()
      if (!newName) return
      const nextRootId = this.getNextTreeId(this.treeData, null)
      const node = { id: nextRootId, name: newName, text: '', children: [] }
      this.treeData.push(node)
      this.selectNode(node)
      this.form.name = ''
      this.$message && this.$message.success('新增根目录成功')
    },
    handleAdd() {
      if (!this.activeId) {
        this.$message && this.$message.warning('请先选择一个目录')
        return
      }
      const newName = this.getValidatedDirectoryName()
      if (!newName) return
      const parent = this.findNodeById(this.treeData, this.activeId)
      if (!parent) {
        this.$message && this.$message.warning('未找到当前目录')
        return
      }
      const nextChildId = this.getNextTreeId(parent.children, parent.id)
      const child = { id: nextChildId, name: newName, text: '', children: [] }
      if (!parent.children) parent.children = []
      parent.children.push(child)
      this.selectNode(child)
      this.form.name = ''
      this.$message && this.$message.success('添加子目录成功')
    },
    handleDelete() {
      if (!this.activeId) {
        this.$message && this.$message.warning('请先选择目录')
        return
      }
      const removed = this.deleteNodeById(this.treeData, this.activeId)
      if (!removed) {
        this.$message && this.$message.warning('未找到可删除目录')
        return
      }
      const first = this.visibleNodesList[0]
      if (first) {
        this.selectNode(first)
      } else {
        this.activeId = null
        this.activeNode = null
        this.form.name = ''
      }
      this.$message && this.$message.success('删除目录成功')
    },
    handleDeleteNode(node) {
      if (!node || node.id == null) return
      const removed = this.deleteNodeById(this.treeData, node.id)
      if (!removed) {
        this.$message && this.$message.warning('未找到可删除目录')
        return
      }
      if (String(this.activeId) === String(node.id)) {
        const first = this.visibleNodesList[0]
        if (first) {
          this.selectNode(first)
        } else {
          this.activeId = null
          this.activeNode = null
          this.form.name = ''
        }
      }
      this.$message && this.$message.success('删除目录成功')
    },
    handleSave() {
      const name = (this.form.name || '').trim()
      if (!this.activeId) {
        this.$message && this.$message.warning('请先选择目录')
        return
      }
      if (!name) {
        this.$message && this.$message.warning('目录名称不能为空')
        return
      }
      const node = this.findNodeById(this.treeData, this.activeId)
      if (!node) {
        this.$message && this.$message.warning('未找到当前目录')
        return
      }
      node.name = name
      this.refreshActiveNode()
      this.$message && this.$message.success('保存修改成功')
    },

    // ========== 文件上传 ==========
    handleUploadClick() {
      this.$refs.fileInput && this.$refs.fileInput.click()
    },
    handleFileChange(e) {
      const files = e.target && e.target.files
      const file = files && files[0] ? files[0] : null
      if (!file) {
        this.fileName = ''
        return
      }
      const name = String(file.name || '').toLowerCase()
      const isWord = name.endsWith('.doc') || name.endsWith('.docx')
      if (!isWord) {
        this.$message && this.$message.warning('仅支持上传Word文件')
        if (e && e.target) e.target.value = ''
        return
      }
      this.fileName = file.name
      if (e && e.target) e.target.value = ''

      const formData = new FormData()
      formData.append('file', file)
      formData.append('max_level', 2)
      formData.append('body_delimiter', '、')

      axios
        .post('/task/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(res => {
          if (res.data.code === 0) {
            const sourceTree = res.data.data && Array.isArray(res.data.data.tree) ? res.data.data.tree : []
            this.treeData = this.normalizeTree(sourceTree)
            const first = this.visibleNodesList[0]
            if (first) {
              this.selectNode(first)
            } else {
              this.activeId = null
              this.activeNode = null
              this.form.name = ''
            }
            this.$message && this.$message.success('已按模板加载目录结构')
          } else {
            this.$message.error(res.data?.message || '文件上传失败，请重试')
          }
        })
        .catch(error => {
          console.error('上传失败，error=', error)
          this.$message && this.$message.error('文件上传失败，请重试')
        })
    },

    // ========== 输出报告 ==========
    handleGenerateReport() {
      // 交互校验：选中代表团/承办单位模板时必须先选择对应的单位，避免静默降级为默认模板
      if (this.selectedOption === 'report-delegation' && !this.selectedDelegationForReport) {
        this.$message && this.$message.warning('请先选择代表团')
        return
      }
      if (this.selectedOption === 'report-undertaker' && !this.selectedCbdwForReport) {
        this.$message && this.$message.warning('请先选择承办单位')
        return
      }
      // 触发父组件事件，传递当前目录树、生成方式单选值及代表团/承办单位选中值
      this.$emit('generate', {
        tree: this.treeData,
        selectedOption: this.selectedOption,
        delegation: this.selectedDelegationForReport,
        cbdw: this.selectedCbdwForReport
      })
    }
  }
}
</script>

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
  top: 5%;
  left: 12%;
  right: 12%;
  bottom: 5%;
  background: #fff;
  border: 1px solid #f0d9d7;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
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
  padding: 20px 28px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}
.gen-report-title {
  font-size: 18px;
  color: #1f2d3d;
  font-weight: 700;
}
.gen-report-close {
  font-size: 28px;
  color: #647184;
  cursor: pointer;
  line-height: 1;
}
.gen-report-close:hover {
  color: #c9190b;
}

/* ===== 三栏主体 ===== */
.gen-report-body {
  flex: 1;
  overflow: auto;
  background: #f9f9f9;
  display: flex;
  padding: 20px;
  box-sizing: border-box;
}
.gen-report-body > * {
  margin-right: 20px;
}
.gen-report-body > *:last-child {
  margin-right: 0;
}

.layout-left {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
/* .layout-left > * {
  margin-bottom: 20px;
}
.layout-left > *:last-child {
  margin-bottom: 0;
} */
.layout-mid {
  width: 360px;
  flex-shrink: 0;
  display: flex;
  min-height: 0;
  overflow-y: auto;
}
.layout-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.layout-right > * {
  margin-bottom: 20px;
}
.layout-right > *:last-child {
  margin-bottom: 0;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.card-title {
  margin: 0 0 16px 0;
  font-size: 15px;
  font-weight: 700;
  color: #c9190b;
  flex-shrink: 0;
}

/* ===== 左栏：上传 ===== */
.upload-area {
  margin-top: 4px;
  border: 1px dashed #dfb4af;
  border-radius: 10px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fff;
}

.gen-report-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 6px;
  border-top: 1px solid #d8dde4;
  background: #fff;
}

.gen-report-footer .btn-generate {
  margin-left: auto;
}
.gen-report-footer .btn-fotter {
  margin-left: auto;
}
.btn-fotter .btn {
  margin-left: 12px;
}
.upload-icon {
  font-size: 40px;
  color: #c9190b;
}
.upload-tip {
  margin: 8px 0 12px;
  font-size: 14px;
  color: #647184;
}
.upload-trigger {
  display: inline-block;
  background: #fff;
  color: #c9190b;
  border: 1px solid #c9190b;
  border-radius: 4px;
  padding: 7px 18px;
  font-size: 12px;
}
.file-input {
  display: none;
}
.upload-file-name {
  margin-top: 12px;
  font-size: 13px;
  color: #3a4a61;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 左栏：目录编辑 ===== */
.editor-card {
  /* flex: 1; */
}
.form-item {
  margin-top: 0;
}
.form-label {
  display: block;
  margin-bottom: 8px;
  color: #2f3a4d;
  font-size: 15px;
}
.input {
  width: 100%;
  height: 44px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  font-size: 15px;
  line-height: 44px;
  padding: 0 14px;
  box-sizing: border-box;
  color: #1f2d3d;
}
.input:focus {
  outline: none;
  border-color: #c9190b;
  box-shadow: 0 0 0 2px rgba(201, 25, 11, 0.1);
}
/* ===== 通用按钮 ===== */
.btn {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0 12px;
  height: 34px;
  width: 70px;
  line-height: 32px;
  font-size: 11px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #c9190b;
  border-color: #c9190b;
}
.btn-primary {
  background: #c9190b;
  border-color: #c9190b;
}
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

/* ===== 中栏：目录结构 ===== */
.tree-card {
  flex: 1;
}
.tree-list {
  margin: 0;
  padding: 0;
  list-style: none;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
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
.tree-list {
  scrollbar-width: thin;
  scrollbar-color: #d48f89 #f8e8e6;
}
.tree-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  box-sizing: border-box;
}
.tree-item:hover {
  background: #f8e8e6;
}
.tree-item.active {
  background: #f3d8d4;
}
.tree-delete-btn {
  display: none;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-left: 8px;
  border-radius: 50%;
  background: #c9190b;
  color: #fff;
  font-size: 14px;
  line-height: 18px;
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
.tree-item-main {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}
.tree-icon {
  margin-right: 8px;
  color: #c9190b;
  font-size: 16px;
}
.tree-label {
  font-size: 15px;
  color: #1f2d3d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 右侧：内容展示 ===== */
.content-card {
  flex: 1;
}
.content-area {
  flex: 1;
  min-height: 0;
  border: 1px dashed #dfb4af;
  border-radius: 10px;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: auto;
}
.content-empty {
  font-size: 16px;
  color: #b0b8c4;
  text-align: center;
  margin: auto;
}
.content-node-name {
  font-size: 16px;
  font-weight: 700;
  color: #c9190b;
  margin-bottom: 12px;
}
.content-text {
  font-size: 14px;
  color: #1f2d3d;
  line-height: 1.8;
  white-space: pre-wrap;
  flex: 1;
}
.content-meta {
  margin-top: 12px;
  font-size: 13px;
  color: #647184;
  display: flex;
  border-top: 1px solid #e9ecef;
  padding-top: 12px;
}
.content-meta > * {
  margin-right: 20px;
}
.content-meta > *:last-child {
  margin-right: 0;
}

/* ===== 右侧：操作区 ===== */
.action-card {
  flex-shrink: 0;
}
.template-group {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.template-group > * {
  margin: 0 8px 8px 0;
}
.template-group > *:last-child {
  margin-right: 0;
}
.template-btn {
  padding: 6px 16px;
  border: 1px solid #d8dee8;
  border-radius: 4px;
  background: #fff;
  color: #1f2d3d;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.template-btn:hover {
  border-color: #c9190b;
  color: #c9190b;
}
.template-btn.active {
  background: #c9190b;
  border-color: #c9190b;
  color: #fff;
}

/* Reference layout: a full-screen, flat three-column report workspace. */
.gen-report-modal {
  top: 5px;
  right: 5px;
  bottom: 5px;
  left: 5px;
  border-color: #d8dde4;
  border-radius: 7px;
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.24);
}
.gen-report-header {
  height: 64px;
  padding: 0 24px;
  box-sizing: border-box;
  border-color: #d8dde4;
}
.gen-report-title {
  color: #3d3d3d;
  font-size: 22px;
}
.gen-report-close {
  padding: 0;
  border: 0;
  background: transparent;
  color: #6c7480;
  font-size: 42px;
  font-weight: 200;
  cursor: pointer;
}
.gen-report-body {
  display: grid;
  grid-template-columns: 35.5% 39% 25.5%;
  overflow: hidden;
  padding: 0;
  background: #fff;
}
.layout-left,
.layout-mid,
.layout-right {
  width: auto;
  min-width: 0;
}
.layout-left,
.layout-mid {
  border-right: 1px solid #d8dde4;
}
.upload-card {
  display: flex;
  flex: 0 0 106px;
  flex-direction: row;
  align-items: center;
  padding: 0 25px;
  border-bottom: 1px dashed #d8dde4;
  box-sizing: border-box;
}
.upload-file-name {
  margin-right: 20px;
}
.upload-file-name {
  flex: 1;
  min-width: 0;
  height: 42px;
  margin: 0;
  padding: 0 12px;
  border: 1px solid #d7dce3;
  border-radius: 3px;
  box-sizing: border-box;
  color: #555;
  font-size: 15px;
}
.upload-trigger {
  height: 42px;
  padding: 0 14px;
  border: 1px solid #dc0606;
  border-radius: 4px;
  background: #fff;
  color: #d90000;
  font-size: 16px;
  white-space: nowrap;
  cursor: pointer;
}
.upload-trigger i {
  margin-right: 7px;
  font-size: 20px;
}
.editor-card {
  padding: 10px 24px 0 24px;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.card-title {
  color: #d60000;
  font-size: 22px;
}
.editor-card .card-title {
  align-self: center;
  margin-bottom: 30px;
}
.form-label {
  margin-bottom: 16px;
  color: #444;
  font-size: 19px;
}
.input {
  flex: 1;
  min-height: 220px;
  height: auto;
  padding: 14px 18px;
  border-color: #e5999d;
  border-radius: 3px;
  resize: none;
  font: 18px/1.55 'Microsoft YaHei', sans-serif;
}
.btn-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-left: 10px;
  margin-top: 10px;
}
.btn-row .btn {
  height: 42px;
  padding: 0 6px;
  border-radius: 5px;
  font-size: 16px;
  line-height: 40px;
}
.layout-mid {
  display: flex;
}
.tree-card {
  padding: 20px;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.tree-card .card-title {
  margin-bottom: 12px;
}
.tree-list {
  padding-right: 0;
}
.tree-item {
  min-height: 48px;
  margin-bottom: 0;
  padding-top: 3px;
  padding-right: 14px;
  padding-bottom: 3px;
  border-radius: 0;
}
.tree-item:hover,
.tree-item.active {
  background: #fff4f4;
}
.tree-icon {
  color: #ffad00;
  font-size: 27px;
}
.tree-label {
  color: #4b4b4b;
  font-size: 19px;
}
.tree-item.active .tree-icon {
  color: #2779e9;
}
.tree-delete-btn {
  border: 1px solid #e23232;
  background: #fff;
  color: #e23232;
}
.content-card,
.action-card {
  padding: 20px 24px 34px;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.content-card {
  border-bottom: 1px solid #e4e7eb;
}
.content-area {
  border: 0;
  border-radius: 0;
  padding: 0;
  overflow: hidden;
}
.content-node-name {
  color: #555;
  font-size: 15px;
}
.content-text {
  width: 100%;
  min-height: 105px;
  padding: 14px;
  border: 1px solid #f0dcdc;
  background: #fff7f7;
  box-sizing: border-box;
  resize: none;
  font: 17px/1.45 'Microsoft YaHei', sans-serif;
}
.clear-button {
  align-self: flex-end;
  width: 118px;
  height: 42px;
  margin-top: 16px;
  border: 1px solid #dc0606;
  border-radius: 4px;
  background: #fff;
  color: #d90000;
  font-size: 16px;
  cursor: pointer;
}
.action-card {
  position: relative;
  flex: 1.18;
  padding-bottom: 90px;
}
.action-card .card-title {
  margin-bottom: 20px;
  font-size: 20px;
}
.action-card .output-title {
  margin-top: 38px;
}
.option-item {
  display: block;
  margin: 0 0 21px;
  color: #4d4d4d;
  font-size: 17px;
  line-height: 1.35;
}
.option-item input {
  width: 19px;
  height: 19px;
  margin: 0 8px 0 0;
  vertical-align: -3px;
}
.template-select {
  display: block;
  width: calc(100% - 26px);
  height: 38px;
  margin: -10px 0 18px 26px;
  padding: 0 10px;
  border: 1px solid #d8dce2;
  background: #fff;
  color: #555;
  font-size: 15px;
}
.btn-generate {
  position: absolute;
  right: 26px;
  bottom: 18px;
  width: 88px;
  height: 25px;
  font-size: 11px;
  line-height: 23px;
}
@media (max-width: 1100px) {
  .gen-report-body {
    min-width: 900px;
    overflow: auto;
  }
}

/* Keep this dialog on the same compact scale as the existing template modal. */
.gen-report-modal {
  top: 18%;
  right: auto;
  bottom: auto;
  left: 50%;
  width: min(970px, calc(100vw - 40px));
  height: min(440px, calc(100vh - 80px));
  transform: translateX(-50%);
}
.gen-report-header {
  height: 38px;
  padding: 0 14px;
}
.gen-report-title {
  font-size: 14px;
}
.gen-report-close {
  font-size: 28px;
}
.gen-report-body {
  grid-template-columns: 35.5% 39% 25.5%;
  min-width: 0;
}
.upload-card {
  flex-basis: 60px;
  padding: 0 14px;
}
.upload-file-name {
  margin-right: 12px;
}
.upload-file-name,
.upload-trigger {
  height: 26px;
  font-size: 12px;
}
.upload-trigger {
  padding: 0 9px;
}
.upload-trigger i {
  margin-right: 4px;
  font-size: 14px;
}
.card-title,
.action-card .card-title {
  font-size: 15px;
}
.editor-card .card-title {
  margin-bottom: 16px;
}
.form-label {
  margin-bottom: 9px;
  font-size: 14px;
}
.input {
  min-height: 150px;
  padding: 8px 10px;
  font: 13px/1.45 'Microsoft YaHei', sans-serif;
}
.btn-row .btn {
  height: 25px;
  padding: 0 3px;
  font-size: 11px;
  line-height: 23px;
}
.tree-card {
  padding: 12px 14px;
}
.tree-card .card-title {
  margin-bottom: 6px;
}
.tree-item {
  min-height: 27px;
  padding-top: 1px;
  padding-right: 8px;
  padding-bottom: 1px;
}
.tree-icon {
  margin-right: 7px;
  font-size: 18px;
}
.tree-label {
  font-size: 14px;
}
.tree-delete-btn {
  width: 16px;
  height: 16px;
  font-size: 12px;
  line-height: 14px;
}
.content-card,
.action-card {
  padding: 12px 14px 16px;
}
.content-card {
  flex: 1;
}
.content-node-name {
  margin-bottom: 5px;
  font-size: 12px;
}
.content-text {
  min-height: 94px;
  padding: 8px;
  font: 12px/1.4 'Microsoft YaHei', sans-serif;
}
.content-empty {
  font-size: 13px;
}
.clear-button {
  width: 68px;
  height: 25px;
  margin-top: 10px;
  font-size: 12px;
}
.action-card {
  flex: 1.18;
  padding-bottom: 52px;
}
.action-card .card-title {
  margin-bottom: 10px;
}
.action-card .output-title {
  margin-top: 18px;
}
.option-item {
  margin-bottom: 11px;
  font-size: 12px;
}
.option-item input {
  width: 13px;
  height: 13px;
  margin-right: 5px;
  vertical-align: -2px;
}
.template-select {
  width: calc(100% - 18px);
  height: 25px;
  margin: -5px 0 9px 18px;
  padding: 0 6px;
  font-size: 11px;
}
@media (max-width: 1100px) {
  .gen-report-body {
    overflow: hidden;
  }
}

/* ===== 输出分析报告：默认/摘报左右两列，代表团/承办单位上下排列 ===== */
.report-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.report-options-grid .option-item:first-child {
  margin-right: 14px;
}
.report-options-grid .option-item {
  margin-bottom: 11px;
}
</style>
