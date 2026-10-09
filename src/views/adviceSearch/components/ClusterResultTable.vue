<template>
  <div class="cluster-result-table">
    <div v-if="tableData.length" ref="tableWrap" class="result-table-container">
      <table class="result-table">
        <thead>
          <tr>
            <th><input type="checkbox" :checked="isAllChecked" @change="toggleCheckAll($event)" /></th>
            <th>序号</th>
            <th>建议编号</th>
            <th>代表</th>
            <th>标题</th>
            <th>届次</th>
            <th>代表团</th>
            <th>承办单位</th>
            <th class="action-col">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in pagedData" :key="item.id" :class="{ 'row-disabled': item.disabled }">
            <td>
              <input type="checkbox" :checked="selectedIds.includes(item.id)" :disabled="item.disabled"
                @change="toggleRow(item.id, $event)" />
            </td>
            <td>{{ (pagination.page - 1) * pagination.page_size + index + 1 }}</td>
            <td>{{ item.id }}</td>
            <td>{{ item.representative }}</td>
            <td :title="item.title">{{ shortTitle(item.title) }}</td>
            <td>{{ item.session }}</td>
            <td>{{ item.delegation }}</td>
            <td :title="item.cbxx">{{ item.cbxx.length > 12 ? item.cbxx.slice(0, 12) + '...' : item.cbxx }}</td>
            <td class="action-col">
              <button class="btn btn-outline btn-sm action-btn" @click="onShowDetail(item)">详情</button>
              <img v-if="item.disabled" class="toggle-state-icon" src="~@/assets/img/qiyong.svg" alt="启用"
                title="点击启用" @click="enableRow(item)" />
              <img v-else class="toggle-state-icon" src="~@/assets/img/jinyong.svg" alt="禁用" title="点击禁用"
                @click="disableRow(item)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="result-empty">
      <!-- {{ hasSearched ? '暂无数据' : '暂无数据，请先检索' }} -->
      <EmptyState :title="hasSearched ? '暂无数据' : '暂无数据，请先检索'" />
    </div>
    <div v-if="tableData.length" class="pagination">
      <el-pagination small background layout="total, prev, pager, next, sizes, jumper" :total="pagination.total"
        :current-page="pagination.page" :page-size="pagination.page_size" :page-sizes="[15, 30, 60, 100, 200, 400]"
        @current-change="handlePageChange" @size-change="handlePageSizeChange" />
    </div>
  </div>
</template>

<script>
import EmptyState from '@/components/empty.vue'
export default {
  name: 'ClusterResultTable',
  components: { EmptyState },
  props: {
    tableData: { type: Array, default: () => [] },
    pagination: { type: Object, default: () => ({ page: 1, page_size: 15, total: 0 }) },
    selectedIds: { type: Array, default: () => [] },
    taggingMap: { type: Object, default: () => ({}) },
    hasSearched: { type: Boolean, default: false }
  },
  emits: ['update:selected-ids', 'update:pagination', 'view-detail', 'open-bq'],
  data() {
    return {
      suggestionSortOrder: 'asc'
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
      // 切换每页条数时，高度由 CSS flex 自动计算，分页始终贴底，数据仅在表格容器内滚动
      this.$emit('update:pagination', { ...this.pagination, page: 1, page_size: size })
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
/* 组件根节点：占满 result-content 的剩余高度，纵向 flex 布局 */
.cluster-result-table {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 外层不滚，只让内部表格容器滚 */
}

/* 表格容器：吃掉剩余高度，超出部分内部滚动 */
.cluster-result-table>.result-table-container {
  flex: 0 1 auto;    /* 关键：从 1 1 0 改为 0 1 auto */
  min-height: 0;
  max-height: 100%;  /* 关键：上限不超过父容器，内容多时被压缩触发滚动 */
  overflow: auto;
  margin-top: 10px;
}

/* 空状态：也撑满剩余空间，避免分页跳到中间 */
.cluster-result-table>.result-empty {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}

/* 分页：固定在底部，始终可见，不被压缩 */
.cluster-result-table>.pagination {
  flex-shrink: 0;
  padding: 8px 0;
}

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
