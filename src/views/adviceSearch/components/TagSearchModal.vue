<!--
 * @Description: 标签检索弹框 —— 检索条件 + 标签表格（一级/二级/三级标签列使用下拉框渲染）
 * 说明：标签数据暂为本地 mock，后端接口就绪后替换 fetchData() 即可。
-->
<template>
  <div>
    <div class="tag-search-mask" :class="{ show: visible }" @click="$emit('close')"></div>
    <div class="tag-search-modal" :class="{ show: visible }">
      <!-- 头部 -->
      <div class="tag-search-header">
        <div class="tag-search-title">标签检索</div>
        <span class="tag-search-close" @click="$emit('close')">×</span>
      </div>

      <!-- 检索条件 -->
      <div class="tag-search-form">
        <div class="tag-search-query-box">
          <div class="tag-search-item">
          <label class="tag-search-label">全量标签检索：</label>
          <input v-model="query.allTag" class="tag-search-input" placeholder="请输入" type="text" @keyup.enter="handleSearch" />
          </div>
          <div class="tag-search-item">
          <label class="tag-search-label">操作时间：</label>
          <input v-model="query.operateTime" class="tag-search-input" placeholder="请输入" type="text" @keyup.enter="handleSearch" />
          </div>
          <div class="tag-search-item">
            <label class="tag-search-label">操作人：</label>
            <input v-model="query.operator" class="tag-search-input" placeholder="请输入" type="text" @keyup.enter="handleSearch" />
          </div>
          <div class="tag-search-item">
            <label class="tag-search-label">一级标签检索：</label>
            <input v-model="query.level1" class="tag-search-input" placeholder="请输入" type="text" @keyup.enter="handleSearch" />
          </div>
          <div class="tag-search-item">
            <label class="tag-search-label">二级标签检索：</label>
            <input v-model="query.level2" class="tag-search-input" placeholder="请输入" type="text" @keyup.enter="handleSearch" />
          </div>
          <div class="tag-search-item">
            <label class="tag-search-label">三级标签检索：</label>
            <input v-model="query.level3" class="tag-search-input" placeholder="请输入" type="text" @keyup.enter="handleSearch" />
          </div>
        </div>
        <div class="tag-search-actions-box">
          <button class="btn btn-sm" @click="handleSearch">开始检索</button>
        </div>
      </div>

      <!-- 标签表格 -->
      <div class="tag-search-table-wrap">
        <el-table v-loading="loading" element-loading-text="正在加载中" :data="pagedRows" border size="mini" empty-text="暂无数据" header-cell-class-name="tag-search-header-cell">
          <el-table-column type="index" label="序号" width="68" align="center"></el-table-column>
          <el-table-column label="一级标签" min-width="150">
            <template slot-scope="{ row }">
              <el-select v-model="row.level1" class="tag-row-select" size="mini" placeholder="请选择" @change="onRowLevel1Change(row)">
                <el-option v-for="opt in level1Options" :key="opt" :label="opt" :value="opt"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="二级标签" min-width="150">
            <template slot-scope="{ row }">
              <el-select v-model="row.level2" class="tag-row-select" size="mini" placeholder="请选择" @change="onRowLevel2Change(row)">
                <el-option v-for="opt in level2OptionsOf(row.level1)" :key="opt" :label="opt" :value="opt"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="三级标签" min-width="150">
            <template slot-scope="{ row }">
              <el-select v-model="row.level3" class="tag-row-select" size="mini" placeholder="请选择" @change="onRowLevel3Change(row)">
                <el-option v-for="opt in level3OptionsOf(row.level2)" :key="opt" :label="opt" :value="opt"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="firstSaveTime" label="首次保存时间" width="108"></el-table-column>
          <el-table-column prop="operator" label="操作人" width="80"></el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template slot-scope="{ row }">
              <button class="btn btn-outline btn-sm" @click="handleQuote(row)">查看</button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 + 底部操作 -->
      <div class="tag-search-footer">
        <el-pagination
          class="tag-search-pagination"
          :current-page="page"
          :page-size="pageSize"
          :total="filteredRows.length"
          layout="total, prev, pager, next"
          background
          @current-change="handlePageChange"
        ></el-pagination>
        <!-- <button class="btn btn-outline btn-sm" @click="$emit('close')">取消</button> -->
      </div>
    </div>
  </div>
</template>

<script>
/* ==================== 标签 mock 数据（待后端接口替换） ==================== */
const LEVEL1_OPTIONS = ['经济建设', '政治建设', '文化建设', '社会建设', '生态文明建设']

const LEVEL2_MAP = {
  '经济建设': ['财政金融', '产业发展', '基础设施', '营商环境', '科技创新'],
  '政治建设': ['法治建设', '民主政治', '政府治理'],
  '文化建设': ['文化事业', '文化产业', '文化传承'],
  '社会建设': ['教育发展', '医疗卫生', '社会保障', '就业创业'],
  '生态文明建设': ['污染防治', '生态保护', '绿色低碳']
}

const LEVEL3_MAP = {
  '财政金融': ['税收政策', '金融服务', '债券管理'],
  '产业发展': ['现代农业', '先进制造', '数字经济', '现代服务业'],
  '基础设施': ['交通设施', '水利设施', '新基建'],
  '营商环境': ['简政放权', '市场监管', '对外开放'],
  '科技创新': ['基础研究', '成果转化', '人才引育'],
  '法治建设': ['立法工作', '执法监督', '司法公正'],
  '民主政治': ['人大监督', '政协协商', '基层民主'],
  '政府治理': ['数字政府', '政务服务', '廉洁政府'],
  '文化事业': ['公共文化', '文化惠民'],
  '文化产业': ['文旅融合', '文化品牌'],
  '文化传承': ['文物保护', '非遗传承', '古籍整理'],
  '教育发展': ['义务教育', '职业教育', '高等教育'],
  '医疗卫生': ['医疗资源', '公共卫生', '医疗保障'],
  '社会保障': ['养老服务', '住房保障', '社会救助'],
  '就业创业': ['稳就业', '技能培训', '创业扶持'],
  '污染防治': ['大气治理', '水污染治理', '土壤修复'],
  '生态保护': ['生态修复', '生物多样性', '国家公园'],
  '绿色低碳': ['碳达峰碳中和', '清洁能源', '节能降碳']
}

const MOCK_ROWS = [
  { tagName: '义务教育均衡发展', level1: '社会建设', level2: '教育发展', level3: '义务教育', createTime: '2026-07-20 10:30:00', creator: '张伟' },
  { tagName: '数字乡村建设', level1: '经济建设', level2: '产业发展', level3: '数字经济', createTime: '2026-07-20 11:05:00', creator: '李娜' },
  { tagName: '大气污染防治攻坚', level1: '生态文明建设', level2: '污染防治', level3: '大气治理', createTime: '2026-07-21 09:12:00', creator: '王强' },
  { tagName: '养老服务体系建设', level1: '社会建设', level2: '社会保障', level3: '养老服务', createTime: '2026-07-21 14:48:00', creator: '赵敏' },
  { tagName: '新基建投资布局', level1: '经济建设', level2: '基础设施', level3: '新基建', createTime: '2026-07-22 08:20:00', creator: '陈杰' },
  { tagName: '知识产权保护立法', level1: '政治建设', level2: '法治建设', level3: '立法工作', createTime: '2026-07-22 16:40:00', creator: '刘洋' },
  { tagName: '非遗传承进校园', level1: '文化建设', level2: '文化传承', level3: '非遗传承', createTime: '2026-07-23 10:15:00', creator: '孙丽' },
  { tagName: '清洁能源产业发展', level1: '生态文明建设', level2: '绿色低碳', level3: '清洁能源', createTime: '2026-07-23 15:33:00', creator: '周涛' },
  { tagName: '乡村医疗卫生补短板', level1: '社会建设', level2: '医疗卫生', level3: '医疗资源', createTime: '2026-07-24 09:50:00', creator: '吴敏' },
  { tagName: '高校毕业生就业帮扶', level1: '社会建设', level2: '就业创业', level3: '稳就业', createTime: '2026-07-24 13:26:00', creator: '郑凯' },
  { tagName: '智慧政务一网通办', level1: '政治建设', level2: '政府治理', level3: '数字政府', createTime: '2026-07-25 10:02:00', creator: '冯雪' },
  { tagName: '长江流域生态修复', level1: '生态文明建设', level2: '生态保护', level3: '生态修复', createTime: '2026-07-25 17:18:00', creator: '许光' }
]

export default {
  name: 'TagSearchModal',
  props: {
    visible: { type: Boolean, default: false }
  },
  emits: ['close', 'quote'],
  data() {
    return {
      level1Options: LEVEL1_OPTIONS,
      level2Map: LEVEL2_MAP,
      level3Map: LEVEL3_MAP,
      rows: [],
      loading: false,
      query: { allTag: '', operateTime: '', operator: '', level1: '', level2: '', level3: '' },
      page: 1,
      pageSize: 10
    }
  },
  watch: {
    visible(val) {
      // 每次打开重置到初始状态
      if (val) {
        this.handleReset()
      }
    }
  },
  computed: {
    // 检索条件下的结果集（本地 mock 过滤，接口就绪后改由 fetchData 返回）
    filteredRows() {
      const q = this.query
      return this.rows.filter(row => {
        if (q.allTag && ![row.tagName, row.level1, row.level2, row.level3].join(' ').includes(q.allTag)) return false
        if (q.operateTime && !String(row.firstSaveTime).includes(q.operateTime)) return false
        if (q.operator && !String(row.operator).includes(q.operator)) return false
        if (q.level1 && !row.level1.includes(q.level1)) return false
        if (q.level2 && !row.level2.includes(q.level2)) return false
        if (q.level3 && !row.level3.includes(q.level3)) return false
        return true
      })
    },
    pagedRows() {
      const start = (this.page - 1) * this.pageSize
      return this.filteredRows.slice(start, start + this.pageSize)
    },
    // 检索条件里的二级标签下拉：未选一级时展示全部二级
    level2SearchOptions() {
      return this.level2OptionsOf(this.query.level1)
    },
    // 检索条件里的三级标签下拉：未选二级时展示全部三级
    level3SearchOptions() {
      return this.level3OptionsOf(this.query.level2)
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    /* ====== 标签层级选项 ====== */
    // 某一级标签下的二级标签选项；未选一级时返回全部二级标签
    level2OptionsOf(level1) {
      if (level1 && this.level2Map[level1]) return this.level2Map[level1]
      return Object.values(this.level2Map).flat()
    },
    // 某一级标签下的三级标签选项；未选二级时返回全部三级标签
    level3OptionsOf(level2) {
      if (level2 && this.level3Map[level2]) return this.level3Map[level2]
      return Object.values(this.level3Map).flat()
    },

    /* ====== 表格内下拉变更：选中上一级后清空下一级，避免层级不匹配 ====== */
    onRowLevel1Change(row) {
      row.level2 = ''
      row.level3 = ''
    },
    onRowLevel2Change(row) {
      row.level3 = ''
    },
    onRowLevel3Change() {},

    /* ====== 交互 ====== */
    fetchData() {
      this.loading = true
      window.setTimeout(() => {
        this.rows = Array.from({ length: 100 }, (_, index) => {
          const row = MOCK_ROWS[index % MOCK_ROWS.length]
          return {
            ...row,
            firstSaveTime: row.firstSaveTime || row.createTime.split(' ')[0].replace(/-/g, '/'),
            operator: row.operator || row.creator
          }
        })
        this.loading = false
      }, 2000)
    },
    handleSearch() {
      this.page = 1
    },
    handleReset() {
      this.query = { allTag: '', operateTime: '', operator: '', level1: '', level2: '', level3: '' }
      this.page = 1
    },
    handlePageChange(page) {
      this.page = page
    },
    handleQuote(row) {
      this.$emit('quote', row)
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
/* ------ mask ------ */
.tag-search-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9998;
  display: none;
}
.tag-search-mask.show {
  display: block;
}

/* ------ modal ------ */
.tag-search-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1140px;
  max-width: calc(100vw - 40px);
  max-height: 90vh;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  display: none;
  flex-direction: column;
  overflow: hidden;
}
.tag-search-modal.show {
  display: flex;
}

/* ------ header ------ */
.tag-search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background: #fff;
}
.tag-search-title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}
.tag-search-close {
  cursor: pointer;
  font-size: 20px;
  color: #666;
  line-height: 1;
}
.tag-search-close:hover {
  color: var(--primary-red, #c9190b);
}

/* ------ 检索条件 ------ */
.tag-search-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  align-items: center;
  padding: 2px 34px 2px;
}
.tag-search-form > * {
  margin-right: 16px;
}
.tag-search-form > *:last-child {
  margin-right: 0;
}
.tag-search-query-box,
.tag-search-actions-box {
  /* border: 1px solid #e5e7eb; */
  background: #fff;
  min-height: 94px;
}
.tag-search-query-box {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: center;
  padding: 12px 18px;
}
.tag-search-query-box > * {
  margin-right: 20px;
  margin-bottom: 14px;
}
.tag-search-query-box > *:nth-child(3n) {
  margin-right: 0;
}
.tag-search-query-box > *:last-child {
  margin-bottom: 0;
}
.tag-search-item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}
.tag-search-label {
  flex: 0 0 92px;
  font-size: 12px;
  color: #333;
  white-space: nowrap;
  text-align: right;
  margin-right: 8px;
}
.tag-search-input {
  flex: 1;
  min-width: 0;
  max-width: 166px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 4px;
  font-size: 12px;
  outline: none;
}
.tag-search-input:focus {
  border-color: var(--primary-red, #c9190b);
}
.tag-search-select {
  width: 150px;
}
.tag-search-actions-box {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ------ 表格 ------ */
.tag-search-table-wrap {
  flex: 1;
  overflow: auto;
  padding: 4px 14px 0;
  min-height: 300px;
}
:deep(.el-table) {
  width: 100% !important;
  table-layout: fixed;
}
.tag-name-text {
  font-weight: 600;
}
.tag-row-select {
  width: 100%;
}
:deep(.tag-search-header-cell) {
  background: var(--table-header, #f7f8fa) !important;
  color: #333;
  font-weight: bold;
  text-align: center;
}
:deep(.el-table th),
:deep(.el-table td) {
  text-align: center;
}
:deep(.tag-row-select .el-input__inner) {
  text-align: center;
}

/* ------ 底部 ------ */
.tag-search-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

@media (max-width: 900px) {
  .tag-search-form {
    grid-template-columns: 1fr;
  }
  .tag-search-query-box {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .tag-search-actions-box {
    min-height: 52px;
  }
}

@media (max-width: 560px) {
  .tag-search-query-box {
    grid-template-columns: 1fr;
  }
  .tag-search-modal {
    max-width: calc(100vw - 16px);
  }
}
</style>
