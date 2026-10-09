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
/**
 * adviceCluster - 议案建议聚类页面入口
 *
 * 职责收敛为三件事：
 *   1. 左右面板的布局容器
 *   2. 统一目录模板弹窗（GenerateReportModal）的挂载与保存路由
 *   3. 公共字典数据的首次拉取
 *
 * 左右面板之间的共享状态（结果列表、视图模式、引文、一次拓展勾选等）
 * 全部收敛在 adviceCluster store 模块，本组件不再做 props/emit 中转，
 * 也不再通过 $refs 调用子组件内部方法。
 */
import AdviceClusterLeft from './components/AdviceClusterLeft.vue'
import AdviceClusterRight from './components/AdviceClusterRight.vue'
import GenerateReportModal from './components/GenerateReportModal.vue'
import { mapState } from 'vuex'
import zsbgNew from './zsbgNew.json'

/**
 * 递归查找树中首个可用 keyId（供开发调试工具定位引文节点）
 * @param {Array} nodes - 树节点
 * @returns {string|null} keyId
 */
function findFirstKeyId(nodes) {
  if (!Array.isArray(nodes)) return null
  for (const node of nodes) {
    if (!node) continue
    const firstContent = Array.isArray(node.content) ? node.content[0] : null
    if (firstContent && firstContent.keyId) return firstContent.keyId
    const found = findFirstKeyId(node.children)
    if (found) return found
  }
  return null
}

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

    if (process.env.NODE_ENV !== 'production') {
      this.installDebugHelpers()
    }
  },
  methods: {
    /* ==================== 统一目录模板弹窗 ==================== */
    /** 保存：按弹窗模式路由到 wordTemplate / template store（逻辑见 store action） */
    onTemplateSave(payload) {
      this.$store.dispatch('adviceCluster/saveTemplateModal', payload)
    },
    /**
     * 立即生成：载荷转交 store，由右侧面板消费。
     * 弹窗是否关闭由右侧在参数校验通过后决定，这里不做关闭。
     */
    onTemplateGenerate(payload) {
      this.$store.dispatch('adviceCluster/requestTemplateGenerate', payload)
    },
    onTemplateClose() {
      this.$store.dispatch('adviceCluster/closeTemplateModal')
    },
    showAlert(message) {
      this.$alert(message, '提示', { confirmButtonText: '确定' })
    },

    /* ==================== 开发调试（仅非生产环境挂载） ==================== */
    /**
     * 控制台调试入口：
     *   window.localYwTest(keyId?) - 用 zsbgNew.json 渲染左侧引文视图
     *   window.zsbgLocal()         - 用 zsbgNew.json 渲染右侧分析报告视图
     */
    installDebugHelpers() {
      window.localYwTest = keyId => {
        const data = Array.isArray(zsbgNew.data) ? zsbgNew.data : []
        if (!data.length) {
          this.showAlert('zsbgNew.json 无数据')
          return
        }
        this.$store.commit('adviceCluster/SET_CITATION', {
          data,
          keyId: keyId || findFirstKeyId(data) || ''
        })
      }

      window.zsbgLocal = () => {
        const data = Array.isArray(zsbgNew.data) ? zsbgNew.data : []
        if (!data.length) {
          this.showAlert('zsbgNew.json 无数据')
          return
        }
        this.$store.commit('adviceCluster/CLEAR_CITATION')
        this.$store.commit('adviceCluster/SET_DETAIL', { visible: false })
        const right = this.$refs.rightPanel
        if (right) right.showLocalReport(data)
      }
    }
  }
}
</script>
