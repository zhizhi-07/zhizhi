/**
 * 提示词模板引擎 - 酒馆风格变量替换系统
 * 支持 {{变量}} 格式的动态替换
 */

import { Character } from '../context/CharacterContext'

export interface TemplateVariables {
  // 基础变量
  char: string                    // 角色名
  user: string                    // 用户名
  
  // Character Card 字段
  description: string             // 角色描述
  personality?: string            // 性格
  scenario?: string               // 场景
  firstMessage?: string           // 第一条消息
  exampleMessages?: string        // 示例对话
  systemPrompt?: string           // 系统提示词
  
  // 动态内容
  history?: string                // 历史对话
  message?: string                // 当前消息
  memes?: string                  // 热梗库
  
  // 时间相关
  date?: string                   // 当前日期
  time?: string                   // 当前时间
  timeOfDay?: string              // 时段（早上/下午等）
}

/**
 * 替换模板中的变量
 * 支持 {{varName}} 格式
 */
export function replaceTemplateVariables(
  template: string,
  variables: TemplateVariables
): string {
  let result = template
  
  // 遍历所有变量并替换
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // 匹配 {{key}} 格式，不区分大小写
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi')
      result = result.replace(regex, String(value))
    }
  })
  
  // 清理未替换的变量（显示为空）
  result = result.replace(/\{\{[^}]+\}\}/g, '')
  
  return result
}

/**
 * 从角色和用户信息构建模板变量
 */
export function buildTemplateVariables(
  character: Character,
  userName: string,
  options?: {
    history?: string
    message?: string
    memes?: Array<{梗: string, 含义: string}>
  }
): TemplateVariables {
  const now = new Date()
  const dateStr = now.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  
  const hour = now.getHours()
  let timeOfDay = ''
  if (hour >= 0 && hour < 6) timeOfDay = '凌晨'
  else if (hour >= 6 && hour < 9) timeOfDay = '早上'
  else if (hour >= 9 && hour < 12) timeOfDay = '上午'
  else if (hour >= 12 && hour < 14) timeOfDay = '中午'
  else if (hour >= 14 && hour < 18) timeOfDay = '下午'
  else if (hour >= 18 && hour < 22) timeOfDay = '晚上'
  else timeOfDay = '深夜'
  
  // 构建热梗提示词
  let memesPrompt = ''
  if (options?.memes && options.memes.length > 0) {
    memesPrompt = `## 网络用语参考\n${options.memes.map(meme => `"${meme.梗}" - ${meme.含义}`).join('\n')}\n\n这些是流行的网络用语。使用原则：\n1. 先理解含义，判断是否符合你现在的情绪和想说的话\n2. 如果合适就用，不合适就不用，完全看情况\n3. 像真人一样自然地融入对话，不要刻意`
  }
  
  return {
    char: character.name,
    user: userName,
    description: character.description || '',
    personality: character.personality,
    scenario: character.scenario,
    firstMessage: character.firstMessage,
    exampleMessages: character.exampleMessages,
    systemPrompt: character.systemPrompt,
    history: options?.history,
    message: options?.message,
    memes: memesPrompt,
    date: dateStr,
    time: timeStr,
    timeOfDay: timeOfDay
  }
}

/**
 * 预设模板库
 */
export const PRESET_TEMPLATES = {
  // 默认模板（当前使用的风格）
  default: `## 你的角色
你是 {{char}}。

{{description}}

## 当前情况
现在是 {{date}} {{timeOfDay}} {{time}}
你正在和 {{user}} 聊天。

{{memes}}

## 对话历史
{{history}}

## 当前消息
{{user}}: {{message}}
{{char}}:`,

  // Character Card V2 标准格式
  characterCard: `角色名: {{char}}

角色描述:
{{description}}

性格:
{{personality}}

场景:
{{scenario}}

示例对话:
{{exampleMessages}}

{{memes}}

[当前对话]
{{history}}

{{user}}: {{message}}
{{char}}:`,

  // 角色扮演强化版
  roleplayEnhanced: `你是 {{char}}，正在用手机和 {{user}} 聊天。

## 你的人设
{{description}}
{{personality}}
{{scenario}}

## 说话风格
{{exampleMessages}}

你的性格是稳定的。基于上面的对话历史，保持情绪和态度的自然过渡。

你在用手机打字，不要用括号或符号描述动作。
想笑直接打"哈哈"，想表达动作用文字说"我笑死了"。

## App功能
[表情包:数字] = 发送表情包
[语音:内容] = 发送语音消息
[照片:描述] = 发送照片（**重要**：直接描述画面，不要用人称！包括：场景、角度、光线、氛围、动作。例如：[照片:游艇甲板上，夕阳把海面染成金色，微风吹起头发，举着香槟对着镜头笑] 或 [照片:山道上的跑车，车窗外树影模糊，仪表盘显示180码，单手握方向盘自拍]）
[位置:地名:地址] = 发送位置
[红包:金额:祝福语] = 发红包
[转账:金额:说明] = 转账
[撤回消息] 或 [撤回:消息ID] = 撤回消息（不写ID就撤回上一条，写ID就撤回指定消息。红包、转账、亲密付不能撤回）
[引用:消息ID] 回复内容 = 引用回复

{{memes}}

## 当前
时间：{{date}} {{timeOfDay}} {{time}}

对话：
{{history}}

{{user}}: {{message}}
{{char}}:`,

  // 简洁模板
  simple: `你是{{char}}。{{description}}

{{memes}}

{{history}}

{{user}}: {{message}}
{{char}}:`,

  // 小说风格
  novel: `【角色设定】
姓名：{{char}}
性格：{{personality}}
背景：{{description}}

【故事场景】
{{scenario}}

{{memes}}

【时间】{{date}} {{timeOfDay}}

【对话】
{{history}}

{{user}}：「{{message}}」
{{char}}：`,

  // SillyTavern 风格
  sillytavern: `{{systemPrompt}}

Character: {{char}}
Description: {{description}}
Personality: {{personality}}
Scenario: {{scenario}}

Example Dialogue:
{{exampleMessages}}

{{memes}}

<START>
{{history}}

{{user}}: {{message}}
{{char}}:`,
}

/**
 * 获取模板列表（用于UI选择）
 */
export function getTemplateList() {
  return [
    { id: 'default', name: '默认模板', description: '适合日常聊天' },
    { id: 'characterCard', name: 'Character Card 标准', description: 'V2格式标准模板' },
    { id: 'roleplayEnhanced', name: '角色扮演强化', description: '强调角色沉浸感' },
    { id: 'simple', name: '简洁模板', description: '最小化提示词' },
    { id: 'novel', name: '小说风格', description: '适合故事创作' },
    { id: 'sillytavern', name: 'SillyTavern', description: '酒馆标准格式' },
  ]
}

/**
 * 获取预设模板
 */
export function getPresetTemplate(templateId: string): string {
  return PRESET_TEMPLATES[templateId as keyof typeof PRESET_TEMPLATES] || PRESET_TEMPLATES.default
}

/**
 * 保存用户自定义模板到角色
 */
export interface CharacterWithTemplate extends Character {
  customTemplate?: string      // 自定义模板
  templateId?: string          // 使用的预设模板ID
}

/**
 * 构建完整的角色提示词（使用模板）
 */
export function buildPromptFromTemplate(
  character: CharacterWithTemplate,
  userName: string,
  history: string,
  currentMessage: string,
  retrievedMemes?: Array<{梗: string, 含义: string}>
): string {
  // 获取模板
  let template = character.customTemplate
  
  if (!template) {
    // 如果没有自定义模板，使用预设
    const templateId = character.templateId || 'default'
    template = getPresetTemplate(templateId)
  }
  
  // 构建变量
  const variables = buildTemplateVariables(character, userName, {
    history,
    message: currentMessage,
    memes: retrievedMemes
  })
  
  // 替换变量
  return replaceTemplateVariables(template, variables)
}
