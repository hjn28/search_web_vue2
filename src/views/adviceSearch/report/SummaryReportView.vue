<template>
  <div>
    <div v-if="!zhaiyaoData.length" class="result-empty">暂无汇总要点数据，请先生成</div>
    <div v-else class="summary-list">
      <div class="summary-card" v-for="(item, idx) in zhaiyaoData" :key="idx">
        <div v-if="shouldShowPian(item, idx)" class="summary-card-header">{{ item.pian }}</div>
        <div class="summary-card-header">{{ item.yuyi }}</div>
        <div class="summary-card-stat">{{ item.summaryCountText || SummaryFormatter.formatCountText(item.arr) }}</div>
        <div v-if="Array.isArray(item.sections) && item.sections.length" class="summary-card-body">
          <div v-if="SummaryFormatter.hasUngroupedText(item.arr)" class="summary-paragraph"
            v-html="SummaryFormatter.formatParagraph(item.arr, summaryExactWords, item.sections, -1)"></div>
          <div v-for="sec in item.sections" :key="sec" class="summary-section">
            <div class="summary-card-header">{{ sec }}</div>
            <div class="summary-paragraph"
              v-html="SummaryFormatter.formatParagraph(item.arr, summaryExactWords, sec)"></div>
          </div>
        </div>
        <div v-else class="summary-card-body">
          <div class="summary-paragraph"
            v-html="SummaryFormatter.formatParagraph(item.arr, summaryExactWords, null)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SummaryFormatter from '@/utils/classes/SummaryFormatter'

export default {
  name: 'SummaryReportView',
  props: {
    zhaiyaoData: { type: Array, default: () => [] }
  },
  computed: {
    SummaryFormatter() { return SummaryFormatter },
    summaryExactWords() {
      return SummaryFormatter.parseExactWordList('')
    }
  },
  methods: {
    shouldShowPian(item, index) {
      const pian = String(item && item.pian ? item.pian : '').trim()
      if (!pian) return false
      for (let i = 0; i < index; i++) {
        if (String(this.zhaiyaoData[i]?.pian || '').trim() === pian) return false
      }
      return true
    }
  }
}
</script>

<style scoped>
.summary-list {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  border: 1px solid var(--border-color);
  padding: 10px;
  border-radius: var(--radius-lg);
  background: #fff;
  overflow: auto;
}

.summary-card {
  border-radius: var(--radius-lg);
  background: #fff;
  overflow: hidden;
}

.summary-card-header {
  padding: 10px 12px;
  font-weight: 700;
  color: var(--primary-red);
}

.summary-card-body {
  padding: 10px 12px;
  text-indent: 2rem;
}

.summary-card-stat {
  padding: 6px 12px 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.summary-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-color);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-col.title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.summary-col.content {
  font-size: 12px;
  color: #555;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-bullet {
  line-height: 1.6;
}

:deep(.summary-exact-word) {
  color: red;
  font-weight: 500;
}

:deep(.summary-rep-meta) {
  color: var(--primary-red);
}

:deep(.summary-rep-distinguish) {
  color: green;
}

:deep(.summary-yuanwen-word) {
  color: blue;
  font-weight: 400;
  font-size: 16px;
  transform: scale(0.8);
  display: inline-block;
}
</style>
