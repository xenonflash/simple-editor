import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';
import type { Page, PageState, PageVariable } from '../types/page';
import { createPage } from '../types/page';
import type { Comp } from '../components/comps/base';
import type { PropSchema } from '../config/naive-ui-registry'
import { exportToJSON, importFromJSON } from '../utils/io'
import { instantiateFromCustomComponentTemplate } from '../utils/customComponentInstance'
import { getLoopSourceId, parseLoopInstanceId } from '../utils/loopInstance'
import { history, ActionType } from '../utils/history'

export const usePageStore = defineStore('page', () => {
  // ==================== 状态定义 ====================
  const pages = ref<Page[]>([]);
  const currentPageId = ref<string | null>(null);
  const selectedComps = ref<Comp[]>([]);

  const editorMode = ref<'page' | 'custom-edit'>('page')
  const CUSTOM_EDIT_PAGE_PREFIX = '__cc_edit__:'

  // ==================== 自动持久化（localStorage） ====================
  const PERSIST_KEY = 'simple-editor:autosave:v1'
  const persistDirty = ref(false)
  let persistTimer: number | null = null
  let isHydrating = false

  function stripMeasuredProps(props: Record<string, any> | undefined | null): Record<string, any> {
    const src = props || {}
    const next: Record<string, any> = {}
    for (const [k, v] of Object.entries(src)) {
      if (k.startsWith('_measured')) continue
      next[k] = v
    }
    return next
  }

  function sanitizeCompForPersist(comp: Comp): Comp {
    return {
      ...comp,
      props: stripMeasuredProps((comp as any).props),
      children: (comp.children || []).map(sanitizeCompForPersist)
    }
  }

  function sanitizePageForPersist(page: Page): Page {
    
    return {
      ...page,
      components: (page.components || []).map(sanitizeCompForPersist)
    }
  }

  function saveToLocalStorage() {
    try {
      const payload = {
        version: 1,
        savedAt: Date.now(),
        currentPageId: currentPageId.value,
        pages: pages.value
          .filter((p) => !String(p.id).startsWith(CUSTOM_EDIT_PAGE_PREFIX))
          .map(sanitizePageForPersist)
      }
      localStorage.setItem(PERSIST_KEY, JSON.stringify(payload))
      persistDirty.value = false
    } catch (e) {
      // localStorage quota / privacy mode / serialization errors
      console.warn('[pageStore] autosave failed:', e)
    }
  }

  function loadFromLocalStorage(): boolean {
    try {
      const raw = localStorage.getItem(PERSIST_KEY)
      if (!raw) return false
      const parsed = JSON.parse(raw)
      if (!parsed || parsed.version !== 1) return false
      if (!Array.isArray(parsed.pages)) return false

      const nextPages = parsed.pages as Page[]
      const nextCurrentId = (typeof parsed.currentPageId === 'string' || parsed.currentPageId === null)
        ? (parsed.currentPageId as string | null)
        : null

      isHydrating = true
      pages.value = nextPages
      currentPageId.value = nextCurrentId && nextPages.some(p => p.id === nextCurrentId)
        ? nextCurrentId
        : (nextPages[0]?.id ?? null)
      selectedComps.value = []

      // 重新构建运行时变量默认值
      runtimeVarValuesByPageId.value = {}
      for (const p of pages.value) ensureRuntimeVarsForPage(p)

      persistDirty.value = false
      isHydrating = false
      return true
    } catch (e) {
      isHydrating = false
      console.warn('[pageStore] autoload failed:', e)
      return false
    }
  }

  function initializeFromLocalStorage() {
    const ok = loadFromLocalStorage()
    if (!ok) initializeDefaultPage()
  }

  function startAutoPersist(options?: { intervalMs?: number }) {
    const intervalMs = options?.intervalMs ?? 5000
    if (persistTimer) return
    persistTimer = window.setInterval(() => {
      if (isHydrating) return
      if (!persistDirty.value) return
      if (!pages.value.length) return
      saveToLocalStorage()
    }, Math.max(1000, intervalMs))
  }

  function stopAutoPersist() {
    if (!persistTimer) return
    window.clearInterval(persistTimer)
    persistTimer = null
  }

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
    const defs = page.variables || [];
    const definedNames = new Set(defs.map(v => v.name));

    // 首次初始化：只做一次写入，避免在 render/computed 中反复触发更新。
    if (!existing) {
      const next: Record<string, any> = {};
      for (const def of defs) {
        next[def.name] = cloneValue(def.defaultValue);
      }
      runtimeVarValuesByPageId.value[page.id] = next;
      return;
    }

    // 仅当确实需要补齐/清理时才 mutate，避免递归更新。
    let changed = false;

    for (const def of defs) {
      if (!(def.name in existing)) {
        existing[def.name] = cloneValue(def.defaultValue);
        changed = true;
      }
    }

    for (const k of Object.keys(existing)) {
      if (!definedNames.has(k)) {
        delete existing[k];
        changed = true;
      }
    }

    // 当没有变化时不写回，避免触发无意义的 reactive 更新。
    if (!changed) return;
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
      const parentLayoutMode = parent.props?.layoutMode || 'manual'
      if (parentLayoutMode !== 'manual') {
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

      const parentLayoutMode = parent.props?.layoutMode || 'manual'
      if (parentLayoutMode === 'manual') {
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

  // 任何页面配置变更都标记为 dirty（由定时器统一落盘）
  watch(
    pages,
    () => {
      if (isHydrating) return
      persistDirty.value = true
    },
    { deep: true }
  )

  watch(
    currentPageId,
    () => {
      if (isHydrating) return
      persistDirty.value = true
    }
  )

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

    const rawId = componentId
    const info = parseLoopInstanceId(rawId)
    let treeId = info.sourceId

    // 页面编辑模式下：自定义组件实例内部不允许直接选中子组件，自动提升到实例根。
    if (editorMode.value === 'page') {
      const rootId = findCustomComponentInstanceRootId(treeId)
      if (rootId) {
        treeId = rootId
      }
    }

    const component = findComponentInTree(treeId);
    if (!component) return;

    // loop 实例：允许以 instanceId 进行单独选中（用于高亮/右键菜单等 UI），但底层数据仍来自 source 组件。
    // 注意：若发生 custom instance root 提升，则不保留 loop index（选择根组件）。
    const selectedId = (info.index !== null && treeId === info.sourceId) ? rawId : treeId
    const selectedComp = selectedId === treeId ? component : ({ ...component, id: selectedId } as Comp)

    if (multiSelect) {
      const index = selectedComps.value.findIndex(comp => comp.id === selectedId);
      if (index >= 0) {
        selectedComps.value.splice(index, 1);
      } else {
        selectedComps.value.push(selectedComp);
      }
    } else {
      selectedComps.value = [selectedComp];
    }
  }

  function selectComponents(componentIds: string[]) {
    const normalized = editorMode.value === 'page'
      ? componentIds.map((id) => findCustomComponentInstanceRootId(getLoopSourceId(id)) || getLoopSourceId(id))
      : componentIds.map((id) => getLoopSourceId(id))

    const components = normalized
      .map((id) => findComponentInTree(id))
      .filter(Boolean) as Comp[]
    selectedComps.value = components;
  }

  function findCustomComponentInstanceRootId(componentId: string): string | null {
    let cur: Comp | null = findComponentInTree(componentId)
    if (!cur) return null
    while (cur) {
      if (cur.custom?.defId) return cur.id
      const parentId = findParentContainerId(cur.id)
      if (!parentId) break
      cur = findComponentInTree(parentId)
    }
    return null
  }

  function setEditorMode(mode: 'page' | 'custom-edit') {
    editorMode.value = mode
    selectedComps.value = []
  }

  function createCustomComponentEditPage(defId: string, name: string, templateJson: string): string {
    const id = `${CUSTOM_EDIT_PAGE_PREFIX}${defId}`
    const existing = pages.value.find((p) => p.id === id)
    const comps = (() => {
      try {
        return importFromJSON(templateJson)
      } catch {
        return [] as Comp[]
      }
    })()

    if (existing) {
      existing.name = `编辑组件：${name}`
      existing.components = comps
      existing.updatedAt = new Date()
      currentPageId.value = id
      selectedComps.value = []
      return id
    }

    const newPage: Page = {
      id,
      name: `编辑组件：${name}`,
      components: comps,
      variables: [],
      flows: [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as any

    pages.value.push(newPage)
    currentPageId.value = id
    selectedComps.value = []
    return id
  }

  function removeCustomComponentEditPage(defId: string) {
    const id = `${CUSTOM_EDIT_PAGE_PREFIX}${defId}`
    const idx = pages.value.findIndex((p) => p.id === id)
    if (idx >= 0) pages.value.splice(idx, 1)
    if (currentPageId.value === id) currentPageId.value = pages.value[0]?.id || null
    selectedComps.value = []
  }

  function exportCurrentPageComponentsToJSON(): string {
    return exportToJSON(currentPage.value?.components || [])
  }

  function buildCustomPropsDefaults(schema: Record<string, PropSchema>): Record<string, any> {
    const res: Record<string, any> = {}
    for (const [k, s] of Object.entries(schema || {})) {
      if (s && Object.prototype.hasOwnProperty.call(s, 'manual')) {
        res[k] = (s as any).default
        continue
      }
      const t = (s as any)?.type
      if (t === 'number') res[k] = 0
      else if (t === 'boolean') res[k] = false
      else if (t === 'json') res[k] = null
      else res[k] = ''
    }
    return res
  }

  function applyCustomPropsDefaults(existing: any, schema: Record<string, PropSchema>): Record<string, any> {
    const base = (existing && typeof existing === 'object') ? { ...existing } : {}
    const defaults = buildCustomPropsDefaults(schema)
    for (const [k, v] of Object.entries(defaults)) {
      if (!(k in base)) base[k] = v
    }
    return base
  }

  function syncCustomComponentInstances(def: { id: string; templateJson: string; propsSchema: Record<string, PropSchema>; stateSchema?: Record<string, PropSchema> }): boolean {
    const preserveKeys = new Set([
      'x', 'y', 'zIndex',
      'width', 'height', 'widthSizing', 'heightSizing',
      'layoutMode', 'direction', 'primaryAlign', 'crossAlign', 'gap', 'padding'
    ])

    function replaceIfMatch(comp: Comp): Comp {
      if (comp.custom?.defId !== def.id) return comp

      const next = (() => {
        try {
          return importFromJSON(def.templateJson)[0]
        } catch {
          return undefined
        }
      })()
      if (!next) return comp

      // 为该实例同步时复用内部节点 id，避免多个实例共享同一套 id
      // 同时强制保持实例根 id 不变（选择/历史/引用更稳定）
      const sourceRootId = next.id
      instantiateFromCustomComponentTemplate(next, {
        existingInstanceRoot: comp,
        fixedIdBySourceId: { [sourceRootId]: comp.id }
      })

      const instProps: any = comp.props || {}
      const preserved: any = {}
      for (const k of Object.keys(instProps)) {
        if (preserveKeys.has(k)) preserved[k] = instProps[k]
      }

      const nextCustomProps = applyCustomPropsDefaults(comp.custom?.props, def.propsSchema)
      const nextCustomState = applyCustomPropsDefaults(comp.custom?.state, def.stateSchema || {})

      next.id = comp.id
      next.name = comp.name

      next.custom = {
        defId: def.id,
        props: nextCustomProps,
        state: nextCustomState
      }

      next.props = {
        ...(next.props || {}),
        ...preserved,
      }

      return next
    }

    function mapTree(list: Comp[]): { next: Comp[]; changed: boolean } {
      let changed = false
      const next = list.map((c) => {
        const replaced = replaceIfMatch(c)
        let node = replaced
        if (replaced.children && replaced.children.length) {
          const childRes = mapTree(replaced.children)
          if (childRes.changed) {
            changed = true
            node = { ...replaced, children: childRes.next }
          }
        }
        if (node !== c) changed = true
        return node
      })
      return { next, changed }
    }

    let anyChanged = false
    for (const page of pages.value) {
      if (String(page.id).startsWith(CUSTOM_EDIT_PAGE_PREFIX)) continue
      const res = mapTree(page.components || [])
      if (res.changed) {
        page.components = res.next
        page.updatedAt = new Date()
        anyChanged = true
      }
    }
    return anyChanged
  }

  function isComponentSelected(componentId: string): boolean {
    // instanceId 选中时只高亮该 instance；sourceId 选中时只高亮 source。
    return selectedCompIds.value.includes(componentId);
  }

  function isProtectedRootContainerInCustomEdit(comp: Comp): boolean {
    if (editorMode.value !== 'custom-edit') return false
    if (!comp || comp.type !== 'container') return false
    const parentId = findParentContainerId(comp.id)
    return parentId === null
  }

  type DeleteSelectedResult = { deletedCount: number; blockedCount: number }

  function deleteSelectedComponents(): DeleteSelectedResult {
    const selectedSnapshot = [...selectedComps.value]
    if (selectedSnapshot.length === 0) return { deletedCount: 0, blockedCount: 0 }

    let blockedCount = 0
    let deletedCount = 0

    for (const selected of selectedSnapshot) {
      const normalizedId = getLoopSourceId(selected.id)
      const comp = getComponentById(normalizedId)
      if (!comp) continue

      if (isProtectedRootContainerInCustomEdit(comp)) {
        blockedCount++
        continue
      }

      const parentContainerId = findParentContainerId(comp.id)

      history.addAction({
        type: ActionType.DELETE,
        componentId: comp.id,
        data: {
          before: comp,
          parentContainerId: typeof parentContainerId === 'string' ? parentContainerId : null
        } as any
      })

      const ok = deleteComponentFromCurrentPage(comp.id)
      if (ok) deletedCount++
    }

    if (deletedCount > 0) {
      selectComponent(null)
    }

    return { deletedCount, blockedCount }
  }

  function undoHistoryAction(): boolean {
    const action = history.undo()
    if (!action) return false

    switch (action.type) {
      case ActionType.ADD:
        return deleteComponentFromCurrentPage(action.componentId)
      case ActionType.DELETE: {
        const before = (action.data as any)?.before as Comp | undefined
        if (!before) return false
        const parentContainerId = (action.data as any)?.parentContainerId as string | null | undefined
        if (parentContainerId) return addComponentToContainer(parentContainerId, before)
        return addComponentToCurrentPage(before)
      }
      case ActionType.UPDATE: {
        const comp = getComponentById(action.componentId)
        if (!comp) return false
        const beforePatch = (action.data as any)?.before
        if (!beforePatch) return false
        return updateComponentInCurrentPage({
          ...comp,
          ...beforePatch
        })
      }
      default:
        return false
    }
  }

  function redoHistoryAction(): boolean {
    const action = history.redo()
    if (!action) return false

    switch (action.type) {
      case ActionType.ADD: {
        const after = (action.data as any)?.after as Comp | undefined
        if (!after) return false
        const parentContainerId = (action.data as any)?.parentContainerId as string | null | undefined
        if (parentContainerId) return addComponentToContainer(parentContainerId, after)
        return addComponentToCurrentPage(after)
      }
      case ActionType.DELETE:
        return deleteComponentFromCurrentPage(action.componentId)
      case ActionType.UPDATE: {
        const comp = getComponentById(action.componentId)
        if (!comp) return false
        const afterPatch = (action.data as any)?.after
        if (!afterPatch) return false
        return updateComponentInCurrentPage({
          ...comp,
          ...afterPatch
        })
      }
      default:
        return false
    }
  }

  function bringSelectedToFront(): boolean {
    if (selectedComps.value.length === 0) return false
    return bringComponentToFront(selectedComps.value[0].id)
  }

  function bringSelectedForward(): boolean {
    if (selectedComps.value.length === 0) return false
    return bringComponentForward(selectedComps.value[0].id)
  }

  function sendSelectedBackward(): boolean {
    if (selectedComps.value.length === 0) return false
    return sendComponentBackward(selectedComps.value[0].id)
  }

  function sendSelectedToBack(): boolean {
    if (selectedComps.value.length === 0) return false
    return sendComponentToBack(selectedComps.value[0].id)
  }

  function bringComponentToFront(componentId: string): boolean {
    if (!currentPage.value) return false

    const normalizedId = getLoopSourceId(componentId)
    const comp = getComponentById(normalizedId)
    if (!comp) return false

    const roots = currentPage.value.components || []
    const maxZIndex = Math.max(0, ...roots.map((c) => (c.props as any)?.zIndex || 0))
    return updateComponentInCurrentPage({
      ...comp,
      props: { ...(comp.props || {}), zIndex: maxZIndex + 1 }
    })
  }

  function bringComponentForward(componentId: string): boolean {
    if (!currentPage.value) return false

    const normalizedId = getLoopSourceId(componentId)
    const comp = getComponentById(normalizedId)
    if (!comp) return false

    const roots = currentPage.value.components || []
    const currentZIndex = (comp.props as any)?.zIndex || 1
    const higher = roots.filter((c) => ((c.props as any)?.zIndex || 1) > currentZIndex)
    if (higher.length === 0) return false
    const nextZIndex = Math.min(...higher.map((c) => ((c.props as any)?.zIndex || 1)))
    return updateComponentInCurrentPage({
      ...comp,
      props: { ...(comp.props || {}), zIndex: nextZIndex + 1 }
    })
  }

  function sendComponentBackward(componentId: string): boolean {
    if (!currentPage.value) return false

    const normalizedId = getLoopSourceId(componentId)
    const comp = getComponentById(normalizedId)
    if (!comp) return false

    const roots = currentPage.value.components || []
    const currentZIndex = (comp.props as any)?.zIndex || 1
    const lower = roots.filter((c) => ((c.props as any)?.zIndex || 1) < currentZIndex)
    if (lower.length === 0) return false
    const nextZIndex = Math.max(...lower.map((c) => ((c.props as any)?.zIndex || 1)))
    const newZIndex = Math.max(1, nextZIndex - 1)
    return updateComponentInCurrentPage({
      ...comp,
      props: { ...(comp.props || {}), zIndex: newZIndex }
    })
  }

  function sendComponentToBack(componentId: string): boolean {
    if (!currentPage.value) return false

    const normalizedId = getLoopSourceId(componentId)
    const comp = getComponentById(normalizedId)
    if (!comp) return false

    const roots = currentPage.value.components || []
    const otherComponents = roots.filter((c) => c.id !== comp.id)
    if (otherComponents.length === 0) return false

    const currentZIndex = (comp.props as any)?.zIndex || 1
    const minZIndex = Math.min(...otherComponents.map((c) => ((c.props as any)?.zIndex || 1)))
    if (currentZIndex <= minZIndex) return false

    const ok1 = updateComponentInCurrentPage({
      ...comp,
      props: { ...(comp.props || {}), zIndex: 1 }
    })
    let okAll = ok1
    for (const otherComp of otherComponents) {
      const ok = updateComponentInCurrentPage({
        ...otherComp,
        props: { ...(otherComp.props || {}), zIndex: (((otherComp.props as any)?.zIndex || 1) + 1) }
      })
      if (!ok) okAll = false
    }
    return okAll
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
      layoutMode?: 'manual' | 'manual' | 'auto'
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
      if (layoutMode !== 'manual') return removed as Comp
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

  function isDescendant(parent: Comp, childId: string): boolean {
    if (!parent.children) return false
    for (const child of parent.children) {
        if (child.id === childId) return true
        if (isDescendant(child, childId)) return true
    }
    return false
  }

  function moveComponent(componentId: string, parentId: string | null, index: number): boolean {
    if (!currentPage.value) return false
    if (componentId === parentId) return false

    const dragged = findComponentInTree(componentId)
    if (!dragged) return false

    if (parentId) {
      if (isDescendant(dragged, parentId)) return false
    }

    // 1. 从原位置移除
    let removedComp: Comp | null = null
    const removeRes = mapComponentTree(currentPage.value.components, (c) => {
        if (c.id === componentId) {
            removedComp = c
            return null
        }
        return c
    })
    
    if (!removeRes.changed || !removedComp) return false

    // 2. 插入到新位置
    const compToInsert = removedComp as Comp
    let newRoot = [...removeRes.next]

    if (parentId === null) {
        // 插入到根
        const validIndex = Math.min(Math.max(0, index), newRoot.length)
        newRoot.splice(validIndex, 0, compToInsert)
        currentPage.value.components = newRoot
    } else {
        // 插入到容器
        const insertRes = mapComponentTree(newRoot, (c) => {
            if (c.id === parentId) {
                const children = [...(c.children || [])]
                const validIndex = Math.min(Math.max(0, index), children.length)
                children.splice(validIndex, 0, compToInsert)
                return { ...c, children }
            }
            return c
        })
        if (!insertRes.changed) return false
        currentPage.value.components = insertRes.next
    }

    currentPage.value.updatedAt = new Date()

    // 选中引用保持最新
    if (selectedComps.value.length > 0) {
      selectedComps.value = selectedComps.value
        .map((sc) => findComponentInTree(sc.id, currentPage.value!.components))
        .filter(Boolean) as Comp[]
    }
    return true
  }

  function deleteComponentFromCurrentPage(componentId: string): boolean {
    if (!currentPage.value) return false;

    // 组件编辑模式：不允许删除最外层（根级）Container
    if (editorMode.value === 'custom-edit') {
      const comp = findComponentInTree(componentId)
      if (comp && comp.type === 'container') {
        const parentId = findParentContainerId(componentId)
        if (parentId === null) {
          return false
        }
      }
    }

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

    selectedComps.value = selectedComps.value
      .map((sc) => {
        const base = findComponentInTree(getLoopSourceId(sc.id), res.next)
        if (!base) return null
        // 维持 loop 实例选中：用源组件数据，但保留 instanceId 作为选中 id
        return sc.id === base.id ? base : ({ ...base, id: sc.id } as Comp)
      })
      .filter(Boolean) as Comp[]
    return true
  }

  function updateComponentsInCurrentPage(components: Comp[]): boolean {
    if (!currentPage.value) return false
    if (!components || components.length === 0) return false

    const updates = new Map<string, Comp>()
    for (const c of components) {
      if (!c || !c.id) continue
      updates.set(c.id, c)
    }
    if (updates.size === 0) return false

    const res = mapComponentTree(currentPage.value.components, (c) => {
      const patch = updates.get(c.id)
      if (!patch) return c
      return {
        ...c,
        ...patch,
        props: { ...(c.props || {}), ...(patch.props || {}) }
      }
    })

    if (!res.changed) return false
    currentPage.value.components = res.next
    currentPage.value.updatedAt = new Date()

    selectedComps.value = selectedComps.value
      .map((sc) => {
        const base = findComponentInTree(getLoopSourceId(sc.id), res.next)
        if (!base) return null
        return sc.id === base.id ? base : ({ ...base, id: sc.id } as Comp)
      })
      .filter(Boolean) as Comp[]

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
    return findComponentInTree(getLoopSourceId(componentId)) || undefined
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
    editorMode,
    
    // 计算属性
    currentPage,
    currentComponents,
    selectedCompIds,
    primarySelectedComp,
    
    // 页面管理方法
    initializeDefaultPage,
    initializeFromLocalStorage,
    startAutoPersist,
    stopAutoPersist,
    createCustomComponentEditPage,
    removeCustomComponentEditPage,
    exportCurrentPageComponentsToJSON,
    addPage,
    deletePage,
    updatePage,
    switchPage,
    duplicatePage,
    
    // 组件选择方法
    selectComponent,
    selectComponents,
    isComponentSelected,

    // 工具栏/快捷键动作
    deleteSelectedComponents,
    undoHistoryAction,
    redoHistoryAction,
    bringSelectedToFront,
    bringSelectedForward,
    sendSelectedBackward,
    sendSelectedToBack,

    // 指定组件层级调整（用于右键菜单等）
    bringComponentToFront,
    bringComponentForward,
    sendComponentBackward,
    sendComponentToBack,
    setEditorMode,
    
    // 组件操作方法
    updateCurrentPageComponents,
    addComponentToCurrentPage,
    addComponentToContainer,
    moveComponentToContainer,
    moveComponent,
    deleteComponentFromCurrentPage,
    updateComponentInCurrentPage,
    updateComponentsInCurrentPage,
    updateComponentPosition,

    // 自定义组件：同步定义到实例
    syncCustomComponentInstances,
    
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