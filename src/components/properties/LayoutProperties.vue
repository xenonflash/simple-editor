<template>
  <PropertySection title="布局">
    <template #content>
      <div class="property-grid">
        <div class="property-item">
          <label>X</label>
          <input type="number" 
                 :value="props.x" 
                 @input="updateValue('x', $event)" />
        </div>
        <div class="property-item">
          <label>Y</label>
          <input type="number" 
                 :value="props.y" 
                 @input="updateValue('y', $event)" />
        </div>
        <div class="property-item">
          <label>W</label>
          <input type="number" 
                 :value="props.width" 
                 @input="updateValue('width', $event)" />
        </div>
        <div class="property-item">
          <label>H</label>
          <input type="number" 
                 :value="props.height" 
                 @input="updateValue('height', $event)" />
        </div>
      </div>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import PropertySection from './PropertySection.vue';

const props = defineProps<{
  x: number;
  y: number;
  width?: number;
  height?: number;
}>();

const emit = defineEmits(['update']);

function updateValue(key: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  emit('update', { [key]: value });
}
</script>

<style scoped>
.property-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
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
