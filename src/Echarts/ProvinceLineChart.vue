<template>
  <div class="province-line-chart" :style="rootStyleVars">
    <div ref="chartRef" class="chart-canvas" :style="{ height: chartHeight + 'px' }"></div>

    <div class="data-table-wrap">
      <table class="data-table">
        <tbody>
          <tr v-for="item in normalizedSeries" :key="item.name">
            <td class="series-col">
              <span class="series-line" :style="{ backgroundColor: item.color }"></span>
              {{ item.name }}
            </td>
            <td v-for="(province, index) in provinces" :key="item.name + '-' + province">
              {{ formatCellValue(item.data[index]) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ProvinceLineChart',
  props: {
    chartName: {
      type: String,
      default: ''
    },
    chartHeight: {
      type: Number,
      default: 500
    },
    provinces: {
      type: Array,
      default: function() {
        return [
          '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '上海', '江苏',
          '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西',
          '海南', '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏',
          '新疆', '香港', '澳门', '台湾'
        ]
      }
    },
    seriesData: {
      type: Array,
      default: function() {
        return [
          {
            name: '2020',
            color: '#4F81BD',
            data: [48, 11, 42, 16, 7, 13, 7, 16, 22, 40, 31, 20, 19, 24, 40, 23, 28, 38, 28, 7, 3, 9, 27, 22, 18, 0, 21, 3, 4, 1, 5, 20, 10, 0]
          },
          {
            name: '2021',
            color: '#C0504D',
            data: [65, 11, 38, 15, 10, 10, 12, 10, 18, 50, 37, 40, 14, 25, 32, 38, 24, 33, 35, 12, 4, 10, 36, 15, 22, 0, 24, 1, 4, 4, 7, 17, 9, 0]
          },
          {
            name: '2022',
            color: '#9BBB59',
            data: [64, 7, 35, 17, 10, 19, 7, 11, 25, 47, 35, 24, 14, 21, 35, 40, 25, 28, 36, 18, 4, 14, 18, 13, 10, 0, 31, 2, 3, 5, 3, 18, 7, 1]
          },
          {
            name: '2023',
            color: '#8064A2',
            data: [39, 8, 30, 18, 7, 10, 8, 7, 11, 31, 21, 14, 11, 8, 23, 28, 12, 17, 14, 8, 4, 15, 18, 10, 4, 0, 26, 6, 2, 5, 2, 15, 7, 6]
          },
          {
            name: '2024',
            color: '#4BACC6',
            data: [11, 2, 24, 18, 4, 13, 5, 9, 12, 25, 16, 21, 10, 11, 33, 30, 13, 19, 21, 10, 5, 10, 29, 7, 14, 2, 17, 4, 2, 1, 2, 19, 4, 5]
          }
        ]
      }
    }
  },
  data() {
    return {
      chartInstance: null,
      seriesColWidth: 78
    }
  },
  computed: {
    rootStyleVars() {
      return {
        '--series-col-width': this.seriesColWidth + 'px'
      }
    },
    normalizedSeries() {
      const fallbackColors = ['#4F81BD', '#C0504D', '#9BBB59', '#8064A2', '#4BACC6']
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
    provinces() {
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
      return {
        backgroundColor: 'transparent',
        color: this.normalizedSeries.map(function(item) {
          return item.color
        }),
        title: this.chartName ? {
          text: this.chartName,
          left: 'center',
          bottom: 0,
          textStyle: { fontSize: 14, color: '#333', fontWeight: 500 }
        } : null,
        legend: {
          top: 12,
          itemWidth: 52,
          itemHeight: 3,
          textStyle: {
            color: '#666',
            fontSize: 14
          },
          data: this.normalizedSeries.map(function(item) {
            return item.name
          })
        },
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: this.seriesColWidth,
          right: 4,
          top: 56,
          bottom: 50
        },
        xAxis: {
          type: 'category',
          boundaryGap: true,
          data: this.provinces,
          axisLine: {
            lineStyle: {
              color: '#d0d0d0'
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            interval: 0,
            rotate: 0,
            color: '#888',
            margin: 12,
            fontSize: 12,
            align: 'center',
            verticalAlign: 'middle',
            formatter: function(value) {
              return value.split('').join('\n')
            }
          }
        },
        yAxis: {
          type: 'value',
          min: -5,
          max: 70,
          interval: 15,
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: '#e3e3e3'
            }
          },
          axisLabel: {
            color: '#7a7a7a',
            fontSize: 12
          }
        },
        series: this.normalizedSeries.map(function(item) {
          return {
            name: item.name,
            type: 'line',
            smooth: false,
            showSymbol: false,
            lineStyle: {
              width: 4
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
    formatCellValue(value) {
      const numeric = Number(value)
      if (Number.isNaN(numeric)) {
        return '-'
      }
      return numeric
    }
  }
}
</script>

<style scoped>
.province-line-chart {
  width: 100%;
  border: 2px solid #999;
}

.chart-canvas {
  width: 100%;
}

.data-table-wrap {
  margin-top: 0;
  overflow-x: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
  color: #666;
}

.data-table th,
.data-table td {
  border-top: 1px solid #d9d9d9;
  border-bottom: 1px solid #d9d9d9;
  text-align: center;
  padding: 4px 2px;
}

.series-col {
  width: var(--series-col-width);
  text-align: left !important;
  padding-left: 0 !important;
  white-space: nowrap;
}

.data-table tbody td {
  height: 28px;
  line-height: 1;
}

.series-line {
  display: inline-block;
  width: 18px;
  height: 3px;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 2px;
}
</style>
