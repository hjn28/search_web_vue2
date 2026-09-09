/**
 * ============================================================================
 * 分析报告图表渲染配置器
 * ============================================================================
 *
 * 功能：
 *   1. 标准化图表系列数据（颜色赋值、缺失值填充）
 *   2. 自动判断图表类型（折线图/柱状图/百分比图/省份图）
 *   3. 构建图表渲染配置（供页面渲染和导出共用）
 *
 * 图表类型推导规则：
 *   - type=bar → BarChartWithTable（柱状图）
 *   - 坐标轴全部为省份名 → ProvinceLineChart（省份折线图）
 *   - 含百分比/占比数据 → LinePercentChart（百分比折线图）
 *   - 默认 → LineChartWithTable（普通折线图）
 *
 * @module views/adviceSearch/utils/zsbgChartRender
 * @see module:utils/classes/ReportBuilder 更完整的类封装版本
 */

/** 通用图表颜色池（8 色循环） */
const CHART_COLOR_POOL = ['#4A86C5', '#C0504D', '#89B34A', '#8064A2', '#4BACC6', '#F79646', '#9BBB59', '#1F77B4']

/** 系列名称到固定颜色的映射表 */
const CHART_COLOR_MAP = {
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

/** 中国省级行政区列表 */
const PROVINCES = [
  '上海', '云南', '内蒙古', '北京', '台湾', '吉林', '四川', '天津', '宁夏',
  '安徽', '山东', '山西', '广东', '广西', '新疆', '江苏', '江西', '河北',
  '河南', '浙江', '海南', '湖北', '湖南', '澳门', '甘肃', '福建', '贵州',
  '辽宁', '重庆', '陕西', '青海', '香港', '黑龙江'
]

/** 省份快速查找集合 */
const PROVINCE_SET = PROVINCES.reduce(function(result, name) {
  result[name] = true
  return result
}, {})

/**
 * 标准化图表系列数据：补全缺失的 name、color、data 字段
 * @param {Array} seriesData 原始系列数据
 * @returns {Array} 规范化后的系列数据
 */
export function normalizeChartSeries(seriesData) {
  if (!Array.isArray(seriesData)) return []
  return seriesData
    .filter(item => item && typeof item === 'object')
    .map((item, index) => {
      const name = String(item.name || '').trim()
      const defaultColor = CHART_COLOR_POOL[index % CHART_COLOR_POOL.length]
      return {
        ...item,
        name,
        color: String(item.color || CHART_COLOR_MAP[name] || defaultColor),
        data: Array.isArray(item.data) ? item.data : []
      }
    })
}

/**
 * 判断图表系列是否为百分比类型
 * @param {Array} seriesData 标准化系列数据
 * @returns {boolean} true=百分比类型
 */
export function isPercentSeries(seriesData) {
  return (Array.isArray(seriesData) ? seriesData : []).some((item) => {
    const name = String(item && item.name ? item.name : '')
    if (name.indexOf('占比') > -1 || name.indexOf('同比') > -1 || name.indexOf('%') > -1) return true
    const values = Array.isArray(item && item.data) ? item.data : []
    return values.some((value) => {
      if (typeof value === 'string' && value.indexOf('%') > -1) return true
      return typeof value === 'number' && !Number.isInteger(value)
    })
  })
}

/**
 * 根据数据特征解析图表组件名称
 * @param {Array} years 坐标轴数据（年份或省份名）
 * @param {Array} seriesData 系列数据
 * @param {string} [type] 可选的图表类型（'bar' 等）
 * @returns {string} 组件名称字符串
 */
export function resolveChartComponentName(years, seriesData, type) {
  if (type === 'bar') return 'BarChartWithTable'
  if (type === 'map') return 'MapChart'
  const hasProvinceAxis = Array.isArray(years) && years.length > 0 &&
    years.every(axis => PROVINCE_SET[String(axis)])
  if (hasProvinceAxis) return 'ProvinceLineChart'
  if (isPercentSeries(seriesData)) return 'LinePercentChart'
  return 'LineChartWithTable'
}

/**
 * 统一构建分析报告图表渲染配置。
 * 供"页面渲染"和"导出逻辑"共用，确保参数一致性。
 *
 * @param {Object} otherItem 图表数据项
 * @param {string} fallbackTitle 标题回退
 * @param {number} chartIndex 图表索引
 * @returns {Object|null} { componentName, chartTitle, chartProps }
 */
export function buildZsbgChartRenderConfig(otherItem, fallbackTitle, chartIndex) {
  if (!otherItem || typeof otherItem !== 'object') return null
  const props = otherItem.props && typeof otherItem.props === 'object' ? otherItem.props : {}
  const years = Array.isArray(props.years) ? props.years : []
  const seriesData = normalizeChartSeries(props.seriesData)
  const type = props.type
  if (!seriesData.length) return null

  const componentName = resolveChartComponentName(years, seriesData, type)
  const chartTitle = String(otherItem.chart || '').trim() || `${fallbackTitle} 图表${chartIndex + 1}`
  const chartProps = { ...props, seriesData }

  if (componentName === 'ProvinceLineChart') {
    chartProps.provinces = years
  } else if (componentName === 'MapChart') {
    chartProps.years = years
    chartProps.titleText = chartTitle
  } else {
    chartProps.years = years
  }

  return { componentName, chartTitle, chartProps }
}

/**
 * 构建分析报告树中的图表节点（带渲染配置）
 * @param {Object} otherItem 图表数据
 * @param {number} level 层级
 * @param {string} fallbackTitle 标题回退
 * @param {number} chartIndex 图表索引
 * @returns {Object|null} 图表节点 { type, level, name, component, props }
 */
export function buildZsbgChartNode(otherItem, level, fallbackTitle, chartIndex) {
  const renderConfig = buildZsbgChartRenderConfig(otherItem, fallbackTitle, chartIndex)
  if (!renderConfig) return null
  return {
    type: 'chart',
    level,
    name: renderConfig.chartTitle,
    component: renderConfig.componentName,
    props: renderConfig.chartProps
  }
}

/**
 * 获取图表的坐标轴数据（优先 years，其次 provinces）
 * @param {Object} node 图表节点
 * @returns {Array} 坐标轴数据
 */
export function getOverviewChartAxis(node) {
  const props = node && node.props && typeof node.props === 'object' ? node.props : {}
  if (Array.isArray(props.years) && props.years.length) return props.years
  if (Array.isArray(props.provinces) && props.provinces.length) return props.provinces
  return []
}
