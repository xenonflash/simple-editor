<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { Background } from '@vue-flow/background'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

// 初始节点和边
const initialNodes = ref([
  {
    id: '1',
    type: 'input',
    data: { label: '开始' },
    position: { x: 250, y: 25 },
  },
  {
    id: '2',
    data: { label: '处理步骤' },
    position: { x: 100, y: 125 },
  },
  {
    id: '3',
    type: 'output',
    data: { label: '结束' },
    position: { x: 250, y: 250 },
  },
])

const initialEdges = ref([
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
])

const { onPaneReady, onNodeDragStop, onConnect, addEdges, setViewport } = useVueFlow()

// 连接节点时添加边
onConnect(addEdges)

// 节点拖拽结束事件
onNodeDragStop((event) => {
  console.log('节点拖拽结束:', event)
})

// 画布准备就绪事件
onPaneReady((instance) => {
  console.log('Vue Flow 准备就绪:', instance)
  // 延迟设置视口，确保组件完全初始化
  setTimeout(() => {
    setViewport({ x: 100, y: 50, zoom: 1 })
  }, 100)
})
</script>

<template>
  <div class="flow-container">
    <!-- 左侧工具面板 -->
    <div class="left-panel">
      <div class="panel-title">流程节点</div>
      <div class="node-list">
        <div class="node-item" draggable="true">
          <div class="icon">○</div>
          <div class="name">开始节点</div>
        </div>
        <div class="node-item" draggable="true">
          <div class="icon">□</div>
          <div class="name">处理节点</div>
        </div>
        <div class="node-item" draggable="true">
          <div class="icon">◇</div>
          <div class="name">判断节点</div>
        </div>
        <div class="node-item" draggable="true">
          <div class="icon">●</div>
          <div class="name">结束节点</div>
        </div>
      </div>
    </div>

    <!-- Vue Flow 主体 -->
    <div class="flow-wrapper">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="button-group">
          <button data-tooltip="保存流程图">
            <span class="icon">💾</span>
            保存
          </button>
          <button data-tooltip="导出流程图">
            <span class="icon">📤</span>
            导出
          </button>
          <button data-tooltip="清空画布">
            <span class="icon">🗑️</span>
            清空
          </button>
        </div>
        <div class="divider"></div>
        <div class="button-group">
          <button data-tooltip="撤销">
            <span class="icon">↶</span>
          </button>
          <button data-tooltip="重做">
            <span class="icon">↷</span>
          </button>
        </div>
        <div class="divider"></div>
        <span>缩放: 100%</span>
      </div>

      <VueFlow
        :nodes="initialNodes"
        :edges="initialEdges"
        class="vue-flow"
        :default-viewport="{ zoom: 0.2 }"
        :min-zoom="0.2"
        :max-zoom="4"
      >
        <!-- 背景 -->
        <Background pattern-color="#aaa" :gap="16" />
        
        <!-- 控制面板 -->
        <Controls />
        
        <!-- 小地图 -->
        <MiniMap />
      </VueFlow>
    </div>

    <!-- 右侧属性面板 -->
    <div class="properties-panel">
      <div class="panel-content">
        <div class="tabs">
          <button class="tab-button active">属性</button>
          <button class="tab-button">样式</button>
        </div>
        <div class="tab-content">
          <div class="section">
            <div class="section-header">
              <span>节点属性</span>
            </div>
            <div class="section-content">
              <div class="property-row">
                <label class="property-label">节点标签</label>
                <input type="text" placeholder="输入节点标签..." />
              </div>
              <div class="property-row">
                <label class="property-label">节点类型</label>
                <select>
                  <option value="default">默认节点</option>
                  <option value="input">输入节点</option>
                  <option value="output">输出节点</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="empty-tip" style="display: none;">
        在画布中选择一个节点以查看属性
      </div>
    </div>
  </div>
</template>

<style scoped>
.flow-container {
  height: calc(100vh - 48px);
  display: flex;
  overflow: hidden;
}

/* 左侧面板样式 - 与HomeView保持一致 */
.left-panel {
  width: 240px;
  border-right: 1px solid #e0e0e0;
  background: white;
}

.panel-title {
  padding: 16px;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #e0e0e0;
}

.node-list {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.node-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  background: white;
}

.node-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.node-item:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.node-item .icon {
  font-size: 24px;
  color: #666;
}

.node-item .name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

/* 主体区域 */
.flow-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
}

/* 工具栏样式 - 与HomeView Board组件保持一致 */
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

.toolbar button:hover:not(:disabled) {
  background: #f5f5f5;
}

.toolbar button:active:not(:disabled) {
  background: #ebebeb;
  transform: scale(0.98);
}

.toolbar button .icon {
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.toolbar .divider {
  width: 1px;
  height: 24px;
  background: #e5e5e5;
  margin: 0 4px;
}

.toolbar .button-group {
  display: flex;
  gap: 4px;
}

.toolbar span {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.vue-flow {
  flex: 1;
}

/* 右侧属性面板样式 - 与HomeView保持一致 */
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
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.property-row {
  margin-bottom: 6px;
}

.property-row:last-child {
  margin-bottom: 0;
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
select {
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

input[type="text"]:hover,
input[type="number"]:hover,
select:hover {
  border-color: #d9d9d9;
}

input[type="text"]:focus,
input[type="number"]:focus,
select:focus {
  border-color: #000;
}

.empty-tip {
  padding: 16px;
  text-align: center;
  font-size: 11px;
  color: #999;
}
</style>