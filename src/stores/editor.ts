// 新建编辑器状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export enum EditorMode {
    DESIGN = 'design',    // 设计模式：可拖拽、选中、编辑
    PREVIEW = 'preview'   // 预览模式：组件正常交互
}

export const useEditorStore = defineStore('editor', () => {
    const mode = ref<EditorMode>(EditorMode.DESIGN)

    const isDesignMode = computed(() => mode.value === EditorMode.DESIGN)
    const isPreviewMode = computed(() => mode.value === EditorMode.PREVIEW)

    function switchToDesign() {
        mode.value = EditorMode.DESIGN
    }

    function switchToPreview() {
        mode.value = EditorMode.PREVIEW
    }

    function toggleMode() {
        mode.value = mode.value === EditorMode.DESIGN
            ? EditorMode.PREVIEW
            : EditorMode.DESIGN
    }

    return {
        mode,
        isDesignMode,
        isPreviewMode,
        switchToDesign,
        switchToPreview,
        toggleMode
    }
})