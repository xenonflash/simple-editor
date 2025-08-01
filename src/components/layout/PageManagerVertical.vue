<template>
  <div class="page-manager-vertical">
    <div class="panel-title">
      页面管理
      <button class="add-page-btn" @click="addNewPage" title="添加页面">
        <AppIcon name="plus" />
      </button>
    </div>
    
    <div class="page-list">
      <div 
        v-for="page in pages" 
        :key="page.id"
        class="page-item"
        :class="{ active: page.id === currentPageId }"
        @click="switchPage(page.id)"
        @contextmenu.prevent="showContextMenu($event, page)"
      >
        <div class="page-info">
          <div class="page-name">{{ page.name }}</div>
          <div class="page-meta">
            <span class="component-count" v-if="page.components.length > 0">
              <AppIcon name="box" />
              {{ page.components.length }}
            </span>
            <span v-if="hasUnsavedChanges(page)" class="unsaved-indicator" title="有未保存的更改">
              <AppIcon name="circle" />
            </span>
          </div>
        </div>
        
        <div class="page-actions">
          <button 
            v-if="pages.length > 1"
            class="action-btn delete-btn"
            @click.stop="deletePage(page.id)"
            title="删除页面"
          >
            <AppIcon name="trash" />
          </button>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div 
      v-if="contextMenu.show" 
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="renamePageInMenu">
        <AppIcon name="edit" />
        重命名
      </div>
      <div class="menu-item" @click="duplicatePageInMenu">
        <AppIcon name="copy" />
        复制页面
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item danger" @click="deletePageInMenu" v-if="pages.length > 1">
        <AppIcon name="trash" />
        删除页面
      </div>
    </div>

    <!-- 重命名弹窗 -->
    <div v-if="renaming.show" class="settings-overlay" @click="cancelRename">
      <div class="rename-dialog" @click.stop>
        <h4>重命名页面</h4>
        <input 
          ref="renameInput"
          v-model="renaming.name"
          type="text" 
          class="form-input"
          @keyup.enter="confirmRename"
          @keyup.escape="cancelRename"
        />
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="cancelRename">取消</button>
          <button class="btn btn-primary" @click="confirmRename">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { usePageStore } from '../../stores/page';
import type { Page } from '../../types/page';

// 页面store
const pageStore = usePageStore();

// 计算属性
const pages = computed(() => pageStore.pages);
const currentPageId = computed(() => pageStore.currentPageId);

// 右键菜单状态
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  page: null as Page | null
});

// 重命名状态
const renaming = ref({
  show: false,
  name: '',
  pageId: ''
});

// 页面操作方法
function switchPage(pageId: string) {
  pageStore.switchPage(pageId);
}

function addNewPage() {
  const newPage = pageStore.addPage();
  pageStore.switchPage(newPage.id);
}

function deletePage(pageId: string) {
  if (pages.value.length <= 1) return;
  pageStore.deletePage(pageId);
}

// 右键菜单
function showContextMenu(event: MouseEvent, page: Page) {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    page
  };
}

function hideContextMenu() {
  contextMenu.value.show = false;
}

function renamePageInMenu() {
  if (!contextMenu.value.page) return;
  
  renaming.value = {
    show: true,
    name: contextMenu.value.page.name,
    pageId: contextMenu.value.page.id
  };
  
  hideContextMenu();
  
  nextTick(() => {
    const input = document.querySelector('.rename-dialog input') as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function duplicatePageInMenu() {
  if (!contextMenu.value.page) return;
  
  const newPage = pageStore.duplicatePage(contextMenu.value.page.id);
  if (newPage) {
    pageStore.switchPage(newPage.id);
  }
  
  hideContextMenu();
}

function deletePageInMenu() {
  if (!contextMenu.value.page || pages.value.length <= 1) return;
  
  pageStore.deletePage(contextMenu.value.page.id);
  hideContextMenu();
}

// 重命名操作
function confirmRename() {
  if (!renaming.value.name.trim()) return;
  
  pageStore.updatePage(renaming.value.pageId, { name: renaming.value.name.trim() });
  cancelRename();
}

function cancelRename() {
  renaming.value.show = false;
  renaming.value.name = '';
  renaming.value.pageId = '';
}

// 检查是否有未保存的更改
function hasUnsavedChanges(page: Page): boolean {
  return false; // 暂时返回false，后续可扩展
}

// 点击外部隐藏菜单
document.addEventListener('click', () => {
  hideContextMenu();
});
</script>

<style scoped>
.page-manager-vertical {
  position: relative;
}

.panel-title {
  padding: 20px 16px 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-page-btn {
  width: 24px;
  height: 24px;
  border: 1px dashed #d0d0d0;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #666;
}

.add-page-btn:hover {
  border-color: #1890ff;
  background: #f0f8ff;
  color: #1890ff;
}

.page-list {
  padding: 0 16px;
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #d9d9d9 transparent;
}

.page-list::-webkit-scrollbar {
  width: 4px;
}

.page-list::-webkit-scrollbar-track {
  background: transparent;
}

.page-list::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 2px;
}

.page-list::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

.page-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border: 1px solid #e8e8e8;
}

.page-item:hover {
  background: #f5f5f5;
  border-color: #d9d9d9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-item.active {
  background: #e6f7ff;
  border-color: #1890ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
}

.page-info {
  flex: 1;
  min-width: 0;
}

.page-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.component-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.unsaved-indicator {
  color: #ff4d4f;
  font-size: 12px;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.page-item:hover .page-actions {
  opacity: 1;
}

.action-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #666;
}

.action-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.delete-btn:hover {
  background: #fff2f0;
  color: #ff4d4f;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.danger {
  color: #ff4d4f;
}

.menu-item.danger:hover {
  background: #fff2f0;
}

.menu-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}

/* 弹窗样式 */
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.rename-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  width: 300px;
  max-width: 90vw;
  padding: 20px;
}

.rename-dialog h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: white;
  color: #666;
}

.btn-secondary:hover {
  background: #f5f5f5;
  border-color: #b3b3b3;
}

.btn-primary {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.btn-primary:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}
</style>