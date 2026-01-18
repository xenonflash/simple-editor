import type { Comp } from '../comps/base'
import { usePageStore } from '../../stores/page'

export type VariableTreeNode = {
  label: string
  key: string
  isLeaf?: boolean
  desc?: string
  snippet?: string
  value?: string
  children?: VariableTreeNode[]
  isList?: boolean // 标记是否为列表/数组类型
}

export type BuildPageVariableTreeOptions = {
  customProps?: Record<string, any>
  customPropsCtxPath?: string
  customPropsLabel?: string

  /** 是否在变量选择中展示“循环数据（ctx.loop）” */
  loopAvailable?: boolean
  /** 循环 item 的样本值（用于推断字段结构；为空/未知时仅提供 item 本身） */
  loopItemSample?: any
  /** 循环上下文根路径，默认 loop（即 ctx:loop.item / ctx:loop.index） */
  loopCtxPath?: string
  /** 循环数据分组名称 */
  loopLabel?: string
}

function previewValue(v: any): string {
  if (v === undefined) return 'undefined'
  if (v === null) return 'null'
  if (typeof v === 'string') {
    const trimmed = v.length > 24 ? `${v.slice(0, 24)}…` : v
    return JSON.stringify(trimmed)
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return `Array(${v.length})`
  if (typeof v === 'object') return '{…}'
  return String(v)
}

function pickReadablePropKeys(comp: Comp): string[] {
  const preferred = ['value', 'checked', 'show', 'content', 'label']

  // 优先根据组件类型给出“用户最可能需要”的字段（即使当前 props 里还没出现也展示）
  const typeToKeys: Record<string, string[]> = {
    // Naive UI
    'n-input': ['value'],
    'n-select': ['value'],
    'n-switch': ['value'],
    'n-checkbox': ['checked'],
    'n-date-picker': ['value'],
    'n-time-picker': ['value'],

    // 内置组件
    'text': ['content'],
    'button': ['content']
  }

  const suggested = typeToKeys[String(comp.type)] || []
  const existingPreferred = preferred.filter(k => comp.props && k in comp.props)

  const merged = [...suggested]
  for (const k of existingPreferred) {
    if (!merged.includes(k)) merged.push(k)
  }
  return merged
}

function buildComponentPropNodes(comp: Comp): VariableTreeNode[] {
  const keys = pickReadablePropKeys(comp)
  return keys.map((k) => ({
    label: `${k} = ${previewValue(comp.props?.[k])}`,
    key: `comp-${comp.id}-prop-${k}`,
    isLeaf: true,
    desc: '组件属性',
    snippet: `pageStore.getComponentProp('${comp.id}', '${k}')`
  }))
}

function buildCustomPropsTree(customProps: Record<string, any>, basePath: string, keyPrefix: string): VariableTreeNode[] {
  const keys = Object.keys(customProps).sort()
  return keys.map((k) => {
    const v = customProps[k]
    const nextPath = `${basePath}.${k}`
    const nodeKey = `${keyPrefix}-${k}`
    const isList = Array.isArray(v)

    if (v && typeof v === 'object' && !isList) {
      const children = buildCustomPropsTree(v, nextPath, nodeKey)
      return {
        label: `${k} = ${previewValue(v)}`,
        key: nodeKey,
        desc: '自定义组件 props',
        children
      }
    }

    return {
      label: `${k} = ${previewValue(v)}`,
      key: nodeKey,
      isLeaf: true,
      desc: '自定义组件 props',
      value: `ctx:${nextPath}`,
      isList
    }
  })
}

function buildCtxObjectTree(obj: Record<string, any>, basePath: string, keyPrefix: string, desc: string): VariableTreeNode[] {
  const keys = Object.keys(obj).sort()
  return keys.map((k) => {
    const v = obj[k]
    const nextPath = `${basePath}.${k}`
    const nodeKey = `${keyPrefix}-${k}`
    const isList = Array.isArray(v)

    if (v && typeof v === 'object' && !isList) {
      const children = buildCtxObjectTree(v, nextPath, nodeKey, desc)
      return {
        label: `${k} = ${previewValue(v)}`,
        key: nodeKey,
        desc,
        children
      }
    }

    return {
      label: `${k} = ${previewValue(v)}`,
      key: nodeKey,
      isLeaf: true,
      desc,
      value: `ctx:${nextPath}`,
      isList
    }
  })
}

function buildLoopTreeChildren(loopItemSample: any, loopCtxPath: string): VariableTreeNode[] {
  const itemPath = `${loopCtxPath}.item`
  const indexPath = `${loopCtxPath}.index`

  const indexNode: VariableTreeNode = {
    label: `index = ${previewValue(0)}`,
    key: 'loop-index',
    isLeaf: true,
    desc: '循环下标',
    value: `ctx:${indexPath}`
  }

  // item：原始类型/数组/空/未知 -> 直接叶子；对象 -> 可展开
  const itemIsObject = loopItemSample && typeof loopItemSample === 'object' && !Array.isArray(loopItemSample)
  if (!itemIsObject) {
    return [
      {
        label: `item = ${previewValue(loopItemSample)}`,
        key: 'loop-item',
        isLeaf: true,
        desc: '循环 item',
        value: `ctx:${itemPath}`
      },
      indexNode
    ]
  }

  const children = buildCtxObjectTree(loopItemSample as Record<string, any>, itemPath, 'loop-item', '循环 item')
  return [
    {
      label: `item = ${previewValue(loopItemSample)}`,
      key: 'loop-item',
      desc: '循环 item',
      value: `ctx:${itemPath}`,
      children
    },
    indexNode
  ]
}

export function buildScriptVariableTree(pageStore: ReturnType<typeof usePageStore>): VariableTreeNode[] {
  const pageVars: VariableTreeNode[] = (pageStore.currentPage?.variables || []).map((v) => ({
    label: `${v.name} (${v.type})`,
    key: `page-var-${v.name}`,
    isLeaf: true,
    desc: '页面变量',
    snippet: `pageStore.getVariableValue('${v.name}')`
  }))

  const components: VariableTreeNode[] = (pageStore.currentPage?.components || []).map((c) => {
    const commonProps = buildComponentPropNodes(c)
    const children: VariableTreeNode[] = [
      ...commonProps,
      {
        label: 'props（对象）',
        key: `comp-${c.id}-props-object`,
        isLeaf: true,
        desc: '组件 props 对象（高级用法）',
        snippet: `pageStore.getComponentProps('${c.id}')`
      }
    ]

    return {
      label: `${c.name || c.id} (${c.type})`,
      key: `comp-${c.id}`,
      children
    }
  })

  const globals: VariableTreeNode[] = [
    {
      label: 'messageApi',
      key: 'global-messageApi',
      isLeaf: true,
      desc: '提示 API',
      snippet: 'messageApi.success("提示内容")'
    },
    {
      label: 'fetch',
      key: 'global-fetch',
      isLeaf: true,
      desc: '网络请求',
      snippet: 'const res = await fetch("https://api.example.com")'
    }
  ]

  const ctxNodes: VariableTreeNode[] = [
    { label: 'context.input', key: 'ctx-input', isLeaf: true, desc: '节点入参', snippet: 'context.input' },
    { label: 'context.prevResult', key: 'ctx-prev', isLeaf: true, desc: '上个节点输出', snippet: 'context.prevResult' },
    { label: 'context.lastError', key: 'ctx-err', isLeaf: true, desc: '上个节点错误', snippet: 'context.lastError' },
    { label: 'context.__flowId', key: 'ctx-flow', isLeaf: true, desc: '当前 Flow 标识', snippet: 'context.__flowId' },
    { label: 'event', key: 'ctx-event', isLeaf: true, desc: '事件对象（若存在）', snippet: 'event' }
  ]

  return [
    { label: '页面变量', key: 'page-vars', children: pageVars },
    { label: '页面组件属性', key: 'page-comp-props', children: components },
    { label: '全局能力', key: 'global', children: globals },
    { label: '上下文', key: 'context', children: ctxNodes }
  ]
}

export function buildPageVariableTree(pageStore: ReturnType<typeof usePageStore>, opts?: BuildPageVariableTreeOptions): VariableTreeNode[] {
  const unbind: VariableTreeNode = {
    label: '取消绑定',
    key: 'unbind',
    isLeaf: true,
    desc: '清空当前属性绑定',
    value: '__unbind__'
  }

  const customProps = opts?.customProps
  const customPropsCtxPath = (opts?.customPropsCtxPath || 'customProps').trim() || 'customProps'
  const customPropsLabel = (opts?.customPropsLabel || '自定义组件参数').trim() || '自定义组件参数'
  const customPropsNode: VariableTreeNode | null = (customProps && typeof customProps === 'object')
    ? {
        label: customPropsLabel,
        key: 'custom-props',
        children: buildCustomPropsTree(customProps, customPropsCtxPath, 'custom-props')
      }
    : null

  const loopAvailable = !!opts?.loopAvailable
  const loopCtxPath = (opts?.loopCtxPath || 'loop').trim() || 'loop'
  const loopLabel = (opts?.loopLabel || '循环数据').trim() || '循环数据'
  const loopNode: VariableTreeNode | null = loopAvailable
    ? {
        label: loopLabel,
        key: 'loop-data',
        children: buildLoopTreeChildren(opts?.loopItemSample, loopCtxPath)
      }
    : null

  const vars: VariableTreeNode[] = (pageStore.currentPage?.variables || []).map((v) => ({
    label: `${v.name}`,
    key: `page-var-${v.name}`,
    isLeaf: true,
    desc: '页面变量',
    value: `var:${v.name}`,
    isList: v.type === 'array'
  }))

  const components: VariableTreeNode[] = (pageStore.currentPage?.components || []).map((c) => {
    const keys = pickReadablePropKeys(c)
    const children: VariableTreeNode[] = keys.map((k) => ({
      label: `${k} = ${previewValue(c.props?.[k])}`,
      key: `page-comp-${c.id}-prop-${k}`,
      isLeaf: true,
      desc: '页面组件属性（单向）',
      value: `comp:${c.id}:${k}`
    }))

    return {
      label: `${c.name || c.id} (${c.type})`,
      key: `page-comp-${c.id}`,
      children
    }
  })

  return [
    { label: '操作', key: 'binding-actions', children: [unbind] },
    ...(customPropsNode ? [customPropsNode] : []),
    ...(loopNode ? [loopNode] : []),
    { label: '页面变量', key: 'page-vars', children: vars },
    { label: '页面组件属性', key: 'page-comp-props', children: components }
  ]
}

export function buildValueRefTree(pageStore: ReturnType<typeof usePageStore>): VariableTreeNode[] {
  const vars: VariableTreeNode[] = (pageStore.currentPage?.variables || []).map((v) => ({
    label: `${v.name}`,
    key: `valref-page-var-${v.name}`,
    isLeaf: true,
    desc: '页面变量',
    value: `var:${v.name}`
  }))

  const components: VariableTreeNode[] = (pageStore.currentPage?.components || []).map((c) => {
    const keys = pickReadablePropKeys(c)
    const children: VariableTreeNode[] = keys.map((k) => ({
      label: `${k} = ${previewValue(c.props?.[k])}`,
      key: `valref-comp-${c.id}-prop-${k}`,
      isLeaf: true,
      desc: '页面组件属性（单向）',
      value: `comp:${c.id}:${k}`
    }))

    return {
      label: `${c.name || c.id} (${c.type})`,
      key: `valref-comp-${c.id}`,
      children
    }
  })

  const ctxNodes: VariableTreeNode[] = [
    { label: 'context.input', key: 'valref-ctx-input', isLeaf: true, desc: '节点入参', value: 'ctx:input' },
    { label: 'context.prevResult', key: 'valref-ctx-prev', isLeaf: true, desc: '上个节点输出', value: 'ctx:prevResult' },
    { label: 'context.lastError', key: 'valref-ctx-err', isLeaf: true, desc: '上个节点错误', value: 'ctx:lastError' },
    { label: 'context.__flowId', key: 'valref-ctx-flow', isLeaf: true, desc: '当前 Flow 标识', value: 'ctx:__flowId' }
  ]

  return [
    { label: '页面变量', key: 'valref-page-vars', children: vars },
    { label: '页面组件属性', key: 'valref-page-comp-props', children: components },
    { label: '上下文', key: 'valref-context', children: ctxNodes }
  ]
}
