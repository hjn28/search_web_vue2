<template>
  <div class="police-page">
    <ReturnTop />

    <div class="header">
      <div class="title_sty">
        <label class="title2">
          <input type="radio" :checked="isCheckZywj" @change="changeCheck(1)" class="inpCheck" />中央文件
        </label>
        <label class="title2">
          <input type="radio" :checked="isCheckGwyzcwjk" @change="changeCheck(2)" class="inpCheck" />国务院政策文件库
        </label>
        <label class="title2">
          <input type="radio" :checked="isCheckGjgzk" @change="changeCheck(3)" class="inpCheck" />国家规章库
        </label>
      </div>

      <div class="themTitle">{{ themTitle }}</div>

      <div class="search-row">
        <input
          v-model="inputValue"
          placeholder="请输入内容"
          class="input-with-select"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
          @keyup.enter="onEnterSearch"
        />
        <div class="searchBtn" @click="search('chs')">
          <i class="el-icon-search"></i>
        </div>
        <div class="resetBtn" @click="resetValue()">重置</div>
      </div>

      <div class="toolbar">
        <span class="toolbar-label">排序：</span>
        <span ref="sortSmialar" class="toolbar-link sswzActive" @click="sortQw(1)">按相关度</span>
        <span ref="sortTime" class="toolbar-link" @click="sortQw(2)">按时间</span>
        <span class="toolbar-divider"></span>
        <span class="toolbar-label">搜索位置：</span>
        <span ref="sswzQw" class="toolbar-link sswzActive" @click="sswzQw(1)">全文</span>
        <span ref="sswzBt" class="toolbar-link" @click="sswzQw(2)">标题</span>
      </div>
      <!-- 搜索上下文信息：右侧绝对定位，不影响居中 -->
      <div class="search-context" v-if="searchContextText">
        检索条件：{{ searchContextText }}
      </div>
    </div>

    <div class="content-wrapper">
      <div class="sidebar" v-show="statistics.length > 0">
        <div class="sidebar-header">目录导航</div>
        <div class="sidebar-body">
          <div v-for="(v, i) in statistics" :key="i" class="sidebar-group">
          <div class="sidebar-category" @click="click(i, v)">
            {{ v.name }}({{ v.value }}件)
          </div>
          <div :ref="`menuList_${i}`" v-show="isRootExpanded(i)" class="sidebar-sub">
            <ul class="no-bullets" style="padding-inline-start: 0px">
              <li v-for="(m, ind1) in v.children" :key="ind1">
                <div class="sub-item-row">
                  <var
                    v-show="m.children && m.children.length > 0"
                    :ref="`showTb_${i}_${ind1}`"
                    :class="getFolderIconClass(`${i}_${ind1}`)"
                    style="cursor:pointer"
                    @click="showList(`${i}_${ind1}`, m.children.length > 0)"
                  ></var>
                  <a
                    class="sub-link"
                    :ref="`showListZtfl_${i}_${ind1}`"
                    @click="doSiderSearch(m, m.chaxun, `showListZtfl_${i}_${ind1}`, [v]), showList(`${i}_${ind1}`, m.children.length > 0)"
                  >{{ m.name }}({{ m.value }})</a>
                </div>
                <ul
                  v-if="m.children"
                  :ref="`showListZt_${i}_${ind1}`"
                  v-show="isSubExpanded(`${i}_${ind1}`)"
                  class="no-bullets sub-leaf-list"
                >
                  <li
                    class="sub-leaf"
                    :ref="`showListZtxl_${i}_${ind1}_${ind_2}`"
                    v-for="(val, ind_2) in m.children"
                    :key="ind_2"
                    @click="doSiderSearch(val, val.chaxun, `showListZtxl_${i}_${ind1}_${ind_2}`, [v, m])"
                  >{{ val.name }}({{ val.value }})</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
        </div>
      </div>

      <div class="main-content">
        <div v-if="documnetData.length > 0" class="result-list">
          <div v-for="(item, index) in documnetData" :key="index" class="result-card">
            <h5
              class="result-title"
              v-html="handleTitle(item.title)"
              @click="tiaozhuan(item.content_html, item.title, item.list)"
            ></h5>
            <div class="result-snippet" v-html="handleTitle(item.content)"></div>
            <div class="result-meta">
              <div v-if="item.c_fwjg" class="meta-tag meta-tag-primary">{{ item.c_fwjg }}</div>
              <div v-for="(im, in2) in item.list" :key="in2" class="source">
                <div v-show="im.show === 'true'" class="meta-tag">{{ im.name }}：{{ im.value }}</div>
              </div>
              <div style="clear: both"></div>
            </div>
            <div class="line"></div>
          </div>

          <el-pagination
            v-show="documnetData.length > 0"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page.sync="pagetion.currentPage"
            :page-size="pagetion.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, prev, pager, next, jumper"
            :total="pagetion.total"
          />
        </div>
        <div v-else class="empty-state">
          <Empty description="当前页面内容为空"></Empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { zcSearch } from '@/api/login.js'
import ReturnTop from './returnTop.vue'
import Empty from './empty.vue'
import DebounceHelper from './classes/DebounceHelper.js'

export default {
  name: 'PoliceIndex',
  components: { ReturnTop, Empty },
  data() {
    return {
      inputValue: '',
      pagetion: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      listArr: [],
      listArr2: [],
      fontColorRefArr: [],
      documnetData: [],
      sideCheckedArr: [],
      ztflTree: [],
      organization: {
        bmfl: { count: 0 },
        groupMap: { count: 0 }
      },
      searchFlag: false,
      statistics: [],
      isCheck: true,
      isCheckZywj: true,
      isCheckGwyzcwjk: false,
      isCheckGjgzk: false,
      isCheckMuti: false,
      themTitle: '中央文件',
      currentDom: '',
      expandedRootIndices: [],
      isComposing: false,
      database: '001',
      matchMode: '1',
      sortMode: '0',
      wjkOptions: [
        { value: '中央文件', label: '中央文件' },
        { value: '国务院政策文件库', label: '国务院政策文件库' },
        { value: '国务规章库', label: '国务规章库' }
      ],
      checkObjArr: [],
      sideSearchXL: {},
      clickedPath: {}, // 点击目录路径（按 database 编码存储）
      highlightedItemName: {} // 高亮目录名称（按 database 编码存储）
    }
  },
  computed: {
    searchContextText() {
      // 只展示左侧高亮的那一个目录名 + 搜索关键词
      var highlightName = this.highlightedItemName[this.database] || ''
      var keyword = (this.inputValue || '').trim()
      var parts = []
      if (highlightName) parts.push(highlightName)
      if (keyword) parts.push('「' + keyword + '」')
      return parts.length ? parts.join(' ') : ''
    }
  },
  created() {
    this.search = DebounceHelper.debounce(this.search, 500, this)
    this.siderSearch = DebounceHelper.debounce(this.siderSearch, 500, this)
  },
  mounted() {
    this.search.flush()
  },
  methods: {
    /* ===================== 输入法 ===================== */
    handleCompositionStart() {
      this.isComposing = true
    },
    handleCompositionEnd() {
      this.isComposing = false
    },
    onEnterSearch() {
      if (this.isComposing) return
      this.search()
    },

    /* ===================== 搜索 ===================== */
    search(val, page = 1) {
      this.pagetion.currentPage = page
      let formList = {
        keyword: this.inputValue,
        matchMode: this.matchMode,
        sortMode: this.sortMode,
        page: this.pagetion.currentPage,
        size: this.pagetion.pageSize,
        database: this.database
      }
      if (this.sideSearchXL) {
        formList = { ...formList, ...this.sideSearchXL }
      }
      zcSearch(formList).then((res) => {
        this.statistics = []
        if (res && res.code === 200) {
          let resData = res.data
          this.documnetData = (resData && resData.documents) || []
          this.pagetion.total = (resData && resData.totalElements) || 0
          this.searchFlag = true
          if (resData && resData.statistics && resData.statistics.length > 0 && resData.statistics[0].children) {
            this.statistics = resData.statistics[0].children[0] || []
          }
          // 搜索时如果有点击目录路径，检查补全
          this.ensureClickedPathInStatistics()
          this.ensurePathVisible()
          this.recalcHighlightByName()
          if (this.database === '001') {
            this.themTitle = '中央文件（' + (resData?.totalElements || 0) + '件）'
          } else if (this.database === '002') {
            this.themTitle = '国务院政策文件库（' + (resData?.totalElements || 0) + '件）'
          } else if (this.database === '003') {
            this.themTitle = '国家规章库（' + (resData?.totalElements || 0) + '件）'
          }
        }
        this.$nextTick(() => {
          this.applyExpandState()
        })
      }).catch(function (err) {
        console.error('[policySearch] 搜索接口异常：', err)
      })
    },

    /* ===================== 分页 ===================== */
    handleCurrentChange(val) {
      this.pagetion.currentPage = val
      this.search('', val)
    },
    handleSizeChange(val) {
      this.pagetion.pageSize = val
      this.search()
    },

    /* ===================== 侧栏展开/折叠 ===================== */
    click(val, it) {
      // 没有 children 则直接搜索
      if (!it.children || !it.children.length) {
        this.expandedRootIndices = []
        this.doSiderSearch(it, it.chaxun || [], 'zcjd', [])
        return
      }
      // 独立 toggle，多个一级目录可同时展开
      const idx = this.expandedRootIndices.indexOf(val)
      if (idx > -1) {
        this.expandedRootIndices.splice(idx, 1)
      } else {
        this.expandedRootIndices.push(val)
      }
    },

    isRootExpanded(i) {
      return this.expandedRootIndices.includes(i)
    },

    showList(val, hasChildren) {
      if (this.listArr.includes(val)) {
        this.listArr = this.listArr.filter((item) => item !== val)
      } else {
        if (hasChildren) {
          this.listArr.push(val)
        }
      }
    },

    showList2(val) {
      if (this.listArr2.includes(val)) {
        this.$refs[`showList2_${val}`].style.display = 'none'
        this.listArr2 = this.listArr2.filter((item) => item !== val)
        this.$refs[`showTb2_${val}`].classList.add('el-icon-folder-add')
        this.$refs[`showTb2_${val}`].classList.remove('el-icon-folder-remove')
      } else {
        this.listArr2.push(val)
        this.$refs[`showList2_${val}`].style.display = 'block'
        this.$refs[`showTb2_${val}`].classList.add('el-icon-folder-remove')
        this.$refs[`showTb2_${val}`].classList.remove('el-icon-folder-add')
      }
    },

    expand(val) {
      this.listArr = this.listArr.filter((item) => item !== val)
    },

    isSubExpanded(key) {
      return this.listArr.includes(key)
    },

    getFolderIconClass(key) {
      return this.isSubExpanded(key) ? 'el-icon-folder-remove' : 'el-icon-folder-add'
    },

    /* ===================== 侧栏搜索高亮 ===================== */
    getRefElement(refName) {
      const refTarget = this.$refs[refName]
      if (Array.isArray(refTarget)) {
        return refTarget[0] || null
      }
      return refTarget || null
    },
    setCurrentDomByRef(refName) {
      this.currentDom = refName ? this.getRefElement(refName) : null
    },
    addActiveByRef(refName) {
      const element = this.getRefElement(refName)
      if (!element) return false
      element.classList.add('active')
      return true
    },
    removeActiveByRef(refName) {
      const element = this.getRefElement(refName)
      if (!element) return false
      element.classList.remove('active')
      return true
    },
    clearCurrentHighlight() {
      const activeRef = this.fontColorRefArr[0]
      if (activeRef) {
        this.removeActiveByRef(activeRef)
      }
      this.fontColorRefArr = []
      this.currentDom = null
    },
    syncHighlightState() {
      const activeRef = this.fontColorRefArr[0]
      if (!activeRef) {
        this.currentDom = null
        return
      }
      const element = this.getRefElement(activeRef)
      if (!element) {
        this.fontColorRefArr = []
        this.currentDom = null
        return
      }
      this.currentDom = element
      element.classList.add('active')
    },

    /* ===================== 点击目录搜索（记录路径） ===================== */
    doSiderSearch(item, chaxunArr, refSra, parents = []) {
      // 按当前数据库存储从一级到叶子的完整路径（用 $set 确保响应式）
      this.$set(this.clickedPath, this.database, [...parents, item].map(function (p) {
        return { name: p.name || '', value: p.value || 0, chaxun: p.chaxun || [] }
      }))
      this.$set(this.highlightedItemName, this.database, item.name || '')
      console.log('[' + this.database + '] 点击目录路径：', this.clickedPath[this.database].map(function (p) { return p.name || p.value }).join(' > '))
      this.siderSearch(item, chaxunArr, refSra)
    },

    /* ===================== 检查并补全点击路径到统计目录中 ===================== */
    ensureClickedPathInStatistics() {
      var path = this.clickedPath[this.database]
      if (!Array.isArray(path) || !path.length) return
      var lastMatched = this.findLastExistingNode(path)
      // 完全匹配，无需处理
      if (lastMatched && lastMatched.matchedIndex === path.length - 1) return

      // lastMatched 不可能为 null（点击的目录必然在当前 statistics 树中），仅防御性判断
      if (!lastMatched) return

      console.log('[' + this.database + '] 点击目录路径「' + path.map(function (p) { return p.name }).join(' > ') + '」中从第' + (lastMatched.matchedIndex + 1) + '级开始缺失，正在补全至第一位...')
      if (!lastMatched.node.children) {
        lastMatched.node.children = []
      }
      // 从叶子向根倒序构建缺失子节点链
      var chain = null
      for (var i = path.length - 1; i > lastMatched.matchedIndex; i--) {
        var seg = path[i]
        var chainNode = {
          name: seg.name,
          value: 0,
          chaxun: seg.chaxun || [],
          children: chain ? [chain] : []
        }
        chain = chainNode
      }
      // 将缺失链的根节点插入到父级 children 的第一个位置
      if (chain) {
        lastMatched.node.children.unshift(chain)
      }
      console.log('已补全目录')
    },

    findLastExistingNode(path) {
      var level = this.statistics
      var lastMatched = null
      for (var d = 0; d < path.length; d++) {
        var seg = path[d]
        if (!level) return lastMatched
        var found = null
        var foundIdx = -1
        for (var k = 0; k < level.length; k++) {
          if (level[k] && level[k].name === seg.name) { found = level[k]; foundIdx = k; break }
        }
        if (!found) return lastMatched
        lastMatched = {
          node: found,
          matchedIndex: d,
          rootIndex: d === 0 ? foundIdx : (lastMatched ? lastMatched.rootIndex : -1)
        }
        level = found.children
      }
      return lastMatched
    },

    /* 按名称查找当前 statistics 中的目录项，返回对应的 ref 字符串用于高亮 */
    findRefByItemName(name) {
      if (!name) return null
      for (var i = 0; i < this.statistics.length; i++) {
        var root = this.statistics[i]
        if (root && root.name === name) return 'zcjd'
        var children = (root && root.children) || []
        for (var ind1 = 0; ind1 < children.length; ind1++) {
          if (children[ind1] && children[ind1].name === name) return 'showListZtfl_' + i + '_' + ind1
          var grandchildren = (children[ind1] && children[ind1].children) || []
          for (var ind_2 = 0; ind_2 < grandchildren.length; ind_2++) {
            if (grandchildren[ind_2] && grandchildren[ind_2].name === name) return 'showListZtxl_' + i + '_' + ind1 + '_' + ind_2
          }
        }
      }
      return null
    },

    /* 重新基于目录名称匹配计算高亮 */
    recalcHighlightByName() {
      var name = this.highlightedItemName[this.database]
      if (!name) return
      var newRef = this.findRefByItemName(name)
      if (newRef) {
        // 先清除旧高亮
        var oldActive = this.fontColorRefArr[0]
        if (oldActive) this.removeActiveByRef(oldActive)
        this.fontColorRefArr = [newRef]
        this.currentDom = null
        // 尝试立即应用，若 DOM 还未更新会在 syncHighlightState 中重试
        this.addActiveByRef(newRef)
      }
    },

    /* 展开指定的根目录 */
    expandRootByIndex(idx) {
      if (idx < 0 || idx >= this.statistics.length) return
      if (!this.expandedRootIndices.includes(idx)) {
        this.expandedRootIndices.push(idx)
      }
    },

    /* 确保点击路径沿途所有目录在侧栏中展开可见 */
    ensurePathVisible() {
      var path = this.clickedPath[this.database]
      if (!Array.isArray(path) || !path.length || !this.statistics.length) return
      for (var i = 0; i < this.statistics.length; i++) {
        var root = this.statistics[i]
        // 匹配一级目录
        if (root && root.name === path[0].name) {
          this.expandRootByIndex(i)
          // 匹配二级目录
          if (path.length > 1 && root.children) {
            for (var ind1 = 0; ind1 < root.children.length; ind1++) {
              if (root.children[ind1] && root.children[ind1].name === path[1].name) {
                var subKey = i + '_' + ind1
                if (!this.listArr.includes(subKey)) this.listArr.push(subKey)
                break
              }
            }
          }
          break
        }
      }
    },

    /* ===================== 侧栏分类搜索 ===================== */
    siderSearch(obj, arr, refSra, ind1) {
      this.pagetion.currentPage = 1
      obj.refSra = refSra
      if (!this.isCheckMuti) {
        this.sideSearchXL = {}
      }
      if (refSra !== 'zcjd') {
        this.setCurrentDomByRef(refSra)
      }
      if (this.database === '002') {
        if (refSra !== 'zcjd') {
          if (this.fontColorRefArr.length > 0 && !this.isCheckMuti) {
            this.clearCurrentHighlight()
          }
          if (this.addActiveByRef(refSra)) {
            this.fontColorRefArr = [refSra]
            this.setCurrentDomByRef(refSra)
          }
        } else {
          if (this.fontColorRefArr.length > 0) {
            this.clearCurrentHighlight()
          }
        }
      }
      if (this.database === '003') {
        if (this.fontColorRefArr.length > 0 && !this.isCheckMuti) {
          this.clearCurrentHighlight()
        }
        if (this.addActiveByRef(refSra)) {
          this.fontColorRefArr = [refSra]
          this.setCurrentDomByRef(refSra)
        }
      }
      let formList = {
        keyword: this.inputValue,
        matchMode: this.matchMode,
        sortMode: this.sortMode,
        page: this.pagetion.currentPage,
        size: this.pagetion.pageSize,
        database: this.database
      }
      if (arr?.length > 0 && this.checkObjArr.length === 0) {
        arr.forEach((ele) => {
          formList[ele.name] = [ele.value]
          this.sideSearchXL[ele.name] = [ele.value]
        })
      }
      zcSearch(formList).then((res) => {
        if (res && res.code === 200) {
          let resData = res?.data
          this.documnetData = resData?.documents || []
          this.pagetion.total = resData?.totalElements || 0
          if (this.database === '001') {
            this.themTitle = '中央文件（' + (resData?.totalElements || 0) + '件）'
          } else if (this.database === '002') {
            this.themTitle = '国务院政策文件库（' + (resData?.totalElements || 0) + '件）'
          } else if (this.database === '003') {
            this.themTitle = '国家规章库（' + (resData?.totalElements || 0) + '件）'
          }
          if (resData?.statistics && resData.statistics.length > 0 && resData.statistics[0].children) {
            this.statistics = resData.statistics[0].children[0] || []
          }
          // 检查点击的目录路径是否存在于返回结果中，不存在则补全
          this.ensureClickedPathInStatistics()
          this.ensurePathVisible()
          this.recalcHighlightByName()
        }
        this.$nextTick(() => {
          this.applyExpandState()
        })
      }).catch(function (err) {
        console.error('[policySiderSearch] 侧栏搜索接口异常：', err)
      })
    },

    /* ===================== 展开状态恢复 ===================== */
    applyExpandState() {
      // 清理越界的展开索引
      this.expandedRootIndices = this.expandedRootIndices.filter(i => i < this.statistics.length)
      // 仅保留当前目录中存在的二级展开键
      const validSubKeys = []
      this.statistics.forEach((group, i) => {
        ;(group.children || []).forEach((_, ind1) => {
          validSubKeys.push(`${i}_${ind1}`)
        })
      })
      this.listArr = this.listArr.filter((key) => validSubKeys.includes(key))
      this.syncHighlightState()
    },

    /* ===================== 标题高亮 ===================== */
    handleTitle(title) {
      let title2 = title
      if (title) {
        title2 = title
          .replaceAll('<em>', '<span style="color:red;">')
          .replaceAll('</em>', '</span>')
      }
      return title2
    },

    /* ===================== 跳转详情 ===================== */
    tiaozhuan(data, title, list) {
      const targetRoute = this.$router.resolve({
        name: 'searchDetail',
        query: {
          content: data || '',
          title: title || '',
          list: JSON.stringify(list || [])
        }
      })
      window.open(targetRoute.href, '_blank')
      // window.open(`/searchDetail?content=${data}&title=${title}&list=${JSON.stringify(list || [])}`, '_blank')
    },

    /* ===================== 重置 ===================== */
    resetValue() {
      this.inputValue = ''
      this.sideSearchXL = {}
      this.clearCurrentHighlight()
      // 重置时也清除高亮目录和点击路径
      if (this.database) {
        this.$delete(this.highlightedItemName, this.database)
        this.$delete(this.clickedPath, this.database)
      }
      this.search()
    },

    /* ===================== 切换数据库 ===================== */
    changeCheck(val) {
      this.resetValue()
      this.isCheck = !this.isCheck
      this.listArr = []
      this.expandedRootIndices = []
      this.documnetData = []
      // 切换时清空当前数据库的点击目录数据（用 $delete 确保响应式）
      if (this.database) {
        this.$delete(this.clickedPath, this.database)
        this.$delete(this.highlightedItemName, this.database)
      }
      if (this.fontColorRefArr.length > 0) {
        this.clearCurrentHighlight()
        this.sideSearchXL = {}
      }
      if (val === 0) {
        this.isCheckMuti = !this.isCheckMuti
        this.checkObjArr = []
      }
      if (!this.isCheckMuti) {
        this.isCheckZywj = false
        this.isCheckGwyzcwjk = false
        this.isCheckGjgzk = false
      }
      if (val === 1) {
        this.themTitle = '中央文件'
        this.database = '001'
        this.isCheckZywj = !this.isCheckZywj
        this.search()
      } else if (val === 2) {
        this.themTitle = '国务院政策文件库'
        this.database = '002'
        this.isCheckGwyzcwjk = !this.isCheckGwyzcwjk
        this.search()
      } else if (val === 3) {
        this.themTitle = '国家规章库'
        this.database = '003'
        this.isCheckGjgzk = !this.isCheckGjgzk
        this.search()
      }
    },

    /* ===================== 排序 ===================== */
    sortQw(val) {
      if (val === 1) {
        this.$refs.sortSmialar.classList.add('sswzActive')
        this.$refs.sortTime.classList.remove('sswzActive')
        this.sortMode = '0'
        this.search()
      } else {
        this.$refs.sortSmialar.classList.remove('sswzActive')
        this.$refs.sortTime.classList.add('sswzActive')
        this.sortMode = '1'
        this.search()
      }
    },

    /* ===================== 搜索位置 ===================== */
    sswzQw(val) {
      if (val === 1) {
        this.$refs.sswzQw.classList.add('sswzActive')
        this.$refs.sswzBt.classList.remove('sswzActive')
        this.matchMode = '1'
        this.search()
      } else {
        this.$refs.sswzQw.classList.remove('sswzActive')
        this.$refs.sswzBt.classList.add('sswzActive')
        this.matchMode = '0'
        this.search()
      }
    }
  }
}
</script>

<style scoped lang="less">
.police-page {
  font-size: 14px;
  min-height: 100vh;
  background: #f5f7fa;
  font-family: 微软雅黑;
}

/* ==================== 头部（紧凑，无红色背景） ==================== */
.header {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 24px 6px;
  position: relative;
}

.title_sty {
  position: absolute;
  left: 24px;
  top: 10px;
  display: flex;
  gap: 4px;
  font-size: 18px;
  .title2 {
    display: inline-flex;
    align-items: center;
    margin-right: 16px;
    font-weight: 600;
    color: #333;
    cursor: pointer;
    user-select: none;

    .inpCheck {
      width: 14px;
      height: 14px;
      margin-right: 4px;
      cursor: pointer;
    }
  }
}

.themTitle {
  text-align: center;
  color: #c62828;
  font-weight: 600;
  font-size: 20px;
  line-height: 2;
  margin: 0 0 8px;
  letter-spacing: 1px;
}

/* ---------- 搜索栏 ---------- */
.search-row {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.input-with-select {
  -webkit-appearance: none;
  background-color: #fff;
  background-image: none;
  border-radius: 6px 0 0 6px;
  border: 1px solid #c62828;
  border-right: none;
  box-sizing: border-box;
  color: #333;
  display: inline-block;
  font-size: 14px;
  height: 34px;
  line-height: 34px;
  outline: 0;
  padding: 0 14px;
  transition: border-color 0.2s;
  width: 360px;

  &:focus {
    border-color: #e53935;
  }

  &::placeholder {
    color: #b0b0b0;
  }
}

.searchBtn {
  background-color: #c62828;
  color: #fff;
  width: 48px;
  height: 34px;
  font-size: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background-color: #e53935; }
}

.resetBtn {
  margin-left: 8px;
  background-color: #c62828;
  color: #fff;
  float: left;
  font-size: 13px;
  height: 34px;
  line-height: 34px;
  padding: 0 14px;
  border-radius: 6px;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.2s;
  &:hover { background-color: #e53935; }
}

/* ---------- 工具栏 ---------- */
.toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed #d0d0d0;
  border-radius: 6px;
  padding: 4px 16px;
  max-width: 460px;
  margin: 0 auto;
  background: #fff;
  gap: 2px;
}

.toolbar-label {
  color: #909399;
  font-size: 14px;
  white-space: nowrap;
}

.toolbar-link {
  color: #606266;
  font-size: 14px;
  padding: 2px 10px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  user-select: none;
  &:hover { color: #c62828; }
  &.sswzActive {
    color: #c62828;
    font-weight: 600;
    border-bottom: 2px solid #c62828;
  }
}

.toolbar-divider {
  width: 1px;
  height: 14px;
  background: #e0e0e0;
  margin: 0 8px;
}

/* 搜索上下文信息：右侧绝对定位，不影响居中 */
.search-context {
  position: absolute;
  right: 24px;
  bottom: 8px;
  font-size: 14px;
  color: #888;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #f5f5f5;
  padding: 2px 10px;
  border-radius: 4px;
  line-height: 22px;
}

/* ==================== 内容区 ==================== */
.content-wrapper {
  display: flex;
  max-width: 1200px;
  margin: 12px auto 40px;
  padding: 0 24px;
  gap: 24px;
  align-items: flex-start;
  // background: #f5f7fa;
}

/* ---------- 侧栏 ---------- */
.sidebar {
  width: 220px;
  min-width: 220px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 100px);
}

.sidebar-header {
  height: 46px;
  line-height: 46px;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  background: #c62828;
  flex-shrink: 0;
}

.sidebar-body {
  overflow-y: auto;
  flex: 1;
}
.sidebar-body::-webkit-scrollbar {
  width: 4px;
}
.sidebar-body::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-body::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 2px;
}
.sidebar-body::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

.sidebar-group {
  border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; }
}

.sidebar-category {
  // padding: 8px 14px;
  font-size: 16px;
  height:46px;
  text-align:center;
  line-height:46px;
  color: #333;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  background: #edc4c4;
  // &:hover { background: #fff5f5; color: #c62828; }
}

.sidebar-sub {
  padding-bottom: 2px;
  ul.no-bullets { padding-inline-start: 0; margin: 0; }
}

.sub-item-row {
  display: flex;
  // align-items: center;
  gap: 4px;
  padding: 4px 14px 4px 28px;
  font-size: 15px;
}
.sub-item-row var{
  margin-top: 2px;
  margin-right: 2px;
}
.sub-link {
  color: #555;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s;
  // overflow: hidden;
  // text-overflow: ellipsis;
  // white-space: nowrap;
  &:hover { color: #c62828; }
  &.active { color: #c62828; font-weight: 500; }
}

.sub-leaf-list {
  list-style: none;
  padding-inline-start: 0;
  margin: 0;
}

.sub-leaf {
  padding: 4px 14px 4px 48px;
  font-size: 14px;
  color: #777;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s;
  &:hover { color: #c62828; background: #fafafa; }
  &.active { color: #c62828; font-weight: 500; background: #fff5f5; }
}

/* ---------- 主内容 ---------- */
.main-content {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.result-list {
  border-radius: 8px;
}

.result-card {
  padding: 20px 24px;
  border-bottom: none;
  margin-bottom: 0;
  transition: background 0.2s;
  &:hover { background: #fafcff; }
  // &:last-child { border-bottom: none; }
}
.result-card + .result-card {
  border-top: 1px solid #f0f0f0;
}
.result-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.6;
  margin: 0 0 8px;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: #c62828; }
  :deep(span) { color: #c62828; }
}

.result-snippet {
  font-size: 18px;
  color: #555;
  line-height: 1.7;
  margin: 0 0 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  :deep(span) { color: #c62828; }
}

.result-meta {
  // .source { float: left; margin-bottom: 4px; }
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-tag {
  display: inline-block;
  padding: 3px 10px;
  font-size: 16px;
  color: #c62826;
  // background: #f5f7fa;
  border: 1px solid #e9dddd;
  border-radius: 4px;
  line-height: 22px;
  margin-right: 6px;
}

.meta-tag-primary {
  color: #c62828;
  background: #fff5f5;
  border-color: #ffcdd2;
}

.line {
  clear: both;
}

/* ---------- 分页 ---------- */
.result-list :deep(.el-pagination) {
  padding: 12px 20px 8px;
  text-align: right;
}

/* ---------- 空状态 ---------- */
.empty-state {
  padding: 60px 0;
}
</style>

<style lang="less">
html {
  background: #f5f7fa;
}
/* 全局滚动条样式 */
html::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
html::-webkit-scrollbar-track {
  background: #f0f0f0;
}
html::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 3px;
}
html::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}
</style>
