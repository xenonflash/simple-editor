<template>
  <PropertySection title="布局">
    <template #content>
      <!-- 流式布局专属设置 -->
      <div v-if="isFlowItem" class="flow-settings">
        <!-- 宽高模式切换 -->
        <div class="mode-switch">
          <label>宽度模式</label>
          <div class="segmented-control">
            <button 
              class="segmented-btn"
              :class="{ active: isProportional }"
              @click="switchToProportional"
            >
              比例 (Flex)
            </button>
            <button 
              class="segmented-btn"
              :class="{ active: !isProportional }"
              @click="switchToFixed"
            >
              固定
            </button>
          </div>
        </div>

        <!-- 比例设置 -->
        <div v-if="isProportional" class="property-grid">
          <div class="property-item span-2">
            <label>份数(Grow)</label>
            <input 
              type="number" 
              step="0.1"
              min="0"
              :value="props.flexGrow || 0" 
              @input="updateSimpleValue('flexGrow', $event)" 
            />
          </div>
        </div>
        
        <!-- 对齐方式 (Align Self) -->
        <div class="property-grid mt-2">
           <div class="property-item span-2" style="height: auto; align-items: flex-start;">
             <label style="margin-top: 6px;">对齐</label>
             <div class="align-group">
                <button class="icon-btn" title="auto" :class="{ active: !props.alignSelf || props.alignSelf === 'auto' }" @click="updateSimpleValue('alignSelf', 'auto')">
                  <span style="font-size:10px">Auto</span>
                </button>
                <button class="icon-btn" title="start" :class="{ active: props.alignSelf === 'flex-start' }" @click="updateSimpleValue('alignSelf', 'flex-start')">
                   <svg viewBox="0 0 24 24"><path d="M4 4h16v2H4zM8 9h8v2H8zm0 5h8v2H8z"/></svg>
                </button>
                <button class="icon-btn" title="center" :class="{ active: props.alignSelf === 'center' }" @click="updateSimpleValue('alignSelf', 'center')">
                    <svg viewBox="0 0 24 24"><path d="M4 11h16v2H4zM8 7h8v2H8zm0 8h8v2H8z"/></svg>
                </button>
                <button class="icon-btn" title="end" :class="{ active: props.alignSelf === 'flex-end' }" @click="updateSimpleValue('alignSelf', 'flex-end')">
                    <svg viewBox="0 0 24 24"><path d="M4 18h16v2H4zM8 13h8v2H8zm0-5h8v2H8z"/></svg>
                </button>
                <button class="icon-btn" title="stretch" :class="{ active: props.alignSelf === 'stretch' }" @click="updateSimpleValue('alignSelf', 'stretch')">
                   <svg viewBox="0 0 24 24"><path d="M4 4h2v16H4zm14 0h2v16h-2zM8 8h8v2H8zm0 6h8v2H8z"/></svg>
                </button>
             </div>
           </div>
        </div>
      </div>

      <div class="property-grid" :class="{ 'mt-2': isFlowItem }">
        <!-- 坐标 (仅非流式显示) -->
        <template v-if="!isFlowItem">
          <div class="property-item">
            <label>X</label>
            <input type="number" 
                   step="1"
                   :value="props.x" 
                   @input="updateValue('x', $event)" />
          </div>
          <div class="property-item">
            <label>Y</label>
            <input type="number" 
                   step="1"
                   :value="props.y" 
                   @input="updateValue('y', $event)" />
          </div>
        </template>

        <!-- 尺寸 -->
        <div class="property-item span-2">
          <label>W</label>
          <div class="size-row">
            <input type="number" 
                   step="1"
                   :value="props.width" 
                   :disabled="effectiveWidthSizing !== 'fixed' && !(!isFlowItem || !isProportional)"
                   @input="updateValue('width', $event)" />
            <button class="size-btn" :class="{ active: effectiveWidthSizing === 'fill' }" @click="toggleSizing('width', 'fill')" title="撑满">
              &lt;-&gt;
            </button>
            <button class="size-btn" :class="{ active: effectiveWidthSizing === 'content' }" @click="toggleSizing('width', 'content')" title="基于内容">
              -&gt;&lt;-
            </button>
          </div>
        </div>
        <div class="property-item span-2">
          <label>H</label>
          <div class="size-row">
            <input type="number" 
                   step="1"
                   :value="props.height" 
                   :disabled="effectiveHeightSizing !== 'fixed'"
                   @input="updateValue('height', $event)" />
            <button class="size-btn" :class="{ active: effectiveHeightSizing === 'fill' }" @click="toggleSizing('height', 'fill')" title="撑满">
              &lt;-&gt;
            </button>
            <button class="size-btn" :class="{ active: effectiveHeightSizing === 'content' }" @click="toggleSizing('height', 'content')" title="基于内容">
              -&gt;&lt;-
            </button>
          </div>
        </div>
      </div>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import PropertySection from './PropertySection.vue';
import { computed } from 'vue';

const props = defineProps<{
  x: number;
  y: number;
  width?: number;
  height?: number;
  widthSizing?: 'fixed' | 'fill' | 'content';
  heightSizing?: 'fixed' | 'fill' | 'content';
  
  parentLayoutMode?: 'manual' | 'flow';
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string | number;
  alignSelf?: string;
}>();

const emit = defineEmits(['update']);

const effectiveWidthSizing = computed(() => props.widthSizing || 'fixed');
const effectiveHeightSizing = computed(() => props.heightSizing || 'fixed');

const isFlowItem = computed(() => props.parentLayoutMode === 'flow');
const isProportional = computed(() => (props.flexGrow ?? 0) > 0);

function switchToProportional() {
  emit('update', { 
    flexGrow: 1, 
    flexShrink: 1, 
    widthSizing: 'fixed',
    width: 0 // Typically for proportional item, width/basis is 0 or ignored
  });
}

function switchToFixed() {
  emit('update', { 
    flexGrow: 0, 
    flexShrink: 0 
  });
}

function updateSimpleValue(key: string, value: any) {
    if (value && value.target) {
         const valStr = (value.target as HTMLInputElement).value;
         const v = parseFloat(valStr);
         emit('update', { [key]: isNaN(v) ? valStr : v });
         return;
    }
    emit('update', { [key]: value });
}

function updateValue(key: string, event: Event) {
  if (key === 'width' && effectiveWidthSizing.value !== 'fixed' && (!isFlowItem.value || !isProportional.value)) return;
  if (key === 'height' && effectiveHeightSizing.value !== 'fixed') return;
  const raw = (event.target as HTMLInputElement).value;
  if (raw === '') return;
  const value = parseInt(raw, 10);
  if (Number.isNaN(value)) return;
  emit('update', { [key]: value });
}

function toggleSizing(axis: 'width' | 'height', mode: 'fill' | 'content') {
  if (axis === 'width') {
    const next = effectiveWidthSizing.value === mode ? 'fixed' : mode
    if (next === 'fill') {
      emit('update', { widthSizing: next, x: 0 })
      return
    }
    emit('update', { widthSizing: next });
    return;
  }
  const next = effectiveHeightSizing.value === mode ? 'fixed' : mode
  if (next === 'fill') {
    emit('update', { heightSizing: next, y: 0 })
    return
  }
  emit('update', { heightSizing: next });
}
</script>


<style scoped>
.property-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.span-2 {
  grid-column: span 2;
}

.property-item {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
}

.property-item label {
  width: 16px;
  font-size: 11px;
  color: #666;
  font-weight: 500;
  text-align: center;
}

input[type="number"] {
  width: 100%;
  height: 24px;
  padding: 0 8px;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  font-size: 11px;
  font-family: inherit;
  background: white;
  outline: none;
  transition: all 0.2s;
}

input[type="number"]:focus {
  border-color: #000;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

input[type="number"][disabled] {
  background: #fafafa;
  color: #999;
  cursor: not-allowed;
}

.size-row {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.size-row input[type="number"] {
  width: 50%;
  flex: 0 0 50%;
  min-width: 0;
}

.size-btn {
  height: 24px;
  min-width: 26px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  background: white;
  font-size: 10px;
  line-height: 22px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.size-btn:hover {
  border-color: #d9d9d9;
  background: #fafafa;
}

.size-btn.active {
  border-color: #000;
  color: #000;
  background: rgba(0, 0, 0, 0.05);
}

.flow-settings {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e5e5e5;
}

.mode-switch {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.mode-switch label {
  font-size: 11px;
  color: #666;
  width: 60px;
}

.segmented-control {
  flex: 1;
  display: flex;
  background: #f5f5f5;
  padding: 2px;
  border-radius: 4px;
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
    flex: 1;
}

.icon-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid #e5e5e5;
    background: white;
    border-radius: 3px;
    cursor: pointer;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-btn:hover { border-color: #d9d9d9; }
.icon-btn.active { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
.icon-btn svg { width: 16px; height: 16px; fill: currentColor; }

.mt-2 { margin-top: 8px; }
.mb-2 { margin-bottom: 8px; }
</style>
