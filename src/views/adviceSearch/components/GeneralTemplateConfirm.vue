<template>
  <div>
    <div class="template-config-mask" :class="{ show: visible }" @click="handleClose"></div>
    <div class="template-config-modal" :class="{ show: visible }">
      <div class="template-config-header">
        <div class="template-config-title">{{ modalTitle }}</div>
        <span class="template-config-close" @click="handleClose">×</span>
      </div>
      <div class="template-config-body">
        <sczdymb
          :key="renderKey"
          :initial-tree="initialTree"
          :initial-word-file-name="initialFileName"
          :max-depth="2"
          :mode="type"
          @save-template="handleSaveTemplate"
          @close-template="handleClose"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Sczdymb from './sczdymb.vue'

export default {
  name: 'GeneralTemplateConfirm',
  components: { Sczdymb },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    initialTree: {
      type: Array,
      default: () => []
    },
    initialFileName: {
      type: String,
      default: ''
    },
    /** 弹窗打开场景：'word-edit' 模糊词编辑 | 'summary' 生成汇总要点 */
    type: {
      type: String,
      default: ''
    }
  },
  emits: ['save', 'close'],
  data() {
    return {
      renderKey: 0
    }
  },
  computed: {
    /** 弹窗标题按打开场景区分 */
    modalTitle() {
      if (this.type === 'word-edit') return '分类体系模板'
      if (this.type === 'summary') return '分类要点内容汇总模板'
      return '通用模板参数确认'
    }
  },
  watch: {
    visible(val) {
      if (val) {
        // 每次打开重置状态
        this.renderKey += 1
      }
    }
  },
  methods: {
    handleClose() {
      this.$emit('close')
    },
    handleSaveTemplate(payload) {
      // 保存时只传递目录树和词，四处模板共用树结构
      this.$emit('save', {
        tree: payload.tree,
        words: payload.words
      })
    }
  }
}
</script>

<style scoped>
/* ------ mask ------ */
.template-config-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9998;
  display: none;
}
.template-config-mask.show {
  display: block;
}

/* ------ modal ------ */
.template-config-modal {
  position: fixed;
  top: 5%;
  left: 12%;
  right: 12%;
  bottom: 5%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  display: none;
  flex-direction: column;
  overflow: hidden;
}
.template-config-modal.show {
  display: flex;
}

/* ------ header ------ */
.template-config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}
.template-config-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
}
.template-config-close {
  font-size: 28px;
  color: #647184;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}
.template-config-close:hover {
  color: #c9190b;
}

/* ------ body ------ */
.template-config-body {
  flex: 1;
  overflow: auto;
  padding: 0;
}
</style>
