<template>
  <div class="map-chart">
    <div ref="chartRef" class="chart-canvas" :style="{ height: chartHeight + 'px' }"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import mapJson from './map.json'

var CLEAN_MAP_NAME = 'china_no_south_sea'

/**
 * 过滤掉南海诸岛（name 为空字符串的 feature），避免右下角小窗显示
 */
var cleanedMapJson = JSON.parse(JSON.stringify(mapJson))
if (Array.isArray(cleanedMapJson.features)) {
  cleanedMapJson.features = cleanedMapJson.features.filter(function (f) {
    if (!f || !f.properties) return false
    var featureName = String(f.properties.name || '').trim()
    // 同时兼容空名称和显式“南海诸岛”名称
    return featureName !== '' && featureName !== '南海诸岛'
  })
}

/**
 * 地图分段色阶
 */
var PIECES = [
  { min: 0, max: 4, label: '0 - 4', color: '#fef0d9' },
  { min: 4, max: 10, label: '5 - 10', color: '#fdd49e' },
  { min: 10, max: 15, label: '10 - 15', color: '#fdae61' },
  { min: 15, max: 20, label: '15 - 20', color: '#f46d43' },
  { min: 20, label: '20+', color: '#d73027' }
]

function getPieceColor(value) {
  for (var i = 0; i < PIECES.length; i++) {
    var p = PIECES[i]
    if (value >= p.min && (p.max == null || value < p.max)) {
      return p.color
    }
  }
  return '#e0e0e0'
}

/** 省份简称列表（用于判断是否为地理数据） */
var PROVINCE_SHORT_NAMES = [
  '北京', '天津', '河北', '山西', '内蒙古',
  '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆',
  '香港', '澳门', '台湾'
]

function normalizeProvinceName(name) {
  var n = String(name || '').trim()
  if (!n) return ''
  // 常见行政区后缀统一为简称，便于与 GeoJSON 中省份名称匹配
  return n
    .replace(/特别行政区$/g, '')
    .replace(/维吾尔自治区$/g, '')
    .replace(/壮族自治区$/g, '')
    .replace(/回族自治区$/g, '')
    .replace(/自治区$/g, '')
    .replace(/省$/g, '')
    .replace(/市$/g, '')
}

export default {
  name: 'MapChart',
  props: {
    chartName: { type: String, default: '' },
    chartHeight: { type: Number, default: 620 },
    titleText: { type: String, default: '' },
    /** 标准图表数据：系列名称 → 数据数组 */
    seriesData: {
      type: Array,
      default: function () { return [] }
    },
    /** 标准图表数据：坐标轴标签（省份名或分类名） */
    years: {
      type: Array,
      default: function () { return [] }
    },
    /** 兼容旧版：直接传入 {name, value} 数组 */
    mapData: {
      type: Array,
      default: function () { return [] }
    }
  },
  data: function () {
    return { chartInstance: null, isMapReady: false }
  },
  computed: {
    /** 最终归一化的地图/图表数据 */
    normalizedData: function () {
      // 优先使用直接传入的 mapData
      if (Array.isArray(this.mapData) && this.mapData.length) {
        return this.mapData.map(function (item) {
          return {
            name: normalizeProvinceName(item.name),
            value: typeof item.value === 'number' ? item.value : Number(item.value) || 0
          }
        })
      }
      // 从 seriesData + years 转换
      if (!Array.isArray(this.seriesData) || !this.seriesData.length) return []
      if (!Array.isArray(this.years) || !this.years.length) return []
      var firstSeries = this.seriesData[0]
      var dataArr = Array.isArray(firstSeries.data) ? firstSeries.data : []
      return this.years.map(function (label, i) {
        return {
          name: normalizeProvinceName(label),
          value: typeof dataArr[i] === 'number' ? dataArr[i] : Number(dataArr[i]) || 0
        }
      })
    },
    /** 判断是否为省份地图数据 */
    isProvinceData: function () {
      if (!this.normalizedData.length) return false
      return this.normalizedData.some(function (item) {
        return PROVINCE_SHORT_NAMES.indexOf(item.name) !== -1
      })
    }
  },
  watch: {
    seriesData: { deep: true, handler: 'loadChart' },
    years: { deep: true, handler: 'loadChart' },
    mapData: { deep: true, handler: 'loadChart' }
  },
  mounted: function () {
    this.loadChart()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleResize)
    if (this.chartInstance) {
      this.chartInstance.dispose()
      this.chartInstance = null
    }
  },
  methods: {
    loadChart: function () {
      var dom = this.$refs.chartRef
      if (!dom) return

      if (this.chartInstance) {
        this.chartInstance.dispose()
        this.chartInstance = null
      }

      var myChart = echarts.init(dom)
      this.chartInstance = myChart

      if (this.isProvinceData) {
        this.loadMapChart(myChart)
      } else {
        this.renderHorizontalBarChart(myChart)
      }
    },

    /* ==================== 中国地图渲染 ==================== */
    loadMapChart: function (myChart) {
      myChart.showLoading()

      // 使用独立地图名，避免触发/复用内置 china 地图的南海诸岛插图逻辑。
      echarts.registerMap(CLEAN_MAP_NAME, cleanedMapJson)
      myChart.hideLoading()
      this.renderMap(myChart)
    },

    renderMap: function (myChart) {
      // 数据本身就是简称，与短名称 GeoJSON 直接匹配
      var mapped = this.normalizedData

      // 用于底部标题的文本（优先 chartName，兼容 titleText）
      var bottomTitleText = (this.chartName || this.titleText || '').trim()
      myChart.setOption({
        backgroundColor: 'transparent',
        title: bottomTitleText ? {
          text: bottomTitleText,
          left: 'center',
          bottom: 0,
          textStyle: { fontSize: 14, color: '#333', fontWeight: 500 }
        } : null,
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#ddd',
          borderWidth: 1,
          padding: [10, 14],
          formatter: function (params) {
            var v = params.value ? params.value : ''
            var vn = v ? v + '件' : '暂无数据'
            if (v == null) {
              return '<strong>' + params.name + '</strong><br/>暂无数据'
            }
            var c = getPieceColor(v)
            var rangeLabel = ''
            for (var i = 0; i < PIECES.length; i++) {
              var p = PIECES[i]
              if (v >= p.min && (p.max == null || v < p.max)) {
                rangeLabel = p.label
                break
              }
            }
            return (
              '<div style="font-size:14px;display:flex;align-items:center;gap:6px;">' +
                '<span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:' + c + ';"></span>' +
                '<strong>' + params.name + '</strong>' +
              '</div>' +
              '<div style="margin-top:6px;font-size:20px;font-weight:700;color:#2c3e50;">' + vn + ' </div>' +
              '<div style="margin-top:4px;font-size:12px;color:#888;">区间：' + rangeLabel + '</div>'
            )
          }
        },
        visualMap: {
          type: 'piecewise',
          left: 18,
          bottom: 50,
          textStyle: { color: '#555', fontSize: 13, fontWeight: 500 },
          itemWidth: 18,
          itemHeight: 16,
          itemGap: 8,
          align: 'left',
          orient: 'vertical',
          backgroundColor: 'rgba(255,255,255,0.88)',
          borderColor: '#e0e0e0',
          borderWidth: 1,
          padding: [12, 16],
          pieces: PIECES,
          hoverLink: true
        },
        series: [{
          type: 'map',
          map: CLEAN_MAP_NAME,
          roam: false,
          aspectScale: 0.85,
          zoom: 1.4,
          center: [104, 35],
          regions: [
            {
              name: '南海诸岛',
              label: { show: false },
              itemStyle: { opacity: 0, borderWidth: 0, areaColor: 'rgba(0,0,0,0)' },
              emphasis: {
                label: { show: false },
                itemStyle: { opacity: 0, borderWidth: 0, areaColor: 'rgba(0,0,0,0)' }
              }
            },
            {
              name: '',
              label: { show: false },
              itemStyle: { opacity: 0, borderWidth: 0, areaColor: 'rgba(0,0,0,0)' },
              emphasis: {
                label: { show: false },
                itemStyle: { opacity: 0, borderWidth: 0, areaColor: 'rgba(0,0,0,0)' }
              }
            }
          ],
          label: {
            show: true,
            fontSize: 11,
            color: '#2c3e50',
            fontWeight: 500
          },
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 1.5,
            areaColor: '#ebf0f8'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 15,
              color: '#1a2a3a',
              fontWeight: 'bold'
            },
            itemStyle: {
              areaColor: '#f6d55c',
              borderColor: '#ffffff',
              borderWidth: 2,
              shadowBlur: 12,
              shadowColor: 'rgba(0,0,0,0.2)'
            }
          },
          data: mapped
        }]
      })
    },

    /* ==================== 非地理数据 → 水平条形图（map 风格） ==================== */
    renderHorizontalBarChart: function (myChart) {
      var data = this.normalizedData
      if (!data.length) return

      // 倒序排列，让数值大的在上面
      var sorted = data.slice().sort(function (a, b) { return a.value - b.value })
      var categories = sorted.map(function (d) { return d.name })
      var values = sorted.map(function (d) { return d.value })
      var colorPool = ['#4A86C5', '#C0504D', '#89B34A', '#8064A2', '#4BACC6', '#F79646', '#9BBB59', '#1F77B4']

      var hBarTitleText = (this.chartName || this.titleText || '').trim()
      myChart.hideLoading()
      myChart.setOption({
        backgroundColor: 'transparent',
        title: hBarTitleText ? {
          text: hBarTitleText,
          left: 'center',
          bottom: 0,
          textStyle: { fontSize: 14, color: '#333', fontWeight: 500 }
        } : null,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: function (params) {
            if (!Array.isArray(params) || !params.length) return ''
            var p = params[0]
            return '<strong>' + p.name + '</strong><br/>' + (p.seriesName || '数量') + '：' + p.value
          }
        },
        grid: {
          left: 30,
          right: 80,
          top: 20,
          bottom: 60
        },
        xAxis: {
          type: 'value',
          min: 0,
          splitLine: { lineStyle: { color: '#e8e8e8', type: 'dashed' } },
          axisLabel: { color: '#666', fontSize: 12 }
        },
        yAxis: {
          type: 'category',
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#333', fontSize: 13, fontWeight: 500, width: 120, overflow: 'truncate' },
          splitLine: { show: false }
        },
        series: [{
          type: 'bar',
          barWidth: 24,
          barCategoryGap: '40%',
          itemStyle: {
            color: function (params) {
              return colorPool[params.dataIndex % colorPool.length]
            },
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: '#2B4A6B',
            fontSize: 14,
            fontWeight: 600,
            formatter: function (params) { return params.value }
          },
          data: values
        }]
      })
    },

    handleResize: function () {
      if (this.chartInstance) this.chartInstance.resize()
    }
  }
}
</script>

<style scoped>
.map-chart {
  width: 100%;
  border: 2px solid #999;
}
.chart-canvas { width: 100%; }
</style>
