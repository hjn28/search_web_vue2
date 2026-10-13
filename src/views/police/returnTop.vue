<!-- BackTop.vue -->
<template>
    <transition name="fade">
      <div
        v-show="visible"
        class="back-top"
        @click="backToTop"
      >
        <!-- <slot>
          <i class="icon-arrow-up"></i>
        </slot> -->
        顶部
      </div>
    </transition>
  </template>

<script>
export default {
  props: {
    visibilityHeight: {
      type: Number,
      default: 300
    },
    target: {
      type: String,
      default: ''
    }
  },
  data() {
    return { visible: false }
  },
  mounted() {
    const container = this.target
      ? document.querySelector(this.target)
      : window
    container.addEventListener('scroll', this.handleScroll)
  },
  methods: {
    handleScroll() {
      const scrollTop = this.target
        ? document.querySelector(this.target).scrollTop
        : window.scrollY
      this.visible = scrollTop > this.visibilityHeight
    },
    backToTop() {
      if (this.target) {
        document.querySelector(this.target).scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }
    }
  }
}
</script>

  <style>
  .back-top {
    position: fixed;
    right: 50px;
    bottom: 50px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f56262;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity .3s;
  }
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
  </style>
