import type { PropSchema } from './naive-ui-registry';

export interface ActionDefinition {
  type: string;
  label: string;
  description?: string;
  paramsSchema: Record<string, PropSchema>;
}

export const actionRegistry: ActionDefinition[] = [
  {
    type: 'setVar',
    label: '设置变量',
    description: '修改页面变量的值',
    paramsSchema: {
      variableName: { label: '变量名', type: 'select', options: [] }, // options will be populated dynamically
      value: { label: '值', type: 'text' }, // Can be improved to support dynamic types
      valueType: { 
        label: '值类型', 
        type: 'select', 
        options: [
          { label: '字符串', value: 'string' },
          { label: '数字', value: 'number' },
          { label: '布尔值', value: 'boolean' },
          { label: 'JSON', value: 'json' },
          { label: '表达式', value: 'expression' } // Evaluate as JS expression
        ] 
      }
    }
  },
  {
    type: 'pushVar',
    label: '添加到数组',
    description: '向数组类型的变量添加一项',
    paramsSchema: {
      variableName: { label: '数组变量', type: 'select', options: [] },
      value: { label: '内容', type: 'text' },
      valueType: { 
        label: '内容类型', 
        type: 'select', 
        options: [
          { label: '字符串', value: 'string' },
          { label: '数字', value: 'number' },
          { label: 'JSON', value: 'json' },
          { label: '表达式', value: 'expression' }
        ] 
      }
    }
  },
  {
    type: 'removeVar',
    label: '从数组移除',
    description: '从数组变量中移除项',
    paramsSchema: {
      variableName: { label: '数组变量', type: 'select', options: [] },
      index: { label: '索引', type: 'number' } // Optional, if not provided, maybe remove by value? Let's stick to index for now or expression
    }
  },
  {
    type: 'toast',
    label: '显示消息',
    description: '显示一个轻量级提示',
    paramsSchema: {
      content: { label: '内容', type: 'text' },
      type: { 
        label: '类型', 
        type: 'select', 
        options: [
          { label: '信息', value: 'info' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '错误', value: 'error' }
        ] 
      }
    }
  },
  {
    type: 'script',
    label: '执行脚本',
    description: '执行自定义 JavaScript 代码',
    paramsSchema: {
      code: { label: '代码', type: 'json' } // Using json type for textarea input
    }
  }
];
