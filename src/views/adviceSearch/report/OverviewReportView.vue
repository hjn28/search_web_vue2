<template>
  <div>
    <div v-if="!zsbgRenderNodes.length" class="result-empty">暂无分析报告数据，请先生成</div>
    <div v-else class="zsbg-tree-list">
      <div v-for="(node, idx) in zsbgRenderNodes" :key="idx">
        <!-- 标题 -->
        <div v-if="node.type === 'heading'"
          :class="['zsbg-heading', node.level === 1 ? 'zsbg-heading-l1' : node.level >= 3 ? 'zsbg-heading-l3' : 'zsbg-heading-l2',
            { 'zsbg-editing-field': zsbgEditMode }]"
          :contenteditable="zsbgEditMode && !!(node.editableMeta && node.editableMeta.keyId && node.editableMeta.field === 'name')"
          @blur="onFieldBlur($event, node)">
          <strong>{{ node.name }}</strong>
        </div>
        <!-- 内容 -->
        <div v-else-if="node.type === 'content'" class="zsbg-text"
          :class="{ 'zsbg-text-selected': activeKeyId && activeKeyId === node.keyId }">
          <span v-if="node.editableMeta && node.editableMeta.field === 'keypoints'"
            class="zsbg-editable-inline"
            :class="{ 'zsbg-editing-field': zsbgEditMode }"
            :contenteditable="zsbgEditMode && !!(node.editableMeta && node.editableMeta.keyId && node.editableMeta.field === 'keypoints')"
            @blur="onFieldBlur($event, node)">
            {{ node.boldPrefix }}<strong v-if="node.boldText">{{ node.boldText }}</strong>{{ node.restSentence }}
          </span>
          <span v-if="node.editableMeta && node.editableMeta.field === 'keypoints' && node.tally" class="summary-rep-distinguish">
            {{ node.tallyBefore }}<strong v-if="node.tallyBold">{{ node.tallyBold }}</strong>{{ node.tallyAfter }}
          </span>
          <span v-else-if="!(node.editableMeta && node.editableMeta.field === 'keypoints')" v-html="node.html"></span>
          <span v-if="node.citationData" class="citation-badge"
            :class="{ 'citation-badge-active': activeKeyId && activeKeyId === node.keyId }"
            @click.stop="onCitationClick(node)">【引文】</span>
        </div>
        <!-- 统计表 -->
        <div v-else-if="node.type === 'count-table'" class="zsbg-count-table-wrap">
          <table class="zsbg-count-table" style="table-layout:fixed;width:100%;">
            <thead>
              <tr>
                <th :style="colWidthStyle(node, 0)">序号</th>
                <th v-for="(col, ci) in node.columns" :key="col.key" :style="colWidthStyle(node, ci + 1)">{{ col.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in node.rows" :key="rowIndex">
                <td :style="colWidthStyle(node, 0)">{{ rowIndex + 1 }}</td>
                <td v-for="(col, ci) in node.columns" :key="col.key" :style="colWidthStyle(node, ci + 1)">{{ row[col.key] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 图表 -->
        <div v-else-if="node.type === 'chart'" class="zsbg-chart-block" :data-export-chart-index="idx">
          <component :is="node.component" v-bind="node.props" :chartName="node.name" />
        </div>
        <!-- 其他 -->
        <div v-else class="zsbg-text" :class="{ 'zsbg-editing-field': zsbgEditMode }"
          :contenteditable="zsbgEditMode && !!(node.editableMeta && node.editableMeta.keyId && node.editableMeta.field === 'name')"
          @blur="onFieldBlur($event, node)">
          <strong>{{ node.name }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LineChartWithTable from '@/Echarts/LineChartWithTable.vue'
import LinePercentChart from '@/Echarts/LinePercentChart.vue'
import ProvinceLineChart from '@/Echarts/ProvinceLineChart.vue'
import BarChartWithTable from '@/Echarts/BarChartWithTable.vue'
import MapChart from '@/Echarts/mapChart.vue'

export default {
  name: 'OverviewReportView',
  components: { LineChartWithTable, LinePercentChart, ProvinceLineChart, BarChartWithTable, MapChart },
  props: {
    zsbgRenderNodes: { type: Array, default: () => [] },
    activeKeyId: { type: String, default: '' },
    zsbgEditMode: { type: Boolean, default: false },
    jljgzsData: { type: Array, default: () => [] }
  },
  emits: ['citation-click', 'field-blur'],
  methods: {
    onCitationClick(node) {
      this.$emit('citation-click', { data: this.jljgzsData, keyId: node.keyId })
    },
    onFieldBlur(event, node) {
      this.$emit('field-blur', { event, node })
    },
    colWidthStyle(node, colIndex) {
      const weights = this.resolveCountTableWeights(node)
      if (!Array.isArray(weights) || !weights.length) return {}
      const sum = weights.reduce((a, b) => a + b, 0)
      if (sum <= 0 || !weights[colIndex]) return {}
      return { width: (weights[colIndex] / sum * 100).toFixed(1) + '%' }
    },
    resolveCountTableWeights(node) {
      const columns = Array.isArray(node && node.columns) ? node.columns : []
      if (!columns.length) return []
      const rawWeights = Array.isArray(node && node.colWidthWeights) ? node.colWidthWeights : []
      const expectedLen = columns.length + 1
      const hasValidRaw = rawWeights.length === expectedLen
      const isRawDefault100 = hasValidRaw && Number(rawWeights[0]) === 60 && rawWeights.slice(1).every(w => Number(w) === 100)
      if (hasValidRaw && !isRawDefault100) return rawWeights

      const normalize = v => String(v || '')
        .replace(/[\s　]+/g, '')
        .replace(/（/g, '(')
        .replace(/）/g, ')')
        .toLowerCase()

      const resolveWidth = (col) => {
        const key = normalize(col && col.key)
        const label = normalize(col && col.label)
        const token = key + '|' + label
        if (token.includes('bureau') || token.includes('承办司局')) return 220
        if (token.includes('主办(含分办、独办)') || token.includes('主办(含分办,独办)') || token.includes('主办含分办独办')) return 220
        if (token.includes('协办')) return 120
        if (token.includes('参阅')) return 120
        if (token.includes('total') || token.includes('小计')) return 120
        if (token.includes('session') || token.includes('届次')) return 90
        if (token.includes('|id') || token.includes('编号')) return 90
        if (token.includes('delegation') || token.includes('代表团')) return 120
        if (token.includes('title') || token.includes('标题')) return 260
        if (token.includes('cbxx') || (token.includes('承办') && token.includes('信息'))) return 360
        return 120
      }
      return [60].concat(columns.map(resolveWidth))
    }
  }
}
</script>

<style scoped>
.citation-badge {
  color: #1890ff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  user-select: none;
  white-space: nowrap;
  vertical-align: super;
}
.citation-badge:hover { color: #096dd9; }
.citation-badge-active { color: #fff; background: #c9190b; border-radius: 3px; padding: 0 4px; }
.citation-badge-active:hover { color: #fff; background: #a81609; }

.zsbg-editing-field {
  outline: 1px dashed #4f46e5;
  outline-offset: 2px;
}
.zsbg-editable-inline {
  white-space: pre-wrap;
}
</style>
