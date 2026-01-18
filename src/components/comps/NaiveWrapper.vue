<template>
    <div class="naive-wrapper"
      :data-comp-id="props.comp.id"
       ref="wrapperRef"
       :style="wrapperStyle"
  @mousedown.stop="onMouseDown"
       @click.stop>
    <component :is="componentMap[comp.type]" 
               v-bind="naiveProps"
               v-on="eventHandlers"
               @update:value="handleUpdateValue"
               @update:checked="handleUpdateValue"
               @update:show="handleUpdateValue">
      <!-- 默认文本内容 -->
      <template v-if="textContentComponents.includes(comp.type)">
        {{ effectiveProps.content }}
      </template>

      <!-- Radio Group -->
      <template v-if="comp.type === CompType.N_RADIO_GROUP">
        <n-radio v-for="opt in effectiveProps.options" 
                 :key="opt.value" 
                 :value="opt.value"
                 :label="opt.label" />
      </template>

      <!-- Breadcrumb -->
      <template v-if="comp.type === CompType.N_BREADCRUMB">
        <n-breadcrumb-item v-for="(item, index) in effectiveProps.items" 
                           :key="index" 
                           :href="item.href">
          {{ item.label }}
        </n-breadcrumb-item>
      </template>

      <!-- Timeline -->
      <template v-if="comp.type === CompType.N_TIMELINE">
        <n-timeline-item v-for="(item, index) in effectiveProps.items"
                         :key="index"
                         :type="item.type"
                         :title="item.title"
                         :content="item.content"
                         :time="item.time" />
      </template>

      <!-- Steps -->
      <template v-if="comp.type === CompType.N_STEPS">
        <n-step v-for="(item, index) in effectiveProps.items"
                :key="index"
                :title="item.title"
                :description="item.description" />
      </template>

      <!-- Tabs -->
      <template v-if="comp.type === CompType.N_TABS">
        <n-tab-pane v-for="item in effectiveProps.items"
                    :key="item.name"
                    :name="item.name"
                    :tab="item.tab">
          {{ item.content }}
        </n-tab-pane>
      </template>

      <!-- Carousel -->
      <template v-if="comp.type === CompType.N_CAROUSEL">
        <img v-for="(item, index) in effectiveProps.items"
             :key="index"
             class="carousel-img"
             :src="item.src" />
      </template>

      <!-- List -->
      <template v-if="comp.type === CompType.N_LIST">
        <n-list-item v-for="(item, index) in effectiveProps.items" :key="index">
          <n-thing :title="item.title" :description="item.description">
            {{ item.content }}
          </n-thing>
        </n-list-item>
      </template>
    </component>
  </div>
</template>

<style scoped>
.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { 
  NButton, NInput, NTag, NSelect, NSwitch,
  NDatePicker, NTimePicker, NTree, NMenu,
  NCheckbox, NRadioGroup, NColorPicker, NCascader,
  NRate, NSlider, NImage, NTimeline, NBreadcrumb, NSteps,
  NRadio, NTimelineItem, NBreadcrumbItem, NStep,
  NTabs, NTabPane, NCarousel,
  NList, NListItem, NThing,
  useMessage
} from 'naive-ui';
import type { Comp } from './base';
import { CompType } from '../../types/component';
import { useDraggable } from '../../utils/dragHelper';
import { usePageStore } from '../../stores/page';
import { useEventRunner } from '../../utils/eventRunner';
import { useFlowRunner } from '../../utils/flowRunner';
import { resolveBindingRef } from '../../utils/bindingRef'

const props = defineProps<{
  comp: Comp;
  scale: number;
  inFlowLayout?: boolean;
  bindingContext?: any;
  locked?: boolean;
}>();

const emit = defineEmits(['update']);
const pageStore = usePageStore();
const wrapperRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

// 事件运行器
const message = useMessage();
const { runEvents, setMessageApi } = useEventRunner();
const { executeFlow: runFlow, setMessageApi: setFlowMessageApi } = useFlowRunner();
setMessageApi(message);
setFlowMessageApi(message);

const componentMap: Record<string, any> = {
  [CompType.N_BUTTON]: NButton,
  [CompType.N_INPUT]: NInput,
  [CompType.N_TAG]: NTag,
  [CompType.N_SELECT]: NSelect,
  [CompType.N_SWITCH]: NSwitch,
  [CompType.N_DATE_PICKER]: NDatePicker,
  [CompType.N_TIME_PICKER]: NTimePicker,
  [CompType.N_TREE]: NTree,
  [CompType.N_MENU]: NMenu,
  [CompType.N_CHECKBOX]: NCheckbox,
  [CompType.N_RADIO_GROUP]: NRadioGroup,
  [CompType.N_COLOR_PICKER]: NColorPicker,
  [CompType.N_CASCADER]: NCascader,
  [CompType.N_RATE]: NRate,
  [CompType.N_SLIDER]: NSlider,
  [CompType.N_IMAGE]: NImage,
  [CompType.N_TIMELINE]: NTimeline,
  [CompType.N_BREADCRUMB]: NBreadcrumb,
  [CompType.N_STEPS]: NSteps,
  [CompType.N_TABS]: NTabs,
  [CompType.N_CAROUSEL]: NCarousel,
  [CompType.N_LIST]: NList
};

// 计算生效的属性（合并静态属性和绑定变量）
const effectiveProps = computed(() => {
  const rawProps = { ...props.comp.props };
  
  if (props.comp.bindings) {
    Object.entries(props.comp.bindings).forEach(([propName, bindingRef]) => {
      if (typeof bindingRef !== 'string' || !bindingRef) return;
      const realRef = bindingRef.startsWith('v-model:') ? bindingRef.substring(8) : bindingRef
      rawProps[propName] = resolveBindingRef(realRef, {
        getVarValue: (name) => pageStore.getVariableValue(name),
        getCompProp: (componentId, propKey) => pageStore.getComponentById(componentId)?.props?.[propKey],
        context: props.bindingContext
      })
    })
  }
  return rawProps;
});

// 提取 Naive UI 组件需要的 props (过滤掉布局属性)
const naiveProps = computed(() => {
  const { x, y, width, height, content, items, options, ...rest } = effectiveProps.value;
  
  // 对于需要 options 的组件，手动放回去
  if ([CompType.N_MENU, CompType.N_SELECT, CompType.N_CASCADER].includes(props.comp.type)) {
    (rest as any).options = options;
  }
  
  return rest;
});

// 计算事件处理器
const eventHandlers = computed(() => {
  const handlers: Record<string, Function> = {};
  if (props.comp.events) {
    Object.entries(props.comp.events).forEach(([eventName, eventDef]) => {
      // 兼容旧结构：如果 eventDef 是数组，说明是 CompEvent[]
      const eventConfig = Array.isArray(eventDef) ? eventDef.find(e => e.trigger === eventName) : null;
      
      if (eventConfig) {
        handlers[eventName] = (e: any) => {
           if (eventConfig.flowId) {
             runFlow(eventConfig.flowId, { event: e });
           } else if (eventConfig.actions && eventConfig.actions.length > 0) {
             runEvents(eventConfig.actions);
           }
        };
      }
    });
  }
  return handlers;
});

// 需要渲染文本内容的组件
const textContentComponents = [
  CompType.N_BUTTON,
  CompType.N_TAG
];

// 包装器样式 (处理定位和尺寸)
const wrapperStyle = computed(() => {
  const widthSizing = (props.comp.props as any).widthSizing as ('fixed' | 'fill' | 'content' | undefined);
  const heightSizing = (props.comp.props as any).heightSizing as ('fixed' | 'fill' | 'content' | undefined);
  const x = props.comp.props.x || 0
  const y = props.comp.props.y || 0
  const style: any = {
    position: props.inFlowLayout ? 'relative' : 'absolute',
    left: props.inFlowLayout ? 'auto' : `${x}px`,
    top: props.inFlowLayout ? 'auto' : `${y}px`,
    width: widthSizing === 'fill'
      ? '100%'
      : widthSizing === 'content'
        ? 'fit-content'
        : (props.comp.props.width ? `${props.comp.props.width}px` : 'auto'),
    height: heightSizing === 'fill'
      ? '100%'
      : heightSizing === 'content'
        ? 'fit-content'
        : (props.comp.props.height ? `${props.comp.props.height}px` : 'auto'),
    zIndex: props.comp.props.zIndex || 1,
    // 选中时的样式
    // outline: pageStore.isComponentSelected(props.comp.id) ? '2px solid #1890ff' : 'none',
    cursor: props.locked ? 'default' : 'move',
    // 确保 wrapper 能够适应内容大小
    display: 'inline-block'
  };

  const p: any = props.comp.props || {}
  const hasPadding = [p.paddingTop, p.paddingRight, p.paddingBottom, p.paddingLeft].some(v => typeof v === 'number')
  if (hasPadding) {
    style.padding = `${p.paddingTop ?? 0}px ${p.paddingRight ?? 0}px ${p.paddingBottom ?? 0}px ${p.paddingLeft ?? 0}px`
  }

  const hasMargin = [p.marginTop, p.marginRight, p.marginBottom, p.marginLeft].some(v => typeof v === 'number')
  if (hasMargin) {
    style.margin = `${p.marginTop ?? 0}px ${p.marginRight ?? 0}px ${p.marginBottom ?? 0}px ${p.marginLeft ?? 0}px`
  }

  return style as any;
});

// 更新组件尺寸到 store
function updateSize(width: number, height: number) {
  // 只有当尺寸与 store 中的 _measuredWidth/_measuredHeight 不一致时才更新
  // 且只有在没有显式设置宽高的情况下才更新测量值（或者始终更新测量值供参考，但 control store 优先使用显式值）
  if (
    Math.abs(width - (props.comp.props._measuredWidth || 0)) > 1 ||
    Math.abs(height - (props.comp.props._measuredHeight || 0)) > 1
  ) {
    pageStore.updateComponentInCurrentPage({
      ...props.comp,
      props: {
        ...props.comp.props,
        _measuredWidth: width,
        _measuredHeight: height
      }
    });
  }
}

// 监听尺寸变化并更新 store
onMounted(() => {
  if (wrapperRef.value) {
    // 立即测量一次，确保初始渲染正确
    const { offsetWidth, offsetHeight } = wrapperRef.value;
    if (offsetWidth && offsetHeight) {
      updateSize(offsetWidth, offsetHeight);
    }

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // 使用 offsetWidth/offsetHeight 以包含边框（虽然这里没有边框，但更符合直觉）
        // entry.contentRect 不包含 padding/border
        if (wrapperRef.value) {
          updateSize(wrapperRef.value.offsetWidth, wrapperRef.value.offsetHeight);
        }
      }
    });
    resizeObserver.observe(wrapperRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

// 更新组件值
function handleUpdateValue(value: any) {
  if (props.locked) return;
  // 根据组件类型判断更新哪个属性
  let key = 'value';
  if (props.comp.type === CompType.N_CHECKBOX) {
    key = 'checked';
  } else if (props.comp.type === CompType.N_SWITCH) {
    key = 'value'; // NSwitch uses value or checked? Naive UI NSwitch uses v-model:value
  }
  
  // 对于 NCheckbox，事件值就是 boolean
  // 对于 NInput, NSelect 等，事件值就是 value
  
  // 特殊处理：如果是 NCheckbox，naive-ui 文档说是 v-model:checked
  if (props.comp.type === CompType.N_CHECKBOX) {
    pageStore.updateComponentInCurrentPage({
      ...props.comp,
      props: {
        ...props.comp.props,
        checked: value
      }
    });
  } else {
    pageStore.updateComponentInCurrentPage({
      ...props.comp,
      props: {
        ...props.comp.props,
        value: value
      }
    });
  }
}

// 拖拽逻辑
const { handleMouseDown } = useDraggable({
  scale: computed(() => props.scale),
  componentId: props.comp.id,
  componentSize: computed(() => ({
    width: props.comp.props.width || 0,
    height: props.comp.props.height || 0
  })),
  onDragStart: () => {
    const event = window.event as MouseEvent;
    const multiSelect = event?.ctrlKey || event?.metaKey;
    if (!pageStore.isComponentSelected(props.comp.id)) {
      pageStore.selectComponent(props.comp.id, multiSelect);
    }
  },
  onUpdate: (updates) => emit('update', updates)
});

function onMouseDown(e: MouseEvent) {
  if (props.locked) {
    const multiSelect = e.ctrlKey || e.metaKey;
    if (!pageStore.isComponentSelected(props.comp.id)) {
      pageStore.selectComponent(props.comp.id, multiSelect);
    } else if (multiSelect) {
      pageStore.selectComponent(props.comp.id, true);
    }
    return;
  }

  if (props.inFlowLayout) {
    const multiSelect = e.ctrlKey || e.metaKey;
    if (!pageStore.isComponentSelected(props.comp.id)) {
      pageStore.selectComponent(props.comp.id, multiSelect);
    } else if (multiSelect) {
      pageStore.selectComponent(props.comp.id, true);
    }
    return;
  }
  handleMouseDown(e, props.comp.props.x || 0, props.comp.props.y || 0);
}
</script>

<style scoped>
.naive-wrapper {
  /* 确保能捕获鼠标事件 */
  user-select: none;
  box-sizing: border-box;
}

/* 确保内部组件填满容器，这对于手动调整大小的组件（如Input）很重要 */
.naive-wrapper > :deep(*) {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

/* 修复 NRate 在 width: 100% 下可能不显示的问题 */
.naive-wrapper :deep(.n-rate) {
  width: auto;
}
</style>
