// 事件分类枚举
export enum EventType {
  // 鼠标交互
  CLICK = 'click',
  DBLCLICK = 'dblclick',
  MOUSEENTER = 'mouseenter',
  MOUSELEAVE = 'mouseleave',
  
  // 键盘/表单交互
  CHANGE = 'change',
  INPUT = 'input',
  FOCUS = 'focus',
  BLUR = 'blur',
  SUBMIT = 'submit',
  
  // 生命周期
  MOUNTED = 'mounted',
  UNMOUNTED = 'unmounted',
}

// 事件定义规范（用于组件注册表声明支持哪些事件）
export interface EventSpec {
  name: EventType | string;  // 事件标识
  label: string;    // UI展示名称
  // 事件回调参数文档，用于提示用户可以在脚本中访问哪些变量
  // e.g. { value: "number", event: "MouseEvent" }
  args?: Record<string, string>; 
  category?: 'interaction' | 'form' | 'lifecycle';
}

// 常用事件定义预设
export const CommonEvents = {
  CLICK: { 
    name: EventType.CLICK, 
    label: '点击时', 
    args: { event: 'MouseEvent' },
    category: 'interaction'
  } as EventSpec,
  
  DBLCLICK: { 
    name: EventType.DBLCLICK, 
    label: '双击时', 
    args: { event: 'MouseEvent' },
    category: 'interaction'
  } as EventSpec,

  MOUSEENTER: {
    name: EventType.MOUSEENTER,
    label: '鼠标移入',
    args: { event: 'MouseEvent' },
    category: 'interaction'
  } as EventSpec,

  MOUSELEAVE: {
    name: EventType.MOUSELEAVE,
    label: '鼠标移出',
    args: { event: 'MouseEvent' },
    category: 'interaction'
  } as EventSpec,

  CHANGE: { 
    name: EventType.CHANGE, 
    label: '值改变时', 
    args: { value: 'any' },
    category: 'form'
  } as EventSpec,

  INPUT: {
    name: EventType.INPUT,
    label: '输入时',
    args: { value: 'string' },
    category: 'form'
  } as EventSpec,

  FOCUS: {
    name: EventType.FOCUS,
    label: '聚焦时',
    args: { event: 'FocusEvent' },
    category: 'form'
  } as EventSpec,

  BLUR: {
    name: EventType.BLUR,
    label: '失焦时',
    args: { event: 'FocusEvent' },
    category: 'form'
  } as EventSpec,

  MOUNTED: {
    name: EventType.MOUNTED,
    label: '加载完成时',
    category: 'lifecycle'
  } as EventSpec,

  UNMOUNTED: {
    name: EventType.UNMOUNTED,
    label: '卸载完成时',
    category: 'lifecycle'
  } as EventSpec
}
