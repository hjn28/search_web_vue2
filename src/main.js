import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './style.css'
import './plugins/vant'
import './assets/style/global.scss'
import 'font-awesome/css/font-awesome.min.css'
// import Time from './components/time'
import md5 from 'js-md5'

// Element UI 组件按需引入
import {
  Dropdown, DropdownMenu, DropdownItem, Button, Container, Header, Main,
  Icon, Dialog, Upload, Loading, Card, Input, Select, Option, Table,
  TableColumn, Tag, Collapse, CollapseItem, Popover, Tree, Pagination,
  Tabs, TabPane, Row, Col, CheckboxGroup, Checkbox, Radio,
  Popconfirm, Tooltip, Message, MessageBox
} from 'element-ui'
import '@/assets/style/element-variables.scss'

Vue.prototype.$md5 = md5

// Element UI 全局消息/确认/提示助手
Vue.prototype.$message = Message
Vue.prototype.$confirm = MessageBox.confirm
Vue.prototype.$alert = MessageBox.alert
Vue.prototype.$prompt = MessageBox.prompt

const elementComponents = [
  Dropdown, DropdownMenu, DropdownItem, Button, Container, Header, Main,
  Icon, Dialog, Upload, Loading, Card, Input, Select, Option, Table,
  TableColumn, Tag, Collapse, CollapseItem, Popover, Tree, Pagination,
  Tabs, TabPane, Row, Col, CheckboxGroup, Checkbox, Radio,
  Popconfirm, Tooltip
]
elementComponents.forEach(component => Vue.use(component))

// 全局配置与异常处理
Vue.config.productionTip = false

Vue.config.errorHandler = function (err, vm, info) {
  console.error('[全局Vue错误]', err, info)
  try {
    if (vm && vm.$message && typeof vm.$message.error === 'function') {
      vm.$message.error('页面发生异常，请刷新重试')
    }
  } catch (_) { /* 兜底 */ }
}

window.addEventListener('unhandledrejection', function (event) {
  const reason = event.reason
  // 已由 req.js 拦截器处理的 Promise.reject 不再重复日志
  if (reason && reason.__handledByInterceptor) return
  console.error('[未捕获的Promise异常]', reason)
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
