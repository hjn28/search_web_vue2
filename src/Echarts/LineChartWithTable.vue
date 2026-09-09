<template>
  <div class="line-chart-with-table">
    <div ref="chartRef" class="chart-canvas" :style="{ height: chartHeight + 'px' }"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'LineChartWithTable',
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
          { name: '人大建议', color: '#4A86C5', data: [413, 451, 387, 289, 311] },
          { name: '政协提案', color: '#C0504D', data: [210, 231, 260, 156, 117] },
          { name: '建议提案总数', color: '#89B34A', data: [623, 682, 647, 445, 428] }
        ]
      }
    },
    seriesMeanings: {
      type: Object,
      default: function() {
        return {
          人大建议: '人大建议数量',
          政协提案: '政协提案数量',
          建议提案总数: '人大建议与政协提案总量'
        }
      }
    },
    chartHeight: {
      type: Number,
      default: 420
    },
    showDataLabel: {
      type: Boolean,
      default: true
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
          color: item.color || ['#4A86C5', '#C0504D', '#89B34A'][index % 3],
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
    buildOption() {
      const legendNames = this.normalizedSeries.map(item => item.name)
      return {
        color: this.normalizedSeries.map(item => item.color),
        title: this.chartName ? {
          text: this.chartName,
          left: 'center',
          bottom: 0,
          textStyle: { fontSize: 14, color: '#333', fontWeight: 500 }
        } : null,
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          bottom: 28,
          data: legendNames,
          itemWidth: 32,
          itemHeight: 4
        },
        grid: {
          left: 54,
          right: 26,
          top: 30,
          bottom: 130
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.years,
          axisLine: {
            lineStyle: {
              color: '#C7C7C7'
            }
          },
          axisLabel: {
            color: '#666',
            formatter: function(value) {
              return String(value).split('').join('\n')
            }
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          splitLine: {
            lineStyle: {
              color: '#DFDFDF'
            }
          },
          axisLabel: {
            color: '#666'
          }
        },
        series: this.normalizedSeries.map(item => {
          return {
            name: item.name,
            type: 'line',
            smooth: false,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              width: 4
            },
            label: {
              show: this.showDataLabel,
              position: 'top',
              color: '#2B4A6B',
              fontSize: 14
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
    },
    getCellValue(data, index) {
      if (!Array.isArray(data) || typeof data[index] === 'undefined') {
        return '-'
      }
      return data[index]
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
.line-chart-with-table {
  width: 100%;
  border: 2px solid #999;
}

.chart-canvas {
  width: 100%;
}

.data-table-wrap {
  margin-top: 10px;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 16px;
  color: #2b4a6b;
}

.data-table th,
.data-table td {
  border: 1px solid #d5d5d5;
  text-align: center;
  padding: 8px 6px;
}

.series-col {
  width: 160px;
  text-align: left;
  padding-left: 16px;
}

.series-line {
  display: inline-block;
  width: 48px;
  height: 4px;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 8px;
}

.meaning-wrap {
  margin-top: 12px;
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
</style>
