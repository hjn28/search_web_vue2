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
