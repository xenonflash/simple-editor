<template>
  <div class="data-toolbar">
    <div class="toolbar-left">
      <h2>数据管理</h2>
    </div>
    
    <div class="toolbar-right">
      <button class="btn btn-primary" @click="$emit('addVariable')">
        <span class="icon">📊</span>
        添加变量
      </button>
      
      <button class="btn btn-primary" @click="$emit('addTable')">
        <span class="icon">🗃️</span>
        添加数据表
      </button>
      
      <div class="btn-group">
        <button class="btn btn-secondary" @click="$emit('import')">
          <span class="icon">📥</span>
          导入
        </button>
        
        <button class="btn btn-secondary" @click="$emit('export')">
          <span class="icon">📤</span>
          导出
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  addVariable: []
  addTable: []
  import: []
  export: []
}>()
</script>

<style scoped>
.data-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.icon {
  font-size: 16px;
}
</style>