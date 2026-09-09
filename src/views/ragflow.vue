<!--
 * @Author: wangli wangli@123.com
 * @Date: 2026-04-21 14:40:38
 * @LastEditors: wangli wangli@123.com
 * @LastEditTime: 2026-04-21 16:26:40
 * @FilePath: \search_web\src\views\ragflow.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <iframe
src="http://172.16.125.23:9222/next-chats/share?shared_id=37e06beafb3011f0a5fb674f8d018cb7&from=chat&auth=Q0OTk2YzFlYWU0MjExZjBiOTcxNmNiMz&visible_avatar=1&theme=light"
style="width: 60%; height: 100%; min-height: 600px"
frameborder="0"
>
</iframe>
<!-- <iframe src="http://172.16.125.23:9222/next-chats/widget?shared_id=37e06beafb3011f0a5fb674f8d018cb7&from=chat&auth=Q0OTk2YzFlYWU0MjExZjBiOTcxNmNiMz&visible_avatar=1&mode=master&streaming=false"
  style="position:fixed;bottom:0;right:0;width:100px;height:100px;border:none;background:transparent;z-index:9999"
  frameborder="0" allow="microphone;camera"></iframe> -->
</template>
<script>
// window.addEventListener('message',e=>{
//   if(e.origin!=='http://172.16.125.23:9222')return;
//   if(e.data.type==='CREATE_CHAT_WINDOW'){
//     if(document.getElementById('chat-win'))return;
//     const i=document.createElement('iframe');
//     i.id='chat-win';i.src=e.data.src;
//     i.style.cssText='position:fixed;bottom:104px;right:24px;width:380px;height:500px;border:none;background:transparent;z-index:9998;display:none';
//     i.frameBorder='0';i.allow='microphone;camera';
//     document.body.appendChild(i);
//   }else if(e.data.type==='TOGGLE_CHAT'){
//     const w=document.getElementById('chat-win');
//     if(w)w.style.display=e.data.isOpen?'block':'none';
//   }else if(e.data.type==='SCROLL_PASSTHROUGH')window.scrollBy(0,e.data.deltaY);
// });
</script>
