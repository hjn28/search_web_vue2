<template>
  <div class="empty-state">
    <!-- 插画 -->
    <div class="empty-state__illustration">
      <svg
        viewBox="0 0 200 160"
        xmlns="http://www.w3.org/2000/svg"
        class="empty-state__svg"
        aria-hidden="true"
      >
        <!-- 背景光晕（偏灰） -->
        <ellipse cx="100" cy="130" rx="70" ry="10" fill="#f5f5f5" />

        <!-- 文件夹主体（线条加深为 #d9d9d9） -->
        <path
          d="M40 55 h40 l10 12 h70 a8 8 0 0 1 8 8 v55 a8 8 0 0 1 -8 8 H40 a8 8 0 0 1 -8 -8 V63 a8 8 0 0 1 8 -8 z"
          fill="#ffffff"
          stroke="#d9d9d9"
          stroke-width="2"
          stroke-linejoin="round"
        />

        <!-- 文件夹顶部高光 -->
        <path
          d="M40 55 h40 l10 12 h70"
          fill="none"
          stroke="#d9d9d9"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <!-- 文件夹内部线条 -->
        <line x1="60" y1="95" x2="140" y2="95" stroke="#ebebeb" stroke-width="3" stroke-linecap="round" />
        <line x1="60" y1="110" x2="120" y2="110" stroke="#ebebeb" stroke-width="3" stroke-linecap="round" />

        <!-- 放大镜：红色调浅为浅珊瑚红 (#eb8686) -->
        <g class="empty-state__magnifier">
          <circle
            cx="130"
            cy="55"
            r="18"
            fill="#fef7f7"
            stroke="#eb8686"
            stroke-width="3"
          />
          <line
            x1="143"
            y1="68"
            x2="156"
            y2="81"
            stroke="#eb8686"
            stroke-width="4"
            stroke-linecap="round"
          />
        </g>

        <!-- 装饰小点（浅灰色） -->
        <circle cx="45"  cy="35"  r="3"   fill="#e0e0e0" class="empty-state__dot empty-state__dot--1" />
        <circle cx="160" cy="120" r="4"   fill="#e0e0e0" class="empty-state__dot empty-state__dot--2" />
        <circle cx="170" cy="40"  r="2.5" fill="#e0e0e0" class="empty-state__dot empty-state__dot--3" />
      </svg>
    </div>

    <!-- 标题：字体颜色调整为 #999 -->
    <div class="empty-state__title">{{ title }}</div>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    // 标题文字
    title: {
      type: String,
      default: '暂无数据'
    }
  }
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  user-select: none;
}

/* 插画 */
.empty-state__illustration {
  width: 200px;
  height: 160px;
  margin-bottom: 16px;
}

.empty-state__svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* 放大镜轻微浮动 */
.empty-state__magnifier {
  transform-origin: 130px 55px;
  animation: empty-float 2.6s ease-in-out infinite;
}

@keyframes empty-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}

/* 装饰点渐隐渐现 */
.empty-state__dot {
  animation: empty-pulse 2.4s ease-in-out infinite;
}
.empty-state__dot--1 { animation-delay: 0s; }
.empty-state__dot--2 { animation-delay: 0.4s; }
.empty-state__dot--3 { animation-delay: 0.8s; }

@keyframes empty-pulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
}

/* 标题：字体颜色调整 */
.empty-state__title {
  font-size: 14px;
  /* font-weight: 500; */
  color: #999; /* 调整为 #999 */
  margin-top: 4px;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 小屏适配 */
@media (max-width: 480px) {
  .empty-state {
    padding: 32px 16px;
  }
  .empty-state__illustration {
    width: 160px;
    height: 128px;
  }
  .empty-state__title {
    font-size: 15px;
  }
}
</style>
