import type { Comp } from '../components/comps/base';
import { CompType, createComp } from '../components/comps/base';

// 导出组件到JSON
export function exportToJSON(components: Comp[]): string {
  function processComponent(comp: Comp): any {
    return {
      id: comp.id,
      name: comp.name,
      type: comp.type,
      props: comp.props,
      custom: comp.custom,
      bindings: comp.bindings,
      events: comp.events,
      style: comp.style,
      size: comp.size,
      ccSourceId: comp.ccSourceId,
      children: comp.children ? comp.children.map(processComponent) : [],
      isContainer: comp.isContainer,
    }
  }

  // 序列化组件数据，移除事件处理器等不需要的字段
  const serializedComps = components.map(processComponent);

  return JSON.stringify(serializedComps, null, 2);
}

// 从JSON导入组件
export function importFromJSON(jsonStr: string): Comp[] {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data)) {
      throw new Error('Invalid JSON format: expected an array');
    }

    // 递归处理组件及其子组件
    function processComponent(comp: any): Comp {
      // 创建新组件实例
      const newComp = createComp(comp.type as CompType, comp.name);
      
      // 恢复 ID (如果存在)
      if (comp.id) {
        newComp.id = comp.id;
      }

      // 复制属性
      newComp.props = { ...comp.props };
      newComp.custom = (comp.custom && typeof comp.custom === 'object') ? { ...comp.custom } : undefined;
      newComp.bindings = { ...comp.bindings };
      newComp.events = { ...comp.events };
      newComp.style = { ...comp.style };
      newComp.size = { ...comp.size };
      newComp.isContainer = comp.isContainer;
      if (typeof comp.ccSourceId === 'string' && comp.ccSourceId) {
        newComp.ccSourceId = comp.ccSourceId;
      }
      
      // 处理子组件
      if (comp.children && Array.isArray(comp.children)) {
        newComp.children = comp.children.map(processComponent);
      }

      return newComp;
    }

    return data.map(processComponent);
  } catch (error) {
    console.error('Error importing components:', error);
    throw error;
  }
}

// 下载JSON文件
export function downloadJSON(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 读取JSON文件
export function readJSONFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
