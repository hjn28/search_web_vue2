/**
 * ============================================================================
 * 应用入口
 * ============================================================================
 *
 * 职责：
 *   1. 初始化 Vue 实例
 *   2. 注册 Element UI 组件
 *   3. 注入全局工具（md5、消息提示等）
 *   4. 挂载时间格式化指令（v-time）
 *   5. 监听物理返回键（Android App）
 *
 * @module main
 */

import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './style.css'
import './plugins/vant'
import './assets/style/global.scss'
import 'font-awesome/css/font-awesome.min.css'
import Time from './components/time'
import md5 from 'js-md5'

// Element UI 组件按需引入
import {
  Dropdown, DropdownMenu, DropdownItem, Button, Container, Header, Main,
  Icon, Dialog, Upload, Loading, Card, Input, Select, Option, Table,
  TableColumn, Tag, Collapse, CollapseItem, Popover, Tree, Pagination,
  Tabs, TabPane, Row, Col, CheckboxGroup, Checkbox, Message, MessageBox, radio,
  Popconfirm, Tooltip
} from 'element-ui'
import '@/assets/style/element-variables.scss'

Vue.prototype.$md5 = md5 // 全局挂载 md5 工具

// 注册 Element UI 组件
Vue.use(Dropdown)
Vue.use(DropdownMenu)
Vue.use(DropdownItem)
Vue.use(Button)
Vue.use(Container)
Vue.use(Header)
Vue.use(Main)
Vue.use(Icon)
Vue.use(Dialog)
Vue.use(Upload)
Vue.use(Loading)
Vue.use(Card)
Vue.use(Input)
Vue.use(Select)
Vue.use(Option)
Vue.use(Table)
Vue.use(TableColumn)
Vue.use(Tag)
Vue.use(Collapse)
Vue.use(CollapseItem)
Vue.use(Popover)
Vue.use(Tree)
Vue.use(Pagination)
Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Row)
Vue.use(Col)
Vue.use(CheckboxGroup)
Vue.use(Checkbox)
Vue.use(radio)
Vue.use(Popconfirm)
Vue.use(Tooltip)

// Element UI 全局消息/确认/提示助手
Vue.prototype.$message = Message
Vue.prototype.$confirm = MessageBox.confirm
Vue.prototype.$alert = MessageBox.alert
Vue.prototype.$prompt = MessageBox.prompt

Vue.config.productionTip = false

/**
 * 全局异常捕获：避免 Vue 渲染异常导致白屏
 */
Vue.config.errorHandler = function (err, vm, info) {
  console.error('[全局Vue错误]', err, info)
  try {
    if (vm && vm.$message && typeof vm.$message.error === 'function') {
      vm.$message.error('页面发生异常，请刷新重试')
    }
  } catch (_) { /* 兜底 */ }
}

/**
 * 全局未捕获 Promise 异常兜底
 * 大部分 HTTP 错误已在 req.js 响应拦截器中统一处理，此处仅做日志记录
 */
window.addEventListener('unhandledrejection', function (event) {
  const reason = event.reason
  // 已由 req.js 拦截器处理的 Promise.reject 不再重复日志
  if (reason && reason.__handledByInterceptor) return
  console.error('[未捕获的Promise异常]', reason)
})

/**
 * popstate 事件监听物理返回键
 * 用于在混合 App（H5+Native）中控制页面导航方向
 */
window.addEventListener('popstate', function(e) {
  router.isBack = true
}, false)

/**
 * plusready 后监听 Android 返回按钮
 */
document.addEventListener('plusready', function() {
  // eslint-disable-next-line no-undef
  plus.key.addEventListener('backbutton', function() {
    // eslint-disable-next-line no-undef
    window.history.length > 1 ? router.go(-1) : plus.runtime.quit()
  })
})

/**
 * 扩展 Date 原型：日期格式化方法
 * @param {string} fmt 格式模板，默认 'yyyy-MM-dd hh:mm'
 * @returns {string} 格式化后的日期字符串
 */
Date.prototype.format = function(fmt = 'yyyy-MM-dd hh:mm') {
  var o = {
    'M+': this.getMonth() + 1,
    'd+': this.getDate(),
    'h+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'q+': Math.floor((this.getMonth() + 3) / 3),
    S: this.getMilliseconds()
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
    }
  }
  return fmt
}

/**
 * 全局指令 v-time：自动更新显示相对时间
 * 每 60 秒刷新一次
 */
Vue.directive('time', {
  bind(el, binding) {
    el.innerHTML = Time.getFormatTime(binding.value)
    el.__timeout__ = setInterval(function() {
      el.innerHTML = Time.getFormatTime(binding.value)
    }, 60000)
  },
  unbind(el) {
    clearInterval(el.__timeout__)
    delete el.__timeout__
  }
})

// 创建并挂载根实例
new Vue({
  router,
  store,
  render: h => h(App),
  data: { timeNow: new Date().getTime() }
}).$mount('#app')
