<template>
  <n-modal v-model:show="visible" preset="dialog" title="新增数据表">
    <n-form ref="formRef" :model="formData" :rules="formRules" label-placement="left" label-width="80">
      <n-form-item label="表名称" path="name">
        <n-input 
          v-model:value="formData.name" 
          placeholder="请输入数据表名称" 
          maxlength="50"
          show-count />
      </n-form-item>
      <n-form-item label="描述" path="description">
        <n-input 
          v-model:value="formData.description" 
          type="textarea" 
          placeholder="请输入数据表描述（可选）"
          maxlength="200"
          show-count
          :autosize="{ minRows: 3, maxRows: 5 }" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="handleCancel">取消</n-button>
      <n-button type="primary" @click="handleConfirm">确定</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton, useMessage, type FormInst } from 'naive-ui'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'confirm': [data: { name: string; description: string }]
}>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const visible = ref(false)

const formData = reactive({
  name: '',
  description: ''
})

const formRules = {
  name: [
    {
      required: true,
      message: '请输入数据表名称',
      trigger: ['input', 'blur']
    },
    {
      min: 1,
      max: 50,
      message: '数据表名称长度应在 1-50 个字符之间',
      trigger: ['input', 'blur']
    },
    {
      pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
      message: '数据表名称只能包含字母、数字、下划线和中文',
      trigger: ['input', 'blur']
    }
  ]
}

// 监听 show 属性变化
watch(() => props.show, (newValue) => {
  visible.value = newValue
  if (newValue) {
    // 重置表单
    formData.name = ''
    formData.description = ''
  }
})

// 监听 visible 变化，同步到父组件
watch(visible, (newValue) => {
  emit('update:show', newValue)
})

// 取消操作
function handleCancel() {
  visible.value = false
}

// 确认操作
function handleConfirm() {
  formRef.value?.validate((errors: any) => {
    if (!errors) {
      emit('confirm', {
        name: formData.name.trim(),
        description: formData.description.trim()
      })
      visible.value = false
      message.success('数据表创建成功')
    }
  })
}
</script>

<style scoped>
/* 表单样式优化 */
:deep(.n-form-item) {
  margin-bottom: 20px;
}

:deep(.n-form-item-label) {
  padding-right: 12px;
}

:deep(.n-input) {
  width: 100%;
}
</style>