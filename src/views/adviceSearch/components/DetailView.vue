<template>
  <div>
    <div v-if="detail.visible" class="panel detail-panel">
      <!-- <div class="detail-header">
        <div class="detail-title">
          📄 议案详情
          <span class="detail-match-type">匹配类型：{{ detail.matchType }}</span>
        </div>
        <div class="detail-header-actions">
          <button class="btn btn-outline btn-sm" @click="$emit('back')">返回列表</button>
          <span class="detail-close" @click="$emit('back')">×</span>
        </div>
      </div> -->
      <div class="detail-content" v-html="detail.html"></div>
    </div>
    <div v-else class="result-empty">请选择一条记录查看详情</div>
  </div>
</template>

<script>
export default {
  name: 'DetailView',
  props: {
    detail: {
      type: Object,
      default: () => ({ visible: false, html: '', matchType: '' })
    }
  },
  emits: ['back']
}
</script>

<style scoped>
.detail-panel {
  margin-top: 15px;
  border-top: 2px solid var(--primary-red);
  flex: 1;
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.detail-title {
  font-size: 12px;
  font-weight: bold;
  color: var(--primary-red);
  display: flex;
  align-items: center;
}

.detail-match-type {
  font-size: 9px;
  color: var(--text-secondary);
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 10px;
}

.detail-close {
  cursor: pointer;
  color: var(--text-muted);
  font-size: 16px;
}

.detail-close:hover {
  color: var(--primary-red);
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: var(--bg-panel);
  border-radius: var(--radius-md);
  line-height: 1.8;
}

:deep(.detail-content .matched-text) {
  background: #fff3cd;
  padding: 0 2px;
  border-radius: 2px;
}

:deep(.detail-meta-row) {
  margin: 4px 0;
  font-size: 11px;
  color: #555;
}

:deep(.detail-body) {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: #fff;
  line-height: 1.8;
  white-space: pre-wrap;
}

:deep(.expand-list) {
  margin-top: 10px;
  max-height: 25vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 8px;
}

:deep(.expand-item) {
  display: flex;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed #eee;
  font-size: 11px;
}

:deep(.expand-item:last-child) {
  border-bottom: none;
}

:deep(.expand-item input) {
  margin-right: 8px;
}

:deep(.detail-exact-word) {
  color: red;
  font-weight: 600;
}
</style>
