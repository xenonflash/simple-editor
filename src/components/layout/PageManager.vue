<template>
  <div class="page-manager">
    <!-- 页面标签栏 -->
    <div class="page-tabs">
      <div class="tabs-container">
        <div 
          v-for="page in pages" 
          :key="page.id"
          class="page-tab"
          :class="{ active: page.id === currentPageId }"
          @click="switchPage(page.id)"
          @contextmenu.prevent="showContextMenu($event, page)"
        >
          <span class="tab-name">{{ page.name }}</span>
          <button 
            v-if="pages.length > 1"
            class="tab-close"
            @click.stop="deletePage(page.id)"
            title="删除页面"
          >
            ×
          </button>
        </div>
        
        <!-- 添加页面按钮 -->
        <button class="add-page-btn" @click="addNewPage" title="添加页面">
          <span class="icon">+</span>
        </button>
      </div>
      
      <!-- 页面操作菜单 -->
      <div class="page-actions">
        <button 
          class="action-btn"
          @click="showPageSettings = !showPageSettings"
          title="页面设置"
        >
          <span class="icon">⚙</span>
        </button>
      </div>
    </div>
    
    <!-- 页面设置面板 -->
    <div v-if="showPageSettings" class="page-settings">
      <div class="settings-header">
        <h3>页面设置</h3>
        <button class="close-btn" @click="showPageSettings = false">×</button>
      </div>
      
      <div class="settings-content" v-if="currentPage">
        <div class="form-group">
          <label>页面名称</label>
          <input 
            v-model="editingPageName"
            type="text" 
            class="form-input"
            @blur="updatePageName"
            @keyup.enter="updatePageName"
          />
        </div>
        
        <div class="form-group">
          <label>页面描述</label>
          <textarea 
            v-model="editingPageDescription"
            class="form-textarea"
            @blur="updatePageDescription"
            rows="3"
            placeholder="输入页面描述..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>页面信息</label>
          <div class="page-info">
            <div class="info-item">
              <span class="label">组件数量:</span>
              <span class="value">{{ currentPage.components.length }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatDate(currentPage.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">更新时间:</span>
              <span class="value">{{ formatDate(currentPage.updatedAt) }}</span>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-secondary" @click="duplicateCurrentPage">
            复制页面
          </button>
          <button 
            class="btn btn-danger" 
            @click="deleteCurrentPage"
            :disabled="pages.length <= 1"
          >
            删除页面
          </button>
        </div>
      </div>
    </div>
    
    <!-- 右键菜单 -->
    <div 
      v-if="contextMenu.show"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click="hideContextMenu"
    >
      <div class="menu-item" @click="renamePageInMenu">
        <span class="icon">✏</span>
        重命名
      </div>
      <div class="menu-item" @click="duplicatePageInMenu">
        <span class="icon">📋</span>
        复制页面
      </div>
      <div class="menu-divider"></div>
      <div 
        class="menu-item danger" 
        @click="deletePageInMenu"
        :class="{ disabled: pages.length <= 1 }"
      >
        <span class="icon">🗑</span>
        删除页面
      </div>
    </div>
    
    <!-- 重命名输入框 -->
    <div v-if="renaming.show" class="rename-overlay" @click="cancelRename">
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
import { ref, computed, watch, nextTick } from 'vue';
import { usePageStore } from '../../stores/page';
import type { Page } from '../../types/page';

// 页面store
const pageStore = usePageStore();

// 计算属性
const pages = computed(() => pageStore.pages);
const currentPageId = computed(() => pageStore.currentPageId);
const currentPage = computed(() => pageStore.currentPage);

// 响应式状态
const showPageSettings = ref(false);
const editingPageName = ref('');
const editingPageDescription = ref('');

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
  pageId: '',
  name: ''
});
const renameInput = ref<HTMLInputElement | null>(null);

// 监听当前页面变化，更新编辑状态
watch(currentPage, (newPage) => {
  if (newPage) {
    editingPageName.value = newPage.name;
    editingPageDescription.value = newPage.description;
  }
}, { immediate: true });

// 页面操作方法
function addNewPage() {
  const pageCount = pages.value.length;
  const newPage = pageStore.addPage(`页面 ${pageCount + 1}`, '');
  pageStore.switchPage(newPage.id);
}

function switchPage(pageId: string) {
  pageStore.switchPage(pageId);
}

function deletePage(pageId: string) {
  if (pages.value.length <= 1) return;
  
  if (confirm('确定要删除这个页面吗？删除后无法恢复。')) {
    pageStore.deletePage(pageId);
  }
}

function updatePageName() {
  if (currentPage.value && editingPageName.value.trim()) {
    pageStore.updatePage(currentPage.value.id, { name: editingPageName.value.trim() });
  }
}

function updatePageDescription() {
  if (currentPage.value) {
    pageStore.updatePage(currentPage.value.id, { description: editingPageDescription.value });
  }
}

function duplicateCurrentPage() {
  if (currentPage.value) {
    const newPage = pageStore.duplicatePage(currentPage.value.id);
    if (newPage) {
      pageStore.switchPage(newPage.id);
    }
  }
}

function deleteCurrentPage() {
  if (currentPage.value && pages.value.length > 1) {
    if (confirm('确定要删除当前页面吗？删除后无法恢复。')) {
      pageStore.deletePage(currentPage.value.id);
      showPageSettings.value = false;
    }
  }
}

// 右键菜单方法
function showContextMenu(event: MouseEvent, page: Page) {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    page
  };
  
  // 点击其他地方隐藏菜单
  document.addEventListener('click', hideContextMenu, { once: true });
}

function hideContextMenu() {
  contextMenu.value.show = false;
}

function renamePageInMenu() {
  if (contextMenu.value.page) {
    renaming.value = {
      show: true,
      pageId: contextMenu.value.page.id,
      name: contextMenu.value.page.name
    };
    
    nextTick(() => {
      renameInput.value?.focus();
      renameInput.value?.select();
    });
  }
  hideContextMenu();
}

function duplicatePageInMenu() {
  if (contextMenu.value.page) {
    const newPage = pageStore.duplicatePage(contextMenu.value.page.id);
    if (newPage) {
      pageStore.switchPage(newPage.id);
    }
  }
  hideContextMenu();
}

function deletePageInMenu() {
  if (contextMenu.value.page && pages.value.length > 1) {
    if (confirm('确定要删除这个页面吗？删除后无法恢复。')) {
      pageStore.deletePage(contextMenu.value.page.id);
    }
  }
  hideContextMenu();
}

// 重命名方法
function confirmRename() {
  if (renaming.value.name.trim()) {
    pageStore.updatePage(renaming.value.pageId, { name: renaming.value.name.trim() });
  }
  cancelRename();
}

function cancelRename() {
  renaming.value.show = false;
}

// 工具方法
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

// 点击外部隐藏菜单
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.page-settings') && !target.closest('.action-btn')) {
    showPageSettings.value = false;
  }
});
</script>

<style scoped>
.page-manager {
  position: relative;
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  user-select: none;
}

.page-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
}

.tabs-container {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

.page-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 80px;
  max-width: 200px;
}

.page-tab:hover {
  background: #ebebeb;
}

.page-tab.active {
  background: #ffffff;
  border-bottom-color: #ffffff;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.tab-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  color: #999;
  cursor: pointer;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  transition: all 0.2s ease;
}

.tab-close:hover {
  background: #ff4d4f;
  color: white;
}

.add-page-btn {
  width: 28px;
  height: 28px;
  border: 1px dashed #d0d0d0;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.add-page-btn:hover {
  border-color: #1890ff;
  background: #f0f8ff;
}

.add-page-btn .icon {
  font-size: 14px;
  color: #666;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn .icon {
  font-size: 14px;
  color: #666;
}

/* 页面设置面板 */
.page-settings {
  position: absolute;
  top: 100%;
  right: 12px;
  width: 300px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: #999;
  cursor: pointer;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.settings-content {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #1890ff;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.page-info {
  background: #f9f9f9;
  border-radius: 4px;
  padding: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #666;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.btn:hover:not(:disabled) {
  border-color: #d0d0d0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
  border-color: #40a9ff;
}

.btn-secondary {
  background: #f5f5f5;
  border-color: #d0d0d0;
  color: #333;
}

.btn-danger {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #ff7875;
  border-color: #ff7875;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  min-width: 120px;
  overflow: hidden;
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

.menu-item:hover:not(.disabled) {
  background: #f5f5f5;
}

.menu-item.danger {
  color: #ff4d4f;
}

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item .icon {
  font-size: 14px;
}

.menu-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}

/* 重命名对话框 */
.rename-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.rename-dialog {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 300px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.rename-dialog h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>