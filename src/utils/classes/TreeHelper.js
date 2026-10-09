/**
 * TreeHelper - 树形数据结构操作工具类
 *
 * 功能：列表转树、树节点遍历、层叠转换、扁平化
 * 统一管理项目中的树结构操作逻辑
 *
 * @module TreeHelper
 * @example
 *   import TreeHelper from '@/utils/classes/TreeHelper'
 *   const tree = TreeHelper.listToTree(list, 'name', 'id', 'pid')
 *   const names = TreeHelper.collectNodeNames(tree)
 */

class TreeHelper {
  /**
   * 扁平列表转换为树形结构
   * @param {Array} list - 扁平数据列表
   * @param {string} nameField - 名称字段名（默认 'name'）
   * @param {string} idField - ID 字段名（默认 'id'）
   * @param {string} parentField - 父级 ID 字段名（默认 'pid'）
   * @returns {Array} 树形结构数组
   */
  static listToTree(list, nameField = 'name', idField = 'id', parentField = 'pid') {
    const treeList = []
    const dataMap = {}
    if (!list || !list.length) return []

    list.forEach(item => {
      item.children = []
      item.appSysName = item[nameField]
      item.appSysId = item[idField]
      dataMap[item[idField]] = item
    })

    list.forEach(item => {
      if (!dataMap[item[parentField]]) {
        treeList.push(item)
      } else {
        dataMap[item[parentField]].children.push(item)
      }
    })
    return treeList
  }

  /**
   * 递归收集树节点中所有 name 字段值
   * @param {Array} nodes - 树节点数组
   * @returns {string[]} 所有节点的 name 值列表
   */
  static collectNodeNames(nodes) {
    const result = []
    const walk = items => {
      if (!Array.isArray(items)) return
      items.forEach(item => {
        const nodeName = String(item && item.name ? item.name : '').trim()
        if (nodeName) result.push(nodeName)
        walk(item && item.children)
      })
    }
    walk(nodes)
    return result
  }

  /**
   * 从节点数组中提取所有具有 name 的子节点名称
   * @param {Array} children - 子节点数组
   * @returns {string[]} 子节点名称列表
   */
  static collectChildNames(children) {
    const result = []
    const walk = items => {
      if (!Array.isArray(items)) return
      items.forEach(item => {
        const nodeName = String(item && item.name ? item.name : '').trim()
        if (nodeName) result.push(nodeName)
        walk(item && item.children)
      })
    }
    walk(children)
    return result
  }

  /**
   * 递归收集树的叶子节点名称（无 children 的节点）
   * 用于「分类模板 → 检索关键词」这类只需要最末级分类的场景
   * @param {Array} nodes - 树节点数组
   * @returns {string[]} 叶子节点的 name 值列表
   */
  static collectLeafNames(nodes) {
    const result = []
    const walk = items => {
      if (!Array.isArray(items)) return
      items.forEach(item => {
        if (!item) return
        const children = Array.isArray(item.children) ? item.children : []
        if (children.length) {
          walk(children)
          return
        }
        const nodeName = String(item.name || '').trim()
        if (nodeName) result.push(nodeName)
      })
    }
    walk(nodes)
    return result
  }

  /**
   * 规范化树结构为两层（根 → 子节点），超出两层的子节点被截断
   * @param {Array} tree - 原始树结构
   * @returns {Array} 最大两层的规范化树
   */
  static normalizeToTwoLevels(tree) {
    const roots = Array.isArray(tree) ? tree : []
    return roots
      .map((root, rootIndex) => {
        const rootName = String(root && root.name ? root.name : '').trim()
        if (!rootName) return null
        const children = Array.isArray(root && root.children) ? root.children : []
        const normalizedChildren = children
          .map((child, childIndex) => {
            const childName = String(child && child.name ? child.name : '').trim()
            if (!childName) return null
            return { id: `${rootIndex + 1}-${childIndex + 1}`, name: childName, children: [] }
          })
          .filter(Boolean)
        return { id: String(rootIndex + 1), name: rootName, children: normalizedChildren }
      })
      .filter(Boolean)
  }

  /**
   * 将词数组转换为树结构（单层，无子节点）
   * @param {string[]} words - 词数组
   * @returns {Array} 树节点数组
   */
  static buildTreeFromWords(words) {
    return (Array.isArray(words) ? words : [])
      .map((word, index) => {
        const name = String(word || '').trim()
        if (!name) return null
        return { id: String(index + 1), name, children: [] }
      })
      .filter(Boolean)
  }

  /**
   * 将输入行数组转换为树结构（每行的 word 为根，value 为子节点）
   * @param {Array} inputs - 输入行 [{ word: string, value: string }]
   * @returns {Array} 双层树结构
   */
  static buildTreeFromInputs(inputs) {
    return (Array.isArray(inputs) ? inputs : [])
      .map((row, index) => {
        const rootName = String(row && row.word ? row.word : '').trim()
        if (!rootName) return null
        const childNames = String(row && row.value || '').split(/[，,]+/).map(v => v.trim()).filter(Boolean)
        return {
          id: String(index + 1),
          name: rootName,
          children: childNames.map((name, childIndex) => ({
            id: `${index + 1}-${childIndex + 1}`,
            name,
            children: []
          }))
        }
      })
      .filter(Boolean)
  }

  /**
   * 将树结构转换回输入行数组
   * @param {Array} tree - 树结构
   * @returns {Array} 输入行 [{ word, value }]
   */
  static treeToInputs(tree) {
    const roots = this.normalizeToTwoLevels(tree)
    return roots
      .map(root => {
        const rootName = String(root && root.name ? root.name : '').trim()
        if (!rootName) return null
        const values = (Array.isArray(root && root.children) ? root.children : [])
          .map(child => String(child && child.name ? child.name : '').trim())
          .filter(Boolean)
        return { word: rootName, value: values.join('，') }
      })
      .filter(Boolean)
  }

  /**
   * 展平树节点为顺序数组（用于页面顺序渲染）
   * @param {Array} nodes - 树节点
   * @param {Object} handlers - 回调 handler 集合
   * @param {number} level - 起始层级
   * @param {Array} result - 结果数组（递归用）
   * @returns {Array} 扁平化节点列表
   */
  static flattenTree(nodes, handlers, level = 1, result = [], parentPath = [], isYinwenContext = false) {
    const currentLevel = typeof level === 'number' ? level : 1
    const output = Array.isArray(result) ? result : []
    if (!Array.isArray(nodes)) return output

    const { normalizeContent, appendCountSuffix, buildCountTableNode, buildChartNode, toContentHtml } = handlers || {}

    nodes.forEach((node, nodeIndex) => {
      if (!node || typeof node !== 'object') return
      const currentPath = parentPath.concat(nodeIndex)
      const pathKey = currentPath.join('-')
      const name = String(node.name || '').trim()
      const isYinwen = level === 1 ? !!node.isyinwen : isYinwenContext

      const children = Array.isArray(node.children) ? node.children : []
      const contentList = typeof normalizeContent === 'function' ? normalizeContent(node.content) : []
      const count = node.count && typeof node.count === 'object' ? node.count : null
      const countTableNode = typeof buildCountTableNode === 'function' ? buildCountTableNode(count, currentLevel) : null
      const otherDataList = Array.isArray(node.otherData) ? node.otherData : []
      const hasName = !!name
      const hasChildren = children.length > 0
      const hasOtherData = otherDataList.length > 0
      const hasContent = contentList.length > 0

      // 无名称但有 otherData/content 时不跳过；有 keyId（可编辑节点）也不跳过，保留空结构
      if (!hasName && !hasOtherData && !hasContent && !node.keyId) return

      /** 构建 content 节点，若含引文数据则附带 citationData 与 keyId */
      const pushContentNode = (contentItem, contentIndex) => {
        const html = typeof toContentHtml === 'function' ? toContentHtml(contentItem) : String(contentItem || '')
        const isKeypoints = contentItem && typeof contentItem === 'object' && contentItem._type === 'keypoints'
        // 非引文节点移除 toContentHtml 可能添加的加粗标签
        const finalHtml = !isYinwen && isKeypoints ? html.replace(/<\/?strong>/g, '') : html
        const citationData = isKeypoints ? contentItem.originalText : null
        const keyId = isKeypoints ? String(contentItem.keyId || '').trim() : ''
        const canEdit = isKeypoints && !!keyId

        // 拆分加粗前缀（）之前）、加粗文本（）与。之间）、剩余文本（。之后）
        let boldPrefix = ''
        let boldText = ''
        let restSentence = ''
        if (isKeypoints && isYinwen) {
          const rawText = String(contentItem.text || '')
          const closeParenIdx = rawText.indexOf('）')
          const dotIdx = rawText.indexOf('。', closeParenIdx + 1)
          if (closeParenIdx !== -1 && dotIdx !== -1) {
            boldPrefix = rawText.slice(0, closeParenIdx + 1)
            boldText = rawText.slice(closeParenIdx + 1, dotIdx)
            restSentence = rawText.slice(dotIdx)
          } else {
            restSentence = rawText
          }
        } else if (isKeypoints) {
          restSentence = String(contentItem.text || '')
        }

        // tally 中拆分（前缀 + 加粗文本 + 剩余）
        let tallyBefore = ''
        let tallyBold = ''
        let tallyAfter = ''
        if (isKeypoints && contentItem.tally) {
          if (isYinwen) {
            const rawTally = String(contentItem.tally || '')
            const openIdx = rawTally.indexOf('（')
            const commaIdx = rawTally.indexOf('，', openIdx + 1)
            if (openIdx !== -1 && commaIdx !== -1 && commaIdx > openIdx) {
              tallyBefore = rawTally.slice(0, openIdx + 1)
              tallyBold = rawTally.slice(openIdx + 1, commaIdx)
              tallyAfter = rawTally.slice(commaIdx)
            } else {
              tallyAfter = rawTally
            }
          } else {
            tallyAfter = String(contentItem.tally || '')
          }
        }
        output.push({
          type: 'content',
          level: currentLevel,
          html: finalHtml,
          text: isKeypoints ? String(contentItem.text || '') : '',
          boldPrefix: boldPrefix,
          boldText: boldText,
          restSentence: restSentence,
          tally: isKeypoints ? String(contentItem.tally || '') : '',
          tallyBefore: tallyBefore,
          tallyBold: tallyBold,
          tallyAfter: tallyAfter,
          keyId: keyId,
          citationData: citationData && citationData.length > 0 ? citationData : null,
          editableMeta: {
            field: canEdit ? 'keypoints' : '',
            keyId: keyId,
            path: currentPath,
            pathKey: pathKey,
            contentIndex: typeof contentIndex === 'number' ? contentIndex : -1
          }
        })
      }

      if (hasChildren) {
        const nodeKeyId = String(node.keyId || '').trim()
        if (hasName || nodeKeyId) {
          output.push({
            type: 'heading',
            level: currentLevel >= 3 ? 3 : (currentLevel > 1 ? 2 : 1),
            name: typeof appendCountSuffix === 'function' && (!isYinwen || currentLevel <= 1) ? appendCountSuffix(name, count) : name,
            keyId: nodeKeyId,
            editableMeta: {
              field: nodeKeyId ? 'name' : '',
              keyId: nodeKeyId,
              path: currentPath,
              pathKey: pathKey,
              contentIndex: -1
            }
          })
        }
        contentList.forEach((contentItem, contentIndex) => pushContentNode(contentItem, contentIndex))
        otherDataList.forEach((otherItem, chartIndex) => {
          const chartNode = typeof buildChartNode === 'function' ? buildChartNode(otherItem, currentLevel, name, chartIndex) : null
          if (chartNode) output.push(chartNode)
        })
        this.flattenTree(children, handlers, currentLevel + 1, output, currentPath, isYinwen)
        return
      }

      const nodeKeyId = String(node.keyId || '').trim()
      if (hasName || nodeKeyId) {
        output.push({
          type: 'text',
          level: currentLevel,
          name: typeof appendCountSuffix === 'function' && (!isYinwen || currentLevel <= 1) ? appendCountSuffix(name, count) : name,
          keyId: nodeKeyId,
          editableMeta: {
            field: nodeKeyId ? 'name' : '',
            keyId: nodeKeyId,
            path: currentPath,
            pathKey: pathKey,
            contentIndex: -1
          }
        })
      }
      contentList.forEach((contentItem, contentIndex) => pushContentNode(contentItem, contentIndex))
      if (countTableNode) output.push(countTableNode)
      otherDataList.forEach((otherItem, chartIndex) => {
        const chartNode = typeof buildChartNode === 'function' ? buildChartNode(otherItem, currentLevel, name, chartIndex) : null
        if (chartNode) output.push(chartNode)
      })
    })
    return output
  }

  /**
   * 从接口返回值中提取分析报告树（兼容不同包裹层级）
   * @param {any} payload - 接口返回值
   * @returns {Array} 树节点数组
   */
  static extractTreeFromPayload(payload) {
    if (Array.isArray(payload)) return payload
    if (payload && Array.isArray(payload.data)) return payload.data
    if (payload && payload.data && Array.isArray(payload.data.data)) return payload.data.data
    if (payload && payload.result && Array.isArray(payload.result.data)) return payload.result.data
    return []
  }
}

export default TreeHelper
