<template>
  <div class="left-container" ref="leftContainer">
    <!-- ======== 引文替换视图（右侧点击引文进入） ======== -->
    <CitationView
      v-if="citationVisible"
      :citation-data="citationData"
      :active-key-id="activeKeyId"
      @close-citation="closeCitation"
    />

    <!-- ======== 正常主面板 ======== -->
    <template v-else>
      <div class="left-scroll-area" ref="leftScrollArea">
        <!-- ---- 顶部：选定分析的范围 ---- -->
        <FilterConditions
          ref="filterConditions"
          :categories="categories"
          :budget-exact-words="budgetExactWords"
          :show-header-actions="false"
          :external-selected-keywords="selectedKeywords"
          :external-selected-segment-contents="selectedSegmentContents"
          :fuzzy-words="mergedFuzzyWords"
          :warehouse-labels="warehouseFiles"
          @search="runClusterSearch"
          @reset="resetLeftFilters"
          @category-change="onFilterCategoryChange"
          @update:exact-word="filterExactWord = $event"
          @update:fuzzy-word="filterFuzzyWord = $event"
        />

        <!-- ---- 中部：构建分析的分类体系 ---- -->
        <div class="panel">
          <div class="section-title">
            <span>构建分析的分类体系</span>
            <div class="section-actions section-actions-compact">
              <button class="btn btn-outline btn-sm" @click="openWordTemplateModal">上传分类模板</button>
              <button class="btn btn-outline btn-sm" @click="assistExpanded = !assistExpanded">辅助分类构建</button>
              <button class="btn btn-outline btn-sm" @click="pickWarehouseFiles">上传分类学习资料</button>
            </div>
          </div>

          <!-- 分类体系内部下方内容（模板输入区 / 辅助构建 / 输入与分类选择）：左右间距 30px -->
          <div class="category-build-wrap">
            <div class="category-template-card">
              <!-- 模板已上传：只读树展示 -->
              <div v-if="flatWordTree.length" class="word-tree-items category-template-tree">
                <div
                  v-for="node in flatWordTree"
                  :key="node.id"
                  class="word-tree-node"
                  :style="{ paddingLeft: node.depth * 20 + 'px' }"
                >
                  <span class="word-tree-label">{{ node.name }}</span>
                </div>
              </div>
              <!-- 未上传模板：文本输入 -->
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
                <button class="textarea-expand-btn" title="放大" @click="openEditor('semi')">⤢</button>
              </template>
            </div>

            <div v-show="assistExpanded" class="keyword-search-box">
              <div class="keyword-search-title">输入与分类相关的关键词：</div>
              <div class="textarea-with-expand keyword-textarea-wrap" style="position: relative">
                <textarea v-model="keywordInput" class="text-input keyword-text-input" placeholder="请输入词或句"></textarea>
                <button class="textarea-expand-btn" title="放大" @click="openEditor('word')">⤢</button>
              </div>
              <div class="keyword-search-actions">
                <button class="btn btn-outline btn-sm" :disabled="!canExpand" @click="runExpandSearch">查询</button>
                <button class="btn btn-outline btn-sm" :disabled="!expandResults.length" @click="showExpandResults">
                  查看结果
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ---- 底部：分析材料入库区（文件库） ---- -->
        <div v-if="isShowZlsc" class="panel">
          <div class="section-title"><span>分析材料入库区</span></div>
          <div class="warehouse-upload-wrap">
            <div class="optional-row warehouse-upload-row">
              <div class="optional-item">
                <label class="optional-label scxxzl">文件库：</label>
                <select v-model="activeLibraryId" class="optional-select warehouse-library-select">
                  <option value="">请选择文件库</option>
                  <option v-for="lib in fileLibraries" :key="lib.id" :value="lib.id">{{ lib.name }}</option>
                </select>
              </div>
              <div class="optional-item">
                <button class="btn btn-outline btn-sm" @click="addFileLibrary">添加文件库</button>
                <button
                  class="btn btn-outline btn-sm"
                  :disabled="!activeLibrary"
                  @click="pickWarehouseFiles"
                >
                  上传文件
                </button>
              </div>
            </div>

            <!-- 当前文件库已上传的文件列表 -->
            <div v-if="activeLibraryFiles.length" class="warehouse-file-list">
              <div v-for="file in activeLibraryFiles" :key="file" class="warehouse-file-item">
                <span class="warehouse-file-name" :title="file">{{ file }}</span>
                <span class="warehouse-file-remove" title="移除" @click="removeWarehouseFile(file)">×</span>
              </div>
            </div>

            <input
              ref="warehouseFileInput"
              type="file"
              multiple
              class="hidden-file-input"
              @change="onWarehouseFileChange"
            />
          </div>
        </div>
      </div>

      <!-- ---- 固定底部操作栏 ---- -->
      <div class="left-fixed-footer">
        <button class="btn btn-outline btn-sm left-fixed-btn" @click="resetAllFilters">重置</button>
        <button class="btn btn-sm left-fixed-btn" @click="searchWithFilters">开始检索</button>
      </div>

      <mask-editor
        v-model="editor.value"
        :visible.sync="editor.visible"
        :title="editor.title"
        :placeholder="editor.placeholder"
        show-word-limit
        @confirm="onEditorConfirm"
      />
    </template>
  </div>
</template>

<script>
/**
 * AdviceClusterLeft - 左侧面板（检索条件的输入与组织）
 *
 * 职责：
 *   1. 检索输入（词/句）与一次拓展检索（searchZF）
 *   2. 条件筛选（来源库、届次、代表团等，委托 FilterConditions）
 *   3. 分析分类体系的构建（分类模板上传 / 文本输入 / 辅助构建）
 *   4. 二次聚类检索（委托 FilterConditions 组装参数）→ 结果写入 store 由右侧展示
 *   5. 分析材料入库区：按「文件库」组织上传的分类学习资料
 *
 * 与右侧面板的数据交互一律通过 adviceCluster store：
 *   - 本组件写入：leftKeywords、expandResults、视图模式、聚类检索结果
 *   - 本组件读取：citationData/activeKeyId（引文）、expandResults/expandSelection（一次拓展勾选）
 * 本组件不再向父组件 emit 任何事件，也不再被父组件通过 $refs 反向调用内部方法。
 */
// import { getSourceList } from '../../../api/login'
import { searchZF, uploadTaskFile } from '../../../api/login'
import SearchHelper from '../../../utils/classes/SearchHelper'
import TreeHelper from '../../../utils/classes/TreeHelper'
import CitationView from './CitationView.vue'
import FilterConditions from './FilterConditions.vue'
import MaskEditor from './MaskEditor.vue'
import { mapState, mapGetters } from 'vuex'
import { pinyin } from 'pinyin-pro'
import { TEMPLATE_MODAL_MODE, VIEW_MODE } from '../../../store/modules/adviceCluster'

/** 关键词分隔符：'中英文逗号、顿号、换行'改为 '换行' */
// const KEYWORD_SEPARATOR = /[\r\n、，,]+/
const KEYWORD_SEPARATOR = /[\r\n]+/

/**
 * 按分隔符切分并去重（保持原顺序）
 * @param {string} text - 原始文本
 * @param {Array} [existed] - 已存在的词，用于跨来源去重
 * @returns {string[]} 词列表
 */
function splitKeywords(text, existed) {
  const result = Array.isArray(existed) ? existed : []
  String(text || '')
    .split(KEYWORD_SEPARATOR)
    .forEach(word => {
      const value = word.trim()
      if (value && !result.includes(value)) result.push(value)
    })
  return result
}

/**
 * 将树结构拍平为带缩进层级的一维数组（只读展示用）
 * @param {Array} nodes - 树节点
 * @param {number} depth - 当前层级
 * @param {Array} [result] - 结果收集数组
 * @returns {Array} [{ id, name, depth }]
 */
function flattenTree(nodes, depth = 0, result = []) {
  if (!Array.isArray(nodes)) return result
  nodes.forEach(node => {
    if (!node) return
    result.push({ id: node.id, name: node.name, depth })
    flattenTree(node.children, depth + 1, result)
  })
  return result
}

export default {
  name: 'AdviceClusterLeft',
  components: { CitationView, FilterConditions, MaskEditor },
  data() {
    return {
      /* ---- 输入与筛选条件 ---- */
      keywordInput: '',
      filterExactWord: '',
      filterSemiFuzzyWord: '',
      filterFuzzyWord: '',

      categories: [
        { label: '建议库', value: 'jianyi' },
        { label: '议案库', value: 'yian' },
        { label: '预算库', value: 'yusuan' }
      ],
      budgetExactWords: SearchHelper.DEFAULT_BUDGET_WORDS,
      /* ---- 辅助构建 ---- */
      assistExpanded: false,
      /* ---- 分析材料入库区：文件库 ---- */
      // [{ id, name, indexName, files: string[] }]
      fileLibraries: [],
      activeLibraryId: '',

      /* ---- 放大编辑弹窗：field 标识回写目标，避免用标题字符串做路由 ---- */
      editor: { visible: false, field: '', value: '', title: '', placeholder: '' }
    }
  },
  computed: {
    ...mapState('dict', { isShowZlsc: 'isShowZlsc' }),
    // 模糊词模板（wordTemplate 模块）独立于汇总要点/分析报告共用的 template 模块，
    // 其回显展示仅由「上传分类模板」触发
    ...mapState('wordTemplate', {
      templateHasData: 'hasData',
      templateTree: 'tree'
    }),
    ...mapState('adviceCluster', ['citationData', 'activeKeyId', 'expandResults', 'expandSelection']),
    // citationVisible 在 store 中是 getter（由 citationData 派生），必须用 mapGetters 取；
    // 之前混在 mapState 里取的是 state.citationVisible（不存在），恒为 undefined，引文视图因此永不渲染
    ...mapGetters('adviceCluster', ['citationVisible']),

    /** 一次拓展的勾选结果，作为二次检索的附加条件 */
    selectedKeywords() {
      return this.expandSelection.selectedKeywords
    },
    selectedSegmentContents() {
      return this.expandSelection.selectedSegmentContents
    },

    /** 分类模板的叶节点名称：模板已上传时作为模糊词参与检索 */
    templateLeafWords() {
      return TreeHelper.collectLeafNames(this.templateTree)
    },
    /** 分类模板拍平后用于只读树展示 */
    flatWordTree() {
      return flattenTree(this.templateTree)
    },

    /** 当前选中的文件库 */
    activeLibrary() {
      return this.fileLibraries.find(lib => lib.id === this.activeLibraryId) || null
    },
    /** 当前文件库下的文件列表 */
    activeLibraryFiles() {
      return this.activeLibrary ? this.activeLibrary.files : []
    },
    /** 所有文件库中的文件名（跨库去重），作为模糊词的一部分参与检索 */
    warehouseFiles() {
      const result = []
      this.fileLibraries.forEach(lib => {
        ;(lib.files || []).forEach(name => {
          if (!result.includes(name)) result.push(name)
        })
      })
      return result
    },

    /**
     * 交给 FilterConditions 的模糊词：
     * 模板有值时取模板叶节点，否则取输入框；两者之后再追加入库区文件
     */
    mergedFuzzyWords() {
      const fuzzy =
        this.templateHasData && this.templateLeafWords.length
          ? this.templateLeafWords.join('\n')
          : this.filterSemiFuzzyWord || ''
      const warehouse = this.warehouseFiles.join('\n')
      return fuzzy && warehouse ? `${fuzzy}\n${warehouse}` : fuzzy || warehouse
    },

    /**
     * 同步给右侧的关键词（右侧生成报告时作为目录树的兜底数据）
     * 规则：主关键词始终纳入；半模糊/模糊词有值时只取这两者，否则单独取精准词
     */
    leftKeywords() {
      let words = splitKeywords(this.keywordInput)
      const hasSemiOrFuzzy = !!this.filterSemiFuzzyWord.trim() || !!this.filterFuzzyWord.trim()
      if (hasSemiOrFuzzy) {
        words = splitKeywords(this.filterSemiFuzzyWord, words)
        words = splitKeywords(this.filterFuzzyWord, words)
      } else {
        words = splitKeywords(this.filterExactWord, words)
      }
      return words
    },

    canExpand() {
      return !!this.keywordInput.trim()
    }
  },
  watch: {
    /** 关键词派生结果 → 写入 store（替代原先散落各处的 emitKeywords 手动调用） */
    leftKeywords: {
      immediate: true,
      handler(words) {
        this.$store.commit('adviceCluster/SET_LEFT_KEYWORDS', words)
      }
    },
    /** 模板保存后同步到模糊词输入框；模板清空则清掉输入框，避免残留旧值 */
    templateHasData: {
      immediate: true,
      handler() {
        this.syncFuzzyWordFromTemplate()
      }
    },
    templateTree: {
      deep: true,
      handler() {
        this.syncFuzzyWordFromTemplate()
      }
    }
  },
  mounted() {
    this.fetchCategories()
  },
  methods: {
    showAlert(message) {
      this.$alert(message, '提示', { confirmButtonText: '确定' })
    },
    addHistory(action, content) {
      this.$store.dispatch('adviceCluster/addHistory', { action, content })
    },

    /* ==================== 来源库选项 ==================== */
    fetchCategories() {
      // getSourceList()
      //   .then(res => {
      //     const first = res && Array.isArray(res.data) ? res.data[0] : null
      //     if (!first || !first.qdNeedObj) return
      //     this.categories = [
      //       ...this.categories.slice(0, 3),
      //       {
      //         label: first.qdNeedObj.chineseName,
      //         value: first.qdNeedObj.englishName
      //       }
      //     ]
      //   })
      //   // 来源库为附加选项，接口失败时保持前三项默认值即可
      //   .catch(() => {})
    },

    /* ==================== 分类模板与模糊词 ==================== */
    /** 模板有值时用叶节点回填模糊词输入框，否则清空 */
    syncFuzzyWordFromTemplate() {
      this.filterSemiFuzzyWord =
        this.templateHasData && this.templateLeafWords.length ? this.templateLeafWords.join('\n') : ''
    },
    /** 打开统一目录模板弹窗（mode = word-edit，保存路由见 store） */
    openWordTemplateModal() {
      this.$store.dispatch('adviceCluster/openTemplateModal', TEMPLATE_MODAL_MODE.WORD_EDIT)
    },
    onFilterCategoryChange() {
      // 切换来源库后原有的分类体系不再适用，一并清空（taskAiParams 由 FilterConditions 自行提交）
      this.filterSemiFuzzyWord = ''
      this.$store.commit('wordTemplate/CLEAR_TEMPLATE')
    },

    /* ==================== 放大编辑 ==================== */
    openEditor(field) {
      const targets = {
        semi: {
          title: '构建分析的分类体系',
          placeholder: '请输入分类体系（以回车分隔）',
          value: this.filterSemiFuzzyWord
        },
        word: {
          title: '输入与分类选择',
          placeholder: '请输入词或句',
          value: this.keywordInput
        }
      }
      const target = targets[field]
      if (!target) return
      this.editor = { visible: true, field, ...target }
    },
    onEditorConfirm(value) {
      if (this.editor.field === 'semi') {
        this.filterSemiFuzzyWord = value || ''
      } else if (this.editor.field === 'word') {
        this.keywordInput = value || ''
      }
    },

    /* ==================== 检索聚类（FilterConditions 组装参数） ==================== */
    runClusterSearch({ params, historyText }) {
      this.$store.dispatch('adviceCluster/fetchClusterResults', { params, historyText })
    },
    /** FilterConditions 自身重置后的联动：清空一次拓展勾选与分类体系 */
    resetLeftFilters() {
      this.$store.commit('adviceCluster/CLEAR_EXPAND_SELECTION')
      this.filterSemiFuzzyWord = ''
      this.fileLibraries = []
      this.activeLibraryId = ''
      // 只清除模糊词独立模板，不影响汇总要点/分析报告共用的 template 模块
      if (this.templateHasData) {
        this.$store.dispatch('wordTemplate/clearTemplate')
      }
    },
    /** 底部固定按钮：重置（交由 FilterConditions 统一重置筛选条件） */
    resetAllFilters() {
      const filters = this.$refs.filterConditions
      if (filters) filters.onReset()
      else this.resetLeftFilters()
    },
    /** 底部固定按钮：开始检索 */
    searchWithFilters() {
      const filters = this.$refs.filterConditions
      if (filters) filters.onSearch()
    },

    /* ==================== 引文 ==================== */
    closeCitation() {
      this.$store.commit('adviceCluster/CLEAR_CITATION')
    },

    /* ==================== 一次拓展 ==================== */
    runExpandSearch() {
      const text = this.keywordInput.trim()
      if (!text) {
        this.showAlert('请输入搜索内容后再进行一次拓展')
        return
      }

      searchZF({ text: this.keywordInput, content: '' })
        .then(res => {
          const list = Array.isArray(res && res.data) ? res.data : []
          this.$store.commit('adviceCluster/SET_EXPAND_RESULTS', list)
          this.$store.commit('adviceCluster/SET_VIEW_MODE', VIEW_MODE.EXPAND)
          this.addHistory('一次拓展（接口）', `搜索关键词：${text}`)
          if (!list.length) this.showAlert('一次拓展接口无数据')
        })
        .catch(() => {
          this.$store.commit('adviceCluster/SET_EXPAND_RESULTS', [])
          this.addHistory('一次拓展（接口异常）', `关键词：${text}`)
          this.showAlert('一次拓展接口异常')
        })
    },
    /** 把已缓存在 store 的一次拓展结果重新切到右侧展示 */
    showExpandResults() {
      if (!this.expandResults.length) return
      this.$store.commit('adviceCluster/SET_VIEW_MODE', VIEW_MODE.EXPAND)
    },

    /* ==================== 分析材料入库区（文件库） ==================== */
    /**
     * 添加文件库：弹窗输入名称，成功后自动选中该文件库
     * 说明：文件库名称会转为拼音（无声调）作为上传接口的 indexName，
     *      同一文件库内的文件共享该索引名。
     */
    addFileLibrary() {
      this.$prompt('请输入文件库名称', '添加文件库', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValidator: value => {
          const name = String(value || '').trim()
          if (!name) return '文件库名称不能为空'
          if (this.fileLibraries.some(lib => lib.name === name)) return '该文件库已存在'
          return true
        }
      })
        .then(({ value }) => {
          const name = String(value).trim()
          const library = {
            id: `lib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name,
            indexName: this.toPinyin(name),
            files: []
          }
          this.fileLibraries.push(library)
          this.activeLibraryId = library.id
          this.addHistory('添加文件库', `文件库：${name}`)
          this.$message && this.$message.success('文件库添加成功')
        })
        .catch(() => {})
    },
    /** 打开系统文件选择框（未选中文件库时不放行） */
    pickWarehouseFiles() {
      if (!this.activeLibrary) {
        this.showAlert('请先选择或添加文件库')
        return
      }
      const input = this.$refs.warehouseFileInput
      if (!input) return
      input.value = ''
      input.click()
    },
    onWarehouseFileChange(event) {
      const files = event && event.target && event.target.files
      if (files && files.length) this.uploadWarehouseFiles(files)
      if (event && event.target) event.target.value = ''
    },
    /**
     * 逐个上传到「当前选中文件库」，接口成功后再加入该文件库的文件列表
     * indexName 取自文件库，fileName 取自文件本身
     */
    uploadWarehouseFiles(files) {
      const library = this.activeLibrary
      if (!library) {
        this.showAlert('请先选择或添加文件库')
        return
      }

      Array.prototype.forEach.call(files, file => {
        const fileName = String((file && file.name) || '').split('.')[0].trim()
        if (!fileName) return
        if (library.files.indexOf(fileName) > -1) {
          this.showAlert(`文件库「${library.name}」中已存在同名文件：${fileName}`)
          return
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileName', fileName)
        formData.append('indexName', library.indexName)
        formData.append('force', false)

        uploadTaskFile(formData)
          .then(res => {
            if (!res || (res.code !== 0 && res.success !== true)) {
              this.showAlert((res && (res.message || res.msg)) || '文件上传失败，请重试')
              return
            }
            if (library.files.indexOf(fileName) === -1) library.files.push(fileName)
            this.addHistory('文件上传', `文件库「${library.name}」上传文件：${fileName}`)
            this.$message && this.$message.success('文件上传成功')
          })
          .catch(() => {
            this.showAlert('文件上传失败，请重试')
          })
      })
    },
    /** 中文文件名转无声调全拼，作为接口需要的索引名 */
    toPinyin(value) {
      return pinyin(String(value || ''), { toneType: 'none', pattern: 'pinyin' }).replace(/\s+/g, '')
    },
    /** 从当前文件库移除某个文件 */
    removeWarehouseFile(fileName) {
      const library = this.activeLibrary
      if (!library) return
      const index = library.files.indexOf(fileName)
      if (index > -1) library.files.splice(index, 1)
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

/* 构建分析分类体系：输入与分类选择 */
/* 分类体系内部下方内容（模板输入区 / 辅助构建 / 输入与分类选择）：左右间距 30px */
.category-build-wrap {
  padding-left: 20px;
}

.keyword-search-box {
  margin-top: 10px;
  margin-bottom: 10px;
  border: 1px dashed #dcdcdc;
  border-radius: 4px;
  background: #fafafa;
  padding: 10px;
}

.keyword-search-title {
  color: #333;
  font-size: 12px;
  margin-bottom: 8px;
}

.keyword-textarea-wrap {
  margin-bottom: 10px;
}

/* 去掉关键词输入框右下角拖拽手柄（全局 .text-input 默认 resize: vertical） */
.keyword-text-input {
  min-height: 72px;
  border: 1px solid #f2b7b1;
  border-radius: 2px;
  resize: none;
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

/* 分类模板只读树展示 */
.word-tree-items {
  flex: 1;
  border: 1px solid var(--border-color, #d5d5d5);
  border-radius: 4px;
  padding: 4px 8px;
  background: #fafafa;
  height: 240px;
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

/* 分析材料入库区：文件库区域左右间距 30px */
.warehouse-upload-wrap {
  padding: 0 30px;
}

.warehouse-upload-row {
  margin-bottom: 8px;
}

/* 文件库下拉框宽度（沿用 optional-select 的边框/字号风格） */
.warehouse-library-select {
  min-width: 160px;
  height: 26px;
  line-height: 26px;
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
.optional-row .optional-item {
  margin-right: 14px;
}
</style>
