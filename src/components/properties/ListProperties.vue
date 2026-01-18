<template>
  <PropertySection title="列表配置">
    <template #content>
      <div class="list-properties">
        <!-- 数据源绑定 -->
        <div class="property-row">
          <label class="prop-label">数据源</label>
           <div class="input-wrapper">
             <div v-if="dataSource" class="bound-placeholder" :title="dataSource">
                {{ formatBindingDisplay(String(dataSource)) }}
             </div>
             <div v-else class="empty-placeholder">暂无绑定</div>
           </div>
          
           <n-popover
            trigger="click"
            placement="left"
            :show-arrow="false"
            style="width: 320px"
            :show="openKey === 'dataSource'"
            @update:show="(v) => (openKey = v ? 'dataSource' : null)"
          >
            <template #trigger>
              <n-button
                size="tiny"
                quaternary
                circle
                :type="dataSource ? 'primary' : 'default'"
                class="bind-btn"
                title="绑定数据源"
              >
                <template #icon>
                  <n-icon><Link v-if="dataSource" /><LinkOutline v-else /></n-icon>
                </template>
              </n-button>
            </template>
            <VariablePanel
              :data="pageVariableTree"
              tip="选择数组变量"
              select-mode="value"
              confirmable
              @select="(p) => p.value && handleBindPick('dataSource', p.value)"
              @cancel="openKey = null"
            />
          </n-popover>
        </div>
        
        <!-- Mock数量 -->
        <div class="property-row" v-if="!dataSource">
           <label class="prop-label">Mock数量</label>
           <div class="input-wrapper">
              <input type="number" 
                     class="base-input"
                     :value="mockCount ?? 3" 
                     @input="emit('update', { mockCount: Number(($event.target as HTMLInputElement).value) })" />
           </div>
        </div>

        <!-- 布局方向 -->
        <div class="property-row">
          <label class="prop-label">排列方向</label>
          <div class="segmented-wrapper">
            <div class="segmented-control">
              <button 
                class="segmented-btn"
                :class="{ active: direction !== 'row' }"
                @click="emit('update', { direction: 'column' })"
              >
                垂直 (Column)
              </button>
              <button 
                class="segmented-btn"
                :class="{ active: direction === 'row' }"
                @click="emit('update', { direction: 'row' })"
              >
                水平 (Row)
              </button>
            </div>
          </div>
        </div>

        <!-- 间距 -->
        <div class="property-row">
          <label class="prop-label">项间距</label>
          <div class="input-group">
            <div class="input-wrapper">
              <input type="number" 
                     class="base-input"
                     :value="gap" 
                     @input="emit('update', { gap: Number(($event.target as HTMLInputElement).value) })" />
            </div>
            <span class="unit">px</span>
          </div>
        </div>
      </div>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NIcon, NPopover } from 'naive-ui'
import { Link, LinkOutline } from '@vicons/ionicons5'
import PropertySection from './PropertySection.vue'
import VariablePanel from '../flow/VariablePanel.vue'
import { usePageStore } from '../../stores/page'
import { buildPageVariableTree } from '../flow/variableTree'
import { formatBindingRefDisplay } from '../../utils/bindingRef'

const props = defineProps<{
  dataSource?: string
  direction?: 'row' | 'column'
  gap?: number
  mockCount?: number
}>()

const emit = defineEmits(['update'])
const pageStore = usePageStore()
const openKey = ref<string|null>(null)

const pageVariableTree = computed(() => buildPageVariableTree(pageStore))

function handleBindPick(key: string, value: string) {
  emit('update', { [key]: value })
  openKey.value = null
}

function formatBindingDisplay(binding: string): string {
  return formatBindingRefDisplay(binding, {
    getComponentLabel: (id) => pageStore.getComponentById(id)?.name || id
  })
}
</script>

<style scoped>
.prop-label {
  font-size: 11px;
  color: #666;
  width: 60px;
  flex-shrink: 0;
}

.property-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.empty-placeholder {
  font-size: 11px;
  color: #ccc;
  font-style: italic;
  flex: 1;
}

.bound-placeholder {
  font-size: 10px;
  color: #333;
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.base-input {
  width: 100%;
  height: 24px;
  padding: 0 4px;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  font-size: 11px;
  color: #333;
  background: #fff;
  transition: border-color 0.2s;
  outline: none;
}
.base-input:focus {
  border-color: #000;
}

.input-group {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
}

.unit {
    font-size: 10px;
    color: #999;
    flex-shrink: 0;
    width: 14px;
}

.segmented-wrapper {
  flex: 1;
  background: #f5f5f5;
  padding: 2px;
  border-radius: 4px;
}

.segmented-control {
  display: flex;
  width: 100%;
}

.segmented-btn {
  flex: 1;
  border: none;
  background: none;
  font-size: 10px;
  color: #666;
  padding: 3px 0;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.segmented-btn:hover {
  color: #333;
}

.segmented-btn.active {
  background: #fff;
  color: #000;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-weight: 500;
}

.bind-btn {
    width: 20px;
    height: 20px;
}
</style>

