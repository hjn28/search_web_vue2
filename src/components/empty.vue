<><><template>
    <div class="container">
      <div class="error">
        <div>
            <img src="@/assets/img/file_select.png" alt="">
        </div>
        <div>
            <p>暂无数据</p>
        </div>
      </div>
    </div>
  </template>

<script>
export default {

}
</script>

  <style lang="scss" scoped>
  .container {
    // height: 100vh;
    // width: 100vw;
    z-index: 100;
    font-family: Source Han Sans SC;
    text-align: center;
    border-radius:10px;
    .error {
    //   display: flex;
    //   justify-content: center;
    //   align-items: flex-end;
    }
    img{
        margin-top:20px;
    }
    p {
      font-size: 16px;
      color: #989898;
      letter-spacing: 1px;
    }
  }
  </style>
