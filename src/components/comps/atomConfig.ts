import { CompType } from '@/types/component'
import { type EventSpec, CommonEvents } from '@/types/event'

// 基础属性默认值
export const defaultBaseProps = {

  x: 0,
  y: 0,
  width: 200,
  height: 100,
  widthSizing: 'fixed' as const,
  heightSizing: 'fixed' as const,
  borderWidth: 0,
  borderStyle: 'none',
  borderColor: '#000000',
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0,
  shadowSpread: 0,
  shadowColor: '#000000',
  zIndex: 1,
  renderVisible: true,
  loopEnabled: false
}

export interface AtomConfig {
  defaultProps: Record<string, any>
  size: { width: number; height: number }
  icon: string
  description: string
  isContainer?: boolean
  events?: EventSpec[]
}

export const atomConfigs: Partial<Record<CompType, AtomConfig>> = {
  [CompType.CONTAINER]: {
    defaultProps: {

      width: 200,
      height: 200,
      widthSizing: 'fixed',
      heightSizing: 'fixed',
      layoutMode: 'manual',
      direction: 'row',
      primaryAlign: 'start',
      crossAlign: 'stretch',
      gap: 8,
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#e0e0e0',
      backgroundColor: '#ffffff',
      backgroundImage: '',
      gradientType: 'none',
      gradientColor1: '#ffffff',
      gradientColor2: '#000000',
      gradientDirection: '135deg',
    },
    size: { width: 200, height: 200 },
    icon: '□',
    description: '容器组件，可以包含其他组件',
    isContainer: true,
    events: [
      CommonEvents.CLICK,
      CommonEvents.DBLCLICK,
      CommonEvents.MOUSEENTER,
      CommonEvents.MOUSELEAVE,
      CommonEvents.MOUNTED,
      CommonEvents.UNMOUNTED
    ]
  },
  
  [CompType.BUTTON]: {
    defaultProps: {

      width: 100,
      height: 40,
      content: '按钮',
      color: '#ffffff',
      backgroundColor: '#1890ff',
      borderRadius: 4,
      fontSize: 14,
      fontWeight: 'normal',
    },
    size: { width: 100, height: 40 },
    icon: '⬜',
    description: '可交互的按钮组件',
    events: [
      CommonEvents.CLICK,
      CommonEvents.DBLCLICK
    ]
  },

  [CompType.TEXT]: {

    defaultProps: {
      content: '一段文字',
      color: '#333',
      fontSize: 14,
      fontWeight: 'normal',
      fontFamily: 'Arial',
      textDecoration: 'none',
      fontStyle: 'normal',
      width: 60,
      height: 20,
      // 新增文字组件默认属性
      widthMode: 'fixed',
      autoHeight: false, 
      minWidth: 20,
      maxWidth: 500
    },
    size: { width: 100, height: 40 },
    icon: 'T',
    description: '用于显示文本内容的组件',
    events: [
      CommonEvents.CLICK,
      CommonEvents.DBLCLICK
    ]
  }
}
