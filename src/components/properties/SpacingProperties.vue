# 间距属性组件
<template>
  <div class="section">
    <div class="section-header">
      <span>间距</span>
    </div>
    <div class="section-content">
      <div class="spacing-row">
        <!-- 内边距控制 -->
        <div class="spacing-group">
          <label>内边距</label>
          <div class="spacing-grid">
            <div class="spacing-cell">
              <input type="number" 
                     :value="props.paddingTop" 
                     @input="updatePadding('paddingTop', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <div class="spacing-cell">
              <input type="number" 
                     :value="props.paddingRight" 
                     @input="updatePadding('paddingRight', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <div class="spacing-cell">
              <input type="number" 
                     :value="props.paddingBottom" 
                     @input="updatePadding('paddingBottom', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <div class="spacing-cell">
              <input type="number" 
                     :value="props.paddingLeft" 
                     @input="updatePadding('paddingLeft', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <div class="spacing-icon">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path fill="#666" d="M2 2h8v8H2z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 外边距控制 -->
        <div class="spacing-group">
          <label>外边距</label>
          <div class="spacing-grid">
            <div class="spacing-cell">
              <input type="number" 
                     :value="props.marginTop" 
                     @input="updateMargin('marginTop', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <div class="spacing-cell">
              <input type="number" 
                     :value="props.marginRight" 
                     @input="updateMargin('marginRight', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <div class="spacing-cell">
              <input type="number" 
                     :value="props.marginBottom" 
                     @input="updateMargin('marginBottom', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <div class="spacing-cell">
              <input type="number" 
                     :value="props.marginLeft" 
                     @input="updateMargin('marginLeft', $event)"
                     min="0"
                     placeholder="0" />
            </div>
            <div class="spacing-icon">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path fill="#666" d="M4 4h4v4H4z"/>
                <path fill="#666" fill-opacity="0.2" d="M2 2h8v8H2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
.section {
  border-bottom: 1px solid #e5e5e5;
}

.section-header {
  height: 32px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fafafa;
}

.section-header span {
  font-size: 11px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-content {
  padding: 8px;
}

.spacing-row {
  display: flex;
  gap: 12px;
}

.spacing-group {
  flex: 1;
  min-width: 0;
}

.spacing-group label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.spacing-grid {
  position: relative;
  display: grid;
  width: 96px;
  height: 72px;
  margin: 0 auto;
  grid-template-columns: 36px 20px 36px;
  grid-template-rows: 22px 22px 22px;
  gap: 3px;
}

.spacing-cell {
  grid-column: 2;
  grid-row: 1;
}

.spacing-cell:nth-child(2) {
  grid-column: 3;
  grid-row: 2;
}

.spacing-cell:nth-child(3) {
  grid-column: 2;
  grid-row: 3;
}

.spacing-cell:nth-child(4) {
  grid-column: 1;
  grid-row: 2;
}

.spacing-cell input {
  width: 100%;
  height: 100%;
  padding: 0 2px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 12px;
  text-align: center;
  background: white;
}

.spacing-cell input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.2);
}

.spacing-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

input[type="number"] {
  -moz-appearance: textfield;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
