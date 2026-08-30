<template>
  <span class="bone-motion-player" :class="{ ready: previewReady }" :style="playerStyle" :data-motion-project="projectId" :data-motion-animation="animationId">
    <iframe ref="previewFrame" class="bone-motion-preview" :src="previewUrl" :title="title" tabindex="-1" aria-hidden="true" @load="handleLoad"></iframe>
  </span>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  projectId: { type: String, required: true },
  animationId: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  title: { type: String, default: 'ボーンモーション' }
})
const previewFrame = ref(null)
const previewReady = ref(false)

const previewUrl = computed(() => {
  const query = new URLSearchParams({ preview: '1', transparent: '1', project: props.projectId, animation: '__default__' })
  return `/2d_bone_editor_split/?${query}`
})
const playerStyle = computed(() => ({
  width: `${Math.max(1, Number(props.width) || 1)}px`,
  height: `${Math.max(1, Number(props.height) || 1)}px`
}))
const sendAnimation = () => previewFrame.value?.contentWindow?.postMessage({ type: 'bone-motion:set-animation', animationId: props.animationId }, window.location.origin)
const handleLoad = () => {
  previewReady.value = false
  sendAnimation()
}
const handlePreviewMessage = event => {
  if (event.origin !== window.location.origin || event.source !== previewFrame.value?.contentWindow) return
  if (!['bone-motion:ready', 'bone-motion:error'].includes(event.data?.type)) return
  previewReady.value = true
  sendAnimation()
}
watch(() => props.animationId, sendAnimation)
watch(previewUrl, () => { previewReady.value = false })
onMounted(() => window.addEventListener('message', handlePreviewMessage))
onBeforeUnmount(() => window.removeEventListener('message', handlePreviewMessage))
</script>

<style scoped>
.bone-motion-player{position:relative;display:block;flex:0 0 auto;overflow:hidden;pointer-events:none}
.bone-motion-preview{display:block;width:100%;height:100%;border:0;background:transparent;opacity:0;pointer-events:none}
.bone-motion-player.ready .bone-motion-preview{opacity:1}
</style>
