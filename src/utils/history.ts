import type { Comp } from '../components/comps/base';
import { ref } from 'vue';

// 操作类型
export enum ActionType {
  ADD = 'add',
  UPDATE = 'update',
  DELETE = 'delete',
}

// 操作接口
export interface Action {
  type: ActionType;
  componentId: string;
  data: {
    before?: Partial<Comp>;
    after?: Partial<Comp>;
  };
}

// 历史记录管理器
export class History {
  private undoStack = ref<Action[]>([]);
  private redoStack = ref<Action[]>([]);
  private maxSize = 100; // 最大历史记录数

  // 添加操作到历史记录
  addAction(action: Action) {
    this.undoStack.value.push(action);
    // 清空重做栈
    this.redoStack.value = [];
    // 限制历史记录大小
    if (this.undoStack.value.length > this.maxSize) {
      this.undoStack.value.shift();
    }
  }

  // 撤销操作
  undo(): Action | null {
    const action = this.undoStack.value.pop();
    if (action) {
      this.redoStack.value.push(action);
      return action;
    }
    return null;
  }

  // 重做操作
  redo(): Action | null {
    const action = this.redoStack.value.pop();
    if (action) {
      this.undoStack.value.push(action);
      return action;
    }
    return null;
  }

  // 判断是否可以撤销
  canUndo(): boolean {
    return this.undoStack.value.length > 0;
  }

  // 判断是否可以重做
  canRedo(): boolean {
    return this.redoStack.value.length > 0;
  }

  // 清空历史记录
  clear() {
    this.undoStack.value = [];
    this.redoStack.value = [];
  }
}

// 创建单例实例
export const history = new History();
