/**
 * DataExporter - 数据导出工具类
 *
 * 功能：汇总要点 DOC 导出、分析报告导出、CSV 导出
 * 统一管理所有导出逻辑，支持样式提取、DOM 复用
 *
 * @module DataExporter
 * @example
 *   import DataExporter from '@/utils/classes/DataExporter'
 *   // 导出汇总要点 DOC
 *   DataExporter.exportSummaryDoc({ rootEl, zhaiyaoData, ... })
 *   // 导出代表 CSV
 *   DataExporter.exportCsv(data, '代表信息', ['标题', '届次'])
 */

import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, VerticalAlign, TableLayoutType } from 'docx'
import { saveAs } from 'file-saver'

// 彩色文本 class → Word 颜色映射
const STYLE_COLOR_MAP = {
  'summary-rep-meta': 'c9190b',
  'summary-rep-distinguish': '008000',
  'summary-exact-word': 'ff0000',
  'summary-yuanwen-word': '0000ff'
}

// 分析报告统计表固定列宽映射（与页面渲染逻辑保持一致）
const COUNT_TABLE_LABEL_WIDTH_MAP = {
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

const COUNT_TABLE_KEY_WIDTH_MAP = {
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

class DataExporter {
  /**
   * 从页面指定元素读取计算样式，按 CSS 文本拼接返回
   * @param {Element|null} rootEl - 根节点
   * @param {string} selector - CSS 选择器
   * @param {string[]} keys - 需要提取的样式属性名
   * @param {string} fallback - 兜底样式文本
   * @returns {string} CSS 样式片段
   */
  static getStyleText(rootEl, selector, keys, fallback = '') {
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
   * 构建汇总要点卡片 HTML（优先复用已渲染 DOM，避免导出与页面显示不一致）
   * @param {Object} options - 配置项
   * @returns {string} HTML 字符串
   */
  static buildSummaryCardsHtml({
    rootEl, hasSummaryList, zhaiyaoData, summaryContent,
    isDuplicateBigtitle, convertToChineseNumeral, formatSummaryCountText, formatSummaryParagraph
  }) {
    const renderedSummaryList = rootEl && rootEl.querySelector('.summary-list')
    if (renderedSummaryList && renderedSummaryList.innerHTML && renderedSummaryList.innerHTML.trim()) {
      return renderedSummaryList.innerHTML
    }
    if (hasSummaryList) {
      const hasUngrouped = arr => {
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
      return (zhaiyaoData || []).map((item, idx) => {
        const bigTitle = item && item.bigtitle ? String(item.bigtitle).trim() : ''
        const yuyi = item && item.yuyi ? String(item.yuyi) : ''
        const yuyiTrimmed = yuyi.trim()
        const isOtherYuyi = yuyiTrimmed === '其他'
        const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
        const themeTitle = bigTitle
          ? `${!isDuplicateBigtitle(zhaiyaoData, idx) ? `<div class="summary-card-header">${esc(bigTitle)}</div>` : ''}<div class="summary-card-header">${esc(yuyi)}</div>`
          : (isOtherYuyi ? '<div class="summary-card-header">其他</div>' : `<div class="summary-card-header">（${convertToChineseNumeral(idx + 1)}）${esc(yuyi)}</div>`)
        const summaryCountText = typeof formatSummaryCountText === 'function' ? formatSummaryCountText(item && item.arr ? item.arr : []) : ''
        const countHtml = summaryCountText ? `<div class="summary-card-stat">${esc(summaryCountText)}</div>` : ''
        const arr = item && item.arr ? item.arr : []
        const sections = Array.isArray(item && item.sections) ? item.sections : []
        let bodyHtml = ''
        if (sections.length > 0) {
          const ungroupedHtml = hasUngrouped(arr)
            ? `<div class="summary-paragraph">${formatSummaryParagraph(arr, sections, -1)}</div>`
            : ''
          const sectionHtml = sections.map(section =>
            `<div class="summary-section"><div class="summary-card-header">${esc(section)}</div><div class="summary-paragraph">${formatSummaryParagraph(arr, section)}</div></div>`
          ).join('')
          bodyHtml = `${ungroupedHtml}${sectionHtml}`
        } else {
          bodyHtml = `<div class="summary-paragraph">${formatSummaryParagraph(arr, null)}</div>`
        }
        return `<div class="summary-card">${themeTitle}${countHtml}<div class="summary-card-body">${bodyHtml}</div></div>`
      }).join('')
    }
    return `<div class="summary-card"><div class="summary-card-body"><div class="summary-paragraph">${String(summaryContent || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, '<br/>')}</div></div></div>`
  }

  /**
   * 组装导出用的完整 HTML 页面模板
   * @param {Object} options - 配置项
   * @returns {string} 完整的 HTML 文档字符串
   */
  static buildExportHtml({
    exportTime, title, summaryCardsHtml, bodyStyle, cardStyle, headerStyle,
    summaryStatStyle, bodyInnerStyle, paragraphStyle, summaryExactWordStyle,
    yuanwenWordStyle, repMetaStyle, repDistinguishStyle
  }) {
    const fontSize = '22px'
    const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    const exportTitle = String(title || '').trim() || '议案建议聚类与汇总要点综合结果'
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>归纳</title>
  <style>
    body { margin: 20px; ${bodyStyle} font-family:"FangSong","FangSong_GB2312","仿宋",serif !important; }
    .export-title { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
    .export-time { color: black; font-size: ${fontSize}; margin-bottom: 16px; }
    .summary-card { ${cardStyle} font-size: ${fontSize} !important; }
    .summary-card-header { ${headerStyle} font-size: ${fontSize} !important; }
    .summary-card-stat { ${summaryStatStyle} font-size: ${fontSize} !important; }
    .summary-card-body { ${bodyInnerStyle} font-size: ${fontSize} !important; }
    .summary-paragraph { ${paragraphStyle} font-size: ${fontSize} !important; font-family:"FangSong","FangSong_GB2312","仿宋",serif !important; }
    .summary-exact-word { ${summaryExactWordStyle} }
    .summary-yuanwen-word { color: blue; font-style: normal; font-size: 20px; scale: 0.8; }
    .summary-rep-meta { ${repMetaStyle} font-family:"KaiTi","KaiTi_GB2312","楷体",serif !important; }
    .summary-rep-distinguish { ${repDistinguishStyle} font-family:"KaiTi","KaiTi_GB2312","楷体",serif !important; }
  </style>
</head>
<body>
  <div class="export-title">${esc(exportTitle)}</div>
  <div class="export-time">导出时间：${esc(exportTime)}</div>
  ${summaryCardsHtml}
</body>
</html>`
  }

  /**
   * 导出汇总要点为 DOC 文件（完整流程：校验 → 构建 HTML → 提取样式 → 下载）
   * @param {Object} options - 配置项
   * @returns {boolean} 是否成功触发导出
   */
  static exportSummaryDoc({
    rootEl, zhaiyaoData, summaryContent, title,
    isDuplicateBigtitle, convertToChineseNumeral, formatSummaryCountText, formatSummaryParagraph,
    addHistory, showAlert
  }) {
    const hasSummaryList = Array.isArray(zhaiyaoData) && zhaiyaoData.length > 0
    const hasSummaryText = !!(summaryContent && String(summaryContent).trim())
    if (!hasSummaryList && !hasSummaryText) {
      if (typeof showAlert === 'function') showAlert('请先生成汇总要点综合内容！')
      return false
    }
    const summaryCardsHtml = this.buildSummaryCardsHtml({
      rootEl,
      hasSummaryList,
      zhaiyaoData,
      summaryContent,
      isDuplicateBigtitle,
      convertToChineseNumeral,
      formatSummaryCountText,
      formatSummaryParagraph
    })
    // 提取页面样式
    const bodyStyle = this.getStyleText(rootEl, '.summary-list',
      ['font-family', 'font-size', 'font-weight', 'color', 'line-height'],
      'font-family:"Microsoft YaHei","PingFang SC",sans-serif;color:#333;')
    const cardStyle = this.getStyleText(rootEl, '.summary-card',
      ['border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius', 'background-color', 'overflow', 'margin-bottom'],
      'border:1px solid #e8e8e8;border-radius:8px;background:#fff;overflow:hidden;margin-bottom:12px;')
    const headerStyle = this.getStyleText(rootEl, '.summary-card-header',
      ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'font-weight', 'font-size', 'font-family', 'color', 'line-height', 'border-bottom'],
      'padding:10px 12px;font-weight:700;color:#c9190b;border-bottom:1px solid #f0f0f0;')
    const bodyInnerStyle = this.getStyleText(rootEl, '.summary-card-body',
      ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'text-indent'],
      'padding:10px 12px;text-indent:2em;')
    const summaryStatStyle = this.getStyleText(rootEl, '.summary-card-stat',
      ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'color', 'font-size', 'line-height'],
      'padding:6px 12px 0;color:#666;font-size:14px;line-height:1.6;')
    const paragraphStyle = this.getStyleText(rootEl, '.summary-paragraph',
      ['font-family', 'font-size', 'font-weight', 'color', 'line-height', 'white-space'],
      'font-size:12px;color:#555;line-height:1.8;white-space:normal;')
    const summaryExactWordStyle = this.getStyleText(rootEl, '.summary-exact-word',
      ['background-color', 'color', 'font-weight', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-radius'],
      'color:red;font-weight:500;')
    const yuanwenWordStyle = this.getStyleText(rootEl, '.summary-yuanwen-word',
      ['color', 'font-style', 'font-weight', 'font-size'],
      'color:blue;font-style:normal;font-size:16px;')
    const repMetaStyle = this.getStyleText(rootEl, '.summary-rep-meta', ['color', 'font-weight'], 'color:#c9190b;')
    const repDistinguishStyle = this.getStyleText(rootEl, '.summary-rep-distinguish', ['color', 'font-weight'], 'color:green;')

    const exportContent = this.buildExportHtml({
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
      yuanwenWordStyle
    })

    // 通过 Blob 下载 .doc 文件
    const blob = new Blob(['\ufeff', exportContent], { type: 'application/msword;charset=utf-8' })
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

  /**
   * 导出数据为 CSV 文件（带 UTF-8 BOM，Excel 可直接打开不乱码）
   * @param {Array} data - 数据行数组
   * @param {string} fileName - 导出文件名（不含扩展名）
   * @param {string[]} headers - 表头列名
   * @param {Function} rowMapper - (row) => string[] 行映射函数
   */
  static exportCsv(data, fileName, headers, rowMapper) {
    const rows = Array.isArray(data) ? data : []
    const esc = v => {
      const text = String(v == null ? '' : v)
      // 含逗号/引号/换行时用双引号包裹，内部引号翻倍转义
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
    }
    const headerLine = (Array.isArray(headers) ? headers : []).map(esc).join(',')
    const bodyLines = rows.map(row => {
      const values = typeof rowMapper === 'function' ? rowMapper(row) : []
      return (Array.isArray(values) ? values : []).map(esc).join(',')
    })
    const csv = '\ufeff' + [headerLine].concat(bodyLines).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `${fileName || '导出'}_${new Date().getTime()}.csv`)
  }

  /**
   * 导出分析报告为 .docx
   * @param {Object} options
   * @param {Array} options.renderNodes - 分析报告渲染节点数组
   * @param {Function} options.captureChartImage - async (idx) => { imageDataUrl, width, height } 捕获图表
   * @param {Function} options.addHistory - 历史记录回调
   * @param {Function} options.showAlert - 提示回调
   * @returns {Promise<void>}
   */
  static async exportOverviewReport({ renderNodes, captureChartImage, addHistory, showAlert }) {
    if (!Array.isArray(renderNodes) || !renderNodes.length) {
      if (typeof showAlert === 'function') showAlert('暂无分析报告数据可导出')
      return
    }

    const chartCount = renderNodes.filter(n => n && n.type === 'chart').length
    const maxContentWidthPx = 620

    // ── 第一步：并行捕获所有图表截图（不再逐个 await，避免页面反复跳动） ──
    const chartResults = new Map()
    if (typeof captureChartImage === 'function' && chartCount > 0) {
      const tasks = renderNodes
        .map((node, idx) => (node && node.type === 'chart') ? { idx, task: captureChartImage(idx).catch(() => null) } : null)
        .filter(Boolean)
      const results = await Promise.all(tasks.map(t => t.task))
      tasks.forEach((t, i) => { chartResults.set(t.idx, results[i]) })
    }

    // ── 第二步：构建 docx 文档（同步构建，无需再 await） ──
    const children = []
    for (let idx = 0; idx < renderNodes.length; idx++) {
      const node = renderNodes[idx]
      if (!node) continue

      switch (node.type) {
        case 'heading':
        case 'text': {
          children.push(this.buildHeadingParagraph(node.name, node.level))
          break
        }
        case 'content': {
          children.push(this.buildBodyParagraph(node.html))
          break
        }
        case 'count-table': {
          children.push(this.buildDocxTable(node))
          break
        }
        case 'chart': {
          const chartData = chartResults.get(idx)
          const imagePayload = chartData ? this.normalizeChartImagePayload(chartData) : null
          const imageBuffer = imagePayload && imagePayload.buffer
          if (imageBuffer && imageBuffer.length > 100) {
            const sourceWidth = Number(chartData.width) || maxContentWidthPx
            const sourceHeight = Number(chartData.height) || 320
            const ratio = sourceWidth > 0 ? (sourceHeight / sourceWidth) : (320 / maxContentWidthPx)
            const width = Math.max(260, Math.min(maxContentWidthPx, Math.round(sourceWidth)))
            const height = Math.max(160, Math.round(width * ratio))

            children.push(new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
              children: [
                new ImageRun({
                  data: imageBuffer,
                  type: imagePayload.type,
                  transformation: { width, height }
                })
              ]
            }))
          } else {
            children.push(new Paragraph({
              spacing: { before: 180, after: 120 },
              children: [new TextRun({ text: this.sanitizeDocxText((node.name || '图表') + '（导出失败）'), bold: true, size: 22, font: '仿宋' })]
            }))
          }
          break
        }
      }
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
          }
        },
        children
      }]
    })

    try {
      const buffer = await Packer.toBuffer(doc)
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      saveAs(blob, `分析报告_${Date.now()}.docx`)
      if (typeof addHistory === 'function') addHistory('导出分析报告', `导出节点${renderNodes.length}条，图表${chartCount}个`)
      if (typeof showAlert === 'function') showAlert('分析报告已导出')
    } catch (e) {
      if (typeof showAlert === 'function') showAlert('导出失败：' + e.message)
    }
  }

  /**
   * 将图表捕获结果统一转换为 Uint8Array
   * @param {Object} chartData
   * @returns {Uint8Array|null}
   */
  static normalizeChartImagePayload(chartData) {
    if (!chartData || typeof chartData !== 'object') return null
    let type = 'png'
    if (typeof chartData.imageDataUrl === 'string') {
      const mime = this.getImageMimeFromDataUrl(chartData.imageDataUrl)
      type = this.normalizeDocxImageType(mime)
    }
    const raw = chartData.imageBuffer
    if (raw instanceof Uint8Array) {
      return { buffer: raw, type }
    }
    if (raw instanceof ArrayBuffer) {
      return { buffer: new Uint8Array(raw), type }
    }
    if (typeof chartData.imageDataUrl === 'string' && chartData.imageDataUrl.indexOf('data:image') === 0) {
      const buffer = this.dataUrlToUint8Array(chartData.imageDataUrl)
      if (buffer && buffer.length) {
        return {
          buffer,
          type: this.normalizeDocxImageType(this.getImageMimeFromDataUrl(chartData.imageDataUrl))
        }
      }
    }
    return null
  }

  /**
   * 从 dataUrl 提取 MIME
   * @param {string} dataUrl
   * @returns {string}
   */
  static getImageMimeFromDataUrl(dataUrl) {
    const src = String(dataUrl || '')
    const match = src.match(/^data:([^;,]+)[;,]/i)
    return match && match[1] ? match[1].toLowerCase() : ''
  }

  /**
   * 将 MIME 归一为 docx ImageRun 可识别类型
   * @param {string} mime
   * @returns {'png'|'jpg'|'gif'|'bmp'}
   */
  static normalizeDocxImageType(mime) {
    const value = String(mime || '').toLowerCase()
    if (value.indexOf('jpeg') > -1 || value.indexOf('jpg') > -1) return 'jpg'
    if (value.indexOf('gif') > -1) return 'gif'
    if (value.indexOf('bmp') > -1) return 'bmp'
    return 'png'
  }

  /**
   * dataURL 转 Uint8Array
   * @param {string} dataUrl
   * @returns {Uint8Array|null}
   */
  static dataUrlToUint8Array(dataUrl) {
    try {
      const parts = String(dataUrl || '').split(',')
      if (parts.length < 2) return null
      const bytes = atob(parts[1])
      return Uint8Array.from(bytes, ch => ch.charCodeAt(0))
    } catch (e) {
      return null
    }
  }

  /**
   * HTML 转义工具方法
   * @param {string} str
   * @returns {string}
   */
  static _escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  /**
   * 过滤 XML 不允许的控制字符，避免生成损坏的 docx
   * @param {string} text
   * @returns {string}
   */
  static sanitizeDocxText(text) {
    const source = String(text == null ? '' : text)
    let output = ''
    for (const ch of source) {
      const code = ch.codePointAt(0)
      const isAllowed = code === 9 || code === 10 || code === 13 ||
        (code >= 32 && code <= 55295) ||
        (code >= 57344 && code <= 65533) ||
        (code >= 65536 && code <= 1114111)
      if (isAllowed) output += ch
    }
    return output
  }

  /**
   * 按权重分配列宽，确保总和严格等于 totalWidth
   * @param {number[]} weights
   * @param {number} totalWidth
   * @param {number} minWidth
   * @returns {number[]}
   */
  static allocateColumnWidths(weights, totalWidth, minWidth) {
    const list = Array.isArray(weights) ? weights : []
    if (!list.length) return []
    const safeTotal = Math.max(1, Number(totalWidth) || 1)
    const dynamicMin = Math.max(120, Math.min(Number(minWidth) || 120, Math.floor(safeTotal / list.length)))
    const sumWeights = list.reduce((sum, v) => sum + Math.max(1, Number(v) || 1), 0)

    const widths = list.map(w => Math.floor(safeTotal * Math.max(1, Number(w) || 1) / sumWeights))
    let used = widths.reduce((sum, v) => sum + v, 0)
    let remain = safeTotal - used
    let cursor = 0
    while (remain > 0) {
      widths[cursor % widths.length] += 1
      remain--
      cursor++
    }

    for (let i = 0; i < widths.length; i++) {
      if (widths[i] < dynamicMin) widths[i] = dynamicMin
    }
    used = widths.reduce((sum, v) => sum + v, 0)
    if (used !== safeTotal) {
      let diff = used - safeTotal
      while (diff > 0) {
        let moved = false
        for (let i = 0; i < widths.length && diff > 0; i++) {
          if (widths[i] > dynamicMin) {
            widths[i] -= 1
            diff--
            moved = true
          }
        }
        if (!moved) break
      }
      if (diff > 0) {
        const extra = widths.reduce((sum, v) => sum + v, 0) - safeTotal
        widths[widths.length - 1] = Math.max(1, widths[widths.length - 1] - extra)
      }
    }
    return widths
  }

  /**
   * 按给定权重做固定比例列宽分配（不应用最小列宽二次改写）。
   * 适用于页面已确定列宽、导出需保持一致的场景。
   * @param {number[]} weights
   * @param {number} totalWidth
   * @returns {number[]}
   */
  static allocateFixedRatioWidths(weights, totalWidth) {
    const list = Array.isArray(weights) ? weights : []
    if (!list.length) return []
    const safe = list.map(v => Math.max(1, Number(v) || 1))
    const sum = safe.reduce((a, b) => a + b, 0)
    const total = Math.max(1, Number(totalWidth) || 1)
    const widths = safe.map(w => Math.floor(total * w / sum))
    let remain = total - widths.reduce((a, b) => a + b, 0)
    let i = 0
    while (remain > 0) {
      widths[i % widths.length] += 1
      remain--
      i++
    }
    return widths
  }

  /**
   * 表格构建失败时的兜底导出（纯文本段落）
   * @param {Object} node
   * @returns {Paragraph}
   */
  static buildCountTableFallbackParagraph(node) {
    const columns = Array.isArray(node && node.columns) ? node.columns : []
    const rows = Array.isArray(node && node.rows) ? node.rows : []
    const lines = []
    const header = ['序号'].concat(columns.map(col => this.sanitizeDocxText(col && col.label ? col.label : ''))).join(' | ')
    lines.push(header)
    rows.forEach((row, ri) => {
      const values = columns.map(col => {
        const value = row && col ? row[col.key] : ''
        const printable = value === null || value === undefined || String(value).trim() === '' ? '-' : String(value)
        return this.sanitizeDocxText(printable)
      })
      lines.push([String(ri + 1)].concat(values).join(' | '))
    })
    return new Paragraph({
      spacing: { after: 180 },
      children: [new TextRun({ text: lines.join('\n'), size: 20, font: '仿宋' })]
    })
  }

  /**
   * 构建标题段落（docx）
   * @param {string} text - 标题文字
   * @param {number} level - 1/2/3
   * @returns {Paragraph}
   */
  static buildHeadingParagraph(text, level) {
    const levelStyle = level === 1
      ? { size: 32, before: 400 }
      : level >= 3
        ? { size: 22, before: 200 }
        : { size: 26, before: 240 }
    return new Paragraph({
      spacing: { before: levelStyle.before, after: 160 },
      children: [
        new TextRun({
          text: this.sanitizeDocxText(text || ''),
          bold: true,
          size: levelStyle.size,
          font: '仿宋'
        })
      ]
    })
  }

  /**
   * 解析含样式 span 的 HTML，返回 TextRun 数组
   * @param {string} html - 原始 HTML
   * @param {number} size - 字号（half-point）
   * @param {string} font - 字体名
   * @returns {Array<TextRun>}
   */
  static parseHtmlToTextRuns(html, size = 22, font = '仿宋') {
    const source = String(html || '')
    const runs = []
    // 顺序：<strong>text</strong> → <span class="...">text</span> → <br> → 纯文本
    const regex = /<strong>([\s\S]*?)<\/strong>|<span\s+class=["']([^"']+)["']>([\s\S]*?)<\/span>|<br\s*\/?>|([^<]+)/g
    let match
    while ((match = regex.exec(source)) !== null) {
      // 1) <strong>…</strong>  → 加粗 TextRun
      if (typeof match[1] !== 'undefined') {
        let text = match[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
        if (!text) continue
        const lines = text.split('\n')
        lines.forEach((line, li) => {
          if (li > 0) runs.push(new TextRun({ break: 1 }))
          if (line) runs.push(new TextRun({ text: this.sanitizeDocxText(line), size, font, bold: true }))
        })
      // 2) <span class="…">…</span>  → 带颜色 TextRun（支持内部嵌套 <strong>）
      } else if (match[2] && match[3]) {
        const cls = match[2].trim()
        const innerHtml = match[3]
        const color = STYLE_COLOR_MAP[cls] || undefined
        // 内部分段：<strong>…</strong> / <br> / 纯文本
        const innerRegex = /<strong>([\s\S]*?)<\/strong>|<br\s*\/?>|([^<]+)/g
        let innerMatch
        while ((innerMatch = innerRegex.exec(innerHtml)) !== null) {
          // <strong>…</strong>
          if (typeof innerMatch[1] !== 'undefined') {
            let text = innerMatch[1]
              .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
            if (!text) continue
            const lines = text.split('\n')
            lines.forEach((line, li) => {
              if (li > 0) runs.push(new TextRun({ break: 1 }))
              if (line) runs.push(new TextRun({ text: this.sanitizeDocxText(line), size, font, color, bold: true }))
            })
          // <br>
          } else if (innerMatch[0] === '<br>' || innerMatch[0] === '<br/>' || innerMatch[0] === '<br />') {
            runs.push(new TextRun({ break: 1 }))
          // 纯文本（非加粗）
          } else if (innerMatch[2]) {
            let text = innerMatch[2]
              .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
            if (!text) continue
            const lines = text.split('\n')
            lines.forEach((line, li) => {
              if (li > 0) runs.push(new TextRun({ break: 1 }))
              if (line) runs.push(new TextRun({ text: this.sanitizeDocxText(line), size, font, color }))
            })
          }
        }
      // 3) <br>
      } else if (match[0] === '<br>' || match[0] === '<br/>' || match[0] === '<br />') {
        runs.push(new TextRun({ break: 1 }))
      // 4) 纯文本
      } else if (match[4]) {
        let text = match[4]
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
        if (!text) continue
        const lines = text.split('\n')
        lines.forEach((line, li) => {
          if (li > 0) runs.push(new TextRun({ break: 1 }))
          if (line) runs.push(new TextRun({ text: this.sanitizeDocxText(line), size, font }))
        })
      }
    }
    if (!runs.length) {
      runs.push(new TextRun({ text: this.sanitizeDocxText(String(html || '').replace(/<[^>]+>/g, '')), size, font }))
    }
    return runs
  }

  /**
   * 构建正文段落（docx），保留 <span> 样式的颜色
   * @param {string} html - 可能含 HTML 标签的文本
   * @returns {Paragraph}
   */
  static buildBodyParagraph(html) {
    const runs = this.parseHtmlToTextRuns(html)
    return new Paragraph({
      spacing: { after: 120 },
      indent: { firstLine: 480 },
      children: runs
    })
  }

  /**
   * 依据列 key/label 获取固定列宽
   * @param {Object} col
   * @returns {number}
   */
  static getCountTableFixedWidth(col) {
    const key = String(col && col.key ? col.key : '').trim()
    const label = String(col && col.label ? col.label : '').trim()
    return COUNT_TABLE_KEY_WIDTH_MAP[key] || COUNT_TABLE_LABEL_WIDTH_MAP[label] || 100
  }

  /**
   * 解析统计表格列宽权重：优先用节点给定权重；若明显为默认值(60 + 全100)，按 key/label 兜底重算。
   * @param {Object} node
   * @param {Array} columns
   * @returns {number[]}
   */
  static resolveCountTableWeights(node, columns) {
    const cols = Array.isArray(columns) ? columns : []
    if (!cols.length) return []

    // 与页面渲染保持一致的目标权重
    const mappedWeights = [COUNT_TABLE_LABEL_WIDTH_MAP['序号'] || 80].concat(
      cols.map(col => this.getCountTableFixedWidth(col))
    )

    const rawWeights = Array.isArray(node && node.colWidthWeights) ? node.colWidthWeights : []
    const expectedLen = cols.length + 1
    const hasValidRaw = rawWeights.length === expectedLen
    const isRawDefault100 = hasValidRaw && Number(rawWeights[0]) === 80 && rawWeights.slice(1).every(w => Number(w) === 100)
    if (hasValidRaw && !isRawDefault100) return rawWeights
    return mappedWeights
  }

  /**
   * 构建统计表格（docx Table），带表头背景色
   * @param {Object} node - 表格节点 { columns, rows }
   * @returns {Table}
   */
  static buildDocxTable(node) {
    const columns = Array.isArray(node.columns) ? node.columns : []
    const rows = Array.isArray(node.rows) ? node.rows : []
    if (!columns.length) return new Paragraph({ children: [new TextRun('')] })

    const borderOpts = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' }
    const cellMargins = { top: 40, bottom: 40, left: 60, right: 60 }

    // 计算列宽：若节点提供了 colWidthWeights，则按固定比例分配，保证与页面一致。
    const totalWidth = 9026 // A4 页面宽度(11906 twips) 减去左右边距(2*1440)
    const colWeights = this.resolveCountTableWeights(node, columns)
    const hasFixedWeights = Array.isArray(colWeights) && colWeights.length === columns.length + 1
    const fallbackWeights = [1].concat(columns.map(() => 2))
    const colWidths = hasFixedWeights
      ? this.allocateFixedRatioWidths(colWeights, totalWidth)
      : this.allocateColumnWidths(fallbackWeights, totalWidth, 480)

    const getTextLen = v => String(v == null ? '' : v).trim().length

    const isDenseColumn = colIndex => {
      const col = columns[colIndex]
      if (!col) return false
      return rows.some(row => getTextLen(row && row[col.key]) > 8)
    }

    const makeCell = (text, opts = {}) => {
      const { bold, align, width, shading, fontSize } = opts
      return new TableCell({
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER,
        width: width ? { size: width, type: WidthType.DXA } : undefined,
        shading: shading ? { fill: shading, type: 'clear' } : undefined,
        children: [
          new Paragraph({
            alignment: align || AlignmentType.CENTER,
            children: [new TextRun({ text: this.sanitizeDocxText(text || ''), bold: !!bold, size: fontSize || 20, font: '仿宋' })]
          })
        ]
      })
    }

    // 表头行（带灰色背景）
    const headerCells = []
    const allLabels = ['序号'].concat(columns.map(col => col && col.label ? col.label : ''))
    allLabels.forEach((label, ci) => {
      headerCells.push(makeCell(label, { bold: true, width: colWidths[ci], shading: 'F0F0F0', fontSize: 21 }))
    })

    // 数据行
    const dataRows = rows.map((row, ri) => {
      const cells = [makeCell(String(ri + 1), { width: colWidths[0] })]
      columns.forEach((col, colIndex) => {
        const val = row[col.key]
        const display = (val !== null && val !== undefined && String(val).trim() !== '') ? String(val) : '-'
        cells.push(makeCell(display, {
          width: colWidths[colIndex + 1],
          align: isDenseColumn(colIndex) ? AlignmentType.LEFT : AlignmentType.CENTER
        }))
      })
      return new TableRow({ children: cells })
    })

    return new Table({
      rows: [
        new TableRow({ tableHeader: true, children: headerCells }),
        ...dataRows
      ],
      // 使用固定 DXA 宽度 + 显式列网格，避免 Word 自动均分列宽。
      width: { size: totalWidth, type: WidthType.DXA },
      columnWidths: colWidths,
      layout: TableLayoutType.FIXED,
      borders: {
        top: borderOpts,
        bottom: borderOpts,
        left: borderOpts,
        right: borderOpts,
        insideHorizontal: borderOpts,
        insideVertical: borderOpts
      }
    })
  }

  /**
   * 构建分析报告统计表格 HTML（保留老版本兼容，不再被新导出流程使用）
   * @param {Object} node - 表格节点 { columns, rows }
   * @param {Function} escapeHtml - HTML 转义函数
   * @returns {string} HTML 表格字符串
   */
  static buildCountTableHtml(node, escapeHtml) {
    if (!node || node.type !== 'count-table') return ''
    const esc = typeof escapeHtml === 'function' ? escapeHtml : v => String(v || '')
    const columns = Array.isArray(node.columns) ? node.columns : []
    const rows = Array.isArray(node.rows) ? node.rows : []
    const headerHtml = ['<th style="border:1px solid #ccc;padding:4px 6px;background:#f5f5f5;white-space:nowrap;">序号</th>']
    columns.forEach(col => headerHtml.push(`<th style="border:1px solid #ccc;padding:4px 6px;background:#f5f5f5;white-space:nowrap;">${esc(col && col.label ? col.label : '')}</th>`))
    const bodyHtml = rows.map((row, rowIndex) => {
      const colsHtml = columns.map(col => {
        const value = row && col ? row[col.key] : ''
        const printable = value === null || value === undefined || value === '' ? '-' : value
        return `<td style="border:1px solid #ccc;padding:4px 6px;text-align:center;word-break:break-word;">${esc(printable)}</td>`
      }).join('')
      return `<tr><td style="border:1px solid #ccc;padding:4px 6px;text-align:center;">${rowIndex + 1}</td>${colsHtml}</tr>`
    }).join('')
    return `<div style="margin:8px 0 14px;">
      <table style="border-collapse:collapse;min-width:100%;word-break:break-word;font-size:13px;color:#333;">
        <thead><tr>${headerHtml.join('')}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>`
  }
}

export default DataExporter
