<template>
  <div class="header">
    <div class="header-title">
      <img class="header-title-img" src="~@/assets/img/cluster_header_title.png" alt="议案建议综合分析（聚类与汇总要点）" />
      <img class="header-title-line" src="~@/assets/img/header_line.png" alt="" />
    </div>
    <button class="history-btn" @click="$emit('toggle')">
      <img class="history-icon" src="~@/assets/img/history.svg" alt="操作历史" />
      操作历史
    </button>
    <div class="history-modal" :class="{ show: visible }">
      <div class="modal-header">
        <div class="modal-title">操作历史记录</div>
        <span class="close-modal" @click="$emit('close')">×</span>
      </div>
      <div class="modal-actions">
        <button class="btn btn-sm btn-outline" @click="$emit('clear')">清空记录</button>
      </div>
      <div class="history-list">
        <div v-if="!records || records.length === 0" class="history-empty">暂无操作记录</div>
        <div v-else>
          <div v-for="(record, idx) in records" :key="idx" class="history-item">
            <div class="time">{{ record.time }}</div>
            <div class="action">{{ record.action }}</div>
            <div class="content">{{ record.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClusterHeaderHistory',
  props: {
    title: { type: String, default: '议案建议聚类与汇总要点综合系统' },
    visible: { type: Boolean, default: false },
    records: { type: Array, default: () => [] }
  }
}
</script>

<style scoped lang="less">
.header {
  background-color: #fff;
  padding: 10px 24px;
  box-shadow: 0 2px 4px var(--shadow-color);
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  box-sizing: border-box;
}

.header-title {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

/* 标题文字图片（议案建议综合分析（聚类与汇总要点）.png），在上 */
.header-title-img {
  height: 24px;
  display: block;
}

/* 标题下方装饰线（编组 19.png），在下 */
.header-title-line {
  height: 10px;
  // width: 380px;
  display: block;
}

.history-btn {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  background-color: white;
  color: var(--primary-red);
  border: 1px solid var(--primary-red);
  /* 与左侧"重置"按钮尺寸一致（btn-sm：padding 4px 10px / font-size 10px / 高 26px） */
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.history-btn:hover {
  background-color: var(--light-red);
}

/* 操作历史图标：缩小并垂直居中（SVG 为红色，与按钮文字同色） */
.history-icon {
  width: 12px;
  height: 12px;
  display: block;
}

.history-modal {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 400px;
  max-height: 500px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  padding: 15px;
  display: none;
}

.history-modal.show {
  display: block;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 13px;
  font-weight: bold;
  color: var(--primary-red);
}

.close-modal {
  cursor: pointer;
  font-size: 15px;
  color: #999;
  transition: color 0.2s ease;
}

.close-modal:hover {
  color: var(--primary-red);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
}

.history-item {
  padding: 8px;
  border-bottom: 1px dashed #eee;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item .time {
  color: #999;
  font-size: 9px;
}

.history-item .content {
  color: var(--text-color);
}

.history-item .action {
  color: var(--primary-red);
  font-weight: 500;
}

.history-empty {
  text-align: center;
  color: #999;
  padding: 20px;
}
</style>
