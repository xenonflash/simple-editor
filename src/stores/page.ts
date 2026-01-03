import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Page, PageState, PageVariable } from '../types/page';
import { createPage } from '../types/page';
import type { Comp } from '../components/comps/base';

export const usePageStore = defineStore('page', () => {
  // ==================== 状态定义 ====================
  const pages = ref<Page[]>([]);
  const currentPageId = ref<string | null>(null);
  const selectedComps = ref<Comp[]>([]);

  // 运行时变量值（按页面隔离）：pageId -> { varName: value }
  const runtimeVarValuesByPageId = ref<Record<string, Record<string, any>>>({});

  function cloneValue<T = any>(v: T): T {
    try {
      // 浏览器环境通常可用
      return structuredClone(v);
    } catch (e) {
      try {
        return JSON.parse(JSON.stringify(v));
      } catch (e2) {
        return v;
      }
    }
  }

  function ensureRuntimeVarsForPage(page: Page) {
    if (!page) return;
    const existing = runtimeVarValuesByPageId.value[page.id];
    const next: Record<string, any> = { ...(existing || {}) };
    for (const def of page.variables || []) {
      if (!(def.name in next)) {
        next[def.name] = cloneValue(def.defaultValue);
      }
    }
    // 清理已删除的变量
    const definedNames = new Set((page.variables || []).map(v => v.name));
    for (const k of Object.keys(next)) {
      if (!definedNames.has(k)) delete next[k];
    }
    runtimeVarValuesByPageId.value[page.id] = next;
  }

  function ensureCurrentRuntimeVars() {
    const page = currentPage.value;
    if (!page) return;
    ensureRuntimeVarsForPage(page);
  }

  // ==================== 计算属性 ====================
  const currentPage = computed(() => {
    if (!currentPageId.value) return null;
    return pages.value.find(page => page.id === currentPageId.value) || null;
  });

  const currentComponents = computed(() => {
    return currentPage.value?.components || [];
  });

  function findComponentInTree(componentId: string, list?: Comp[]): Comp | null {
    const comps = list || (currentPage.value?.components || [])
    for (const c of comps) {
      if (c.id === componentId) return c
      if (c.children && c.children.length > 0) {
        const hit = findComponentInTree(componentId, c.children)
        if (hit) return hit
      }
    }
    return null
  }

  function findParentContainerId(componentId: string, list?: Comp[], parentContainerId: string | null = null): string | null | undefined {
    const comps = list || (currentPage.value?.components || [])
    for (const c of comps) {
      if (c.id === componentId) return parentContainerId
      if (c.children && c.children.length > 0) {
        const nextParent = c.type === 'container' ? c.id : parentContainerId
        const hit = findParentContainerId(componentId, c.children, nextParent)
        if (hit !== undefined) return hit
      }
    }
    return undefined
  }

  function getComponentCanvasPosition(componentId: string): { x: number; y: number } | null {
    const comp = findComponentInTree(componentId)
    if (!comp) return null

    // 仅当组件处在非 absolute 的容器布局（default/flex 等）链路里时，props.x/y 无法可靠反映真实位置，才使用 DOM 测量值。
    // 对于 canvas 顶层或 absolute 容器内的组件，拖拽/移动依赖 props 立即更新；若这里无条件优先 measured，会导致 control 框“卡住”。
    let isInFlowLayout = false
    let parentId = findParentContainerId(componentId)
    while (parentId) {
      const parent = findComponentInTree(parentId)
      if (!parent) break
      const parentLayoutMode = parent.props?.layoutMode || 'absolute'
      if (parentLayoutMode !== 'absolute') {
        isInFlowLayout = true
        break
      }
      parentId = findParentContainerId(parentId)
    }

    if (isInFlowLayout) {
      const measuredX = (comp.props as any)?._measuredCanvasX
      const measuredY = (comp.props as any)?._measuredCanvasY
      if (Number.isFinite(measuredX) && Number.isFinite(measuredY)) {
        return { x: measuredX, y: measuredY }
      }
    }

    let x = comp.props?.x || 0
    let y = comp.props?.y || 0

    // 当组件位于绝对布局容器内部时，props.x/y 是相对于容器内容区的 local 坐标；需要叠加父容器的 canvas 坐标 + padding。
    // 对于非 absolute 的容器布局（default/flex），子组件位置由布局决定，这里无法可靠计算，先保持现状（由 UI/后续迭代处理）。
    parentId = findParentContainerId(componentId)
    while (parentId) {
      const parent = findComponentInTree(parentId)
      if (!parent) break

      const parentLayoutMode = parent.props?.layoutMode || 'absolute'
      if (parentLayoutMode === 'absolute') {
        const px = parent.props?.x || 0
        const py = parent.props?.y || 0
        const border = parent.props?.borderWidth || 0
        const padL = parent.props?.paddingLeft || 0
        const padT = parent.props?.paddingTop || 0
        // 绝对定位的包含块是 padding box：需要叠加 border + padding
        x += px + border + padL
        y += py + border + padT
      }

      parentId = findParentContainerId(parentId)
    }

    return { x, y }
  }

  function getContainerContentCanvasOrigin(containerId: string): { x: number; y: number } | null {
    const container = findComponentInTree(containerId)
    if (!container) return null

    const pos = getComponentCanvasPosition(containerId)
    if (!pos) return null

    const border = container.props?.borderWidth || 0
    const padL = container.props?.paddingLeft || 0
    const padT = container.props?.paddingTop || 0
    return {
      x: pos.x + border + padL,
      y: pos.y + border + padT
    }
  }

  function mapComponentTree(list: Comp[], mapper: (c: Comp) => Comp | null): { next: Comp[]; changed: boolean } {
    let changed = false
    const next = list
      .map((c) => {
        const mapped = mapper(c)
        if (mapped === null) {
          changed = true
          return null
        }
        if (mapped && mapped !== c) changed = true

        const base = mapped || c
        if (base.children && base.children.length > 0) {
          const childRes = mapComponentTree(base.children, mapper)
          if (childRes.changed) {
            changed = true
            return { ...base, children: childRes.next }
          }
        }
        return base
      })
      .filter(Boolean) as Comp[]

    return { next, changed }
  }

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
      ensureRuntimeVarsForPage(defaultPage);
    }
  }

  function addPage(name?: string, description?: string): Page {
    const newPage = createPage(name, description);
    pages.value.push(newPage);
    ensureRuntimeVarsForPage(newPage);
    return newPage;
  }

  function deletePage(pageId: string): boolean {
    const index = pages.value.findIndex(page => page.id === pageId);
    if (index === -1) return false;

    if (currentPageId.value === pageId) {
      if (pages.value.length > 1) {
        const nextIndex = index < pages.value.length - 1 ? index + 1 : index - 1;
        currentPageId.value = pages.value[nextIndex].id;
        ensureCurrentRuntimeVars();
      } else {
        const defaultPage = createPage('页面 1', '默认页面');
        pages.value = [defaultPage];
        currentPageId.value = defaultPage.id;
        selectedComps.value = [];
        runtimeVarValuesByPageId.value = { [defaultPage.id]: {} };
        ensureRuntimeVarsForPage(defaultPage);
        return true;
      }
    }

    pages.value.splice(index, 1);
    selectedComps.value = [];
    // 清理该页面的运行时变量
    if (runtimeVarValuesByPageId.value[pageId]) {
      delete runtimeVarValuesByPageId.value[pageId];
    }
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
    ensureRuntimeVarsForPage(page);
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
    ensureRuntimeVarsForPage(newPage);
    return newPage;
  }

  // ==================== 组件选择方法 ====================
  function selectComponent(componentId: string | null, multiSelect = false) {
    if (!componentId) {
      selectedComps.value = [];
      return;
    }

    const component = findComponentInTree(componentId);
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
    const components = componentIds
      .map((id) => findComponentInTree(id))
      .filter(Boolean) as Comp[]
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

    // 保持选中引用最新
    if (selectedComps.value.length > 0) {
      selectedComps.value = selectedComps.value
        .map((c) => findComponentInTree(c.id, components))
        .filter(Boolean) as Comp[]
    }
    return true;
  }

  function addComponentToCurrentPage(component: Comp): boolean {
    if (!currentPage.value) return false;

    currentPage.value.components.push(component);
    currentPage.value.updatedAt = new Date();
    return true;
  }

  function addComponentToContainer(containerId: string, component: Comp): boolean {
    if (!currentPage.value) return false
    const root = currentPage.value.components
    const res = mapComponentTree(root, (c) => {
      if (c.id !== containerId) return c
      const children = Array.isArray(c.children) ? c.children : []
      return { ...c, children: [...children, component] }
    })
    if (!res.changed) return false
    currentPage.value.components = res.next
    currentPage.value.updatedAt = new Date()
    // 选中引用保持最新
    if (selectedComps.value.length > 0) {
      selectedComps.value = selectedComps.value
        .map((sc) => findComponentInTree(sc.id, res.next))
        .filter(Boolean) as Comp[]
    }
    return true
  }

  function moveComponentToContainer(
    componentId: string,
    containerId: string,
    options?: {
      layoutMode?: 'absolute' | 'default' | 'flex'
      localX?: number
      localY?: number
    }
  ): boolean {
    if (!currentPage.value) return false
    if (componentId === containerId) return false

    const dragged = findComponentInTree(componentId)
    const target = findComponentInTree(containerId)
    if (!dragged || !target) return false

    // 防止把容器拖进自己的子树
    if (dragged.type === 'container') {
      const stack = [...(dragged.children || [])]
      while (stack.length) {
        const n = stack.pop()!
        if (n.id === containerId) return false
        if (n.children && n.children.length) stack.push(...n.children)
      }
    }

    // 1) 从原位置移除
    let removed: Comp | null = null
    const removedRes = mapComponentTree(currentPage.value.components, (c) => {
      if (c.id === componentId) {
        removed = c
        return null
      }
      return c
    })
    if (!removedRes.changed || !removed) return false

    // 2) 根据布局模式更新 props（仅 absolute 需要 local x/y）
    const nextComp: Comp = (() => {
      const layoutMode = options?.layoutMode
      if (layoutMode !== 'absolute') return removed as Comp
      const nextProps: any = { ...(removed as Comp).props }
      if (typeof options?.localX === 'number') nextProps.x = options!.localX
      if (typeof options?.localY === 'number') nextProps.y = options!.localY
      return { ...(removed as Comp), props: nextProps }
    })()

    // 3) 插入到目标容器 children（append）
    const insertedRes = mapComponentTree(removedRes.next, (c) => {
      if (c.id !== containerId) return c
      const children = Array.isArray(c.children) ? c.children : []
      return { ...c, children: [...children, nextComp] }
    })
    if (!insertedRes.changed) return false

    currentPage.value.components = insertedRes.next
    currentPage.value.updatedAt = new Date()

    // 选中引用保持最新
    if (selectedComps.value.length > 0) {
      selectedComps.value = selectedComps.value
        .map((sc) => findComponentInTree(sc.id, insertedRes.next))
        .filter(Boolean) as Comp[]
    }

    return true
  }

  function deleteComponentFromCurrentPage(componentId: string): boolean {
    if (!currentPage.value) return false;

    const res = mapComponentTree(currentPage.value.components, (c) => {
      if (c.id === componentId) return null
      return c
    })
    if (!res.changed) return false
    currentPage.value.components = res.next
    currentPage.value.updatedAt = new Date()
    
    const selectedIndex = selectedComps.value.findIndex(comp => comp.id === componentId);
    if (selectedIndex >= 0) {
      selectedComps.value.splice(selectedIndex, 1);
    }
    
    return true;
  }

  function updateComponentInCurrentPage(component: Comp): boolean {
    if (!currentPage.value) return false;

    const res = mapComponentTree(currentPage.value.components, (c) => {
      if (c.id !== component.id) return c
      return {
        ...c,
        ...component,
        props: { ...(c.props || {}), ...(component.props || {}) }
      }
    })
    if (!res.changed) return false
    currentPage.value.components = res.next
    currentPage.value.updatedAt = new Date()

    const nextSelected = selectedComps.value
      .map((sc) => findComponentInTree(sc.id, res.next))
      .filter(Boolean) as Comp[]
    selectedComps.value = nextSelected
    return true
  }

  function updateComponentPosition(componentId: string, updates: { x?: number; y?: number }) {
    if (!currentPage.value) return false;

    const res = mapComponentTree(currentPage.value.components, (c) => {
      if (c.id !== componentId) return c
      const nextProps: any = { ...(c.props || {}) }
      if (updates.x !== undefined) nextProps.x = updates.x
      if (updates.y !== undefined) nextProps.y = updates.y
      return { ...c, props: nextProps }
    })
    if (!res.changed) return false
    currentPage.value.components = res.next
    currentPage.value.updatedAt = new Date()

    selectedComps.value = selectedComps.value
      .map((sc) => findComponentInTree(sc.id, res.next))
      .filter(Boolean) as Comp[]
    return true
  }

  // ==================== 页面属性编辑方法 ====================
  function updatePageProperties(pageId: string, updates: Partial<Page>) {
    const page = pages.value.find(p => p.id === pageId);
    if (page) {
      Object.assign(page, updates);
      page.updatedAt = new Date();
    }
  }

  // ==================== 变量管理方法 ====================
  function addVariable(variable: PageVariable) {
    if (!currentPage.value) return false;
    
    // 检查重名
    if (currentPage.value.variables.some(v => v.name === variable.name)) {
      return false;
    }
    
    currentPage.value.variables.push(variable);
    currentPage.value.updatedAt = new Date();

    // 初始化运行时值
    ensureCurrentRuntimeVars();
    const pageId = currentPage.value.id;
    runtimeVarValuesByPageId.value[pageId][variable.name] = cloneValue(variable.defaultValue);
    return true;
  }

  function updateVariable(oldName: string, newVariable: PageVariable) {
    if (!currentPage.value) return false;
    
    const index = currentPage.value.variables.findIndex(v => v.name === oldName);
    if (index === -1) return false;
    
    // 如果改了名字，检查新名字是否冲突
    if (oldName !== newVariable.name && currentPage.value.variables.some(v => v.name === newVariable.name)) {
      return false;
    }
    
    currentPage.value.variables.splice(index, 1, newVariable);
    currentPage.value.updatedAt = new Date();

    // 同步运行时值：
    // - 重命名：保留旧运行时值（若存在），否则使用新 defaultValue
    // - 未重命名：更新为新 defaultValue（定义变更视为重置）
    ensureCurrentRuntimeVars();
    const pageId = currentPage.value.id;
    const runtime = runtimeVarValuesByPageId.value[pageId];
    if (oldName !== newVariable.name) {
      const existing = runtime?.[oldName];
      delete runtime[oldName];
      runtime[newVariable.name] = existing !== undefined ? existing : cloneValue(newVariable.defaultValue);
    } else {
      runtime[newVariable.name] = cloneValue(newVariable.defaultValue);
    }
    return true;
  }

  function deleteVariable(name: string) {
    if (!currentPage.value) return false;
    
    const index = currentPage.value.variables.findIndex(v => v.name === name);
    if (index === -1) return false;
    
    currentPage.value.variables.splice(index, 1);
    currentPage.value.updatedAt = new Date();

    // 清理运行时值
    ensureCurrentRuntimeVars();
    const pageId = currentPage.value.id;
    delete runtimeVarValuesByPageId.value[pageId][name];
    return true;
  }

  function getVariableValue(name: string) {
    if (!currentPage.value) return undefined;
    ensureCurrentRuntimeVars();
    const pageId = currentPage.value.id;
    const runtime = runtimeVarValuesByPageId.value[pageId] || {};
    if (name in runtime) return runtime[name];
    const v = currentPage.value.variables.find(v => v.name === name);
    return v ? v.defaultValue : undefined;
  }

  function getComponentById(componentId: string) {
    if (!currentPage.value) return undefined
    return findComponentInTree(componentId) || undefined
  }

  function getComponentProps(componentId: string) {
    return getComponentById(componentId)?.props;
  }

  function getComponentProp(componentId: string, propName: string) {
    return getComponentById(componentId)?.props?.[propName];
  }

  function updateVariableValue(name: string, value: any) {
    if (!currentPage.value) return;
    ensureCurrentRuntimeVars();
    const pageId = currentPage.value.id;
    runtimeVarValuesByPageId.value[pageId][name] = value;
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
    addComponentToContainer,
    moveComponentToContainer,
    deleteComponentFromCurrentPage,
    updateComponentInCurrentPage,
    updateComponentPosition,
    
    // 页面属性编辑方法
    updatePageProperties,

    // 变量管理方法
    addVariable,
    updateVariable,
    deleteVariable,
    getVariableValue,
    updateVariableValue,

    // 运行时变量（高级用法/调试）
    runtimeVarValuesByPageId,
    ensureCurrentRuntimeVars,

    // 组件属性读取（供脚本/可用变量面板使用）
    getComponentById,
    findParentContainerId,
    getComponentCanvasPosition,
    getContainerContentCanvasOrigin,
    getComponentProps,
    getComponentProp
  };
});