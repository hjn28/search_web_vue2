<template>
  <div v-if="expandResults.length" class="one-search-results">
    <div class="one-search-title">辅助分类查询结果</div>
    <div class="expand-results-list">
      <div v-for="(item, index) in expandResults" :key="'p-'+index" class="primary-card">
        <label class="primary-card-header">
          <span class="primary-card-title expand-title"
            role="button"
            @click.stop.prevent="$emit('expand-title-click', item)">{{ item.title || '未命名' }}</span>
        </label>
        <div class="primary-card-meta">来源：{{ item.c_fwjg || '-' }} ｜ 年份：{{ item.c_nf || '-' }}</div>
        <div v-if="item.keywords && item.keywords.length" class="primary-card-kw">
          <span class="primary-card-kw-label">关键词：</span>
          <div class="primary-card-kw-list">
            <span v-for="(kw, ki) in item.keywords" :key="'kw-'+ki"
              @click="$emit('expand-keyword-click', kw, item, index, ki)"
              :class="['kw-tag-native', expandSelection.highlightedPrimary.includes('primary:'+index+':'+ki) ? 'kw-selected-native' : '']">{{ kw }}</span>
          </div>
        </div>
        <div v-if="item.segments && item.segments.length" class="primary-card-segments">
          <div v-for="(seg, sidx) in item.segments" :key="'p-'+index+'-s-'+sidx" class="primary-card-seg">
            <label class="primary-card-seg-row">
              <span class="primary-card-seg-text" v-html="handleGl(seg.content_html)"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="result-empty">暂无辅助分类结果</div>
</template>

<script>
export default {
  name: 'ExpandResultsView',
  props: {
    expandResults: { type: Array, default: () => [] },
    expandSelection: {
      type: Object,
      default: () => ({
        selectedPrimary: [],
        selectedKeywords: [],
        selectedSegmentContents: [],
        highlightedPrimary: []
      })
    }
  },
  emits: ['expand-title-click', 'expand-keyword-click', 'expand-segment-change'],
  methods: {
    handleGl(html) {
      if (!html) return ''
      return String(html)
        .replace(/<em>/g, '<span style="color: var(--primary-red)">')
        .replace(/<\/em>/g, '</span>')
        .replace(/\n\n/g, '\n')
    }
  }
}
</script>

<style scoped>
.one-search-results {
  margin-top: 10px;
}

.one-search-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-color);
}

.one-search-empty {
  color: var(--text-muted);
  font-size: 11px;
}

.primary-card {
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: #fff;
  margin-bottom: 8px;
  box-shadow: var(--shadow-sm);
}

.primary-card:hover {
  background: var(--light-red);
}

.primary-card-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
}

.primary-card-header input {
  margin-right: 8px;
}

.primary-card-title {
  font-weight: 600;
  color: var(--text-color);
  font-size: 12px;
}

.primary-card-meta {
  color: #777;
  font-size: 11px;
  text-indent: 1.8rem;
}

.primary-card-kw {
  padding-left: 16px;
  margin-top: 6px;
}

.primary-card-kw-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.primary-card-kw-list {
  display: flex;
  flex-wrap: wrap;
  margin-top: 4px;
  font-size: 12px;
}

.primary-card-segments {
  margin-top: 6px;
  padding-left: 10px;
  border-left: 2px solid var(--border-color);
}

.primary-card-seg {
  margin-bottom: 6px;
}

.primary-card-seg-row {
  display: flex;
  align-items: flex-start;
}

.primary-card-seg-text {
  color: #606266;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
}

.kw-tag-native {
  margin: 2px 8px;
  padding: 3px 8px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.15s ease;
}

.kw-selected-native {
  background: #39a854;
  color: #fff;
  border-color: #2f8d47;
}

.expand-results-list {
  padding: 8px 0;
}
.expand-title {
  cursor: pointer;
}
.expand-title:hover {
  color: var(--primary-red);
  text-decoration: underline;
}
</style>
