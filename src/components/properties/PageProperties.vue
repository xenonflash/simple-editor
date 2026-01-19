<template>
  <div class="page-properties">
    <!-- 基本信息 -->
    <PropertySection title="基本信息">
      <template #content>
        <div class="form-group">
          <label>页面名称</label>
          <input 
            type="text" 
            :value="page.name" 
            @input="updateProperty('name', $event)"
            class="form-input"
            placeholder="请输入页面名称"
          />
        </div>
        
        <div class="form-group">
          <label>页面描述</label>
          <textarea 
            :value="page.description" 
            @input="updateProperty('description', $event)"
            class="form-textarea"
            placeholder="请输入页面描述"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>创建时间</label>
          <div class="readonly-value">{{ formatDate(page.createdAt) }}</div>
        </div>
        
        <div class="form-group">
          <label>更新时间</label>
          <div class="readonly-value">{{ formatDate(page.updatedAt) }}</div>
        </div>
      </template>
    </PropertySection>

    <!-- 页面尺寸 -->
    <PropertySection title="页面尺寸">
      <template #content>
        <div class="form-row">
          <div class="form-group">
            <label>宽度</label>
            <input 
              type="number" 
              :value="page.width || 1200" 
              @input="updateProperty('width', $event)"
              class="form-input"
              min="320"
              max="3840"
            />
          </div>
          <div class="form-group">
            <label>高度</label>
            <input 
              type="number" 
              :value="page.height || 800" 
              @input="updateProperty('height', $event)"
              class="form-input"
              min="240"
              max="2160"
            />
          </div>
        </div>
      </template>
    </PropertySection>

    <!-- 背景设置 -->
    <PropertySection title="背景设置">
      <template #content>
        <div class="form-group">
          <label>背景颜色</label>
          <div class="color-input-group">
            <input 
              type="color" 
              :value="page.backgroundColor || '#ffffff'" 
              @input="updateProperty('backgroundColor', $event)"
              class="color-picker"
            />
            <input 
              type="text" 
              :value="page.backgroundColor || '#ffffff'" 
              @input="updateProperty('backgroundColor', $event)"
              class="color-text"
              placeholder="#ffffff"
            />
          </div>
        </div>
      </template>
    </PropertySection>

    <!-- 页面布局 (使用新组件) -->
    <PropertySection title="页面布局">
      <template #content>
        <FlexLayoutSettings 
          :modeValue="page.layoutMode"
          :direction="page.layoutDirection"
          :justify="page.layoutJustifyContent"
          :align="page.layoutAlignItems"
          :gap="page.layoutGap"
          
          modeKey="layoutMode"
          justifyKey="layoutJustifyContent"
          alignKey="layoutAlignItems"
          
          :modes="{ manual: 'canvas', auto: 'flow' }"
          :labels="{ manual: '画布 (Canvas)', auto: '流式 (Flow)' }"
          
          @update="handleLayoutUpdate"
        />
      </template>
    </PropertySection>

    <!-- 内边距 -->
    <PropertySection title="内边距">
      <template #content>
        <div class="padding-grid">
          <div class="padding-item">
            <label>上</label>
            <input 
              type="number" 
              :value="page.padding?.top || 20" 
              @input="updatePadding('top', $event)"
              class="form-input"
              min="0"
            />
          </div>
          <div class="padding-item">
            <label>右</label>
            <input 
              type="number" 
              :value="page.padding?.right || 20" 
              @input="updatePadding('right', $event)"
              class="form-input"
              min="0"
            />
          </div>
          <div class="padding-item">
            <label>下</label>
            <input 
              type="number" 
              :value="page.padding?.bottom || 20" 
              @input="updatePadding('bottom', $event)"
              class="form-input"
              min="0"
            />
          </div>
          <div class="padding-item">
            <label>左</label>
            <input 
              type="number" 
              :value="page.padding?.left || 20" 
              @input="updatePadding('left', $event)"
              class="form-input"
              min="0"
            />
          </div>
        </div>
      </template>
    </PropertySection>

    <!-- SEO设置 -->
    <!-- <PropertySection title="SEO设置">
      <template #content>
        <div class="form-group">
          <label>SEO标题</label>
          <input 
            type="text" 
            :value="page.seo?.title || ''" 
            @input="updateSEO('title', $event.target.value)"
            class="form-input"
            placeholder="页面SEO标题"
          />
        </div>
        
        <div class="form-group">
          <label>SEO描述</label>
          <textarea 
            :value="page.seo?.description || ''" 
            @input="updateSEO('description', $event.target.value)"
            class="form-textarea"
            placeholder="页面SEO描述"
            rows="2"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>关键词</label>
          <input 
            type="text" 
            :value="page.seo?.keywords || ''" 
            @input="updateSEO('keywords', $event.target.value)"
            class="form-input"
            placeholder="关键词，用逗号分隔"
          />
        </div>
      </template>
    </PropertySection> -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Page } from '../../types/page';
import { usePageStore } from '../../stores/page';
import PropertySection from './PropertySection.vue';
import FlexLayoutSettings from './FlexLayoutSettings.vue';

const pageStore = usePageStore();

const props = defineProps<{
  page: Page;
}>();

function handleLayoutUpdate(updates: any) {
    pageStore.updatePageProperties(props.page.id, updates);
}

// 更新页面属性
function updateProperty(key: keyof Page, valueOrEvent: any) {
  let value: any;
  
  if (valueOrEvent instanceof Event || (valueOrEvent && valueOrEvent.target)) {
      value = (valueOrEvent.target as HTMLInputElement).value;
  } else {
      value = valueOrEvent;
  }

  if (['width', 'height'].includes(key)) {
    value = parseInt(value);
  }
  pageStore.updatePageProperties(props.page.id, { [key]: value });
}

// 更新内边距
function updatePadding(side: 'top' | 'right' | 'bottom' | 'left', $event: Event) {
  const value = ($event.target as HTMLInputElement).value;
  const currentPadding = props.page.padding || { top: 20, right: 20, bottom: 20, left: 20 };
  const newPadding = { ...currentPadding, [side]: parseInt(value) };
  pageStore.updatePageProperties(props.page.id, { padding: newPadding });
}

// 更新SEO设置
// function updateSEO(key: 'title' | 'description' | 'keywords', value: string) {
//   const currentSEO = props.page.seo || { title: '', description: '', keywords: '' };
//   const newSEO = { ...currentSEO, [key]: value };
//   pageStore.updatePageProperties(props.page.id, { seo: newSEO });
// }

// 格式化日期
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
/* 移除原有的 .section, .section-header, .section-content 样式 */

.page-properties {
  /* 保持外层容器样式 */
}

.form-group {
  margin-bottom: 8px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 11px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.form-input,
.form-textarea,
.color-text {
  width: 100%;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  font-family: inherit;
  background: white;
  outline: none;
  box-sizing: border-box;
}

.form-textarea {
  height: auto;
  min-height: 48px;
  padding: 4px 6px;
  resize: vertical;
}

.form-input:hover,
.form-textarea:hover,
.color-text:hover {
  border-color: #d9d9d9;
}

.form-input:focus,
.form-textarea:focus,
.color-text:focus {
  border-color: #000;
}

.readonly-value {
  height: 24px;
  padding: 0 6px;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  color: #666;
  font-size: 11px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.form-row {
  display: flex;
  gap: 8px;
}

.form-row .form-group {
  flex: 1;
}

.color-input-group {
  display: flex;
  gap: 6px;
  align-items: center;
}

.color-picker {
  width: 24px;
  height: 24px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  cursor: pointer;
  padding: 0;
  background: none;
  outline: none;
}

.color-picker:hover {
  border-color: #d9d9d9;
}

.color-picker:focus {
  border-color: #000;
}

.color-text {
  flex: 1;
}

.padding-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.padding-item {
  display: flex;
  flex-direction: column;
}

.padding-item label {
  font-size: 11px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.padding-item input {
  width: 100%;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  font-family: inherit;
  background: white;
  outline: none;
  box-sizing: border-box;
}

.padding-item input:hover {
  border-color: #d9d9d9;
}

.padding-item input:focus {
  border-color: #000;
}

/* 移除数字输入框的箭头 */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

.segmented-wrapper {
  background: #f5f5f5;
  padding: 2px;
  border-radius: 4px;
}

.segmented-control {
  display: flex;
  width: 100%;
}

.segmented-btn {
  flex: 1;
  border: none;
  background: transparent;
  padding: 4px;
  font-size: 11px;
  color: #666;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s;
}

.segmented-btn.active {
  background: white;
  color: #000;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  font-weight: 500;
}

.align-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.icon-btn {
  width: 28px;
  height: 28px;
  padding: 4px;
  border: 1px solid #e5e5e5;
  background: white;
  border-radius: 3px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  border-color: #d9d9d9;
  background: #fafafa;
}

.icon-btn.active {
  background: #eff6ff; 
  border-color: #2563eb;
  color: #2563eb;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
</style>