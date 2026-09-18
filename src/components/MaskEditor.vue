<template>
  <transition name="el-fade-in">
    <div
      v-show="visible"
      class="mask-editor"
      :style="{ zIndex: zIndex }"
      @click.self="handleMaskClick"
    >
      <div class="mask-editor__panel" :style="panelStyle">
        <!-- ========== 标头 ========== -->
        <div class="mask-editor__header">
          <slot name="header">
            <span class="mask-editor__title">{{ title }}</span>
          </slot>
          <i
            v-if="showClose"
            class="el-icon-close mask-editor__close"
            @click="handleClose"
          ></i>
        </div>

        <!-- ========== 内容：占满高度的输入框 ========== -->
        <div class="mask-editor__body">
          <el-input
            ref="editor"
            v-model="innerValue"
            type="textarea"
            class="mask-editor__input"
            :placeholder="placeholder"
            :show-word-limit="showWordLimit"
            :disabled="disabled"
            resize="none"
            v-bind="inputAttrs"
            @input="handleInput"
          />
        </div>

        <!-- ========== 底部操作区 ========== -->
        <div v-if="showFooter" class="mask-editor__footer">
          <slot name="footer" :cancel="handleCancel" :confirm="handleConfirm">
            <el-button size="small" @click="handleCancel">{{ cancelText }}</el-button>
            <el-button
              size="small"
              type="primary"
              :loading="loading"
              @click="handleConfirm"
            >{{ confirmText }}</el-button>
          </slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'MaskEditor',
  props: {
    /* ---------- 核心 ---------- */
    // 内容绑定值（v-model）
    value: { type: String, default: '' },
    // 显示/隐藏（建议用 .sync 修饰符）
    visible: { type: Boolean, default: false },

    /* ---------- 文案 ---------- */
    title: { type: String, default: '编辑' }, // 标头
    placeholder: { type: String, default: '请输入内容' },
    confirmText: { type: String, default: '确定' },
    cancelText: { type: String, default: '取消' },

    /* ---------- 输入框 ---------- */
    maxlength: { type: Number, default: undefined },
    showWordLimit: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    inputAttrs: { type: Object, default: () => ({}) }, // 透传给 el-input 的其他属性

    /* ---------- 行为 ---------- */
    loading: { type: Boolean, default: false },
    showClose: { type: Boolean, default: true },
    showFooter: { type: Boolean, default: true },
    closeOnClickMask: { type: Boolean, default: false }, // 点遮罩关闭
    closeOnPressEscape: { type: Boolean, default: true }, // ESC 关闭
    rollbackOnCancel: { type: Boolean, default: true },   // 取消时回滚内容
    autoFocus: { type: Boolean, default: true },

    /* ---------- 布局 ---------- */
    width: { type: String, default: '840px' },
    height: { type: String, default: '80vh' },
    zIndex: { type: [Number, String], default: 2000 }
  },
  data() {
    return {
      innerValue: this.value,
      backupValue: this.value,
    };
  },
  computed: {
    panelStyle() {
      return { width: this.width, height: this.height };
    }
  },
  watch: {
    value(val) {
      this.innerValue = val;
    },
    visible(val) {
      val ? this.onOpen() : this.onClose();
    }
  },
  mounted() {
    console.log('value', this.value);
    if (this.visible) this.onOpen();
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
    this.lockScroll(false);
  },
  methods: {
    /* ---------- 生命周期相关 ---------- */
    onOpen() {
      this.backupValue = this.value;
      this.innerValue = this.value;
      document.addEventListener('keydown', this.handleKeydown);
      this.lockScroll(true);
      if (this.autoFocus) {
        this.$nextTick(() => {
          const el = this.$refs.editor && this.$refs.editor.$el.querySelector('textarea');
          el && el.focus();
        });
      }
      this.$emit('open');
    },
    onClose() {
      document.removeEventListener('keydown', this.handleKeydown);
      this.lockScroll(false);
    },
    lockScroll(lock) {
      if (lock) {
        this._oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = this._oldOverflow || '';
      }
    },

    /* ---------- 事件 ---------- */
    handleInput(val) {
      // 实时同步给父组件（v-model）
      this.$emit('input', val);
    },
    handleKeydown(e) {
      if (e.keyCode === 27 && this.closeOnPressEscape) {
        this.handleCancel();
      }
    },
    handleMaskClick() {
      if (this.closeOnClickMask) this.handleCancel();
    },
    handleClose() {
      this.$emit('update:visible', false);
      this.$emit('close');
    },
    handleCancel() {
      // 回滚内容，保证"取消"语义
      if (this.rollbackOnCancel && this.innerValue !== this.backupValue) {
        this.innerValue = this.backupValue;
        this.$emit('input', this.backupValue);
      }
      this.$emit('update:visible', false);
      this.$emit('cancel', this.backupValue);
    },
    handleConfirm() {
      this.$emit('confirm', this.innerValue);
      this.$emit('update:visible', false);
    },

    /* ---------- 对外暴露的方法 ---------- */
    open() {
      this.$emit('update:visible', true);
    },
    close() {
      this.handleClose();
    }
  }
};
</script>

<style scoped>
.mask-editor {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 24px;
  background-color: rgba(0, 0, 0, 0.5);
}

.mask-editor__panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

/* ---------- 标头 ---------- */
.mask-editor__header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  background: #f8e8e6;
}

.mask-editor__close {
  font-size: 18px;
  color: #909399;
  cursor: pointer;
  transition: color 0.2s;
}
.mask-editor__close:hover {
  color: #409eff;
}

/* ---------- 内容：让输入框撑满 ---------- */
.mask-editor__body {
  display: flex;
  flex: 1;
  min-height: 0;              /* 关键：允许 flex 子项收缩，高度才能真正撑开 */
  padding: 16px 20px 0;
}

.mask-editor__input {
  flex: 1;                    /* 撑满 body 高度 */
}

.mask-editor__input ::v-deep .el-textarea__inner {
  height: 100%;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
}

/* ---------- 提示 ---------- */
.mask-editor__tip {
  flex: none;
  display: flex;
  align-items: flex-start;
  padding: 8px 20px 0;
  font-size: 12px;
  line-height: 1.6;
  color: #909399;
}
.mask-editor__tip-icon {
  margin-right: 4px;
  line-height: 1.6;
  color: #e6a23c;
}

/* ---------- 底部 ---------- */
.mask-editor__footer {
  flex: none;
  display: flex;
  justify-content: flex-end;
  padding: 12px 20px 16px;
}
</style>
