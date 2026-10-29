<template>
  <div>
    <div class="wrap_content">
      <div class="detail">
        <h5 class="gov-title" v-html="title"></h5>
        <div class="gov-content" v-html="processedHtml"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: '',
      dataHtml: '',
      list: []
    }
  },
  computed: {
    // 将 dataHtml 中的内联样式转为 class 名称，确保样式统一受 CSS 控制
    processedHtml() {
      return (this.dataHtml || '')
        // 段落首行缩进：style="text-indent: 2em;" → class="gov-para"
        .replace(/style="text-indent:\s*2em;?"/gi, 'class="gov-para"')
        // 其他 text-indent 的变体
        .replace(/style='text-indent:\s*2em;?'/gi, 'class="gov-para"')
    }
  },
  props: ['query'],
  mounted() {
    this.dataHtml = this.$route.query.content
      .replaceAll('<em>', '<span style="color:red;">')
      .replaceAll('</em>', '</span>')
    this.title = this.$route.query.title
      .replaceAll('<em>', '<span style="color:red;">')
      .replaceAll('</em>', '</span>')
    // 去掉 HTML 标签后设为浏览器标签页标题
    document.title = this.title.replace(/<[^>]+>/g, '')
    // test
    // this.title = '中共中央办公厅、国务院办公厅印发《关于用好乡镇（街道）履行职责事项清单的具体措施》'
    // this.dataHtml = "<div class=\"pages_content\" id=\"UCAP-CONTENT\">\n<div class=\"trs_editor_view TRS_UEDITOR trs_paper_default trs_web\"><p style=\"text-indent: 2em;\">新华社北京5月19日电 近日，中共中央办公厅、国务院办公厅印发了《关于用好乡镇（街道）履行职责事项清单的具体措施》（以下简称《具体措施》），并发出通知，要求各地区各部门结合实际认真贯彻落实。</p><p style=\"text-indent: 2em;\">《具体措施》明确，要全力落实基本履职事项清单，乡镇（街道）要将基本履职事项细化分解到具体岗位和人员，履行好党的建设、经济发展、民生服务、平安法治等主要职能，特别是抓好保民生、保安全、保底线履职事项的落实。要协同落实配合履职事项清单，上级部门要明确承担职责的具体机构，履行好清单列明的工作任务，对乡镇（街道）配合履行的职责，在业务培训、政策指导、人员力量、资金投入、装备设备等方面提供必要的支持保障。要衔接落实上级部门收回事项清单，上级部门要明确承接收回事项的机构，调整优化力量配备，和乡镇（街道）做好工作衔接，避免出现管理空白。要按照履职事项清单，进一步完善“街乡吹哨、部门报到”的运行机制，调整优化“12345”等政务服务平台诉求派单目录，推动清单数字化管理和履职事项网上运行。县级党委和政府研究涉及乡镇（街道）的规划计划、政策文件、重大工作等，应以履职事项清单作为重要依据。除党中央、国务院及省级党委和政府统一部署外，上级部门不得将未列入清单的职责事项擅自向乡镇（街道）下放或者采取授权、委托等形式变相下放。</p><p style=\"text-indent: 2em;\">《具体措施》明确，要将履职事项清单作为考核乡镇（街道）的基本依据，县级党委和政府主要依据基本履职事项清单调整优化对乡镇（街道）综合考核内容，科学评价乡镇（街道）领导班子和领导干部。要依据配合履职事项清单考核县直部门牵头履职事项和乡镇（街道）配合履职事项，考核县直部门牵头组织协调情况、承担的职责落实情况、为乡镇（街道）配合履职提供保障情况等，考核乡镇（街道）配合职责落实情况、与县直部门协作配合情况等。不得以上级部门收回事项考核乡镇（街道）。</p><p style=\"text-indent: 2em;\">《具体措施》明确，要结合履职事项清单开展追责工作。要依照基本履职事项清单、配合履职事项清单分清相应责任。因不履行或者不正确履行基本履职事项需要追责时，依规依纪依法追究乡镇（街道）及其工作机构、乡镇（街道）相关领导干部和工作人员的责任。对配合履职事项存在失职失责需要追责时，上级部门承担主责，乡镇（街道）在配合职责范围内对自身过错部分承担责任。对乡镇（街道）已正确履行配合职责，因上级部门未妥当处置导致责任事故、事件的，不追究乡镇（街道）责任。对上级部门收回事项存在失职失责需要追责时，不追究乡镇（街道）责任。</p><p style=\"text-indent: 2em;\">《具体措施》明确，要落实履职事项经费支持政策，对接履职事项清单做好乡镇（街道）经济社会发展等项目安排。要建立健全履职事项清单动态调整机制，坚持“大稳定、小调整”，在充分听取群众意见基础上，组织乡镇（街道）和县直部门研究提出调整意见，按程序报批后实施。</p><p style=\"text-indent: 2em;\">《具体措施》要求，地方各级党委要加强对坚持和完善乡镇（街道）履职事项清单制度的组织领导，县乡两级党委要切实负起责任，党委书记要带头用好清单。中央和国家机关部门要以上率下，推动用好履职事项清单有关具体措施落地见效，制定政策过程中对确需乡镇（街道）落实的工作应明确具体任务，不得直接要求乡镇（街道）列入清单，坚决杜绝“条条干预”。各地要将履职事项清单执行情况作为整治形式主义为基层减负、巡视巡察等重要内容。畅通机构编制部门“12310”举报电话，对典型问题予以公开通报，造成严重后果的严肃处理。</p></div>\n<div style=\"display:none\">\n</div>\n</div>"
  }
}
</script>
<style scoped lang="less">
.wrap_content {
  background: #f5f5f5;
  height: 100vh;
  padding: 30px 0;
  overflow: auto;
  .detail {
    width: 860px;
    max-width: 94%;
    margin: 0 auto;
    padding: 50px 65px 60px;
    background: #fff;
    border: none;
    border-radius: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
}

/* ---- 标题：gov.cn 风格，居中、加粗、宋体 ---- */
.gov-title {
  font-family: 宋体, SimSun, serif;
  font-size: 24px;
  font-weight: 700;
  color: #222;
  text-align: center;
  line-height: 1.6;
  margin: 0 0 30px 0;
  padding: 0 0 20px;
  border-bottom: 1px solid #e8e8e8;
}

/* ---- 正文：gov.cn 风格，穿透 v-html 内容 ---- */
:deep(.gov-content) {
  font-family: 宋体, SimSun, serif;
  font-size: 16px;
  color: #333;
  line-height: 2;
  text-align: justify;
}

:deep(.gov-para) {
  margin: 0 0 8px 0;
  text-indent: 2em;
}

/* 兼容 dataHtml 中可能存在的其他块级元素 */
:deep(.gov-content) p {
  margin: 0 0 8px 0;
  text-indent: 2em;
}

/* 处理隐藏内容 */
:deep([style*="display:none"]),
:deep([style*="display: none"]) {
  display: none !important;
}
</style>
