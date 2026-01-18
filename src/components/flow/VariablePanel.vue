<script setup lang="ts">
import { computed, ref } from 'vue'
import { NTree, NButton, NSpace, NInputGroup, NInput, NSelect, NIcon, NCheckbox } from 'naive-ui'
import { Add } from '@vicons/ionicons5'
import type { VariableTreeNode } from './variableTree'

const props = withDefaults(
  defineProps<{
    data: VariableTreeNode[]
    tip?: string
    selectMode?: 'snippet' | 'value'
    confirmable?: boolean
    confirmText?: string
    cancelText?: string
    allowCreate?: boolean
    allowTwoWay?: boolean
  }>(),
  {
    tip: '点击条目快速选择',
    selectMode: 'snippet',
    confirmable: false,
    confirmText: '确认',
    cancelText: '取消',
    allowCreate: false,
    allowTwoWay: false
  }
)

const emit = defineEmits<{
  (e: 'select', payload: { key: string; node: VariableTreeNode; snippet?: string; value?: string; twoWay?: boolean }): void
  (e: 'cancel'): void
  (e: 'create-prop', payload: { name: string; type: string; defaultValue: any }): void
}>()

const pendingKey = ref<string | null>(null)
const isTwoWay = ref(false)

// Create Mode State
const showCreateMode = ref(false)
const newPropName = ref('')
const newPropType = ref('string')
const newPropDefault = ref('')

const typeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Color', value: 'color' },
]

const canConfirm = computed(() => {
  if (!props.confirmable) return false
  if (!pendingKey.value) return false
  const node = findNode(props.data || [], pendingKey.value)
  if (!node) return false
  if (props.selectMode === 'snippet') return !!node.snippet
  if (props.selectMode === 'value') return typeof node.value === 'string'
  return false
})

const selectedNodeIsCustomProp = computed(() => {
  if (!pendingKey.value) return false
  // Check if key starts with or indicates custom prop context
  // Based on variableTree.ts, 'props' of custom component have keys like 'props-myProp' if we are in custom edit mode?
  // Actually, let's just allow it for any binding if allowed.
  return true
})

function findNode(nodes: VariableTreeNode[], key: string): VariableTreeNode | null {
  for (const n of nodes) {
    if (n.key === key) return n
    if (n.children?.length) {
      const hit = findNode(n.children, key)
      if (hit) return hit
    }
  }
  return null
}

function handleSelect(keys: (string | number)[]) {
  if (!keys.length) return
  const key = String(keys[keys.length - 1])
  const node = findNode(props.data || [], key)
  if (!node) return

  pendingKey.value = key

  // Do not auto-emit if confirmable
  if (props.confirmable) {
    return
  }

  emitPayload(key, node)
}

function emitPayload(key: string, node: VariableTreeNode) {
   if (props.selectMode === 'snippet' && node.snippet) {
    emit('select', { key, node, snippet: node.snippet, twoWay: isTwoWay.value })
  }
  if (props.selectMode === 'value' && typeof node.value === 'string') {
    emit('select', { key, node, value: node.value, twoWay: isTwoWay.value })
  }
}

function confirmPick() {
  if (!pendingKey.value) return
  const key = pendingKey.value
  const node = findNode(props.data || [], key)
  if (!node) return

  emitPayload(key, node)
}

function cancelPick() {
  pendingKey.value = null
  emit('cancel')
}

function handleCreate() {
  if (!newPropName.value) return
  let def: any = newPropDefault.value
  if (newPropType.value === 'number') def = Number(def)
  if (newPropType.value === 'boolean') def = def === 'true'

  emit('create-prop', {
    name: newPropName.value,
    type: newPropType.value,
    defaultValue: def
  })
  showCreateMode.value = false
  newPropName.value = ''
  newPropDefault.value = ''
}
</script>

<template>
  <div class="var-panel">
    <!-- Toolbar for Create -->
    <div v-if="allowCreate" class="var-toolbar">
         <n-button v-if="!showCreateMode" size="small" dashed block @click="showCreateMode = true">
            <template #icon><n-icon><Add /></n-icon></template>
            创建新属性 (Props)
         </n-button>
         <div v-else class="create-form">
            <n-input-group>
              <n-input v-model:value="newPropName" placeholder="属性名 (key)" size="tiny" />
              <n-select v-model:value="newPropType" :options="typeOptions" size="tiny" style="width: 85px" />
            </n-input-group>
            
            <div style="margin-top: 4px">
               <n-input v-if="newPropType === 'string'" v-model:value="newPropDefault" placeholder="默认值" size="tiny" />
               <n-input v-if="newPropType === 'color'" v-model:value="newPropDefault" placeholder="#000000" size="tiny" />
               <n-input v-if="newPropType === 'number'" v-model:value="newPropDefault" type="number" placeholder="0" size="tiny" />
               <n-select v-if="newPropType === 'boolean'" v-model:value="newPropDefault" size="tiny" :options="[{label:'False', value: 'false'}, {label:'True', value: 'true'}]" />
            </div>

             <n-space justify="end" style="margin-top:4px">
                <n-button size="tiny" @click="showCreateMode = false">取消</n-button>
                <n-button size="tiny" type="primary" @click="handleCreate">确定</n-button>
             </n-space>
         </div>
    </div>

    <div v-if="tip" class="var-tip">{{ tip }}</div>
    <n-tree :data="data" block-line selectable @update:selected-keys="handleSelect" />

    <div v-if="confirmable" class="var-actions">
      <div v-if="allowTwoWay" style="margin-bottom: 8px; padding: 0 4px;">
         <n-checkbox v-model:checked="isTwoWay" size="small">
            <span style="font-size: 12px">启用双向绑定 (v-model)</span>
         </n-checkbox>
      </div>
      <n-space justify="end">
        <n-button size="small" @click="cancelPick">{{ cancelText }}</n-button>
        <n-button size="small" type="primary" :disabled="!canConfirm" @click="confirmPick">{{ confirmText }}</n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
.var-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  min-width: 0;
}

.var-tip {
  font-size: 12px;
  color: #666;
}

.var-panel :deep(.n-tree) {
  max-height: 320px;
  overflow: auto;
}

.var-actions {
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.var-toolbar {
  margin-bottom: 8px;
  padding: 4px;
  background: #f9f9f9;
  border-radius: 4px;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
