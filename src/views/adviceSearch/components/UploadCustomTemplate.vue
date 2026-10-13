<template>
  <div class="sczdymb-wrap">
    <div class="layout-left card">
      <div class="card-head">
        <h3 class="card-title">目录结构</h3>
      </div>

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
            <i class="el-icon-folder tree-icon"></i>
            <span class="tree-label">{{ node.name }}</span>
          </div>
          <!-- 悬停高亮时最右侧显示 ×，点击删除该目录（父节点连同子节点一并删除） -->
          <span class="tree-delete-btn" title="删除该目录" @click.stop="handleDeleteNode(node)">×</span>
        </li>
      </ul>

      <div class="tree-footer-btns">
        <button type="button" class="btn btn-danger btn-sm" @click="handleClearAll">
          清空
        </button>
        <button type="button" class="btn btn-primary btn-sm" @click="handleSaveTree">
          {{ saveText }}
        </button>
      </div>
    </div>

    <div class="layout-right">
      <div class="card editor-card">
        <h3 class="card-title">目录编辑</h3>

        <div class="form-item">
          <label class="form-label">目录名称</label>
          <input v-model="form.name" type="text" class="input" placeholder="请输入目录名称" />
        </div>

        <div class="btn-row">
          <button type="button" class="btn btn-success" @click="handleAddRoot">+ 新增根目录</button>
          <button type="button" class="btn btn-success" @click="handleAdd">+ 添加子目录</button>
          <button type="button" class="btn btn-primary" @click="handleSave">修改名称</button>
          <button type="button" class="btn btn-danger" @click="handleDelete">删除目录</button>
        </div>
      </div>

      <div class="card upload-card">
        <h3 class="card-title">文件上传</h3>

        <label class="upload-area" @click="handleUploadClick">
          <div class="upload-icon">☁</div>
          <!-- <p class="upload-tip">点击或拖拽文件到此处上传</p> -->
          <p class="upload-tip">点击文件上传</p>
          <span class="upload-trigger">选择文件</span>
        </label>

        <input
          ref="fileInput"
          type="file"
          class="file-input"
          @change="handleFileChange"
        />

        <p v-if="fileName" class="upload-file-name">已选择：{{ fileName }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: 'Sczdymb',
  props: {
    initialTree: {
      type: Array,
      default: function () {
        return []
      }
    },
    initialWordFileName: {
      type: String,
      default: ''
    },
    maxDepth: {
      type: Number,
      default: 99
    },
    /**
     * 模板使用场景，决定底部保存按钮文字：
     * 'word-edit' 模糊词生成 | 'summary' 汇总要点生成 | 'report' 分析报告生成 | 空 保存
     */
    mode: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      treeData: [],
      activeId: null,
      form: {
        name: ''
      },
      fileName: '',
      hasUploadedWord: false
    }
  },
  watch: {
    initialTree: {
      immediate: true,
      handler: function (val) {
        // 弹窗打开时，优先回显上一次保存到父组件中的目录树。
        if (Array.isArray(val) && val.length) {
          this.treeData = this.normalizeTree(val)
          var first = this.visibleNodesList[0]
          if (first) this.selectNode(first)
        } else {
          this.treeData = []
          this.activeId = null
          this.form.name = ''
        }
      }
    },
    initialWordFileName: {
      immediate: true,
      handler: function (val) {
        // 弹窗内部显示的是“内部保存态”的文件名，不受外侧删除影响。
        this.fileName = val || ''
        this.hasUploadedWord = !!val
      }
    }
  },
  computed: {
    /** 底部保存按钮文字，按使用场景区分 */
    saveText() {
      if (this.mode === 'summary') return '生成分类要点内容汇总'
      if (this.mode === 'report') return '生成分析报告'
      if (this.mode === 'word-edit') return '保存分类体系模板'
      return '保存'
    },
    visibleNodesList() {
      var list = []
      var walk = function (nodes, depth) {
        if (!Array.isArray(nodes) || !nodes.length) return
        nodes.forEach(function (item) {
          list.push({
            id: item.id,
            name: item.name,
            depth: depth
          })
          walk(item.children, depth + 1)
        })
      }
      walk(this.treeData, 0)
      return list
    }
  },
  mounted() {
    // 把 cengjimulu.json 挂到全局，方便控制台测试
    // var jsonData = require('../data/cengjimulu.json')
    // window.mbtest = (function (vm) {
    //   return function () {
    //     vm.loadDirectoryTreeFromJson(jsonData)
    //   }
    // })(this)
    // console.log('sczdymb mounted, treeData=', this.treeData)
  },
  methods: {
    normalizeTree(nodes, parentId, depth) {
      if (!Array.isArray(nodes)) return []
      var self = this
      var hasParent = parentId !== null && parentId !== undefined && parentId !== ''
      var currentDepth = typeof depth === 'number' ? depth : 0
      return nodes.map(function (item, index) {
        var fallbackId = hasParent ? String(parentId) + '-' + String(index + 1) : String(index + 1)
        var rawId = item && item.id != null ? String(item.id) : ''
        var normalizedId = self.isHierarchicalId(rawId) ? rawId : fallbackId
        var canKeepChildren = currentDepth < (self.maxDepth - 1)
        return {
          id: normalizedId,
          name: item && item.name ? String(item.name) : '未命名目录',
          children: canKeepChildren ? self.normalizeTree(item && item.children, normalizedId, currentDepth + 1) : []
        }
      })
    },
    getNodeDepthById(id) {
      var text = String(id || '')
      if (!text) return 0
      return Math.max(0, text.split('-').length - 1)
    },
    isHierarchicalId(id) {
      // 仅把纯数字和“数字-数字-...”视为模板目录序号。
      return /^\d+(?:-\d+)*$/.test(String(id || ''))
    },
    getNextTreeId(nodes, parentId) {
      // 新增目录时，不直接用总数递增，而是读取同级已有编号后继续往后排。
      var siblings = Array.isArray(nodes) ? nodes : []
      var hasParent = parentId !== null && parentId !== undefined && parentId !== ''
      var parentKey = hasParent ? String(parentId) : ''
      var parentPrefix = hasParent ? parentKey + '-' : ''
      var maxIndex = 0
      var self = this

      siblings.forEach(function (item) {
        var id = item && item.id != null ? String(item.id) : ''
        if (!id) return

        if (!hasParent) {
          if (!self.isHierarchicalId(id)) return
          var rootMatch = id.match(/^(\d+)$/)
          if (rootMatch) {
            var rootIndex = parseInt(rootMatch[1], 10)
            if (!isNaN(rootIndex) && rootIndex > maxIndex) {
              maxIndex = rootIndex
            }
          }
          return
        }

        var match = id.match(new RegExp('^' + parentPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$'))
        if (match) {
          var childIndex = parseInt(match[1], 10)
          if (!isNaN(childIndex) && childIndex > maxIndex) {
            maxIndex = childIndex
          }
        }
      })

      return hasParent ? parentPrefix + String(maxIndex + 1) : String(maxIndex + 1)
    },
    loadDirectoryTreeFromJson(res) {
      var json = res
      var sourceTree = json && json.data && Array.isArray(json.data.tree) ? json.data.tree : []
      var normalized = this.normalizeTree(sourceTree)
      this.treeData = normalized
      var first = this.visibleNodesList[0]
      if (first) {
        this.selectNode(first)
      } else {
        this.activeId = null
        this.form.name = ''
      }
    },
    selectNode(item) {
      this.activeId = item.id
      this.form.name = item.name
    },
    getValidatedDirectoryName() {
      var name = (this.form.name || '').trim()
      if (!name) {
        this.$message && this.$message.warning('添加目录前请先填写目录名称')
        return ''
      }
      return name
    },
    handleAddRoot() {
      var newName = this.getValidatedDirectoryName()
      if (!newName) return
      var nextRootId = this.getNextTreeId(this.treeData, null)
      var node = {
        id: nextRootId,
        name: newName,
        children: []
      }
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
      var newName = this.getValidatedDirectoryName()
      if (!newName) return
      var parent = this.findNodeById(this.treeData, this.activeId)
      if (!parent) {
        this.$message && this.$message.warning('未找到当前目录')
        return
      }
      var parentDepth = this.getNodeDepthById(parent.id)
      if (parentDepth >= this.maxDepth - 1) {
        this.$message && this.$message.warning('目录层级最多支持两级')
        return
      }
      var nextChildId = this.getNextTreeId(parent.children, parent.id)
      var child = {
        id: nextChildId,
        name: newName,
        children: []
      }
      if (!parent.children) parent.children = []
      parent.children.push(child)
      this.selectNode(child)
      this.form.name = ''
      this.$message && this.$message.success('添加子目录成功')
    },
    handleSave() {
      var name = (this.form.name || '').trim()
      if (!this.activeId) {
        this.$message && this.$message.warning('请先选择目录')
        return
      }
      if (!name) {
        this.$message && this.$message.warning('目录名称不能为空')
        return
      }
      var node = this.findNodeById(this.treeData, this.activeId)
      if (!node) {
        this.$message && this.$message.warning('未找到当前目录')
        return
      }
      node.name = name
      this.$message && this.$message.success('保存修改成功')
    },
    handleDelete() {
      if (!this.activeId) {
        this.$message && this.$message.warning('请先选择目录')
        return
      }
      var removed = this.deleteNodeById(this.treeData, this.activeId)
      if (!removed) {
        this.$message && this.$message.warning('未找到可删除目录')
        return
      }
      var first = this.visibleNodesList[0]
      if (first) {
        this.selectNode(first)
      } else {
        this.activeId = null
        this.form.name = ''
      }
      this.$message && this.$message.success('删除目录成功')
    },
    /** 树项右侧 × 删除：递归删除该目录及其全部子节点 */
    handleDeleteNode(node) {
      if (!node || node.id == null) return
      var removed = this.deleteNodeById(this.treeData, node.id)
      if (!removed) {
        this.$message && this.$message.warning('未找到可删除目录')
        return
      }
      // 若删除的是当前选中节点，回退选择
      if (String(this.activeId) === String(node.id)) {
        var first = this.visibleNodesList[0]
        if (first) {
          this.selectNode(first)
        } else {
          this.activeId = null
          this.form.name = ''
        }
      }
      this.$message && this.$message.success('删除目录成功')
    },
    handleClearAll() {
      // el-popconfirm 确认后回调：同时清空当前目录树与对应场景的 Vuex 模板树
      this.treeData = []
      this.activeId = null
      this.form.name = ''
      // 按使用场景路由：模糊词生成清空 wordTemplate（不影响汇总要点/分析报告），
      // 汇总要点/分析报告清空共用的 template（不会波及模糊词回显）
      if (this.mode === 'word-edit') {
        this.$store.dispatch('wordTemplate/clearTemplate')
      } else {
        this.$store.dispatch('template/clearTemplate')
      }
      this.$message && this.$message.success('目录已清空')
    },
    handleSaveTree() {
      // 汇总要点生成、模糊词生成、分析报告生成，目录均不能为空
      if (!Array.isArray(this.treeData) || this.treeData.length === 0) {
        this.$message && this.$message.warning('目录不能为空')
        return
      }
      // if (!this.fileName) {
      //   this.$message && this.$message.warning('请先上传Word文件后再保存目录')
      //   return
      // }
      // 点击保存时，把弹窗内部当前的文件名、目录树、目录词一起交给父组件。
      var payload = {
        wordFileName: this.fileName,
        tree: this.normalizeTree(this.treeData),
        words: this.collectTreeNames(this.treeData)
      }
      // console.log('保存目录结构，payload=', payload)
      this.$emit('save-template', payload)
      this.$emit('close-template')
      // this.$message && this.$message.success('目录结构保存成功')
    },
    collectTreeNames(nodes) {
      var result = []
      var walk = function (items) {
        if (!Array.isArray(items)) return
        items.forEach(function (item) {
          if (item && item.name) result.push(String(item.name).trim())
          walk(item && item.children)
        })
      }
      walk(nodes)
      return result.filter(Boolean)
    },
    findNodeById(nodes, id) {
      if (!nodes || !nodes.length) return null
      for (var i = 0; i < nodes.length; i++) {
        if (String(nodes[i].id) === String(id)) return nodes[i]
        var child = this.findNodeById(nodes[i].children, id)
        if (child) return child
      }
      return null
    },
    deleteNodeById(nodes, id) {
      if (!nodes || !nodes.length) return false
      for (var i = 0; i < nodes.length; i++) {
        if (String(nodes[i].id) === String(id)) {
          nodes.splice(i, 1)
          return true
        }
        if (this.deleteNodeById(nodes[i].children, id)) {
          return true
        }
      }
      return false
    },
    handleUploadClick() {
      // 用 ref 精确触发当前实例的 file input，避免多实例下 for="id" 误触其他实例
      this.$refs.fileInput && this.$refs.fileInput.click()
    },
    handleFileChange(e) {
      var files = e.target && e.target.files
      var file = files && files[0] ? files[0] : null
      if (!file) {
        this.fileName = ''
        this.hasUploadedWord = false
        return
      }
      var name = String(file.name || '').toLowerCase()
      var isWord = name.endsWith('.doc') || name.endsWith('.docx')
      if (!isWord) {
        this.$message && this.$message.warning('仅支持上传Word文件')
        if (e && e.target) e.target.value = ''
        return
      }
      this.fileName = file.name
      this.hasUploadedWord = true
      // 先重置 input value，确保下次选同样文件也能触发 change 事件（必须同步执行）
      if (e && e.target) e.target.value = ''
      // 上传 Word 文件解析生成目录树
      const formData = new FormData()
      formData.append('file', file)
      formData.append('max_level', 2) // 让后端只返回两级目录，减轻前端处理压力
      formData.append('body_delimiter', '、') // 约定用、分隔目录层级，适配后端基于换行解析的逻辑
      axios
        // .post('/renda-api/doc-parser/upload', formData, {
        .post('/task/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then((res) => {
          console.log(res)
          if (res.data.code === 0) {
            console.log(res.data.data)
            this.loadDirectoryTreeFromJson(res.data)
            this.$message && this.$message.success('已按模板加载目录结构')
          } else {
            this.$message.error(res.data?.message || '文件上传失败，请重试')
          }
        })
        .catch((error) => {
          console.error('上传失败，error=', error)
          this.$message && this.$message.error('文件上传失败，请重试')
        })
      // this.$message && this.$message.success('已按模板加载目录结构')
    }
  }
}
</script>

<style scoped>
.sczdymb-wrap {
  width: 100%;
  min-height: 590px;
  display: flex;
  box-sizing: border-box;
  padding: 12px;
  background: #f9f9f9;
}
.sczdymb-wrap > * {
  margin-right: 20px;
}
.sczdymb-wrap > *:last-child {
  margin-right: 0;
}

.layout-left {
  width: 33%;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.layout-right {
  flex: 1;
  display: flex;
  flex-direction: column;
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
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.head-btn-group {
  display: flex;
  align-items: center;
}
.head-btn-group > * {
  margin-right: 8px;
}
.head-btn-group > *:last-child {
  margin-right: 0;
}

.card-title {
  margin: 0;
  font-size: 15px;
  line-height: 1.25;
  font-weight: 700;
  color: #c9190b;
}

.tree-list {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  flex: 1;
  min-height: 0;
  max-height: calc(460px - 48px);
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

.tree-footer-btns {
  margin-top: 12px;
  min-height: 36px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}
.tree-footer-btns > * {
  margin-right: 8px;
}
.tree-footer-btns > *:last-child {
  margin-right: 0;
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
}

.tree-item:hover {
  background: #f8e8e6;
}

.tree-item.active {
  background: #f3d8d4;
}

/* 树项删除按钮：默认隐藏，悬停高亮时在右侧显示 */
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
  font-size: 16px;
  color: #1f2d3d;
}

.tag-current {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 12px;
  background: #f8e8e6;
  color: #c9190b;
  font-size: 12px;
}

.editor-card {
  min-height: 200px;
}

.form-item {
  margin-top: 16px;
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

.btn-row {
  margin-top: 22px;
  display: flex;
  gap: 14px;
}

.btn {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0 16px;
  height: 34px;
  line-height: 32px;
  font-size: 11px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-sm {
  height: 32px;
  line-height: 30px;
  font-size: 11px;
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

.upload-card {
  flex: 1;
}

.upload-area {
  margin-top: 16px;
  border: 1px dashed #dfb4af;
  border-radius: 10px;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fff;
}

.upload-icon {
  font-size: 48px;
  color: #c9190b;
}

.upload-tip {
  margin: 10px 0 14px;
  font-size: 15px;
  color: #647184;
}

.upload-trigger {
  display: inline-block;
  background: #fff;
  color: #c9190b;
  border: 1px solid #c9190b;
  border-radius: 4px;
  padding: 8px 20px;
  font-size: 12px;
}

.file-input {
  display: none;
}

.upload-file-name {
  margin-top: 12px;
  font-size: 14px;
  color: #3a4a61;
}

@media (max-width: 1200px) {
  .sczdymb-wrap {
    flex-direction: column;
  }

  .layout-left {
    width: 100%;
    min-width: auto;
  }
}
</style>

<style>
.el-message {
  z-index: 99999 !important;
}
</style>
