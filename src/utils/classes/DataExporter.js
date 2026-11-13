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

import {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, VerticalAlign, TableLayoutType,
  TableOfContents, Bookmark, HeadingLevel, PageBreak //  新增 PageBreak
} from 'docx'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'

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
   * 复制页面汇总列表，并把页面计算样式带到导出的 HTML 节点上。
   */
  static cloneRenderedSummaryList(rootEl) {
    if (!rootEl || !window.getComputedStyle) return ''
    const sourceList = rootEl.querySelector('.summary-list')
    if (!sourceList || !sourceList.innerHTML.trim()) return ''

    const clone = sourceList.cloneNode(true)
    const sourceElements = Array.from(sourceList.querySelectorAll('*'))
    const clonedElements = Array.from(clone.querySelectorAll('*'))
    const styleKeys = [
      'font-family', 'font-size', 'font-weight', 'font-style', 'color',
      'background-color', 'line-height', 'letter-spacing', 'text-align',
      'text-indent', 'white-space', 'margin-top', 'margin-right',
      'margin-bottom', 'margin-left', 'padding-top', 'padding-right',
      'padding-bottom', 'padding-left', 'border-top', 'border-right',
      'border-bottom', 'border-left', 'border-radius'
    ]

    clonedElements.forEach((element, index) => {
      const computed = window.getComputedStyle(sourceElements[index])
      const styles = styleKeys.map(key => {
        const value = computed.getPropertyValue(key)
        return value && value !== 'normal' ? `${key}:${value}` : ''
      }).filter(Boolean)
      if (styles.length) element.style.cssText = `${element.style.cssText}${styles.join(';')};`
    })

    return clone.outerHTML
      .replace(/&amp;(?:nbsp|ensp|emsp);/gi, '&$1;')
      .replace(/&(?:emsp);/gi, '\u3000\u3000')
      .replace(/&(?:ensp);/gi, '\u2002')
      .replace(/&(?:nbsp);|\u00a0/gi, ' ')
      .replace(/&amp;nbsp;/gi, ' ')
      .replace(/<br\s*\/?>[ \t]*(?:\u3000\u3000|&(?:nbsp|ensp|emsp);)*[ \t]*/gi, '<br/>')
  }

  /**
   * 从页面指定元素读取计算样式，按 CSS 文本拼接返回
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
   */
  static buildSummaryCardsHtml({
    rootEl, hasSummaryList, zhaiyaoData, summaryContent,
    isDuplicateBigtitle, convertToChineseNumeral, formatSummaryCountText, formatSummaryParagraph
  }) {
    const renderedSummaryList = this.cloneRenderedSummaryList(rootEl)
    if (renderedSummaryList) {
      return renderedSummaryList
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
        const pian = item && item.pian ? String(item.pian).trim() : ''
        const yuyi = item && item.yuyi ? String(item.yuyi) : ''
        const yuyiTrimmed = yuyi.trim()
        const isOtherYuyi = yuyiTrimmed === '其他'
        const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
        let showPian = !!pian
        for (let previousIndex = 0; previousIndex < idx && showPian; previousIndex++) {
          if (String((zhaiyaoData[previousIndex] && zhaiyaoData[previousIndex].pian) || '').trim() === pian) showPian = false
        }
        const themeTitle = `${showPian ? `<div class="summary-card-header">${esc(pian)}</div>` : ''}<div class="summary-card-header">${esc(isOtherYuyi ? '其他' : yuyi)}</div>`
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
   */
  static buildExportHtml({
    exportTime, title, summaryCardsHtml, bodyStyle, cardStyle, headerStyle,
    summaryStatStyle, bodyInnerStyle, paragraphStyle, summaryExactWordStyle,
    yuanwenWordStyle, repMetaStyle, repDistinguishStyle
  }) {
    const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    const exportTitle = String(title || '').trim()
    const titleHtml = exportTitle ? `<div class="export-title">${esc(exportTitle)}</div>` : ''
    const normalizedCardsHtml = String(summaryCardsHtml || '')
      .replace(/&amp;(emsp|ensp|nbsp);/gi, '&$1;')
      .replace(/&amp;#(39|x27);/gi, '&#$1;')
      .replace(/&(?:emsp);/gi, '\u3000\u3000')
      .replace(/&(?:ensp);/gi, '\u2002')
      .replace(/&(?:nbsp);/gi, ' ')
      .replace(/<br\s*\/?>\s*(?:\u3000\u3000|&(?:emsp|ensp|nbsp);)*/gi, '<br/>')
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>归纳</title>
  <style>
    body { margin: 20px; ${bodyStyle} }
    .summary-list { border: 0 !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; }
    .export-title { margin-bottom: 6px; }
    .summary-card { ${cardStyle} }
    .summary-card-header { ${headerStyle} }
    .summary-card-stat { ${summaryStatStyle} }
    .summary-card-body { ${bodyInnerStyle} }
    .summary-paragraph { ${paragraphStyle} }
    .summary-exact-word { ${summaryExactWordStyle} }
    .summary-yuanwen-word { ${yuanwenWordStyle} }
    .summary-rep-meta { ${repMetaStyle} }
    .summary-rep-distinguish { ${repDistinguishStyle} }
  </style>
</head>
<body>
  ${titleHtml}
  ${normalizedCardsHtml}
</body>
</html>`
  }

  /**
   * 导出汇总要点为 DOC 文件
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
      ['background-color', 'color', 'font-weight', 'font-size', 'font-family', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-radius'],
      'color:red;font-weight:500;')
    const yuanwenWordStyle = this.getStyleText(rootEl, '.summary-yuanwen-word',
      ['color', 'font-style', 'font-weight', 'font-size'],
      'color:blue;font-style:normal;font-size:16px;')
    const repMetaStyle = this.getStyleText(rootEl, '.summary-rep-meta', ['color', 'font-weight', 'font-size', 'font-family'], 'color:#c9190b;')
    const repDistinguishStyle = this.getStyleText(rootEl, '.summary-rep-distinguish', ['color', 'font-weight', 'font-size', 'font-family'], 'color:green;')

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
   * 导出数据为 CSV 文件
   */
  static exportCsv(data, fileName, headers, rowMapper) {
    const rows = Array.isArray(data) ? data : []
    const esc = v => {
      const text = String(v == null ? '' : v)
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
   * 导出 Excel
   */
  static async exportExcel(data, fileName, headers, rowMapper, options = {}) {
    const rows = Array.isArray(data) ? data : []
    const headerList = Array.isArray(headers) ? headers : []
    const widths = Array.isArray(options.widths) ? options.widths : []
    const alignments = Array.isArray(options.alignments) ? options.alignments : []
    const mappedRows = rows.map(row => {
      const values = typeof rowMapper === 'function' ? rowMapper(row) : []
      return Array.isArray(values) ? values : []
    })
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('输出列表')
    worksheet.addRow(headerList)
    mappedRows.forEach(values => {
      worksheet.addRow(headerList.map((header, columnIndex) => String(values[columnIndex] == null ? '' : values[columnIndex])))
    })
    worksheet.getRow(1).height = 22
    worksheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    })
    headerList.forEach((header, columnIndex) => {
      worksheet.getColumn(columnIndex + 1).width = Math.max(10, Math.round((Number(widths[columnIndex]) || 90) / 8))
    })
    for (let rowIndex = 2; rowIndex <= mappedRows.length + 1; rowIndex += 1) {
      const row = worksheet.getRow(rowIndex)
      headerList.forEach((header, columnIndex) => {
        const alignment = alignments[columnIndex] || 'center'
        const horizontalAlignment = String(header) === '标题' || alignment === 'left'
          ? 'left'
          : 'center'
        row.getCell(columnIndex + 1).alignment = {
          horizontal: horizontalAlignment,
          vertical: 'middle',
          wrapText: String(header) === '承办单位信息' || String(header) === '承办信息' || String(header) === '标题'
        }
        if (String(header) === '承办单位信息' || String(header) === '承办信息') {
          const text = String(row.getCell(columnIndex + 1).value == null ? '' : row.getCell(columnIndex + 1).value)
          const columnWidth = Number(widths[columnIndex]) || 90
          const estimatedLines = Math.max(1, Math.ceil(text.length / Math.max(4, columnWidth / 7)))
          row.height = Math.max(row.height || 22, Math.min(90, estimatedLines * 15 + 4))
        }
      })
    }
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${fileName || '导出'}_${new Date().getTime()}.xlsx`)
  }

  /**
   * 导出分析报告为 .docx
   */
  static async exportOverviewReport({ renderNodes, captureChartImage, addHistory, showAlert }) {
    if (!Array.isArray(renderNodes) || !renderNodes.length) {
      if (typeof showAlert === 'function') showAlert('暂无分析报告数据可导出')
      return
    }

    const chartCount = renderNodes.filter(n => n && n.type === 'chart').length
    const maxContentWidthPx = 560
    const maxContentHeightPx = 400

    // ── 第一步：并行捕获所有图表截图 ──
    const chartResults = new Map()
    if (typeof captureChartImage === 'function' && chartCount > 0) {
      const tasks = renderNodes
        .map((node, idx) => (node && node.type === 'chart') ? { idx, task: captureChartImage(idx).catch(() => null) } : null)
        .filter(Boolean)
      const results = await Promise.all(tasks.map(t => t.task))
      tasks.forEach((t, i) => { chartResults.set(t.idx, results[i]) })
    }

    // ── 第二步：构建 docx 文档 ──
    const children = []
    //  1. 插入目录
    children.push(
      new TableOfContents('目录', {
        hyperlink: true,
        headingStyleRange: '1-3'
      }),
      // 2. 插入分页符（确保目录独占一页）
      new Paragraph({
        children: [new PageBreak()]
      })
    )

    for (let idx = 0; idx < renderNodes.length; idx++) {
      const node = renderNodes[idx]
      if (!node) continue

      switch (node.type) {
        case 'heading':
        case 'text': {
          const bookmarkId = `heading_${idx}`
          children.push(this.buildHeadingParagraph(node.name, node.level, bookmarkId))
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
            const sourceWidth = Math.max(1, Number(chartData.width) || maxContentWidthPx)
            const sourceHeight = Math.max(1, Number(chartData.height) || 320)
            const scale = Math.min(
              maxContentWidthPx / sourceWidth,
              maxContentHeightPx / sourceHeight,
              1
            )
            const width = Math.max(260, Math.round(sourceWidth * scale))
            const height = Math.max(160, Math.round(sourceHeight * scale))

            children.push(new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
              keepLines: true,
              keepNext: false,
              cantSplit: true,
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
      //  3. 覆盖目录的默认样式（不加粗、仿宋、黑色）
      styles: {
        paragraphStyles: [
          {
            id: 'TOC1',
            name: 'toc 1',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { font: '仿宋', size: 24, bold: false, color: '000000' },
            paragraph: { spacing: { after: 120 } }
          },
          {
            id: 'TOC2',
            name: 'toc 2',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { font: '仿宋', size: 22, bold: false, color: '000000' },
            paragraph: { spacing: { after: 120 }, indent: { left: 480 } }
          },
          {
            id: 'TOC3',
            name: 'toc 3',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { font: '仿宋', size: 22, bold: false, color: '000000' },
            paragraph: { spacing: { after: 120 }, indent: { left: 960 } }
          }
        ]
      },
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
      if (typeof showAlert === 'function') {
        setTimeout(() => {
          showAlert('导出成功！请在 Word 中右键点击目录并选择“更新域”，即可生成页码并支持点击跳转。')
        }, 500)
      }
    } catch (e) {
      if (typeof showAlert === 'function') showAlert('导出失败：' + e.message)
    }
  }

  /**
   * 将图表捕获结果统一转换为 Uint8Array
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

  static getImageMimeFromDataUrl(dataUrl) {
    const src = String(dataUrl || '')
    const match = src.match(/^data:([^;,]+)[;,]/i)
    return match && match[1] ? match[1].toLowerCase() : ''
  }

  static normalizeDocxImageType(mime) {
    const value = String(mime || '').toLowerCase()
    if (value.indexOf('jpeg') > -1 || value.indexOf('jpg') > -1) return 'jpg'
    if (value.indexOf('gif') > -1) return 'gif'
    if (value.indexOf('bmp') > -1) return 'bmp'
    return 'png'
  }

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

  static _escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

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
   * 构建标题段落（带书签跳转和层级，并强制覆盖字体颜色）
   */
  static buildHeadingParagraph(text, level, id) {
    const levelStyle = level === 1
      ? { size: 32, before: 400 }
      : level >= 3
        ? { size: 22, before: 200 }
        : { size: 26, before: 240 }
    let headingLevel = HeadingLevel.HEADING_2
    if (level === 1) headingLevel = HeadingLevel.HEADING_1
    if (level >= 3) headingLevel = HeadingLevel.HEADING_3

    return new Paragraph({
      heading: headingLevel, // 保留 heading 属性，以便生成目录
      spacing: { before: levelStyle.before, after: 160 },
      children: [
        new Bookmark({
          id: id || `heading_${Math.random().toString(36).substr(2, 9)}`,
          children: [
            new TextRun({
              text: this.sanitizeDocxText(text || ''),
              bold: true, // 标题原本就是加粗
              color: '000000', // 强制黑色，防止被 Heading 默认样式变蓝
              size: levelStyle.size,
              font: '仿宋' // 强制仿宋
            })
          ]
        })
      ]
    })
  }

  static parseHtmlToTextRuns(html, size = 22, font = '仿宋') {
    const source = String(html || '')
    const runs = []
    const regex = /<strong>([\s\S]*?)<\/strong>|<span\s+class=["']([^"']+)["']>([\s\S]*?)<\/span>|<br\s*\/?>|([^<]+)/g
    let match
    while ((match = regex.exec(source)) !== null) {
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
      } else if (match[2] && match[3]) {
        const cls = match[2].trim()
        const innerHtml = match[3]
        const color = STYLE_COLOR_MAP[cls] || undefined
        const innerRegex = /<strong>([\s\S]*?)<\/strong>|<br\s*\/?>|([^<]+)/g
        let innerMatch
        while ((innerMatch = innerRegex.exec(innerHtml)) !== null) {
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
          } else if (innerMatch[0] === '<br>' || innerMatch[0] === '<br/>' || innerMatch[0] === '<br />') {
            runs.push(new TextRun({ break: 1 }))
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
      } else if (match[0] === '<br>' || match[0] === '<br/>' || match[0] === '<br />') {
        runs.push(new TextRun({ break: 1 }))
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

  static buildBodyParagraph(html) {
    const runs = this.parseHtmlToTextRuns(html)
    return new Paragraph({
      spacing: { after: 120 },
      indent: { firstLine: 480 },
      children: runs
    })
  }

  static getCountTableFixedWidth(col) {
    const key = String(col && col.key ? col.key : '').trim()
    const label = String(col && col.label ? col.label : '').trim()
    return COUNT_TABLE_KEY_WIDTH_MAP[key] || COUNT_TABLE_LABEL_WIDTH_MAP[label] || 100
  }

  static resolveCountTableWeights(node, columns) {
    const cols = Array.isArray(columns) ? columns : []
    if (!cols.length) return []

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

  static buildDocxTable(node) {
    const columns = Array.isArray(node.columns) ? node.columns : []
    const rows = Array.isArray(node.rows) ? node.rows : []
    if (!columns.length) return new Paragraph({ children: [new TextRun('')] })

    const borderOpts = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' }
    const cellMargins = { top: 40, bottom: 40, left: 60, right: 60 }

    const totalWidth = 9026
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

    const headerCells = []
    const allLabels = ['序号'].concat(columns.map(col => col && col.label ? col.label : ''))
    allLabels.forEach((label, ci) => {
      headerCells.push(makeCell(label, { bold: true, width: colWidths[ci], shading: 'F0F0F0', fontSize: 21 }))
    })

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
