<template>
  <div class="panel ai-expand-section">
    <div style="margin-top: 12px;">
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
              <el-select v-model="selectedSession" multiple collapse-tags popper-append-to-body popper-class="optional-el-select-dropdown" class="optional-el-select" placeholder="全部" @change="onSessionChange">
                <el-option v-for="s in availableSessions" :key="s.value" :label="s.label" :value="s.value"></el-option>
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
          <div class="optional-row" v-if="selectedCategory === 'jianyi'">
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
          <div class="optional-row" v-if="selectedCategory === 'jianyi'">
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
        <div>
          <div v-if="selectedCategory === 'jianyi'" class="outline-summary-filter">
            <div class="outline-summary-title">十五五<br />规划纲要</div>
            <div class="outline-summary-fields">
              <div class="optional-row">
                <div class="optional-item">
                  <label class="optional-label">篇：</label>
                  <el-select
                    v-model="selectedPian"
                    class="optional-el-select"
                    placeholder="请选择"
                    popper-append-to-body
                    popper-class="outline-tree-select-dropdown"
                    @change="onPianChange"
                  >
                    <el-option
                      v-for="item in outlinePianOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>
                <div class="optional-item">
                  <label class="optional-label">章：</label>
                  <el-select
                    v-model="selectedZhang"
                    class="optional-el-select"
                    placeholder="请选择"
                    popper-append-to-body
                    popper-class="outline-tree-select-dropdown"
                    @change="onZhangChange"
                  >
                    <el-option-group
                      v-for="group in outlineZhangGroups"
                      :key="group.value"
                      :label="group.label"
                    >
                      <el-option
                        v-for="item in group.children"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-option-group>
                  </el-select>
                </div>
                <div class="optional-item">
                  <label class="optional-label">节：</label>
                  <el-select
                    v-model="selectedJie"
                    class="optional-el-select"
                    placeholder="请选择"
                    popper-append-to-body
                    popper-class="outline-tree-select-dropdown"
                    @change="onJieChange"
                  >
                    <el-option-group
                      v-for="group in outlineJieGroups"
                      :key="group.value"
                      :label="group.label"
                    >
                      <el-option
                        v-for="item in group.children"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-option-group>
                  </el-select>
                </div>
              </div>
              <div class="optional-row">
                <div class="optional-item">
                  <label class="optional-label">句：</label>
                  <el-select
                    v-model="selectedJu"
                    class="optional-el-select"
                    placeholder="请选择"
                    popper-append-to-body
                    popper-class="outline-tree-select-dropdown"
                  >
                    <el-option-group
                      v-for="group in outlineJuGroups"
                      :key="group.value"
                      :label="group.label"
                    >
                      <el-option
                        v-for="item in group.children"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-option-group>
                  </el-select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="optional-controls">
          <div class="optional-row">
            <div class="optional-item">
              <label class="optional-label">关键词：</label>
              <div class="dual-textarea-wrapper">
                <!-- <textarea v-model="exactWordInput" class="optional-select dual-text-input" placeholder="请输入精准检索词（以、分隔）" /> -->
                <textarea v-model="exactWordInput" class="optional-select dual-text-input" placeholder="请输入精准检索词（以回车分隔）" />
                <button class="textarea-expand-btn" @click="openExpand('exact')" title="放大">⤢</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- <button style="float:right" class="btn btn-outline btn-sm" @click="tagModalVisible = true">标签检索</button> -->

    <!-- 标签检索弹框 -->
    <TagSearchModal :visible="tagModalVisible" @close="tagModalVisible = false" @quote="onTagQuote" />
    <mask-editor
      v-model="exactWordInput"
      :visible.sync="showEditor"
      title="关键词"
      placeholder="请输入精准检索词（以回车分隔）"
      show-word-limit
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
    <!-- 放大输入框 -->
  </div>
</template>

<script>
import SearchHelper from '../../../utils/classes/SearchHelper'
import { getjc } from '../../../api/zhaiyao'
import { getSearchTree } from '../../../api/login'
import { ensureBzSession, doBzLogin } from '../../../utils/session'
import { mapState } from 'vuex'
import axios from 'axios'
import TagSearchModal from './TagSearchModal.vue'
import MaskEditor from './MaskEditor.vue'

export default {
  name: 'FilterConditions',
  components: { TagSearchModal, MaskEditor },
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
    budgetExactWords: { type: Array, default: () => [] },
    showHeaderActions: { type: Boolean, default: true },
    externalSelectedKeywords: { type: Array, default: () => [] },
    externalSelectedSegmentContents: { type: Array, default: () => [] },
    // 由父组件（AdviceClusterLeft）计算好的模糊词（含模糊词模板叶节点 + 入库区文件）
    fuzzyWords: { type: String, default: '' },
    // 入库区已选文件（仅用于操作历史展示）
    warehouseLabels: { type: Array, default: () => [] }
    // 说明：十五五规划纲要用到的数据现已完全由 getSearchTree() 接口提供，
    // 不再接收父组件透传的 pianOptions / zhangOptions / jieOptions / juOptions。
  },
  emits: ['search', 'reset', 'category-change', 'update:exact-word', 'update:fuzzy-word'],
  data() {
    return {
      selectedCategory: 'jianyi',
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
      tagModalVisible: false,
      jieci: '',
      dynamicSessionOptions: [],
      sessionSelectionTouched: false,
      keyProposalList: [], // 重点建议（重命名避免与导入函数冲突）
      keyProposalLoading: false,
      keyProposalLoadFailed: false,
      // ===== 十五五规划纲要：接口解析后的树数据 =====
      outlineTreeData: [],
      selectedPian: '',
      selectedZhang: '',
      selectedJie: '',
      selectedJu: '',
      showEditor: false,
      filterCblx: [
        { value: '主办', label: '主办' },
        { value: '独办', label: '独办' },
        { value: '协办', label: '协办' },
        { value: '分办', label: '分办' },
        { value: '参阅', label: '参阅' }
      ]
    }
  },
  computed: {
    availableSessions() {
      // return this.dynamicSessionOptions.length ? this.dynamicSessionOptions : this.filterSessions
      return this.dynamicSessionOptions.length ? this.dynamicSessionOptions : []
    },

    /* ==================== 十五五规划纲要下拉数据 ==================== */
    // 篇下拉：无分组，直接平铺所有篇
    outlinePianOptions() {
      return this.outlineTreeData.map(p => this.buildOutlineItem(p))
    },

    // 章下拉：未选篇时返回空，选了篇才展示该篇下的章（按篇分组）
    outlineZhangGroups() {
      if (!this.selectedPian) return []
      const pian = this.outlineTreeData.find(p => p.value === this.selectedPian)
      if (!pian) return []
      return [{
        value: pian.value,
        label: pian.label,
        children: (pian.children || []).map(z => this.buildOutlineItem(z))
      }]
    },

    // 节下拉：未选章时返回空，选了章才展示该章下的节（按章分组）
    outlineJieGroups() {
      if (!this.selectedZhang) return []
      const zhang = this.findOutlineNodeById(this.selectedZhang, 2)
      if (!zhang) return []
      return [{
        value: zhang.value,
        label: zhang.label,
        children: (zhang.children || []).map(j => this.buildOutlineItem(j))
      }]
    },

    // 句下拉：未选节时返回空，选了节才展示该节下的句（按节分组）
    outlineJuGroups() {
      if (!this.selectedJie) return []
      const jie = this.findOutlineNodeById(this.selectedJie, 3)
      if (!jie) return []
      return [{
        value: jie.value,
        label: jie.label,
        children: (jie.children || []).map(ju => this.buildOutlineItem(ju))
      }]
    },

    /* ==================== 字典相关 ==================== */
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
    if (this.availableSessions.length) {
      this.selectedSession = [this.availableSessions[0].value]
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

    // 拉取十五五规划纲要树（结构），解析为「篇/章/节/句」层级数据
    getSearchTree().then((res) => {
      const treeData = this.resolveTreeData(res)
      this.outlineTreeData = this.parseOutlineTree(treeData)
      console.log('[十五五规划纲要] 解析完成，篇数：', this.outlineTreeData.length)
    }).catch((err) => {
      console.error('获取十五五规划纲要树失败：', err)
    })
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

    /* ==================== 十五五规划纲要：数据解析 ==================== */
    // 兼容多种响应包装结构，取出真正的 tree 数组
    // 常见结构（swwgh.json）：res.data.data.data.tree
    resolveTreeData(res) {
      if (!res) return []
      const candidates = [
        res?.data?.data?.data?.tree,
        res?.data?.data?.tree,
        res?.data?.tree,
        res?.tree
      ]
      for (const c of candidates) {
        if (Array.isArray(c) && c.length) return c
      }
      return []
    },

    // 根据 id + level 在解析后的树中查找节点
    // level：1=篇 2=章 3=节
    findOutlineNodeById(id, level) {
      if (!id) return null
      if (level === 1) {
        return this.outlineTreeData.find(p => p.value === id) || null
      }
      if (level === 2) {
        for (const p of this.outlineTreeData) {
          const found = (p.children || []).find(z => z.value === id)
          if (found) return found
        }
        return null
      }
      if (level === 3) {
        for (const p of this.outlineTreeData) {
          for (const z of (p.children || [])) {
            const found = (z.children || []).find(j => j.value === id)
            if (found) return found
          }
        }
        return null
      }
      return null
    },

    // 把节点文本包装成下拉项：完整文本，不截断（换行由下拉项样式控制）
    buildOutlineItem(node) {
      const label = String(node.label || '').trim()
      return {
        value: node.value,
        label
      }
    },

    // 解析 swwgh.json 中的 tree 结构：
    //   level 1 container（有 title）           -> 篇
    //   level 2 container（有 title）           -> 章
    //   level 3 block/container（有 title）     -> 节
    //   level 4 sentence（有 content）          -> 句
    parseOutlineTree(tree) {
      if (!Array.isArray(tree)) return []
      const result = []

      tree.forEach(pian => {
        if (pian?.level !== 1 || !pian?.title) return

        const pianNode = {
          value: pian.id,
          label: pian.title,
          children: []
        }

        // 章：level 2 且 role=container，必须有 title（过滤掉 1.1 这种无 title 的内容块）
        const zhangList = (pian.children || []).filter(
          ch => ch?.role === 'container' && ch?.title
        )

        zhangList.forEach(zhang => {
          const zhangNode = {
            value: zhang.id,
            label: zhang.title,
            children: []
          }

          // 节：level 3 且带 title（block / container 都兼容）
          const jieList = (zhang.children || []).filter(jie => jie?.title)

          jieList.forEach(jie => {
            const jieNode = {
              value: jie.id,
              label: jie.title,
              children: []
            }

            // 句：level 4 sentence，有 content
            const juList = (jie.children || []).filter(
              ju => ju?.role === 'sentence' && ju?.content
            )

            juList.forEach(ju => {
              const text = String(ju.content).trim()
              jieNode.children.push({
                value: ju.id,
                label: text
              })
            })

            zhangNode.children.push(jieNode)
          })

          pianNode.children.push(zhangNode)
        })

        result.push(pianNode)
      })

      return result
    },

    /* ==================== 接口请求 ==================== */
    // 获取届次
    fetchSessionInfo() {
      getjc().then(res => {
        if (res?.data && res.result === 0) {
          const { jh, ch } = res.data
          const options = this.buildSessionOptions(jh, ch)
          if (!options.length) {
            console.error('获取届次信息失败：响应中的jh/ch无效')
            this.fetchKeyProposal()
            return
          }
          this.jieci = `${jh}-${ch}`
          this.dynamicSessionOptions = options
          if (!this.sessionSelectionTouched) {
            this.selectedSession = [this.jieci]
          }
          this.fetchKeyProposal()
        } else {
          console.error('获取届次信息失败')
        }
      }).catch(err => {
        console.error('获取届次信息请求异常：', err)
      })
    },

    buildSessionOptions(jh, ch) {
      const currentJH = Number(jh)
      const currentCH = Number(ch)
      if (
        !Number.isInteger(currentJH) || currentJH < 1 ||
        !Number.isInteger(currentCH) || currentCH < 1 || currentCH > 5
      ) {
        return []
      }

      const firstJH = Math.max(1, currentJH - 1)
      const sessions = []
      for (let sessionJH = firstJH; sessionJH <= currentJH; sessionJH += 1) {
        const lastCH = sessionJH === currentJH ? currentCH : 5
        for (let sessionCH = 1; sessionCH <= lastCH; sessionCH += 1) {
          const value = `${sessionJH}-${sessionCH}`
          sessions.push({ value, label: value })
        }
      }
      return SearchHelper.sortSessionsDesc(sessions)
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
    onSessionChange() {
      this.sessionSelectionTouched = true
    },
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
      this.selectedCategory = 'jianyi'
      this.sessionSelectionTouched = false
      const defaultSession = this.jieci || this.availableSessions[0]?.value
      this.selectedSession = defaultSession ? [defaultSession] : []
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
      if (this.selectedCategory === 'yusuan') {
        this.exactWordInput = (Array.isArray(this.budgetExactWords) ? this.budgetExactWords : SearchHelper.DEFAULT_BUDGET_WORDS)
          .map(item => String(item || '').trim()).filter(Boolean).join('\n')
      } else {
        this.exactWordInput = ''
      }
      if (this.selectedCategory !== 'jianyi') {
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

    // 篇章句联动：切换上级自动清空下级选中值
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

    openExpand() {
      this.showEditor = true
    },
    // 点击「确定」，参数是当前输入内容
    handleConfirm(val) {
      console.log('确认内容：', val)
    },
    // 点击「取消」，参数是回滚后的原值
    handleCancel(val) {
      console.log('取消，内容已回滚为：', val)
    },
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

<!-- 十五五规划纲要下拉面板：弹层挂在 body 上，必须使用全局样式 -->
<style>
.outline-tree-select-dropdown {
  min-width: 320px;
  max-width: 560px;
}
.outline-tree-select-dropdown .el-select-dropdown__wrap {
  max-height: 360px;
}

/* 分组标题 = 父级（篇 / 章 / 节），左对齐 + 红点标识，长文本自动换行 */
.outline-tree-select-dropdown .el-select-group__title {
  position: relative;
  padding-left: 20px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  padding-top: 6px;
  padding-bottom: 6px;
  color: #c9190b;
  background: #fafafa;
  white-space: normal;
  word-break: break-all;
  height: auto;
}
.outline-tree-select-dropdown .el-select-group__title::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 16px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c9190b;
}

/* 子级选项 = 章 / 节 / 句：缩进 + 树形引导线，长文本直接换行完整展示 */
.outline-tree-select-dropdown .el-select-group .el-select-dropdown__item {
  position: relative;
  padding-left: 36px;
  padding-right: 12px;
  height: auto;
  min-height: 34px;
  line-height: 20px;
  padding-top: 7px;
  padding-bottom: 7px;
  white-space: normal;
  word-break: break-all;
}
/* 篇下拉（无分组）也允许换行，保持风格统一 */
.outline-tree-select-dropdown .el-select-dropdown__item {
  height: auto;
  min-height: 34px;
  line-height: 20px;
  padding-top: 7px;
  padding-bottom: 7px;
  white-space: normal;
  word-break: break-all;
}
.outline-tree-select-dropdown .el-select-group .el-select-dropdown__item::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #e4e7ed;
}
.outline-tree-select-dropdown .el-select-group .el-select-dropdown__item::after {
  content: '';
  position: absolute;
  left: 20px;
  top: 50%;
  width: 10px;
  height: 1px;
  background: #e4e7ed;
}
/* 最后一个子级：竖线只画到中点，避免"尾巴过长" */
.outline-tree-select-dropdown .el-select-group .el-select-dropdown__item:last-child::before {
  bottom: 50%;
}
</style>
