/**
 * SearchHelper - 搜索条件构建与参数管理工具类
 *
 * 功能：构建二次检索参数、关键词解析分类、届次解析与比较
 * 统一管理搜索相关逻辑，避免各组件中重复的字段映射和参数拼接
 *
 * @module SearchHelper
 */

class SearchHelper {
  /**
   * 库类型映射：UI 选项 → 后端接口标识
   * @type {Object<string, string>}
   */
  static CATEGORY_MAP = {
    建议库: 'jianyi',
    议案库: 'yian',
    大会简报: 'dhjb',
    预算库: 'yusuan'
  }

  /**
   * 默认承办类型选项（接口数据缺失时使用）
   * @type {Array<{value: string, label: string}>}
   */
  static DEFAULT_CBLX_OPTIONS = [
    { value: '主办', label: '主办' },
    { value: '独办', label: '独办' },
    { value: '协办', label: '协办' },
    { value: '分办', label: '分办' },
    { value: '参阅', label: '参阅' }
  ]

  /**
   * 默认预算精准词列表
   * @type {string[]}
   */
  static DEFAULT_BUDGET_WORDS = [
    '财政', '预算', '税', '税收', '财税', '减税降费', '税制',
    '债', '国债', '地方债', '专项债', '隐债', '财政支出', '财政投入',
    '财政收入', '财政补贴', '财政补助', '绩效', '转移支付', '财力', '财政资金', '国有资产'
  ]

  /**
   * 构建二次检索的统一参数
   * @param {Object} opts - 搜索选项
   * @param {string} opts.selectedCategory - 选中的库类型（中文）
   * @param {string[]} opts.selectedSession - 选中的届次列表
   * @param {string[]} opts.selectedDelegation - 选中的代表团列表
   * @param {string} opts.selectedRepresentative - 选中的代表姓名
   * @param {string} opts.selectedCbdw - 承办单位
   * @param {string[]} opts.selectedCblx - 承办类型列表
   * @param {Array} opts.selectedKeyProposal - 重点建议列表
   * @param {string} opts.selectedBh - 编号输入（逗号/换行分隔）
   * @param {string} opts.exactWordInput - 精准词输入
   * @param {string} opts.semiFuzzyWordInput - 半模糊词输入
   * @param {string} opts.fuzzyWordInput - 模糊词输入
   * @returns {Object} 后端接口参数对象
   */
  static buildSearchParams(opts = {}) {
    const {
      selectedCategory, selectedSession, selectedDelegation, selectedRepresentative,
      selectedCbdw, selectedCblx, selectedKeyProposal, selectedBh,
      exactWordInput, semiFuzzyWordInput, fuzzyWordInput
    } = opts

    const dataBase = this.CATEGORY_MAP[selectedCategory] || 'jianyi'
    const sessionList = this.toArray(selectedSession)
    const delegationList = this.toArray(selectedDelegation)
    const cblxList = this.toArray(selectedCblx)
    const bhList = this.splitMulti(String(selectedBh || ''))
    const isSuggestion = selectedCategory === 'jianyi'
    return {
      data_base: dataBase,
      theme: this.parseMultiLine(semiFuzzyWordInput),
      term_theme: this.parseMultiLine(exactWordInput),
      fuzzy_theme: this.parseMultiLine(fuzzyWordInput),
      session: sessionList,
      delegation: delegationList,
      representative: (selectedRepresentative || '').trim(),
      ...(isSuggestion ? {
        cbdw: (selectedCbdw || '').trim(),
        cblx: cblxList,
        keyProposalSelect: this.toArray(selectedKeyProposal),
        bh: bhList
      } : {})
    }
  }

  /**
   * 解析多行输入为数组（按换行分割、去重）
   * @param {string} input - 多行文本输入
   * @returns {string[]} 非空字符串数组
   */
  static parseMultiLine(input = '') {
    return String(input)
      .split(/\n+/)
      .map(s => s.trim())
      .filter(Boolean)
  }

  /**
   * 按中英文逗号和换行分割字符串
   * @param {string} text - 输入文本
   * @returns {string[]} 分割后的数组
   */
  static splitMulti(text) {
    return text.split(/[，,、\n]+/).map(s => s.trim()).filter(Boolean)
  }

  /**
   * 确保值为数组（兼容单个值或数组）
   * @param {*} val - 输入值
   * @returns {Array} 数组结果
   */
  static toArray(val) {
    if (Array.isArray(val)) return val.filter(Boolean)
    if (val) return [val]
    return []
  }

  /**
   * 解析届次值，返回主届次数字（如 "14-1" → "14"）
   * @param {string} val - 届次字符串
   * @returns {string} 主届次数字
   */
  static parseSessionMain(val) {
    return String(val || '').trim().toLowerCase().split('-')[0]
  }

  /**
   * 中文数字映射
   * @type {Object<string, number>}
   */
  static CN_NUM_MAP = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
    十一: 11,
    十二: 12,
    十三: 13,
    十四: 14,
    十五: 15,
    十六: 16,
    十七: 17,
    十八: 18,
    十九: 19,
    二十: 20
  }

  /**
   * 解析中文届次（如 "第十四届" → "14"）
   * @param {string} val - 中文届次
   * @returns {string} 数字字符串
   */
  static parseChineseSession(val) {
    const s = String(val || '').trim().toLowerCase()
    const m = s.match(/第([一二三四五六七八九十]+)届/)
    if (m && m[1] in this.CN_NUM_MAP) return String(this.CN_NUM_MAP[m[1]])
    return s.replace(/[^0-9]/g, '') || ''
  }

  /**
   * 按降序排列届次选项（最新届次排最前）
   * @param {Array} list - 届次列表
   * @returns {Array} 排序后的列表
   */
  static sortSessionsDesc(list) {
    const parse = val => {
      const [major, minor] = String(val || '').split('-')
      return [parseInt(major, 10) || 0, parseInt(minor, 10) || 0]
    }
    return [...(Array.isArray(list) ? list : [])].sort((a, b) => {
      const [bMajor, bMinor] = parse(b.value || b.label)
      const [aMajor, aMinor] = parse(a.value || a.label)
      if (bMajor !== aMajor) return bMajor - aMajor
      return bMinor - aMinor
    })
  }

  /**
   * 去除省级行政区后缀（省/市/自治区）
   * @param {string} name - 行政区名称
   * @returns {string} 处理后的名称
   */
  static stripRegionSuffix(name) {
    return String(name || '').trim().toLowerCase()
      .replace(/(省|市|自治区|壮族自治区|回族自治区|维吾尔自治区|特别行政区)/g, '')
  }

  /**
   * 收集所有搜索关键词用于历史记录和本地过滤
   * @param {Object} opts - 搜索选项
   * @returns {string[]} 关键词列表
   */
  static collectSearchKeywords(opts = {}) {
    const { exactWordInput, semiFuzzyWordInput, fuzzyWordInput, selectedKeywords, selectedSegmentContents } = opts
    const sources = [
      ...this.parseMultiLine(exactWordInput),
      ...this.parseMultiLine(semiFuzzyWordInput),
      ...this.parseMultiLine(fuzzyWordInput),
      ...(Array.isArray(selectedKeywords) ? selectedKeywords : []),
      ...(Array.isArray(selectedSegmentContents) ? selectedSegmentContents : [])
    ]
    return [...new Set(sources.map(s => String(s).toLowerCase()))]
  }

  /**
   * 构建检索历史记录的文本描述
   * @param {Object} params - 检索条件
   * @returns {string} 描述文本
   */
  static buildHistoryText(sels, filterParts) {
    const all = [...sels, ...filterParts].filter(Boolean)
    return all.length ? `条件：${all.join('、')}` : '条件：-'
  }
}

export default SearchHelper
