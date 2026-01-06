# 容器布局属性组件
<template>
  <PropertySection title="容器布局">
    <template #content>
      <div class="layout-properties">
        <!-- 模式切换 -->
        <div class="property-row">
          <label class="prop-label">布局模式</label>
          <div class="segmented-wrapper">
            <div class="segmented-control">
              <button 
                class="segmented-btn"
                :class="{ active: layoutMode === 'manual' }"
                @click="emitUpdate({ layoutMode: 'manual' })"
              >
                手动
              </button>
              <button 
                class="segmented-btn"
                :class="{ active: layoutMode === 'auto' }"
                @click="emitUpdate({ layoutMode: 'auto' })"
              >
                自动
              </button>
            </div>
          </div>
        </div>

        <!-- 自动布局设置 -->
        <template v-if="layoutMode === 'auto'">
          <!-- 方向 -->
          <div class="property-row">
            <label class="prop-label">方向</label>
            <div class="segmented-wrapper">
              <div class="segmented-control">
                <button 
                  class="segmented-btn"
                  :class="{ active: direction === 'row' }"
                  @click="emitUpdate({ direction: 'row' })"
                >
                  水平
                </button>
                <button 
                  class="segmented-btn"
                  :class="{ active: direction === 'column' }"
                  @click="emitUpdate({ direction: 'column' })"
                >
                  垂直
                </button>
              </div>
            </div>
          </div>

          <!-- 主轴对齐 -->
          <div class="property-row">
            <label class="prop-label">主轴对齐</label>
            <div class="align-group">
              <button 
                class="icon-btn"
                :class="{ active: primaryAlign === 'start' }"
                @click="emitUpdate({ primaryAlign: 'start' })"
                title="起始对齐"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h4v12H4V6zm6 0h10v12H10V6z"/></svg>
              </button>
              <button 
                class="icon-btn"
                :class="{ active: primaryAlign === 'center' }"
                @click="emitUpdate({ primaryAlign: 'center' })"
                title="居中对齐"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 6h8v12H8V6zm4 0h4v12h-4V6z"/></svg>
              </button>
              <button 
                class="icon-btn"
                :class="{ active: primaryAlign === 'end' }"
                @click="emitUpdate({ primaryAlign: 'end' })"
                title="末尾对齐"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h4v12h-4V6zm-6 0h10v12H10V6z"/></svg>
              </button>
              <button 
                class="icon-btn"
                :class="{ active: primaryAlign === 'between' }"
                @click="emitUpdate({ primaryAlign: 'between' })"
                title="两端对齐"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h2v12H4V6zm4 0h8v12H8V6zm4 0h4v12h-4V6z"/></svg>
              </button>
              <button 
                class="icon-btn"
                :class="{ active: primaryAlign === 'evenly' }"
                @click="emitUpdate({ primaryAlign: 'evenly' })"
                title="均分布局"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h2v12H4V6zm4 0h2v12H8V6zm4 0h2v12h-2V6zm4 0h2v12h-2V6z"/></svg>
              </button>
            </div>
          </div>

          <!-- 交叉轴对齐 -->
          <div class="property-row">
            <label class="prop-label">交叉轴对齐</label>
            <div class="align-group">
              <button 
                class="icon-btn"
                :class="{ active: crossAlign === 'start' }"
                @click="emitUpdate({ crossAlign: 'start' })"
                title="起始对齐"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v4H6V4zm0 12h4v4H6v-4zm6-12h4v16h-4V4z"/></svg>
              </button>
              <button 
                class="icon-btn"
                :class="{ active: crossAlign === 'center' }"
                @click="emitUpdate({ crossAlign: 'center' })"
                title="居中对齐"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 8h4v8H6V8zm0-4h4v4H6V4zm6 4h4v8h-4V8zm0-4h4v4h-4V4zm6 12h4v4h-4v-4zm0-12h4v4h-4V4z"/></svg>
              </button>
              <button 
                class="icon-btn"
                :class="{ active: crossAlign === 'end' }"
                @click="emitUpdate({ crossAlign: 'end' })"
                title="末尾对齐"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 16h4V20H6v-4zm12-12h4v12h-4V4z"/></svg>
              </button>
              <button 
                class="icon-btn"
                :class="{ active: crossAlign === 'stretch' }"
                @click="emitUpdate({ crossAlign: 'stretch' })"
                title="拉伸填充"
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h4v4H4V4zm0 8h4v4H4v-4zm0 8h4v4H4v-4zm12 0h4v4h-4v-4zm0-8h4v4h-4v-4zm0-8h4v4h-4V4z"/></svg>
              </button>
            </div>
          </div>

          <!-- 间距 -->
          <div class="property-row">
            <label class="prop-label">间距</label>
            <div class="input-wrapper">
              <input 
                type="number" 
                class="number-input"
                :value="gap" 
                min="0"
                @input="onInputGap"
              />
              <span class="unit">px</span>
            </div>
          </div>

          <!-- 内边距 -->
          <div class="property-row">
            <label class="prop-label">内边距</label>
            <div class="padding-inputs">
              <input 
                type="number" 
                class="padding-input" 
                :value="padding.top"
                min="0"
                @input="onPaddingChange('top', $event)"
                placeholder="上"
              />
              <input 
                type="number" 
                class="padding-input" 
                :value="padding.right"
                min="0"
                @input="onPaddingChange('right', $event)"
                placeholder="右"
              />
              <input 
                type="number" 
                class="padding-input" 
                :value="padding.bottom"
                min="0"
                @input="onPaddingChange('bottom', $event)"
                placeholder="下"
              />
              <input 
                type="number" 
                class="padding-input" 
                :value="padding.left"
                min="0"
                @input="onPaddingChange('left', $event)"
                placeholder="左"
              />
            </div>
          </div>
        </template>
      </div>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PropertySection from './PropertySection.vue'

const props = defineProps<{
  layoutMode?: 'manual' | 'auto'
  direction?: 'row' | 'column'
  primaryAlign?: 'start' | 'center' | 'end' | 'between' | 'evenly'
  crossAlign?: 'start' | 'center' | 'end' | 'stretch'
  gap?: number
  padding?: { top: number; right: number; bottom: number; left: number }
}>()

const emit = defineEmits<{
  (e: 'update', updates: Record<string, any>): void
}>()

const layoutMode = computed(() => props.layoutMode || 'manual')
const direction = computed(() => props.direction || 'row')
const primaryAlign = computed(() => props.primaryAlign || 'start')
const crossAlign = computed(() => props.crossAlign || 'stretch')
const gap = computed(() => props.gap ?? 8)
const padding = computed(() => props.padding || { top: 8, right: 8, bottom: 8, left: 8 })

function emitUpdate(updates: Record<string, any>) {
  emit('update', updates)
}

function onInputGap(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  emitUpdate({ gap: isNaN(val) ? 0 : val })
}

function onPaddingChange(side: string, e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  const newPadding = { ...padding.value, [side]: isNaN(val) ? 0 : val }
  emitUpdate({ padding: newPadding })
}
</script>

<style scoped>
.layout-properties {
  padding: 0;
}

.property-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.property-row:last-child {
  margin-bottom: 0;
}

.prop-label {
  width: 70px;
  font-size: 11px;
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
}

.segmented-wrapper {
  flex: 1;
}

.segmented-control {
  display: flex;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.segmented-btn {
  flex: 1;
  height: 26px;
  border: none;
  background: transparent;
  font-size: 11px;
  color: #666;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.segmented-btn:hover {
  background: #f5f5f5;
}

.segmented-btn.active {
  background: #e6f7ff;
  color: #1890ff;
}

.segmented-btn:not(:last-child) {
  border-right: 1px solid #e5e5e5;
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.number-input {
  flex: 1;
  width: 100%;
  height: 26px;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  padding: 0 8px;
  font-size: 11px;
  outline: none;
  background: white;
  transition: all 0.2s;
  text-align: right;
}

.number-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.unit {
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
}

.align-group {
  flex: 1;
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.icon-btn {
  width: 28px;
  height: 26px;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
  color: #666;
}

.icon-btn:hover {
  border-color: #d9d9d9;
  background: #fafafa;
}

.icon-btn.active {
  background: #e6f7ff;
  border-color: #1890ff;
}

.icon-btn.active svg {
  color: #1890ff;
}

.padding-inputs {
  flex: 1;
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.padding-input {
  width: 40px;
  height: 26px;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  padding: 0 4px;
  font-size: 11px;
  text-align: center;
  outline: none;
  background: white;
  transition: all 0.2s;
}

.padding-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}
</style>
