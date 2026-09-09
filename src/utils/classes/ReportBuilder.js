/**
 * ReportBuilder - 分析报告构建工具类
 *
 * 功能：分析报告参数构建、图表渲染配置、报告树生成
 * 统一分析报告的生成逻辑，分离 UI 展示与数据构建
 *
 * @module ReportBuilder
 * @example
 *   import ReportBuilder from '@/utils/classes/ReportBuilder'
 *   ReportBuilder.buildPresetSubtopics(reportWordInputs)
 */

class ReportBuilder {
  /**
   * 图表颜色池（循环使用）
   * @type {string[]}
   */
  static CHART_COLORS = ['#4A86C5', '#C0504D', '#89B34A', '#8064A2', '#4BACC6', '#F79646', '#9BBB59', '#1F77B4']

  /**
   * 图表系列颜色映射表
   * @type {Object<string, string>}
   */
  static CHART_COLOR_MAP = {
    建议数: '#4A86C5',
    提案数: '#C0504D',
    建议占比: '#4A86C5',
    提案占比: '#C0504D',
    2020: '#4F81BD',
    2021: '#C0504D',
    2022: '#9BBB59',
    2023: '#8064A2',
    2024: '#4BACC6',
    2025: '#F79646',
    2026: '#1F77B4'
  }

  /**
   * 中国省级行政区列表（用于图表判断）
   * @type {string[]}
   */
  static PROVINCES = [
    '上海', '云南', '内蒙古', '北京', '台湾', '吉林', '四川', '天津', '宁夏',
    '安徽', '山东', '山西', '广东', '广西', '新疆', '江苏', '江西', '河北',
    '河南', '浙江', '海南', '湖北', '湖南', '澳门', '甘肃', '福建', '贵州',
    '辽宁', '重庆', '陕西', '青海', '香港', '黑龙江'
  ]

  /**
   * 标准化图表系列数据
   * @param {Array} seriesData - 原始系列数据
   * @returns {Array} 规范化的系列数据
   */
  static normalizeChartSeries(seriesData) {
    if (!Array.isArray(seriesData)) return []
    return seriesData
      .filter(item => item && typeof item === 'object')
      .map((item, index) => {
        const name = String(item.name || '').trim()
        const defaultColor = this.CHART_COLORS[index % this.CHART_COLORS.length]
        return {
          ...item,
          name,
          color: String(item.color || this.CHART_COLOR_MAP[name] || defaultColor),
          data: Array.isArray(item.data) ? item.data : []
        }
      })
  }

  /**
   * 判断图表系列是否为百分比类型
   * @param {Array} seriesData - 标准化系列数据
   * @returns {boolean} 是否百分比类型
   */
  static isPercentSeries(seriesData) {
    return (Array.isArray(seriesData) ? seriesData : []).some(item => {
      const name = String(item && item.name ? item.name : '')
      if (name.includes('占比') || name.includes('同比') || name.includes('%')) return true
      const values = Array.isArray(item && item.data) ? item.data : []
      return values.some(v => (typeof v === 'string' && v.includes('%')) || (typeof v === 'number' && !Number.isInteger(v)))
    })
  }

  /**
   * 解析图表组件名称（根据数据特征自动选择图表类型）
   * @param {Array} years - 年份/省份列表
   * @param {Array} seriesData - 系列数据
   * @param {string} [type] - 图表类型
   * @returns {string} 组件名称
   */
  static resolveChartComponent(years, seriesData, type) {
    if (type === 'bar') return 'BarChartWithTable'
    if (type === 'map') return 'MapChart'
    const hasProvinceAxis = Array.isArray(years) && years.length > 0 &&
      years.every(axis => this.PROVINCES.includes(String(axis)))
    if (hasProvinceAxis) return 'ProvinceLineChart'
    if (this.isPercentSeries(seriesData)) return 'LinePercentChart'
    return 'LineChartWithTable'
  }

  /**
   * 构建图表渲染配置
   * @param {Object} otherItem - 图表数据项
   * @param {string} fallbackTitle - 标题回退
   * @param {number} chartIndex - 图表索引
   * @returns {Object|null} 渲染配置 { componentName, chartTitle, chartProps }
   */
  static buildChartRenderConfig(otherItem, fallbackTitle, chartIndex) {
    if (!otherItem || typeof otherItem !== 'object') return null
    const props = otherItem.props && typeof otherItem.props === 'object' ? otherItem.props : {}
    const years = Array.isArray(props.years) ? props.years : []
    const seriesData = this.normalizeChartSeries(props.seriesData)
    const type = props.type
    const rawData = Array.isArray(props.data)
      ? props.data
      : (Array.isArray(props.mapData) ? props.mapData : [])

    // 地图类型：兼容三种输入
    // 1) props.data / props.mapData: [{ name, value }]
    // 2) props.seriesData[0].data + props.years
    if (type === 'map') {
      let mapData = Array.isArray(rawData) ? rawData : []
      if (!mapData.length && years.length && seriesData.length) {
        const firstSeries = seriesData[0]
        const values = Array.isArray(firstSeries && firstSeries.data) ? firstSeries.data : []
        mapData = years.map((name, idx) => ({ name, value: values[idx] }))
      }
      mapData = mapData
        .filter(item => item && item.name)
        .map(item => ({
          name: String(item.name).trim(),
          value: typeof item.value === 'number' ? item.value : Number(item.value) || 0
        }))
      if (!mapData.length) return null
      const componentName = 'MapChart'
      const chartTitle = String(otherItem.chart || '').trim() || `${fallbackTitle} 图表${chartIndex + 1}`
      const chartProps = {
        mapData: mapData,
        years: mapData.map(d => d.name),
        titleText: chartTitle
      }
      return { componentName, chartTitle, chartProps }
    }

    if (!seriesData.length) return null

    const componentName = this.resolveChartComponent(years, seriesData, type)
    const chartTitle = String(otherItem.chart || '').trim() || `${fallbackTitle} 图表${chartIndex + 1}`
    const chartProps = { ...props, seriesData }

    if (componentName === 'ProvinceLineChart') {
      chartProps.provinces = years
    } else if (componentName === 'MapChart') {
      // MapChart: years as category labels, include titleText
      chartProps.years = years
      chartProps.titleText = chartTitle
    } else {
      chartProps.years = years
    }

    return { componentName, chartTitle, chartProps }
  }

  /**
   * 构建分析报告树中的图表节点
   * @param {Object} otherItem - 图表数据
   * @param {number} level - 层级
   * @param {string} fallbackTitle - 标题回退
   * @param {number} chartIndex - 图表索引
   * @returns {Object|null} 图表节点对象
   */
  static buildChartNode(otherItem, level, fallbackTitle, chartIndex) {
    const config = this.buildChartRenderConfig(otherItem, fallbackTitle, chartIndex)
    if (!config) return null
    return {
      type: 'chart',
      level,
      name: config.chartTitle,
      component: config.componentName,
      props: config.chartProps
    }
  }

  /**
   * 获取图表坐标轴
   * @param {Object} node - 图表节点
   * @returns {Array} 坐标轴数据
   */
  static getChartAxis(node) {
    const props = node && node.props && typeof node.props === 'object' ? node.props : {}
    if (Array.isArray(props.years) && props.years.length) return props.years
    if (Array.isArray(props.provinces) && props.provinces.length) return props.provinces
    return []
  }

  /**
   * 从报告词输入构建预设子主题映射
   * @param {Array} reportWordInputs - 报告词输入 [{ word, value }]
   * @returns {Object} 子主题映射
   */
  static buildPresetSubtopics(reportWordInputs) {
    return (Array.isArray(reportWordInputs) ? reportWordInputs : []).reduce((acc, row) => {
      const key = String(row && row.word ? row.word : '').trim()
      if (!key) return acc
      const rawValue = String(row && row.value ? row.value : '').trim()
      acc[key] = rawValue ? rawValue.split(/[，,]+/).map(v => v.trim()).filter(Boolean) : []
      return acc
    }, {})
  }

  /**
   * 规范化词数组（兼容 word 对象和纯字符串）
   * @param {Array} words - 原始词数组
   * @returns {string[]} 规范化后的词列表
   */
  static normalizeWordArray(words) {
    if (!Array.isArray(words)) return []
    return words
      .map(word => {
        if (word && typeof word === 'object') {
          if (Object.prototype.hasOwnProperty.call(word, 'word')) return String(word.word || '').trim()
          if (Object.prototype.hasOwnProperty.call(word, 'name')) return String(word.name || '').trim()
        }
        return String(word || '').trim()
      })
      .filter(Boolean)
  }

  /**
   * 解析 CSV 字符串为数组（支持中英文逗号）
   * @param {string} value - CSV 字符串
   * @returns {string[]} 解析后的数组
   */
  static parseCsv(value) {
    const text = String(value || '').trim()
    if (!text) return []
    return text.split(/[，,]+/).map(v => v.trim()).filter(Boolean)
  }

  /**
   * 构建统计数据表格节点
   * @param {Object} count - 统计数据
   * @param {number} level - 层级
   * @returns {Object|null} 表格节点
   */
  static buildCountTableNode(count, level) {
    if (!count || typeof count !== 'object' || !Object.keys(count).length) return null
    const nameInput = count && count.name
    let columns = []

    // 兼容后端不同列定义：
    // 1) [{ key, label }] / [{ value, label }] / [{ field, name }] / ['标题', ...]
    // 2) { key: label, ... }
    const normalizeColumn = item => {
      if (item == null) return null
      if (typeof item === 'string') {
        const text = String(item).trim()
        if (!text) return null
        return { key: text, label: text }
      }
      if (typeof item !== 'object') return null
      const key = String(
        item.key || item.value || item.field || item.prop || item.dataIndex || item.name || item.label || item.title || ''
      ).trim()
      const label = String(item.label || item.name || item.title || key).trim()
      if (!key && !label) return null
      return { key: key || label, label: label || key }
    }

    if (Array.isArray(nameInput)) {
      columns = nameInput.map(normalizeColumn).filter(Boolean)
    } else if (nameInput && typeof nameInput === 'object') {
      columns = Object.keys(nameInput).map(key => ({ key, label: String(nameInput[key] || key).trim() || key }))
    } else {
      return null
    }
    if (!columns.length) return null

    // key 冲突去重，避免相同 key 导致列渲染覆盖。
    const seenKeys = Object.create(null)
    columns = columns.map(col => {
      let key = String(col.key || '').trim()
      const label = String(col.label || '').trim() || key
      if (!key) key = label
      if (!key) return null
      if (!seenKeys[key]) {
        seenKeys[key] = 1
        return { key, label }
      }
      const uniqueKey = key + '_' + seenKeys[key]
      seenKeys[key] += 1
      return { key: uniqueKey, label }
    }).filter(Boolean)

    const items = Array.isArray(count.items) ? count.items : []
    const rows = items.map(item => {
      const row = {}
      columns.forEach(col => {
        let value = item[col.key]
        if (col.key === 'session' && (value === undefined || value === null || String(value).trim() === '')) {
          value = item.id
        }
        row[col.key] = value !== undefined && value !== null ? value : ''
      })
      return row
    })

    // 固定列宽：优先按 key 命中，再按 label 命中。序号列固定 80。
    const LABEL_WIDTH_MAP = {
      序号: 80,
      承办司局: 200,
      '主办(含分办、独办)': 200,
      协办: 100,
      参阅: 100,
      小计: 100,
      届次: 90,
      编号: 90,
      代表团: 120,
      标题: 260,
      承办信息: 360
    }
    const KEY_WIDTH_MAP = {
      bureau: 200,
      '主办(含分办、独办)': 200,
      协办: 100,
      参阅: 100,
      total: 100,
      session: 90,
      id: 90,
      delegation: 120,
      title: 260,
      cbxx: 360
    }
    const colWidthWeights = [LABEL_WIDTH_MAP['序号'] || 80]
    columns.forEach(col => {
      const width = KEY_WIDTH_MAP[col.key] || LABEL_WIDTH_MAP[col.label] || 100
      colWidthWeights.push(width)
    })

    return { type: 'count-table', level, columns, rows, colWidthWeights }
  }

  /**
   * 在节点名称后附加统计总数
   * @param {string} name - 原始节点名
   * @param {Object} count - 统计数据
   * @returns {string} 处理后的名称
   */
  static appendCountSuffix(name, count) {
    if (!count || typeof count !== 'object') return name
    const hasTotal = count.total !== undefined && count.total !== null && String(count.total).trim() !== ''
    return hasTotal ? `${name}【${count.total}条建议】` : name
  }

  /**
   * 将文本中的 URL 转换为可点击的链接
   * @param {string} text - 原始文本
   * @param {Function} escapeHtml - HTML 转义函数
   * @returns {string} 含链接的 HTML
   */
  static linkifyText(text, escapeHtml) {
    const esc = typeof escapeHtml === 'function' ? escapeHtml : v => String(v || '')
    return esc(text).replace(/(https?:\/\/[^\s<]+[^\s<.)\]，,。；;!?])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
  }

  /**
   * 将文本转换为 HTML 段落（含链接化和换行）。
   * 支持结构化对象（带 _type 的富文本），引文标记由模板侧独立渲染。
   * @param {string|Object} text - 文本或结构化对象
   * @param {Function} escapeHtml - HTML 转义函数
   * @returns {string} HTML 字符串
   */
  static toContentHtml(text, escapeHtml) {
    const esc = typeof escapeHtml === 'function' ? escapeHtml : v => String(v || '')
    // keypoints 结构化对象：加粗 ）与。之间 及（与，之间的文字
    if (text && typeof text === 'object' && text._type === 'keypoints') {
      let keypointsHtml = esc(String(text.text || '')).replace(/\n/g, '<br/>')
      // ）与。之间的文字加粗
      const closeParenIdx = keypointsHtml.indexOf('）')
      const dotIdx = keypointsHtml.indexOf('。', closeParenIdx + 1)
      if (closeParenIdx !== -1 && dotIdx !== -1) {
        keypointsHtml = keypointsHtml.slice(0, closeParenIdx + 1) +
          '<strong>' + keypointsHtml.slice(closeParenIdx + 1, dotIdx) + '</strong>' +
          keypointsHtml.slice(dotIdx)
      }
      // tally 中（与，之间的文字加粗
      let tallyHtml = ''
      if (text.tally) {
        const rawTally = esc(text.tally)
        const openIdx = rawTally.indexOf('（')
        const commaIdx = rawTally.indexOf('，', openIdx + 1)
        if (openIdx !== -1 && commaIdx !== -1 && commaIdx > openIdx) {
          tallyHtml = '<span class="summary-rep-distinguish">' +
            rawTally.slice(0, openIdx + 1) +
            '<strong>' + rawTally.slice(openIdx + 1, commaIdx) + '</strong>' +
            rawTally.slice(commaIdx) + '</span>'
        } else {
          tallyHtml = '<span class="summary-rep-distinguish">' + rawTally + '</span>'
        }
      }
      return keypointsHtml + tallyHtml
    }
    // 其他结构化对象（_type: 'text' 等）：纯文本转义，不加粗
    if (text && typeof text === 'object') {
      return esc(String(text.text || '')).replace(/\n/g, '<br/>')
    }
    // 普通字符串
    return this.linkifyText(text, escapeHtml).replace(/\n/g, '<br/>')
  }

  /**
   * 规范化内容为数组。
   * 支持旧格式（纯文本字符串）和新格式（{ keypoints, original_text } 结构）。
   * @param {any} content - 原始内容
   * @returns {Array<{_type:string, text:string, originalText?:Array}>} 规范化后的数组
   */
  static normalizeContent(content) {
    if (Array.isArray(content)) {
      return content.map(item => {
        // 新格式：{ keypoints: "...", tally: "...", original_text: [...] }
        if (item && typeof item === 'object' && item.keypoints !== undefined) {
          return {
            _type: 'keypoints',
            keyId: item.keyId || '',
            text: String(item.keypoints || '').trim(),
            tally: item.tally ? String(item.tally).trim() : '',
            originalText: Array.isArray(item.original_text) ? item.original_text : []
          }
        }
        // 旧格式：纯文本字符串
        const text = String(item || '').trim()
        return text ? { _type: 'text', text } : null
      }).filter(Boolean)
    }
    const text = String(content || '').trim()
    return text ? [{ _type: 'text', text }] : []
  }
}

export default ReportBuilder
