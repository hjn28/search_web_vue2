<template>
  <div class="login">
    <div class="login-title">
      <div>
        <van-image
          width="4rem"
          height="4rem"
          fit="contain"
          :src="require('../assets/img/loginIcon.png')"
          rel="external nofollow"
        />
      </div>
      <div>智能议案建议辅助工具</div>
      <div>政务微信账号登录</div>
    </div>
    <div class="account-box">
      <van-form @submit="onSubmit" validate-trigger="onSubmit">
        <van-field
          v-model="username"
          name="userName"
          id="name"
          label="账号"
          placeholder="请输入账号"
          left-icon="manager"
          :rules="[{ required: true, message: '请输入账号' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          id="password"
          label="密码"
          placeholder="请输入密码"
          left-icon="lock"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
        <div class="btn-box">
          <van-button
            block
            class="btn-color-2 btn-size-1"
            native-type="submit"
            :disabled="username.length === 0 || password.length === 0"
            >登录</van-button
          >
        </div>
      </van-form>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { login } from '../api/login'

export default {
  data() {
    return {
      username: '',
      password: ''
    }
  },
  mounted() {
    let h = window.innerHeight
    let nameInput = document.getElementById('name')
    let pwdInput = document.getElementById('password')
    let bodyHeight = document.getElementsByClassName('login')
    nameInput.addEventListener('focus', handler, false)
    pwdInput.addEventListener('focus', handler, false)
    function handler() {
      bodyHeight[0].style.height = h + 'px'
    }
  },
  methods: {
    ...mapActions(['setUserInfo']),
    onSubmit(userInfo) {
      let toast = this.$toast.loading({
        duration: 0, // 持续展示 toast
        forbidClick: true
      })
      login(userInfo)
        .then(res => {
          toast.clear()
          if (res && res.code === 0) {
            this.setUserInfo(res.data)
            localStorage.setItem('userInfo', JSON.stringify(res.data))
            this.$router.replace('/selectOperation')
          } else {
            this.$toast({
              message: (res && res.message) || '登录失败，请检查账号密码',
              position: 'bottom'
            })
          }
        })
        .catch(function (err) {
          toast.clear()
          var msg = '网络异常，请检查连接后重试'
          if (err && err.response) {
            if (err.response.status === 401 || err.response.status === 403) msg = '账号或密码错误'
            else if (err.response.status >= 500) msg = '服务异常，请稍后重试'
          } else if (err && err.code === 'ECONNABORTED') {
            msg = '请求超时，请稍后重试'
          }
          this.$toast({ message: msg, position: 'bottom' })
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.login {
  // position:absolute;
  // height: 100%;
  background: url('../assets/img/loginBackImg.png') center center no-repeat;
  background-size: cover;
  .login-title {
    text-align: center;
    margin-top: 5rem;
    &>div:nth-child(2){
      font-size: 1.5rem;
      line-height: 2.5rem;
      font-weight: 700;
      color: #5B5B5B;
      letter-spacing: 0.2rem;
    }
    &>div:last-child{
      text-align: left;
      width:44%;
      margin-left: 28%;
      margin-top:2rem;
      color:#E40001;
      font-size: 1.1rem;
      font-weight: 600;
    }
  }
  .account-box{
    width:50%;
    margin:0 auto;
    .van-cell::after {
      border-bottom: 2px solid #dddddd;
    }
    .van-cell {
      padding: 32px 35px 12px 35px;
      background-color: transparent;
      ::v-deep.van-field__control{
        background-color: transparent!important;
      }
    }
    .btn-box {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 1.5rem;
      .van-button--disabled{
        background-color: #EDEFF2;
        color:#C0C2CC
      }
    }
  }
}
</style>
