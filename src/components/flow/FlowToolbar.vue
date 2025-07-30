<script setup lang="ts">
const emit = defineEmits<{
  action: [action: string]
}>()

const handleAction = (action: string) => {
  emit('action', action)
}
</script>

<template>
  <div class="toolbar">
    <div class="button-group">
      <button @click="handleAction('save')" data-tooltip="保存流程图">
        <span class="icon">💾</span>
        保存
      </button>
      <button @click="handleAction('export')" data-tooltip="导出流程图">
        <span class="icon">📤</span>
        导出
      </button>
      <button @click="handleAction('import')" data-tooltip="导入流程图">
        <span class="icon">📥</span>
        导入
      </button>
      <button @click="handleAction('clear')" data-tooltip="清空画布">
        <span class="icon">🗑️</span>
        清空
      </button>
    </div>
    <div class="divider"></div>
    <div class="button-group">
      <button @click="handleAction('undo')" data-tooltip="撤销">
        <span class="icon">↶</span>
      </button>
      <button @click="handleAction('redo')" data-tooltip="重做">
        <span class="icon">↷</span>
      </button>
    </div>
    <div class="divider"></div>
    <div class="button-group">
      <button @click="handleAction('autoLayout')" data-tooltip="自动布局">
        <span class="icon">🎯</span>
        自动布局
      </button>
      <button @click="handleAction('fitView')" data-tooltip="适应画布">
        <span class="icon">🔍</span>
        适应画布
      </button>
    </div>
    <div class="divider"></div>
    <span>用户注册流程演示</span>
  </div>
</template>

<style scoped>
.toolbar {
  height: 40px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  user-select: none;
}

.toolbar button {
  height: 28px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #1f1f1f;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar button:hover {
  background: #f5f5f5;
}

.divider {
  width: 1px;
  height: 24px;
  background: #e5e5e5;
  margin: 0 4px;
}

.button-group {
  display: flex;
  gap: 4px;
}
</style>