<template>
  <div>
    <!-- 布局模式 -->
    <div class="form-group" v-if="!hideModeSwitch">
      <label>布局模式</label>
      <div class="segmented-wrapper">
        <div class="segmented-control">
          <button 
            class="segmented-btn"
            :class="{ active: modeValue === modes.manual }"
            @click="emitUpdate(modeKey, modes.manual)"
          >
            {{ labels.manual }}
          </button>
          <button 
            class="segmented-btn"
            :class="{ active: modeValue === modes.auto }"
            @click="emitUpdate(modeKey, modes.auto)"
          >
            {{ labels.auto }}
          </button>
        </div>
      </div>
    </div>

    <!-- 详细布局设置 -->
    <template v-if="modeValue === modes.auto">
      <!-- 方向 -->
      <div class="form-group">
        <label>方向 (Direction)</label>
        <div class="segmented-wrapper">
          <div class="segmented-control">
            <button 
              class="segmented-btn"
              :class="{ active: direction === 'row' }"
              @click="emitUpdate('direction', 'row')"
            >
              水平 (Row)
            </button>
            <button 
              class="segmented-btn"
              :class="{ active: !direction || direction === 'column' }"
              @click="emitUpdate('direction', 'column')"
            >
              垂直 (Col)
            </button>
          </div>
        </div>
      </div>

      <!-- 主轴对齐 -->
      <div class="form-group">
        <label>主轴对齐 (Justify)</label>
        <div class="align-group">
          <button class="icon-btn" title="start" :class="{ active: justify === 'flex-start' || justify === 'start' || (!justify && defaultJustify === 'start') }" @click="emitUpdate(justifyKey, 'flex-start')">
            <svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h10v2H4zm0 5h16v2H4z"/></svg>
          </button>
          <button class="icon-btn" title="center" :class="{ active: justify === 'center' }" @click="emitUpdate(justifyKey, 'center')">
            <svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm3 5h10v2H7zm-3 5h16v2H4z"/></svg>
          </button>
          <button class="icon-btn" title="end" :class="{ active: justify === 'flex-end' || justify === 'end' }" @click="emitUpdate(justifyKey, 'flex-end')">
            <svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm6 5h10v2H10zm-6 5h16v2H4z"/></svg>
          </button>
          <button class="icon-btn" title="space-between" :class="{ active: justify === 'space-between' || justify === 'between' }" @click="emitUpdate(justifyKey, 'space-between')">
            <svg viewBox="0 0 24 24"><path d="M2 6h20v2H2zm0 5h6v2H2zm14 0h6v2h-6zm-14 5h20v2H2z"/></svg>
          </button>
          <button class="icon-btn" title="space-around" :class="{ active: justify === 'space-around' || justify === 'evenly' }" @click="emitUpdate(justifyKey, 'space-around')">
              <svg viewBox="0 0 24 24"><path d="M2 6h20v2H2zm2 5h6v2H4zm10 0h6v2h-6zm-12 5h20v2H2z"/></svg>
          </button>
        </div>
      </div>

      <!-- 交叉轴对齐 -->
      <div class="form-group">
        <label>交叉对齐 (Align)</label>
        <div class="align-group">
          <button class="icon-btn" title="stretch" :class="{ active: align === 'stretch' || (!align && defaultAlign === 'stretch') }" @click="emitUpdate(alignKey, 'stretch')">
              <svg viewBox="0 0 24 24"><path d="M4 4h2v16H4zm14 0h2v16h-2zM8 8h8v2H8zm0 6h8v2H8z"/></svg>
          </button>
          <button class="icon-btn" title="start" :class="{ active: align === 'flex-start' || align === 'start' }" @click="emitUpdate(alignKey, 'flex-start')">
              <svg viewBox="0 0 24 24"><path d="M4 4h16v2H4zM8 9h8v2H8zm0 5h8v2H8z"/></svg>
          </button>
          <button class="icon-btn" title="center" :class="{ active: align === 'center' }" @click="emitUpdate(alignKey, 'center')">
              <svg viewBox="0 0 24 24"><path d="M4 11h16v2H4zM8 7h8v2H8zm0 8h8v2H8z"/></svg>
          </button>
          <button class="icon-btn" title="end" :class="{ active: align === 'flex-end' || align === 'end' }" @click="emitUpdate(alignKey, 'flex-end')">
              <svg viewBox="0 0 24 24"><path d="M4 18h16v2H4zM8 13h8v2H8zm0-5h8v2H8z"/></svg>
          </button>
        </div>
      </div>

      <!-- 间距 -->
      <div class="form-group">
        <label>间距 (Gap)</label>
        <div style="position: relative;">
            <input 
            type="number" 
            :value="gap || 0" 
            @input="emitUpdate('gap', Number(($event.target as HTMLInputElement).value))"
            class="form-input"
            style="width: 100%; padding-right: 24px;"
            min="0"
          />
          <span style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 11px; color: #999;">px</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modeValue?: string; // canvas | flow | manual | auto
  direction?: string;
  justify?: string;
  align?: string;
  gap?: number;
  
  // Configuration for different property names
  modeKey?: string;
  justifyKey?: string;
  alignKey?: string;
  
  // Configuration for labels and values
  labels?: { manual: string; auto: string };
  modes?: { manual: string; auto: string };
  
  hideModeSwitch?: boolean;

  defaultJustify?: string;
  defaultAlign?: string;
}>(), {
  modeKey: 'layoutMode',
  justifyKey: 'layoutJustifyContent',
  alignKey: 'layoutAlignItems',
  labels: () => ({ manual: '画布 (Canvas)', auto: '流式 (Flow)' }),
  modes: () => ({ manual: 'canvas', auto: 'flow' }),
  defaultJustify: 'start',
  defaultAlign: 'stretch'
});

const emit = defineEmits(['update']);

function emitUpdate(key: string, value: any) {
  emit('update', { [key]: value });
}
</script>

<style scoped>
.form-group {
  margin-bottom: 8px;
}

.form-group label {
  display: block;
  font-size: 11px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  font-family: inherit;
  background: white;
  outline: none;
  box-sizing: border-box;
}

.form-input:hover { border-color: #d9d9d9; }
.form-input:focus { border-color: #000; }

.segmented-wrapper {
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
  background: transparent;
  padding: 4px;
  font-size: 11px;
  color: #666;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s;
}

.segmented-btn.active {
  background: white;
  color: #000;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  font-weight: 500;
}

.align-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.icon-btn {
  width: 28px;
  height: 28px;
  padding: 4px;
  border: 1px solid #e5e5e5;
  background: white;
  border-radius: 3px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  border-color: #d9d9d9;
  background: #fafafa;
}

.icon-btn.active {
  background: #eff6ff; 
  border-color: #2563eb;
  color: #2563eb;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
</style>