/**
 * DebounceHelper - 防抖与节流工具类
 *
 * 功能：提供防抖（debounce）与节流（throttle）操作，
 *       用于限制高频触发事件（如输入、滚动、resize）的执行频率，
 *       避免频繁调用接口或重复执行高开销操作
 *
 * @module DebounceHelper
 */

class DebounceHelper {
  /**
   * 标准防抖：延迟 delay 毫秒后执行 fn，
   * 在延迟期间再次调用则重新计时
   *
   * @param {Function} fn - 要执行的函数
   * @param {number} delay - 延迟毫秒数（默认 300）
   * @param {Object} [context] - 执行时的 this 上下文（默认沿用调用时的 this）
   * @returns {Function} 防抖包装后的函数（含 .cancel() 方法可手动取消防抖）
   *
   * @example
   * const handleInput = DebounceHelper.debounce((e) => {
   *   console.log('输入完成:', e.target.value)
   * }, 500)
   * inputEl.addEventListener('input', handleInput)
   * // 需要立即取消待执行的调用：
   * handleInput.cancel()
   */
  static debounce(fn, delay = 300, context) {
    let timer = null

    const debounced = function (...args) {
      const ctx = context || this
      clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        fn.apply(ctx, args)
      }, delay)
    }

    /**
     * 手动取消防抖，清除待执行的定时器
     */
    debounced.cancel = function () {
      clearTimeout(timer)
      timer = null
    }

    /**
     * 立即执行待处理的调用并取消后续等待
     */
    debounced.flush = function (...args) {
      const ctx = context || this
      clearTimeout(timer)
      timer = null
      fn.apply(ctx, args)
    }

    return debounced
  }

  /**
   * 立即执行防抖：第一次调用立即执行，后续高频调用只执行最后一次
   * 适用于保存按钮等需要首次快速响应的场景
   *
   * @param {Function} fn - 要执行的函数
   * @param {number} delay - 冷却毫秒数（默认 300）
   * @param {Object} [context] - 执行时的 this 上下文
   * @returns {Function} 带立即执行的防抖包装函数（含 .cancel() 方法）
   *
   * @example
   * const handleSave = DebounceHelper.debounceImmediate(() => {
   *   console.log('保存操作')
   * }, 1000)
   * btnEl.addEventListener('click', handleSave)
   */
  static debounceImmediate(fn, delay = 300, context) {
    let timer = null
    let leading = true

    const debounced = function (...args) {
      const ctx = context || this
      clearTimeout(timer)

      if (leading) {
        leading = false
        fn.apply(ctx, args)
      }

      timer = setTimeout(() => {
        timer = null
        leading = true
      }, delay)
    }

    /**
     * 手动取消防抖，重置状态
     */
    debounced.cancel = function () {
      clearTimeout(timer)
      timer = null
      leading = true
    }

    return debounced
  }

  /**
   * 节流：在 interval 毫秒内最多执行一次 fn
   * 适用于滚动、resize 等持续高频触发的事件
   *
   * @param {Function} fn - 要执行的函数
   * @param {number} interval - 节流间隔毫秒数（默认 300）
   * @param {Object} [context] - 执行时的 this 上下文
   * @returns {Function} 节流包装后的函数（含 .cancel() 方法）
   *
   * @example
   * const handleScroll = DebounceHelper.throttle(() => {
   *   console.log('滚动位置:', window.scrollY)
   * }, 200)
   * window.addEventListener('scroll', handleScroll)
   */
  static throttle(fn, interval = 300, context) {
    let lastTime = 0
    let timer = null

    const throttled = function (...args) {
      const ctx = context || this
      const now = Date.now()
      const remaining = interval - (now - lastTime)

      if (remaining <= 0) {
        // 冷却已结束，立即执行
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
        lastTime = now
        fn.apply(ctx, args)
      } else if (!timer) {
        // 最后一次调用在冷却结束时执行
        timer = setTimeout(() => {
          lastTime = Date.now()
          timer = null
          fn.apply(ctx, args)
        }, remaining)
      }
    }

    /**
     * 手动取消节流，清除待执行的定时器
     */
    throttled.cancel = function () {
      clearTimeout(timer)
      timer = null
      lastTime = 0
    }

    return throttled
  }

  /**
   * 取消防抖/节流函数的所有待执行定时器
   * 常用于组件卸载时清理，避免内存泄漏
   *
   * @param {Function|undefined} wrappedFn - 由 debounce/throttle 包装后的函数
   *
   * @example
   * const debouncedFn = DebounceHelper.debounce(myFn, 500)
   * // 组件卸载时：
   * DebounceHelper.cancel(debouncedFn)
   */
  static cancel(wrappedFn) {
    if (wrappedFn && typeof wrappedFn.cancel === 'function') {
      wrappedFn.cancel()
    }
  }
}

export default DebounceHelper
