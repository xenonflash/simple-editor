<template>
  <PropertySection title="容器布局">
    <template #content>
      <FlexLayoutSettings
        :modeValue="layoutMode"
        :direction="direction"
        :justify="flexJustify"
        :align="flexAlign"
        :gap="gap"
        
        :labels="{ manual: '手动布局 (Manual)', auto: '自动布局 (Auto)' }"
        :modes="{ manual: 'manual', auto: 'auto' }"

        @update="handleUpdate"
      />
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PropertySection from './PropertySection.vue';
import FlexLayoutSettings from './FlexLayoutSettings.vue';

const props = defineProps<{
  layoutMode?: 'manual' | 'auto';
  direction?: 'row' | 'column';
  primaryAlign?: 'start' | 'center' | 'end' | 'between' | 'evenly';
  crossAlign?: 'start' | 'center' | 'end' | 'stretch';
  gap?: number;
}>();

const emit = defineEmits<{
  (e: 'update', updates: Record<string, any>): void
}>();

// Map old Container props to CSS Flex values
const primaryAlignMapping: Record<string, string> = {
    'start': 'flex-start',
    'center': 'center',
    'end': 'flex-end',
    'between': 'space-between',
    'evenly': 'space-around'
};

const crossAlignMapping: Record<string, string> = {
    'start': 'flex-start',
    'center': 'center',
    'end': 'flex-end',
    'stretch': 'stretch'
};

// Computeds for FlexLayoutSettings
const flexJustify = computed(() => {
    // Default to 'start' if undefined
    return primaryAlignMapping[props.primaryAlign || 'start'] || 'flex-start';
});

const flexAlign = computed(() => {
    // Default to 'stretch' if undefined
    return crossAlignMapping[props.crossAlign || 'stretch'] || 'stretch';
});

function handleUpdate(updates: any) {
    const final: Record<string, any> = {};
    for (const key in updates) {
        if (key === 'layoutMode') {
            final.layoutMode = updates[key];
        } else if (key === 'direction') {
            final.direction = updates[key];
        } else if (key === 'gap') {
            final.gap = updates[key];
        } else if (key === 'layoutJustifyContent') {
             // Reverse map
             const val = updates[key];
             const map: Record<string, string> = {
                 'flex-start': 'start',
                 'start': 'start', 
                 'center': 'center',
                 'flex-end': 'end',
                 'end': 'end',
                 'space-between': 'between',
                 'space-around': 'evenly'
             };
             final.primaryAlign = map[val] || 'start';
        } else if (key === 'layoutAlignItems') {
             const val = updates[key];
             const map: Record<string, string> = {
                 'flex-start': 'start',
                 'start': 'start',
                 'center': 'center',
                 'flex-end': 'end',
                 'end': 'end',
                 'stretch': 'stretch'
             };
             final.crossAlign = map[val] || 'stretch';
        }
    }
    emit('update', final);
}
</script>
