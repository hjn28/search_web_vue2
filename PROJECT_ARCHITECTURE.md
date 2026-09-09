# 项目架构文档

## 概述

议案建议聚类与摘要综合系统 - 基于 Vue 2 + Element UI 的智能检索与分析平台。

## 项目结构

```
src/
├── api/                    # API 接口层
│   ├── login.js           # 登录与检索接口
│   ├── billCloud.js       # 议案云图接口
│   ├── billList.js        # 议案/建议列表 CRUD
│   ├── zhaiyao.js         # 摘要生成/删除接口
│   └── zytask.js          # 异步任务队列接口
├── assets/                # 静态资源
│   ├── img/               # 图片资源
│   ├── style/             # 全局样式
│   ├── langs/             # 语言/组件资源
│   └── chartTemplates/    # 图表模板 JSON
├── components/            # 公共组件
│   ├── adviceCluster/     # 聚类相关子组件
│   │   ├── ClusterHeaderHistory.vue  # 顶部标题栏 + 操作历史弹窗
│   │   └── TaggingModal.vue          # 打标签模态框
│   ├── Circle.vue         # 圆形图标组件
│   ├── empty.vue          # 空状态组件
│   ├── error.vue          # 错误状态组件
│   ├── returnTop.vue      # 回到顶部组件
│   └── time.js            # 时间格式化工具
├── Echarts/               # ECharts 图表组件
│   ├── echarts.js         # 公共图表配置
│   ├── BarChartWithTable.vue       # 柱状图+表格
│   ├── LineChartWithTable.vue      # 折线图+表格
│   ├── LinePercentChart.vue        # 百分比折线图
│   ├── ProvinceLineChart.vue       # 省份折线图
│   ├── GroupedBarPercentChart.vue  # 分组百分比柱状图
│   └── AnnualHandleTypeBarChart.vue# 年度处理类型柱状图
├── plugins/               # 插件注册
│   └── vant.js            # Vant UI 注册
├── router/
│   └── index.js           # 路由配置 + 鉴权守卫
├── store/                 # Vuex 状态管理
│   ├── index.js           # Store 入口（含持久化）
│   ├── actions.js         # 全局 Actions
│   ├── getters.js         # 全局 Getters
│   └── modules/
│       └── app.js         # 应用状态模块
├── utils/                 # 工具函数（已全部添加详细注释）
│   ├── index.js           # 核心工具函数（转义、摘要、统计）
│   ├── req.js             # HTTP 请求封装（Axios + 拦截器）
│   ├── export.js          # 摘要 DOC 导出
│   ├── util.js            # 杂项工具（滚动、文件、日期）
│   ├── zhaiyao.js         # 摘要接口调用辅助
│   └── classes/           # ✅ 新封装的工具类
│       ├── SummaryFormatter.js  # 摘要格式化与统计
│       ├── DataExporter.js      # 数据导出（DOC/CSV）
│       ├── SearchHelper.js      # 搜索条件构建
│       ├── FileHelper.js        # 文件处理
│       ├── TreeHelper.js        # 树结构操作
│       ├── HistoryManager.js    # 操作历史管理
│       └── ReportBuilder.js     # 综述报告构建
└── views/                 # 页面视图
    ├── login.vue          # 登录页
    ├── test.vue           # 测试页
    ├── ragflow.vue        # RAG 流程页
    ├── police/            # 公安相关页
    │   ├── index.vue      # 警察/公安首页
    │   ├── index copy.vue
    │   ├── indexAdvice.vue
    │   ├── indexMatch.vue
    │   └── detail.vue     # 详情页
    ├── zhaiyao/           # 摘要页
    │   └── index.vue
    └── adviceSearch/      # 议案建议检索（核心模块）
        ├── index.vue               # 老版搜索页
        ├── adviceCluster.vue       # 聚类主页面（核心）
        ├── localZhaiyaoData.vue    # 本地摘要数据页
        ├── components/
        │   ├── AdviceClusterLeft.vue   # 左侧面板（输入+条件）
        │   ├── AdviceClusterRight.vue  # 右侧面板（结果+摘要）
        │   ├── sczdymb.vue            # 综述模板组件
        │   ├── upload.vue             # 上传组件
        │   └── extra_report_params.json
        └── utils/
            ├── zsbgTreeRenderer.js    # 综述树渲染
            ├── zsbgChartRender.js     # 图表渲染配置
            └── zsbgOverviewExport.js  # 综述导出
```

## 核心业务流程

```
用户输入（词/句/段/篇）
       │
       ▼
  一次拓展检索（searchZF）
   - 语义拓展，返回相关词、片段
       │
       ▼
  二次检索聚类（searchZFSearch2）
   - 加入筛选条件（库类型、届次、代表团、承办单位等）
       │
       ▼
  聚类结果展示（表格）
   - 全选/分页选/单条选
   - 打标签、详情查看、禁用/启用
       │
       ▼
  摘要综合生成（task）
   - 异步任务队列
   - 支持上传 Word 补充语料
       │
       ▼
  摘要展示 & 导出
   - 分节展示、精准词高亮
   - 导出 DOC、CSV
   - 综述报告生成与导出
```

## ✅ 新增工具类汇总

| 类名 | 所在文件 | 用途 |
|------|---------|------|
| `SummaryFormatter` | `src/utils/classes/SummaryFormatter.js` | 摘要格式化、统计、高亮、数据归一化 |
| `DataExporter` | `src/utils/classes/DataExporter.js` | 摘要 DOC 导出、综述导出、CSV 导出 |
| `SearchHelper` | `src/utils/classes/SearchHelper.js` | 搜索参数构建、关键词解析、届次转换 |
| `FileHelper` | `src/utils/classes/FileHelper.js` | 文件读写、Base64/Blob/URL 转换 |
| `TreeHelper` | `src/utils/classes/TreeHelper.js` | 列表转树、树遍历、扁平化、综述树提取 |
| `HistoryManager` | `src/utils/classes/HistoryManager.js` | 操作历史记录（localStorage 持久化） |
| `ReportBuilder` | `src/utils/classes/ReportBuilder.js` | 综述报告参数构建、图表配置生成 |

## 已完成的工作

1. ✅ **工具类封装** - 将散落的工具函数抽为 7 个类，方便统一导入使用
2. ✅ **详细注释** - 所有 `src/utils/`、`src/api/`、`src/store/`、`src/router/`、`src/main.js`、`src/App.vue` 已添加完整的 JSDoc 注释
3. ✅ **逻辑梳理** - 已理清完整的 检索→聚类→摘要→导出 流程
