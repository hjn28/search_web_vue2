<template>
  <div>
    <div class="task-queue-mask" :class="{ show: visible }" @click="$emit('close')"></div>
    <div class="task-queue-modal" :class="{ show: visible }">
      <div class="task-queue-header">
        <div class="task-queue-header-left">
          <div class="task-queue-title">任务队列&nbsp;&nbsp;
            <button class="btn btn-outline btn-sm" :disabled="refreshing" @click="$emit('refresh')">
              {{ refreshing ? '刷新中...' : '刷新' }}
            </button>
          </div>
        </div>
        <span class="task-queue-close" @click="$emit('close')">×</span>
      </div>
      <div
        class="task-queue-body"
        v-loading="detailLoading"
        element-loading-text="正在加载任务详情..."
        element-loading-background="rgba(255, 255, 255, 0.82)"
      >
        <table class="task-queue-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>名称</th>
              <th>类型</th>
              <th>创建时间</th>
              <th>结束时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!items.length">
              <td colspan="7" class="task-queue-empty">暂无任务</td>
            </tr>
            <tr v-for="(item, index) in items" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td class="task-name-cell">
                <span class="task-name-text" :title="taskWordText(item)">{{ taskWordDisplay(item) }}</span>
              </td>
              <td class="task-type-cell">
                <el-tag size="mini" class="task-tag task-tag--type" :class="taskTypeTagClass(item)">{{ taskTypeText(item) }}</el-tag>
              </td>
              <td>{{ item.time }}</td>
              <td>{{ item.endTime || '---' }}</td>
              <td>
                <el-tag v-show="item.status === '0'" size="mini" class="task-tag task-tag--status-running">处理中</el-tag>
                <el-tag v-show="item.status === '1'" size="mini" class="task-tag task-tag--status-done">已完成</el-tag>
                <el-tag v-show="item.status === '2'" size="mini" class="task-tag task-tag--status-failed">失败</el-tag>
              </td>
              <td class="task-action-cell">
                <button class="btn btn-outline btn-sm action-btn" @click="handleDelete(item.id)" :disabled="item.status === '0' || isDeleting(item.id)">
                  {{ isDeleting(item.id) ? '删除' : '删除' }}
                </button>
                <button class="btn btn-outline btn-sm action-btn" @click="handleView(item)" :disabled="detailLoading || item.status === '0' || item.status === '2'">查看</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskQueueModal',
  props: {
    visible: { type: Boolean, default: false },
    items: { type: Array, default: () => [] },
    refreshing: { type: Boolean, default: false },
    deletingTaskIds: { type: Array, default: () => [] },
    detailLoading: { type: Boolean, default: false }
  },
  emits: ['close', 'refresh', 'delete-task', 'view-detail'],
  methods: {
    taskWordText(item) {
      if (!item) return ''
      const words = item.qdNeedObj && item.qdNeedObj.words
      if (Array.isArray(words)) return words.join('、')
      return String(words || '')
    },
    taskWordDisplay(item) {
      const t = this.taskWordText(item)
      return t.length > 7 ? t.slice(0, 7) + '...' : t
    },
    taskTypeText(item) {
      return String(item && item.type) === '1' ? '汇总要点' : '分析报告'
    },
    taskTypeTagClass(item) {
      return String(item && item.type) === '1' ? 'task-tag--summary' : 'task-tag--overview'
    },
    isDeleting(id) {
      return this.deletingTaskIds.includes(String(id))
    },
    handleDelete(id) {
      if (this.isDeleting(id)) return
      this.$emit('delete-task', id)
    },
    handleView(item) {
      if (this.detailLoading) return
      this.$emit('view-detail', { id: item.id, type: item.type, words: item.qdNeedObj && item.qdNeedObj.words, tree: item.qdNeedObj && item.qdNeedObj.tree })
    }
  }
}
</script>

<style scoped>
.task-queue-header-left { display: flex; align-items: center; }
.task-queue-header-left > * {
  margin-right: 20px;
}
.task-queue-header-left > *:last-child {
  margin-right: 0;
}
.task-name-cell { max-width: 140px; }
.task-name-text { display: inline-block; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
.task-type-cell { white-space: nowrap; }
.task-queue-body { position: relative; }

:deep(.task-tag) {
  border-radius: 12px;
  border: 1px solid transparent;
  font-weight: 500;
}

:deep(.task-tag--type.task-tag--summary) {
  color: #c9190b;
  background-color: #f8e8e6;
  border-color: #e6b7b1;
}

:deep(.task-tag--type.task-tag--overview) {
  color: #8a3f38;
  background-color: #f6efee;
  border-color: #e2cecb;
}

:deep(.task-tag--status-running) {
  color: #9a5d00;
  background-color: #fff6e6;
  border-color: #f3d59f;
}

:deep(.task-tag--status-done) {
  color: #2f6b3b;
  background-color: #eef8f1;
  border-color: #bfdcc8;
}

:deep(.task-tag--status-failed) {
  color: #c9190b;
  background-color: #fdeceb;
  border-color: #f0bbb6;
}
.task-action-cell .btn {
  margin-right: 5px;
}
</style>
