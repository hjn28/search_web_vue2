<template>
  <div class="line-percent-chart">
    <div ref="chartRef" class="chart-canvas" :style="{ height: chartHeight + 'px' }"></div>
    <div class="meaning-wrap" v-if="showMeaning">
      <div class="meaning-item" v-for="item in normalizedSeries" :key="item.name + '-meaning'">
        <span class="series-line" :style="{ backgroundColor: item.color }"></span>
        <span>{{ formatSeriesMeaning(item.name) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'LinePercentChart',
  props: {
    chartName: {
      type: String,
      default: ''
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
          { name: '人大建议同比', color: '#4A86C5', data: [4.5, 5.02, 4.21, 3.48, 3.37] },
          { name: '政协提案同比', color: '#C0504D', data: [4.33, 4.68, 5.22, 3.33, 2.34] }
        ]
      }
    },
    seriesMeanings: {
      type: Object,
      default: function() {
        return {
          人大建议同比: '人大建议同比增长率',
          政协提案同比: '政协提案同比增长率'
        }
      }
    },
    chartHeight: {
      type: Number,
      default: 380
    },
    showMeaning: {
      type: Boolean,
      default: false
    },
    yAxisMin: {
      type: Number,
      default: 0
    },
    yAxisMax: {
      type: Number,
      default: 6
    }
  },
  data() {
    return {
      chartInstance: null
    }
  },
  computed: {
    normalizedSeries() {
      return this.seriesData.map(function(item, index) {
        return {
          name: item.name,
          color: item.color || ['#4A86C5', '#C0504D'][index % 2],
          data: Array.isArray(item.data) ? item.data : []
        }
      })
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
    normalizePercentNumber(value) {
      if (value === null || typeof value === 'undefined') {
        return NaN
      }
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) {
          return NaN
        }
        if (trimmed.indexOf('%') > -1) {
          const pure = Number(trimmed.replace('%', ''))
          return Number.isNaN(pure) ? NaN : pure
        }
        const numeric = Number(trimmed)
        if (Number.isNaN(numeric)) {
          return NaN
        }
        return Math.abs(numeric) <= 1 ? numeric * 100 : numeric
      }

      const num = Number(value)
      if (Number.isNaN(num)) {
        return NaN
      }
      return Math.abs(num) <= 1 ? num * 100 : num
    },
    formatPercent(value) {
      const num = this.normalizePercentNumber(value)
      if (Number.isNaN(num)) {
        return '0.00%'
      }
      return num.toFixed(2) + '%'
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
          valueFormatter: value => this.formatPercent(value)
        },
        legend: {
          bottom: 30,
          data: this.normalizedSeries.map(item => item.name),
          itemWidth: 42,
          itemHeight: 4,
          textStyle: {
            color: '#2B4A6B',
            fontSize: 16
          }
        },
        grid: {
          left: 90,
          right: 28,
          top: 26,
          bottom: 150
        },
        xAxis: {
          type: 'category',
          // Keep half-step padding on both sides to avoid overlap with y-axis labels.
          boundaryGap: true,
          data: this.years,
          axisTick: {
            show: false
          },
          axisLine: {
            lineStyle: {
              color: '#C7C7C7',
              width: 2
            }
          },
          axisLabel: {
            color: '#2B4A6B',
            fontSize: 18,
            margin: 22,
            formatter: function(value) {
              return String(value).split('').join('\n')
            }
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#CFCFCF',
              width: 1
            }
          }
        },
        yAxis: {
          type: 'value',
          min: this.yAxisMin,
          max: this.yAxisMax,
          interval: 1,
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#2B4A6B',
            fontSize: 18,
            formatter: value => Math.round(value) + '%'
          },
          splitLine: {
            show: false
          }
        },
        series: this.normalizedSeries.map(item => {
          return {
            name: item.name,
            type: 'line',
            smooth: false,
            symbol: 'none',
            lineStyle: {
              width: 5
            },
            label: {
              show: true,
              formatter: params => this.formatPercent(params.value),
              color: '#2B4A6B',
              fontSize: 18,
              distance: 12
            },
            labelLayout: {
              moveOverlap: 'shiftY'
            },
            data: item.data.map(value => this.normalizePercentNumber(value))
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
    },
    getSeriesMeaning(name) {
      return this.seriesMeanings[name] || name
    },
    formatSeriesMeaning(name) {
      const meaning = this.getSeriesMeaning(name)
      if (!meaning || meaning === name) return name
      return `${name}：${meaning}`
    }
  }
}
</script>

<style scoped>
.line-percent-chart {
  width: 100%;
  border: 2px solid #999;
}

.chart-canvas {
  width: 100%;
}

.meaning-wrap {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  color: #2b4a6b;
  font-size: 15px;
}

.meaning-item {
  display: flex;
  align-items: center;
}

.series-line {
  display: inline-block;
  width: 48px;
  height: 4px;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 8px;
}
</style>
