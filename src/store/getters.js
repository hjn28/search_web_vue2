/**
 * ============================================================================
 * Vuex Getters
 * ============================================================================
 *
 * 定义全局状态的计算属性（派生状态）。
 * 组件通过 mapGetters 引入使用。
 *
 * @module store/getters
 */

const app = {
  /** @returns {Object} 当前登录用户信息 */
  userInfo: state => state.app.userInfo,
  /** @returns {*} 文件数据 */
  fileData: state => state.app.fileData,
  /** @returns {string} 提交的纯文本内容 */
  submitContent: state => state.app.submitContent,
  /** @returns {string} 提交的带样式内容 */
  submitContentWithStyle: state => state.app.submitContentWithStyle,
  /** @returns {string} 提交的标题 */
  submitTitle: state => state.app.submitTitle,
  /** @returns {*} 当前选中的数据项（用于政策文件库传参） */
  dataItem: state => state.app.dataItem,
  /** @returns {Array} 汇总要点列表（含 htmlContent、content） */
  zhList: state => state.app.zhList
}

export default app
