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

    const runtimeContext = { ...context, __flowId: flowId };

    // 找到开始节点
    const startNode = flow.nodes.find(n => n.type === 'logicStart');
    if (!startNode) {
      console.warn('No start node found in flow');
      return;
    }

    await executeNode(startNode, flow, runtimeContext);
  }

  async function executeNode(node: any, flow: PageFlow, context: any) {
    console.log('Executing node:', node.type, node.data);

    // 执行节点逻辑
    if (node.type === 'logicCondition') {
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

    let actionOutcome: { ok: boolean } | null = null;
    if (node.type === 'logicAction') {
      actionOutcome = await executeAction(node, context);
    }

    // 脚本节点：按成功/失败 handle 分支流转
    if (node.type === 'logicAction' && node.data?.actionType === 'script') {
      const ok = actionOutcome?.ok !== false;
      const handleId = ok ? 'success' : 'failure';
      const matched = flow.edges.filter(e => e.source === node.id && e.sourceHandle === handleId);

      // 兼容旧数据：脚本原本只有一个输出点，edge 没有 sourceHandle
      const legacy = ok ? flow.edges.filter(e => e.source === node.id && !e.sourceHandle) : [];
      const nextEdges = matched.length > 0 ? matched : legacy;

      for (const edge of nextEdges) {
        const nextNode = flow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          await executeNode(nextNode, flow, context);
        }
      }
      return;
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

  async function executeAction(node: any, context: any): Promise<{ ok: boolean }>{
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
        const { variableName, value, valueSource } = params || {};
        if (variableName) {
           if (valueSource === 'prevResult') {
             pageStore.updateVariableValue(variableName, context?.prevResult);
           } else if (valueSource === 'lastError') {
             pageStore.updateVariableValue(variableName, context?.lastError);
           } else {
             // 简单的值设置
             pageStore.updateVariableValue(variableName, value);
           }
        }
        break;
      }
      case 'pushVar': {
        const { variableName, value, valueSource } = params || {};
        if (variableName) {
          const currentVal = pageStore.getVariableValue(variableName);
          if (Array.isArray(currentVal)) {
            let parsedValue: any;
            if (valueSource === 'prevResult') {
              parsedValue = context?.prevResult;
            } else if (valueSource === 'lastError') {
              parsedValue = context?.lastError;
            } else {
              // 解析 value，如果是 JSON 字符串
              parsedValue = value;
              try {
                parsedValue = JSON.parse(value);
              } catch (e) {}
            }
            
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
      case 'script': {
        const code = params?.code || '';
        try {
          const eventObj = (context && (context.event ?? context.__event)) ?? undefined;
          const fn = new Function('context', 'event', 'pageStore', 'messageApi', 'fetch', `return (async () => { ${code} })();`);
          const result = await fn(fullContext, eventObj, pageStore, messageApi, fetch);

          // 关键：把结果写回可传递的 context，供后续节点使用
          context.prevResult = result;
          context.lastError = null;
        } catch (err) {
          console.error('Script execution error', err);
          context.lastError = {
            message: (err as any)?.message || String(err),
            stack: (err as any)?.stack
          };
          if (messageApi) messageApi.error('脚本执行失败');
          return { ok: false };
        }
        return { ok: true };
      }
      case 'httpRequest': {
        const { url, method = 'GET', headers, body, targetVar } = params || {};
        if (!url) break;
        try {
          const parsedHeaders = headers ? JSON.parse(headers) : undefined;
          const parsedBody = body ? JSON.parse(body) : undefined;
          const res = await fetch(url, { method, headers: parsedHeaders, body: method === 'GET' ? undefined : JSON.stringify(parsedBody) });
          const data = await res.json().catch(() => res.text());
          if (targetVar) pageStore.updateVariableValue(targetVar, data);
        } catch (err) {
          console.error('HTTP request failed', err);
          if (messageApi) messageApi.error('HTTP 请求失败');
        }
        break;
      }
      case 'sendEmail': {
        const { to, subject, body } = params || {};
        // 占位实现：这里可以接入实际邮件服务
        console.info('Send email (mock):', { to, subject, body });
        if (messageApi) messageApi.info(`已发送邮件到 ${to || ''}`);
        break;
      }
      case 'executeFlow': {
        const targetId = params?.flowId;
        if (targetId && targetId !== flowIdFromContext(context)) {
          await executeFlow(targetId, context);
        }
        break;
      }
    }

    return { ok: true };
  }

  // 从上下文中获取当前 flowId，防止递归自调
  function flowIdFromContext(context: any): string | undefined {
    return context?.__flowId;
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
