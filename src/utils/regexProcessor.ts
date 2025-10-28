/**
 * 正则处理器 - 用于处理AI输出中的格式化标签
 * 类似 SillyTavern 的正则功能
 */

export interface RegexRule {
  id: string
  name: string
  enabled: boolean
  // 查找模式
  find: string
  // 替换为（可以为空表示删除）
  replace: string
  // 标志（g=全局, i=忽略大小写, m=多行, s=单行）
  flags?: string
  // 是否使用正则（false则为普通文本替换）
  isRegex?: boolean
}

// 默认正则规则 - 清理常见的格式化标签
export const defaultRegexRules: RegexRule[] = [
  {
    id: 'hide-thinking',
    name: '隐藏思维链',
    enabled: true,
    find: '<thinking>.*?</thinking>',
    replace: '',
    flags: 'gs',
    isRegex: true
  },
  {
    id: 'hide-cultivator',
    name: '隐藏果农标签',
    enabled: true,
    find: '\\[果农.*?\\]',
    replace: '',
    flags: 'g',
    isRegex: true
  },
  {
    id: 'hide-scene-label',
    name: '隐藏场景标签',
    enabled: true,
    find: '\\[说人话\\]|\\[剧情分析\\]|\\[场景描写\\]',
    replace: '',
    flags: 'g',
    isRegex: true
  },
  {
    id: 'hide-timestamp',
    name: '隐藏时间戳',
    enabled: true,
    find: '『.*?』',
    replace: '',
    flags: 'g',
    isRegex: true
  },
  {
    id: 'hide-fruit-code',
    name: '隐藏果实编号',
    enabled: true,
    find: '🍎\\d+',
    replace: '',
    flags: 'g',
    isRegex: true
  },
  {
    id: 'hide-debug-console',
    name: '隐藏DEBUG控制台',
    enabled: true,
    find: '```html\\s*DEBUG CONSOLE.*?```',
    replace: '',
    flags: 'gs',
    isRegex: true
  },
  {
    id: 'hide-plot-branch',
    name: '隐藏剧情分支',
    enabled: true,
    find: '🍊剧情分支.*?(?=\\n\\n|$)',
    replace: '',
    flags: 'gs',
    isRegex: true
  },
  {
    id: 'hide-role-table',
    name: '隐藏角色表',
    enabled: true,
    find: '角色表\\|.*?\\|\\s*(?=\\n\\n|$)',
    replace: '',
    flags: 'gs',
    isRegex: true
  },
  {
    id: 'hide-backstage',
    name: '隐藏后台小剧场',
    enabled: true,
    find: '——📝小剧场：.*?(?=\\n\\n|$)',
    replace: '',
    flags: 'gs',
    isRegex: true
  },
  {
    id: 'clean-multiple-newlines',
    name: '清理多余空行',
    enabled: true,
    find: '\\n{3,}',
    replace: '\\n\\n',
    flags: 'g',
    isRegex: true
  }
]

/**
 * 应用正则规则处理文本
 */
export function applyRegexRules(text: string, rules: RegexRule[]): string {
  let processed = text
  
  const enabledRules = rules.filter(rule => rule.enabled)
  
  for (const rule of enabledRules) {
    try {
      if (rule.isRegex !== false) {
        // 正则替换
        const regex = new RegExp(rule.find, rule.flags || '')
        processed = processed.replace(regex, rule.replace)
      } else {
        // 普通文本替换
        if (rule.flags?.includes('g')) {
          // 全局替换
          processed = processed.split(rule.find).join(rule.replace)
        } else {
          // 单次替换
          processed = processed.replace(rule.find, rule.replace)
        }
      }
    } catch (error) {
      console.error(`正则规则 "${rule.name}" 执行失败:`, error)
    }
  }
  
  return processed.trim()
}

/**
 * 从 localStorage 加载自定义正则规则
 */
export function loadRegexRules(): RegexRule[] {
  try {
    const saved = localStorage.getItem('regex_rules')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载正则规则失败:', error)
  }
  
  return defaultRegexRules
}

/**
 * 保存正则规则到 localStorage
 */
export function saveRegexRules(rules: RegexRule[]): void {
  try {
    localStorage.setItem('regex_rules', JSON.stringify(rules))
  } catch (error) {
    console.error('保存正则规则失败:', error)
  }
}

/**
 * 重置为默认规则
 */
export function resetRegexRules(): RegexRule[] {
  saveRegexRules(defaultRegexRules)
  return defaultRegexRules
}
