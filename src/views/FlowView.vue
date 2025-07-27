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

const { onPaneReady, onNodeDragStop, onConnect, addEdges } = useVueFlow()

// 连接节点时添加边
onConnect(addEdges)

// 节点拖拽结束事件
onNodeDragStop((event) => {
  console.log('节点拖拽结束:', event)
})

// 画布准备就绪事件
onPaneReady((instance) => {
  console.log('Vue Flow 准备就绪:', instance)
  instance.fitView()
})
</script>

<template>
  <div class="flow-container">
    <!-- 顶部工具栏 -->
    <div class="flow-toolbar">
      <h2>流程图编辑器</h2>
      <div class="toolbar-actions">
        <button @click="() => {}">保存</button>
        <button @click="() => {}">导出</button>
        <button @click="() => {}">清空</button>
      </div>
    </div>

    <!-- Vue Flow 主体 -->
    <div class="flow-wrapper">
      <VueFlow
        :nodes="initialNodes"
        :edges="initialEdges"
        class="vue-flow"
        :default-viewport="{ zoom: 1.5 }"
        :min-zoom="0.2"
        :max-zoom="4"
      >
        <!-- 背景 -->
        <Background pattern-color="#aaa" :gap="16" />
        
        <!-- 控制面板 -->
        <Controls />
        
        <!-- 小地图 -->
        <MiniMap />
        
        <!-- 自定义面板 -->
        <Panel position="top-right">
          <div class="flow-panel">
            <h4>节点工具</h4>
            <button>添加节点</button>
            <button>删除选中</button>
          </div>
        </Panel>
      </VueFlow>
    </div>
  </div>
</template>

<style scoped>
.flow-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.flow-toolbar {
  height: 60px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.flow-toolbar h2 {
  margin: 0;
  color: #333;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.toolbar-actions button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-actions button:hover {
  background: #f0f0f0;
  border-color: #999;
}

.flow-wrapper {
  flex: 1;
  position: relative;
}

.vue-flow {
  height: 100%;
}

.flow-panel {
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 120px;
}

.flow-panel h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}

.flow-panel button {
  display: block;
  width: 100%;
  margin-bottom: 5px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.flow-panel button:hover {
  background: #f0f0f0;
}
</style>