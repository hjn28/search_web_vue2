/**
 * ============================================================================
 * 汇总要点导出模块
 * ============================================================================
 *
 * 负责将汇总要点内容导出为样式化的 DOC 文件。
 * 核心流程：提取页面样式 → 构建 HTML 模板 → 通过 Blob 下载。
 *
 * 函数清单：
 *   1. getStyleText        - 从页面元素读取计算样式
 *   2. buildSummaryCardsHtml  - 构建汇总要点卡片 HTML
 *   3. buildSummaryExportHtml - 组装完整导出模板
 *   4. downloadSummaryDoc     - 统一执行导出流程
 *
 * 类封装版本请参考：@/utils/classes/DataExporter
 *
 * @module utils/export
 */

import { escapeHtml } from './index'

/**
 * 读取页面中指定元素的计算样式，按 CSS 文本拼接返回。
 * @param {Element|null} rootEl 根节点（通常为当前组件根元素 this.$el）
 * @param {string} selector 要读取样式的目标选择器
 * @param {string[]} keys 需要提取的样式属性名列表
 * @param {string} fallback 未读取到时的兜底样式文本
 * @returns {string} 可直接写入 style 标签的样式片段
 */
export function getStyleText(rootEl, selector, keys, fallback = '') {
  const target = rootEl && rootEl.querySelector(selector)
  if (!target || !window.getComputedStyle) return fallback
  const style = window.getComputedStyle(target)
  const chunks = keys.map(key => {
    const value = style.getPropertyValue(key)
    return value ? `${key}:${value}` : ''
  }).filter(Boolean)
  return chunks.length ? `${chunks.join(';')};` : fallback
}

/**
 * 生成汇总要点卡片 HTML。
 *
 * 策略：
 *   1. 优先复用已渲染 DOM（确保导出一致性）
 *   2. 若无 DOM 则按数据回退拼装
 *   3. 纯文本汇总要点作最终回退
 *
 * @param {Object} options 入参配置
 * @param {Element} options.rootEl 根 DOM 元素
 * @param {boolean} options.hasSummaryList 是否有结构化汇总要点列表
 * @param {Array} options.zhaiyaoData 汇总要点数据
 * @param {string} options.summaryContent 纯文本汇总要点
 * @param {Function} options.isDuplicateBigtitle 判断 bigtitle 是否重复
 * @param {Function} options.convertToChineseNumeral 数字转中文
 * @param {Function} options.formatSummaryCountText 格式化统计文本
 * @param {Function} options.formatSummaryParagraph 格式化段落
 * @returns {string} 卡片 HTML 字符串
 */
export function buildSummaryCardsHtml({
  rootEl,
  hasSummaryList,
  zhaiyaoData,
  summaryContent,
  isDuplicateBigtitle,
  convertToChineseNumeral,
  formatSummaryCountText,
  formatSummaryParagraph
}) {
  // 优先复用页面已渲染的汇总要点 DOM，避免导出与页面显示不一致
  const renderedSummaryList = rootEl && rootEl.querySelector('.summary-list')
  if (renderedSummaryList && renderedSummaryList.innerHTML && renderedSummaryList.innerHTML.trim()) {
    return renderedSummaryList.innerHTML
  }

  if (hasSummaryList) {
    const hasUngroupedSummaryText = arr => {
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

    // 按汇总要点数据逐条拼装卡片 HTML
    return (zhaiyaoData || []).map((item, idx) => {
      const bigTitle = item && item.bigtitle ? String(item.bigtitle).trim() : ''
      const yuyi = item && item.yuyi ? String(item.yuyi) : ''
      const yuyiTrimmed = yuyi.trim()
      const isOtherYuyi = yuyiTrimmed === '其他'
      const themeTitle = bigTitle
        ? `${!isDuplicateBigtitle(zhaiyaoData, idx) ? `<div class="summary-card-header">${escapeHtml(bigTitle)}</div>` : ''}<div class="summary-card-header">${escapeHtml(yuyi)}</div>`
        : (isOtherYuyi
          ? '<div class="summary-card-header">其他</div>'
          : `<div class="summary-card-header">（${convertToChineseNumeral(idx + 1)}）${escapeHtml(yuyi)}</div>`)
      const summaryCountText = typeof formatSummaryCountText === 'function'
        ? formatSummaryCountText(item && item.arr ? item.arr : [])
        : ''
      const countHtml = summaryCountText ? `<div class="summary-card-stat">${escapeHtml(summaryCountText)}</div>` : ''
      const arr = item && item.arr ? item.arr : []
      const sections = Array.isArray(item && item.sections) ? item.sections : []
      let bodyHtml = ''

      if (sections.length > 0) {
        const ungroupedHtml = hasUngroupedSummaryText(arr)
          ? `<div class="summary-paragraph">${formatSummaryParagraph(arr, sections, -1)}</div>`
          : ''
        const sectionHtml = sections.map(section => {
          const paragraph = formatSummaryParagraph(arr, section)
          return `<div class="summary-section"><div class="summary-card-header">${escapeHtml(section)}</div><div class="summary-paragraph">${paragraph}</div></div>`
        }).join('')
        bodyHtml = `${ungroupedHtml}${sectionHtml}`
      } else {
        bodyHtml = `<div class="summary-paragraph">${formatSummaryParagraph(arr, null)}</div>`
      }

      return `<div class="summary-card">${themeTitle}${countHtml}<div class="summary-card-body">${bodyHtml}</div></div>`
    }).join('')
  }

  // 无结构化汇总要点时直接导出纯文本
  return `<div class="summary-card"><div class="summary-card-body"><div class="summary-paragraph">${escapeHtml(summaryContent).replace(/\n/g, '<br/>')}</div></div></div>`
}

/**
 * 组装最终导出 HTML 模板（用于 .doc 打开）。
 *
 * 样式由外部传入，便于复用和统一维护。
 * 使用固定字号（22px）确保不同端打开一致。
 *
 * @param {Object} options 入参配置
 * @param {string} [options.title] 导出主标题
 * @returns {string} 完整 HTML 文本
 */
export function buildSummaryExportHtml({
  exportTime,
  title,
  summaryCardsHtml,
  bodyStyle,
  cardStyle,
  headerStyle,
  summaryStatStyle,
  bodyInnerStyle,
  paragraphStyle,
  summaryExactWordStyle,
  yuanwenWordStyle,
  repMetaStyle,
  repDistinguishStyle,
  fontSize = 22
}) {
  const normalizedFontSize = '22px'
  const exportTitle = String(title || '').trim() || '议案建议聚类与汇总要点综合结果'
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>归纳</title>
  <style>
    body { margin: 20px; ${bodyStyle} font-family:"FangSong","FangSong_GB2312","仿宋",serif !important; }
    .export-title { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
    .export-time { color: black; font-size: ${normalizedFontSize}; margin-bottom: 16px; }
    .summary-card { ${cardStyle} font-size: ${normalizedFontSize} !important; }
    .summary-card-header { ${headerStyle} font-size: ${normalizedFontSize} !important; }
    .summary-card-stat { ${summaryStatStyle} font-size: ${normalizedFontSize} !important; }
    .summary-card-body { ${bodyInnerStyle} font-size: ${normalizedFontSize} !important; }
    .summary-paragraph { ${paragraphStyle} font-size: ${normalizedFontSize} !important; font-family:"FangSong","FangSong_GB2312","仿宋",serif !important; }
    .summary-exact-word { ${summaryExactWordStyle} }
    .summary-yuanwen-word { color: blue; font-style: normal; font-size: 20px; scale: 0.8; }
    .summary-rep-meta { ${repMetaStyle} font-family:"KaiTi","KaiTi_GB2312","楷体",serif !important; }
    .summary-rep-distinguish { ${repDistinguishStyle} font-family:"KaiTi","KaiTi_GB2312","楷体",serif !important; }
  </style>
</head>
<body>
  <div class="export-title">${escapeHtml(exportTitle)}</div>
  <div class="export-time">导出时间：${escapeHtml(exportTime)}</div>
  ${summaryCardsHtml}
</body>
</html>`
}

/**
 * 统一执行汇总要点 DOC 导出流程。
 *
 * 流程：
 *   1. 校验汇总要点内容是否可导出
 *   2. 生成汇总要点卡片 HTML
 *   3. 从页面提取核心样式
 *   4. 组装导出模板
 *   5. 通过 Blob + a 标签触发下载
 *   6. 记录操作历史
 *
 * @param {Object} options 入参配置
 * @param {Element} options.rootEl 根 DOM 元素
 * @param {Array} options.zhaiyaoData 汇总要点数据
 * @param {string} options.summaryContent 汇总要点文本
 * @param {string} [options.title] 导出标题
 * @param {Function} options.isDuplicateBigtitle 判断大标题是否重复
 * @param {Function} options.convertToChineseNumeral 数字转中文
 * @param {Function} options.formatSummaryCountText 格式化统计文本
 * @param {Function} options.formatSummaryParagraph 格式化段落
 * @param {Function} options.addHistory 添加操作历史回调
 * @param {Function} options.showAlert 显示提示回调
 * @returns {boolean} true=导出成功触发，false=无数据未导出
 */
export function downloadSummaryDoc({
  rootEl,
  zhaiyaoData,
  summaryContent,
  title,
  isDuplicateBigtitle,
  convertToChineseNumeral,
  formatSummaryCountText,
  formatSummaryParagraph,
  addHistory,
  showAlert,
  fontSize = 38
}) {
  const hasSummaryList = Array.isArray(zhaiyaoData) && zhaiyaoData.length > 0
  const hasSummaryText = !!(summaryContent && String(summaryContent).trim())
  if (!hasSummaryList && !hasSummaryText) {
    if (typeof showAlert === 'function') showAlert('请先生成汇总要点综合内容！')
    return false
  }

  // 生成汇总要点卡片 HTML（优先取页面渲染，回退到数据拼装）
  const summaryCardsHtml = buildSummaryCardsHtml({
    rootEl,
    hasSummaryList,
    zhaiyaoData,
    summaryContent,
    isDuplicateBigtitle,
    convertToChineseNumeral,
    formatSummaryCountText,
    formatSummaryParagraph
  })

  // 从页面提取核心样式
  const bodyStyle = getStyleText(rootEl, '.summary-list',
    ['font-family', 'font-size', 'font-weight', 'color', 'line-height'],
    'font-family:"Microsoft YaHei","PingFang SC",sans-serif;color:#333;')
  const cardStyle = getStyleText(rootEl, '.summary-card',
    ['border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius', 'background-color', 'overflow', 'margin-bottom'],
    'border:1px solid #e8e8e8;border-radius:8px;background:#fff;overflow:hidden;margin-bottom:12px;')
  const headerStyle = getStyleText(rootEl, '.summary-card-header',
    ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'font-weight', 'font-size', 'font-family', 'color', 'line-height', 'border-bottom'],
    'padding:10px 12px;font-weight:700;color:#c9190b;border-bottom:1px solid #f0f0f0;')
  const bodyInnerStyle = getStyleText(rootEl, '.summary-card-body',
    ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'text-indent'],
    'padding:10px 12px;text-indent:2em;')
  const summaryStatStyle = getStyleText(rootEl, '.summary-card-stat',
    ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'color', 'font-size', 'line-height'],
    'padding:6px 12px 0;color:#666;font-size:14px;line-height:1.6;')
  const paragraphStyle = getStyleText(rootEl, '.summary-paragraph',
    ['font-family', 'font-size', 'font-weight', 'color', 'line-height', 'white-space'],
    'font-size:12px;color:#555;line-height:1.8;white-space:normal;')
  const summaryExactWordStyle = getStyleText(rootEl, '.summary-exact-word',
    ['background-color', 'color', 'font-weight', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-radius'],
    'color:red;font-weight:500;')
  const yuanwenWordStyle = getStyleText(rootEl, '.summary-yuanwen-word',
    ['color', 'font-style', 'font-weight', 'font-size'],
    'color:blue;font-style:normal;font-size:16px;')
  const repMetaStyle = getStyleText(rootEl, '.summary-rep-meta', ['color', 'font-weight'], 'color:#c9190b;')
  const repDistinguishStyle = getStyleText(rootEl, '.summary-rep-distinguish', ['color', 'font-weight'], 'color:green;')

  // 组装完整导出 HTML
  const exportContent = buildSummaryExportHtml({
    exportTime: new Date().toLocaleString(),
    title,
    summaryCardsHtml,
    bodyStyle,
    cardStyle,
    headerStyle,
    summaryStatStyle,
    bodyInnerStyle,
    paragraphStyle,
    summaryExactWordStyle,
    repMetaStyle,
    repDistinguishStyle,
    yuanwenWordStyle,
    fontSize
  })

  // 触发浏览器下载
  const blob = new Blob(['﻿', exportContent], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `归纳_${new Date().getTime()}.doc`
  link.click()
  URL.revokeObjectURL(url)

  if (typeof addHistory === 'function') addHistory('导出结果', '导出了汇总要点综合内容为样式化DOC文件')
  if (typeof showAlert === 'function') showAlert('结果导出成功！')
  return true
}
