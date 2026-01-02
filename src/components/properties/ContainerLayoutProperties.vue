<template>
  <PropertySection title="容器布局">
    <template #content>
      <div class="row">
        <label>模式</label>
        <select :value="layoutMode" @change="onModeChange">
          <option value="absolute">absolute</option>
          <option value="default">default</option>
          <option value="flex">flex</option>
        </select>
      </div>

      <template v-if="layoutMode === 'flex'">
        <div class="row">
          <label>主轴</label>
          <select :value="flexDirection" @change="onSelect('flexDirection', $event)">
            <option value="row">row</option>
            <option value="column">column</option>
          </select>
        </div>

        <div class="row">
          <label>justify</label>
          <div class="btn-group">
            <button class="btn" :class="{ active: justifyContent === 'flex-start' }" @click="emitUpdate({ justifyContent: 'flex-start' })">start</button>
            <button class="btn" :class="{ active: justifyContent === 'center' }" @click="emitUpdate({ justifyContent: 'center' })">center</button>
            <button class="btn" :class="{ active: justifyContent === 'flex-end' }" @click="emitUpdate({ justifyContent: 'flex-end' })">end</button>
            <button class="btn" :class="{ active: justifyContent === 'space-between' }" @click="emitUpdate({ justifyContent: 'space-between' })">between</button>
          </div>
        </div>

        <div class="row">
          <label>align</label>
          <div class="btn-group">
            <button class="btn" :class="{ active: alignItems === 'flex-start' }" @click="emitUpdate({ alignItems: 'flex-start' })">start</button>
            <button class="btn" :class="{ active: alignItems === 'center' }" @click="emitUpdate({ alignItems: 'center' })">center</button>
            <button class="btn" :class="{ active: alignItems === 'flex-end' }" @click="emitUpdate({ alignItems: 'flex-end' })">end</button>
            <button class="btn" :class="{ active: alignItems === 'stretch' }" @click="emitUpdate({ alignItems: 'stretch' })">stretch</button>
          </div>
        </div>

        <div class="row">
          <label>gap</label>
          <input type="number" :value="gap" @input="onInputGap" />
        </div>
      </template>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PropertySection from './PropertySection.vue'

const props = defineProps<{
  layoutMode?: 'absolute' | 'default' | 'flex'
  flexDirection?: 'row' | 'column'
  justifyContent?: string
  alignItems?: string
  gap?: number
}>()

const emit = defineEmits<{
  (e: 'update', updates: Record<string, any>): void
}>()

const layoutMode = computed(() => props.layoutMode || 'absolute')
const flexDirection = computed(() => props.flexDirection || 'row')
const justifyContent = computed(() => props.justifyContent || 'flex-start')
const alignItems = computed(() => props.alignItems || 'stretch')
const gap = computed(() => props.gap ?? 0)

function emitUpdate(updates: Record<string, any>) {
  emit('update', updates)
}

function onModeChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value as 'absolute' | 'default' | 'flex'
  emitUpdate({ layoutMode: val })
}

function onSelect(key: string, e: Event) {
  const val = (e.target as HTMLSelectElement).value
  emitUpdate({ [key]: val })
}

function onInputGap(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  emitUpdate({ gap: val })
}
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

label {
  width: 48px;
  font-size: 11px;
  color: #333;
  font-weight: 500;
}

select, input[type="number"] {
  flex: 1;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  font-family: inherit;
  background: white;
  outline: none;
}

.btn-group {
  display: flex;
  gap: 4px;
  flex: 1;
  justify-content: flex-end;
}

.btn {
  height: 24px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  background: white;
  font-size: 10px;
  cursor: pointer;
  color: #333;
}

.btn:hover {
  border-color: #d9d9d9;
}

.btn.active {
  border-color: #1890ff;
  color: #1890ff;
}
</style>
