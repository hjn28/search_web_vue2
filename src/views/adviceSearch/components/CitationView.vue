<template>
  <div class="citation-panel">
    <div class="citation-panel-header">
      <span class="citation-panel-title">引文详情</span>
      <div class="citation-panel-actions">
        <button class="btn btn-outline btn-sm" @click="exportCitation">导出引文</button>
        <button class="btn btn-outline btn-sm" @click="$emit('close-citation')">返回</button>
      </div>
    </div>
    <div class="citation-panel-body citation-tree">
      <div v-for="(node, idx) in citationRenderNodes" :key="idx">
        <div v-if="node.type === 'heading'"
          :class="['citation-heading', node.level === 1 ? 'citation-heading-l1' : 'citation-heading-l2']">
          {{ node.name }}
        </div>
        <div v-else-if="node.type === 'text'" class="citation-leaf-title">
          {{ node.name }}
        </div>
        <div v-else-if="node.type === 'content'"
          class="citation-content"
          :class="{ 'citation-content-selected': activeKeyId && activeKeyId === node.keyId }"
          :data-key-id="node.keyId">
          <div class="citation-keypoints" v-html="node.html"></div>
          <div v-if="node.citationData && node.citationData.length" class="citation-original-texts">
            <div v-for="(ot, oi) in node.citationData" :key="oi" class="citation-original-item">
              <div class="citation-original-content">{{ ot.content }}</div>
              <div class="citation-original-meta">
                <span class="summary-rep-meta">（</span>
                <span class="summary-rep-distinguish">标题：{{ ot.title }}，{{ ot.cbxx }}，第{{ ot.id }}号，届次{{ ot.session }}，</span>
                <span class="summary-rep-meta">{{ ot.delegation }}团{{ ot.representative }}代表）</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!citationRenderNodes.length" class="citation-empty">无引文数据</div>
    </div>
  </div>
</template>

<script>
import { exportCitationDoc } from '../utils/citationExport'

export default {
  name: 'CitationView',
  props: {
    citationData: { type: Array, default: () => [] },
    activeKeyId: { type: String, default: '' }
  },
  emits: ['close-citation'],
  computed: {
    citationRenderNodes() {
      const data = Array.isArray(this.citationData) ? this.citationData : []
      const yinwenData = data.filter(function (item) { return item.isyinwen === true })
      if (!yinwenData.length) return []

      const result = []
      var walkTree = function (nodes, level) {
        if (!Array.isArray(nodes)) return
        nodes.forEach(function (node) {
          if (!node || typeof node !== 'object') return
          var name = String(node.name || '').trim()
          if (!name) return
          var children = Array.isArray(node.children) ? node.children : []
          var contentList = Array.isArray(node.content) ? node.content : []
          var hasChildren = children.length > 0
          var count = node.count && typeof node.count === 'object' ? node.count : null
          var suffix = (count && count.total !== undefined && count.total !== null && String(count.total).trim() !== '')
            ? '【' + count.total + '条建议】' : ''
          var displayName = suffix ? name + suffix : name

          if (hasChildren) {
            result.push({ type: 'heading', level: level > 1 ? 2 : 1, name: displayName })
            contentList.forEach(function (item) {
              if (item && typeof item === 'object' && item.keypoints) {
                var tallyHtml = ''
                if (item.tally) {
                  var _t = String(item.tally).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                  var _openIdx = _t.indexOf('（')
                  var _commaIdx = _t.indexOf('，', _openIdx + 1)
                  if (_openIdx !== -1 && _commaIdx !== -1 && _commaIdx > _openIdx) {
                    tallyHtml = '<span class="summary-rep-distinguish">' + _t.slice(0, _openIdx + 1) + '<strong>' + _t.slice(_openIdx + 1, _commaIdx) + '</strong>' + _t.slice(_commaIdx) + '</span>'
                  } else {
                    tallyHtml = '<span class="summary-rep-distinguish">' + _t + '</span>'
                  }
                }
                var kp = String(item.keypoints || '').replace(/\n/g, '<br/>')
                var _cpIdx = kp.indexOf('）')
                var _dotIdx = kp.indexOf('。', _cpIdx + 1)
                if (_cpIdx !== -1 && _dotIdx !== -1) {
                  kp = kp.slice(0, _cpIdx + 1) + '<strong>' + kp.slice(_cpIdx + 1, _dotIdx) + '</strong>' + kp.slice(_dotIdx)
                }
                var html = kp + tallyHtml
                result.push({
                  type: 'content',
                  html: html,
                  keyId: item.keyId || '',
                  citationData: Array.isArray(item.original_text) && item.original_text.length > 0 ? item.original_text : null
                })
              }
            })
            walkTree(children, level + 1)
          } else {
            result.push({ type: 'text', name: displayName })
            contentList.forEach(function (item) {
              if (item && typeof item === 'object' && item.keypoints) {
                var tallyHtml = ''
                if (item.tally) {
                  var _t = String(item.tally).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                  var _openIdx = _t.indexOf('（')
                  var _commaIdx = _t.indexOf('，', _openIdx + 1)
                  if (_openIdx !== -1 && _commaIdx !== -1 && _commaIdx > _openIdx) {
                    tallyHtml = '<span class="summary-rep-distinguish">' + _t.slice(0, _openIdx + 1) + '<strong>' + _t.slice(_openIdx + 1, _commaIdx) + '</strong>' + _t.slice(_commaIdx) + '</span>'
                  } else {
                    tallyHtml = '<span class="summary-rep-distinguish">' + _t + '</span>'
                  }
                }
                var kp = String(item.keypoints || '').replace(/\n/g, '<br/>')
                var _cpIdx = kp.indexOf('）')
                var _dotIdx = kp.indexOf('。', _cpIdx + 1)
                if (_cpIdx !== -1 && _dotIdx !== -1) {
                  kp = kp.slice(0, _cpIdx + 1) + '<strong>' + kp.slice(_cpIdx + 1, _dotIdx) + '</strong>' + kp.slice(_dotIdx)
                }
                var html = kp + tallyHtml
                result.push({
                  type: 'content',
                  html: html,
                  keyId: item.keyId || '',
                  citationData: Array.isArray(item.original_text) && item.original_text.length > 0 ? item.original_text : null
                })
              }
            })
          }
        })
      }
      walkTree(yinwenData, 1)
      return result
    }
  },
  watch: {
    activeKeyId(val) { if (val) this.$nextTick(this.scrollToActiveKeyId) },
    citationData(val) { if (Array.isArray(val) && val.length && this.activeKeyId) this.$nextTick(this.scrollToActiveKeyId) }
  },
  mounted() {
    // 首次点击引文时组件随 v-if 挂载，watcher 以挂载时的值初始化、不会触发；
    // 需在挂载后主动滚动一次，否则首次点击左侧不跳转（第二次点击才生效）
    this.$nextTick(this.scrollToActiveKeyId)
  },
  methods: {
    scrollToActiveKeyId() {
      if (!this.activeKeyId) return
      var el = this.$el.querySelector('[data-key-id="' + this.activeKeyId + '"]')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    exportCitation() {
      exportCitationDoc(this.citationData, this.addHistory.bind(this), this.showAlert)
    },
    addHistory(action, content) { console.log('[CitationView]', action, content) },
    showAlert(message) { this.$alert(message, '提示', { confirmButtonText: '确定' }) }
  }
}
</script>

<style scoped>
.citation-panel {
  display: flex; flex-direction: column; height: 100%;
  flex: 1; flex-shrink: 1; padding: 0;
}
.citation-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border-color);
  background: #fafafa; flex-shrink: 0;
}
.citation-panel-actions { display: flex; align-items: center; }
.citation-panel-actions > * {
  margin-right: 8px;
}
.citation-panel-actions > *:last-child {
  margin-right: 0;
}
.citation-panel-title { font-size: 15px; font-weight: 700; color: var(--primary-red); }
.citation-panel-body { flex: 1; overflow-y: auto; padding: 14px 18px; }
.citation-tree { font-size: 15px; line-height: 1.9; color: #444; }
.citation-heading { color: #222; font-weight: 700; line-height: 1.6; }
.citation-heading-l1 { font-size: 20px; margin: 16px 0 10px; }
.citation-heading-l2 { font-size: 17px; margin: 12px 0 8px; padding-left: 10px; border-left: 3px solid #c9190b; }
.citation-leaf-title { font-size: 15px; margin: 10px 0 6px; padding-left: 14px; font-weight: 600; color: #333; }
.citation-content { margin: 6px 0; padding-left: 14px; }
.citation-keypoints { font-size: 15px; line-height: 1.9; color: #444; }
.citation-original-texts { margin-top: 10px; }
.citation-original-item {
  margin: 16px 0; padding: 14px 12px;
  background: #f8f9fb; border-left: 3px solid #c9190b;
  border-radius: 4px;
}
.citation-original-content {
  font-size: 14px; line-height: 1.7; color: #333;
  white-space: pre-wrap; word-break: break-word;
  margin-bottom: 6px;
}
.citation-original-meta { font-size: 14px; color: #666; line-height: 1.5; }
.citation-empty { padding: 20px 0; text-align: center; color: #999; font-size: 13px; }
.citation-content-selected {
  background: #fff3e0; border-radius: 6px;
  padding: 8px 12px; margin: 6px -12px;
  border-left: 4px solid #c9190b;
  box-shadow: 0 2px 8px rgba(201, 25, 11, 0.12);
}
.citation-content-selected .citation-keypoints { color: #1a2a3a; }
:deep(.summary-rep-meta) { color: #c9190b; }
:deep(.summary-rep-distinguish) { color: green; }
</style>
