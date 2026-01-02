import { CompType } from '../../types/component';
import { getNaiveConfig } from '../../config/naive-ui-registry';

// 导出 CompType 以保持兼容性
export { CompType };

// 基础类型
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
export type Framework = 'react' | 'vue';

// 组件属性接口
export interface CompProp {
  type: string;
  value: any;
  default?: any;
}

// 组件事件动作接口
export interface CompEventAction {
  id: string;
  type: string; // 'setVar' | 'script' | 'link' | 'toast' etc.
  params: Record<string, any>;
}

// 组件事件接口
export interface CompEvent {
  trigger: string; // 'click', 'hover', etc.
  actions: CompEventAction[];
  flowId?: string; // 绑定的逻辑流 ID
}

// 组件样式接口
export interface CompStyle {
  [key: string]: string | number | undefined;
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
  bindings?: Record<string, string>; // 属性绑定: propName -> 绑定引用（var:<name> / comp:<id>:<prop>，兼容旧: <name>）
  events: Record<string, CompEvent[]>; // 支持多个动作
  style: CompStyle;
  /** @deprecated Use props.width and props.height instead */
  size?: CompSize;
  children: Comp[];
  isContainer?: boolean;
  icon?: string;
  description?: string;
}

// 组件属性定义 (标准属性集合)
export interface CompStandardProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  gradientType?: string;
  gradientColor1?: string;
  gradientColor2?: string;
  gradientDirection?: string;
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
  zIndex?: number;
  // 新增文字组件专用属性
  widthMode?: 'auto' | 'fixed'; // 宽度模式：自动撑满或固定宽度
  autoHeight?: boolean; // 是否自动高度
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
  zIndex?: number;
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
    shadowColor: '#000000',
    zIndex: 1
  };

  // 检查是否为 Naive UI 组件
  const naiveConfig = getNaiveConfig(type);
  if (naiveConfig) {
    return {
      id: `${type}_${Date.now()}`,
      name,
      type,
      props: {
        ...baseProps,
        width: 120, // 默认宽度
        height: 34, // 默认高度
        ...naiveConfig.defaultProps
      },
      events: {},
      style: {},
      size: { width: 120, height: 34 },
      children: [],
      icon: naiveConfig.icon,
      description: `Naive UI ${naiveConfig.name}`
    };
  }

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
          backgroundColor: '#ffffff',
          backgroundImage: '',
          gradientType: 'none',
          gradientColor1: '#ffffff',
          gradientColor2: '#000000',
          gradientDirection: '135deg',
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
          content: '一段文字',
          color: '#333',
          fontSize: 14,
          fontWeight: 'normal',
          fontFamily: 'Arial',
          textDecoration: 'none',
          fontStyle: 'normal',
          width: 60,
          height: 20,
          // 新增文字组件默认属性
          widthMode: 'fixed', // 改为默认固定宽度
          autoHeight: false, // 改为默认固定高度
          minWidth: 20,
          maxWidth: 500
        },
        events: {},
        style: {},
        size: {
          width: 100,
          height: 40
        },
        children: [],
      };
    default:
      // 默认返回一个空容器，防止报错
      return {
        id: `${type}_${Date.now()}`,
        name,
        type,
        props: { ...baseProps },
        events: {},
        style: {},
        size: { width: 100, height: 100 },
        children: []
      };
  }
}

// 组件注册相关
export interface ComponentMeta {
  type: CompType;
  name: string;
  framework: Framework;
  props?: Record<string, CompProp>;
  events?: string[]; // 支持的事件名称列表
  defaultSize?: CompSize;
}

const componentRegistry = new Map<CompType, ComponentMeta>();

export function registerComponent(meta: ComponentMeta) {
  componentRegistry.set(meta.type, meta);
}

export function getComponentMeta(type: CompType): ComponentMeta | undefined {
  return componentRegistry.get(type);
}
export type CompProps = CompStandardProps;
