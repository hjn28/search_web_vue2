/**
 * ============================================================================
 * 核心工具函数模块
 * ============================================================================
 *
 * 本模块提供项目中所有页面共享的纯函数工具，涵盖：
 *   1. HTML/正则转义
 *   2. 汇总要点数据格式化与统计
 *   3. 文本高亮与处理
 *   4. 数据归一化
 *   5. 中文数字转换
 *
 * 这些函数保持为独立导出，便于按需引入。
 * 同时提供了同名的类封装（@/utils/classes/），统一管理时可以迁移。
 *
 * @module utils/index
 * @see module:SummaryFormatter 更完整的类封装版本
 */

/**
 * 对文本进行 HTML 转义，防止标签注入或结构破坏。
 * @param {any} value 原始文本
 * @returns {string} 转义后的安全字符串
 */
export function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 转义正则特殊字符，避免关键词中包含特殊符号导致匹配异常。
 * @param {string} text 原始关键词
 * @returns {string} 可安全用于 RegExp 的字符串
 */
export function escapeRegExp(text = '') {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 将"精准词"输入（多行文本）转换为去重数组，按长度降序排列。
 * 长词优先匹配，防止短词被长词覆盖导致高亮不完整。
 * @param {string} exactWordInput 精准词输入框内容
 * @returns {string[]} 处理后的精准词数组
 */
export function parseExactWordList(exactWordInput = '') {
  const list = String(exactWordInput)
    .split(/\n+/)
    .map(word => String(word || '').trim())
    .filter(Boolean)
  return Array.from(new Set(list)).sort((a, b) => b.length - a.length)
}

/**
 * 根据 sww（纲要章节）配置，将篇名（pian）写入汇总要点项的同级字段。
 *
 * 匹配规则：item.yuyi 精确命中 swwItem.zhangjie 中的任一项。
 * 典型用途：在展示汇总要点时，显示每个主题所属的"篇"层级。
 *
 * @param {Array} zhaiyaoList 汇总要点列表
 * @param {Array} swwList 纲要章节映射列表（[{ pian, zhangjie: [...] }]）
 * @returns {Array} 处理后的汇总要点列表（原地更新并返回）
 */
export function assignPianByYuyi(zhaiyaoList = [], swwList = []) {
  if (!Array.isArray(zhaiyaoList) || !Array.isArray(swwList)) return zhaiyaoList

  const zhangjiePianMap = new Map()
  swwList.forEach(sectionItem => {
    const pian = String(sectionItem && sectionItem.pian ? sectionItem.pian : '').trim()
    const zhangjieList = Array.isArray(sectionItem && sectionItem.zhangjie) ? sectionItem.zhangjie : []
    zhangjieList.forEach(zhangjieItem => {
      const key = String(zhangjieItem || '').trim()
      if (pian && key && !zhangjiePianMap.has(key)) {
        zhangjiePianMap.set(key, pian)
      }
    })
  })

  zhaiyaoList.forEach(item => {
    const yuyi = String(item && item.yuyi ? item.yuyi : '').trim()
    item.pian = yuyi && zhangjiePianMap.get(yuyi) ? zhangjiePianMap.get(yuyi) : ''
  })

  return zhaiyaoList
}

/**
 * 在正文中高亮精准词（标记为 HTML span），默认额外高亮"建议"。
 * @param {string} content 正文文本
 * @param {string[]} words 精准词数组
 * @param {string} className 高亮样式类名，默认 detail-exact-word
 * @returns {string} 含高亮标签的 HTML 字符串
 */
export function highlightExactWords(content = '', words = [], className = 'detail-exact-word') {
  const text = String(content || '')
  const allWords = Array.isArray(words) ? [...words, '建议'] : ['建议']
  if (!text || allWords.length === 0) return text

  const pattern = allWords.map(word => escapeRegExp(word)).join('|')
  if (!pattern) return text

  const reg = new RegExp(`(${pattern})`, 'g')
  return text.replace(reg, `<span class="${className}">$1</span>`)
}

/**
 * 将数字转换为中文数字表示（用于序号或层级展示）。
 * 支持最大亿级别。
 *
 * @param {number} num 阿拉伯数字
 * @returns {string} 中文数字字符串
 */
export function convertToChineseNumeral(num) {
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
 * 将换行符转换为 HTML <br/> 标签，便于页面直接渲染。
 * @param {string} text 原始文本
 * @returns {string} 含换行标签的 HTML
 */
export function formatSummaryHtml(text) {
  const t = String(text || '')
  return t.replace(/\n/g, '<br/>')
}

/**
 * 将结构化汇总要点列表格式化为纯文本（含主题编号、标题、正文）。
 * @param {Array} list 汇总要点数据列表 [{ yuyi, arr: [{ adviceobj, text }] }]
 * @returns {string} 格式化后的纯文本
 */
export function formatZhaiyaoText(list) {
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
 * 获取汇总要点统计数据（代表数、建议数、意见数、代表意见分布、建议标题列表）。
 *
 * @param {Array} arr 汇总要点条目数组（每条含 adviceobj 和 text）
 * @returns {Object} {
 *   representativeCount: number,  // 独立代表人数
 *   suggestionCount: number,      // 建议标题去重数
 *   opinionCount: number,         // 意见段落总数
 *   countMap: Array,              // 代表意见分布（每条意见对应一个 key）
 *   jyCountMap: Array             // 建议标题列表（去重）
 * }
 */
export function getSummaryCountData(arr) {
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
 * 生成汇总要点统计描述文本（如"当前共有X位代表提出了Y条建议。"）。
 * @param {Array} arr 汇总要点条目数组
 * @returns {string} 统计文本
 */
export function formatSummaryCountText(arr) {
  const { representativeCount, suggestionCount } = getSummaryCountData(arr)
  return `当前共有${representativeCount}位代表提出了${suggestionCount}条建议。`
}

/**
 * 格式化汇总要点内容为 HTML 字符串，支持按节过滤和精准词高亮。
 *
 * 流程：按节（section）匹配文本 → 提取代表元信息 → 高亮精准词 → 拼装 HTML。
 * sectionIndex = -1 时匹配"无分节"内容（section 为空的文本）。>
 *
 * @param {Array} arr 汇总要点数据
 * @param {string[]} exactWords 精准词列表
 * @param {string|string[]} sections 节名或节名数组
 * @param {number} sectionIndex 节索引
 * @returns {string} HTML 字符串
 */
export function formatSummaryParagraph(arr, exactWords = [], sections = [], sectionIndex = 0) {
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
      text = String(matchingTexts[0].value || '')
      compareKey = String(matchingTexts[0].key || '')
    } else {
      // 多个匹配时按相似度（sim）排序，最高值加粗显示
      const maxSim = Math.max(...matchingTexts.map(t => Number(t.sim) || 0))
      text = matchingTexts.map(t => {
        const raw = escapeHtml(String(t.value || ''))
        return Number(t.sim) === maxSim ? `<strong>${raw}</strong>` : raw
      }).join('')
      compareKey = String(matchingTexts[0].key || '')
    }

    // 拼装代表元信息：标题、届次、编号、代表团、姓名
    const title = it && it.adviceobj && it.adviceobj.title ? it.adviceobj.title : ''
    const session = it && it.adviceobj && it.adviceobj.session ? it.adviceobj.session : ''
    const cbxx = it && it.adviceobj && it.adviceobj.cbxx ? it.adviceobj.cbxx : ''
    const rep = it && it.adviceobj && (it.adviceobj.representative || it.adviceobj.representative === '') ? it.adviceobj.representative : ''
    const delegation = it && it.adviceobj && (it.adviceobj.delegation || it.adviceobj.delegation === '') ? it.adviceobj.delegation : ''
    const id = it && it.adviceobj && it.adviceobj.id ? it.adviceobj.id : ''
    const highlightedText = highlightExactWords(text, exactWords, 'summary-exact-word')
    const safeCbxx = escapeHtml(cbxx) ? escapeHtml(cbxx) + '；' : ''
    const safeDelegation = escapeHtml(delegation) ? `${escapeHtml(delegation)}团` : ''
    const safeRep = safeDelegation ? `${escapeHtml(rep)}代表` : `${escapeHtml(rep)}`
    parts.push(`${highlightedText}${(rep || delegation) ? `<span class="summary-rep-meta">（</span><span class="summary-rep-distinguish">标题：${title}；${safeCbxx}第${id}号；届次${session}；</span><span class="summary-rep-meta">${safeDelegation}${safeRep}）</span>${compareKey ? `<span class="summary-yuanwen-word">[纲要原文：${compareKey}]</span>` : ''}<br />&emsp;&emsp;` : ''}`)
  })

  return parts.join('')
}

/**
 * 判断汇总要点数据中是否存在未分节的文本内容（section 为空但有 value 或 key）。
 * 用于决定是否展示"章级无分节内容"部分。
 *
 * @param {Array} arr 汇总要点数据
 * @returns {boolean} 是否存在无分节的文本
 */
export function hasUngroupedSummaryText(arr = []) {
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
 * 检查当前 bigtitle 是否与之前的条目重复（用于渲染时避免重复显示篇名）。
 * @param {Array} list 汇总要点列表
 * @param {number} index 当前索引
 * @returns {boolean} true=重复, false=不重复
 */
export function isDuplicateBigtitle(list, index) {
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
 * 统一处理高亮标签：
 * - 将 <em> 转为统一样式的 <span>
 * - 规范双换行为单换行
 *
 * @param {string} html 原始 HTML
 * @returns {string} 处理后的 HTML
 */
export function handleGl(html) {
  if (!html) return ''
  return String(html)
    .replace(/<em>/g, '<span style="color: var(--primary-red)">')
    .replace(/<\/em>/g, '</span>')
    .replace(/\n\n/g, '\n')
}

/**
 * 展平 level1/level2 层级内容，汇总为单段文本。
 * @param {Object} record 包含 content.level1/level2 层级的数据
 * @returns {string} 拼接后的文本
 */
export function flattenContents(record) {
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
 * 根据 value 在选项列表中定位目标项并返回展示文案。
 * @param {*} value 选项值
 * @param {Array} list 选项列表 [{ value, text }]
 * @returns {string} 匹配的 text 或空字符串
 */
export function getSelectText(value, list) {
  const target = (list || []).find(item => item.value === value)
  return target ? target.text : ''
}

/**
 * 将汇总要点接口返回归一化为页面可渲染的数据结构。
 *
 * 目标结构：
 * [{ yuyi, bigtitle, arr: [{ adviceobj, text: string[] }] }]
 *
 * 兼容输入：
 * 1) 结构化数组（直接是汇总要点列表）
 * 2) 包裹对象（data / list 字段）
 * 3) 纯文本汇总要点（string 或 { text }）
 *
 * @param {any} apiData 接口返回值
 * @param {any} fallbackData 回退数据（如本地 zhaiyao.json）
 * @returns {{ list: Array, summaryFromApi: string }} 归一化结果
 */
export function normalizeZhaiyaoData(apiData, fallbackData = null) {
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
 * 读取本地上传的文件内容（文本），返回 Promise<string>。
 * @param {File} file 文件对象
 * @returns {Promise<string>} 文件文本内容
 */
export function readLocalFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target.result)
    reader.onerror = () => reject(new Error('readLocalFile error'))
    reader.onabort = () => reject(new Error('readLocalFile aborted'))
    reader.readAsText(file)
  })
}

/**
 * 遍历汇总要点数据，按主题统计去重后的建议数量。
 * @param {Object} zhaiyaoData 汇总要点数据 { data: [...] }
 * @returns {number} 总建议数
 */
export function countSuggestionsByTheme(zhaiyaoData) {
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
  let totalSuggestionCount = 0
  for (const theme in suggestionCountByTheme) {
    if (Object.prototype.hasOwnProperty.call(suggestionCountByTheme, theme)) {
      totalSuggestionCount += suggestionCountByTheme[theme]
    }
  }
  return totalSuggestionCount
}

/**
 * 收集汇总要点中所有唯一的标题（含 id 和 session 后缀去重）。
 * @param {Object} zhaiyaoData 汇总要点数据 { data: [...] }
 * @returns {string[]} 唯一标题列表
 */
export function collectAllTitles(zhaiyaoData) {
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
 * 将 swwItem.zhangjie 同步到 item.yuyi 的 pian（篇名）字段。
 * @param {Array} zhaiyaoList 汇总要点列表
 * @param {Array} swwList 纲要列表
 * @returns {Array} 处理后的汇总要点列表
 * @deprecated 请使用 assignPianByYuyi 代替
 */
export const assignPianByZhangjie = assignPianByYuyi

/**
 * Base64 编码函数。
 *
 * 对输入的字符串进行标准 Base64 编码，用于生成平台登录接口 URL 中的
 * userid 加密段（如 config.js 中 platlogin_bz 路径末尾的编码串）。
 *
 * 编码算法说明：
 *   - 使用标准 Base64 字母表（A-Z, a-z, 0-9, +, /）
 *   - 每 3 字节一组编码为 4 个 Base64 字符
 *   - 不足 3 字节时补 `=` 填充
 *
 * @param {string} str 待编码的原始字符串（如 userid）
 * @returns {string} Base64 编码后的字符串
 *
 * @example
 *   base64Encode('user123') // => 'dXNlcjEyMw=='
 */
export function base64Encode(str) {
  const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

  let output = ''
  let chr1, chr2, chr3
  let enc1, enc2, enc3, enc4
  let i = 0

  do {
    chr1 = str.charCodeAt(i++)
    chr2 = str.charCodeAt(i++)
    chr3 = str.charCodeAt(i++)

    enc1 = chr1 >> 2
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
    enc4 = chr3 & 63

    if (isNaN(chr2)) {
      enc3 = enc4 = 64
    } else if (isNaN(chr3)) {
      enc4 = 64
    }

    output += keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4)
    chr1 = chr2 = chr3 = undefined
    enc1 = enc2 = enc3 = enc4 = undefined
  } while (i < str.length)

  return output
}

/**
 * ============================================================================
 * 工具类导出
 * ============================================================================
 * 将新封装的 7 个工具类集中导出，方便按需引入。
 *
 * 使用方式：
 *   import { SummaryFormatter, SearchHelper, DataExporter } from '@/utils'
 *   或：
 *   import SummaryFormatter from '@/utils/classes/SummaryFormatter'
 * ============================================================================
 */
export { default as SummaryFormatter } from './classes/SummaryFormatter'
export { default as DataExporter } from './classes/DataExporter'
export { default as SearchHelper } from './classes/SearchHelper'
export { default as FileHelper } from './classes/FileHelper'
export { default as TreeHelper } from './classes/TreeHelper'
export { default as HistoryManager } from './classes/HistoryManager'
export { default as ReportBuilder } from './classes/ReportBuilder'
