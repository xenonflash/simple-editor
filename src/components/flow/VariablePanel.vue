<script setup lang="ts">
import { computed, ref } from 'vue'
import { NTree, NButton, NSpace } from 'naive-ui'
import type { VariableTreeNode } from './variableTree'

const props = withDefaults(
  defineProps<{
    data: VariableTreeNode[]
    tip?: string
    selectMode?: 'snippet' | 'value'
    confirmable?: boolean
    confirmText?: string
    cancelText?: string
  }>(),
  {
    tip: '点击条目快速选择',
    selectMode: 'snippet',
    confirmable: false,
    confirmText: '确认',
    cancelText: '取消'
  }
)

const emit = defineEmits<{
  (e: 'select', payload: { key: string; node: VariableTreeNode; snippet?: string; value?: string }): void
  (e: 'cancel'): void
}>()

const pendingKey = ref<string | null>(null)

const canConfirm = computed(() => {
  if (!props.confirmable) return false
  if (!pendingKey.value) return false
  const node = findNode(props.data || [], pendingKey.value)
  if (!node) return false
  if (props.selectMode === 'snippet') return !!node.snippet
  if (props.selectMode === 'value') return typeof node.value === 'string'
  return false
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

  if (props.confirmable) {
    pendingKey.value = key
    return
  }

  if (props.selectMode === 'snippet' && node.snippet) {
    emit('select', { key, node, snippet: node.snippet })
    return
  }

  if (props.selectMode === 'value' && typeof node.value === 'string') {
    emit('select', { key, node, value: node.value })
  }
}

function confirmPick() {
  if (!pendingKey.value) return
  const key = pendingKey.value
  const node = findNode(props.data || [], key)
  if (!node) return

  if (props.selectMode === 'snippet' && node.snippet) {
    emit('select', { key, node, snippet: node.snippet })
  }
  if (props.selectMode === 'value' && typeof node.value === 'string') {
    emit('select', { key, node, value: node.value })
  }
}

function cancelPick() {
  pendingKey.value = null
  emit('cancel')
}
</script>

<template>
  <div class="var-panel">
    <div v-if="tip" class="var-tip">{{ tip }}</div>
    <n-tree :data="data" block-line selectable @update:selected-keys="handleSelect" />

    <div v-if="confirmable" class="var-actions">
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
</style>
