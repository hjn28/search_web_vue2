/**
 * EditableReportStore - 分析报告本地编辑状态管理
 *
 * 功能：
 * 1. 管理 name/keypoints 可编辑字段的唯一标识
 * 2. 将编辑结果回写到树结构
 * 3. 本地存储读取与保存
 */
class EditableReportStore {
  static canEditMeta(meta) {
    const info = meta && typeof meta === 'object' ? meta : {}
    const keyId = String(info.keyId || '').trim()
    const field = String(info.field || '').trim()
    return !!keyId && (field === 'name' || field === 'keypoints')
  }

  static normalizeEdits(edits) {
    const source = edits && typeof edits === 'object' ? edits : {}
    const result = {}
    Object.keys(source).forEach(keyId => {
      const id = String(keyId || '').trim()
      if (!id) return
      const value = source[keyId]
      if (!value || typeof value !== 'object') return
      const nextItem = {}
      if (Object.prototype.hasOwnProperty.call(value, 'name')) nextItem.name = String(value.name || '')
      if (Object.prototype.hasOwnProperty.call(value, 'keypoints')) nextItem.keypoints = String(value.keypoints || '')
      if (Object.keys(nextItem).length) result[id] = nextItem
    })
    return result
  }

  static getFieldValue(edits, keyId, field) {
    const normalized = this.normalizeEdits(edits)
    const id = String(keyId || '').trim()
    const name = String(field || '').trim()
    if (!id || !name) return undefined
    if (!normalized[id]) return undefined
    return normalized[id][name]
  }

  static setFieldValue(edits, keyId, field, value) {
    const nextEdits = this.normalizeEdits(edits)
    const id = String(keyId || '').trim()
    const name = String(field || '').trim()
    if (!id || (name !== 'name' && name !== 'keypoints')) return nextEdits
    if (!nextEdits[id]) nextEdits[id] = {}
    nextEdits[id][name] = String(value || '')
    return nextEdits
  }

  static cloneTree(data) {
    const source = Array.isArray(data) ? data : []
    try {
      return JSON.parse(JSON.stringify(source))
    } catch (error) {
      return []
    }
  }

  static stripCountSuffix(name) {
    return String(name || '').replace(/【\s*\d+\s*条建议\s*】\s*$/, '').trim()
  }

  static normalizeEditorText(text) {
    return String(text || '').replace(/\r/g, '').trim()
  }

  static updateTreeField(tree, meta, nextValue) {
    if (!this.canEditMeta(meta)) return false
    const keyId = String(meta.keyId || '').trim()
    const field = String(meta.field || '').trim()
    const value = String(nextValue || '')

    let updated = false
    const walk = nodes => {
      if (!Array.isArray(nodes) || updated) return
      nodes.forEach(node => {
        if (!node || typeof node !== 'object' || updated) return
        if (field === 'name' && String(node.keyId || '').trim() === keyId) {
          node.name = this.stripCountSuffix(value)
          updated = true
          return
        }
        if (field === 'keypoints') {
          const content = Array.isArray(node.content) ? node.content : []
          for (let i = 0; i < content.length; i += 1) {
            const contentItem = content[i]
            if (!contentItem || typeof contentItem !== 'object') continue
            if (String(contentItem.keyId || '').trim() === keyId) {
              contentItem.keypoints = value
              updated = true
              return
            }
          }
        }
        walk(node.children)
      })
    }
    walk(tree)
    return updated
  }

  static applyEditsToTree(tree, edits) {
    if (!Array.isArray(tree) || !edits || typeof edits !== 'object') return tree
    const normalized = this.normalizeEdits(edits)

    const walk = nodes => {
      if (!Array.isArray(nodes)) return
      nodes.forEach(node => {
        if (!node || typeof node !== 'object') return

        const nodeKeyId = String(node.keyId || '').trim()
        if (nodeKeyId && normalized[nodeKeyId] && Object.prototype.hasOwnProperty.call(normalized[nodeKeyId], 'name')) {
          node.name = this.stripCountSuffix(normalized[nodeKeyId].name)
        }

        const content = Array.isArray(node.content) ? node.content : []
        content.forEach(item => {
          if (!item || typeof item !== 'object' || item.keypoints === undefined) return
          const contentKeyId = String(item.keyId || '').trim()
          if (contentKeyId && normalized[contentKeyId] && Object.prototype.hasOwnProperty.call(normalized[contentKeyId], 'keypoints')) {
            item.keypoints = String(normalized[contentKeyId].keypoints || '')
          }
        })

        walk(node.children)
      })
    }

    walk(tree)
    return tree
  }

  static save(storageKey, payload) {
    if (!storageKey) return false
    const value = payload && typeof payload === 'object' ? payload : {}
    localStorage.setItem(storageKey, JSON.stringify(value))
    return true
  }

  static load(storageKey) {
    if (!storageKey) return null
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch (error) {
      return null
    }
  }

  static clear(storageKey) {
    if (!storageKey) return
    localStorage.removeItem(storageKey)
  }

  static extractSnapshot(tree) {
    const result = []
    const walk = (nodes, path) => {
      if (!Array.isArray(nodes)) return
      nodes.forEach((node, nodeIndex) => {
        if (!node || typeof node !== 'object') return
        const currentPath = path.concat(nodeIndex)
        const item = {
          path: currentPath.join('-'),
          keyId: String(node.keyId || ''),
          name: String(node.name || ''),
          keypoints: []
        }

        const content = Array.isArray(node.content) ? node.content : []
        content.forEach((contentItem, contentIndex) => {
          if (!contentItem || typeof contentItem !== 'object' || contentItem.keypoints === undefined) return
          item.keypoints.push({
            contentIndex,
            keyId: String(contentItem.keyId || ''),
            text: String(contentItem.keypoints || '')
          })
        })

        if (item.name || item.keypoints.length) result.push(item)
        walk(node.children, currentPath)
      })
    }

    walk(tree, [])
    return result
  }
}

export default EditableReportStore
