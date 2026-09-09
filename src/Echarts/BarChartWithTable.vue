<template>
  <div class="grouped-bar-percent-chart">
    <div ref="chartRef" class="chart-canvas" :style="{ height: chartHeight + 'px' }"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'GroupedBarPercentChart',
  props: {
    chartName: {
      type: String,
      default: ''
    },
    chartHeight: {
      type: Number,
      default: 620
    },
    years: {
      type: Array,
      default: function() {
        return ['2020年', '2021年', '2022年', '2023年', '2024年']
      }
    },
    seriesData: {
      type: Array,
      default: function() {
        return [
          { name: '社会组织', color: '#5B9BD5', data: [8.9, 5.4, 5.9, 10.1, 6.2] },
          { name: '社会救助', color: '#ED7D31', data: [8.9, 7.3, 4.7, 5.6, 11.0] },
          { name: '区划地名', color: '#A5A5A5', data: [3.1, 3.7, 2.0, 2.7, 1.8] },
          { name: '社会事务', color: '#FFC000', data: [7.6, 8.1, 10.2, 11.7, 9.3] },
          { name: '养老服务', color: '#4472C4', data: [28.6, 33.5, 43.1, 56.3, 59.3] },
          { name: '儿童福利', color: '#70AD47', data: [5.9, 9.6, 9.6, 5.1, 8.0] },
          { name: '慈善事业', color: '#255E91', data: [10.7, 9.6, 8.5, 8.3, 4.1] },
          { name: '社区治理', color: '#9E480E', data: [26.3, 22.8, 16.0, 0, 0] }
        ]
      }
    },
    showDataLabel: {
      type: Boolean,
      default: true
    },
    yAxisMin: {
      type: Number,
      default: 0
    },
    yAxisMax: {
      type: Number,
      default: null
    },
    yAxisInterval: {
      type: Number,
      default: null
    },
    valueSuffix: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      chartInstance: null
    }
  },
  computed: {
    normalizedSeries() {
      const fallbackColors = ['#5B9BD5', '#ED7D31', '#A5A5A5', '#FFC000', '#4472C4', '#70AD47', '#255E91', '#9E480E']
      return this.seriesData.map(function(item, index) {
        return {
          name: item.name,
          color: item.color || fallbackColors[index % fallbackColors.length],
          data: Array.isArray(item.data) ? item.data : []
        }
      })
    },
    flattenedNumericValues() {
      return this.normalizedSeries.reduce(function(result, item) {
        const values = Array.isArray(item.data) ? item.data : []
        values.forEach(function(value) {
          const numeric = Number(value)
          if (!Number.isNaN(numeric)) {
            result.push(numeric)
          }
        })
        return result
      }, [])
    },
    // 动态柱宽与间距
    // 动态柱宽（像素）：x轴数量 ≤ 6 时固定 24px，否则线性减小
    dynamicBarWidth() {
      const count = this.years.length
      if (count <= 6) return 24
      if (count <= 10) return 18
      if (count <= 15) return 14
      return 10
    },

    // 动态系列间间距（百分比，相对柱宽）
    dynamicBarGap() {
      const count = this.years.length
      if (count <= 6) return 0.3
      if (count <= 10) return 0.2
      return 0.1
    },

    // 优化后的 y 轴最大值（增加顶部留白）
    resolvedYAxisMax() {
      if (typeof this.yAxisMax === 'number' && !Number.isNaN(this.yAxisMax)) {
        return this.yAxisMax
      }
      const numericMax = this.flattenedNumericValues.length ? Math.max.apply(null, this.flattenedNumericValues) : 0
      if (numericMax <= 0) return 10
      // 增加 10% 的留白，使最高柱不顶天
      const maxWithPadding = numericMax * 1.1
      const roughStep = maxWithPadding / 5
      const magnitude = Math.pow(10, Math.max(0, Math.floor(Math.log10(roughStep))))
      const normalizedStep = roughStep / magnitude
      let stepBase = 1
      if (normalizedStep > 5) stepBase = 10
      else if (normalizedStep > 2) stepBase = 5
      else if (normalizedStep > 1) stepBase = 2
      const step = stepBase * magnitude
      return Math.ceil(maxWithPadding / step) * step
    },

    // 优化后的 y 轴间隔（美观取整，最小为 1 避免刻度重复）
    resolvedYAxisInterval() {
      if (typeof this.yAxisInterval === 'number' && this.yAxisInterval > 0) {
        return this.yAxisInterval
      }
      const span = this.resolvedYAxisMax - this.yAxisMin
      if (span <= 0) return 1
      // 期望 5 个刻度区间
      let interval = span / 5
      // 取整到 1, 2, 5, 10 的倍数
      const power = Math.pow(10, Math.floor(Math.log10(interval)))
      const residual = interval / power
      let nice
      if (residual < 1.5) nice = power
      else if (residual < 3.5) nice = 2 * power
      else if (residual < 7.5) nice = 5 * power
      else nice = 10 * power
      // 纵坐标显示整数，间隔至少为 1
      if (nice < 1) nice = 1
      return nice
    }
  },
  watch: {
    years() {
      this.renderChart()
    },
    seriesData: {
      deep: true,
      handler() {
        this.renderChart()
      }
    },
    showDataLabel() {
      this.renderChart()
    },
    yAxisMin() {
      this.renderChart()
    },
    yAxisMax() {
      this.renderChart()
    },
    yAxisInterval() {
      this.renderChart()
    },
    valueSuffix() {
      this.renderChart()
    }
  },
  mounted() {
    this.initChart()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.disposeChart()
  },
  methods: {
    initChart() {
      if (!this.$refs.chartRef) {
        return
      }
      this.chartInstance = echarts.init(this.$refs.chartRef)
      this.renderChart()
    },
    renderChart() {
      if (!this.chartInstance) {
        return
      }
      this.chartInstance.setOption(this.buildOption(), true)
    },
    buildOption() {
      const isRotate = this.shouldRotateXAxisLabel
      const rotateAngle = this.xAxisLabelRotate
      const axisLabelConfig = {
        color: '#666',
        fontSize: 14,
        interval: 0,
        formatter: function(value) {
          return String(value).split('').join('\n')
        }
      }
      return {
        color: this.normalizedSeries.map(item => item.color),
        backgroundColor: 'transparent',
        title: this.chartName ? {
          text: this.chartName,
          left: 'center',
          bottom: 0,
          textStyle: { fontSize: 14, color: '#333', fontWeight: 500 }
        } : null,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: params => {
            const lines = [params[0].axisValue]
            params.forEach(item => {
              lines.push(item.marker + item.seriesName + '：' + this.formatBarLabel(item.value))
            })
            return lines.join('<br/>')
          }
        },
        legend: {
          bottom: 30,
          itemWidth: 10,
          itemHeight: 10,
          textStyle: {
            color: '#666',
            fontSize: 14
          },
          data: this.normalizedSeries.map(item => item.name)
        },
        grid: {
          left: 58,
          right: 20,
          top: 24,
          bottom: 190
        },
        xAxis: {
          type: 'category',
          data: this.years,
          axisLine: {
            lineStyle: {
              color: '#c7c7c7'
            }
          },
          axisTick: {
            alignWithLabel: true
          },
          axisLabel: axisLabelConfig
        },
        yAxis: {
          type: 'value',
          min: this.yAxisMin,
          max: this.resolvedYAxisMax,
          interval: this.resolvedYAxisInterval,
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#cfcfcf', width: 1 } },
          axisLabel: {
            color: '#666',
            formatter: value => {
              const numeric = Math.round(Number(value))
              return Number.isNaN(numeric) ? '' : numeric + this.valueSuffix
            }
          }
        },
        series: this.normalizedSeries.map(item => ({
          name: item.name,
          type: 'bar',
          barWidth: this.dynamicBarWidth, // 动态柱宽
          barGap: this.dynamicBarGap, // 系列间间距
          itemStyle: { color: item.color },
          label: {
            show: this.showDataLabel,
            position: 'top',
            color: '#4f4f4f',
            fontSize: 12,
            formatter: params => this.formatBarLabel(params.value)
          },
          emphasis: { focus: 'series' },
          data: item.data
        }))
      }
    },
    formatBarLabel(value) {
      const numeric = Number(value)
      if (Number.isNaN(numeric)) {
        return '-'
      }
      if (numeric % 1 === 0) {
        return numeric + this.valueSuffix
      }
      return numeric.toFixed(2) + this.valueSuffix
    },
    handleResize() {
      if (this.chartInstance) {
        this.chartInstance.resize()
      }
    },
    disposeChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose()
        this.chartInstance = null
      }
    }
  }
}
</script>

<style scoped>
.grouped-bar-percent-chart {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #999;
  box-sizing: border-box;
}

.chart-canvas {
  width: 100%;
}
</style>
