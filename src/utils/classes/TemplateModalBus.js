/**
 * EventBus - 全局纯事件总线
 *
 * 用途：仅用于组件间 UI 事件通知（如打开弹窗），不做数据存储。
 * 所有共享数据请使用 Vuex store（template 模块）。
 *
 * 事件清单：
 *   open-template-modal  { type, initialTree, initialFileName, onSave, onClose }
 *     - type: 'word-edit' | 'upload' | 'summary'
 *     - initialTree: 预填的目录树数据
 *     - initialFileName: 预填的文件名
 *     - onSave(payload): 保存回调
 *     - onClose(): 关闭回调
 */
import Vue from 'vue'
export default new Vue()
