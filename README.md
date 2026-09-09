# 词库检索与摘要综合系统（前端）

本项目为 Vue2 + Element UI 的业务前端，核心能力包含：

- 一次拓展检索（关键词/句子/段落）
- 检索结果聚类与筛选
- 议案详情查看与高亮
- 摘要综合生成与导出
- 本地 TXT/JSON 数据调试入口

## 1. 技术栈

- Vue 2.6
- Vue Router 3
- Vuex 3
- Element UI 2.x
- Axios

## 2. 快速启动

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run serve
```

或使用固定端口：

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 3. 主要页面与功能说明

### 3.1 聚类与摘要主页面

路径：`/adviceCluster`

对应文件：

- `src/views/adviceSearch/adviceCluster.vue`
- `src/views/adviceSearch/components/AdviceClusterLeft.vue`
- `src/views/adviceSearch/components/AdviceClusterRight.vue`

功能包括：

- 一次拓展（关键词、句子、段落）
- 结果勾选（跨页全选、分页勾选、禁用/启用）
- 生成摘要综合
- 摘要结果浏览、导出
- 详情查看（精准词高亮）
- Word 上传并转文本参与摘要

### 3.2 旧版建议检索页

路径：`/adviceSearch`

对应文件：`src/views/adviceSearch/index.vue`

用于兼容旧流程，保留现有检索能力。

### 3.3 本地数据调试页

路径：`/localZhaiyaoData`

对应文件：`src/views/adviceSearch/localZhaiyaoData.vue`

功能包括：

- 上传 TXT 文件
- 将输入标准化为摘要接口可消费结构
- 触发 `window.localZhaiyaoData(payload)`
- 一键导出 DOC（先执行生成流程）

## 4. 关键业务数据流

### 4.1 检索到聚类

1. 左侧输入检索条件
2. 调用一次拓展接口 `searchZF`
3. 调用二次检索/聚类接口 `searchZFSearch2`
4. 结果落在右侧表格并支持多维筛选

### 4.2 聚类到摘要

1. 用户勾选右侧结果
2. 组装摘要入参（模糊词/半模糊词/精准词、数据库、已选结果、上传文本）
3. 调用摘要接口 `searchZFZhaiyao`
4. 对返回数据执行 `normalizeZhaiyaoData`
5. 渲染摘要卡片并计算统计数据

### 4.3 摘要导出

摘要导出通过 `src/utils/export.js` 的 `downloadSummaryDoc` 完成，导出时复用页面统计与段落格式化方法，保证“页面展示”和“导出文档”结构一致。

## 5. 目录结构（核心）

```text
src/
	api/                       # 接口封装
	router/                    # 路由
	store/                     # 全局状态
	utils/                     # 通用工具与导出能力
	views/
		adviceSearch/            # 检索与摘要主业务
		police/                  # 历史业务页面
```

## 6. 本次重构与优化说明

本次完成以下优化：

- 路由结构优化：去除重复定义，`/` 统一重定向到 `/adviceCluster`
- 摘要核心逻辑重构：`localZhaiyaoData` 优先使用接口返回数据并统一归一化
- 统计文案修正：摘要统计中的“意见条数”由真实 `opinionCount` 输出
- 代码清理：删除无引用备份文件 `src/views/police/index copy.vue`
- 响应式补全：补充 `searchInput` 响应式字段，避免运行时属性告警
- 注释增强：在关键流程节点补充必要注释，便于维护

## 7. 数据源切换说明

当前页面支持两种数据源模式：

- `local`：使用本地示例数据
- `api`：调用后端接口

可通过页面 URL 参数中的 `dataMode` 控制。

## 8. 维护建议

- 新增工具函数时优先放在 `src/utils/index.js`，并保持单一职责
- 避免在业务组件内保留调试 `console.log`
- 复杂统计逻辑优先沉淀为纯函数，便于单测
- 页面导出与页面展示复用同一格式化函数，避免口径不一致

## 9. 参考

- Vue CLI 配置参考：https://cli.vuejs.org/config/