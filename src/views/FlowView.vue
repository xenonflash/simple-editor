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

// 复杂的低代码场景演示数据
const initialNodes = ref([
  // 开始节点
  {
    id: 'start',
    type: 'input',
    data: { 
      label: '用户注册流程开始',
      description: '触发器：用户提交注册表单'
    },
    position: { x: 100, y: 50 },
    style: {
      background: '#e1f5fe',
      border: '2px solid #01579b',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 'bold'
    }
  },
  
  // 数据验证节点
  {
    id: 'validate',
    data: { 
      label: '数据验证',
      description: '验证邮箱格式、密码强度等'
    },
    position: { x: 100, y: 150 },
    style: {
      background: '#f3e5f5',
      border: '2px solid #4a148c',
      borderRadius: '8px'
    }
  },
  
  // 判断节点
  {
    id: 'decision1',
    data: { 
      label: '验证是否通过？',
      description: '条件判断节点'
    },
    position: { x: 100, y: 250 },
    style: {
      background: '#fff3e0',
      border: '2px solid #e65100',
      borderRadius: '50%',
      width: '120px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  },
  
  // 错误处理节点
  {
    id: 'error',
    data: { 
      label: '返回错误信息',
      description: '显示具体的验证错误'
    },
    position: { x: 300, y: 250 },
    style: {
      background: '#ffebee',
      border: '2px solid #c62828',
      borderRadius: '8px'
    }
  },
  
  // 检查用户是否存在
  {
    id: 'checkUser',
    data: { 
      label: '检查用户是否存在',
      description: '查询数据库'
    },
    position: { x: 100, y: 350 },
    style: {
      background: '#e8f5e8',
      border: '2px solid #2e7d32'
    }
  },
  
  // 第二个判断节点
  {
    id: 'decision2',
    data: { 
      label: '用户已存在？',
      description: '检查重复注册'
    },
    position: { x: 100, y: 450 },
    style: {
      background: '#fff3e0',
      border: '2px solid #e65100',
      borderRadius: '50%',
      width: '120px',
      height: '80px'
    }
  },
  
  // 用户已存在处理
  {
    id: 'userExists',
    data: { 
      label: '用户已存在提示',
      description: '引导用户登录'
    },
    position: { x: 300, y: 450 },
    style: {
      background: '#fff8e1',
      border: '2px solid #f57f17'
    }
  },
  
  // 创建用户账户
  {
    id: 'createUser',
    data: { 
      label: '创建用户账户',
      description: '插入用户数据到数据库'
    },
    position: { x: 100, y: 550 },
    style: {
      background: '#e8f5e8',
      border: '2px solid #2e7d32'
    }
  },
  
  // 发送验证邮件
  {
    id: 'sendEmail',
    data: { 
      label: '发送验证邮件',
      description: '异步任务：发送邮件验证'
    },
    position: { x: 100, y: 650 },
    style: {
      background: '#e3f2fd',
      border: '2px solid #1565c0'
    }
  },
  
  // 并行处理：创建用户目录
  {
    id: 'createFolder',
    data: { 
      label: '创建用户目录',
      description: '并行任务：初始化用户文件夹'
    },
    position: { x: 300, y: 650 },
    style: {
      background: '#f1f8e9',
      border: '2px solid #558b2f'
    }
  },
  
  // 记录日志
  {
    id: 'log',
    data: { 
      label: '记录注册日志',
      description: '系统日志记录'
    },
    position: { x: 500, y: 650 },
    style: {
      background: '#fafafa',
      border: '2px solid #616161'
    }
  },
  
  // 等待邮件验证
  {
    id: 'waitVerify',
    data: { 
      label: '等待邮件验证',
      description: '用户点击邮件链接'
    },
    position: { x: 200, y: 750 },
    style: {
      background: '#fff9c4',
      border: '2px solid #f9a825'
    }
  },
  
  // 激活账户
  {
    id: 'activate',
    data: { 
      label: '激活用户账户',
      description: '更新用户状态为已激活'
    },
    position: { x: 200, y: 850 },
    style: {
      background: '#e8f5e8',
      border: '2px solid #2e7d32'
    }
  },
  
  // 发送欢迎消息
  {
    id: 'welcome',
    data: { 
      label: '发送欢迎消息',
      description: '推送通知或短信'
    },
    position: { x: 200, y: 950 },
    style: {
      background: '#e3f2fd',
      border: '2px solid #1565c0'
    }
  },
  
  // 结束节点
  {
    id: 'end',
    type: 'output',
    data: { 
      label: '注册流程完成',
      description: '用户成功注册并激活'
    },
    position: { x: 200, y: 1050 },
    style: {
      background: '#e8f5e8',
      border: '2px solid #2e7d32',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 'bold'
    }
  },
  
  // 子流程节点
  {
    id: 'subprocess',
    data: { 
      label: '用户权限初始化',
      description: '子流程：设置默认权限'
    },
    position: { x: 400, y: 850 },
    style: {
      background: '#f3e5f5',
      border: '3px double #4a148c',
      borderRadius: '8px'
    }
  }
])

// 复杂的边连接，展示不同类型的连接
const initialEdges = ref([
  // 主流程
  { 
    id: 'e1', 
    source: 'start', 
    target: 'validate',
    animated: true,
    style: { stroke: '#01579b', strokeWidth: 2 }
  },
  { 
    id: 'e2', 
    source: 'validate', 
    target: 'decision1',
    style: { stroke: '#4a148c', strokeWidth: 2 }
  },
  
  // 验证失败分支
  { 
    id: 'e3', 
    source: 'decision1', 
    target: 'error',
    label: '验证失败',
    type: 'smoothstep',
    style: { stroke: '#c62828', strokeWidth: 2 },
    labelStyle: { fill: '#c62828', fontWeight: 'bold' }
  },
  
  // 验证成功分支
  { 
    id: 'e4', 
    source: 'decision1', 
    target: 'checkUser',
    label: '验证通过',
    style: { stroke: '#2e7d32', strokeWidth: 2 },
    labelStyle: { fill: '#2e7d32', fontWeight: 'bold' }
  },
  
  { 
    id: 'e5', 
    source: 'checkUser', 
    target: 'decision2',
    style: { stroke: '#2e7d32', strokeWidth: 2 }
  },
  
  // 用户已存在分支
  { 
    id: 'e6', 
    source: 'decision2', 
    target: 'userExists',
    label: '已存在',
    type: 'smoothstep',
    style: { stroke: '#f57f17', strokeWidth: 2 },
    labelStyle: { fill: '#f57f17', fontWeight: 'bold' }
  },
  
  // 用户不存在，继续创建
  { 
    id: 'e7', 
    source: 'decision2', 
    target: 'createUser',
    label: '不存在',
    style: { stroke: '#2e7d32', strokeWidth: 2 },
    labelStyle: { fill: '#2e7d32', fontWeight: 'bold' }
  },
  
  { 
    id: 'e8', 
    source: 'createUser', 
    target: 'sendEmail',
    style: { stroke: '#2e7d32', strokeWidth: 2 }
  },
  
  // 并行分支
  { 
    id: 'e9', 
    source: 'createUser', 
    target: 'createFolder',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#558b2f', strokeWidth: 2, strokeDasharray: '5,5' }
  },
  
  { 
    id: 'e10', 
    source: 'createUser', 
    target: 'log',
    type: 'smoothstep',
    style: { stroke: '#616161', strokeWidth: 2, strokeDasharray: '5,5' }
  },
  
  // 汇聚到等待验证
  { 
    id: 'e11', 
    source: 'sendEmail', 
    target: 'waitVerify',
    style: { stroke: '#1565c0', strokeWidth: 2 }
  },
  
  { 
    id: 'e12', 
    source: 'createFolder', 
    target: 'waitVerify',
    type: 'smoothstep',
    style: { stroke: '#558b2f', strokeWidth: 2 }
  },
  
  { 
    id: 'e13', 
    source: 'waitVerify', 
    target: 'activate',
    animated: true,
    style: { stroke: '#f9a825', strokeWidth: 2 }
  },
  
  { 
    id: 'e14', 
    source: 'activate', 
    target: 'welcome',
    style: { stroke: '#2e7d32', strokeWidth: 2 }
  },
  
  // 子流程连接
  { 
    id: 'e15', 
    source: 'activate', 
    target: 'subprocess',
    type: 'smoothstep',
    style: { stroke: '#4a148c', strokeWidth: 2, strokeDasharray: '10,5' }
  },
  
  { 
    id: 'e16', 
    source: 'subprocess', 
    target: 'end',
    type: 'smoothstep',
    style: { stroke: '#4a148c', strokeWidth: 2 }
  },
  
  { 
    id: 'e17', 
    source: 'welcome', 
    target: 'end',
    style: { stroke: '#1565c0', strokeWidth: 2 }
  },
  
  // 错误处理回路
  { 
    id: 'e18', 
    source: 'error', 
    target: 'start',
    label: '重新开始',
    type: 'smoothstep',
    style: { stroke: '#c62828', strokeWidth: 2, strokeDasharray: '3,3' },
    labelStyle: { fill: '#c62828' }
  },
  
  { 
    id: 'e19', 
    source: 'userExists', 
    target: 'start',
    label: '返回登录',
    type: 'smoothstep',
    style: { stroke: '#f57f17', strokeWidth: 2, strokeDasharray: '3,3' },
    labelStyle: { fill: '#f57f17' }
  }
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
    setViewport({ x: 50, y: 20, zoom: 1 })
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
          <div class="icon">🚀</div>
          <div class="name">开始节点</div>
        </div>
        <div class="node-item" draggable="true">
          <div class="icon">⚙️</div>
          <div class="name">处理节点</div>
        </div>
        <div class="node-item" draggable="true">
          <div class="icon">❓</div>
          <div class="name">判断节点</div>
        </div>
        <div class="node-item" draggable="true">
          <div class="icon">🔄</div>
          <div class="name">循环节点</div>
        </div>
        <div class="node-item" draggable="true">
          <div class="icon">📧</div>
          <div class="name">通知节点</div>
        </div>
        <div class="node-item" draggable="true">
          <div class="icon">💾</div>
          <div class="name">数据节点</div>
        </div>
        <div class="node-item" draggable="true">
          <div class="icon">🔗</div>
          <div class="name">API节点</div>
        </div>
        <div class="node-item" draggable="true">
          <div class="icon">🏁</div>
          <div class="name">结束节点</div>
        </div>
      </div>
      
      <div class="panel-section">
        <div class="section-title">流程统计</div>
        <div class="stats">
          <div class="stat-item">
            <span class="label">节点数量:</span>
            <span class="value">{{ initialNodes.length }}</span>
          </div>
          <div class="stat-item">
            <span class="label">连接数量:</span>
            <span class="value">{{ initialEdges.length }}</span>
          </div>
          <div class="stat-item">
            <span class="label">分支数量:</span>
            <span class="value">4</span>
          </div>
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
          <button data-tooltip="导入流程图">
            <span class="icon">📥</span>
            导入
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
        <div class="button-group">
          <button data-tooltip="自动布局">
            <span class="icon">🎯</span>
            自动布局
          </button>
          <button data-tooltip="适应画布">
            <span class="icon">🔍</span>
            适应画布
          </button>
        </div>
        <div class="divider"></div>
        <span>用户注册流程演示</span>
      </div>

      <VueFlow
        :nodes="initialNodes"
        :edges="initialEdges"
        class="vue-flow"
        :min-zoom="0.1"
        :max-zoom="4"
        :snap-to-grid="true"
        :snap-grid="[20, 20]"
      >
        <!-- 网格背景 -->
        <Background pattern-color="#aaa" :gap="20" />
        
        <!-- 控制面板 -->
        <Controls />
        
        <!-- 小地图 -->
        <MiniMap 
          :node-color="(node) => {
            if (node.type === 'input') return '#e1f5fe'
            if (node.type === 'output') return '#e8f5e8'
            return '#f5f5f5'
          }"
        />
      </VueFlow>
    </div>

    <!-- 右侧属性面板 -->
    <div class="properties-panel">
      <div class="panel-content">
        <div class="tabs">
          <button class="tab-button active">节点属性</button>
          <button class="tab-button">流程配置</button>
        </div>
        <div class="tab-content">
          <div class="section">
            <div class="section-header">
              <span>当前选中</span>
            </div>
            <div class="section-content">
              <div class="property-row">
                <label class="property-label">节点ID</label>
                <input type="text" value="start" readonly />
              </div>
              <div class="property-row">
                <label class="property-label">节点标签</label>
                <input type="text" value="用户注册流程开始" />
              </div>
              <div class="property-row">
                <label class="property-label">节点类型</label>
                <select>
                  <option value="input" selected>开始节点</option>
                  <option value="default">处理节点</option>
                  <option value="output">结束节点</option>
                </select>
              </div>
              <div class="property-row">
                <label class="property-label">描述</label>
                <textarea rows="3" placeholder="节点描述信息...">触发器：用户提交注册表单</textarea>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-header">
              <span>样式设置</span>
            </div>
            <div class="section-content">
              <div class="property-row">
                <label class="property-label">背景颜色</label>
                <input type="color" value="#e1f5fe" />
              </div>
              <div class="property-row">
                <label class="property-label">边框颜色</label>
                <input type="color" value="#01579b" />
              </div>
              <div class="property-row">
                <label class="property-label">边框宽度</label>
                <input type="number" value="2" min="1" max="10" />
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-header">
              <span>执行配置</span>
            </div>
            <div class="section-content">
              <div class="property-row">
                <label class="checkbox-label">
                  <input type="checkbox" checked />
                  <span>启用节点</span>
                </label>
              </div>
              <div class="property-row">
                <label class="checkbox-label">
                  <input type="checkbox" />
                  <span>异步执行</span>
                </label>
              </div>
              <div class="property-row">
                <label class="property-label">超时时间(秒)</label>
                <input type="number" value="30" min="1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保持之前的样式，并添加新的样式 */
.flow-container {
  height: calc(100vh - 48px);
  display: flex;
  overflow: hidden;
}

/* 左侧面板新增样式 */
.panel-section {
  margin-top: 20px;
  padding: 0 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-item .label {
  font-size: 12px;
  color: #666;
}

.stat-item .value {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

/* 更新节点图标 */
.node-item .icon {
  font-size: 20px;
}

/* 属性面板新增样式 */
textarea {
  width: 100%;
  padding: 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  font-family: inherit;
  background: white;
  outline: none;
  resize: vertical;
}

textarea:hover {
  border-color: #d9d9d9;
}

textarea:focus {
  border-color: #000;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 11px;
  color: #333;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  height: auto;
  margin: 0;
}

/* 其他样式保持不变... */
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
  gap: 12px;
}

.node-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
  background: white;
}

.node-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.node-item .name {
  font-size: 11px;
  color: #333;
  text-align: center;
}

.flow-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
}

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

.vue-flow {
  flex: 1;
}

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
select {
  width: 100%;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  background: white;
  outline: none;
}

input:hover,
select:hover {
  border-color: #d9d9d9;
}

input:focus,
select:focus {
  border-color: #000;
}
</style>