<template>
  <div id="app">
    <transition name="slide-right">
      <keep-alive>
        <router-view class="appView"></router-view>
      </keep-alive>
    </transition>
  </div>
</template>

<style scoped>
#app { position: relative; }
.appView {
  position: absolute;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease-out;
}
</style>
