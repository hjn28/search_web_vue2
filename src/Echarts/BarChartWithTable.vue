<template>
  <div class="grouped-bar-percent-chart">
    <div ref="chartRef" class="chart-canvas" :style="{ height: resolvedChartHeight + 'px' }"></div>
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
    resolvedChartHeight() {
      const count = this.years.length
      if (count <= 3) return 300
      if (count <= 10) return 400
      if (count <= 20) return 450
      return 500
    },
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
    yAxisScale() {
      const values = this.normalizedSeries.reduce((result, item) => {
        const data = Array.isArray(item.data) ? item.data : []
        data.forEach(value => {
          const numeric = Number(value)
          if (Number.isFinite(numeric)) result.push(numeric)
        })
        return result
      }, [])
      const dataMax = values.length ? Math.max(0, ...values) : 0
      const rawInterval = dataMax / 4
      const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(rawInterval, 0.1))))
      const normalized = rawInterval / magnitude
      let stepUnit = 1
      if (normalized > 5) stepUnit = 10
      else if (normalized > 2) stepUnit = 5
      else if (normalized > 1) stepUnit = 2
      const interval = Math.max(1, Math.round(stepUnit * magnitude))
      const max = Math.max(interval, Math.ceil(dataMax / interval) * interval)
      return { interval, max }
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
  },
  watch: {
    resolvedChartHeight() {
      this.$nextTick(this.handleResize)
    },
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
          max: this.yAxisScale.max,
          interval: this.yAxisScale.interval,
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#cfcfcf', width: 1 } },
          axisLabel: {
            color: '#666',
            formatter: value => {
              const numeric = Number(value)
              if (!Number.isFinite(numeric) || Math.abs(numeric - Math.round(numeric)) > 0.0001) return ''
              return Math.round(numeric) + this.valueSuffix
            }
          }
        },
        series: this.normalizedSeries.map(item => ({
          name: item.name,
          type: 'bar',
          barWidth: this.dynamicBarWidth, // 动态柱宽
          barMaxWidth: 40,
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
