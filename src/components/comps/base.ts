// 组件类型枚举
export enum CompType {
  CONTAINER = 'container',
  // 后续可以添加更多组件类型
}

// 基础类型
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
export type Framework = 'react' | 'vue';

// 组件属性接口
export interface CompProp {
  type: string;
  value: any;
  default?: any;
}

// 组件事件接口
export interface CompEvent {
  name: string;
  handler: (...args: any[]) => void;
}

// 组件样式接口
export interface CompStyle {
  [key: string]: string | number;
}

// 组件尺寸接口
export interface CompSize {
  width: number;
  height: number;
}

// 组件实例接口
export interface Comp {
  id: string;
  name: string;
  type: CompType;
  props: Record<string, any>;
  events: Record<string, CompEvent>;
  style: CompStyle;
  size: CompSize;
  children: Comp[];
  isContainer?: boolean;
  icon?: string;
  description?: string;
}

// 组件工厂函数
export function createComp(type: CompType, name: string): Comp {
  return {
    id: `${type}_${Date.now()}`,
    name,
    type,
    props: {},
    events: {},
    style: {},
    size: {
      width: 200,
      height: 100
    },
    children: [],
    isContainer: type === CompType.CONTAINER,
  };
}

// 组件注册相关
export interface ComponentMeta {
  type: CompType;
  name: string;
  framework: Framework;
  props?: Record<string, CompProp>;
  events?: Record<string, CompEvent>;
  defaultSize?: CompSize;
}

const componentRegistry = new Map<CompType, ComponentMeta>();

export function registerComponent(meta: ComponentMeta) {
  componentRegistry.set(meta.type, meta);
}

export function getComponentMeta(type: CompType): ComponentMeta | undefined {
  return componentRegistry.get(type);
}
