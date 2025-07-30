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
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.toolbar-left h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
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
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f8f9fa;
  color: #555;
  border: 1px solid #e8e8e8;
}

.btn-secondary:hover {
  background: #e9ecef;
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
}

.btn-group {
  display: flex;
  gap: 8px;
}

.icon {
  font-size: 14px;
}
</style>