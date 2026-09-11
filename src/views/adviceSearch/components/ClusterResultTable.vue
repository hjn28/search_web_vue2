<template>
  <div>
    <div v-if="tableData.length" ref="tableWrap" class="result-table-container">
      <table class="result-table">
        <thead>
          <tr>
            <th><input type="checkbox" :checked="isAllChecked" @change="toggleCheckAll($event)" /></th>
            <th>序号</th>
            <th>
              建议编号
              <!-- <span class="sort-switch">
                <button class="sort-btn" :class="{ active: suggestionSortOrder === 'asc' }" @click="setSuggestionSort('asc')"><i class="el-icon-arrow-up"></i></button>
                <button class="sort-btn" :class="{ active: suggestionSortOrder === 'desc' }" @click="setSuggestionSort('desc')"><i class="el-icon-arrow-down"></i></button>
              </span> -->
            </th>
            <th>标题</th>
            <th>届次</th>
            <th>代表</th>
            <th>代表团</th>
            <!-- <th>标签</th> -->
            <th class="action-col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in pagedData" :key="item.id" :class="{ 'row-disabled': item.disabled }">
            <td><input type="checkbox" :checked="selectedIds.includes(item.id)" :disabled="item.disabled" @change="toggleRow(item.id, $event)" /></td>
            <td>{{ (pagination.page - 1) * pagination.page_size + index + 1 }}</td>
            <td>{{ item.id }}</td>
            <td :title="item.title">{{ shortTitle(item.title) }}</td>
            <td>{{ item.session }}</td>
            <td>{{ item.representative }}</td>
            <td>{{ item.delegation }}</td>
            <!-- <td :class="taggingMap[item.id] ? 'tag-cell' : ''">
              <template v-if="taggingMap[item.id]">
                <span v-for="(tag, ti) in taggingMap[item.id].split('、')" :key="ti" class="tag-badge">{{ tag }}</span>
              </template>
            </td> -->
            <td class="action-col">
              <!-- <button class="btn btn-outline btn-sm action-btn" @click="onOpenBq(item)">标签</button> -->
              <button class="btn btn-outline btn-sm action-btn" @click="onShowDetail(item)">详情</button>
              <!-- 启用/禁用胶囊：已禁用显示"启用"（红色），启用中显示"禁用"（灰色），点击切换 -->
              <img
                v-if="item.disabled"
                class="toggle-state-icon"
                src="~@/assets/img/qiyong.svg"
                alt="启用"
                title="点击启用"
                @click="enableRow(item)"
              />
              <img
                v-else
                class="toggle-state-icon"
                src="~@/assets/img/jinyong.svg"
                alt="禁用"
                title="点击禁用"
                @click="disableRow(item)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="result-empty">{{ hasSearched ? '暂无数据' : '暂无数据，请先检索' }}</div>
    <div class="pagination">
      <el-pagination small background layout="total, prev, pager, next, sizes, jumper"
        :total="pagination.total" :current-page="pagination.page" :page-size="pagination.page_size"
        :page-sizes="[10, 20, 50, 100, 200, 400]"
        @current-change="handlePageChange" @size-change="handlePageSizeChange" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClusterResultTable',
  props: {
    tableData: { type: Array, default: () => [] },
    pagination: { type: Object, default: () => ({ page: 1, page_size: 10, total: 0 }) },
    selectedIds: { type: Array, default: () => [] },
    taggingMap: { type: Object, default: () => ({}) },
    hasSearched: { type: Boolean, default: false }
  },
  emits: ['update:selected-ids', 'update:pagination', 'view-detail', 'open-bq'],
  data() {
    return {
      suggestionSortOrder: 'asc',
      fixedTableHeight: 0 // 首次渲染（每页 10 条）后固定的表格区域高度
    }
  },
  computed: {
    isAllChecked() {
      const enabled = this.pagedData.filter(item => !item.disabled).map(item => item.id).filter(Boolean)
      return enabled.length > 0 && enabled.every(id => this.selectedIds.includes(id))
    },
    pagedData() {
      const start = (this.pagination.page - 1) * this.pagination.page_size
      return this.tableData.slice(start, start + this.pagination.page_size)
    }
  },
  mounted() {
    this.$nextTick(() => this.fixTableHeight())
  },
  watch: {
    // 检索结果返回后（首次渲染，每页 10 条）测量并固定表格高度
    tableData() {
      this.$nextTick(() => this.fixTableHeight())
    }
  },
  methods: {
    toggleRow(id, e) {
      // 当 id 为 undefined/null 时，selectedIds.includes(item.id) 会匹配所有行
      if (id == null) {
        console.warn('[toggleRow] 跳过无效 id:', id)
        return
      }
      const row = this.tableData.find(item => item.id === id)
      if (row && row.disabled) return
      const updated = [...this.selectedIds]
      if (e.target.checked) {
        if (!updated.includes(id)) updated.push(id)
      } else {
        const idx = updated.indexOf(id)
        if (idx > -1) updated.splice(idx, 1)
      }
      this.$emit('update:selected-ids', updated)
    },
    toggleCheckAll(e) {
      let updated = [...this.selectedIds]
      const currentIds = this.pagedData.filter(item => !item.disabled).map(item => item.id).filter(Boolean)
      if (e.target.checked) {
        updated = [...new Set([...updated, ...currentIds])]
      } else {
        const set = new Set(currentIds)
        updated = updated.filter(id => !set.has(id))
      }
      this.$emit('update:selected-ids', updated)
    },
    shortTitle(title) {
      const t = String(title || '')
      // 标题展示限定 25 字，超出部分由 :title 提示完整标题
      return t.length > 25 ? t.slice(0, 25) + '…' : t
    },
    setSuggestionSort(order) {
      this.suggestionSortOrder = order
      this.$emit('update:pagination', { ...this.pagination, page: 1 })
    },
    handlePageChange(page) {
      this.$emit('update:pagination', { ...this.pagination, page })
    },
    handlePageSizeChange(size) {
      this.$emit('update:pagination', { ...this.pagination, page: 1, page_size: size })
    },
    // 首次渲染（每页 10 条）后测量表格实际高度并固定为 max-height；
    // 之后切换每页条数时表格高度不变，超出部分在表格容器内出现纵向滚动条
    fixTableHeight() {
      if (this.fixedTableHeight) return
      const wrap = this.$refs.tableWrap
      if (!wrap) return
      this.fixedTableHeight = wrap.offsetHeight
      wrap.style.maxHeight = this.fixedTableHeight + 'px'
    },
    onOpenBq(item) {
      // 打开标签弹窗，传递当前行数据
      this.$emit('open-bq', item)
    },
    onShowDetail(item) {
      this.$emit('view-detail', item)
    },
    enableRow(row) {
      if (row) row.disabled = false
    },
    disableRow(row) {
      if (!row) return
      row.disabled = true
      if (row.id && this.selectedIds.includes(row.id)) {
        this.$emit('update:selected-ids', this.selectedIds.filter(v => v !== row.id))
      }
    }
  }
}
</script>

<style scoped>
/* 启用/禁用胶囊图标：按比例缩小并垂直居中，与相邻按钮间距一致 */
.toggle-state-icon {
  height: 20px;
  width: auto;
  cursor: pointer;
  vertical-align: middle;
  margin-right: 8px;
}
.action-col {
  width: 140px;
}
.action-col .btn {
  margin-right: 10px;
}
</style>
