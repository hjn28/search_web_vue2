<template>
  <div class="advice-cluster">
    <div class="main-container">
      <AdviceClusterLeft />
      <AdviceClusterRight ref="rightPanel" />
    </div>

    <!-- 统一目录模板弹窗：由 adviceCluster store 驱动，左侧「上传分类模板」触发 -->
    <GenerateReportModal
      :visible="templateModal.visible"
      :mode="templateModal.mode"
      :initial-tree="templateModal.initialTree"
      :initial-file-name="templateModal.initialFileName"
      :show-summary-options="templateModal.showSummaryOptions"
      @save="onTemplateSave"
      @generate="onTemplateGenerate"
      @close="onTemplateClose"
    />
  </div>
</template>

<script>
import AdviceClusterLeft from './components/AdviceClusterLeft.vue'
import AdviceClusterRight from './components/AdviceClusterRight.vue'
import GenerateReportModal from './report/GenerateReportModal.vue'
import { mapState } from 'vuex'

export default {
  name: 'AdviceCluster',
  components: {
    AdviceClusterLeft,
    AdviceClusterRight,
    GenerateReportModal
  },
  computed: {
    ...mapState('adviceCluster', ['templateModal'])
  },
  mounted() {
    // 代表团/承办单位字典由 dict store 统一拉取（幂等，其他组件也会兜底触发）
    this.$store.dispatch('dict/fetchAll')
  },
  methods: {
    onTemplateSave(payload) {
      this.$store.dispatch('adviceCluster/saveTemplateModal', payload)
    },
    onTemplateGenerate(payload) {
      this.$store.dispatch('adviceCluster/requestTemplateGenerate', payload)
    },
    onTemplateClose() {
      this.$store.dispatch('adviceCluster/closeTemplateModal')
    }
  }
}
</script>

<style>
/* 非 scoped：这些规则由 adviceSearch 子组件共享，也覆盖 Element UI 弹层。 */
.left-container .section-title-bar,
.right-container .section-title-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-panel);
}

.panel {
  background: var(--bg-color);
  padding: 0 15px;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  margin-top: 0.3rem;
  padding-left: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 1em;
  background: var(--primary-red);
}

.optional-row {
  display: flex;
  overflow: visible;
  flex-wrap: nowrap;
  width: 100%;
  margin-bottom: 12px;
}

.optional-row .optional-item {
  flex: 1;
  min-width: 0;
}

.optional-row .optional-label {
  min-width: 66px;
}

.optional-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 0;
}

.optional-item .scxxzl {
  width: 124px;
  text-align: right;
  font-size: 11px;
  color: var(--text-secondary);
}

.optional-label {
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 64px;
  text-align: right;
}

.optional-select {
  padding: 6px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 11px;
}

.optional-item select.optional-select,
.optional-item input.optional-select {
  min-width: 0;
  width: 100%;
  padding: 6px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 11px;
  box-sizing: border-box;
  height: 32px;
}

.dual-text-input {
  flex: 1;
  width: 100%;
  resize: none;
}

.textarea-expand-btn {
  position: absolute;
  right: 8px;
  top: 3px;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.textarea-expand-btn:hover {
  border-color: var(--primary-red);
  color: var(--primary-red);
}

.result-empty {
  margin: 20px 0;
  padding: 40px 12px;
  text-align: center;
  color: var(--text-muted);
  background: var(--bg-panel);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  font-size: 12px;
}

.v-modal {
  z-index: 10000 !important;
}

.el-message-box__wrapper {
  z-index: 10001 !important;
}

.task-queue-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: none;
  z-index: 9998;
}

.task-queue-mask.show {
  display: block;
}

.task-queue-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 1100px;
  max-width: calc(100vw - 4px);
  height: 70vh;
  background: #fff;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  transform: translate(-50%, -50%);
  display: none;
  z-index: 9999;
  overflow: hidden;
}

.task-queue-modal.show {
  display: block;
}

.task-queue-modal.show:not(.bq-tree-modal) {
  display: flex;
  flex-direction: column;
}

.task-queue-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--light-red);
}

.task-queue-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary-red);
}

.task-queue-close {
  cursor: pointer;
  font-size: 18px;
  color: var(--text-secondary);
}

.upload-file-name {
  max-width: 220px;
  font-size: 12px;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: #fff;
}

.advice-cluster {
  height: 100vh;
  overflow: hidden;
  min-width: var(--page-min-width);
  min-height: var(--page-min-height);
}
</style>
