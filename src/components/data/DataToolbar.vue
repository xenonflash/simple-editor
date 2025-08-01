<template>
  <div class="data-toolbar">
    <div class="toolbar-left">
      <h2>数据管理</h2>
    </div>
    
    <div class="toolbar-right">
      <button class="btn btn-primary" @click="$emit('addVariable')">
        <AppIcon name="chart-bar" />
        添加变量
      </button>
      
      <button class="btn btn-primary" @click="$emit('addTable')">
        <AppIcon name="database" />
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
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.toolbar-left h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover {
  background: #5855eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
}

.btn-secondary {
  background: #f9fafb;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f3f4f6;
  border-color: #6366f1;
  color: #6366f1;
}

.btn-group {
  display: flex;
  gap: 4px;
}

.icon {
  font-size: 12px;
}
</style>