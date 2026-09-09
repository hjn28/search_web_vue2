<template>
  <div
    class="cs-wrapper"
    :class="{ 'cs-open': dropdownOpen }"
    ref="wrapper"
  >
    <!-- Trigger: 输入框样式，点击展开下拉 -->
    <div class="cs-trigger" tabindex="0" @click="onTriggerClick" @keydown="onTriggerKeydown">
      <div class="cs-value" :class="{ 'cs-placeholder': !hasValue }">
        <template v-if="multiple">
          <template v-if="selectedLabels.length">
            <span class="cs-tag" v-for="(item, i) in selectedLabels" :key="i">{{ item }}</span>
          </template>
          <span v-else>{{ placeholder }}</span>
        </template>
        <template v-else>
          {{ displayLabel || placeholder }}
        </template>
      </div>
      <div class="cs-actions">
        <span v-if="clearable && hasValue" class="cs-clear" @click.stop="onClear">×</span>
        <span class="cs-arrow">&#9662;</span>
      </div>
    </div>

    <!-- 全屏遮罩 - 放在下层 -->
    <div v-if="dropdownOpen" class="cs-mask" @click="closeDropdown"></div>

    <!-- 下拉菜单 -->
    <div v-if="dropdownOpen" class="cs-menu" @click.stop>
      <div v-if="filterable" class="cs-search">
        <input ref="filterInput" v-model="filterText" class="cs-search-input" placeholder="搜索..." @click.stop />
      </div>
      <div class="cs-list" ref="listBox">
        <div
          v-for="(opt, idx) in filteredOptions"
          :key="getValue(opt)"
          class="cs-item"
          :class="{
            'cs-item-on': isSelected(getValue(opt)),
            'cs-item-hover': hoverIdx === idx
          }"
          @click.stop="pick(opt)"
          @mouseenter="hoverIdx = idx"
        >
          <span v-if="multiple" class="cs-chk">
            <span v-if="isSelected(getValue(opt))">&#10003;</span>
          </span>
          <span class="cs-lbl">{{ getLabel(opt) }}</span>
        </div>
        <div v-if="!filteredOptions.length" class="cs-empty">无匹配选项</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomSelect',
  model: { prop: 'value', event: 'input' },
  props: {
    value: { type: [String, Number, Array], default: '' },
    options: { type: Array, default: () => [] },
    labelKey: { type: String, default: 'label' },
    valueKey: { type: String, default: 'value' },
    placeholder: { type: String, default: '请选择' },
    multiple: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
  },
  data() {
    return { dropdownOpen: false, filterText: '', hoverIdx: -1 }
  },
  computed: {
    hasValue() {
      if (this.multiple) return Array.isArray(this.value) && this.value.length > 0
      return this.value !== '' && this.value !== null && this.value !== undefined
    },
    selectedLabels() {
      if (!this.hasValue) return []
      const vals = this.multiple ? this.value : [this.value]
      return vals.map(v => {
        const opt = this.options.find(o => String(this.getValue(o)) === String(v))
        return opt ? this.getLabel(opt) : v
      }).filter(Boolean)
    },
    displayLabel() {
      if (!this.hasValue) return ''
      const opt = this.options.find(o => String(this.getValue(o)) === String(this.value))
      return opt ? this.getLabel(opt) : this.value
    },
    filteredOptions() {
      if (!this.filterText) return this.options
      const q = this.filterText.toLowerCase()
      return this.options.filter(o => String(this.getLabel(o)).toLowerCase().includes(q))
    }
  },
  watch: {
    filterText() { this.hoverIdx = -1 }
  },
  mounted() {
    document.addEventListener('keydown', this._esc)
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this._esc)
  },
  methods: {
    _esc(e) { if (e.key === 'Escape') this.closeDropdown() },
    getValue(o) { return o && o[this.valueKey] !== undefined ? o[this.valueKey] : (o ? o.value : o) },
    getLabel(o) { return o && o[this.labelKey] !== undefined ? o[this.labelKey] : (o ? o.label : String(o)) },
    isSelected(v) {
      if (this.multiple && Array.isArray(this.value)) return this.value.some(x => String(x) === String(v))
      return String(this.value) === String(v)
    },
    toggle() {
      if (this.disabled) return
      this.dropdownOpen = !this.dropdownOpen
      if (this.dropdownOpen) {
        this.filterText = ''; this.hoverIdx = -1
        this.$nextTick(() => { if (this.filterable && this.$refs.filterInput) this.$refs.filterInput.focus() })
      }
    },
    closeDropdown() { this.dropdownOpen = false; this.filterText = '' },
    onTriggerClick() { if (!this.disabled) this.toggle() },
    onTriggerKeydown(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggle() } },
    pick(opt) {
      const v = this.getValue(opt)
      if (this.multiple) {
        const arr = Array.isArray(this.value) ? [...this.value] : []
        const i = arr.findIndex(x => String(x) === String(v))
        i > -1 ? arr.splice(i, 1) : arr.push(v)
        this.$emit('input', arr)
      } else {
        this.$emit('input', v)
        this.closeDropdown()
      }
    },
    onClear() { this.$emit('input', this.multiple ? [] : '') }
  }
}
</script>

<style scoped>
/* ── 容器 ── */
.cs-wrapper {
  position: relative;
  width: 100%;
  font-size: 12px;
  color: #333;
  user-select: none;
}

/* ── 触发器：完全输入框外观 ── */
.cs-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d5d5d5;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.cs-trigger:hover { border-color: #c9190b; }
.cs-open .cs-trigger { border-color: #c9190b; }

.cs-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
}
.cs-placeholder { color: #999; }

/* 多选标签 */
.cs-tag {
  display: inline-block;
  padding: 1px 6px;
  background: #fef0ef;
  color: #c9190b;
  border-radius: 3px;
  font-size: 11px;
  line-height: 1.6;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cs-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.cs-clear { font-size: 14px; color: #999; cursor: pointer; line-height: 1; padding: 0 2px; }
.cs-clear:hover { color: #c9190b; }
.cs-arrow { font-size: 11px; color: #999; }

/* ── 遮罩 ── */
.cs-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: transparent;
}

/* ── 下拉菜单：干净的白卡片 ── */
.cs-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 1000;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  max-height: 232px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 搜索条 */
.cs-search { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }
.cs-search-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}
.cs-search-input:focus { border-color: #c9190b; }

/* 选项列表 */
.cs-list { flex: 1; overflow-y: auto; padding: 4px 0; }
.cs-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  transition: none;
}
.cs-item-hover { background: #f5f5f5; }
.cs-item-on { color: #c9190b; font-weight: 600; background: #fff5f4; }
.cs-item-on.cs-item-hover { background: #feeeed; }

/* 选中勾 */
.cs-chk {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #fff;
  background: #fff;
}
.cs-item-on .cs-chk { background: #c9190b; border-color: #c9190b; }

.cs-lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.cs-empty { padding: 20px 12px; text-align: center; color: #999; font-size: 12px; }
</style>
