<template>
  <div>
    <canvas id="myCanvas" :width="parentClientWidth + 'px'" :height="parentClientHeight + 'px'"></canvas>
  </div>
</template>

<script>
export default {
  // 接收数据
  props: ['parentClientWidth', 'parentClientHeight', 'dataList'],

  data() {
    return {
      dataListCopy: this.dataList
    }
  },

  created() {
    this.$nextTick(() => {
      this.initCircle()
      // 初始化
      this.initCanvas()
    })
  },

  watch: {
    dataList(newValue) {
      this.dataListCopy = newValue
      let myCanvas = document.getElementById('myCanvas')
      let ctx = myCanvas.getContext('2d')
      ctx.clearRect(0, 0, myCanvas.width, myCanvas.height)
      this.initCircle()
      this.initCanvas()
    }
  },
  methods: {
    // 绘制同心圆
    initCircle() {
      let myCanvas = document.getElementById('myCanvas')
      let ctx = myCanvas.getContext('2d')
      let w = myCanvas.width
      let h = myCanvas.height
      ctx.lineWidth = 40
      let colorList = ['rgba(255,250,250,0.6)', 'rgb(252,228,228)', 'rgba(255,252,252,0.5)', 'rgba(253,234,234,0.6)', 'rgba(250,211,211,0.6)', 'rgba(236,50,51,0.5)']
      let circleWidth = 550
      for (let r = 0; r <= 5; r++) {
        ctx.beginPath() // 起始路径
        ctx.fillStyle = colorList[r] // 返回填充的颜色
        // 创建弧或曲线
        if (r === 1) {
          ctx.arc(w / 2, h / 2, 381, 0, 2 * Math.PI, true)
        } else if (r < 1) {
          ctx.arc(w / 2, h / 2, circleWidth - (r + 1) * 85, 0, 2 * Math.PI, true)
        } else {
          ctx.arc(w / 2, h / 2, circleWidth - r * 85, 0, 2 * Math.PI, true)
        }
        ctx.fill() // 填充颜色
      }
    },
    // 绘制圆形热词
    initCanvas() {
      let that = this
      let colorList = [
        { inner: '#E40001', outer: '#F27F7F' },
        { inner: '#FF6100', outer: '#FEAC7F' },
        { inner: '#FFA34F', outer: '#FFD3AC' },
        { inner: '#3D80FF', outer: '#A6C3FD' },
        { inner: '#0CD09D', outer: '#90E7CF' },
        { inner: '#8F5EFF', outer: '#CCB3FD' }
      ]
      class Circle {
        constructor(x, y, r) {
          let color = this.getRandomColor()
          this.x = x
          this.y = y
          this.r = r
          this.in = color.inner
          this.out = color.outer
        }

        // 随机颜色
        getRandomColor() {
          let randomIndex = Math.floor(Math.random() * colorList.length)
          let randomColor = colorList[randomIndex]
          colorList.splice(randomIndex, 1)
          return randomColor
        }
      }

      class RandomCircle {
        constructor(obj) {
          this.c = document.getElementById(obj.id)

          this.ctx = this.c.getContext('2d')
          this.dWidth = this.c.width
          this.dHeight = this.c.height

          this.minMargin = obj.minMargin || 20 // 两个圆的最短距离，默认为10
          this.minRadius = obj.minRadius || 50 // 最小的圆半径，默认为50
          this.radiuArr = obj.radiuArr // 圆的半径的数组，当fix为true时该值必须填

          this.total = 5 // 圆的个数，默认为5

          this.circleArray = []
          this.circleNumber = 1
        }

        drawOneCircle(c, data) {
          let ctx = this.ctx
          ctx.beginPath()
          ctx.strokeStyle = c.out
          ctx.fillStyle = c.in
          // 画圆
          ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI)

          ctx.stroke()
          ctx.fill()

          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#333'
          ctx.font = that.parentClientWidth < 1000 ? '0.8rem 微软雅黑' : '1rem 微软雅黑'
          ctx.fillText(data.topic, c.x, c.y) // 圆内文字

          this.circleNumber++
        }

        check(x, y, r) {
          return !(
            x + r > this.dWidth ||
            x - r < 0 ||
            y + r > this.dHeight ||
            y - r < 0
          )
        }

        // 获取一个新圆的半径，主要判断半径与最近的一个圆的距离
        getR(x, y) {
          if (this.circleArray.length === 0) return that.parentClientWidth < 1000 ? 50 : 95

          let lenArr = this.circleArray.map(c => {
            let xSpan = c.x - x
            let ySpan = c.y - y
            return (
              Math.floor(Math.sqrt(Math.pow(xSpan, 2) + Math.pow(ySpan, 2))) -
              c.r
            )
          })

          let minCircleLen = Math.min(...lenArr)
          let minC = this.circleArray[lenArr.indexOf(minCircleLen)]
          let tempR = this.radiuArr[this.circleArray.length]
          let bool = tempR <= minCircleLen - minC.r

          return bool ? tempR : false
        }

        // 生成一个圆，随机生成圆心。
        // 如果连续生成200次半径都没有合适的话，终止进程
        createOneCircle() {
          let x, y, r
          let createCircleTimes = 0
          let minX = that.parentClientWidth < 1000 ? 200 : 600
          let maxX = that.parentClientWidth < 1000 ? 700 : 1400
          let minY = that.parentClientHeight < 1000 ? 50 : 100
          let maxY = that.parentClientHeight < 1000 ? 400 : 850
          while (true) {
            createCircleTimes++

            // x = Math.floor(Math.random() * this.dWidth)
            // y = Math.floor(Math.random() * this.dHeight)
            x = Math.random() * (maxX - minX) + minX
            y = Math.random() * (maxY - minY) + minY

            let TR = this.getR(x, y)
            if (!TR) {
              continue
            } else {
              r = TR
            }

            if (this.check(x, y, r) || createCircleTimes > 200) {
              break
            }
          }

          this.check(x, y, r) && this.circleArray.push(new Circle(x, y, r))
        }

        // 如果生成100次新圆都失败的话，终止方案。
        // 如果生成100种方案都没有合适可用的话，终止进程。
        init() {
          let n = 0
          while (this.circleArray.length < this.total) {
            this.circleArray = []

            let i = 0
            while (this.circleArray.length < this.total) {
              this.createOneCircle()
              i++
              if (i >= 100) {
                break
              }
            }

            n++

            if (n > 100) {
              break
            }
          }

          // 根据半径从大到小画圆。
          this.circleArray
            .sort((a, b) => b.r - a.r)
            .forEach((c, index) => {
              this.drawOneCircle(c, that.dataListCopy[index])
            })
        }
      }

      const p = new RandomCircle({
        id: 'myCanvas',
        total: that.dataListCopy.length, // 配置数量
        radiuArr: this.parentClientWidth < 1000 ? [40, 40, 40, 40, 40] : [85, 80, 75, 70, 65]
      })

      p.init()
    }
  }
}
</script>
