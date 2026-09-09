/**
 * ============================================================================
 * 分析报告树渲染器
 * ============================================================================
 *
 * 功能：
 *   1. 从接口返回数据中提取分析报告树（兼容多种包裹层级）
 *   2. 将树结构扁平化为顺序节点列表（供页面顺序渲染）
 *
 * 树节点类型：
 *   - heading: 标题（level 1/2/3）
 *   - content: 正文段落（含 HTML）
 *   - text: 纯文本
 *   - chart: 图表
 *   - count-table: 统计表格
 *
 * @module views/adviceSearch/utils/zsbgTreeRenderer
 * @see module:utils/classes/TreeHelper 更完整的树操作类封装
 */

/**
 * 从接口返回值中提取分析报告树数据。
 * 兼容不同后端返回的包裹层级：
 *   - 直接数组
 *   - { data: [...] }
 *   - { data: { data: [...] } }
 *   - { result: { data: [...] } }
 *
 * @param {any} payload 接口返回的原始数据
 * @returns {Array} 树节点数组
 */
export function extractZsbgTree(payload) {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && payload.data && Array.isArray(payload.data.data)) return payload.data.data
  if (payload && payload.result && Array.isArray(payload.result.data)) return payload.result.data
  return []
}

/**
 * 将分析报告树结构扁平化为顺序节点数组（用于页面渲染）。
 *
 * 递归遍历树节点，按顺序输出标题（heading）、正文（content）、
 * 纯文本（text）、统计表格（count-table）和图表（chart）节点。
 * 有子节点的节点渲染为 heading，无子节点的渲染为 text。
 *
 * @param {Array} nodes 树节点数组
 * @param {Object} options 回调函数集合
 * @param {Function} options.normalizeContent 内容规范化函数
 * @param {Function} options.appendCountSuffix 名称后附加统计数
 * @param {Function} options.buildCountTableNode 构建统计表格节点
 * @param {Function} options.buildChartNode 构建图表节点
 * @param {Function} options.toContentHtml 内容转 HTML
 * @param {number} level 当前层级（默认 1）
 * @param {Array} result 结果数组（递归累加）
 * @returns {Array} 扁平化的节点列表
 */
export function flattenZsbgTreeNodes(nodes, options, level, result) {
  const currentLevel = typeof level === 'number' ? level : 1
  const output = Array.isArray(result) ? result : []
  if (!Array.isArray(nodes)) return output

  const {
    normalizeContent,
    appendCountSuffix,
    buildCountTableNode,
    buildChartNode,
    toContentHtml
  } = options || {}

  nodes.forEach(node => {
    if (!node || typeof node !== 'object') return
    const name = String(node.name || '').trim()
    if (!name) return

    const children = Array.isArray(node.children) ? node.children : []
    const contentList = typeof normalizeContent === 'function' ? normalizeContent(node.content) : []
    const count = node.count && typeof node.count === 'object' ? node.count : null
    const countTableNode = typeof buildCountTableNode === 'function' ? buildCountTableNode(count, currentLevel) : null
    const otherDataList = Array.isArray(node.otherData) ? node.otherData : []
    const hasChildren = children.length > 0

    if (hasChildren) {
      // 有子节点 → 标题
      output.push({
        type: 'heading',
        level: currentLevel >= 3 ? 3 : (currentLevel > 1 ? 2 : 1),
        name: typeof appendCountSuffix === 'function' ? appendCountSuffix(name, count) : name
      })
      // 正文
      contentList.forEach(contentText => {
        output.push({
          type: 'content',
          level: currentLevel,
          html: typeof toContentHtml === 'function' ? toContentHtml(contentText) : String(contentText || '')
        })
      })
      // 图表
      otherDataList.forEach((otherItem, chartIndex) => {
        const chartNode = typeof buildChartNode === 'function'
          ? buildChartNode(otherItem, currentLevel, name, chartIndex)
          : null
        if (chartNode) output.push(chartNode)
      })
      // 递归子节点
      flattenZsbgTreeNodes(children, options, currentLevel + 1, output)
      return
    }

    // 无子节点 → 纯文本
    output.push({
      type: 'text',
      level: currentLevel,
      name: typeof appendCountSuffix === 'function' ? appendCountSuffix(name, count) : name
    })
    contentList.forEach(contentText => {
      output.push({
        type: 'content',
        level: currentLevel,
        html: typeof toContentHtml === 'function' ? toContentHtml(contentText) : String(contentText || '')
      })
    })
    if (countTableNode) output.push(countTableNode)
    otherDataList.forEach((otherItem, chartIndex) => {
      const chartNode = typeof buildChartNode === 'function'
        ? buildChartNode(otherItem, currentLevel, name, chartIndex)
        : null
      if (chartNode) output.push(chartNode)
    })
  })

  return output
}
