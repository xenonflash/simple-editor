import { CompType } from '../../types/component';
import { getNaiveConfig } from '../../config/naive-ui-registry';
import { atomConfigs, defaultBaseProps } from './atomConfig';

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

// 自定义组件实例元信息（方案 B：从 props 抽离）
export interface CustomComponentInstance {
  /** 引用的自定义组件 Definition ID */
  defId: string;
  /** 自定义组件参数（由 propsSchema 定义） */
  props: Record<string, any>;
  /** 自定义组件参数绑定（propName -> bindingRef） */
  bindings?: Record<string, string>;
  /** 自定义组件状态值（由 stateSchema 定义，可选/按需使用） */
  state: Record<string, any>;
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
  /** 自定义组件实例元信息：仅自定义组件实例根节点存在 */
  custom?: CustomComponentInstance;
  bindings?: Record<string, string>; // 属性绑定: propName -> 绑定引用（var:<name> / comp:<id>:<prop>，兼容旧: <name>）
  events: Record<string, CompEvent[]>; // 支持多个动作
  style: CompStyle;
  /** @deprecated Use props.width and props.height instead */
  size?: CompSize;
  /** 自定义组件模板同步用：该节点在 definition 模板中的源 id */
  ccSourceId?: string;
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

  // ==================== 渲染控制（核心数据结构） ====================
  /** 条件渲染：默认显示；false 则隐藏（类似 v-show） */
  renderVisible?: boolean;
}

// 基础属性接口（不包含id和type）
interface BaseProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  widthSizing?: 'fixed' | 'fill' | 'content';
  heightSizing?: 'fixed' | 'fill' | 'content';
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  zIndex?: number;
  // 渲染控制
  renderVisible?: boolean;
}

// 组件工厂函数
export function createComp(type: CompType, name: string): Comp {
  const baseProps: BaseProps = { ...defaultBaseProps };

  // 1. 检查是否为 Naive UI 组件
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

  // 2. 检查是否为原子组件（通过配置表）
  const atomConfig = atomConfigs[type];
  if (atomConfig) {
    return {
      id: `${type}_${Date.now()}`,
      name,
      type,
      props: {
        ...baseProps,
        ...atomConfig.defaultProps
      },
      events: {},
      style: {},
      size: atomConfig.size,
      children: [],
      isContainer: atomConfig.isContainer,
      icon: atomConfig.icon,
      description: atomConfig.description
    };
  }

  // 3. 默认/未知组件（或者自定义组件的基础容器）
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
