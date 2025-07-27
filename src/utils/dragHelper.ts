import { ref } from 'vue';
import type { Ref } from 'vue';
import type { CompProps } from '../components/comps/base';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startPosX: number;
  startPosY: number;
}

interface DragOptions {
  scale?: Ref<number> | number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onUpdate?: (updates: Partial<CompProps>) => void;
}

export function useDraggable(options: DragOptions = {}) {
  const dragState = ref<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0
  });

  // 处理鼠标按下事件
  function handleMouseDown(e: MouseEvent, currentX: number, currentY: number) {
    dragState.value.isDragging = true;
    dragState.value.startX = e.clientX;
    dragState.value.startY = e.clientY;
    dragState.value.startPosX = currentX;
    dragState.value.startPosY = currentY;

    // 添加全局事件监听
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    options.onDragStart?.();
  }

  // 处理鼠标移动事件
  function handleMouseMove(e: MouseEvent) {
    if (!dragState.value.isDragging) return;

    const scale = (typeof options.scale === 'object' ? options.scale.value : options.scale) || 1;
    const deltaX = (e.clientX - dragState.value.startX) / scale;
    const deltaY = (e.clientY - dragState.value.startY) / scale;

    options.onUpdate?.({
      x: dragState.value.startPosX + deltaX,
      y: dragState.value.startPosY + deltaY
    });
  }

  // 处理鼠标松开事件
  function handleMouseUp() {
    if (dragState.value.isDragging) {
      dragState.value.isDragging = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      options.onDragEnd?.();
    }
  }

  return {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}

// 调整大小相关的工具函数
interface ResizeState {
  isResizing: boolean;
  handle: string | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startPosX: number;
  startPosY: number;
}

interface ResizeOptions {
  scale?: Ref<number> | number;
  minWidth?: number;
  minHeight?: number;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  onUpdate?: (updates: Partial<CompProps>) => void;
}

export function useResizable(options: ResizeOptions = {}) {
  const resizeState = ref<ResizeState>({
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startPosX: 0,
    startPosY: 0
  });

  // 开始调整尺寸
  function startResize(handle: string, e: MouseEvent, currentProps: { x: number; y: number; width: number; height: number }) {
    e.stopPropagation();
    resizeState.value = {
      isResizing: true,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: currentProps.width,
      startHeight: currentProps.height,
      startPosX: currentProps.x,
      startPosY: currentProps.y
    };

    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', endResize);
    
    options.onResizeStart?.();
  }

  // 处理调整尺寸
  function handleResize(e: MouseEvent) {
    if (!resizeState.value.isResizing) return;

    const scale = (typeof options.scale === 'object' ? options.scale.value : options.scale) || 1;
    const deltaX = (e.clientX - resizeState.value.startX) / scale;
    const deltaY = (e.clientY - resizeState.value.startY) / scale;
    const minWidth = options.minWidth || 50;
    const minHeight = options.minHeight || 50;

    const updates: Partial<CompProps> = {};

    switch (resizeState.value.handle) {
      case 'top-left':
        const newWidthTL = Math.max(minWidth, resizeState.value.startWidth - deltaX);
        const newHeightTL = Math.max(minHeight, resizeState.value.startHeight - deltaY);
        updates.width = newWidthTL;
        updates.height = newHeightTL;
        updates.x = resizeState.value.startPosX + resizeState.value.startWidth - newWidthTL;
        updates.y = resizeState.value.startPosY + resizeState.value.startHeight - newHeightTL;
        break;
      case 'top-right':
        updates.width = Math.max(minWidth, resizeState.value.startWidth + deltaX);
        updates.height = Math.max(minHeight, resizeState.value.startHeight - deltaY);
        updates.y = resizeState.value.startPosY + resizeState.value.startHeight - updates.height;
        break;
      case 'bottom-left':
        updates.width = Math.max(minWidth, resizeState.value.startWidth - deltaX);
        updates.height = Math.max(minHeight, resizeState.value.startHeight + deltaY);
        updates.x = resizeState.value.startPosX + resizeState.value.startWidth - updates.width;
        break;
      case 'bottom-right':
        updates.width = Math.max(minWidth, resizeState.value.startWidth + deltaX);
        updates.height = Math.max(minHeight, resizeState.value.startHeight + deltaY);
        break;
    }

    options.onUpdate?.(updates);
  }

  // 结束调整尺寸
  function endResize() {
    if (resizeState.value.isResizing) {
      resizeState.value.isResizing = false;
      resizeState.value.handle = null;
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', endResize);
      options.onResizeEnd?.();
    }
  }

  return {
    resizeState,
    startResize,
    handleResize,
    endResize
  };
}