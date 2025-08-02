# 间距属性组件
<template>
  <PropertySection title="间距">
    <template #content>
      <div class="spacing-row">
        <!-- 内边距 -->
        <div class="spacing-group">
          <label class="group-label">内边距</label>
          <div class="spacing-box">
            <!-- 上 -->
            <div class="spacing-input top">
              <input type="number" 
                     :value="props.paddingTop" 
                     @input="updatePadding('paddingTop', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <!-- 右 -->
            <div class="spacing-input right">
              <input type="number" 
                     :value="props.paddingRight" 
                     @input="updatePadding('paddingRight', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <!-- 下 -->
            <div class="spacing-input bottom">
              <input type="number" 
                     :value="props.paddingBottom" 
                     @input="updatePadding('paddingBottom', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <!-- 左 -->
            <div class="spacing-input left">
              <input type="number" 
                     :value="props.paddingLeft" 
                     @input="updatePadding('paddingLeft', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <!-- 中心图标 -->
            <div class="center-icon">
              <div class="icon-box"></div>
            </div>
          </div>
        </div>
        
        <!-- 外边距 - 补充完整实现 -->
        <div class="spacing-group">
          <label class="group-label">外边距</label>
          <div class="spacing-box">
            <!-- 上 -->
            <div class="spacing-input top">
              <input type="number" 
                     :value="props.marginTop" 
                     @input="updateMargin('marginTop', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <!-- 右 -->
            <div class="spacing-input right">
              <input type="number" 
                     :value="props.marginRight" 
                     @input="updateMargin('marginRight', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <!-- 下 -->
            <div class="spacing-input bottom">
              <input type="number" 
                     :value="props.marginBottom" 
                     @input="updateMargin('marginBottom', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <!-- 左 -->
            <div class="spacing-input left">
              <input type="number" 
                     :value="props.marginLeft" 
                     @input="updateMargin('marginLeft', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <!-- 中心图标 -->
            <div class="center-icon">
              <div class="icon-box margin"></div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import PropertySection from './PropertySection.vue';

const props = defineProps<{
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}>();

const emit = defineEmits(['update']);

function updatePadding(key: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  emit('update', { [key]: value });
}

function updateMargin(key: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  emit('update', { [key]: value });
}
</script>

<style scoped>
/* 移除原有的 .section, .section-header, .section-content 样式 */

/* 水平排列的行 */
.spacing-row {
  display: flex;
  gap: 8px;
}

.spacing-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-label {
  font-size: 10px;
  color: #666;
  font-weight: 500;
  margin: 0;
  text-align: center;
}

.spacing-box {
  position: relative;
  width: 80px;
  height: 64px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 24px 32px 24px;
  grid-template-rows: 16px 32px 16px;
  border-radius: 3px;
}

.spacing-input {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spacing-input.top {
  grid-column: 2;
  grid-row: 1;
}

.spacing-input.right {
  grid-column: 3;
  grid-row: 2;
}

.spacing-input.bottom {
  grid-column: 2;
  grid-row: 3;
}

.spacing-input.left {
  grid-column: 1;
  grid-row: 2;
}

.spacing-input input {
  width: 22px;
  height: 14px;
  padding: 0 1px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 9px;
  text-align: center;
  background: white;
  transition: all 0.2s;
}

.spacing-input input:hover {
  border-color: #40a9ff;
}

.spacing-input input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.2);
}

.center-icon {
  grid-column: 2;
  grid-row: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-box {
  width: 18px;
  height: 18px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  position: relative;
}

.icon-box::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: #666;
  border-radius: 1px;
}

.icon-box.margin::after {
  background: #999;
  border: 1px solid #666;
  width: 4px;
  height: 4px;
}

/* 禁用数字输入框的上下箭头 */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
