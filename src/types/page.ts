import type { Comp } from '../components/comps/base';

// 页面接口
export interface Page {
  id: string;
  name: string;
  description: string;
  components: Comp[];
  createdAt: Date;
  updatedAt: Date;
}

// 创建新页面的工厂函数
export function createPage(name: string = '新页面', description: string = ''): Page {
  const now = new Date();
  return {
    id: `page_${Date.now()}`,
    name,
    description,
    components: [],
    createdAt: now,
    updatedAt: now
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