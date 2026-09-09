/**
 * CitationExport - 引文详情导出模块
 *
 * 将左侧引文面板的树形结构数据导出为样式化 DOC 文件。
 * 引文数据格式与分析报告一致，包含层级标题、keypoints 汇总要点和 original_text 原文条目。
 *
 * @module citationExport
 */

/**
 * HTML 转义
 */
function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 递归遍历引文树，生成扁平化的导出节点数组
 * @param {Array} nodes - 引文树节点数组
 * @param {number} level - 当前层级（从 1 开始）
 * @returns {Array} 扁平节点数组 [{ type, level, name, html, items }]
 */
function flattenCitationTree(nodes, level) {
  if (!Array.isArray(nodes)) return []
  const result = []

  nodes.forEach(function (node) {
    if (!node || typeof node !== 'object') return
    var name = String(node.name || '').trim()
    if (!name) return

    var children = Array.isArray(node.children) ? node.children : []
    var contentList = Array.isArray(node.content) ? node.content : []
    var hasChildren = children.length > 0

    // 统计后缀（与分析报告渲染一致）
    var count = node.count && typeof node.count === 'object' ? node.count : null
    var suffix = (count && count.total !== undefined && count.total !== null && String(count.total).trim() !== '')
      ? '【' + count.total + '条建议】' : ''
    var displayName = suffix ? name + suffix : name

    result.push({
      type: hasChildren ? 'heading' : 'text',
      level: level,
      name: displayName
    })

    // 处理 content 中的 keypoints 和 original_text
    contentList.forEach(function (item) {
      if (item && typeof item === 'object' && item.keypoints) {
        // ）与。之间的文字加粗（与页面渲染一致）
        var kp = String(item.keypoints || '').replace(/\n/g, '<br/>')
        var _cpIdx = kp.indexOf('）')
        var _dotIdx = kp.indexOf('。', _cpIdx + 1)
        if (_cpIdx !== -1 && _dotIdx !== -1) {
          kp = kp.slice(0, _cpIdx + 1) + '<strong>' + kp.slice(_cpIdx + 1, _dotIdx) + '</strong>' + kp.slice(_dotIdx)
        }
        // tally 中（与，之间的文字加粗
        var tallyHtml = ''
        if (item.tally) {
          var _t = String(item.tally).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          var _openIdx = _t.indexOf('（')
          var _commaIdx = _t.indexOf('，', _openIdx + 1)
          if (_openIdx !== -1 && _commaIdx !== -1 && _commaIdx > _openIdx) {
            tallyHtml = '<span class="rep-distinguish">' +
              _t.slice(0, _openIdx + 1) +
              '<strong>' + _t.slice(_openIdx + 1, _commaIdx) + '</strong>' +
              _t.slice(_commaIdx) + '</span>'
          } else {
            tallyHtml = '<span class="rep-distinguish">' + _t + '</span>'
          }
        }
        result.push({
          type: 'content',
          html: kp + tallyHtml,
          keyId: item.keyId || '',
          items: Array.isArray(item.original_text) ? item.original_text : null
        })
      }
    })

    // 递归子节点
    if (hasChildren) {
      result.push.apply(result, flattenCitationTree(children, level + 1))
    }
  })

  return result
}

/**
 * 只渲染 isyinwen === true 的节点
 */
function extractCitationData(rawData) {
  if (!Array.isArray(rawData)) return []
  return rawData.filter(function (item) { return item.isyinwen === true })
}

/**
 * 构建引文导出 HTML
 * @param {Array} citationData - 父组件传入的原始引文树数据
 * @returns {string} 完整的 HTML 文档字符串
 */
export function buildCitationExportHtml(citationData) {
  var yinwenData = extractCitationData(citationData)
  if (!yinwenData.length) return ''

  var nodes = flattenCitationTree(yinwenData, 1)
  if (!nodes.length) return ''

  var bodyParts = []

  nodes.forEach(function (node) {
    if (node.type === 'heading') {
      var tag = node.level <= 1 ? 'h1' : (node.level >= 3 ? 'h3' : 'h2')
      bodyParts.push('<' + tag + '>' + esc(node.name) + '</' + tag + '>')
    } else if (node.type === 'text') {
      bodyParts.push('<p class="section-text">' + esc(node.name) + '</p>')
    } else if (node.type === 'content') {
      bodyParts.push('<div class="keypoints">' + node.html + '</div>')
      if (Array.isArray(node.items) && node.items.length) {
        node.items.forEach(function (ot) {
          var title = ot.title || ''
          var cbxx = ot.cbxx || ''
          var id = ot.id || ''
          var session = ot.session || ''
          var delegation = ot.delegation || ''
          var representative = ot.representative || ''
          bodyParts.push(
            '<div class="original-item">' +
              '<div class="original-content">' + esc(ot.content || '') + '</div>' +
              '<div class="original-meta">' +
                '<span class="rep-meta">（</span>' +
                '<span class="rep-distinguish">标题：' + esc(title) + '，' + esc(cbxx) + '，第' + esc(id) + '号，届次' + esc(session) + '，</span>' +
                '<span class="rep-meta">' + esc(delegation) + '团' + esc(representative) + '代表）</span>' +
              '</div>' +
            '</div>'
          )
        })
      }
    }
  })

  var exportTime = new Date().toLocaleString()

  return '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8" />\n  <title>引文详情</title>\n  <style>\n' +
    '    body { margin: 20px; font-family:"FangSong","FangSong_GB2312","仿宋",serif !important; }\n' +
    '    .export-title { font-size: 28px; font-weight: 700; margin-bottom: 6px; }\n' +
    '    .export-time { color: black; font-size: 22px; margin-bottom: 16px; }\n' +
    '    h1 { font-size: 22px; font-weight: 700; color: #222; margin: 16px 0 10px; }\n' +
    '    h2 { font-size: 18px; font-weight: 700; color: #222; margin: 12px 0 8px; padding-left: 10px; border-left: 3px solid #c9190b; }\n' +
'    h3 { font-size: 15px; font-weight: bold; color: #555; margin: 10px 0 6px; padding-left: 14px; }\n' +
    '    .section-text { font-size: 15px; color: #444; margin: 10px 0 6px; padding-left: 14px; }\n' +
    '    .keypoints { font-size: 15px; line-height: 1.9; color: #444; padding-left: 14px; }\n' +
    '    .original-item { margin: 8px 0; padding: 10px 12px; background: #f8f9fb; border-left: 3px solid #c9190b; border-radius: 4px; }\n' +
    '    .original-content { font-size: 14px; line-height: 1.7; color: #333; white-space: pre-wrap; word-break: break-word; margin-bottom: 6px; }\n' +
    '    .original-meta { font-size: 12px; color: #666; line-height: 1.5; }\n' +
    '    .rep-meta { color: #c9190b; }\n' +
    '    .rep-distinguish { color: green; }\n' +
    '  </style>\n</head>\n<body>\n' +
    '  <div class="export-title">引文详情</div>\n' +
    '  <div class="export-time">导出时间：' + esc(exportTime) + '</div>\n' +
    bodyParts.join('\n') +
    '\n</body>\n</html>'
}

/**
 * 导出引文详情为 DOC 文件
 * @param {Array} citationData - 原始引文树数据
 * @param {Function} addHistory - 操作历史回调
 * @param {Function} showAlert - 提示回调
 * @returns {boolean} 是否成功触发导出
 */
export function exportCitationDoc(citationData, addHistory, showAlert) {
  var html = buildCitationExportHtml(citationData)
  if (!html) {
    if (typeof showAlert === 'function') showAlert('暂无引文数据可导出')
    return false
  }

  var blob = new Blob(['﻿', html], { type: 'application/msword;charset=utf-8' })
  var url = URL.createObjectURL(blob)
  var link = document.createElement('a')
  link.href = url
  link.download = '引文详情_' + new Date().getTime() + '.doc'
  link.click()
  URL.revokeObjectURL(url)

  if (typeof addHistory === 'function') addHistory('导出引文详情', '导出了引文树数据为DOC文件')
  if (typeof showAlert === 'function') showAlert('引文详情导出成功！')
  return true
}
