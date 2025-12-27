import { useMessage } from 'naive-ui';
import { usePageStore } from '../stores/page';
import type { CompEventAction } from '../components/comps/base';

// 简单的表达式求值
function evaluateExpression(expression: string, context: any) {
  try {
    // 创建一个函数，参数为 context 的键，函数体为 return expression
    const keys = Object.keys(context);
    const values = Object.values(context);
    const func = new Function(...keys, `return ${expression}`);
    return func(...values);
  } catch (e) {
    console.error('Expression evaluation failed:', expression, e);
    return undefined;
  }
}

function parseValue(value: any, type: string, context: any) {
  if (type === 'number') return Number(value);
  if (type === 'boolean') return value === 'true' || value === true;
  if (type === 'json') {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
      return value;
    }
  }
  if (type === 'expression') {
    return evaluateExpression(value, context);
  }
  return value;
}

export function useEventRunner() {
  const pageStore = usePageStore();
  // 注意：useMessage 必须在 setup 函数或组件上下文中使用
  // 这里我们假设调用者会传入 message api 或者我们在组件层调用
  let messageApi: any = null;

  function setMessageApi(api: any) {
    messageApi = api;
  }

  function executeAction(action: CompEventAction) {
    const variables = pageStore.currentPage?.variables || [];
    // 构建上下文：包含所有变量
    const context = variables.reduce((acc, v) => {
      acc[v.name] = v.defaultValue; // 注意：这里应该取当前运行时的值，但目前我们直接修改的是 defaultValue (作为即时值)
      return acc;
    }, {} as Record<string, any>);

    console.log('Executing action:', action.type, action.params);

    switch (action.type) {
      case 'setVar': {
        const { variableName, value, valueType } = action.params;
        const targetVar = variables.find(v => v.name === variableName);
        if (targetVar) {
          const newValue = parseValue(value, valueType, context);
          // 更新变量
          // 目前我们的 store 只有 updateVariable，它接受完整的 PageVariable
          // 为了简化，我们直接修改 defaultValue (在实际运行模式下应该有独立的 runtime state)
          // 这里为了演示效果，直接修改 store 中的定义
          pageStore.updateVariable(variableName, {
            ...targetVar,
            defaultValue: newValue
          });
        }
        break;
      }
      case 'pushVar': {
        const { variableName, value, valueType } = action.params;
        const targetVar = variables.find(v => v.name === variableName);
        if (targetVar && (targetVar.type === 'array' || Array.isArray(targetVar.defaultValue))) {
          const itemToAdd = parseValue(value, valueType, context);
          const newArray = [...(targetVar.defaultValue || []), itemToAdd];
          pageStore.updateVariable(variableName, {
            ...targetVar,
            defaultValue: newArray
          });
        }
        break;
      }
      case 'removeVar': {
        const { variableName, index } = action.params;
        const targetVar = variables.find(v => v.name === variableName);
        if (targetVar && Array.isArray(targetVar.defaultValue)) {
          const idx = Number(index);
          if (!isNaN(idx) && idx >= 0 && idx < targetVar.defaultValue.length) {
            const newArray = [...targetVar.defaultValue];
            newArray.splice(idx, 1);
            pageStore.updateVariable(variableName, {
              ...targetVar,
              defaultValue: newArray
            });
          }
        }
        break;
      }
      case 'toast': {
        const { content, type } = action.params;
        if (messageApi) {
          messageApi[type || 'info'](content);
        } else {
          alert(content);
        }
        break;
      }
      case 'script': {
        const { code } = action.params;
        if (code) {
          try {
            // 提供 context 和一些 helper
            const func = new Function('context', 'pageStore', 'message', code);
            func(context, pageStore, messageApi);
          } catch (e) {
            console.error('Script execution failed:', e);
          }
        }
        break;
      }
    }
  }

  function runEvents(actions: CompEventAction[]) {
    if (!actions || !actions.length) return;
    actions.forEach(action => executeAction(action));
  }

  return {
    runEvents,
    setMessageApi
  };
}
