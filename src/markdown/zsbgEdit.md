 综述报告中开始编辑，保存编辑；
 涉及的文件：
  - AdviceClusterRight.vue — 触发入口
  - EditableReportStore.js — 核心存储/加载逻辑
  - TreeHelper.js — 树扁平化（渲染节点）
  - ReportBuilder.js — 内容构建工具
     
  ---
  一、保存编辑的逻辑

  1.1 编辑过程中的增量保存（逐条 blur）

  当用户在编辑模式下修改某行文本后失去焦点：

  handleZsbgFieldBlur(event, node)   ← blur 事件
    ├─ 1. 校验: canEditMeta(meta) → 确认 keyId 存在且 field 为 name/keypoints
    ├─ 2. 规整: normalizeEditorText(event.target.innerText)
    ├─ 3. 回写树: updateTreeField(zsbgEditableTree, meta, text)
    │    → 在树中找到匹配 keyId 的节点，修改它的 name 或 content[i].keypoints
    │    → 这一步保证当前页面 DOM 更新（flatten 后重渲染）
    ├─ 4. 记录编辑: setFieldValue(zsbgLocalEdits, keyId, field, text)
    │    → 在内存 edits 对象中写入 { [keyId]: { name: "新值" } }
    │    → 只存增量的 diff，不存整棵树
    └─ 5. 重渲染: TreeHelper.flattenTree(zsbgEditableTree, handlers)
         → 生成新的 zsbgRenderNodes，页面更新

  setFieldValue 的结果结构（EditableReportStore.js 第42-49行）：
  // zsbgLocalEdits 的结构：
  {
    "keyId_001": { name: "用户修改后的标题" },
    "keyId_002": { keypoints: "用户修改后的正文" },
    "keyId_003": { name: "另一个标题", keypoints: "对应的正文修改" }
  }
  每个 keyId 对应树中的一个唯一节点，只保存被用户修改过的字段。

  1.2 点击"保存编辑"按钮的持久化

  saveLocalZsbgEdits()   ← 用户点击"保存编辑"
    ├─ 1. 构建 payload: {
    │      savedAt: "2026-07-08T10:30:00.000Z",        ← 时间戳
    │      edits: { ...this.zsbgLocalEdits },            ← 增量编辑记录
    │      snapshot: EditableReportStore.extractSnapshot(this.zsbgEditableTree)
    │    }
    │    extractSnapshot 遍历整棵树，提取所有 name 和 keypoints 路径：
    │    [{ path: "0-1", keyId: "xxx", name: "标题", keypoints: [...] }, ...]
    │
    ├─ 2. EditableReportStore.save(key, payload)
    │    → localStorage.setItem('adviceSearch_zsbg_edit_state', JSON.stringify(payload))
    │
    └─ 3. console.log('综述报告本地编辑结果：', payload)
         → this.$message({ type: 'success', message: '已保存到本地并打印到控制台' })

  存储 key：'adviceSearch_zsbg_edit_state'（写死在 data.zsbgLocalStorageKey，第349行）

  payload 结构：
  {
    "savedAt": "2026-07-08T10:30:00.000Z",
    "edits": {
      "keyId_001": { "name": "用户修改后的标题" },
      "keyId_002": { "keypoints": "用户修改后的正文关键点" }
    },
    "snapshot": [
      { "path": "0",     "keyId": "keyId_001", "name": "标题", "keypoints": [] },
      { "path": "0-0",   "keyId": "keyId_002", "name": "",     "keypoints": [
          { "contentIndex": 0, "keyId": "kp_001", "text": "正文关键点" }
      ]}
    ]
  }

  snapshot 仅用于调试辅助（控制台打印查看），不参与渲染流程。

  ---
  二、再次渲染时的加载逻辑

  加载入口只有一个——renderZsbgTree(payload) 方法（第685-700行），它在以下场景被调用：

  ┌────────────────────┬──────────────────────────────────────────────────────────┐
  │      触发场景      │                         数据来源                         │
  ├────────────────────┼──────────────────────────────────────────────────────────┤
  │ 任务队列点击"查看" │ res.data?.data（最新 API 数据）                          │
  ├────────────────────┼──────────────────────────────────────────────────────────┤
  │ 点击"重置编辑"     │ this.jljgzsData（上一次 API 返回的原始数据，缓存在内存） │
  └────────────────────┴──────────────────────────────────────────────────────────┘

  renderZsbgTree(payload)
    │
    ├─ Step 1 — 提取树
    │  TreeHelper.extractTreeFromPayload(payload)
    │  → 兼容各种外层包裹，最终返回纯树数组：[{ name, keyId, children, content, ... }]
    │
    ├─ Step 2 — 深克隆树
    │  EditableReportStore.cloneTree(tree)
    │  → JSON.parse(JSON.stringify(source))
    │  → 得到独立的 zsbgEditableTree，后续修改不影响原始数据
    │
    ├─ Step 3 — 从 localStorage 读取之前保存的编辑
    │  EditableReportStore.load(this.zsbgLocalStorageKey)
    │  → localStorage.getItem('adviceSearch_zsbg_edit_state')
    │  → JSON.parse(raw) → 返回 { edits: {...}, snapshot: [...] }
    │  → 如果不存在或解析失败，返回 null
    │
    ├─ Step 4 — 回放编辑到树上
    │  EditableReportStore.applyEditsToTree(zsbgEditableTree, zsbgLocalEdits)
    │  → 递归遍历整棵树
    │  → 对每个节点，检查 edits 中是否有 keyId 匹配的条目
    │  → 如果有 name 编辑 → node.name = edits[keyId].name
    │  → 如果有 keypoints 编辑 → node.content[i].keypoints = edits[keyId].keypoints
    │
    └─ Step 5 — 生成渲染节点
       TreeHelper.flattenTree(zsbgEditableTree, handlers)
       → 遍历树，为每个节点附加 editableMeta 元数据
       → 输出顺序的 zsbgRenderNodes 数组
       → Vue 模板据此渲染 DOM，contenteditable 属性绑定生效

  applyEditsToTree 的详细匹配逻辑（EditableReportStore.js 第104-132行）

  static applyEditsToTree(tree, edits) {
    const walk = nodes => {
      nodes.forEach(node => {
        // 1. 匹配节点自己的 keyId → 回写 name
        const nodeKeyId = String(node.keyId || '').trim()
        if (nodeKeyId && normalized[nodeKeyId]?.name) {
          node.name = this.stripCountSuffix(normalized[nodeKeyId].name)
        }

        // 2. 遍历节点的 content 数组 → 匹配 keyId → 回写 keypoints
        const content = Array.isArray(node.content) ? node.content : []
        content.forEach(item => {
          const contentKeyId = String(item.keyId || '').trim()
          if (contentKeyId && normalized[contentKeyId]?.keypoints) {
            item.keypoints = String(normalized[contentKeyId].keypoints || '')
          }
        })

        // 3. 递归子节点
        walk(node.children)
      })
    }
    walk(tree)
    return tree
  }

  关键要点：
  - stripCountSuffix（第62-63行）在回写 name 时会去除后缀 【N条建议】，因为编辑时用户不应该看到这个统计后缀
  - edits 中只有被修改过的字段才会覆盖树中的值，未修改的字段保持 API 原始数据
  - 这种"原始数据 + edits 增量"的模式，使得重置编辑只需清空 edits 并重新 clone 原始树即可，不需要重新请求 API

  ---
  三、完整数据流图示

  ┌─ 用户修改文本 ─────────────────────────────────────┐
  │                                                     │
  │  1. 编辑单个字段                                     │
  │      blur → setFieldValue(zsbgLocalEdits)            │
  │           → updateTreeField(zsbgEditableTree)        │
  │           → flattenTree → 页面更新                    │
  │                                                     │
  │  2. 点击"保存编辑"                                   │
  │      save(zsbgLocalStorageKey, { edits, snapshot })  │
  │      → localStorage.setItem(...)                     │
  │                                                     │
  │  3. 关闭页面 / 下次打开                              │
  │      renderZsbgTree(apiData)                         │
  │        ├─ extractTreeFromPayload                     │
  │        ├─ cloneTree                                  │
  │        ├─ load(localStorage)   ←── 读回 edits        │
  │        ├─ applyEditsToTree      ←── 回放到新树       │
  │        └─ flattenTree → 显示编辑后的结果              │
  │                                                     │
  │  4. 点击"重置编辑"                                   │
  │      clear(localStorage)                             │
  │      zsbgLocalEdits = {}                             │
  │      zsbgEditMode = false                            │
  │      renderZsbgTree(jljgzsData)    ←── 用原始数据重渲 │
  └─────────────────────────────────────────────────────┘

  核心设计思路：采用原始数据 + 增量 edits 的分离模式，edits 只记录用户修改过的字段（以 keyId 为键），不存储完整 HTML
  或整棵树。这样一是存储量小，二是保证每次渲染时 edits 能适配最新的 API 数据（只要 keyId 一致），三是重置时只需清 edits
  即可回到原始状态。

  现在整个编辑渲染流程会在控制台输出以下信息：

  ┌─────────────────────┬─────────────────────┬───────────────────────────┐
  │        步骤         │      日志前缀       │           内容            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ renderZsbgTree 入口 │ 📥 [renderZsbgTree] │ 原始数据 payload          │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 提取树后            │ 🌳 [renderZsbgTree] │ 原始树结构                │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 深克隆后            │ 📋 [renderZsbgTree] │ 克隆后的树                │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 读 localStorage     │ 💾 [renderZsbgTree] │ 本地存储的 edits          │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 当前 edits 增量     │ ✏️  [renderZsbgTree] │ 当前 edits 内容           │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 回放 edits 到树     │ 🔄 [renderZsbgTree] │ 回放后的完整树            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 回放 edits 到树     │ 🔄 [renderZsbgTree] │ 回放后的完整树            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 最终渲染列表        │ 🎨 [renderZsbgTree] │ 渲染节点数 + 节点列表     │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 读 localStorage     │ 💾 [renderZsbgTree] │ 本地存储的 edits          │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 当前 edits 增量     │ ✏️  [renderZsbgTree] │ 当前 edits 内容           │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 回放 edits 到树     │ 🔄 [renderZsbgTree] │ 回放后的完整树            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 回放 edits 到树     │ 🔄 [renderZsbgTree] │ 回放后的完整树            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 最终渲染列表        │ 🎨 [renderZsbgTree] │ 渲染节点数 + 节点列表     │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 每次 blur 编辑      │ ✏️  [blur]           │ 编辑的 keyId、field、text │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 更新后的 edits      │ ✏️  [blur]           │ edits 增量变化            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ blur 重渲染后       │ ✏️  [blur]           │ 渲染节点数                │
  │ 读 localStorage     │ 💾 [renderZsbgTree] │ 本地存储的 edits          │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 当前 edits 增量     │ ✏️  [renderZsbgTree] │ 当前 edits 内容           │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 回放 edits 到树     │ 🔄 [renderZsbgTree] │ 回放后的完整树            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 深克隆后            │ 📋 [renderZsbgTree] │ 克隆后的树                │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 读 localStorage     │ 💾 [renderZsbgTree] │ 本地存储的 edits          │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 当前 edits 增量     │ ✏️  [renderZsbgTree] │ 当前 edits 内容           │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 回放 edits 到树     │ 🔄 [renderZsbgTree] │ 回放后的完整树            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 每次 blur 编辑      │ ✏️  [blur]           │ 编辑的 keyId、field、text │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 当前 edits 增量     │ ✏️  [renderZsbgTree] │ 当前 edits 内容           │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 回放 edits 到树     │ 🔄 [renderZsbgTree] │ 回放后的完整树            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 最终渲染列表        │ 🎨 [renderZsbgTree] │ 渲染节点数 + 节点列表     │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 深克隆后            │ 📋 [renderZsbgTree] │ 克隆后的树                │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 读 localStorage     │ 💾 [renderZsbgTree] │ 本地存储的 edits          │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 当前 edits 增量     │ ✏️  [renderZsbgTree] │ 当前 edits 内容           │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 回放 edits 到树     │ 🔄 [renderZsbgTree] │ 回放后的完整树            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 最终渲染列表        │ 🎨 [renderZsbgTree] │ 渲染节点数 + 节点列表     │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 每次 blur 编辑      │ ✏️  [blur]           │ 编辑的 keyId、field、text │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 更新后的 edits      │ ✏️  [blur]           │ edits 增量变化            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ blur 重渲染后       │ ✏️  [blur]           │ 渲染节点数                │
  └─────────────────────┴─────────────────────┴───────────────────────────┘
  │ 更新后的 edits      │ ✏️  [blur]           │ edits 增量变化            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ blur 重渲染后       │ ✏️  [blur]           │ 渲染节点数                │
  └─────────────────────┴─────────────────────┴───────────────────────────┘


  现在整个编辑渲染流程会在控制台输出以下信息：

  ┌─────────────────────┬─────────────────────┬───────────────────────────┐
  │        步骤         │      日志前缀       │           内容            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ renderZsbgTree 入口 │ 📥 [renderZsbgTree] │ 原始数据 payload          │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 提取树后            │ 🌳 [renderZsbgTree] │ 原始树结构                │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 深克隆后            │ 📋 [renderZsbgTree] │ 克隆后的树                │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 读 localStorage     │ 💾 [renderZsbgTree] │ 本地存储的 edits          │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 当前 edits 增量     │ ✏️  [renderZsbgTree] │ 当前 edits 内容           │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 回放 edits 到树     │ 🔄 [renderZsbgTree] │ 回放后的完整树            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 最终渲染列表        │ 🎨 [renderZsbgTree] │ 渲染节点数 + 节点列表     │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 每次 blur 编辑      │ ✏️  [blur]           │ 编辑的 keyId、field、text │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ 更新后的 edits      │ ✏️  [blur]           │ edits 增量变化            │
  ├─────────────────────┼─────────────────────┼───────────────────────────┤
  │ blur 重渲染后       │ ✏️  [blur]           │ 渲染节点数                │
  └─────────────────────┴─────────────────────┴───────────────────────────┘