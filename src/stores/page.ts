import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Page, PageState } from '../types/page';
import { createPage } from '../types/page';
import type { Comp } from '../components/comps/base';

export const usePageStore = defineStore('page', () => {
  // 状态
  const pages = ref<Page[]>([]);
  const currentPageId = ref<string | null>(null);
  const selectedComps = ref<Comp[]>([]); // 新增：当前选中的组件数组

  // 计算属性
  const currentPage = computed(() => {
    if (!currentPageId.value) return null;
    return pages.value.find(page => page.id === currentPageId.value) || null;
  });

  const currentComponents = computed(() => {
    return currentPage.value?.components || [];
  });

  // 新增：选中组件的ID数组
  const selectedCompIds = computed(() => {
    return selectedComps.value.map(comp => comp.id);
  });

  // 新增：第一个选中的组件（用于属性面板）
  const primarySelectedComp = computed(() => {
    return selectedComps.value.length > 0 ? selectedComps.value[0] : null;
  });

  // 初始化默认页面
  function initializeDefaultPage() {
    if (pages.value.length === 0) {
      const defaultPage = createPage('页面 1', '默认页面');
      pages.value.push(defaultPage);
      currentPageId.value = defaultPage.id;
    }
  }

  // 新增：选中组件方法
  function selectComponent(componentId: string | null, multiSelect = false) {
    if (!componentId) {
      // 清空选中
      selectedComps.value = [];
      return;
    }

    const component = currentComponents.value.find(comp => comp.id === componentId);
    if (!component) return;

    if (multiSelect) {
      // 多选模式
      const index = selectedComps.value.findIndex(comp => comp.id === componentId);
      if (index >= 0) {
        // 已选中，取消选中
        selectedComps.value.splice(index, 1);
      } else {
        // 未选中，添加到选中列表
        selectedComps.value.push(component);
      }
    } else {
      // 单选模式
      selectedComps.value = [component];
    }
  }

  // 新增：批量选中组件
  function selectComponents(componentIds: string[]) {
    const components = currentComponents.value.filter(comp => 
      componentIds.includes(comp.id)
    );
    selectedComps.value = components;
  }

  // 新增：检查组件是否被选中
  function isComponentSelected(componentId: string): boolean {
    return selectedCompIds.value.includes(componentId);
  }

  // 添加页面
  function addPage(name?: string, description?: string): Page {
    const newPage = createPage(name, description);
    pages.value.push(newPage);
    return newPage;
  }

  // 删除页面
  function deletePage(pageId: string): boolean {
    const index = pages.value.findIndex(page => page.id === pageId);
    if (index === -1) return false;

    // 如果删除的是当前页面，需要切换到其他页面
    if (currentPageId.value === pageId) {
      if (pages.value.length > 1) {
        // 切换到下一个页面，如果是最后一个则切换到前一个
        const nextIndex = index < pages.value.length - 1 ? index + 1 : index - 1;
        currentPageId.value = pages.value[nextIndex].id;
      } else {
        // 如果只有一个页面，创建新的默认页面
        const defaultPage = createPage('页面 1', '默认页面');
        pages.value = [defaultPage];
        currentPageId.value = defaultPage.id;
        selectedComps.value = []; // 清空选中状态
        return true;
      }
    }

    pages.value.splice(index, 1);
    selectedComps.value = []; // 清空选中状态
    return true;
  }

  // 更新页面信息
  function updatePage(pageId: string, updates: Partial<Pick<Page, 'name' | 'description'>>): boolean {
    const page = pages.value.find(p => p.id === pageId);
    if (!page) return false;

    Object.assign(page, updates, { updatedAt: new Date() });
    return true;
  }

  // 修改：切换页面时清空选中状态
  function switchPage(pageId: string): boolean {
    const page = pages.value.find(p => p.id === pageId);
    if (!page) return false;
    
    currentPageId.value = pageId;
    selectedComps.value = []; // 清空选中状态
    return true;
  }

  // 更新当前页面的组件
  function updateCurrentPageComponents(components: Comp[]): boolean {
    if (!currentPage.value) return false;

    currentPage.value.components = components;
    currentPage.value.updatedAt = new Date();
    return true;
  }

  // 添加组件到当前页面
  function addComponentToCurrentPage(component: Comp): boolean {
    if (!currentPage.value) return false;

    currentPage.value.components.push(component);
    currentPage.value.updatedAt = new Date();
    return true;
  }

  // 修改：删除组件时从选中列表中移除
  function deleteComponentFromCurrentPage(componentId: string): boolean {
    if (!currentPage.value) return false;

    const index = currentPage.value.components.findIndex(c => c.id === componentId);
    if (index === -1) return false;

    currentPage.value.components.splice(index, 1);
    currentPage.value.updatedAt = new Date();
    
    // 从选中列表中移除
    const selectedIndex = selectedComps.value.findIndex(comp => comp.id === componentId);
    if (selectedIndex >= 0) {
      selectedComps.value.splice(selectedIndex, 1);
    }
    
    return true;
  }

  // 修改：更新组件时同步更新选中列表中的组件
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
    
    // 同步更新选中列表中的组件
    const selectedIndex = selectedComps.value.findIndex(comp => comp.id === component.id);
    if (selectedIndex >= 0) {
      selectedComps.value.splice(selectedIndex, 1, updatedComponent);
    }
    
    return true;
  }

  // 复制页面
  function duplicatePage(pageId: string): Page | null {
    const sourcePage = pages.value.find(p => p.id === pageId);
    if (!sourcePage) return null;

    const newPage = createPage(
      `${sourcePage.name} 副本`,
      sourcePage.description
    );
    
    // 深拷贝组件数据
    newPage.components = JSON.parse(JSON.stringify(sourcePage.components));
    
    // 重新生成组件ID
    newPage.components.forEach(comp => {
      comp.id = `${comp.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    });

    pages.value.push(newPage);
    return newPage;
  }

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
    
    // 方法
    initializeDefaultPage,
    selectComponent,
    selectComponents,
    isComponentSelected,
    switchPage,
    addPage,
    deletePage,
    updatePage,
    updateCurrentPageComponents,
    addComponentToCurrentPage,
    deleteComponentFromCurrentPage,
    updateComponentInCurrentPage,
    duplicatePage
  };
});