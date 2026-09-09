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
import SummaryFormatter from '../../../utils/classes/SummaryFormatter'

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
