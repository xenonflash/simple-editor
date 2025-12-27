import { usePageStore } from '../stores/page';
import type { PageFlow } from '../types/page';
import { useMessage } from 'naive-ui';

export function useFlowRunner() {
  const pageStore = usePageStore();
  let messageApi: any = null;

  function setMessageApi(api: any) {
    messageApi = api;
  }

  async function executeFlow(flowId: string, context: any = {}) {
    const flow = pageStore.currentPage?.flows.find(f => f.id === flowId);
    if (!flow) {
      console.warn(`Flow ${flowId} not found`);
      return;
    }

    console.log(`Executing flow: ${flow.name}`, context);

    // 找到开始节点
    const startNode = flow.nodes.find(n => n.type === 'logicStart');
    if (!startNode) {
      console.warn('No start node found in flow');
      return;
    }

    await executeNode(startNode, flow, context);
  }

  async function executeNode(node: any, flow: PageFlow, context: any) {
    console.log('Executing node:', node.type, node.data);

    // 执行节点逻辑
    if (node.type === 'logicAction') {
      await executeAction(node, context);
    } else if (node.type === 'logicCondition') {
      const result = evaluateCondition(node, context);
      const handleId = result ? 'true' : 'false';
      const nextEdge = flow.edges.find(e => e.source === node.id && e.sourceHandle === handleId);
      if (nextEdge) {
        const nextNode = flow.nodes.find(n => n.id === nextEdge.target);
        if (nextNode) {
          await executeNode(nextNode, flow, context);
        }
      }
      return; // 条件节点已经处理了后续流转
    }

    // 默认流转：找下一个节点 (对于非条件节点)
    if (node.type !== 'logicCondition') {
      const nextEdges = flow.edges.filter(e => e.source === node.id);
      for (const edge of nextEdges) {
        const nextNode = flow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          await executeNode(nextNode, flow, context);
        }
      }
    }
  }

  async function executeAction(node: any, context: any) {
    const { actionType, params } = node.data;
    // 这里复用 eventRunner 的逻辑，或者重新实现
    // 为了简单，这里简单实现几个核心动作
    
    // 注入变量上下文
    const variables = pageStore.currentPage?.variables || [];
    const varContext = variables.reduce((acc, v) => {
      acc[v.name] = v.defaultValue; // 注意：这里应该取实时值，但目前 store 里只有 defaultValue? 
      // 实际上 pageStore 应该维护变量的运行时状态，或者我们在 context 里维护
      return acc;
    }, {} as Record<string, any>);
    
    // 合并 context
    const fullContext = { ...varContext, ...context };

    switch (actionType) {
      case 'setVar': {
        // TODO: 需要一个方法来更新变量的运行时值
        // 目前 pageStore 似乎直接修改了 variables 定义的 defaultValue 作为值？
        // 让我们假设是这样
        const { variableName, value } = params || {};
        if (variableName) {
           // 简单的值设置
           pageStore.updateVariableValue(variableName, value);
        }
        break;
      }
      case 'pushVar': {
        const { variableName, value } = params || {};
        if (variableName) {
          const currentVal = pageStore.getVariableValue(variableName);
          if (Array.isArray(currentVal)) {
            // 解析 value，如果是 JSON 字符串
            let parsedValue = value;
            try {
              parsedValue = JSON.parse(value);
            } catch (e) {}
            
            const newVal = [...currentVal, parsedValue];
            pageStore.updateVariableValue(variableName, newVal);
          }
        }
        break;
      }
      case 'toast': {
        const { content, type } = params || {};
        if (messageApi) {
          messageApi[type || 'info'](content);
        } else {
          alert(content);
        }
        break;
      }
    }
  }

  function evaluateCondition(node: any, context: any): boolean {
    // 简单实现，总是返回 true
    // TODO: 实现表达式解析
    return true;
  }

  return {
    executeFlow,
    setMessageApi
  };
}
