<template>
  <div class="local-zhaiyao-page">
    <div class="toolbar">
      <button class="generate-btn" @click="handleGenerate">生成汇总要点数据</button>
      <button class="export-btn" @click="handleExportDoc">导出DOC（先生成）</button>
      <button class="upload-btn" @click="triggerTxtUpload">上传TXT</button>
      <input
        ref="txtUploadInput"
        type="file"
        accept=".txt,text/plain"
        style="display:none"
        @change="handleTxtUpload"
      />
      <span class="tip">先在汇总要点页面打开后再调用，确保 window.localZhaiyaoData 已注册。</span>
    </div>

    <div class="title-row">
      <label class="title-label">标题：</label>
      <input class="title-input" type="text" :value="textTitle" readonly />
    </div>

    <textarea
      v-model="jsonText"
      @input="handleTextInput"
      class="json-textarea"
      spellcheck="false"
      placeholder="请输入 JSON，点击上方按钮调用 window.localZhaiyaoData"
    ></textarea>
  </div>
</template>

<script>
import zhaiyaoData from './zhaiyao.json'

export default {
  name: 'LocalZhaiyaoDataPage',
  data() {
    return {
      jsonText: '',
      textTitle: 'zhaiyao.json',
      uploadedPayload: null,
      uploadedRawText: '',
      isProgrammaticTextUpdate: false,
      maxPreviewLength: 200000
    }
  },
  created() {
    this.setJsonText(JSON.stringify(this.normalizePayload(zhaiyaoData), null, 2))
  },
  methods: {
    setJsonText(value) {
      this.isProgrammaticTextUpdate = true
      this.jsonText = value
      this.$nextTick(() => {
        this.isProgrammaticTextUpdate = false
      })
    },
    handleTextInput() {
      if (this.isProgrammaticTextUpdate) return
      this.uploadedPayload = null
      this.uploadedRawText = ''
    },
    triggerTxtUpload() {
      if (this.$refs.txtUploadInput) {
        this.$refs.txtUploadInput.click()
      }
    },
    handleTxtUpload(event) {
      const file = event && event.target && event.target.files ? event.target.files[0] : null
      if (!file) return

      const isTxt = /\.txt$/i.test(file.name || '') || file.type === 'text/plain'
      if (!isTxt) {
        this.$message && this.$message.error('仅支持上传 .txt 文件')
        event.target.value = ''
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const textContent = String(reader.result || '')
        this.uploadedRawText = textContent
        this.uploadedPayload = this.buildPayloadFromText(textContent)
        this.setJsonText(this.buildPreviewText(textContent))
        this.textTitle = file.name || '未命名.txt'
        this.$message && this.$message.success('TXT内容已读取，生成汇总要点时将直接使用上传文件的完整内容')
      }
      reader.onerror = () => {
        this.$message && this.$message.error('读取TXT文件失败')
      }
      reader.onabort = () => {
        this.$message && this.$message.warning('已取消读取TXT文件')
      }
      reader.readAsText(file, 'utf-8')
      event.target.value = ''
    },
    normalizePayload(payload) {
      if (Array.isArray(payload)) {
        return { data: payload }
      }
      if (payload && Array.isArray(payload.list) && !Array.isArray(payload.data)) {
        return { ...payload, data: payload.list }
      }
      return payload
    },
    buildPayloadFromText(text) {
      const rawText = String(text || '')
      const trimmedText = rawText.trim()
      if (!trimmedText) {
        return { data: [] }
      }

      try {
        const parsed = JSON.parse(trimmedText)
        return this.normalizePayload(parsed)
      } catch (e) {
        return { data: [rawText] }
      }
    },
    buildPreviewText(text) {
      const rawText = String(text || '')
      if (rawText.length <= this.maxPreviewLength) {
        return rawText
      }
      return `${rawText.slice(0, this.maxPreviewLength)}\n\n... 预览内容已截断，生成汇总要点时仍将使用上传文件的完整内容 ...`
    },
    getPayloadFromText() {
      if (this.uploadedPayload) {
        return this.uploadedPayload
      }

      const text = String(this.jsonText || '').trim()
      if (!text) {
        return { data: [] }
      }

      return this.buildPayloadFromText(text)
    },
    runGenerateFlow(payload, showToast = true) {
      if (typeof window.localZhaiyaoData === 'function') {
        window.localZhaiyaoData(payload)
        if (showToast) this.$message && this.$message.success('已使用当前数据调用 window.localZhaiyaoData')
        return true
      }

      const serializedPayload = JSON.stringify(payload)
      const isLargePayload = serializedPayload.length > this.maxPreviewLength
      if (isLargePayload || this.uploadedPayload) {
        this.$message && this.$message.warning('当前数据较大或来自上传文件，请先打开汇总要点页后再执行生成，避免中转失败')
        return false
      }

      localStorage.setItem('pendingLocalZhaiyaoData', serializedPayload)

      if (showToast) this.$message && this.$message.success('已保存输入内容，正在跳转汇总要点页执行生成')
      this.$router.push('/adviceCluster')
      return true
    },
    exportTextAsDoc(text) {
      const escaped = String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><pre style="white-space: pre-wrap; word-break: break-word; font-family: Consolas, monospace;">${escaped}</pre></body></html>`
      const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `local_zhaiyao_${new Date().getTime()}.doc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    handleGenerate() {
      try {
        const payload = this.getPayloadFromText()
        this.runGenerateFlow(payload, true)
      } catch (err) {
        this.$message && this.$message.error('JSON 格式错误，请检查后重试')
      }
    },
    handleExportDoc() {
      try {
        const payload = this.getPayloadFromText()
        // 一键导出时先执行“生成汇总要点数据”同款逻辑，再导出当前文本
        if (!this.runGenerateFlow(payload, false)) return
        this.exportTextAsDoc(this.uploadedRawText || this.jsonText)
        this.$message && this.$message.success('已完成生成并导出DOC')
      } catch (err) {
        this.$message && this.$message.error('JSON 格式错误，无法导出DOC')
      }
    }
  }
}
</script>

<style scoped>
.local-zhaiyao-page {
  padding: 16px;
  height: calc(100vh - 32px);
  box-sizing: border-box;
  background: #f8fafc;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.toolbar > * {
  margin-right: 12px;
}
.toolbar > *:last-child {
  margin-right: 0;
}

.generate-btn {
  border: none;
  background: #1668dc;
  color: #fff;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.generate-btn:hover {
  background: #0f56b3;
}

.export-btn {
  border: none;
  background: #0b7a37;
  color: #fff;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.export-btn:hover {
  background: #08632c;
}

.upload-btn {
  border: none;
  background: #8a5b00;
  color: #fff;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.upload-btn:hover {
  background: #6f4900;
}

.title-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.title-row > * {
  margin-right: 8px;
}
.title-row > *:last-child {
  margin-right: 0;
}

.title-label {
  color: #2b3240;
  font-size: 14px;
  flex: 0 0 auto;
}

.title-input {
  width: 360px;
  max-width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 6px 10px;
  box-sizing: border-box;
  font-size: 13px;
  color: #3b4557;
  background: #fff;
}

.tip {
  color: #5b6472;
  font-size: 13px;
}

.json-textarea {
  width: 100%;
  height: calc(100% - 92px);
  resize: none;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 12px;
  box-sizing: border-box;
  font-size: 13px;
  line-height: 1.6;
  font-family: Consolas, Menlo, Monaco, monospace;
  background: #fff;
}

.json-textarea:focus {
  border-color: #1668dc;
  outline: none;
}
</style>
