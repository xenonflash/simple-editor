<template>
  <div class="board-toolbar">
    <!-- 预览模式切换 -->
    <div class="mode-toggle">
      <button 
        :class="{ active: isDesignMode }"
        @click="switchToDesign"
        data-tooltip="设计模式">
        <span class="icon">✏️</span>
        <span class="text">设计</span>
      </button>
      <button 
        :class="{ active: isPreviewMode }"
        @click="switchToPreview"
        data-tooltip="预览模式">
        <span class="icon">👁</span>
        <span class="text">预览</span>
      </button>
    </div>

    <div class="divider"></div>

    <div class="button-group">
      <button @click="undo" :disabled="!canUndo || isPreviewMode" data-tooltip="撤销 (⌘Z)">
        <span class="icon">↩</span>
        <span class="text">撤销</span>
      </button>
      <button @click="redo" :disabled="!canRedo || isPreviewMode" data-tooltip="重做 (⌘⇧Z)">
        <span class="icon">↪</span>
        <span class="text">重做</span>
      </button>
    </div>

    <div class="divider"></div>

    <div class="zoom-controls">
      <button @click="props.onZoomOut?.()" data-tooltip="缩小 (⌘-)">
        <span class="icon">－</span>
      </button>
      <span class="zoom-value">{{ Math.round(scale * 100) }}%</span>
      <button @click="props.onZoomIn?.()" data-tooltip="放大 (⌘+)">
        <span class="icon">＋</span>
      </button>
      <button @click="props.onResetZoom?.()" data-tooltip="重置缩放 (⌘0)">
        <span class="icon">↺</span>
      </button>
    </div>

    <div class="divider"></div>

    <button class="delete-button" 
          @click="deleteSelected"
            :disabled="!selected || isPreviewMode"
            data-tooltip="删除 (Delete)">
      <AppIcon name="trash" />
      <span class="text">删除</span>
    </button>

    <div class="divider"></div>

    <div class="button-group">
      <button @click="bringToFront" 
              :disabled="!selected || isPreviewMode"
              data-tooltip="置于顶层">
        <span class="icon">⬆</span>
      </button>
      <button @click="bringForward" 
              :disabled="!selected || isPreviewMode"
              data-tooltip="上移一层">
        <span class="icon">↑</span>
      </button>
      <button @click="sendBackward" 
              :disabled="!selected || isPreviewMode"
              data-tooltip="下移一层">
        <span class="icon">↓</span>
      </button>
      <button @click="sendToBack" 
              :disabled="!selected || isPreviewMode"
              data-tooltip="置于底层">
        <span class="icon">⬇</span>
      </button>
    </div>

    <div class="divider"></div>

    <div class="button-group">
      <button @click="handleExport" data-tooltip="导出到JSON">
        <span class="icon">⬇</span>
        <span class="text">导出</span>
      </button>
      <button @click="handleImport" :disabled="isPreviewMode" data-tooltip="从JSON导入">
        <span class="icon">⬆</span>
        <span class="text">导入</span>
      </button>
      <input ref="fileInput" type="file" accept="application/json" style="display: none" @change="onFileChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { usePageStore } from '../../stores/page'
import { useEditorStore } from '../../stores/editor'
import { history } from '../../utils/history'
import { exportToJSON, importFromJSON, downloadJSON, readJSONFile } from '../../utils/io'

const props = defineProps<{
  scale: number
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetZoom?: () => void
}>()

const message = useMessage()
const pageStore = usePageStore()
const editorStore = useEditorStore()

const canUndo = computed(() => history.canUndo())
const canRedo = computed(() => history.canRedo())
const selected = computed(() => pageStore.selectedComps.length > 0)

// 编辑器模式
const isDesignMode = computed(() => editorStore.isDesignMode)
const isPreviewMode = computed(() => editorStore.isPreviewMode)

function switchToDesign() {
  editorStore.switchToDesign()
  pageStore.selectComponent(null)
}

function switchToPreview() {
  editorStore.switchToPreview()
  pageStore.selectComponent(null)
}

function deleteSelected() {
  const res = pageStore.deleteSelectedComponents()
  if (res.blockedCount > 0) {
    message.warning('组件编辑模式下不允许删除最外层容器')
  }
}

function undo() {
  pageStore.undoHistoryAction()
}

function redo() {
  pageStore.redoHistoryAction()
}

function bringToFront() {
  pageStore.bringSelectedToFront()
}

function bringForward() {
  pageStore.bringSelectedForward()
}

function sendBackward() {
  pageStore.sendSelectedBackward()
}

function sendToBack() {
  pageStore.sendSelectedToBack()
}

function handleExport() {
  try {
    const jsonStr = exportToJSON(pageStore.currentComponents)
    const filename = `page-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
    downloadJSON(jsonStr, filename)
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败')
  }
}

const fileInput = ref<HTMLInputElement | null>(null)

function handleImport() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const jsonStr = await readJSONFile(file)
    const components = importFromJSON(jsonStr)
    pageStore.updateCurrentPageComponents(components)
  } catch (error) {
    console.error('导入失败:', error)
    message.error('导入失败')
  } finally {
    input.value = ''
  }
}
</script>

<style scoped>
.board-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 100;
  transition: all 0.3s ease;
  max-width: 90vw;
}

.board-toolbar:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
  transform: translateX(-50%) translateY(-1px);
}

.button-group, .zoom-controls {
  display: flex;
  align-items: center;
  gap: 2px;
}

button {
  background: none;
  border: none;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #333;
  font-size: 11px;
  transition: background-color 0.2s ease;
  position: relative;
  white-space: nowrap;
  min-width: auto;
}

button:hover {
  background-color: #f5f5f5;
}

button:disabled {
  color: #ccc;
  cursor: not-allowed;
  background-color: transparent;
}

/* 模式切换按钮组 */
.mode-toggle {
  display: flex;
  gap: 2px;
  background-color: #f0f0f0;
  border-radius: 6px;
  padding: 2px;
}

.mode-toggle button {
  border-radius: 4px;
  background-color: transparent;
  transition: all 0.2s ease;
}

.mode-toggle button.active {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: #2563eb;
}

.mode-toggle button:not(.active):hover {
  background-color: rgba(255, 255, 255, 0.5);
}

.icon {
  font-size: 14px;
  line-height: 1;
}

.text {
  font-weight: 500;
  font-size: 10px;
}

.divider {
  width: 1px;
  height: 16px;
  background-color: #e0e0e0;
  margin: 0 2px;
}

.zoom-value {
  padding: 0 6px;
  font-size: 11px;
  color: #555;
  min-width: 35px;
  text-align: center;
  font-weight: 500;
}

.delete-button {
  color: #e53e3e;
}

.delete-button:hover:not(:disabled) {
  background-color: #fed7d7;
}

/* Tooltip styles */
[data-tooltip] {
  position: relative;
}

[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 6px;
  background-color: #333;
  color: white;
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 10px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 101;
}

[data-tooltip]:hover::after {
  opacity: 1;
  visibility: visible;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .text {
    display: none;
  }
  
  button {
    padding: 6px;
  }
  
  .board-toolbar {
    gap: 2px;
  }
}
</style>