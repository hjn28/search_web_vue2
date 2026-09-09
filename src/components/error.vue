<template>
  <div class="container">
    <div class="error">
      <img src="../assets/img/error.png" alt="">
    </div>
    <p>网络不太给力，点击重新加载</p>
    <van-button type="default" class="btn">重新加载</van-button>
  </div>
</template>

<script>
export default {

}
</script>

<style lang="scss" scoped>
.container {
  position: absolute;
  height: 100vh;
  width: 100vw;
  z-index: 100;
  top: 0;
  left: 0;
  font-family: Source Han Sans SC;
  text-align: center;
  .error {
    height: 357px;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    img {
      width: 257px;
      height: 240px;
    }
  }
  p {
    font-size: 16px;
    color: #989898;
    letter-spacing: 1px;
  }
  .btn {
    font-size: 18px;
    color: #ffffff;
    background: #d90000;
    width: 200px;
    height: 36px;
    border-radius: 18px;
    margin-top: 80px;
  }
}
</style>
