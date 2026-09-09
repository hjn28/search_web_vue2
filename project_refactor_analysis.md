# search_web 项目代码分析与重构建议

## 1. 分析范围

本次分析覆盖以下层面：

- 项目入口与全局初始化
- 路由与状态管理
- 请求层与 API 封装
- 业务主页面（adviceSearch）
- 工具函数与导出逻辑
- 工程化配置（构建、代理、代码规范）

## 2. 项目现状结论

项目已具备完整业务闭环（检索 -> 聚类 -> 摘要 -> 导出），但在工程化、可维护性、健壮性和可扩展性方面仍有明显技术债。

核心问题集中在：

- 配置与环境耦合偏重（代理与地址硬编码）
- 全局逻辑分散（入口文件职责过多）
- 请求层错误处理不统一
- 业务组件体量偏大，状态与 UI 强耦合
- 工具函数职责边界不清晰，数据结构兼容逻辑分散

## 3. 优先级分级（P0 / P1 / P2）

### P0（优先立即处理）

1. 敏感网络地址与内部环境信息硬编码
2. 请求层异常处理不完整（仅覆盖少量业务码）
3. 本地持久化范围过大（Vuex 全量持久化）
4. 路由定义存在重复命名与可读性问题

### P1（高优先）

1. 入口文件 main.js 职责过重（插件注册、原生事件、时间格式原型扩展混合）
2. 大型业务组件内部逻辑集中，拆分不足
3. API 层参数风格不统一，部分调用存在无效字段或语义不清
4. 代码规范执行弱化（lintOnSave 关闭）

### P2（中优先）

1. 工具函数存在重复能力与历史兼容包袱
2. UI 库并行使用增加体积与学习成本
3. 调试代码与注释遗留较多
4. 测试体系缺失

## 4. 需要重构的代码与重构逻辑（逐项）

| 模块 | 文件 | 现状问题 | 重构逻辑 |
|---|---|---|---|
| 构建配置 | vue.config.js | 多个代理地址硬编码、注释切换环境 | 建立 .env.development/.env.production，通过环境变量驱动代理与网关地址，移除注释切换 |
| 入口初始化 | src/main.js | Element 组件逐个注册、全局事件与平台逻辑混杂、Date.prototype 扩展污染全局 | 拆分为 plugins/element.js、platform/native.js、utils/date.js，避免修改原生原型 |
| 请求封装 | src/utils/req.js | 只对 result=100 做处理，网络异常/超时/5xx 无统一反馈 | 统一错误码映射、超时处理、重试策略（可选）、错误提示标准化，返回结构统一为 { success, data, message } |
| 状态管理 | src/store/index.js | createPersistedState 全量持久化，存在存储膨胀风险 | 使用 paths 白名单，仅持久化 token、必要筛选条件；加版本号与迁移策略 |
| 路由管理 | src/router/index.js | 重复 name（adviceCluster）、注释遗留多，守卫基本空实现 | 统一路由命名规范，补充鉴权守卫与白名单路由，拆出 route constants |
| API 定义 | src/api/zhaiyao.js | query 字符串拼接、credentials 字段位置不合理、post body 直接 stringify | 统一以 params/data 传参，封装 request builder，所有接口返回类型结构对齐 |
| 业务主页面 | src/views/adviceSearch/adviceCluster.vue | data 字段过多、UI 状态和业务状态耦合、watch 分散 | 拆分 composable 风格的逻辑模块（search/useSearchState、tag/useTagState、summary/useSummaryState） |
| 右侧核心组件 | src/views/adviceSearch/components/AdviceClusterRight.vue | 组件体量大、承担上传/分页/详情/摘要/导出多职责 | 按职责拆为 SummaryPanel、ResultTable、DetailPanel、UploadAction 子组件，父层只做编排 |
| 通用工具 | src/utils/util.js | scroll 动画模拟 requestAnimationFrame、base64 转换函数重复、listToTree 有副作用（改原对象） | 使用原生 requestAnimationFrame；提取统一 file encoder；listToTree 采用不可变写法 |
| 时间工具 | src/components/time.js 与 src/utils/util.js | 日期与时间能力分散，存在重复格式化逻辑 | 统一至 src/utils/date.js，组件仅消费函数，不再重复实现 |
| 文本处理 | src/utils/index.js | 摘要格式化逻辑复杂且高度耦合 HTML 字符串拼接 | 将“数据归一化”和“视图拼接”拆层：normalize -> viewModel -> render |
| 导出能力 | src/utils/export.js | 可能与页面规则耦合，扩展格式困难 | 提取共享 formatter，导出层只负责模板填充与文件生成 |
| 样式与 UI | src/main.js + src/plugins/vant.js | Element + Vant 混用，按需策略不明确 | 确认主 UI 库，另一套仅保留必要组件，结合 babel-plugin-component/按需加载瘦身 |
| 规范治理 | vue.config.js / 全项目 | lintOnSave 关闭，历史注释与 console 遗留 | 恢复 lintOnSave（开发态 warning），增加 pre-commit lint-staged |
| 测试体系 | 全项目 | 无单元测试和关键流程回归测试 | 为 utils/index.js、req.js、summary 格式化逻辑补齐单测；关键流程补 e2e 冒烟 |

## 5. 结构化重构方案（建议执行顺序）

### 阶段一：安全与稳定（1-2 天）

- 配置外置：清理硬编码地址，完成 env 配置
- 请求层统一错误处理：网络异常、鉴权异常、业务异常统一
- 持久化白名单化：限制 localStorage 体积与敏感数据暴露

### 阶段二：核心模块解耦（2-4 天）

- 拆分 main.js 初始化职责
- 拆分 AdviceClusterRight 大组件
- 统一 API 入参与返回结构

### 阶段三：工程化与质量（2-3 天）

- 恢复并收敛 ESLint 规则
- 清理无效注释/调试代码
- 增加关键工具函数单测和摘要流程冒烟测试

### 阶段四：性能与体验（可并行）

- UI 组件按需加载治理
- 路由与大组件懒加载策略复核
- 长列表与详情渲染性能优化

## 6. 可量化验收指标

- 打包体积下降（目标 10%+）
- 页面首屏可交互时间下降
- 摘要生成与导出相关线上报错率下降
- 关键流程（检索/摘要/导出）具备自动化回归
- 代码重复率下降，核心大文件行数下降

## 7. 建议先改的 8 个点（可直接进入开发）

1. 新增 env 配置并改造 vue.config.js 代理来源
2. 重构 src/utils/req.js 错误处理和返回结构
3. store 持久化改为 paths 白名单
4. router 去重命名并补充基础鉴权守卫
5. main.js 拆分插件注册文件
6. AdviceClusterRight 拆分为 3-4 个子组件
7. 统一日期与文件编码工具函数
8. 为摘要格式化函数增加单元测试

## 8. 总结

该项目业务可用性较好，但工程可维护性落后于业务复杂度增长。建议按“先稳定、再解耦、再提质、最后提效”的策略推进，避免一次性大重构带来回归风险。
