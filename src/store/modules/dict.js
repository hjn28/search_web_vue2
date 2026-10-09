/**
 * Vuex 字典数据模块 - dict
 *
 * 代表团（字典 platloginBz）与承办单位（接口 getDeptInfo）的全量数据统一存放于此，
 * 供左侧筛选（FilterConditions）与右侧分析报告模板（AdviceClusterRight）公共使用，
 * 避免跨组件多层 props/事件中转传递。
 *
 * - allDelegations：代表团字典全量 [{ value, label, id }]，不做用户范围过滤；
 *   value/label 均为代表团显示名（如"北京"），search2 等接口直接传 value 即为名称；
 *   id 保留字典编号，供按用户管理范围（managePubDbtId）过滤使用
 * - allCbdw：承办单位接口全量 [{ sysDeptId, deptName }]，不做部门过滤
 * - delegationValue / cbdwValue：当前选中的单个值（由左筛选写入，分析报告模板作为默认值）
 */
import { getDeptInfo, platloginBz } from '../../api/zhaiyao'

/**
 * 模块级 in-flight 请求缓存：多个组件并发 dispatch fetchAll 时，
 * 共享同一个进行中的请求 Promise，避免重复发起（请求结束即释放，失败可重试）。
 * 注意：不能只靠 state.loaded 去重——它在请求全部完成后才置位，
 * 挡不住请求 in-flight 期间的并发重复调用。
 */
let delegationsReq = null
let cbdwReq = null

/** 从 localStorage 安全读取登录用户信息（store 无法访问组件实例，直接读缓存） */
function readUserInfo() {
  try {
    const str = localStorage.getItem('userInfo')
    return str ? JSON.parse(str) : {}
  } catch (e) {
    return {}
  }
}

export default {
  namespaced: true,
  state: {
    allDelegations: [], // 代表团字典全量 [{ value, label, id }]（value/label 均为名称）
    allCbdw: [], // 承办单位接口全量 [{ sysDeptId, deptName }]
    delegationValue: '', // 当前选中的代表团（label 或 value）
    cbdwValue: '', // 当前选中的承办单位（deptName）
    loaded: false, // 是否已拉取过（避免重复请求）
    isShowZlsc: false // 是否显示“资料上传”功能（由 authUrl 中是否包含 menu/zhfx/zlsc 决定）
  },
  mutations: {
    SET_DELEGATIONS(state, list) {
      state.allDelegations = Array.isArray(list) ? list : []
    },
    SET_CBDW(state, list) {
      state.allCbdw = Array.isArray(list) ? list : []
    },
    SET_DELEGATION_VALUE(state, val) {
      state.delegationValue = String(val || '')
    },
    SET_CBDW_VALUE(state, val) {
      state.cbdwValue = String(val || '')
    },
    SET_LOADED(state, val) {
      state.loaded = !!val
    },
    SET_SHOW_ZLSC(state, val) {
      state.isShowZlsc = !!val
    }
  },
  actions: {
    /** 拉取代表团字典全量（已加载或请求进行中则不重复发起） */
    fetchDelegations({ commit, state }) {
      if (state.loaded && state.allDelegations.length) return Promise.resolve()
      if (delegationsReq) return delegationsReq
      const userInfo = readUserInfo()
      delegationsReq = platloginBz(userInfo.userId || '')
        .then(res => {
          // 判断authUrl中是否包含'menu/zhfx/zlsc'
          const isShowZlsc = res.data?.authURI?.includes('/menu/zhfx/zlsc')
          commit('SET_SHOW_ZLSC', isShowZlsc)
          // 获取代表团
          if (!res?.data || res.result !== 0) {
            console.error('[dict] 获取代表团字典失败')
            return
          }
          const dictList = res.data.dict
          if (!dictList?.length || !dictList[0].dbtId) {
            console.error('[dict] 代表团字典数据为空')
            return
          }
          const dbtObj = dictList[0].dbtId
          const idMap = {}
          Object.values(dbtObj).forEach(itemObj => {
            const [id, label] = Object.entries(itemObj)[0]
            idMap[id] = label
          })
          // value/label 统一用显示名（如"北京"），search2 传参直接是名称；
          // id 保留字典编号，供 managePubDbtId 管理范围过滤使用
          commit('SET_DELEGATIONS', Object.entries(idMap).map(([id, label]) => ({ value: label, label, id })))
        })
        .catch(err => {
          console.error('[dict] 代表团字典请求异常：', err)
        })
        .then(() => {
          delegationsReq = null // 请求结束（成功/失败）即释放，失败后下次可重试
        })
      return delegationsReq
    },
    /** 拉取承办单位接口全量（已加载或请求进行中则不重复发起） */
    fetchCbdw({ commit, state }) {
      if (state.loaded && state.allCbdw.length) return Promise.resolve()
      if (cbdwReq) return cbdwReq
      cbdwReq = getDeptInfo()
        .then(res => {
          if (!res?.data || res.result !== 0) {
            console.error('[dict] 获取部门信息失败')
            return
          }
          const list = (res.data || []).map(dept => ({
            sysDeptId: dept.sysDeptId,
            deptName: dept.shortName || dept.deptName
          }))
          commit('SET_CBDW', list)
        })
        .catch(err => {
          console.error('[dict] 部门信息请求异常：', err)
        })
        .then(() => {
          cbdwReq = null // 请求结束（成功/失败）即释放，失败后下次可重试
        })
      return cbdwReq
    },
    /** 统一拉取（幂等，可被多个组件安全重复调用） */
    fetchAll({ dispatch, commit }) {
      return Promise.all([dispatch('fetchDelegations'), dispatch('fetchCbdw')])
        .then(() => commit('SET_LOADED', true))
    }
  }
}
