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
