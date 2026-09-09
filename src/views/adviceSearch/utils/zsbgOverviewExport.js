/**
 * ============================================================================
 * 分析报告导出 HTML 构建器
 * ============================================================================
 *
 * 为分析报告导出提供 HTML 片段构建函数：
 *   1. buildOverviewCountTableHtml - 构建统计表格 HTML
 *   2. buildOverviewChartHtml - 构建图表区块 HTML（含截图）
 *
 * 导出时通过 DataExporter.exportOverviewReport() 统一调用。
 *
 * @module views/adviceSearch/utils/zsbgOverviewExport
 * @see module:utils/classes/DataExporter 包含更完整的导出流程
 */

import { getOverviewChartAxis } from './zsbgChartRender'

/**
 * 构建分析报告统计表格的 HTML 片段
 *
 * @param {Object} node 表格节点 { type: 'count-table', columns, rows }
 * @param {Function} escapeHtml HTML 转义函数
 * @returns {string} 表格 HTML 字符串
 */
export function buildOverviewCountTableHtml(node, escapeHtml) {
  if (!node || node.type !== 'count-table') return ''
  const esc = typeof escapeHtml === 'function' ? escapeHtml : value => String(value || '')
  const columns = Array.isArray(node.columns) ? node.columns : []
  const rows = Array.isArray(node.rows) ? node.rows : []

  // 表头：固定序号列 + 各数据列
  const headerHtml = [
    '<th style="border:1px solid #ccc;padding:6px 8px;background:#f5f5f5;min-width:56px;">序号</th>'
  ]
  columns.forEach(col => {
    headerHtml.push(
      `<th style="border:1px solid #ccc;padding:6px 8px;background:#f5f5f5;">${esc(col && col.label ? col.label : '')}</th>`
    )
  })

  // 表体
  const bodyHtml = rows.map((row, rowIndex) => {
    const colsHtml = columns.map(col => {
      const value = row && col ? row[col.key] : ''
      const printable = value === null || value === undefined || value === '' ? '-' : value
      return `<td style="border:1px solid #ccc;padding:6px 8px;text-align:left;">${esc(printable)}</td>`
    }).join('')
    return `<tr><td style="border:1px solid #ccc;padding:6px 8px;text-align:center;">${rowIndex + 1}</td>${colsHtml}</tr>`
  }).join('')

  return `<div style="margin:8px 0 14px;">
    <table style="border-collapse:collapse;width:100%;table-layout:fixed;word-break:break-word;font-size:13px;color:#333;">
      <thead><tr>${headerHtml.join('')}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  </div>`
}

/**
 * 构建分析报告图表区块的 HTML 片段
 *
 * 导出时通过 Canvas toDataURL 获取图表截图转图片。
 * canvas 可能尚未渲染完成，需调用方确保 chartRenderInfo 已就绪。
 *
 * @param {Object} node 图表节点 { type: 'chart', name, props, exportChartRenderInfo }
 * @param {Object} options 选项 { escapeHtml, getOverviewExportMaxWidth }
 * @returns {string} 图表 HTML 片段
 */
export function buildOverviewChartHtml(node, options) {
  if (!node || node.type !== 'chart') return ''
  const esc = options && typeof options.escapeHtml === 'function'
    ? options.escapeHtml
    : value => String(value || '')
  const getOverviewExportMaxWidth = options && typeof options.getOverviewExportMaxWidth === 'function'
    ? options.getOverviewExportMaxWidth
    : () => 620

  const title = esc(node.name || '图表')
  const seriesData = Array.isArray(node.props && node.props.seriesData) ? node.props.seriesData : []
  const chartRenderInfo = node.exportChartRenderInfo || { html: '', width: getOverviewExportMaxWidth() }
  const chartImage = chartRenderInfo.html || ''

  if (!seriesData.length) {
    if (chartImage) {
      return `<div style="margin:10px 0;border:2px solid #999;padding:8px 0;">${chartImage}</div>
        <p>暂无图表数据</p>`
    }
    return '<p>暂无图表数据</p>'
  }
  return `<div style="margin:10px 0;border:2px solid #999;padding:8px 0;">${chartImage}</div>`
}
