<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  selectedNode: any
  selectedEdge: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [updates: any]
}>()

const activeTab = ref('node')
const nodeProperties = ref({
  id: '',
  label: '',
  type: 'default',
  description: '',
  backgroundColor: '#ffffff',
  borderColor: '#000000',
  borderWidth: 2
})

// 监听选中节点变化
watch(() => props.selectedNode, (newNode) => {
  if (newNode) {
    nodeProperties.value = {
      id: newNode.id || '',
      label: newNode.data?.label || '',
      type: newNode.type || 'default',
      description: newNode.data?.description || '',
      backgroundColor: newNode.style?.background || '#ffffff',
      borderColor: extractBorderColor(newNode.style?.border) || '#000000',
      borderWidth: extractBorderWidth(newNode.style?.border) || 2
    }
  }
}, { immediate: true })

// 提取边框颜色
const extractBorderColor = (border: string) => {
  if (!border) return '#000000'
  const match = border.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/)
  return match ? match[0] : '#000000'
}

// 提取边框宽度
const extractBorderWidth = (border: string) => {
  if (!border) return 2
  const match = border.match(/\d+/)
  return match ? parseInt(match[0]) : 2
}

const updateProperty = (key: string, value: any) => {
  nodeProperties.value[key as keyof typeof nodeProperties.value] = value
  
  // 构建更新对象
  const updates: any = {
    data: {
      ...props.selectedNode?.data,
      label: nodeProperties.value.label,
      description: nodeProperties.value.description
    },
    style: {
      ...props.selectedNode?.style,
      background: nodeProperties.value.backgroundColor,
      border: `${nodeProperties.value.borderWidth}px solid ${nodeProperties.value.borderColor}`
    }
  }
  
  if (key === 'type') {
    updates.type = value
  }
  
  emit('update', updates)
}
</script>

<template>
  <div class="properties-panel">
    <div class="panel-content">
      <div class="tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'node' }"
          @click="activeTab = 'node'"
        >
          节点属性
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'flow' }"
          @click="activeTab = 'flow'"
        >
          流程配置
        </button>
      </div>
      
      <div class="tab-content" v-if="activeTab === 'node'">
        <div class="section" v-if="selectedNode">
          <div class="section-header">
            <span>当前选中</span>
          </div>
          <div class="section-content">
            <div class="property-row">
              <label class="property-label">节点ID</label>
              <input type="text" :value="nodeProperties.id" readonly />
            </div>
            <div class="property-row">
              <label class="property-label">节点标签</label>
              <input 
                type="text" 
                :value="nodeProperties.label" 
                @input="updateProperty('label', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="property-row">
              <label class="property-label">节点类型</label>
              <select 
                :value="nodeProperties.type" 
                @change="updateProperty('type', ($event.target as HTMLSelectElement).value)"
              >
                <option value="input">开始节点</option>
                <option value="default">处理节点</option>
                <option value="decision">判断节点</option>
                <option value="output">结束节点</option>
              </select>
            </div>
            <div class="property-row">
              <label class="property-label">描述</label>
              <textarea 
                rows="3" 
                :value="nodeProperties.description"
                @input="updateProperty('description', ($event.target as HTMLTextAreaElement).value)"
                placeholder="节点描述信息..."
              ></textarea>
            </div>
          </div>
        </div>
        
        <div class="section" v-if="selectedNode">
          <div class="section-header">
            <span>样式设置</span>
          </div>
          <div class="section-content">
            <div class="property-row">
              <label class="property-label">背景颜色</label>
              <input 
                type="color" 
                :value="nodeProperties.backgroundColor"
                @input="updateProperty('backgroundColor', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="property-row">
              <label class="property-label">边框颜色</label>
              <input 
                type="color" 
                :value="nodeProperties.borderColor"
                @input="updateProperty('borderColor', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="property-row">
              <label class="property-label">边框宽度</label>
              <input 
                type="number" 
                :value="nodeProperties.borderWidth"
                @input="updateProperty('borderWidth', parseInt(($event.target as HTMLInputElement).value))"
                min="1" 
                max="10" 
              />
            </div>
          </div>
        </div>
        
        <div class="section" v-if="!selectedNode">
          <div class="section-content">
            <p class="no-selection">请选择一个节点或连线</p>
          </div>
        </div>
      </div>
      
      <div class="tab-content" v-if="activeTab === 'flow'">
        <div class="section">
          <div class="section-header">
            <span>流程设置</span>
          </div>
          <div class="section-content">
            <div class="property-row">
              <label class="property-label">流程名称</label>
              <input type="text" value="用户注册流程" />
            </div>
            <div class="property-row">
              <label class="property-label">流程版本</label>
              <input type="text" value="1.0.0" />
            </div>
            <div class="property-row">
              <label class="property-label">创建时间</label>
              <input type="text" :value="new Date().toLocaleDateString()" readonly />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.properties-panel {
  width: 240px;
  background: #ffffff;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs {
  height: 36px;
  display: flex;
  border-bottom: 1px solid #e5e5e5;
  padding: 0 8px;
}

.tab-button {
  height: 36px;
  padding: 0 16px;
  border: none;
  background: none;
  font-size: 11px;
  color: #333;
  cursor: pointer;
  position: relative;
  font-weight: 500;
}

.tab-button.active {
  color: #000;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #000;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

.section {
  border-bottom: 1px solid #e5e5e5;
}

.section-header {
  height: 32px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  background: #fafafa;
}

.section-header span {
  font-size: 11px;
  font-weight: 600;
  color: #333;
}

.section-content {
  padding: 8px;
}

.property-row {
  margin-bottom: 6px;
}

.property-label {
  display: block;
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
  font-weight: 500;
}

input[type="text"],
input[type="number"],
input[type="color"],
select,
textarea {
  width: 100%;
  padding: 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  background: white;
  outline: none;
}

input[type="text"],
input[type="number"],
select {
  height: 24px;
  padding: 0 6px;
}

textarea {
  resize: vertical;
  font-family: inherit;
}

input:hover,
select:hover,
textarea:hover {
  border-color: #d9d9d9;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #000;
}

.no-selection {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 20px;
}
</style>