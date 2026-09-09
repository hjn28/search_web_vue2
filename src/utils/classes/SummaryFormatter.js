/**
 * SummaryFormatter - 汇总要点格式化与统计工具类
 *
 * 功能：汇总要点数据的格式化、统计、高亮、文本规范化
 * 统一管理所有汇总要点相关的文本处理逻辑，避免各组件中重复实现
 *
 * @module SummaryFormatter
 * @example
 *   import SummaryFormatter from '@/utils/classes/SummaryFormatter'
 *   // 格式化汇总要点统计文本
 *   const text = SummaryFormatter.formatCountText(data)
 *   // 高亮精准词
 *   const html = SummaryFormatter.highlightWords(content, words)
 */

class SummaryFormatter {
  /**
   * 转义 HTML 特殊字符，防止 XSS 或标签注入
   * @param {any} value - 原始文本
   * @returns {string} 转义后的安全 HTML 字符串
   */
  static escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * 转义正则表达式中的特殊字符
   * @param {string} text - 原始字符串
   * @returns {string} 可安全用于 RegExp 构造的字符串
   */
  static escapeRegExp(text = '') {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * 解析多行精准词输入为去重数组（按长度降序排列）
   * @param {string} input - 文本输入（按换行分隔）
   * @returns {string[]} 处理后的精准词数组
   */
  static parseExactWordList(input = '') {
    const list = String(input)
      .split(/\n+/)
      .map(word => String(word || '').trim())
      .filter(Boolean)
    return Array.from(new Set(list)).sort((a, b) => b.length - a.length)
  }

  /**
   * 将数字转换为中文数字（用于序号展示）
   * @param {number} num - 阿拉伯数字
   * @returns {string} 中文数字表示
   */
  static convertToChineseNumeral(num) {
    const chineseNumerals = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
    const sections = ['', '十', '百', '千', '万', '亿']
    let result = ''
    let sectionIndex = 0
    let isZero = false
    num = Math.floor(num)
    if (num === 0) return chineseNumerals[0]
    while (num > 0) {
      const part = num % 10
      if (part === 0) {
        if (!isZero) {
          isZero = true
          result = chineseNumerals[part] + result
        }
      } else {
        isZero = false
        result = chineseNumerals[part] + sections[sectionIndex] + result
      }
      num = Math.floor(num / 10)
      sectionIndex += 1
    }
    return result
  }

  /**
   * 在文本中高亮精准词（标记为 HTML span）
   * @param {string} content - 正文文本
   * @param {string[]} words - 需要高亮的词列表
   * @param {string} className - 高亮样式类名（默认 detail-exact-word）
   * @returns {string} 含高亮标签的 HTML
   */
  static highlightWords(content = '', words = [], className = 'detail-exact-word') {
    const text = String(content || '')
    const allWords = Array.isArray(words) ? [...words, '建议'] : ['建议']
    if (!text || allWords.length === 0) return text
    const pattern = allWords.map(word => this.escapeRegExp(word)).join('|')
    if (!pattern) return text
    const reg = new RegExp(`(${pattern})`, 'g')
    return text.replace(reg, `<span class="${className}">$1</span>`)
  }

  /**
   * 将换行符转换为 HTML <br/> 标签
   * @param {string} text - 原始文本
   * @returns {string} 含 <br/> 的 HTML 字符串
   */
  static formatSummaryHtml(text) {
    return String(text || '').replace(/\n/g, '<br/>')
  }

  /**
   * 将结构化汇总要点列表格式化为纯文本
   * @param {Array} list - 汇总要点数据列表
   * @returns {string} 格式化后的纯文本
   */
  static formatZhaiyaoText(list) {
    if (!Array.isArray(list)) return ''
    const parts = list.map((item, idx) => {
      const theme = item && item.yuyi ? `主题${idx + 1}：${item.yuyi}` : `主题${idx + 1}`
      const rows = (item && item.arr ? item.arr : []).map((it, i) => {
        const title = it && it.adviceobj && it.adviceobj.title ? it.adviceobj.title : `第${i + 1}条`
        const text = Array.isArray(it && it.text) ? it.text.join('') : ''
        return `${i + 1}. ${title}${text ? '：' + text : ''}`
      }).filter(Boolean).join('\n')
      return [theme, rows].filter(Boolean).join('\n')
    }).filter(Boolean).join('\n\n')
    return parts
  }

  /**
   * 获取汇总要点统计数据（代表数、建议数、意见数）
   * @param {Array} arr - 汇总要点条目数组
   * @returns {Object} 统计结果 { representativeCount, suggestionCount, opinionCount, countMap, jyCountMap }
   */
  static getSummaryCountData(arr) {
    const countMap = []
    const representativeSet = new Set()
    const suggestionTitleSet = new Set()
    if (!Array.isArray(arr) || arr.length === 0) {
      return { representativeCount: 0, suggestionCount: 0, opinionCount: 0, countMap, jyCountMap: [] }
    }
    arr.forEach(item => {
      const adviceobj = item && item.adviceobj ? item.adviceobj : null
      if (!adviceobj) return
      const delegation = adviceobj.delegation || ''
      const representative = adviceobj.representative || ''
      const key = delegation ? `${delegation}团${representative}代表` : `${representative}`
      const title = String(adviceobj.title || '').trim()
      if (title) suggestionTitleSet.add(title)
      const hasRepresentative = key.replace(/团|代表/g, '').trim()
      if (hasRepresentative) representativeSet.add(key)
      const textList = Array.isArray(item && item.text)
        ? item.text.map(t => String(t || '').trim()).filter(Boolean)
        : []
      const opinionCountPerAdvice = textList.length > 0 ? textList.length : 1
      if (!hasRepresentative) return
      for (let i = 0; i < opinionCountPerAdvice; i += 1) {
        countMap.push(key)
      }
    })
    const jyCountMap = Array.from(suggestionTitleSet)
    return {
      representativeCount: representativeSet.size,
      suggestionCount: jyCountMap.length,
      opinionCount: countMap.length,
      countMap,
      jyCountMap
    }
  }

  /**
   * 生成汇总要点统计描述文本
   * @param {Array} arr - 汇总要点条目数组
   * @returns {string} 如 "当前共有X位代表提出了Y条建议。"
   */
  static formatCountText(arr) {
    const { representativeCount, suggestionCount } = this.getSummaryCountData(arr)
    return `当前共有${representativeCount}位代表提出了${suggestionCount}条建议。`
  }

  /**
   * 规范化 text 条目下的 value 字段：字符串原样返回，数组用 join 拼接为字符串
   * @param {*} value - 原始值（string | Array | null/undefined）
   * @returns {string} 处理后的字符串
   */
  static normalizeTextValue(value) {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) return value.join('')
    return String(value == null ? '' : value)
  }

  /**
   * 格式化汇总要点段落为 HTML（支持分节过滤和精准词高亮）
   * @param {Array} arr - 汇总要点数据
   * @param {string[]} exactWords - 精准词列表
   * @param {string|string[]} sections - 节名或节名数组
   * @param {number} sectionIndex - 节索引（-1 表示无分节内容）
   * @returns {string} HTML 字符串
   */
  static formatParagraph(arr, exactWords = [], sections = [], sectionIndex = 0) {
    if (!Array.isArray(arr) || arr.length === 0) return ''
    const parts = []
    const sectionName = Array.isArray(sections) ? sections[sectionIndex] : sections
    const normalizeSection = value => String(value == null ? '' : value).trim()
    const targetSection = normalizeSection(sectionName)
    const isUngroupedSection = value => normalizeSection(value) === ''

    arr.forEach(it => {
      const texts = Array.isArray(it.text) ? it.text.filter(t => t && typeof t === 'object') : []
      let matchingTexts = []
      if (Array.isArray(sections) && sections.length > 0 && sectionIndex === -1) {
        matchingTexts = texts.filter(t => isUngroupedSection(t.section))
      } else if (sectionName == null) {
        matchingTexts = texts
      } else {
        matchingTexts = texts.filter(t => normalizeSection(t.section) === targetSection)
      }
      if (matchingTexts.length === 0) return

      let text = ''
      let compareKey = ''
      if (matchingTexts.length === 1) {
        text = this.normalizeTextValue(matchingTexts[0].value)
        compareKey = String(matchingTexts[0].key || '')
      } else {
        const maxSim = Math.max(...matchingTexts.map(t => Number(t.sim) || 0))
        text = matchingTexts.map(t => {
          const raw = this.escapeHtml(this.normalizeTextValue(t.value))
          return Number(t.sim) === maxSim ? `<strong>${raw}</strong>` : raw
        }).join('')
        compareKey = String(matchingTexts[0].key || '')
      }

      const title = it && it.adviceobj && it.adviceobj.title ? it.adviceobj.title : ''
      const session = it && it.adviceobj && it.adviceobj.session ? it.adviceobj.session : ''
      const cbxx = it && it.adviceobj && it.adviceobj.cbxx ? it.adviceobj.cbxx : ''
      const rep = it && it.adviceobj && (it.adviceobj.representative || it.adviceobj.representative === '') ? it.adviceobj.representative : ''
      const delegation = it && it.adviceobj && (it.adviceobj.delegation || it.adviceobj.delegation === '') ? it.adviceobj.delegation : ''
      const id = it && it.adviceobj && it.adviceobj.id ? it.adviceobj.id : ''
      const highlightedText = this.highlightWords(text, exactWords, 'summary-exact-word')
      const safeCbxx = this.escapeHtml(cbxx) ? this.escapeHtml(cbxx) + '；' : ''
      const safeDelegation = this.escapeHtml(delegation) ? `${this.escapeHtml(delegation)}团` : ''
      const safeRep = safeDelegation ? `${this.escapeHtml(rep)}代表` : `${this.escapeHtml(rep)}`
      parts.push(`${highlightedText}${(rep || delegation) ? `<span class="summary-rep-meta">（</span><span class="summary-rep-distinguish">标题：${title}；${safeCbxx}第${id}号；届次${session}；</span><span class="summary-rep-meta">${safeDelegation}${safeRep}）</span>${compareKey ? `<span class="summary-yuanwen-word">[纲要原文：${compareKey}]</span>` : ''}<br />&emsp;&emsp;` : ''}`)
    })
    return parts.join('')
  }

  /**
   * 判断汇总要点中是否存在未分节（section 为空）的文本内容
   * @param {Array} arr - 汇总要点数据
   * @returns {boolean} 是否存在无分节的文本
   */
  static hasUngroupedText(arr = []) {
    if (!Array.isArray(arr) || arr.length === 0) return false
    return arr.some(it => {
      const texts = Array.isArray(it && it.text) ? it.text : []
      return texts.some(t => {
        if (!t || typeof t !== 'object') return false
        const section = String(t.section == null ? '' : t.section).trim()
        const value = String(t.value == null ? '' : t.value).trim()
        const key = String(t.key == null ? '' : t.key).trim()
        return section === '' && (value || key)
      })
    })
  }

  /**
   * 检查当前 bigtitle 是否与前面条目重复
   * @param {Array} list - 汇总要点列表
   * @param {number} index - 当前索引
   * @returns {boolean} 是否重复
   */
  static isDuplicateBigtitle(list, index) {
    if (!Array.isArray(list) || index <= 0) return false
    const current = list[index]
    const title = current && current.bigtitle ? String(current.bigtitle).trim() : ''
    if (!title) return false
    for (let i = 0; i < index; i += 1) {
      const prev = list[i]
      const prevTitle = prev && prev.bigtitle ? String(prev.bigtitle).trim() : ''
      if (prevTitle && prevTitle === title) return true
    }
    return false
  }

  /**
   * 统一处理高亮标签：将 <em> 转为统一样式的 <span>
   * @param {string} html - 原始 HTML
   * @returns {string} 处理后的 HTML
   */
  static handleGl(html) {
    if (!html) return ''
    return String(html)
      .replace(/<em>/g, '<span style="color: var(--primary-red)">')
      .replace(/<\/em>/g, '</span>')
      .replace(/\n\n/g, '\n')
  }

  /**
   * 将规范且去重的汇总要点对象数组转换为展示用的结构化汇总要点数据
   * 包含去重 text、统计计数、格式化文本等
   * @param {Array} apiData - 接口返回的原始汇总要点数据
   * @returns {Array} 标准化后的汇总要点列表
   */
  static normalizeZhaiyaoList(apiData) {
    return (apiData || []).map(item => {
      const arr = Array.isArray(item.arr)
        ? item.arr.map(arrItem => {
          const text = Array.isArray(arrItem.text)
            ? Array.from(new Set(arrItem.text))
            : []
          return { ...arrItem, text }
        })
        : []
      const summaryCountData = this.getSummaryCountData(arr)
      return {
        ...item,
        arr,
        summaryCountData,
        summaryCountText: this.formatCountText(arr)
      }
    })
  }

  /**
   * 统计每个主题的建议数量（以标题去重统计）
   * @param {Object} zhaiyaoData - 汇总要点数据 { data: [...] }
   * @returns {number} 总建议数
   */
  static countSuggestionsByTheme(zhaiyaoData) {
    const suggestionCountByTheme = {}
    if (!Array.isArray(zhaiyaoData.data)) return 0
    zhaiyaoData.data.forEach(item => {
      const theme = item && item.yuyi ? String(item.yuyi).trim() : '未知主题'
      const arr = Array.isArray(item && item.arr) ? item.arr : []
      const titleList = []
      arr.forEach(entry => {
        const title = entry && entry.adviceobj && entry.adviceobj.title ? String(entry.adviceobj.title).trim() : ''
        if (title) titleList.push(title)
      })
      suggestionCountByTheme[theme] = Array.from(new Set(titleList)).length
    })
    let total = 0
    for (const theme in suggestionCountByTheme) {
      if (Object.prototype.hasOwnProperty.call(suggestionCountByTheme, theme)) {
        total += suggestionCountByTheme[theme]
      }
    }
    return total
  }

  /**
   * 收集汇总要点中所有唯一的标题（含 id 和 session 去重）
   * @param {Object} zhaiyaoData - 汇总要点数据 { data: [...] }
   * @returns {string[]} 唯一标题数组
   */
  static collectAllTitles(zhaiyaoData) {
    const titleList = []
    ;(zhaiyaoData.data || []).forEach(item => {
      const arr = Array.isArray(item && item.arr) ? item.arr : []
      arr.forEach(entry => {
        const title = entry && entry.adviceobj && entry.adviceobj.title ? String(entry.adviceobj.title).trim() : ''
        if (title) titleList.push(`${title}_${entry.adviceobj.id}_${entry.adviceobj.session}`)
      })
    })
    return Array.from(new Set(titleList))
  }

  /**
   * 归一化汇总要点接口返回的数据为统一的页面渲染结构
   * @param {any} apiData - 接口返回值
   * @param {any} fallbackData - 回退数据
   * @returns {{ list: Array, summaryFromApi: string }}
   */
  static normalizeData(apiData, fallbackData = null) {
    const payload = apiData == null ? fallbackData : apiData
    const sourceList = Array.isArray(payload)
      ? payload
      : (payload && Array.isArray(payload.data) ? payload.data
        : (payload && Array.isArray(payload.list) ? payload.list : []))
    const summaryFromApi = typeof payload === 'string'
      ? payload.trim()
      : (payload && typeof payload.text === 'string' ? payload.text.trim() : '')

    if (sourceList.length > 0) {
      const list = sourceList.map((item, index) => {
        const yuyi = item && item.yuyi ? item.yuyi : (item && item.title ? item.title : `主题${index + 1}`)
        const bigtitle = item && item.bigtitle ? item.bigtitle : ''
        const arrSource = item && Array.isArray(item.arr) ? item.arr : []
        const arr = arrSource.map((entry, entryIndex) => {
          const textRaw = entry && entry.text
          const text = Array.isArray(textRaw)
            ? textRaw.map(t => String(t || '').trim()).filter(Boolean)
            : (textRaw ? [String(textRaw).trim()] : [])
          const adviceobj = entry && entry.adviceobj ? entry.adviceobj : { title: `第${entryIndex + 1}条` }
          return { adviceobj, text }
        })
        return { yuyi, bigtitle, arr }
      })
      return { list, summaryFromApi }
    }
    if (summaryFromApi) {
      return {
        list: [{
          yuyi: '汇总要点综合',
          bigtitle: '',
          arr: [{ adviceobj: { title: '汇总要点综合结果' }, text: [summaryFromApi] }]
        }],
        summaryFromApi
      }
    }
    return { list: [], summaryFromApi: '' }
  }

  /**
   * 展平 level1/level2 层级的内容为单段文本
   * @param {Object} record - 层级数据 { content: { level1: [...] } }
   * @returns {string} 拼接的文本
   */
  static flattenContents(record) {
    try {
      const lvl1 = record && record.content && record.content.level1 ? record.content.level1 : []
      const parts = []
      lvl1.forEach(l1 => {
        (l1.level2 || []).forEach(l2 => {
          if (l2 && l2.content) parts.push(l2.content)
        })
      })
      return parts.join(' ')
    } catch (e) {
      return ''
    }
  }

  /**
   * 根据 value 在选项列表中查找对应的 text
   * @param {*} value - 选项值
   * @param {Array} list - 选项列表 [{ value, text }]
   * @returns {string} 匹配的 text 或空字符串
   */
  static getSelectText(value, list) {
    const target = (list || []).find(item => item.value === value)
    return target ? target.text : ''
  }
}

export default SummaryFormatter
