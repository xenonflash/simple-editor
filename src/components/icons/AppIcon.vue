<template>
  <font-awesome-icon :icon="iconName" :class="iconClass" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { iconMap } from '@/utils/icons'

interface Props {
  name: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  class: ''
})

// 自动转换emoji到FontAwesome图标名
const iconName = computed(() => {
  return iconMap[props.name] || props.name
})

const iconClass = computed(() => {
  return `app-icon ${props.class}`
})
</script>

<style scoped>
.app-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
}
</style>