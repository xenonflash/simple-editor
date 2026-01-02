<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NTabs, NTabPane, NTree, NCollapse, NCollapseItem, useMessage } from 'naive-ui'
import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'

type VariableTreeNode = {
  label: string
  key: string
  isLeaf?: boolean
  desc?: string
  snippet?: string
  children?: VariableTreeNode[]
}

const props = defineProps<{
  modelValue: string
  variableTree: VariableTreeNode[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const message = useMessage()

const codeExtensions = [javascript({ jsx: true, typescript: true })]

const fullscreen = ref(false)
const hintTab = ref('vars')
const codeEditorView = ref<any>(null)

const codeExamples = [
  { key: 'read-var', title: '读取并提示', snippet: "const name = pageStore.getVariableValue('用户名')\nmessageApi.info(`你好，${name || '游客'}`)" },
  { key: 'inc-counter', title: '计数自增', snippet: "const n = pageStore.getVariableValue('计数') || 0\npageStore.updateVariableValue('计数', n + 1)" },
  { key: 'use-prev', title: '使用上个节点结果', snippet: "const prev = context.prevResult\nif (prev?.ok) {\n  messageApi.success('上一节点成功')\n} else {\n  messageApi.error('上一节点失败')\n}" },
  { key: 'use-error', title: '处理失败分支错误', snippet: "const err = context.lastError\nif (err) {\n  messageApi.error(err.message || '未知错误')\n}" },
  { key: 'http-fetch', title: '脚本内请求并写入变量', snippet: "const res = await fetch('https://api.example.com/data')\nconst json = await res.json()\npageStore.updateVariableValue('列表数据', json.items || [])" },
  { key: 'validate', title: '校验并写回', snippet: "const email = pageStore.getVariableValue('邮箱')\nif (!/.+@.+/.test(email)) {\n  messageApi.warning('邮箱格式不正确')\n  return\n}\npageStore.updateVariableValue('邮箱', email.trim())" }
]

function setEditorView(view: any) {
  if (view) codeEditorView.value = view
}

function insertSnippet(snippet: string) {
  const view = codeEditorView.value
  if (view) {
    const { from, to } = view.state.selection.main
    view.dispatch({
      changes: { from, to, insert: snippet },
      selection: { anchor: from + snippet.length }
    })
    view.focus()
    emit('update:modelValue', view.state.doc.toString())
  } else {
    const current = props.modelValue || ''
    const merged = current ? `${current}\n${snippet}` : snippet
    emit('update:modelValue', merged)
  }
  message.info('已插入代码片段')
}

function findSnippet(nodes: VariableTreeNode[], key: string): string | null {
  for (const n of nodes) {
    if (n.key === key && n.snippet) return n.snippet
    if (n.children?.length) {
      const s = findSnippet(n.children, key)
      if (s) return s
    }
  }
  return null
}

function handleVarSelect(keys: (string | number)[]) {
  if (!keys.length) return
  const key = String(keys[keys.length - 1])
  const snippet = findSnippet(props.variableTree || [], key)
  if (snippet) insertSnippet(snippet)
}
</script>

<template>
  <div :class="['code-editor-wrap', { fullscreen }]">
    <div class="editor-actions">
      <n-button quaternary size="tiny" round @click="fullscreen = !fullscreen">
        {{ fullscreen ? '退出全屏' : '全屏编辑' }}
      </n-button>
    </div>

    <div v-if="fullscreen" class="editor-shell">
      <div class="hint-panel">
        <n-tabs v-model:value="hintTab" size="small">
          <n-tab-pane name="vars" tab="可用变量">
            <div class="hint-tip">点击变量可快速插入引用</div>
            <n-tree :data="variableTree" block-line selectable @update:selected-keys="handleVarSelect" />
          </n-tab-pane>
          <n-tab-pane name="examples" tab="代码示例">
            <n-collapse default-expanded-names="read-var">
              <n-collapse-item v-for="ex in codeExamples" :key="ex.key" :title="ex.title" :name="ex.key">
                <pre class="code-snippet">{{ ex.snippet }}</pre>
                <n-button size="tiny" tertiary @click="insertSnippet(ex.snippet)">插入代码</n-button>
              </n-collapse-item>
            </n-collapse>
          </n-tab-pane>
        </n-tabs>
      </div>

      <div class="editor-panel">
        <div class="hint-tip" style="margin-bottom: 8px;">
          输出说明：return 的值会写入 <b>context.prevResult</b>；异常会写入 <b>context.lastError</b>，并走失败连线。
        </div>
        <Codemirror
          :model-value="modelValue"
          @update:model-value="(v: string) => emit('update:modelValue', v)"
          :extensions="codeExtensions"
          :autofocus="true"
          @ready="(v: any) => setEditorView(v?.view)"
          :style="{
            height: '100%',
            border: '1px solid #e5e6eb',
            borderRadius: '10px',
            width: '100%'
          }"
        />
      </div>
    </div>

    <template v-else>
      <div class="hint-tip" style="margin-bottom: 8px;">
        输出说明：return 的值会写入 <b>context.prevResult</b>；异常会写入 <b>context.lastError</b>，并走失败连线。
      </div>
      <Codemirror
        :model-value="modelValue"
        @update:model-value="(v: string) => emit('update:modelValue', v)"
        :extensions="codeExtensions"
        :autofocus="true"
        @ready="(v: any) => setEditorView(v?.view)"
        :style="{
          height: '320px',
          border: '1px solid #e5e6eb',
          borderRadius: '10px',
          width: '100%'
        }"
      />
    </template>
  </div>
</template>

<style scoped>
.code-editor-wrap {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  padding-top: 34px;
}

.code-editor-wrap .editor-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  z-index: 2;
}

.code-editor-wrap.fullscreen {
  position: fixed;
  inset: 12px;
  background: #fff;
  z-index: 2000;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
  padding: 18px 18px 22px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  padding-top: 48px;
}

.code-editor-wrap.fullscreen .editor-actions {
  top: 14px;
  right: 14px;
}

.editor-shell {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 16px;
  height: calc(100% - 8px);
}

.hint-panel {
  border: 1px solid #e5e6eb;
  border-radius: 10px;
  background: #fafafa;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.hint-panel :deep(.n-tabs-content) {
  height: 100%;
}

.hint-panel :deep(.n-tab-pane) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.hint-tip {
  font-size: 12px;
  color: #666;
}

.hint-panel :deep(.n-tree) {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.hint-panel :deep(.n-collapse) {
  flex: 1;
  overflow: auto;
}

.code-snippet {
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 10px;
  white-space: pre-wrap;
  font-size: 12px;
  margin-bottom: 8px;
}

.editor-panel {
  border: 1px solid #e5e6eb;
  border-radius: 10px;
  padding: 8px;
  background: #fff;
  min-height: 0;
}

.code-editor-wrap.fullscreen :deep(.cm-editor) {
  height: 100% !important;
}
</style>
