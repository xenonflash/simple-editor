import type { Comp } from '../components/comps/base';

export interface PageVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue: any;
}

export interface PageFlow {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
}

// 页面接口
export interface Page {
  id: string;
  name: string;
  description: string;
  components: Comp[];
  variables: PageVariable[];
  flows: PageFlow[];
  createdAt: Date;
  updatedAt: Date;
  
  // 画布模式属性
  width: number;
  height: number;
  backgroundColor: string;
  
  // 布局系统
  layoutMode?: 'canvas' | 'flow'; // canvas=自由布局, flow=流式布局
  
  // Flow 模式布局属性
  layoutDirection?: 'row' | 'column';
  layoutJustifyContent?: string; // start, center, end, between, evenly, around
  layoutAlignItems?: string;    // start, center, end, stretch
  layoutGap?: number;
  
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// 创建新页面的工厂函数
export function createPage(name: string = '新页面', description: string = ''): Page {
  const now = new Date();
  return {
    id: `page_${Date.now()}`,
    name,
    description,
    components: [],
    variables: [],
    flows: [],
    createdAt: now,
    updatedAt: now,
    
    // 默认 Canvas 模式
    width: 1280,
    height: 800,
    backgroundColor: '#ffffff',
    layoutMode: 'canvas',
    
    // 默认 Flow 参数
    layoutDirection: 'column',
    layoutJustifyContent: 'start',
    layoutAlignItems: 'stretch', // column方向下stretch即为横向撑满
    layoutGap: 10,
    
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    }
  };
}

// 页面管理状态接口
export interface PageState {
  pages: Page[];
  currentPageId: string | null;
}

// 页面操作类型
export enum PageActionType {
  ADD_PAGE = 'ADD_PAGE',
  DELETE_PAGE = 'DELETE_PAGE',
  UPDATE_PAGE = 'UPDATE_PAGE',
  SWITCH_PAGE = 'SWITCH_PAGE',
  UPDATE_PAGE_COMPONENTS = 'UPDATE_PAGE_COMPONENTS'
}

// 页面操作接口
export interface PageAction {
  type: PageActionType;
  payload: any;
}