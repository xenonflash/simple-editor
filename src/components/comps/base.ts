// 组件类型枚举
export enum CompType {
  CONTAINER = 'container',
  BUTTON = 'button',
  TEXT = 'text',
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

// 组件属性定义
export interface CompProps {
  id: string;
  type: CompType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
  borderRadiusTopLeft?: number;
  borderRadiusTopRight?: number;
  borderRadiusBottomLeft?: number;
  borderRadiusBottomRight?: number;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: string;
  textDecoration?: string;
  fontFamily?: string;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  shadowInset?: boolean;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

// 基础属性接口（不包含id和type）
interface BaseProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
}

// 组件工厂函数
export function createComp(type: CompType, name: string): Comp {
  const baseProps: BaseProps = {
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    borderWidth: 0,
    borderStyle: 'none',
    borderColor: '#000000',
    shadowX: 0,
    shadowY: 0,
    shadowBlur: 0,
    shadowSpread: 0,
    shadowColor: '#000000'
  };

  switch (type) {
    case CompType.CONTAINER:
      return {
        id: `${type}_${Date.now()}`,
        name,
        type,
        props: {
          ...baseProps,
          width: 200,
          height: 200,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: '#e0e0e0',
        },
        events: {},
        style: {},
        size: { width: 200, height: 200 },
        children: [],
        isContainer: true,
        icon: '□',
        description: '容器组件，可以包含其他组件',
      };
    case CompType.BUTTON:
      return {
        id: `${type}_${Date.now()}`,
        name,
        type,
        props: {
          ...baseProps,
          width: 100,
          height: 40,
          content: '按钮',
          color: '#ffffff',
          backgroundColor: '#1890ff',
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 'normal',
        },
        events: {},
        style: {},
        size: { width: 100, height: 40 },
        children: [],
        icon: '⬜',
        description: '可交互的按钮组件',
      };
    case CompType.TEXT:
      return {
        id: `${type}_${Date.now()}`,
        type,
        name,
        props: {
          ...baseProps,
          content: '新建文本',
          color: '#333',
          fontSize: 14,
          fontWeight: 'normal',
          fontFamily: 'Arial',
          textDecoration: 'none',
          fontStyle: 'normal',
          width: 100,
          height: 40
        },
        events: {},
        style: {},
        size: {
          width: 100,
          height: 40
        },
        children: [],
      };
  }
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
