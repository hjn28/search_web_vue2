<template>
  <div v-if="expandResults.length" class="one-search-results">
    <div class="one-search-title">一次拓展结果</div>
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
              <span class="primary-card-seg-text" v-html="handleGl(seg.content)"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="result-empty">暂无一次拓展结果</div>
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
