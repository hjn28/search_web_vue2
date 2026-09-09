/**
 * ============================================================================
 * Vuex 应用状态模块 - app
 * ============================================================================
 *
 * 管理应用级全局状态：
 *   - userInfo: 当前登录用户信息
 *   - fileData: 文件数据
 *   - submitContent / submitContentWithStyle: 提交内容（纯文本/带样式）
 *   - submitTitle: 提交标题
 *   - dataItem: 当前选中的数据项（用于政策文件库传参）
 *   - zhList: 汇总要点列表（含 htmlContent、content）
 *
 * @module store/modules/app
 */

const app = {
  state: {
    userInfo: {}, // 当前登录用户信息
    fileData: '', // 文件数据
    submitContent: '', // 提交的纯文本内容
    submitContentWithStyle: '', // 提交的带样式内容
    submitTitle: '', // 提交的标题
    dataItem: '', // 当前选中的数据（用于政策文件库传参）
    zhList: '' // 汇总要点列表（含 htmlContent、content）
  },
  mutations: {
    SET_USERINFO: (state, userInfo) => { state.userInfo = userInfo },
    SET_FILEDATA: (state, data) => { state.fileData = data },
    SET_SUB_CONT: (state, data) => { state.submitContent = data },
    SET_SUB_CONT_STY: (state, data) => { state.submitContentWithStyle = data },
    SET_SUB_TITLE: (state, data) => { state.submitTitle = data },
    SET_DATA_ITEM: (state, data) => { state.dataItem = data },
    SET_ZHLIST: (state, data) => { state.zhlist = data }
  }
}

export default app
