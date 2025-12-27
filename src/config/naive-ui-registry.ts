import { CompType } from '../types/component';

export interface PropSchema {
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'color';
  options?: { label: string; value: any }[];
  default?: any;
}

export interface NaiveCompConfig {
  type: CompType;
  name: string;
  icon: string; // FontAwesome icon name
  defaultProps: Record<string, any>;
  propsSchema: Record<string, PropSchema>;
  events?: { label: string; value: string }[]; // Supported events
}

export const naiveComponentRegistry: NaiveCompConfig[] = [
  {
    type: CompType.N_BUTTON,
    name: 'N按钮',
    icon: 'square',
    defaultProps: {
      content: '按钮',
      type: 'primary',
      size: 'medium',
      dashed: false,
      round: false,
      disabled: false,
      secondary: false,
      tertiary: false
    },
    events: [
      { label: '点击', value: 'click' }
    ],
    propsSchema: {
      content: { label: '内容', type: 'text', default: '按钮' },
      type: {
        label: '类型',
        type: 'select',
        options: [
          { label: '默认', value: 'default' },
          { label: '主要', value: 'primary' },
          { label: '信息', value: 'info' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '错误', value: 'error' }
        ]
      },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '极小', value: 'tiny' },
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      },
      dashed: { label: '虚线', type: 'boolean' },
      round: { label: '圆角', type: 'boolean' },
      disabled: { label: '禁用', type: 'boolean' },
      secondary: { label: '次要按钮', type: 'boolean' },
      tertiary: { label: '三级按钮', type: 'boolean' }
    }
  },
  {
    type: CompType.N_INPUT,
    name: 'N输入框',
    icon: 'font',
    defaultProps: {
      placeholder: '请输入...',
      type: 'text',
      size: 'medium',
      disabled: false,
      clearable: true,
      round: false
    },
    events: [
      { label: '输入', value: 'input' },
      { label: '聚焦', value: 'focus' },
      { label: '失焦', value: 'blur' },
      { label: '值改变', value: 'change' }
    ],
    propsSchema: {
      placeholder: { label: '占位符', type: 'text' },
      type: {
        label: '类型',
        type: 'select',
        options: [
          { label: '文本', value: 'text' },
          { label: '密码', value: 'password' },
          { label: '文本域', value: 'textarea' }
        ]
      },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '极小', value: 'tiny' },
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      },
      disabled: { label: '禁用', type: 'boolean' },
      clearable: { label: '可清除', type: 'boolean' },
      round: { label: '圆角', type: 'boolean' }
    }
  },
  {
    type: CompType.N_TAG,
    name: 'N标签',
    icon: 'tag',
    defaultProps: {
      content: '标签',
      type: 'default',
      size: 'medium',
      round: false,
      bordered: true
    },
    propsSchema: {
      content: { label: '内容', type: 'text' },
      type: {
        label: '类型',
        type: 'select',
        options: [
          { label: '默认', value: 'default' },
          { label: '主要', value: 'primary' },
          { label: '信息', value: 'info' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '错误', value: 'error' }
        ]
      },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      },
      round: { label: '圆角', type: 'boolean' },
      bordered: { label: '边框', type: 'boolean' }
    }
  },
  {
    type: CompType.N_SWITCH,
    name: 'N开关',
    icon: 'toggle-on',
    defaultProps: {
      value: false,
      size: 'medium',
      disabled: false,
      round: true
    },
    propsSchema: {
      value: { label: '默认值', type: 'boolean' },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      },
      disabled: { label: '禁用', type: 'boolean' },
      round: { label: '圆角', type: 'boolean' }
    }
  },
  {
    type: CompType.N_SELECT,
    name: 'N下拉选择',
    icon: 'caret-square-down',
    defaultProps: {
      placeholder: '请选择',
      size: 'medium',
      disabled: false,
      clearable: true,
      options: [
        { label: '选项一', value: 'opt1' },
        { label: '选项二', value: 'opt2' },
        { label: '选项三', value: 'opt3' }
      ]
    },
    propsSchema: {
      placeholder: { label: '占位符', type: 'text' },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      },
      disabled: { label: '禁用', type: 'boolean' },
      clearable: { label: '可清除', type: 'boolean' }
    }
  },
  {
    type: CompType.N_DATE_PICKER,
    name: 'N日期选择',
    icon: 'calendar',
    defaultProps: {
      type: 'date',
      size: 'medium',
      disabled: false,
      clearable: true,
      placeholder: '选择日期'
    },
    propsSchema: {
      type: {
        label: '类型',
        type: 'select',
        options: [
          { label: '日期', value: 'date' },
          { label: '日期时间', value: 'datetime' },
          { label: '日期范围', value: 'daterange' },
          { label: '月份', value: 'month' },
          { label: '年份', value: 'year' }
        ]
      },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      },
      placeholder: { label: '占位符', type: 'text' },
      disabled: { label: '禁用', type: 'boolean' },
      clearable: { label: '可清除', type: 'boolean' }
    }
  },
  {
    type: CompType.N_TIME_PICKER,
    name: 'N时间选择',
    icon: 'clock',
    defaultProps: {
      size: 'medium',
      disabled: false,
      clearable: true,
      placeholder: '选择时间'
    },
    propsSchema: {
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      },
      placeholder: { label: '占位符', type: 'text' },
      disabled: { label: '禁用', type: 'boolean' },
      clearable: { label: '可清除', type: 'boolean' }
    }
  },
  {
    type: CompType.N_TREE,
    name: 'N树形控件',
    icon: 'tree',
    defaultProps: {
      blockLine: false,
      cascade: false,
      checkable: false,
      selectable: true,
      data: [
        {
          label: 'Parent Node',
          key: '1',
          children: [
            { label: 'Child 1', key: '1-1' },
            { label: 'Child 2', key: '1-2' }
          ]
        }
      ]
    },
    propsSchema: {
      blockLine: { label: '整行节点', type: 'boolean' },
      cascade: { label: '级联选中', type: 'boolean' },
      checkable: { label: '可勾选', type: 'boolean' },
      selectable: { label: '可选择', type: 'boolean' }
    }
  },
  {
    type: CompType.N_MENU,
    name: 'N菜单',
    icon: 'list',
    defaultProps: {
      mode: 'vertical',
      collapsed: false,
      accordion: false,
      options: [
        {
          label: '且听风吟',
          key: 'hear-the-wind-sing',
        },
        {
          label: '1973年的弹珠玩具',
          key: 'pinball-1973',
          children: [
            {
              label: '鼠',
              key: 'rat'
            }
          ]
        }
      ]
    },
    propsSchema: {
      mode: {
        label: '模式',
        type: 'select',
        options: [
          { label: '垂直', value: 'vertical' },
          { label: '水平', value: 'horizontal' }
        ]
      },
      collapsed: { label: '折叠', type: 'boolean' },
      accordion: { label: '手风琴', type: 'boolean' }
    }
  },
  {
    type: CompType.N_CHECKBOX,
    name: 'N复选框',
    icon: 'check-square',
    defaultProps: {
      label: '复选框',
      checked: false,
      disabled: false,
      size: 'medium'
    },
    propsSchema: {
      label: { label: '标签', type: 'text' },
      checked: { label: '选中', type: 'boolean' },
      disabled: { label: '禁用', type: 'boolean' },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      }
    }
  },
  {
    type: CompType.N_RADIO_GROUP,
    name: 'N单选组',
    icon: 'dot-circle',
    defaultProps: {
      value: 'opt1',
      name: 'radio-group',
      size: 'medium',
      disabled: false,
      options: [
        { label: '选项一', value: 'opt1' },
        { label: '选项二', value: 'opt2' }
      ]
    },
    propsSchema: {
      value: { label: '默认值', type: 'text' },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      },
      disabled: { label: '禁用', type: 'boolean' }
    }
  },
  {
    type: CompType.N_COLOR_PICKER,
    name: 'N颜色选择',
    icon: 'palette',
    defaultProps: {
      value: '#1890ff',
      showAlpha: true,
      disabled: false,
      size: 'medium'
    },
    propsSchema: {
      value: { label: '颜色', type: 'color' },
      showAlpha: { label: '透明度', type: 'boolean' },
      disabled: { label: '禁用', type: 'boolean' },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      }
    }
  },
  {
    type: CompType.N_CASCADER,
    name: 'N级联选择',
    icon: 'stream',
    defaultProps: {
      placeholder: '请选择',
      size: 'medium',
      disabled: false,
      clearable: true,
      options: [
        {
          label: '北京',
          value: 'beijing',
          children: [
            { label: '海淀', value: 'haidian' },
            { label: '朝阳', value: 'chaoyang' }
          ]
        }
      ]
    },
    propsSchema: {
      placeholder: { label: '占位符', type: 'text' },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      },
      disabled: { label: '禁用', type: 'boolean' },
      clearable: { label: '可清除', type: 'boolean' }
    }
  },
  {
    type: CompType.N_RATE,
    name: 'N评分',
    icon: 'star',
    defaultProps: {
      count: 5,
      value: 3,
      allowHalf: false,
      readonly: false,
      size: 'medium'
    },
    propsSchema: {
      count: { label: '总数', type: 'number' },
      value: { label: '当前值', type: 'number' },
      allowHalf: { label: '允许半星', type: 'boolean' },
      readonly: { label: '只读', type: 'boolean' },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      }
    }
  },
  {
    type: CompType.N_SLIDER,
    name: 'N滑动选择',
    icon: 'sliders-h',
    defaultProps: {
      value: 0,
      min: 0,
      max: 100,
      step: 1,
      disabled: false,
      vertical: false
    },
    propsSchema: {
      value: { label: '当前值', type: 'number' },
      min: { label: '最小值', type: 'number' },
      max: { label: '最大值', type: 'number' },
      step: { label: '步长', type: 'number' },
      disabled: { label: '禁用', type: 'boolean' },
      vertical: { label: '垂直', type: 'boolean' }
    }
  },
  {
    type: CompType.N_IMAGE,
    name: 'N图像',
    icon: 'image',
    defaultProps: {
      src: 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg',
      width: 200,
      height: 200,
      objectFit: 'cover',
      previewDisabled: false
    },
    propsSchema: {
      src: { label: '图片地址', type: 'text' },
      width: { label: '宽度', type: 'number' },
      height: { label: '高度', type: 'number' },
      objectFit: {
        label: '适应模式',
        type: 'select',
        options: [
          { label: '包含', value: 'contain' },
          { label: '覆盖', value: 'cover' },
          { label: '填充', value: 'fill' },
          { label: '无', value: 'none' },
          { label: '缩小', value: 'scale-down' }
        ]
      },
      previewDisabled: { label: '禁用预览', type: 'boolean' }
    }
  },
  {
    type: CompType.N_TIMELINE,
    name: 'N时间线',
    icon: 'stream',
    defaultProps: {
      horizontal: false,
      itemPlacement: 'left',
      size: 'medium',
      items: [
        { type: 'success', title: '成功', content: '成功内容', time: '2018-04-03 20:46' },
        { type: 'error', title: '错误', content: '错误内容', time: '2018-04-03 20:46' }
      ]
    },
    propsSchema: {
      horizontal: { label: '水平', type: 'boolean' },
      itemPlacement: {
        label: '位置',
        type: 'select',
        options: [
          { label: '左侧', value: 'left' },
          { label: '右侧', value: 'right' }
        ]
      },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' }
        ]
      }
    }
  },
  {
    type: CompType.N_BREADCRUMB,
    name: 'N面包屑',
    icon: 'angle-right',
    defaultProps: {
      separator: '/',
      items: [
        { label: '首页', href: '/' },
        { label: '列表', href: '/list' },
        { label: '详情', href: '/detail' }
      ]
    },
    propsSchema: {
      separator: { label: '分隔符', type: 'text' }
    }
  },
  {
    type: CompType.N_STEPS,
    name: 'N步骤',
    icon: 'shoe-prints',
    defaultProps: {
      current: 1,
      status: 'process',
      size: 'medium',
      vertical: false,
      items: [
        { title: '步骤一', description: '这里是步骤一的描述' },
        { title: '步骤二', description: '这里是步骤二的描述' },
        { title: '步骤三', description: '这里是步骤三的描述' }
      ]
    },
    propsSchema: {
      current: { label: '当前步骤', type: 'number' },
      status: {
        label: '状态',
        type: 'select',
        options: [
          { label: '进行中', value: 'process' },
          { label: '完成', value: 'finish' },
          { label: '错误', value: 'error' },
          { label: '等待', value: 'wait' }
        ]
      },
      size: {
        label: '尺寸',
        type: 'select',
        options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' }
        ]
      },
      vertical: { label: '垂直', type: 'boolean' }
    }
  },
  {
    type: CompType.N_TABS,
    name: 'N标签页',
    icon: 'folder',
    defaultProps: {
      type: 'line',
      placement: 'top',
      animated: true,
      items: [
        { name: 'tab1', tab: '标签一', content: '内容一' },
        { name: 'tab2', tab: '标签二', content: '内容二' },
        { name: 'tab3', tab: '标签三', content: '内容三' }
      ]
    },
    propsSchema: {
      type: {
        label: '类型',
        type: 'select',
        options: [
          { label: '线型', value: 'line' },
          { label: '卡片', value: 'card' },
          { label: '分段', value: 'segment' },
          { label: '按钮', value: 'bar' }
        ]
      },
      placement: {
        label: '位置',
        type: 'select',
        options: [
          { label: '上', value: 'top' },
          { label: '下', value: 'bottom' },
          { label: '左', value: 'left' },
          { label: '右', value: 'right' }
        ]
      },
      animated: { label: '动画', type: 'boolean' }
    }
  },
  {
    type: CompType.N_CAROUSEL,
    name: 'N轮播图',
    icon: 'images',
    defaultProps: {
      autoplay: false,
      interval: 3000,
      effect: 'slide',
      showArrow: false,
      dotPlacement: 'bottom',
      items: [
        { src: 'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel1.jpeg' },
        { src: 'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel2.jpeg' },
        { src: 'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel3.jpeg' },
        { src: 'https://naive-ui.oss-cn-beijing.aliyuncs.com/carousel-img/carousel4.jpeg' }
      ]
    },
    propsSchema: {
      autoplay: { label: '自动播放', type: 'boolean' },
      interval: { label: '间隔(ms)', type: 'number' },
      effect: {
        label: '效果',
        type: 'select',
        options: [
          { label: '滑动', value: 'slide' },
          { label: '渐隐', value: 'fade' },
          { label: '卡片', value: 'card' }
        ]
      },
      showArrow: { label: '显示箭头', type: 'boolean' },
      dotPlacement: {
        label: '指示点位置',
        type: 'select',
        options: [
          { label: '上', value: 'top' },
          { label: '下', value: 'bottom' },
          { label: '左', value: 'left' },
          { label: '右', value: 'right' }
        ]
      }
    }
  },
  {
    type: CompType.N_LIST,
    name: 'N列表',
    icon: 'list',
    defaultProps: {
      bordered: true,
      hoverable: false,
      clickable: false,
      items: [
        { title: '待办事项 1', description: '2025-12-27', content: '完成列表组件集成' },
        { title: '待办事项 2', description: '2025-12-28', content: '设计变量功能' }
      ]
    },
    propsSchema: {
      bordered: { label: '边框', type: 'boolean' },
      hoverable: { label: '悬停效果', type: 'boolean' },
      clickable: { label: '可点击', type: 'boolean' },
      items: { label: '列表项', type: 'json' }
    }
  }
];

export function getNaiveConfig(type: CompType): NaiveCompConfig | undefined {
  return naiveComponentRegistry.find(c => c.type === type);
}
