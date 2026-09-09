<!--
 * @Author: wangli wangli@123.com
 * @Date: 2026-07-23 16:43:33
 * @LastEditors: wangli wangli@123.com
 * @LastEditTime: 2026-07-24 14:41:27
 * @FilePath: \search_web\src\views\adviceSearch\components\FilterConditions.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="panel ai-expand-section">
    <div style="margin-top: 15px; margin-bottom: 15px;">
      <div ref="optionalBox" :class="['optional-conditions', { stuck: optionalStuck }]">
        <div class="section-title">
          <span>选定分析的范围</span>
          <!-- <div v-if="showHeaderActions" class="section-actions">
            <button class="btn btn-sm" @click="onSearch">检索聚类</button>
            <button class="btn btn-outline btn-sm" @click="onReset">重置选择</button>
          </div> -->
        </div>
        <div class="optional-controls">
          <div class="optional-row">
            <div class="optional-item">
              <label class="optional-label">来源库：</label>
              <el-select v-model="selectedCategory" class="optional-el-select" placeholder="请选择" @change="onCategoryChange">
                <el-option v-for="c in categories" :key="c.value" :label="c.label" :value="c.value"></el-option>
              </el-select>
            </div>
            <div class="optional-item">
              <label class="optional-label">会议届次：</label>
              <el-select v-model="selectedSession" multiple collapse-tags popper-append-to-body popper-class="optional-el-select-dropdown" class="optional-el-select" placeholder="全部">
                <el-option v-for="s in filterSessions" :key="s.value" :label="s.label" :value="s.value"></el-option>
              </el-select>
            </div>
          </div>
          <div class="optional-row">
            <div class="optional-item">
              <label class="optional-label">代表：</label>
              <input v-model="selectedRepresentative" class="optional-select" placeholder="请输入代表姓名" type="text" />
            </div>
            <div class="optional-item">
              <label class="optional-label">代表团：</label>
              <template v-if="delegationList.length === 1">
                <input :value="delegationList[0].label" class="optional-select" disabled />
              </template>
              <el-select v-else v-model="selectedDelegation" multiple collapse-tags popper-append-to-body popper-class="optional-el-select-dropdown" class="optional-el-select" placeholder="全部">
                <el-option v-for="d in delegationList" :key="d.value" :label="d.label" :value="d.value"></el-option>
              </el-select>
            </div>
          </div>
          <div class="optional-row" v-if="selectedCategory === '建议库'">
            <div class="optional-item">
              <label class="optional-label">承办单位：</label>
              <el-select v-model="selectedCbdw" filterable clearable popper-append-to-body popper-class="optional-el-select-dropdown" @filter-change="onCbdwFilter" class="optional-el-select" placeholder="请输入或选择承办单位">
                <el-option v-for="d in userDeptName" :key="d.sysDeptId" :label="d.deptName" :value="d.deptName" />
              </el-select>
            </div>
            <div class="optional-item">
              <label class="optional-label">承办类型：</label>
              <el-select v-model="selectedCblx" multiple collapse-tags popper-append-to-body popper-class="optional-el-select-dropdown" class="optional-el-select" placeholder="全部">
                <el-option v-for="d in filterCblx" :key="d.value" :label="d.label" :value="d.value"></el-option>
              </el-select>
            </div>
          </div>
          <div class="optional-row" v-if="selectedCategory === '建议库'">
            <div class="optional-item">
              <label class="optional-label">重点建议：</label>
              <el-select v-model="selectedKeyProposal" multiple collapse-tags popper-append-to-body popper-class="optional-el-select-dropdown" class="optional-el-select" placeholder="全部" @visible-change="onKeyProposalVisibleChange">
                <el-option v-for="d in keyProposalList" :key="d.label" :label="d.label" :value="d.value"></el-option>
              </el-select>
            </div>
            <div class="optional-item">
              <label class="optional-label">编号：</label>
              <input v-model="selectedBh" class="optional-select" placeholder="请输入编号，以中文逗号或英文逗号分隔" type="text" />
            </div>
          </div>
        </div>
        <div >
          <div v-if="selectedCategory === '建议库'" class="outline-summary-filter">
            <div class="outline-summary-title">十五五<br />规划纲要</div>
            <div class="outline-summary-fields">
              <div class="optional-row">
                <div class="optional-item">
                  <label class="optional-label">篇：</label>
                  <el-select v-model="selectedPian" class="optional-el-select" placeholder="请选择" clearable @change="onPianChange">
                    <el-option v-for="item in outlinePianOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>
                <div class="optional-item">
                  <label class="optional-label">章：</label>
                  <el-select v-model="selectedZhang" class="optional-el-select" placeholder="请选择" clearable @change="onZhangChange">
                    <el-option v-for="item in outlineZhangOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>
                <div class="optional-item">
                  <label class="optional-label">节：</label>
                  <el-select v-model="selectedJie" class="optional-el-select" placeholder="请选择" clearable @change="onJieChange">
                    <el-option v-for="item in outlineJieOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>
              </div>
              <div class="optional-row">
                <div class="optional-item">
                  <label class="optional-label">句：</label>
                  <!-- <input v-model="selectedJu" class="optional-select" placeholder="请输入" />
                   -->
                  <el-select v-model="selectedJu" class="optional-el-select" placeholder="请选择" clearable>
                    <el-option v-for="item in outlineJuOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="dual-inputs">
          <div class="dual-input-row">
            <label class="optional-label">关键词：</label>
            <div class="dual-textarea-wrapper">
              <textarea v-model="exactWordInput" class="optional-select dual-text-input" placeholder="请输入精准检索词（支持多行，以换行分隔）" />
              <button class="textarea-expand-btn" @click="openExpand('exact')" title="放大">⤢</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button style="float:right" class="btn btn-outline btn-sm" @click="tagModalVisible = true">标签检索</button>

    <!-- 标签检索弹框 -->
    <TagSearchModal :visible="tagModalVisible" @close="tagModalVisible = false" @quote="onTagQuote" />

    <!-- 放大输入框 -->
    <div v-if="expandedField" class="textarea-expand-mask" @click="closeExpand"></div>
    <div v-if="expandedField" class="textarea-expand-overlay left-textarea-expand-overlay">
      <div class="textarea-expand-header">
        <span>关键词</span>
        <button class="textarea-expand-close" @click="closeExpand">×</button>
      </div>
      <textarea v-model="exactWordInput" class="textarea-expand-input" placeholder="请输入精准检索词"></textarea>
    </div>
  </div>
</template>

<script>
import SearchHelper from '../../../utils/classes/SearchHelper'
import { getjc } from '../../../api/zhaiyao'
import { ensureBzSession, doBzLogin } from '../../../utils/session'
import { mapState } from 'vuex'
import axios from 'axios'
import TagSearchModal from './TagSearchModal.vue'
const MOCK_OUTLINE_TREE = []
const MOCK_OUTLINE_TREE2 = [
  {
    value: 'pian-1',
    label: '第一篇 总体要求11111111111111111111',
    children: [
      {
        value: 'zhang-1-1',
        label: '第一章 发展基础2222222222222222222',
        children: [
          { value: 'jie-1-1-1', label: '第一节 发展成就3333333333333333发展成就3333333333333333', children: [{ value: 'ju-1-1-1-1', label: '坚持高质量发展主题44444444444444444发展成就3333333333333333' }, { value: 'ju-1-1-1-2', label: '推动发展方式转变发展成就3333333333333333发展成就3333333333333333' }] },
          { value: 'jie-1-1-2', label: '第二节 发展环境发展成就3333333333333333发展成就3333333333333333', children: [{ value: 'ju-1-1-2-1', label: '把握重要战略机遇发展成就3333333333333333发展成就3333333333333333发展成就3333333333333333' }] }
        ]
      },
      { value: 'zhang-1-2', label: '第二章 指导思想', children: [{ value: 'jie-1-2-1', label: '第一节 总体指导方针', children: [{ value: 'ju-1-2-1-1', label: '坚持以人民为中心' }] }] }
    ]
  },
  {
    value: 'pian-2',
    label: '第二篇 重点任务',
    children: [
      { value: 'zhang-2-1', label: '第三章 科技创新', children: [{ value: 'jie-2-1-1', label: '第一节 创新体系建设', children: [{ value: 'ju-2-1-1-1', label: '提升自主创新能力' }] }] },
      { value: 'zhang-2-2', label: '第四章 产业发展', children: [{ value: 'jie-2-2-1', label: '第一节 现代化产业体系', children: [{ value: 'ju-2-2-1-1', label: '推进产业基础高级化' }] }] }
    ]
  }
]

export default {
  name: 'FilterConditions',
  components: { TagSearchModal },
  watch: {
    exactWordInput() {
      this.$emit('update:exact-word', this.exactWordInput)
      this.emitTaskAiObjParams()
    },
    fuzzyWordInput() { this.$emit('update:fuzzy-word', this.fuzzyWordInput) },
    fuzzyWords() { this.emitTaskAiObjParams() },

    // 当前选中的代表团/承办单位直接写入 dict store，供右侧分析报告弹窗作为下拉默认值
    selectedDelegation(val) {
      const current = Array.isArray(val) && val.length === 1 ? val[0] : ''
      this.$store.commit('dict/SET_DELEGATION_VALUE', current)
    },
    selectedCbdw(val) {
      this.$store.commit('dict/SET_CBDW_VALUE', val || '')
    },
    // 字典全量到达后，若用户范围内只剩一个代表团则自动选中（label 与 value 统一使用 label）
    dictDelegations() {
      if (this.delegationOptions.length === 1 && !this.selectedDelegation.length) {
        this.selectedDelegation = [this.delegationOptions[0].label]
      }
    }
  },
  props: {
    categories: { type: Array, default: () => [] },
    filterSessions: { type: Array, default: () => [] },
    filterCblx: { type: Array, default: () => [] },
    budgetExactWords: { type: Array, default: () => [] },
    showHeaderActions: { type: Boolean, default: true },
    externalSelectedKeywords: { type: Array, default: () => [] },
    externalSelectedSegmentContents: { type: Array, default: () => [] },
    // 由父组件（AdviceClusterLeft）计算好的模糊词（含模糊词模板叶节点 + 入库区文件）
    fuzzyWords: { type: String, default: '' },
    // 入库区已选文件（仅用于操作历史展示）
    warehouseLabels: { type: Array, default: () => [] },
    // ===== 新增：十五五规划纲要选项 =====
    pianOptions: { type: Array, default: () => [] },
    zhangOptions: { type: Array, default: () => [] },
    jieOptions: { type: Array, default: () => [] },
    juOptions: { type: Array, default: () => [] }
  },
  emits: ['search', 'reset', 'category-change', 'update:exact-word', 'update:fuzzy-word'],
  data() {
    return {
      selectedCategory: '建议库',
      selectedSession: [],
      selectedDelegation: [],
      selectedRepresentative: '',
      selectedCbdw: '',
      selectedCblx: [],
      selectedKeyProposal: [],
      selectedBh: '',
      fuzzyWordInput: '',
      exactWordInput: '',
      optionalStuck: false,
      expandedField: '',
      tagModalVisible: false,
      jieci: '',
      keyProposalList: [], // 重点建议（重命名避免与导入函数冲突）
      keyProposalLoading: false,
      keyProposalLoadFailed: false,
      // ===== 新增：十五五规划纲要数据 =====
      selectedPian: '',
      selectedZhang: '',
      selectedJie: '',
      selectedJu: ''
    }
  },
  computed: {
    outlineTree() {
      return this.pianOptions.length ? this.pianOptions : MOCK_OUTLINE_TREE
    },
    outlinePianOptions() {
      return this.outlineTree.map(item => ({ value: item.value, label: item.label, children: item.children || [] }))
    },
    outlineZhangOptions() {
      const pian = this.outlineTree.find(item => item.value === this.selectedPian)
      return pian && Array.isArray(pian.children) ? pian.children : []
    },
    outlineJieOptions() {
      const zhang = this.outlineZhangOptions.find(item => item.value === this.selectedZhang)
      return zhang && Array.isArray(zhang.children) ? zhang.children : []
    },
    outlineJuOptions() {
      const jie = this.outlineJieOptions.find(item => item.value === this.selectedJie)
      return jie && Array.isArray(jie.children) ? jie.children : []
    },
    // 字典全量数据统一从 dict store 读取（接口由 store action 拉取，不做用户范围过滤）
    ...mapState('dict', {
      dictDelegations: 'allDelegations',
      dictCbdw: 'allCbdw'
    }),
    // 代表团下拉选项：字典全量再按用户管理范围过滤（仅左侧筛选使用）
    // 注意：item.value 已统一为显示名（与 label 相同），管理范围按字典编号 item.id 匹配
    delegationOptions() {
      const manageDepts = this.userInfo?.manageDepts
      if (manageDepts?.length && manageDepts[0]?.managePubDbtId !== undefined) {
        return this.dictDelegations.filter(
          item => String(manageDepts[0].managePubDbtId) === String(item.id)
        )
      }
      return this.dictDelegations
    },
    delegationList() {
      return this.delegationOptions
    },
    // 承办单位下拉选项：接口全量再按用户部门级别过滤；只剩一个代表团时展示全部部门
    userDeptName() {
      const all = this.dictCbdw
      if (this.delegationOptions.length === 1) return all
      const userDeptInfo = this.userInfo?.sysDeptLevelCode
      if (!Array.isArray(userDeptInfo)) return all
      const filtered = all.filter(dept => userDeptInfo.includes(dept.sysDeptId))
      return filtered.length ? filtered : all
    }
  },
  created() {
    if (this.filterSessions.length) {
      this.selectedSession = [this.filterSessions[0].value]
    }
    this.userInfo = this.getLocalStorageJSON('userInfo') || {}
    this.emitTaskAiObjParams()
    // 重点建议接口（keyProposalSelect）依赖 bz 登录（OPEN_LOGIN）建立的会话 cookie，
    // 必须等 cookie 写入后才能正确调用（其余页面请求都在登录成功之后，无需处理）：
    // 生产环境守卫已登录，此处 ensureBzSession() 直接复用其结果（无额外请求）；
    // 开发环境守卫跳过登录，这里首次调用会触发登录，完成后 cookie 写入再拉重点建议。
    // 链路：登录（cookie 写入）→ 字典 → 届次 → 重点建议
    ensureBzSession().catch(err => {
      console.warn('bz 登录失败，重点建议可能不可用：', err)
    }).then(() => this.$store.dispatch('dict/fetchAll'))
      .then(() => this.fetchSessionInfo())
  },
  methods: {
    /* ==================== 工具方法 ==================== */
    // 安全读取 localStorage 并解析 JSON
    getLocalStorageJSON(key) {
      try {
        const str = localStorage.getItem(key)
        return str ? JSON.parse(str) : null
      } catch (e) {
        console.error(`解析 localStorage[${key}] 失败`, e)
        return null
      }
    },

    /* ==================== 接口请求 ==================== */
    // 获取届次
    fetchSessionInfo() {
      getjc().then(res => {
        if (res?.data && res.result === 0) {
          this.jieci = (res.data.jh + '-' + res.data.ch) || ''
          this.fetchKeyProposal()
        } else {
          console.error('获取届次信息失败')
        }
      }).catch(err => {
        console.error('获取届次信息请求异常：', err)
      })
    },

    // 获取重点议题（依赖届次数据已就绪）
    // 重点建议接口依赖 bz 登录（OPEN_LOGIN）建立的会话 cookie；登录与页面加载几乎同时发生，
    // cookie 写入时机前端无法感知，首次调用可能因会话未就绪失败。兜底：延迟 1.5s 再触发。
    fetchKeyProposal(attempt = 1, delay = 1500) {
      this.keyProposalLoading = true
      setTimeout(() => {
        axios.get('rest/2020/proposal/keyproposaltopic/get/keyProposalSelect', {
          params: { _r: Math.floor(Date.now() / 1000) },
          skipErrorHandling: true
        }).then(res => {
          const responseData = res?.data
          const result = responseData?.result ?? res?.result
          if (result !== 0) {
            const error = new Error('获取重点议题信息失败')
            error.response = res
            throw error
          }

          const list = Array.isArray(responseData?.data) ? responseData.data : responseData?.data || responseData
          this.keyProposalList = (Array.isArray(list) ? list : [])
            .filter(item => item.jieCi === this.jieci)
            .map(item => ({ label: item.title, value: item.title }))
          this.keyProposalLoading = false
          this.keyProposalLoadFailed = false
        }).catch(err => {
          doBzLogin()
          if (attempt < 3) {
            this.fetchKeyProposal(attempt + 1, 2000)
            return
          }

          this.keyProposalLoading = false
          this.keyProposalLoadFailed = true
          console.error('获取重点议题信息失败：', err)
        })
      }, delay)
    },

    onKeyProposalVisibleChange(visible) {
      if (visible && this.keyProposalLoadFailed && !this.keyProposalLoading) {
        this.fetchKeyProposal(1, 0)
      }
    },
    // fetchKeyProposal().then(res => {
    //   if (res?.data && res.result === 0) {
    //     this.keyProposalList = (res.data || [])
    //       .filter(item => item.jieCi === this.jieci)
    //       .map(item => ({ label: item.title, value: item.title }))
    //   } else {
    //     console.error('获取重点议题信息失败')
    //   }
    // }).catch(err => {
    //   console.error('获取重点议题信息请求异常：', err)
    // })

    /* ==================== 交互事件 ==================== */
    onSearch() {
      // 模糊词（含模糊词模板 + 入库区文件）由父组件合并计算后传入，此处直接使用
      var mergedFuzzy = this.fuzzyWords || ''

      const baseParams = SearchHelper.buildSearchParams({
        selectedCategory: this.selectedCategory,
        selectedSession: this.selectedSession,
        selectedDelegation: this.selectedDelegation,
        selectedRepresentative: this.selectedRepresentative,
        selectedCbdw: this.selectedCbdw,
        selectedCblx: this.selectedCblx,
        selectedKeyProposal: this.selectedKeyProposal,
        selectedBh: this.selectedBh,
        exactWordInput: this.exactWordInput,
        semiFuzzyWordInput: mergedFuzzy,
        fuzzyWordInput: this.fuzzyWordInput
      })

      // ===== 合并新增的十五五规划纲要字段 =====
      const params = {
        ...baseParams,
        selectedPian: this.selectedPian,
        selectedZhang: this.selectedZhang,
        selectedJie: this.selectedJie,
        selectedJu: this.selectedJu
      }

      const sels = SearchHelper.collectSearchKeywords({
        exactWordInput: this.exactWordInput,
        semiFuzzyWordInput: mergedFuzzy,
        fuzzyWordInput: this.fuzzyWordInput,
        selectedKeywords: this.externalSelectedKeywords,
        selectedSegmentContents: this.externalSelectedSegmentContents
      })
      var filterParts = [
        this.selectedCategory && '来源库=' + this.selectedCategory,
        this.selectedSession.length && '届次=' + this.selectedSession.join(','),
        this.selectedDelegation.length && '代表团=' + this.selectedDelegation.join(','),
        this.selectedRepresentative && '代表=' + this.selectedRepresentative
      ]
      // 入库区选中项加入操作历史
      if (this.warehouseLabels && this.warehouseLabels.length) {
        filterParts.push('入库=' + this.warehouseLabels.join(','))
      }
      // ===== 新增：十五五规划纲要历史记录 =====
      if (this.selectedPian) filterParts.push('篇=' + this.selectedPian)
      if (this.selectedZhang) filterParts.push('章=' + this.selectedZhang)
      if (this.selectedJie) filterParts.push('节=' + this.selectedJie)
      if (this.selectedJu) filterParts.push('句=' + this.selectedJu)

      var historyText = SearchHelper.buildHistoryText(sels, filterParts.filter(Boolean))
      this.$emit('search', { params, historyText })
    },

    onReset() {
      this.selectedCategory = '建议库'
      this.selectedSession = this.filterSessions.length ? [this.filterSessions[0].value] : []
      // 代表团只有一个值时固定选中，重置不清除
      if (this.delegationList.length !== 1) {
        this.selectedDelegation = []
      }
      this.selectedRepresentative = ''
      this.selectedCblx = []
      this.selectedKeyProposal = []
      this.fuzzyWordInput = ''
      this.exactWordInput = ''
      this.selectedCbdw = ''
      this.selectedBh = ''
      // ===== 重置十五五规划纲要字段 =====
      this.selectedPian = ''
      this.selectedZhang = ''
      this.selectedJie = ''
      this.selectedJu = ''
      this.$emit('reset')
    },

    onCategoryChange() {
      if (this.selectedCategory === '预算库') {
        this.exactWordInput = (Array.isArray(this.budgetExactWords) ? this.budgetExactWords : SearchHelper.DEFAULT_BUDGET_WORDS)
          .map(item => String(item || '').trim()).filter(Boolean).join('\n')
      } else {
        this.exactWordInput = ''
      }
      if (this.selectedCategory !== '建议库') {
        this.selectedCbdw = ''
        this.selectedCblx = []
        this.selectedKeyProposal = []
        this.selectedBh = ''
        // ===== 清空十五五规划纲要字段 =====
        this.selectedPian = ''
        this.selectedZhang = ''
        this.selectedJie = ''
        this.selectedJu = ''
      }
      this.$emit('category-change', this.selectedCategory)
      this.emitTaskAiObjParams()
    },

    onPianChange() {
      this.selectedZhang = ''
      this.selectedJie = ''
      this.selectedJu = ''
    },

    onZhangChange() {
      this.selectedJie = ''
      this.selectedJu = ''
    },
    onJieChange() {
      this.selectedJu = ''
    },
    emitTaskAiObjParams() {
      this.$store.commit('taskAiParams/SET_PARAMS', {
        data_base: SearchHelper.CATEGORY_MAP[this.selectedCategory] || 'jianyi',
        theme: SearchHelper.parseMultiLine(this.fuzzyWords),
        term_theme: SearchHelper.parseMultiLine(this.exactWordInput)
      })
    },

    openExpand(field) { this.expandedField = field },
    closeExpand() { this.expandedField = '' },

    // 标签检索弹框：引用某条标签 → 写入精准检索词（watch 会自动同步给父组件）
    onTagQuote(row) {
      if (!row || !row.tagName) return
      this.exactWordInput = row.tagName
    },

    // 承办单位：输入框文字被删空时清除选中值，像普通输入框一样可以删掉文字来清除
    onCbdwFilter(query) {
      if (query === '' && this.selectedCbdw) {
        this.selectedCbdw = ''
      }
    }
  }
}
</script>

<style scoped>
/* 样式已在父组件的全局样式中定义，此组件继承即可 */
.outline-summary-filter {
  display: flex;
  align-items: stretch;
  width: 100%;
  margin-top: 2px;
}

.outline-summary-title {
  margin-right: -56px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  flex: 0 0 86px;
  padding-right: 20px;
  color: #c9190b;
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}

.outline-summary-title::after {
  position: absolute;
  top: 8px;
  right: 20px;
  bottom: 8px;
  width: 6px;
  border-top: 2px solid #c9190b;
  border-left: 2px solid #c9190b;
  border-bottom: 2px solid #c9190b;
  content: '';
}

.outline-summary-fields {
  flex: 1;
  min-width: 0;
}

.outline-summary-fields .optional-row {
  display: flex;
}

.outline-summary-fields .optional-row + .optional-row {
  margin-top: 8px;
}

@media (max-width: 700px) {
  .outline-summary-title {
    width: 88px;
    flex-basis: 88px;
    padding-right: 14px;
  }

  .outline-summary-title::after {
    right: 4px;
  }
}
</style>
