<template>
  <PropertySection title="布局">
    <template #content>
      <div class="property-grid">
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
        <div class="property-item span-2">
          <label>W</label>
          <div class="size-row">
            <input type="number" 
                   step="1"
                   :value="props.width" 
                   :disabled="effectiveWidthSizing !== 'fixed'"
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
}>();

const emit = defineEmits(['update']);

const effectiveWidthSizing = computed(() => props.widthSizing || 'fixed');
const effectiveHeightSizing = computed(() => props.heightSizing || 'fixed');

function updateValue(key: string, event: Event) {
  if (key === 'width' && effectiveWidthSizing.value !== 'fixed') return;
  if (key === 'height' && effectiveHeightSizing.value !== 'fixed') return;
  const raw = (event.target as HTMLInputElement).value;
  if (raw === '') return;
  const value = parseInt(raw, 10);
  if (Number.isNaN(value)) return;
  emit('update', { [key]: value });
}

function toggleSizing(axis: 'width' | 'height', mode: 'fill' | 'content') {
  if (axis === 'width') {
    emit('update', { widthSizing: effectiveWidthSizing.value === mode ? 'fixed' : mode });
    return;
  }
  emit('update', { heightSizing: effectiveHeightSizing.value === mode ? 'fixed' : mode });
}
</script>

<style scoped>
.property-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
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
  width: 14px;
  font-size: 11px;
  color: #333;
  font-weight: 500;
  text-align: center;
}

input[type="number"] {
  width: 100%;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  font-family: inherit;
  background: white;
  outline: none;
}

input[type="number"][disabled] {
  background: #fafafa;
  color: #999;
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
  border-radius: 2px;
  background: white;
  font-size: 10px;
  line-height: 22px;
  cursor: pointer;
  color: #333;
}

.size-btn:hover {
  border-color: #d9d9d9;
}

.size-btn.active {
  border-color: #1890ff;
  color: #1890ff;
}

input[type="number"]:hover {
  border-color: #d9d9d9;
}

input[type="number"]:focus {
  border-color: #000;
}

::-webkit-inner-spin-button {
  display: none;
}
</style>
