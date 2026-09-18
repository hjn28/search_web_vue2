<template>
  <div class="left-container" ref="leftContainer">
    <!-- ======== 引文替换视图 ======== -->
    <template v-if="citationData && citationData.length">
      <CitationView
        :citation-data="citationData"
        :active-key-id="activeKeyId"
        @close-citation="$emit('close-citation')"
      />
    </template>

    <!-- ======== 正常主面板 ======== -->
    <template v-else>
      <div class="left-scroll-area" ref="leftScrollArea">

        <!-- ======== 顶部：选定分析的范围 ======== -->
        <FilterConditions
          ref="filterConditions"
          v-if="leftMode === 'input'"
          :categories="categories"
          :filter-sessions="filterSessions"
          :filter-cblx="filterCblx"
          :budget-exact-words="budgetExactWords"
          :show-header-actions="false"
          :external-selected-keywords="selectedKeywords"
          :external-selected-segment-contents="selectedSegmentContents"
          :fuzzy-words="mergedFuzzyWords"
          :warehouse-labels="warehouseFiles"
          @search="onFilterSearch"
          @reset="onFilterReset"
          @category-change="onFilterCategoryChange"
          @update:exact-word="onFilterExactChange"
          @update:fuzzy-word="onFilterFuzzyChange"
        />

        <!-- ======== 中部：构建分析的分类体系 ======== -->
        <div class="panel">
          <div class="section-title">
            <span>构建分析的分类体系</span>
            <div class="section-actions section-actions-compact">
              <!-- <button
                class="title-icon-btn"
                title="开始上传资料"
                @click="onWarehouseUpload"
              >
                <img class="warehouse-upload-icon" src="~@/assets/img/study.svg" alt="上传文件" />
                <el-tooltip
                  content="提供分类释义、政策文件及历史分析报告，支撑大模型深度学习理解分类逻辑"
                  placement="top"
                  popper-class="icon-badge-tooltip"
                  :open-delay="300"
                >
                  <span
                    class="icon-badge"
                    @click.stop="showAlert('提供分类释义、政策文件及历史分析报告，支撑大模型深度学习理解分类逻辑')"
                  >?</span>
                </el-tooltip>
              </button> -->
              <button class="btn btn-outline btn-sm" @click="onEditWord">上传分类模板</button>
              <button class="btn btn-outline btn-sm" @click="toggleAssistBuild">辅助分类构建</button>
              <button class="btn btn-outline btn-sm" @click="onWarehouseUpload">上传分类学习资料</button>
              <!-- <button class="title-icon-btn" @click="onEditWord" title="上传模板">
                <img class="warehouse-upload-icon" src="~@/assets/img/upload_template.svg" alt="上传模板" />
              </button> -->
            </div>
          </div>

          <div v-if="leftMode === 'fileSearch'" class="file-search-panel">
            <div class="file-search-row">
              <input v-model="fileSearchQuery" class="file-search-input" placeholder="输入关键字搜索议案 / 建议" />
              <button class="btn" @click="searchFiles">搜索</button>
            </div>
            <div v-if="fileSearchResults && fileSearchResults.length" class="result-table-container file-search-results">
              <table class="result-table file-search-table">
                <thead>
                  <tr>
                    <th>编号</th>
                    <th>标题</th>
                    <th>代表</th>
                    <th>代表团</th>
                    <th class="action-col">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in fileSearchResults" :key="item.id || idx">
                    <td>{{ item.id || '-' }}</td>
                    <td :title="item.title">{{ item.title || '未命名' }}</td>
                    <td>{{ item.representative || '-' }}</td>
                    <td>{{ item.delegation || '-' }}</td>
                    <td class="action-col">
                      <button class="btn btn-sm" @click="addSearchResultToCluster(item)">添加</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="file-search-empty">请输入关键词后搜索，或无匹配结果</div>
          </div>

          <template v-else>
            <!-- 分类体系内部下方内容（模板输入区 / 辅助构建 / 输入与分类选择）：左右间距 30px -->
            <div class="category-build-wrap">
              <div class="category-template-card">
                <template v-if="templateHasData">
                  <div class="word-tree-items category-template-tree">
                    <div
                      v-for="node in flatWordTree"
                      :key="node.id"
                      class="word-tree-node"
                      :style="{ paddingLeft: (node.depth * 20) + 'px' }"
                    >
                      <span class="word-tree-label">{{ node.name }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <textarea
                    v-model="filterSemiFuzzyWord"
                    class="optional-select dual-text-input category-template-input"
                    placeholder=""
                  />
                  <div v-if="!filterSemiFuzzyWord" class="category-template-hint">
                    <div>1. 单层分类可直接输入此框。</div>
                    <div>2. 多层分类可点击“上传分类模板”上传。</div>
                    <div>3. 点击“辅助分类构建”可查询政策文件，将有关文件要点输入此框构建分类体系。</div>
                    <div>4. 点击“上传分类学习资料”，提供分类释义、政策文件及历史分析报告，支撑大模型深度学习理解分类逻辑。</div>
                  </div>
                  <button class="textarea-expand-btn" @click="openTextareaExpand('semi','构建分析的分类体系')" title="放大">⤢</button>
                </template>
              </div>

              <!-- <div class="assist-build-row">
                <button class="assist-build-trigger dropdown-control" type="button" @click="toggleAssistBuild">
                  <span>辅助构建</span>
                  <i :class="assistExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
                </button>
                <span class="assist-build-hint">(查询政策文件辅助构建分析分类)</span>
              </div> -->

              <div v-show="assistExpanded" class="keyword-search-box">
                <div class="keyword-search-title">输入与分类选择：</div>
                <div class="textarea-with-expand keyword-textarea-wrap" style="position:relative">
                  <textarea v-model="textInputs.word" class="text-input keyword-text-input" placeholder="请输入词或句"></textarea>
                  <button class="textarea-expand-btn" @click="openTextareaExpand('word','输入与分类选择')" title="放大">⤢</button>
                </div>
                <div class="keyword-search-actions">
                  <button class="btn btn-outline btn-sm" :disabled="!canOnceExpand" @click="handleOnceExpand">查询</button>
                  <button class="btn btn-outline btn-sm" :disabled="!(primaryResults && primaryResults.length)" @click="showExpandResults">
                    查看结果
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- ======== 底部：分析材料入库区 ======== -->
        <div v-if="isShowZlsc" class="panel">
          <div class="section-title"><span>分析材料入库区</span></div>
          <!-- 学习文件区域：左右间距 30px -->
          <div class="warehouse-upload-wrap">
            <div class="optional-row warehouse-upload-row">
              <div class="optional-item">
                <label class="optional-label scxxzl">入库分析资料：</label>
                <input v-model="warehouseFileName" class="optional-select" placeholder="" />
              </div>
              <div class="optional-item">
                <!-- <button class="warehouse-upload-btn icon-only" @click="onWarehouseUpload" title="上传学习资料">
                  <img class="warehouse-upload-icon" src="~@/assets/img/upload_file.svg" alt="上传文件" />
                </button> -->
                <button class="btn btn-outline btn-sm" @click="onWarehouseUpload">上传文件</button>
              </div>
            </div>
            <div v-if="warehouseFiles.length" class="warehouse-file-list">
              <div v-for="f in warehouseFiles" :key="f" class="warehouse-file-item">
                <span class="warehouse-file-name" :title="f">{{ f }}</span>
                <span class="warehouse-file-remove" @click="removeWarehouseFile(f)" title="移除">×</span>
              </div>
            </div>
            <input ref="warehouseFileInput" type="file" multiple class="hidden-file-input" @change="onWarehouseFileChange" />
          </div>
        </div>
      </div>

      <div class="left-fixed-footer">
        <button class="btn btn-outline btn-sm left-fixed-btn" @click="handleBottomReset">重置</button>
        <button class="btn btn-sm left-fixed-btn" @click="handleBottomSearch">开始检索</button>
      </div>
      <mask-editor
        v-model="gjflDbInput"
        :visible.sync="showGjfxEditor"
        :title="giflDbTitle"
        :placeholder="gjflDbPlaceholder"
        show-word-limit
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
    </template>
  </div>
</template>

<script>
/**
 * AdviceClusterLeft - 左侧面板组件
 *
 * 职责：
 *   1. 检索输入（词/句/段/篇）
 *   2. 条件筛选（库类型、届次、代表团等）
 *   3. 一次拓展检索（searchZF）
 *   4. 二次聚类检索（searchZFSearch2）→ 通过事件传给父组件
 *
 * 布局（左侧自上而下三个区域）：
 *   1. 选定分析的范围  → FilterConditions 组件（范围筛选 + 精准词）
 *   2. 构建分析的分类体系 → 关键词输入 + 拓展按钮 + 模糊词一栏
 *   3. 分析材料入库区  → 学习文件上传（点击选择）
 *
 * 不再使用父组件的 vm 引用，所有数据归本组件自管。
 */

import { searchZF, uploadTaskFile, getSourceList, getSearchTree } from '../../../api/login'
import SearchHelper from '../../../utils/classes/SearchHelper'
import CitationView from './CitationView.vue'
import FilterConditions from './FilterConditions.vue'
import TemplateModalBus from '../../../utils/classes/TemplateModalBus'
import data from '../data.json'
import DebounceHelper from '../../../utils/classes/DebounceHelper'
import { mapState } from 'vuex'
import { pinyin } from 'pinyin-pro'
import MaskEditor from '@/components/MaskEditor.vue'
const { mockSearchZFSearch2 } = data

export default {
  name: 'AdviceClusterLeft',
  components: { CitationView, FilterConditions, MaskEditor },
  props: {
    citationData: { type: Array, default: () => [] },
    activeKeyId: { type: String, default: '' }
  },
  data() {
    return {
      /* ---- 输入 ---- */
      inputTab: 'word',
      textInputs: { word: '', sentence: '', paragraph: '' },
      fileName: '',
      searchType: '1',

      /* ---- 筛选（传递给 FilterConditions 组件） ---- */
      categories: [
        // { label: '建议库', value: '建议库' },
        // { label: '议案库', value: '议案库' },
        // { label: '预算库', value: '预算库' }
        { label: '建议库', value: 'jianyi' },
        { label: '议案库', value: 'yian' },
        { label: '预算库', value: 'yusuan' }
      ],
      budgetExactWords: SearchHelper.DEFAULT_BUDGET_WORDS,
      filterSessions: SearchHelper.sortSessionsDesc((data.filters && data.filters.sessions) || []),
      filterRepresentatives: (data.filters && data.filters.representatives) || [],
      filterCblx: (Array.isArray(data.filters && data.filters.filterCblx) && data.filters.filterCblx.length)
        ? data.filters.filterCblx : SearchHelper.DEFAULT_CBLX_OPTIONS,

      /* ---- 检索条件输入（模糊词直接绑定，精准词由 FilterConditions 同步） ---- */
      filterExactWord: '',
      filterSemiFuzzyWord: '',
      filterFuzzyWord: '',

      /* ---- 一次拓展 ---- */
      primaryResults: [],
      selectedKeywords: [],
      selectedSegmentContents: [],
      selectedPrimary: [],
      highlightedPrimary: [],
      /* ---- 其他 ---- */
      leftMode: 'input',
      fileSearchQuery: '',
      fileSearchResults: [],
      assistExpanded: false,

      /* ---- 入库区（分析材料入库区） ---- */
      // isShowZlsc: false, // 是否显示“资料上传”功能（由 authUrl 中是否包含 menu/zhfx/zlsc 决定）
      warehouseFiles: [],
      warehouseFileName: '',
      showGjfxEditor: false,
      gjflDbInput: '',
      gjflDbPlaceholder: '',
      giflDbTitle: ''
    }
  },
  computed: {
    canOnceExpand() {
      if (this.inputTab === 'word') return !!(this.textInputs.word || '').trim()
      if (this.inputTab === 'sentence') return !!(this.textInputs.sentence || '').trim()
      if (this.inputTab === 'paragraph') return !!(this.textInputs.paragraph || '').trim()
      return false
    },
    // 从 Vuex 读取模糊词模板数据（独立于汇总要点/分析报告共用的 template 模块，
    // 回显展示仅由模糊词生成触发，汇总要点/分析报告保存不会写到这里）
    ...mapState('wordTemplate', {
      templateHasData: 'hasData',
      templateTree: 'tree',
      templateFileName: 'wordFileName'
    }),
    ...mapState('dict', {
      isShowZlsc: 'isShowZlsc'
    }),
    // 从树结构中提取所有叶节点名称（不含父节点），用于检索聚类
    templateLeafWords() {
      const result = []
      const walk = (nodes) => {
        if (!Array.isArray(nodes)) return
        nodes.forEach(node => {
          if (node.children && node.children.length) {
            walk(node.children)
          } else if (node.name) {
            result.push(String(node.name).trim())
          }
        })
      }
      walk(this.templateTree)
      return result.filter(Boolean)
    },
    // 将树结构拍平为带缩进层级的一维数组，用于只读树展示
    flatWordTree() {
      const list = []
      const walk = (nodes, depth) => {
        if (!Array.isArray(nodes)) return
        nodes.forEach(node => {
          list.push({ id: node.id, name: node.name, depth })
          if (node.children && node.children.length) walk(node.children, depth + 1)
        })
      }
      walk(this.templateTree, 0)
      return list
    },
    // 合并后的模糊词：模糊词模板有值时用叶节点，否则用输入框内容；再追加入库区文件
    mergedFuzzyWords() {
      const fuzzyValue = this.templateHasData && this.templateLeafWords?.length
        ? this.templateLeafWords.join('\n')
        : (this.filterSemiFuzzyWord || '')
      const warehouseValue = (this.warehouseFiles || []).join('\n')
      return fuzzyValue ? fuzzyValue + '\n' + warehouseValue : warehouseValue
    }
    /* citationRenderNodes → CitationView 组件内计算 */
  },
  created() {
    this.onSearch = DebounceHelper.debounce(this.onSearch, 500, this)
  },
  watch: {
    /**
     * 监听关键词变化，同步给父组件（用于右侧生成汇总要点时导入模板树）
     */
    textInputs: {
      deep: true,
      handler: 'emitKeywords'
    },
    filterSemiFuzzyWord() { this.emitKeywords() },
    // 模板保存后，用叶节点内容替换模糊词输入框的值；模板清空后切换回输入框模式时，输入框值同步置空
    templateHasData(val) {
      if (!val) {
        this.filterSemiFuzzyWord = ''
      } else if (this.templateLeafWords?.length) {
        this.filterSemiFuzzyWord = this.templateLeafWords.join('\n')
      }
    },
    templateTree: {
      deep: true,
      handler() {
        if (this.templateHasData && this.templateLeafWords?.length) {
          this.filterSemiFuzzyWord = this.templateLeafWords.join('\n')
        }
      }
    }
    /* activeKeyId / citationData 的滚动逻辑 → CitationView 组件内处理 */
    /* exactWordInput / fuzzyWordInput → FilterConditions 组件内处理 */
  },
  mounted() {
    this.emitKeywords()
    getSourceList().then((res) => {
      if (res && res.data && Array.isArray(res.data)) {
        // this.categories 拼接上来源库数据，value 使用拼音简写
        this.categories = [
          { label: '建议库', value: 'jianyi' },
          { label: '议案库', value: 'yian' },
          { label: '预算库', value: 'yusuan' },
          ...res.data.map(item => ({
            label: item.label,
            value: item.value
          }))
        ]
      }
    })
  },
  methods: {
    /** 收集关键词并同步给父组件（用于右侧生成汇总要点时导入目录树） */
    emitKeywords() {
      var words = []

      // ──── 1. 主关键词（按逗号分割）始终纳入 ────
      var mainWord = (this.textInputs.word || '').trim()
      if (mainWord) {
        mainWord.split(/[\r\n、，,]+/).forEach(function (w) {
          w = w.trim()
          if (w) words.push(w)
        })
      }

      // ──── 2. 判断半模糊/模糊词是否有值 ────
      var hasSemiOrFuzzy = (this.filterSemiFuzzyWord || '').trim() !== '' ||
                           (this.filterFuzzyWord || '').trim() !== ''

      if (hasSemiOrFuzzy) {
        // ---- 2a. 半模糊/模糊有值 → 只取这两者，不取精准词 ----
        (this.filterSemiFuzzyWord || '').split(/[\r\n、，,]+/).forEach(function (w) {
          w = w.trim()
          if (w) words.push(w)
        });
        (this.filterFuzzyWord || '').split(/[\r\n、，,]+/).forEach(function (w) {
          w = w.trim()
          if (w) words.push(w)
        })
      } else {
        // ---- 2b. 半模糊/模糊均无值 → 单独使用精准词 ----
        (this.filterExactWord || '').split(/[\r\n、，,]+/).forEach(function (w) {
          w = w.trim()
          if (w) words.push(w)
        })
      }

      this.$emit('keywords-change', words)
    },

    showAlert(message) { this.$alert(message, '提示', { confirmButtonText: '确定' }) },
    addHistory(action, content) { this.$emit('add-history', action, content) },

    /* scrollToActiveKeyId / exportCitation → CitationView 组件内处理 */

    /** 统一处理高亮标签：<em> → 红色 <span> */
    handleGl(html) {
      if (!html) return ''
      return String(html)
        .replace(/<em>/g, '<span style="color: var(--primary-red)">')
        .replace(/<\/em>/g, '</span>')
        .replace(/\n\n/g, '\n')
    },

    /* ==================== 输入辅助 ==================== */
    openTextareaExpand(type, title) {
      this.showGjfxEditor = true
      if (type === 'semi') {
        this.gjflDbInput = this.filterSemiFuzzyWord
        this.giflDbTitle = title || '构建分析的分类体系'
        this.gjflDbPlaceholder = '请输入分类体系（以中英文逗号或回车分隔）'
      } else if (type === 'word') {
        this.gjflDbInput = this.textInputs.word
        this.giflDbTitle = title || '输入与分类选择'
        this.gjflDbPlaceholder = '请输入词或句'
      }
      //   else this.$set(this.textInputs, type, value || '')
      // const fields = {
      //   word: { title: '关键词', value: this.textInputs.word, placeholder: '请输入关键词' },
      //   semi: { title: '分类体系', value: this.filterSemiFuzzyWord, placeholder: '请输入分类体系' },
      //   sentence: { title: '句子', value: this.textInputs.sentence, placeholder: '请输入句子' },
      //   paragraph: { title: '段落', value: this.textInputs.paragraph, placeholder: '请输入段落' }
      // }
      // const field = fields[type]
      // if (!field) return

      // this.$prompt(field.placeholder, field.title, {
      //   inputType: 'textarea',
      //   inputValue: field.value || '',
      //   customClass: 'textarea-expand-message-box',
      //   confirmButtonText: '确定',
      //   cancelButtonText: '取消',
      //   closeOnClickModal: true
      // }).then(({ value }) => {
      //   if (type === 'semi') this.filterSemiFuzzyWord = value || ''
      //   else this.$set(this.textInputs, type, value || '')
      // }).catch(() => {})
    },
    handleConfirm(val) {
      console.log('确认内容：', val)
      if (this.giflDbTitle === '构建分析的分类体系') {
        this.filterSemiFuzzyWord = val || ''
      } else if (this.giflDbTitle === '输入与分类选择') {
        this.textInputs.word = val || ''
      }
      // 这里发请求保存
      // await api.save(val)
    },
    // 点击「取消」，参数是回滚后的原值
    handleCancel(val) {
      console.log('取消，内容已回滚为：', val)
    },
    triggerFile() { this.$refs.fileInput && this.$refs.fileInput.click() },

    handleFileChange(e) {
      const file = e.target.files && e.target.files[0]
      this.fileName = file ? file.name : ''
      if (file) this.addHistory('文件上传', `上传文件：${file.name}`)
    },

    /* ==================== 检索聚类（FilterConditions 桥接） ==================== */
    onFilterSearch(payload) {
      // 直接透传 FilterConditions 发出的搜索事件
      this.$emit('cluster-results', payload)
    },
    onFilterReset() {
      this.selectedKeywords = []
      this.selectedSegmentContents = []
      this.selectedPrimary = []
      this.highlightedPrimary = []
      // 模糊词一栏与入库区属于本组件（中部/底部区域），随重置一并清空
      this.filterSemiFuzzyWord = ''
      this.warehouseFiles = []
      this.warehouseFileName = ''
      // 重置时同时清除模糊词模板数据（仅清除模糊词独立模板，不影响汇总要点/分析报告共用模板）
      if (this.templateHasData) {
        this.$store.dispatch('wordTemplate/clearTemplate')
      }
    },
    onFilterCategoryChange() {
      this.filterSemiFuzzyWord = ''
      this.$store.commit('wordTemplate/CLEAR_TEMPLATE')
      this.$store.commit('taskAiParams/SET_PARAMS', {
        data_base: SearchHelper.CATEGORY_MAP[this.$refs.filterConditions.selectedCategory] || 'jianyi',
        theme: [],
        term_theme: SearchHelper.parseMultiLine(this.filterExactWord)
      })
    },
    onFilterExactChange(val) { this.filterExactWord = val; this.emitKeywords() },
    onFilterFuzzyChange(val) { this.filterFuzzyWord = val; this.emitKeywords() },

    /** 辅助构建：仅控制下方输入与分类选择区域显示/隐藏 */
    toggleAssistBuild() {
      this.assistExpanded = !this.assistExpanded
    },

    /** 固定底部按钮：重置 */
    handleBottomReset() {
      const filterVm = this.$refs.filterConditions
      if (filterVm && typeof filterVm.onReset === 'function') {
        filterVm.onReset()
      } else {
        this.onFilterReset()
      }
    },

    /** 固定底部按钮：开始检索 */
    handleBottomSearch() {
      const filterVm = this.$refs.filterConditions
      if (filterVm && typeof filterVm.onSearch === 'function') {
        filterVm.onSearch()
      }
    },

    /* ==================== 模糊词一栏 ==================== */
    /** 编辑模糊词：通过事件总线打开统一模板弹窗 */
    onEditWord() {
      TemplateModalBus.$emit('open-template-modal', {
        type: 'word-edit',
        initialTree: this.templateTree,
        initialFileName: this.templateFileName || ''
      })
    },

    /* ==================== 一次拓展 ==================== */
    handleOnceExpand() {
      this.onSearch()
    },

    onSearch() {
      const text = (this.textInputs.word || '').trim()
      if (!text) { this.showAlert('请输入搜索内容后再进行一次拓展'); return }

      const params = { text: '', content: this.textInputs.word }

      searchZF(params).then(res => {
        const apiList = Array.isArray(res && res.data) ? res.data : []
        this.primaryResults = apiList
        this.selectedKeywords = []
        this.selectedSegmentContents = []
        this.selectedPrimary = []
        // 将一次拓展结果发射到父组件，由右侧面板展示
        this.$emit('expand-results', apiList)
        this.addHistory('一次拓展（接口）', `搜索关键词：${text}`)
        if (!apiList.length) this.showAlert('一次拓展接口无数据')
      }).catch(err => {
        console.error('searchZF error:', err)
        this.primaryResults = []
        this.selectedKeywords = []
        this.selectedSegmentContents = []
        this.selectedPrimary = []
        this.addHistory('一次拓展（接口异常）', `关键词：${text}`)
        this.showAlert('一次拓展接口异常')
      })
    },

    /** 将已有的一次拓展结果发射到父组件，由右侧面板展示 */
    showExpandResults() {
      if (this.primaryResults && this.primaryResults.length) {
        this.$emit('expand-results', this.primaryResults)
      }
    },

    /* ==================== 关键词高亮/选中同步 ==================== */
    togglePrimaryHighlight(kw, item, originIndex, kwIndex) {
      if (!kw) return
      const key = 'primary:' + originIndex + ':' + kwIndex
      const i = this.highlightedPrimary.indexOf(key)
      if (i === -1) {
        this.highlightedPrimary.push(key)
        if (!this.selectedKeywords.includes(kw)) this.selectedKeywords.push(kw)
        const t = item && item.title
        if (t && (!this.selectedPrimary || !this.selectedPrimary.includes(t))) {
          if (!this.selectedPrimary) this.selectedPrimary = []
          this.selectedPrimary.push(t)
        }
      } else {
        this.highlightedPrimary.splice(i, 1)
        this.selectedKeywords = this.selectedKeywords.filter(k => k !== kw)
      }
    },

    onItemTitleChange(item) {
      const checked = this.selectedPrimary && this.selectedPrimary.includes(item.title)
      if (checked) {
        (item.segments || []).forEach(seg => {
          if (seg && seg.content && !this.selectedSegmentContents.includes(seg.content)) this.selectedSegmentContents.push(seg.content)
        })
        ;(item.keywords || []).forEach(kw => { if (!this.selectedKeywords.includes(kw)) this.selectedKeywords.push(kw) })
      } else {
        (item.segments || []).forEach(seg => {
          if (seg && seg.content) this.selectedSegmentContents = this.selectedSegmentContents.filter(s => s !== seg.content)
        })
        ;(item.keywords || []).forEach(kw => { this.selectedKeywords = this.selectedKeywords.filter(k => k !== kw) })
        const prefix = 'primary:' + String((this.primaryResults || []).indexOf(item)) + ':'
        this.highlightedPrimary = this.highlightedPrimary.filter(k => !k.startsWith(prefix))
      }
    },

    /* ==================== 二次检索聚类（委托给 FilterConditions 组件） ==================== */
    /* secondarySearch / clearLeftSelections → FilterConditions.vue */

    /* ==================== 文件搜索（简化/本地） ==================== */
    searchFiles() {
      const q = (this.fileSearchQuery || '').trim()
      if (!q) { this.showAlert('请输入搜索内容'); return }
      const base = Array.isArray(mockSearchZFSearch2) ? mockSearchZFSearch2 : []
      const filtered = base.filter(item => {
        const txt = `${item.id || ''} ${item.title || ''} ${item.representative || ''} ${item.delegation || ''} ${item.content || ''}`.toLowerCase()
        return txt.includes(q.toLowerCase())
      })
      this.fileSearchResults = filtered.length ? filtered : base
      this.addHistory('文件搜索', `${filtered.length ? '过滤结果' : '全部示例'}，关键词：${q}`)
    },

    addSearchResultToCluster(item) {
      if (!item) return
      // 通过父组件传递到右侧
      this.$emit('add-to-cluster', item)
      this.addHistory('添加到聚类结果', `编号：${item.id}`)
      this.showAlert('已添加到右侧聚类结果')
    },

    /* ==================== 分析材料入库区 ==================== */
    /** 触发文件上传 */
    onWarehouseUpload() {
      if (this.$refs.warehouseFileInput) {
        this.$refs.warehouseFileInput.value = ''
        this.$refs.warehouseFileInput.click()
      }
    },
    /** 文件选择框变化：上传文件并在成功后加入入库文件列表 */
    onWarehouseFileChange(e) {
      const files = e && e.target && e.target.files
      if (!files || !files.length) return
      this.uploadWarehouseFiles(files)
      if (e && e.target) e.target.value = ''
    },
    /** 上传文件到分类学习资料索引，接口成功后再加入入库区 */
    uploadWarehouseFiles(files) {
      Array.prototype.forEach.call(files, file => {
        const fileName = String((file && file.name) || '').split('.')[0].trim()
        if (!fileName) return
        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileName', fileName)
        formData.append('indexName', this.toPinyin(fileName))
        formData.append('force', false)

        uploadTaskFile(formData).then(res => {
          if (res && (res.code === 0 || res.success === true)) {
            const label = fileName.replace(/\.\w+$/, '')
            if (label && this.warehouseFiles.indexOf(label) === -1) {
              this.warehouseFiles.push(label)
            }
            this.warehouseFileName = label
            this.addHistory('文件上传', `上传文件：${fileName}`)
            this.$message && this.$message.success('文件上传成功')
          } else {
            this.showAlert((res && (res.message || res.msg)) || '文件上传失败，请重试')
          }
        }).catch(error => {
          console.error('分类学习资料上传失败:', error)
          this.showAlert('文件上传失败，请重试')
        })
      })
    },
    /** 将中文来源库名称转换为接口需要的无声调全拼索引名 */
    toPinyin(value) {
      return pinyin(String(value || ''), {
        toneType: 'none',
        pattern: 'pinyin'
      }).replace(/\s+/g, '')
    },
    /** 移除单个入库文件 */
    removeWarehouseFile(label) {
      const i = this.warehouseFiles.indexOf(label)
      if (i !== -1) this.warehouseFiles.splice(i, 1)
      if (this.warehouseFileName === label) {
        this.warehouseFileName = this.warehouseFiles[0] || ''
      }
    }
  }
}
</script>

<style scoped>
/* 引文相关样式已移至 CitationView.vue */

/* 构建分析分类体系：模板输入区 */
.category-template-card {
  position: relative;
  border: 1px solid var(--border-color, #d5d5d5);
  border-radius: 2px;
  background: #fff;
  min-height: 60px;
  box-sizing: border-box;
  display: flex;
  align-items: stretch;
  margin-top: 8px;
}

.category-template-input {
  width: 100%;
  height: 240px;
  min-height: 58px;
  resize: none;
  border: none;
  border-radius: 0;
  padding-right: 10px;
}

.category-template-hint {
  position: absolute;
  top: 8px;
  right: 10px;
  left: 10px;
  color: #999;
  font-size: 12px;
  line-height: 1.7;
  pointer-events: none;
}

.category-template-tree {
  height: 58px;
  border: none;
  border-radius: 2px;
}

.section-actions-compact {
  display: flex;
  align-items: center;
}
.section-actions-compact > * {
  margin-right: 16px;
}
.section-actions-compact > *:last-child {
  margin-right: 0;
}

.title-icon-btn {
  position: relative;
  width: 24px;
  height: 24px;
  border: none;
  background: #fff;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  color: #fff;
}

.title-icon-btn:hover {
  background: #f8e8e6;
}

.icon-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #333;
  color: #fff;
  font-size: 9px;
  line-height: 12px;
  text-align: center;
}

/* 构建分析分类体系：辅助构建行 */
.assist-build-row {
  display: flex;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 8px;
}
.assist-build-row > * {
  margin-right: 8px;
}
.assist-build-row > *:last-child {
  margin-right: 0;
}

.dropdown-control {
  margin-bottom: 2px;
}

.assist-build-trigger {
  width: 94px;
  height: 30px;
  border: 1px solid var(--border-color, #d5d5d5);
  border-radius: 2px;
  background: #fff;
  font-size: 12px;
  color: #333;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
  cursor: pointer;
  padding: 0;
}

.assist-build-hint {
  flex: 1;
  min-width: 0;
  height: 30px;
  font-size: 12px;
  color: #888;
  display: flex;
  align-items: center;
  padding: 0 10px;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 构建分析分类体系：输入与分类选择 */
/* 分类体系内部下方内容（模板输入区 / 辅助构建 / 输入与分类选择）：左右间距 30px */
.category-build-wrap {
  padding-left:20px;
}

.keyword-search-box {
  margin-top: 10px;
  margin-bottom: 10px;
  border: 1px dashed #dcdcdc;
  border-radius: 4px;
  background: #fafafa;
  padding: 10px;
}

/* 去掉关键词输入框右下角拖拽手柄（全局 .text-input 默认 resize: vertical） */
.keyword-text-input {
  resize: none;
}

.keyword-search-title {
  color: #333;
  font-size: 12px;
  margin-bottom: 8px;
}

.keyword-textarea-wrap {
  margin-bottom: 10px;
}

.keyword-text-input {
  min-height: 72px;
  border: 1px solid #f2b7b1;
  border-radius: 2px;
}

.keyword-search-actions {
  display: flex;
  justify-content: flex-end;
}
.keyword-search-actions > * {
  margin-left: 8px;
}
.keyword-search-actions > *:first-child {
  margin-left: 0;
}

/* 左侧底部固定操作栏 */
.left-fixed-footer {
  flex-shrink: 0;
  height: 60px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.left-fixed-btn {
  /* 与右侧操作栏 btn-sm 按钮尺寸一致（padding 4px 10px / font-size 10px），高度适度加高 */
  min-width: 56px;
  height: 26px;
  margin-right: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

/* 模糊词编辑模板只读树展示 */
.word-edit-display {
  flex: 1;
  display: flex;
  align-items: flex-start;
}
.word-edit-display > * {
  margin-right: 8px;
}
.word-edit-display > *:last-child {
  margin-right: 0;
}
.word-tree-items {
  flex: 1;
  border: 1px solid var(--border-color, #d5d5d5);
  border-radius: 4px;
  padding: 4px 8px;
  background: #fafafa;
  height: 58px;
  overflow-y: auto;
  box-sizing: border-box;
}
.word-tree-node {
  padding: 2px 0;
  font-size: 12px;
  line-height: 1.6;
}
.word-tree-label {
  color: #333;
}

/* 分析材料入库区：学习文件区域左右间距 30px */
.warehouse-upload-wrap {
  padding: 0 30px;
}

/* 分析材料入库区：学习文件输入行（复用 optional-* 样式，与"代表"输入框同宽同高） */
.warehouse-upload-row {
  margin-bottom: 8px;
}

.warehouse-upload-btn {
  display: inline-flex;
  align-items: center;
  margin-right: 0;
  flex-shrink: 0;
  border: none;
  background: #fff;
  border-radius: 2px;
  cursor: pointer;
  padding: 0;
}

.warehouse-upload-btn.icon-only {
  width: 30px;
  height: 32px;
  justify-content: center;
}

.warehouse-upload-btn:hover {
  background: #f8e8e6;
}

.warehouse-upload-icon {
  width: 16px;
  height: 14px;
}
.warehouse-file-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
}
.warehouse-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: #fafafa;
  border: 1px solid var(--border-color, #d5d5d5);
  border-radius: 4px;
  font-size: 11px;
  margin-bottom: 6px;
}
.warehouse-file-item:last-child {
  margin-bottom: 0;
}
.warehouse-file-name {
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.warehouse-file-remove {
  cursor: pointer;
  color: #999;
  padding: 0 4px;
  flex-shrink: 0;
}
.warehouse-file-remove:hover {
  color: var(--primary-red);
}
</style>

<style>
/* 问号角标 tooltip：限宽并支持换行（popper 挂载在 body 上，须用全局样式） */
.icon-badge-tooltip {
  max-width: 260px;
  line-height: 1.6;
  word-break: break-word;
  white-space: normal;
}
.optional-row .optional-item {
  margin-right:14px;
}
</style>
