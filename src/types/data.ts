// 数据类型枚举
export enum DataType {
  VARIABLE = 'variable',
  TABLE = 'table'
}

// 字段类型枚举
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  JSON = 'json'
}

// 数据字段接口
export interface DataField {
  id: string
  name: string
  type: FieldType
  required: boolean
  defaultValue?: any
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

// 更新工厂函数
export function createDataField(name: string, type: FieldType, required: boolean = false, defaultValue?: any): DataField {
  const now = new Date()
  return {
    id: `field_${Date.now()}`,
    name,
    type,
    required,
    defaultValue: defaultValue !== undefined ? defaultValue : getDefaultValueByType(type),
    createdAt: now,
    updatedAt: now
  }
}

// 运行时变量接口
export interface Variable {
  id: string
  name: string
  type: FieldType
  value: any
  description?: string
  createdAt: Date
  updatedAt: Date
}

// 数据表接口
export interface DataTable {
  id: string
  name: string
  description?: string
  fields: DataField[]
  records: Record<string, any>[]
  createdAt: Date
  updatedAt: Date
}

// 数据存储状态接口
export interface DataState {
  variables: Variable[]
  tables: DataTable[]
  currentTableId: string | null
}

// 工厂函数
export function createVariable(name: string, type: FieldType, value: any): Variable {
  return {
    id: `var_${Date.now()}`,
    name,
    type,
    value,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export function createDataTable({ name, description }: { name: string, description?: string }): DataTable {
  return {
    id: `table_${Date.now()}_${name}`,
    name,
    description,
    fields: [],
    records: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function getDefaultValueByType(type: FieldType): any {
  switch (type) {
    case FieldType.STRING: return ''
    case FieldType.NUMBER: return 0
    case FieldType.BOOLEAN: return false
    case FieldType.DATE: return new Date().toISOString()
    case FieldType.JSON: return {}
    default: return null
  }
}