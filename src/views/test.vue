<template>
  <div>
    <!-- PDF 预览 -->
    <!-- <vue-office-pdf :src="pdfSrc" style="height: 100vh;" @rendered="onPdfRendered" /> -->
    
    <!-- DOCX 预览 -->
    <vue-office-docx :src="docxSrc" style="height: 100vh;" @rendered="onDocxRendered" />
  </div>
</template>

<script>
// 引入组件
import VueOfficePdf from '@vue-office/pdf'
import VueOfficeDocx from '@vue-office/docx'
// 引入相关样式
// import '@vue-office/pdf/lib/index.css'
import '@vue-office/docx/lib/index.css'

export default {
  components: {
    VueOfficePdf,
    VueOfficeDocx
  },
  data() {
    return {
      // 可以是网络 URL、上传文件的 ArrayBuffer 或 Blob 等
      docxSrc: '/static/综合分析功能说明手册.docx',
      pdfSrc: '/static/综合分析流程图.pdf',
    }
  },
  methods: {
    onPdfRendered() {
      console.log('PDF 渲染完成')
    },
    onDocxRendered() {
      console.log('DOCX 渲染完成')
    }
  }
}
</script>
