<!--
  ============================================================================
  应用根组件
  ============================================================================

  负责：
    1. 路由视图渲染（支持 <keep-alive> 缓存指定组件）
    2. 页面切换动画（slide-left / slide-right）
    3. 交互：监听路由变化，通过 isBack 状态决定动画方向

  缓存的组件：web, selectOperation, billDetail, uploadAnalysis,
              cloudPage, billDetailSuggest, uploadAnalysisSuggest, cloudPageSuggest
  ============================================================================
-->
<template>
  <div id="app">
    <transition :name="transitionName">
      <keep-alive :include="include">
        <router-view class="appView"></router-view>
      </keep-alive>
    </transition>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
export default {
  data() {
    return {
      include: [
        'web', 'selectOperation', 'billDetail', 'uploadAnalysis',
        'cloudPage', 'billDetailSuggest', 'uploadAnalysisSuggest', 'cloudPageSuggest'
      ],
      transitionName: 'slide-right'
    }
  },
  created() {},
  watch: {
    /**
     * 监听路由变化，控制页面切换动画方向
     * 物理返回（isBack=true）→ slide-right（从右滑入）
     * 正常导航（isBack=false）→ slide-left（从左滑入）
     */
    '$route'() {
      const isBack = this.$router.isBack
      this.transitionName = isBack ? 'slide-right' : 'slide-left'
      this.$router.isBack = false
    }
  },
  methods: {
    ...mapActions(['setUserInfo'])
  }
}
</script>

<style scoped>
#app { position: relative; }
.appView {
  position: absolute;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease-out;
}
</style>
