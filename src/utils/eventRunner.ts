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

  function executeAction(action: CompEventAction, runtimeContext: any = {}) {
    const variables = pageStore.currentPage?.variables || [];
    // 构建上下文：包含所有变量
    const context = variables.reduce((acc, v) => {
      acc[v.name] = pageStore.getVariableValue(v.name);
      return acc;
    }, {} as Record<string, any>);

    Object.assign(context, runtimeContext);

    console.log('Executing action:', action.type, action.params);

    switch (action.type) {
      case 'setVar': {
        const { variableName, value, valueType } = action.params;
        if (variableName) {
          const newValue = parseValue(value, valueType, context);
          pageStore.updateVariableValue(variableName, newValue);
        }
        break;
      }
      
      case 'emitEvent': {
        const { eventName, payload: payloadRaw } = action.params;
        const componentId = runtimeContext.componentId; // Component triggering the emit
        
        if (componentId && eventName) {
           // 1. Find the Host Custom Component (Traverse Up)
           let currentId = componentId;
           let hostComp: any = null;
           
           // Max depth protection
           for (let i = 0; i < 20; i++) {
             const comp = pageStore.getComponentById(currentId);
             if (comp && comp.custom && comp.custom.defId) {
                hostComp = comp;
                break;
             }
             const parentId = pageStore.findParentContainerId(currentId);
             if (!parentId) break;
             currentId = parentId;
           }

           if (hostComp && hostComp.events && hostComp.events[eventName]) {
               const handlers = hostComp.events[eventName];
               const payload = typeof payloadRaw === 'string' ? parseValue(payloadRaw, 'json', context) : payloadRaw;
               
               console.log(`[EventEmit] Found host ${hostComp.id} for event ${eventName}`, handlers);

               handlers.forEach((h: any) => {
                   // 1. Execute Flow
                   if (h.flowId && runtimeContext.executeFlow) {
                       runtimeContext.executeFlow(h.flowId, { event: payload, componentId: hostComp.id });
                   }
                   
                   // 2. Execute Actions (Recursive)
                   if (h.actions && h.actions.length > 0) {
                       // Switch context to the host component
                       runEvents(h.actions, { ...runtimeContext, componentId: hostComp.id, event: payload });
                   }
               });
           } else {
               console.warn(`[EventEmit] No handler found for ${eventName} on host of ${componentId}`);
           }
        }
        break;
      }
      case 'pushVar': {
        const { variableName, value, valueType } = action.params;
        if (variableName) {
          const current = pageStore.getVariableValue(variableName);
          if (Array.isArray(current)) {
            const itemToAdd = parseValue(value, valueType, context);
            pageStore.updateVariableValue(variableName, [...current, itemToAdd]);
          }
        }
        break;
      }
      case 'removeVar': {
        const { variableName, index } = action.params;
        if (variableName) {
          const current = pageStore.getVariableValue(variableName);
          if (Array.isArray(current)) {
            const idx = Number(index);
            if (!isNaN(idx) && idx >= 0 && idx < current.length) {
              const next = [...current]
              next.splice(idx, 1)
              pageStore.updateVariableValue(variableName, next)
            }
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
            // HMR/旧运行时兜底：确保脚本侧能读取页面组件属性
            const ps: any = pageStore as any;
            if (typeof ps.getComponentById !== 'function') {
              ps.getComponentById = (componentId: string) => ps.currentPage?.components?.find((c: any) => c.id === componentId);
            }
            if (typeof ps.getComponentProps !== 'function') {
              ps.getComponentProps = (componentId: string) => ps.getComponentById(componentId)?.props;
            }
            if (typeof ps.getComponentProp !== 'function') {
              ps.getComponentProp = (componentId: string, propName: string) => ps.getComponentById(componentId)?.props?.[propName];
            }

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

  function runEvents(actions: CompEventAction[], context: any = {}) {
    if (!actions || !actions.length) return;
    actions.forEach(action => executeAction(action, context));
  }

  return {
    runEvents,
    setMessageApi
  };
}
