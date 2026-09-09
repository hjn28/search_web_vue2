const path = require('path')
const resolve = dir => path.join(__dirname, dir)
module.exports = {
  lintOnSave: false,
  outputDir: 'search_web',
  runtimeCompiler: true,
  publicPath: './',
  css: {
    loaderOptions: {
      postcss: {
        plugins: [
          require('postcss-pxtorem')({
            // 把px单位换算成rem单位
            // rootValue: 75, // 换算的基数(设计图750的根字体为75)
            // selectorBlackList: ['weui', 'mu'], // 忽略转换正则匹配项
            // propList: ['*'],//*代表将项目中的全部进行转换，单个转换如width、height等

            rootValue: 18, // 16
            // unitPrecision: 5,
            // propList: ['font', 'font-size', 'line-height', 'letter-spacing'],
            propList: ['*'/* , '!font-size', '!line-height' */] //* 代表将项目中的全部进行转换，单个转换如width、height等
            // selectorBlackList: ['.mint'],
            // replace: true,
            // mediaQuery: false,
            // minPixelValue: 0
          })
        ]
      }
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    }
  },
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
        args[0].title = '词库检索工具'
        return args
      })
    // 配置根目录@(引用路径)
    config.resolve.alias
      .set('@', resolve('src'))
  },
  devServer: {
    proxy: {
      '/renda-api': {
        // target: 'http://172.16.121.26:8091', // 后端接口地址
        // target: 'http://172.16.125.21:8091', // AI线上后端接口地址
        target: 'http://172.16.125.24:8200', // AI本地中转前端接口地址
        changeOrigin: true, // 是否允许跨越
        pathRewrite: {
          '^/renda-api': '/renda-api'
        }
      },
      // '/renda-api/test': {
      //   target: 'http://172.16.15.29:6870', // AI本地中转前端接口地址
      //   changeOrigin: true, // 是否允许跨越
      //   pathRewrite: {
      //     '^/renda-api': '/renda-api'
      //   }
      // },
      '/api/search': {
        target: 'http://172.16.125.21:9901', // 后端接口地址
        changeOrigin: true, // 是否允许跨越
        pathRewrite: {
          '^/api/search': '/api/search'
        }
      },
      '/': {
        // target: 'https://1892018wm7.imdo.co/',
        // target: 'http://10.13.102.79:8080',
        // target: 'http://10.13.102.66:8080',
        // target: 'http://172.16.125.21:6890/intelli',//线上环境
        // target: 'http://172.16.15.145:6888/intelli',
        // target: 'http://172.16.15.62:8080',//wl
        target: 'http://172.16.15.85:8080', // xk
        changeOrigin: true
      }
    }
  }
}
