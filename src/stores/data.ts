import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Variable, DataTable, DataField } from '../types/data'
import { createVariable, createDataTable, createDataField, FieldType } from '../types/data'

export const useDataStore = defineStore('data', () => {
  // 状态
  const variables = ref<Variable[]>([
    // 添加一些初始演示变量
    createVariable('用户名', FieldType.STRING, 'admin'),
    createVariable('登录次数', FieldType.NUMBER, 0),
    createVariable('是否管理员', FieldType.BOOLEAN, true),
    createVariable('最后登录时间', FieldType.DATE, new Date().toISOString())
  ])
  
  const tables = ref<DataTable[]>([])
  const currentTableId = ref<string | null>(null)

  // 初始化演示数据表
  const initDemoData = () => {
    if (tables.value.length === 0) {
      // 创建用户表
      const userTable = createDataTable('用户表', '存储用户基本信息')
      userTable.fields = [
        { id: 'field_1', name: '用户名', type: FieldType.STRING, required: true, defaultValue: '' },
        { id: 'field_2', name: '邮箱', type: FieldType.STRING, required: true, defaultValue: '' },
        { id: 'field_3', name: '年龄', type: FieldType.NUMBER, required: false, defaultValue: 0 },
        { id: 'field_4', name: '是否激活', type: FieldType.BOOLEAN, required: false, defaultValue: true },
        { id: 'field_5', name: '注册时间', type: FieldType.DATE, required: false, defaultValue: new Date().toISOString() }
      ]
      userTable.records = [
        { id: 'record_1', 用户名: '张三', 邮箱: 'zhangsan@example.com', 年龄: 25, 是否激活: true, 注册时间: '2024-01-15' },
        { id: 'record_2', 用户名: '李四', 邮箱: 'lisi@example.com', 年龄: 30, 是否激活: true, 注册时间: '2024-01-20' },
        { id: 'record_3', 用户名: '王五', 邮箱: 'wangwu@example.com', 年龄: 28, 是否激活: false, 注册时间: '2024-01-25' }
      ]
      tables.value.push(userTable)
      
      // 创建产品表
      const productTable = createDataTable('产品表', '存储产品信息')
      productTable.fields = [
        { id: 'field_6', name: '产品名称', type: FieldType.STRING, required: true, defaultValue: '' },
        { id: 'field_7', name: '价格', type: FieldType.NUMBER, required: true, defaultValue: 0 },
        { id: 'field_8', name: '库存', type: FieldType.NUMBER, required: false, defaultValue: 0 },
        { id: 'field_9', name: '是否上架', type: FieldType.BOOLEAN, required: false, defaultValue: false }
      ]
      productTable.records = [
        { id: 'record_4', 产品名称: 'iPhone 15', 价格: 5999, 库存: 100, 是否上架: true },
        { id: 'record_5', 产品名称: 'MacBook Pro', 价格: 12999, 库存: 50, 是否上架: true },
        { id: 'record_6', 产品名称: 'iPad Air', 价格: 4399, 库存: 80, 是否上架: false }
      ]
      tables.value.push(productTable)
      
      // 默认选中第一个表
      if (tables.value.length > 0) {
        currentTableId.value = tables.value[0].id
      }
    }
  }

  // 计算属性
  const currentTable = computed(() => {
    if (!currentTableId.value) return null
    return tables.value.find(table => table.id === currentTableId.value) || null
  })

  // 变量管理
  function addVariable(name: string, type: FieldType, value: any): Variable {
    const variable = createVariable(name, type, value)
    variables.value.push(variable)
    return variable
  }

  function updateVariable(id: string, updates: Partial<Variable>): boolean {
    const variable = variables.value.find(v => v.id === id)
    if (!variable) return false
    
    Object.assign(variable, updates, { updatedAt: new Date() })
    return true
  }

  function deleteVariable(id: string): boolean {
    const index = variables.value.findIndex(v => v.id === id)
    if (index === -1) return false
    
    variables.value.splice(index, 1)
    return true
  }

  // 数据表管理
  function addTable(name: string, description?: string): DataTable {
    const table = createDataTable(name, description)
    tables.value.push(table)
    return table
  }

  function updateTable(id: string, updates: Partial<Pick<DataTable, 'name' | 'description'>>): boolean {
    const table = tables.value.find(t => t.id === id)
    if (!table) return false
    
    Object.assign(table, updates, { updatedAt: new Date() })
    return true
  }

  function deleteTable(id: string): boolean {
    const index = tables.value.findIndex(t => t.id === id)
    if (index === -1) return false
    
    tables.value.splice(index, 1)
    if (currentTableId.value === id) {
      currentTableId.value = null
    }
    return true
  }

  function selectTable(id: string): boolean {
    const table = tables.value.find(t => t.id === id)
    if (!table) return false
    
    currentTableId.value = id
    return true
  }

  // 字段管理
  function addField(tableId: string, name: string, type: FieldType): DataField | null {
    const table = tables.value.find(t => t.id === tableId)
    if (!table) return null
    
    const field = createDataField(name, type)
    table.fields.push(field)
    table.updatedAt = new Date()
    return field
  }

  function updateField(tableId: string, fieldId: string, updates: Partial<DataField>): boolean {
    const table = tables.value.find(t => t.id === tableId)
    if (!table) return false
    
    const field = table.fields.find(f => f.id === fieldId)
    if (!field) return false
    
    Object.assign(field, updates)
    table.updatedAt = new Date()
    return true
  }

  function deleteField(tableId: string, fieldId: string): boolean {
    const table = tables.value.find(t => t.id === tableId)
    if (!table) return false
    
    const index = table.fields.findIndex(f => f.id === fieldId)
    if (index === -1) return false
    
    const fieldName = table.fields[index].name
    table.fields.splice(index, 1)
    
    // 同时删除所有记录中的该字段
    table.records.forEach(record => {
      delete record[fieldName]
    })
    
    table.updatedAt = new Date()
    return true
  }

  // 记录管理
  function addRecord(tableId: string, record: Record<string, any>): boolean {
    const table = tables.value.find(t => t.id === tableId)
    if (!table) return false
    
    table.records.push({ ...record, id: `record_${Date.now()}` })
    table.updatedAt = new Date()
    return true
  }

  function updateRecord(tableId: string, recordIndex: number, updates: Record<string, any>): boolean {
    const table = tables.value.find(t => t.id === tableId)
    if (!table || recordIndex < 0 || recordIndex >= table.records.length) return false
    
    Object.assign(table.records[recordIndex], updates)
    table.updatedAt = new Date()
    return true
  }

  function deleteRecord(tableId: string, recordIndex: number): boolean {
    const table = tables.value.find(t => t.id === tableId)
    if (!table || recordIndex < 0 || recordIndex >= table.records.length) return false
    
    table.records.splice(recordIndex, 1)
    table.updatedAt = new Date()
    return true
  }

  // 在 return 中添加初始化函数
  return {
    // 状态
    variables,
    tables,
    currentTableId,
    
    // 计算属性
    currentTable,
    
    // 初始化函数
    initDemoData,
    
    // 变量管理
    addVariable,
    updateVariable,
    deleteVariable,
    
    // 数据表管理
    addTable,
    updateTable,
    deleteTable,
    selectTable,
    
    // 字段管理
    addField,
    updateField,
    deleteField,
    
    // 记录管理
    addRecord,
    updateRecord,
    deleteRecord
  }
})