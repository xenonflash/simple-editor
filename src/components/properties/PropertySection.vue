# 属性区块组件
<template>
  <div class="property-section">
    <div class="section-header" @click="toggleCollapsed">
      <div class="header-left">
        <span class="collapse-arrow" :class="{ expanded: !collapsed }">▶</span>
        <span class="title-text">{{ title }}</span>
      </div>
      <div class="header-right">
        <slot name="head"></slot>
      </div>
    </div>
    <div ref="contentRef" class="section-content-wrapper" :class="{ collapsed }">
      <div class="section-content">
        <slot name="content"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';

const props = withDefaults(defineProps<{
  title: string;
  defaultCollapsed?: boolean;
}>(), {
  defaultCollapsed: false
});

const collapsed = ref(props.defaultCollapsed);
const contentRef = ref<HTMLElement | null>(null);
const isAnimating = ref(false);

function toggleCollapsed() {
  if (isAnimating.value) return;
  collapsed.value = !collapsed.value;
}

function animateCollapse() {
  if (!contentRef.value) return;

  const el = contentRef.value;
  const startHeight = collapsed.value ? el.scrollHeight : el.offsetHeight;
  const endHeight = collapsed.value ? 0 : el.scrollHeight;

  el.style.height = startHeight + 'px';
  el.style.transition = 'height 0.2s ease';
  el.style.overflow = 'hidden';

  isAnimating.value = true;

  requestAnimationFrame(() => {
    el.style.height = endHeight + 'px';
  });

  setTimeout(() => {
    isAnimating.value = false;
    if (collapsed.value) {
      el.style.height = '0';
    } else {
      el.style.height = 'auto';
    }
  }, 200);
}

watch(collapsed, () => {
  nextTick(() => {
    animateCollapse();
  });
});

onMounted(() => {
  if (contentRef.value) {
    contentRef.value.style.height = collapsed.value ? '0' : 'auto';
  }
});
</script>

<style scoped>
.property-section {
  border-bottom: 1px solid #e5e5e5;
}

.section-header {
  height: 28px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fafafa;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  user-select: none;
}

.section-header:hover {
  background: #f5f5f5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.collapse-arrow {
  font-size: 10px;
  color: #999;
  transition: transform 0.15s ease;
  display: inline-block;
  width: 10px;
  text-align: center;
  line-height: 1;
}

.collapse-arrow.expanded {
  transform: rotate(90deg);
}

.title-text {
  font-size: 11px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.section-content-wrapper {
  background: #fff;
}

.section-content-wrapper.collapsed {
  height: 0;
  overflow: hidden;
}

.section-content {
  padding: 8px 12px;
}
</style>
