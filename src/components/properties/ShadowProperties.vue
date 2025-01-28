# 阴影属性组件
<template>
  <div class="section">
    <div class="section-header">
      <span>阴影</span>
    </div>
    <div class="section-content">
      <div class="property-grid">
        <div class="property-item">
          <label>水平偏移</label>
          <input type="number" 
                 :value="shadowX" 
                 @input="updateValue('shadowX', $event)" />
        </div>
        <div class="property-item">
          <label>垂直偏移</label>
          <input type="number" 
                 :value="shadowY" 
                 @input="updateValue('shadowY', $event)" />
        </div>
        <div class="property-item">
          <label>模糊半径</label>
          <input type="number" 
                 min="0"
                 :value="shadowBlur" 
                 @input="updateValue('shadowBlur', $event)" />
        </div>
        <div class="property-item">
          <label>扩散半径</label>
          <input type="number" 
                 :value="shadowSpread" 
                 @input="updateValue('shadowSpread', $event)" />
        </div>
        <div class="property-item full-width">
          <label>阴影颜色</label>
          <input type="color" 
                 :value="shadowColor" 
                 @input="updateValue('shadowColor', $event)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  shadowX?: number
  shadowY?: number
  shadowBlur?: number
  shadowSpread?: number
  shadowColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0,
  shadowSpread: 0,
  shadowColor: '#000000'
})

const emit = defineEmits<{
  (e: 'update', updates: Record<string, any>): void
}>()

const updateValue = (key: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.type === 'number' ? Number(target.value) : target.value
  emit('update', { [key]: value })
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
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.section-content {
  padding: 12px;
}

.property-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.property-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.property-item.full-width {
  grid-column: span 2;
}

.property-item label {
  font-size: 12px;
  color: #666;
}

.property-item input {
  height: 24px;
  padding: 0 4px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}

.property-item input[type="color"] {
  width: 100%;
  padding: 0;
  height: 32px;
}

.property-item input[type="number"] {
  width: 100%;
}
</style>
