<template>
  <div>
    <div class="search-wrap">
      <div class="search-controls">
        <el-input placeholder="请输入词、语句、篇" v-model="input3" class="search-box">
          <el-button slot="append" icon="el-icon-search" @click="onSearch">搜索</el-button>
        </el-input>

        <div class="upload-controls">
          <input type="file" ref="fileInput" style="display:none" @change="onFilesSelected" multiple />
          <el-button type="primary" icon="el-icon-upload2" @click="openFileDialog">上传文件</el-button>
        </div>
      </div>

      <div class="upload-list" v-if="uploadedFiles.length">
        <el-row :gutter="8" class="upload-row">
          <el-col :span="24">
            <div class="upload-item" v-for="(f, idx) in uploadedFiles" :key="f.id">
              <div class="file-meta">
                <i v-if="f.isImage" class="el-icon-picture file-icon"></i>
                <span class="file-name" :title="f.name">{{ f.name }}</span>
                <span class="file-size">{{ f.humanSize }}</span>
              </div>
              <div class="file-actions">
                <el-button type="text" size="mini" @click="previewFile(f)" v-if="f.isImage">预览</el-button>
                <el-button type="text" size="mini" @click="removeFile(idx)">删除</el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
    <!-- <el-select v-model="select" placeholder="请选择">
      <el-option label="餐厅名" value="1"></el-option>
      <el-option label="订单号" value="2"></el-option>
      <el-option label="用户电话" value="3"></el-option>
    </el-select> -->
    <div style="margin: 0 20px;padding: 0 20px;border:1px solid #ccc;border-radius:4px;">
      <div class="results">
        <div class="hotspot-select">
          <div class="hotspot-label">热点问题：</div>
          <el-select v-model="selectedHotspots" multiple filterable collapse-tags placeholder="选择热点问题（可多选）" class="hotspot-dropdown">
            <el-option v-for="h in hotspots" :key="h.value" :label="h.value" :value="h.value">{{ h.label }}</el-option>
          </el-select>
        </div>

        <div class="results-title">输出的结果展示：拓展的词、语句、片段（可勾选作为二次查询条件）</div>

        <div class="category-select">
          <div class="category-label">选择库：</div>
          <el-checkbox-group v-model="selectedCategories">
            <el-checkbox v-for="c in categories" :key="c.value" :label="c.value">{{ c.label }}</el-checkbox>
          </el-checkbox-group>
        </div>

        <el-checkbox-group v-model="selectedExpanded" class="expanded-list">
          <el-checkbox v-for="item in expandedItems" :key="item.id" :label="item.text" :disabled="!selectedCategories.length">
            {{ item.text }}
          </el-checkbox>
        </el-checkbox-group>

        <div class="expanded-actions">
          <el-button type="primary" size="small" @click="secondarySearch">以所选项二次搜索</el-button>
          <el-button size="small" @click="clearExpandedSelection">清除选择</el-button>
        </div>
      </div>

      <div class="table-toolbar">
        <div class="total-count">共 <strong>{{ totalCount }}</strong> 条</div>
        <div class="toolbar-actions">
          <el-button :type="selectedRows.length ? 'primary' : 'default'" :disabled="selectedRows.length === 0" @click="fetchSummaries" :loading="summaryLoading">汇总要点汇总</el-button>
          <el-button :type="selectedRows.length ? 'primary' : 'default'" :disabled="selectedRows.length === 0" :loading="summaryLoading">输出代表</el-button>
          <el-button :type="selectedRows.length ? 'primary' : 'default'" :disabled="selectedRows.length === 0" :loading="summaryLoading">保存记录</el-button>
        </div>
      </div>

      <el-table :data="pagedData" stripe style="width: 100%; margin-top: 8px;" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column type="index" label="序号" width="80"></el-table-column>
        <el-table-column prop="jybh" label="建议编号" width="120"></el-table-column>
        <el-table-column prop="title" label="标题"></el-table-column>
        <el-table-column prop="session" label="届次" width="120"></el-table-column>
        <el-table-column prop="representative" label="代表" width="160"></el-table-column>
        <el-table-column prop="delegation" label="代表团" width="160"></el-table-column>
        <el-table-column prop="cbdw" label="承办单位" width="160"></el-table-column>
        <el-table-column prop="reply" label="答复字段"></el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          :current-page.sync="currentPage"
          :page-size="pageSize"
          layout="prev, pager, next, jumper"
          :total="totalCount"
          @current-change="onPageChange"
        >
        </el-pagination>
      </div>
    </div>
    <el-dialog :visible.sync="summaryDialogVisible" width="70%" :before-close="() => (summaryDialogVisible = false)">
      <span slot="title">汇总要点汇总（{{ summaries.length }} 篇）</span>
      <div class="summary-list">
        <div v-for="(s, idx) in summaries" :key="idx" class="summary-article">
          <h3>{{ s.title }}</h3>
          <div v-for="(p, pi) in s.paragraphs" :key="pi" class="summary-paragraph">{{ p }}</div>
          <el-divider></el-divider>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="summaryDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { searchZF } from '../../api/login'
import DebounceHelper from '../../utils/classes/DebounceHelper'

export default {
  components: {},
  data () {
    return {
      // 原始表格数据（全部数据）
      allData: [
        { title: '关于加强环保立法的建议', jybh: '001', representative: '肖某某', cbdw: '中央某某机关', session: '第十三届', delegation: '代表团A', reply: '已转交相关部门处理', source: '建议库' },
        { title: '关于提升教育质量的提案', session: '第十二届', delegation: '代表团B', reply: '相关部门正在调研', source: '议案库' },
        { title: '关于农村交通改善的建议', session: '第十三届', delegation: '代表团C', reply: '已列入年度计划', source: '大会简报' }
      ],
      // 当前展示的表格数据（可以被筛选）
      tableData: [],
      // 拓展项，示例数据；真实场景应由后端或扩展算法生成
      expandedItems: [
        { id: 1, text: '环保' },
        { id: 2, text: '教育' },
        { id: 3, text: '交通' },
        { id: 4, text: '立法' },
        { id: 5, text: '调研' }
      ],
      // 可选的库类型（作为拓展词的前置条件）
      categories: [
        { label: '议案库', value: '议案库' },
        { label: '建议库', value: '建议库' },
        { label: '大会简报', value: '大会简报' }
      ],
      selectedCategories: [],
      // 热点下拉多选项
      hotspots: [
        { label: '环境', value: '环境' },
        { label: '安全', value: '安全' },
        { label: '教育', value: '教育' },
        { label: '交通', value: '交通' },
        { label: '医疗', value: '医疗' }
      ],
      selectedHotspots: [],
      selectedExpanded: [],
      select: '1',
      input3: '污水',
      // 分页与选择状态
      currentPage: 1,
      pageSize: 10,
      selectedRows: [],
      // 汇总要点相关
      summaryDialogVisible: false,
      summaries: [],
      summaryLoading: false,
      // 已选择的上传文件列表
      uploadedFiles: []
    }
  },
  computed: {
    // 总条数：用于顶部统计与分页器
    totalCount() {
      return this.tableData.length
    },
    // 当前页数据切片：前端分页展示
    pagedData() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.tableData.slice(start, start + this.pageSize)
    }
  },
  created() {
    this.onSearch = DebounceHelper.debounce(this.onSearch, 500, this)
    this.fetchSummaries = DebounceHelper.debounce(this.fetchSummaries, 500, this)
  },
  mounted () {
    // 初始化表格显示
    this.onSearch.flush()
  },
  methods: {
    handleSelectionChange(rows) {
      this.selectedRows = rows || []
    },

    onPageChange(page) {
      this.currentPage = page
    },

    async fetchSummaries() {
      if (!this.selectedRows || this.selectedRows.length === 0) return
      this.summaryLoading = true
      try {
        // TODO: 将此处替换为真实的后端 API 调用。
        // 示例：const res = await api.post('/summaries', { ids: this.selectedRows.map(r => r.id) })
        // 下面用模拟数据代替，按每个选中项生成若干段落
        // 这里模拟汇总要点接口耗时，保证 loading 交互可见
        await new Promise(resolve => setTimeout(resolve, 700))
        this.summaries = this.selectedRows.map(r => {
          // 简单按句号拆分为段落，如果没有句号则做为一段
          const text = (r.reply || '')
          const parts = text.split('。').filter(p => p && p.trim())
          const paragraphs = parts.length ? parts.map(p => p + '。') : [text || '无汇总要点内容']
          return { title: r.title || '未命名', paragraphs }
        })
        this.summaryDialogVisible = true
      } catch (err) {
        this.$message && this.$message({ message: '汇总要点请求失败', type: 'error' })
      } finally {
        this.summaryLoading = false
      }
    },
    onSearch() {
      // 每次搜索，重置为第一页
      this.currentPage = 1

      searchZF({ text: this.input3 }).then((res) => {
        // 一次拓展结果已返回
      }).catch(function (err) {
        console.error('[adviceSearch] 一次拓展接口异常：', err)
      })
      // getFajiInfo({ law_name: '污水' }).then(res => {
      //   console.log(res)
      // })
      // 第一步：按搜索词过滤标题/答复，得到基础结果集
      const kw = (this.input3 || '').trim()
      if (!kw) {
        // 如果没有输入关键字，显示所有数据
        this.tableData = this.allData.slice()
      } else {
        const k = kw.toLowerCase()
        this.tableData = this.allData.filter(r => (r.title && r.title.toLowerCase().includes(k)) || (r.reply && r.reply.toLowerCase().includes(k)))
      }

      // 第二步：叠加热点过滤，命中任一热点关键词即保留
      if (this.selectedHotspots && this.selectedHotspots.length) {
        const hs = this.selectedHotspots.map(h => h.toLowerCase())
        this.tableData = this.tableData.filter(r => {
          const txt = ((r.title || '') + ' ' + (r.reply || '')).toLowerCase()
          return hs.some(h => txt.includes(h))
        })
      }

      // 第三步：根据关键词生成/回退拓展项，用于后续二次搜索
      const generated = []
      if (kw.includes('环保')) generated.push({ id: 1, text: '环保' })
      if (kw.includes('教育')) generated.push({ id: 2, text: '教育' })
      if (generated.length === 0) {
        // 保持原有示例拓展项
        this.expandedItems = [
          { id: 1, text: '环保' },
          { id: 2, text: '教育' },
          { id: 3, text: '交通' },
          { id: 4, text: '立法' },
          { id: 5, text: '调研' }
        ]
      } else {
        this.expandedItems = generated
      }
      // 清空已选
      this.selectedExpanded = []
    },

    secondarySearch() {
      if (!this.selectedCategories || this.selectedCategories.length === 0) {
        this.$message && this.$message({ message: '请先选择至少一个库（议案库/建议库/大会简报）', type: 'warning' })
        return
      }
      if (!this.selectedExpanded || this.selectedExpanded.length === 0) {
        this.$message && this.$message({ message: '请先选择至少一项拓展内容', type: 'warning' })
        return
      }
      // 二次搜索，重置为第一页
      this.currentPage = 1
      // 二次搜索：同时满足”来源库匹配 + 任一拓展词命中”
      const sels = this.selectedExpanded.map(s => s.toLowerCase())
      this.tableData = this.allData.filter(r => {
        if (!r.source || !this.selectedCategories.includes(r.source)) return false
        const txt = ((r.title || '') + ' ' + (r.reply || '')).toLowerCase()
        return sels.some(s => txt.includes(s))
      })
    },

    clearExpandedSelection() {
      this.selectedExpanded = []
      // 恢复表格为当前关键词初次搜索结果或全部
      this.onSearch()
    },

    openFileDialog() {
      this.$refs.fileInput && this.$refs.fileInput.click()
    },

    onFilesSelected(e) {
      const files = e.target.files || []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        // 为上传项生成稳定标识，便于列表渲染与删除定位
        const id = Date.now() + '_' + i + '_' + file.name
        // 图片文件创建本地预览 URL；非图片仅记录元信息
        const isImage = file.type && file.type.startsWith('image/')
        const url = isImage ? URL.createObjectURL(file) : null
        this.uploadedFiles.push({ id, name: file.name, size: file.size, humanSize: this.humanFileSize(file.size), isImage, url, raw: file })
      }
      // 清空 input，支持重复选择同一个文件
      e.target.value = ''
    },

    removeFile(idx) {
      const f = this.uploadedFiles[idx]
      if (f && f.url) {
        URL.revokeObjectURL(f.url)
      }
      this.uploadedFiles.splice(idx, 1)
    },

    previewFile(f) {
      if (!f || !f.url) return
      const w = window.open('')
      if (w) {
        w.document.write(`<title>${f.name}</title><img src="${f.url}" style="max-width:100%;height:auto;display:block;margin:0 auto;"/>`)
      }
    },

    humanFileSize(size) {
      if (size === 0) return '0 B'
      // 1024 进制格式化文件大小（B/KB/MB/GB/TB）
      const i = Math.floor(Math.log(size) / Math.log(1024))
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      return (size / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + sizes[i]
    }
  }
}

</script>

<style scoped>
.search-wrap{
  display: flex;
  justify-content: center;
  margin: 16px 0;
}
.search-box{
  width: 50%;
  max-width: 900px;
  min-width: 260px;
}
/* search controls: input + upload button */
.search-controls{
  display:flex;
  align-items:center;
}
.search-controls > * {
  margin-right: 12px;
}
.search-controls > *:last-child {
  margin-right: 0;
}
.category-select{ display:flex; align-items:center; margin:8px 0 }
.category-select > * {
  margin-right: 10px;
}
.category-select > *:last-child {
  margin-right: 0;
}
.category-label{ color:#606266; margin-right:6px }
.upload-controls{ display:flex; align-items:center }
.upload-list{ width:100%; max-width:900px; margin-top:10px }
.upload-row{ display:block }
.upload-item{ display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:#fff; border:1px solid #eef3f8; border-radius:6px; margin-bottom:8px }
.file-meta{ display:flex; align-items:center }
.file-meta > * {
  margin-right: 10px;
}
.file-meta > *:last-child {
  margin-right: 0;
}
.file-icon{ font-size:18px; color:#909399 }
.file-name{ color:#303133; max-width:560px; display:inline-block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.file-size{ color:#909399; font-size:12px; margin-left:8px }
.file-actions{ display:flex }
.file-actions > * {
  margin-right: 8px;
}
.file-actions > *:last-child {
  margin-right: 0;
}
.hotspot-select{ display:flex; align-items:center; margin:8px 0 }
.hotspot-select > * {
  margin-right: 8px;
}
.hotspot-select > *:last-child {
  margin-right: 0;
}
.hotspot-label{ color:#606266 }
.hotspot-dropdown{ min-width:200px }
/* table toolbar */
.table-toolbar{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-top: 12px;
}
.total-count{ color:#333 }
.toolbar-actions{ display:flex }
.toolbar-actions > * {
  margin-right: 8px;
}
.toolbar-actions > *:last-child {
  margin-right: 0;
}
.pagination-wrap{ display:flex; justify-content:flex-end; padding:12px 0 }
.summary-list{ max-height:60vh; overflow:auto }
.summary-article{ margin-bottom:12px }
.summary-paragraph{ margin:8px 0; line-height:1.6 }
@media (max-width: 600px){
  .search-box{
    width: 90%;
  }
  .search-controls{ flex-direction:column; gap:8px }
  .upload-list{ width:90% }
}
</style>
