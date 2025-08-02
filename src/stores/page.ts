import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Page, PageState } from '../types/page';
import { createPage } from '../types/page';
import type { Comp } from '../components/comps/base';

export const usePageStore = defineStore('page', () => {
  // ==================== 状态定义 ====================
  const pages = ref<Page[]>([]);
  const currentPageId = ref<string | null>(null);
  const selectedComps = ref<Comp[]>([]);

  // ==================== 计算属性 ====================
  const currentPage = computed(() => {
    if (!currentPageId.value) return null;
    return pages.value.find(page => page.id === currentPageId.value) || null;
  });

  const currentComponents = computed(() => {
    return currentPage.value?.components || [];
  });

  const selectedCompIds = computed(() => {
    return selectedComps.value.map(comp => comp.id);
  });

  const primarySelectedComp = computed(() => {
    return selectedComps.value.length > 0 ? selectedComps.value[0] : null;
  });

  // ==================== 页面管理方法 ====================
  function initializeDefaultPage() {
    if (pages.value.length === 0) {
      const defaultPage = createPage('页面 1', '默认页面');
      pages.value.push(defaultPage);
      currentPageId.value = defaultPage.id;
    }
  }

  function addPage(name?: string, description?: string): Page {
    const newPage = createPage(name, description);
    pages.value.push(newPage);
    return newPage;
  }

  function deletePage(pageId: string): boolean {
    const index = pages.value.findIndex(page => page.id === pageId);
    if (index === -1) return false;

    if (currentPageId.value === pageId) {
      if (pages.value.length > 1) {
        const nextIndex = index < pages.value.length - 1 ? index + 1 : index - 1;
        currentPageId.value = pages.value[nextIndex].id;
      } else {
        const defaultPage = createPage('页面 1', '默认页面');
        pages.value = [defaultPage];
        currentPageId.value = defaultPage.id;
        selectedComps.value = [];
        return true;
      }
    }

    pages.value.splice(index, 1);
    selectedComps.value = [];
    return true;
  }

  function updatePage(pageId: string, updates: Partial<Pick<Page, 'name' | 'description'>>): boolean {
    const page = pages.value.find(p => p.id === pageId);
    if (!page) return false;

    Object.assign(page, updates, { updatedAt: new Date() });
    return true;
  }

  function switchPage(pageId: string): boolean {
    const page = pages.value.find(p => p.id === pageId);
    if (!page) return false;
    
    currentPageId.value = pageId;
    selectedComps.value = [];
    return true;
  }

  function duplicatePage(pageId: string): Page | null {
    const sourcePage = pages.value.find(p => p.id === pageId);
    if (!sourcePage) return null;

    const newPage = createPage(
      `${sourcePage.name} 副本`,
      sourcePage.description
    );
    
    newPage.components = JSON.parse(JSON.stringify(sourcePage.components));
    
    newPage.components.forEach(comp => {
      comp.id = `${comp.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    });

    pages.value.push(newPage);
    return newPage;
  }

  // ==================== 组件选择方法 ====================
  function selectComponent(componentId: string | null, multiSelect = false) {
    if (!componentId) {
      selectedComps.value = [];
      return;
    }

    const component = currentComponents.value.find(comp => comp.id === componentId);
    if (!component) return;

    if (multiSelect) {
      const index = selectedComps.value.findIndex(comp => comp.id === componentId);
      if (index >= 0) {
        selectedComps.value.splice(index, 1);
      } else {
        selectedComps.value.push(component);
      }
    } else {
      selectedComps.value = [component];
    }
  }

  function selectComponents(componentIds: string[]) {
    const components = currentComponents.value.filter(comp => 
      componentIds.includes(comp.id)
    );
    selectedComps.value = components;
  }

  function isComponentSelected(componentId: string): boolean {
    return selectedCompIds.value.includes(componentId);
  }

  // ==================== 组件操作方法 ====================
  function updateCurrentPageComponents(components: Comp[]): boolean {
    if (!currentPage.value) return false;

    currentPage.value.components = components;
    currentPage.value.updatedAt = new Date();
    return true;
  }

  function addComponentToCurrentPage(component: Comp): boolean {
    if (!currentPage.value) return false;

    currentPage.value.components.push(component);
    currentPage.value.updatedAt = new Date();
    return true;
  }

  function deleteComponentFromCurrentPage(componentId: string): boolean {
    if (!currentPage.value) return false;

    const index = currentPage.value.components.findIndex(c => c.id === componentId);
    if (index === -1) return false;

    currentPage.value.components.splice(index, 1);
    currentPage.value.updatedAt = new Date();
    
    const selectedIndex = selectedComps.value.findIndex(comp => comp.id === componentId);
    if (selectedIndex >= 0) {
      selectedComps.value.splice(selectedIndex, 1);
    }
    
    return true;
  }

  function updateComponentInCurrentPage(component: Comp): boolean {
    if (!currentPage.value) return false;

    const index = currentPage.value.components.findIndex(c => c.id === component.id);
    if (index === -1) return false;

    const updatedComponent = {
      ...currentPage.value.components[index],
      ...component,
      props: { ...currentPage.value.components[index].props, ...component.props }
    };
    
    currentPage.value.components.splice(index, 1, updatedComponent);
    currentPage.value.updatedAt = new Date();
    
    const selectedIndex = selectedComps.value.findIndex(comp => comp.id === component.id);
    if (selectedIndex >= 0) {
      selectedComps.value.splice(selectedIndex, 1, updatedComponent);
    }
    
    return true;
  }

  function updateComponentPosition(componentId: string, updates: { x?: number; y?: number }) {
    if (!currentPage.value) return false;
  
    const component = currentPage.value.components.find(c => c.id === componentId);
    if (!component) return false;
  
    if (updates.x !== undefined) {
      component.props.x = updates.x;
    }
    if (updates.y !== undefined) {
      component.props.y = updates.y;
    }
  
    currentPage.value.updatedAt = new Date();
    
    const selectedIndex = selectedComps.value.findIndex(comp => comp.id === componentId);
    if (selectedIndex >= 0) {
      selectedComps.value[selectedIndex] = { ...component };
    }
    
    return true;
  }

  // ==================== 页面属性编辑方法 ====================
  function updatePageProperties(pageId: string, updates: Partial<Page>) {
    const page = pages.value.find(p => p.id === pageId);
    if (page) {
      Object.assign(page, updates);
      page.updatedAt = new Date();
    }
  }

  // ==================== 导出 ====================
  return {
    // 状态
    pages,
    currentPageId,
    selectedComps,
    
    // 计算属性
    currentPage,
    currentComponents,
    selectedCompIds,
    primarySelectedComp,
    
    // 页面管理方法
    initializeDefaultPage,
    addPage,
    deletePage,
    updatePage,
    switchPage,
    duplicatePage,
    
    // 组件选择方法
    selectComponent,
    selectComponents,
    isComponentSelected,
    
    // 组件操作方法
    updateCurrentPageComponents,
    addComponentToCurrentPage,
    deleteComponentFromCurrentPage,
    updateComponentInCurrentPage,
    updateComponentPosition,
    
    // 页面属性编辑方法
    updatePageProperties,
  };
});