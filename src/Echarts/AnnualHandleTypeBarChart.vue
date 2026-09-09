<template>
  <div class="annual-handle-type-bar-chart">
    <div ref="chartRef" class="chart-canvas" :style="{ height: chartHeight + 'px' }"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'AnnualHandleTypeBarChart',
  props: {
    chartName: {
      type: String,
      default: ''
    },
    chartHeight: {
      type: Number,
      default: 460
    },
    years: {
      type: Array,
      default: function() {
        // return ['2020', '2021', '2022', '2023', '2024']
        return ['2020']
      }
    },
    seriesData: {
      type: Array,
      default: function() {
        return [
          // { name: '主办（独办、分办）', color: '#4F81BD', data: [250, 257, 270, 215, 232] },
          // { name: '协办、会办', color: '#C0504D', data: [384, 356, 340, 215, 194] },
          // { name: '参阅', color: '#9BBB59', data: [89, 115, 107, 43, 28] }
          { name: '主办（独办、分办）', color: '#4F81BD', data: [250] },
          { name: '协办、会办', color: '#C0504D', data: [384] },
          { name: '参阅', color: '#9BBB59', data: [89] }
        ]
      }
    }
  },
  data() {
    return {
      chartInstance: null
    }
  },
  computed: {
    normalizedSeries() {
      const fallbackColors = ['#4F81BD', '#C0504D', '#9BBB59']
      console.log('this.seriesData:', this.seriesData)
      return this.seriesData.map(function(item, index) {
        return {
          name: item.name,
          color: item.color || fallbackColors[index % fallbackColors.length],
          data: Array.isArray(item.data) ? item.data : []
        }
      })
    }
  },
  watch: {
    years() {
      // this.renderChart()
      this.years
    },
    seriesData: {
      deep: true,
      handler() {
        this.renderChart()
      }
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
    buildOption() {
      return {
        color: this.normalizedSeries.map(item => item.color),
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
          }
        },
        legend: {
          bottom: 35,
          itemWidth: 14,
          itemHeight: 14,
          textStyle: {
            color: '#666',
            fontSize: 18
          },
          data: this.normalizedSeries.map(item => item.name)
        },
        grid: {
          left: 70,
          right: 28,
          top: 28,
          bottom: 145
        },
        xAxis: {
          type: 'category',
          data: this.years,
          axisTick: {
            alignWithLabel: true
          },
          axisLine: {
            lineStyle: {
              color: '#d8d8d8'
            }
          },
          axisLabel: {
            color: '#666',
            fontSize: 16,
            margin: 16
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 450,
          interval: 50,
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#7a7a7a',
            fontSize: 14
          },
          splitLine: {
            lineStyle: {
              color: '#e6e6e6'
            }
          }
        },
        series: this.normalizedSeries.map(item => {
          return {
            name: item.name,
            type: 'bar',
            barWidth: 38,
            barGap: '22%',
            label: {
              show: true,
              position: 'top',
              color: '#555',
              fontSize: 15
            },
            emphasis: {
              focus: 'series'
            },
            data: item.data
          }
        })
      }
    },
    renderChart() {
      if (!this.chartInstance) {
        return
      }
      this.chartInstance.setOption(this.buildOption(), true)
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
.annual-handle-type-bar-chart {
  width: 100%;
  border: 2px solid #999;
}

.chart-canvas {
  width: 100%;
}
</style>
