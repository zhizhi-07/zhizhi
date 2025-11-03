/**
 * 正则表达式替换引擎
 * 用于处理 SillyTavern 的 Regex Scripts 功能
 * 支持在发送给AI前自动替换特定标记
 */

import type { RegexScript } from '../context/ContactsContext'

/**
 * 应用正则脚本到文本
 * @param text 原始文本
 * @param scripts 正则脚本列表
 * @param context 上下文信息（用于替换变量）
 * @returns 替换后的文本
 */
export function applyRegexScripts(
  text: string,
  scripts: RegexScript[] | undefined,
  context?: {
    characterName?: string
    userName?: string
    date?: Date
    [key: string]: any
  }
): string {
  if (!scripts || scripts.length === 0) {
    return text
  }

  let result = text

  for (const script of scripts) {
    // 跳过禁用的脚本
    if (script.disabled) {
      continue
    }

    try {
      // 处理findRegex中的转义字符（SillyTavern格式）
      // 将字面的 \n 转换为实际的换行符等
      let processedFindRegex = script.findRegex
        .replace(/\\n/g, '\n')      // 换行符
        .replace(/\\r/g, '\r')      // 回车符
        .replace(/\\t/g, '\t')      // 制表符
      
      // 构建正则表达式 - 添加 's' 标志以支持 . 匹配换行符
      // SillyTavern 使用 gims 标志（global, case-insensitive, multiline, dotAll）
      const flags = 'gims'
      const regex = new RegExp(processedFindRegex, flags)
      
      // 准备上下文变量
      const char = context?.characterName || ''
      const user = context?.userName || ''
      const characterName = context?.characterName || ''
      const userName = context?.userName || ''
      
      // 处理replaceString中的转义字符
      let replaceStr = script.replaceString
        .replace(/\\n/g, '\n')      // 换行符
        .replace(/\\r/g, '\r')      // 回车符
        .replace(/\\t/g, '\t')      // 制表符
      
      // 替换 {{}} 格式的变量（在替换字符串中）
      if (context) {
        replaceStr = replaceStr
          .replace(/\{\{char\}\}/gi, char)
          .replace(/\{\{user\}\}/gi, user)
          .replace(/\{\{characterName\}\}/gi, characterName)
          .replace(/\{\{userName\}\}/gi, userName)
        
        // 日期相关替换
        if (context.date) {
          replaceStr = replaceStr
            .replace(/\{\{date\}\}/gi, context.date.toLocaleDateString('zh-CN'))
            .replace(/\{\{time\}\}/gi, context.date.toLocaleTimeString('zh-CN'))
            .replace(/\{\{datetime\}\}/gi, context.date.toLocaleString('zh-CN'))
        }
        
        // 支持其他自定义变量
        for (const [key, value] of Object.entries(context)) {
          if (key !== 'date') {
            const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'gi')
            replaceStr = replaceStr.replace(pattern, String(value || ''))
          }
        }
      }
      
      // 执行替换 - 使用函数形式以支持动态处理
      const beforeReplace = result
      result = result.replace(regex, function(...args) {
        const match = args[0]  // 完整匹配
        const groups = args.slice(1, -2)  // 捕获组（去掉offset和整个string）
        
        // 先替换 {{match}} 为完整匹配
        let replacement = replaceStr.replace(/\{\{match\}\}/gi, match)
        
        // 手动处理 $1, $2, $3 等捕获组引用
        replacement = replacement.replace(/\$(\d+)/g, (_, num) => {
          const index = parseInt(num)
          return groups[index - 1] || ''  // $1对应groups[0]
        })
        
        return replacement
      })
      const matched = beforeReplace !== result
      
      // 修剪空白
      if (script.trimStrings) {
        result = result.trim()
      }
      
      if (matched) {
        console.log(`✅ [Regex] 成功替换: ${script.scriptName}`)
        console.log(`  替换后长度: ${result.length}`)
        if (result.length > 300) {
          console.log(`  替换后预览: ${result.substring(0, 200)}...`)
        }
      } else {
        console.log(`⚠️ [Regex] 未匹配: ${script.scriptName}`)
        console.log(`  处理后的findRegex: ${processedFindRegex.substring(0, 150)}`)
        console.log(`  替换字符串: ${script.replaceString?.substring(0, 100)}...`)
        console.log(`  文本前200字符: ${result.substring(0, 200).replace(/\n/g, '\\n')}`)
        
        // 尝试简单匹配来诊断问题
        if (result.includes('<-EVE_DATA->') || result.includes('<status>')) {
          console.log(`  ⚠️ 文本包含目标标记，但正则未匹配`)
          console.log(`  原始findRegex:`, script.findRegex.substring(0, 100))
          
          // 测试简化的正则
          try {
            const simpleTest = new RegExp('<status>[\\s\\S]*?</status>', flags)
            const simpleMatch = result.match(simpleTest)
            console.log(`  🧪 简单测试 <status>...</status>:`, simpleMatch ? '✅匹配' : '❌不匹配')
            
            const eveTest = new RegExp('<-EVE_DATA->', 'gi')
            const eveMatch = result.match(eveTest)
            console.log(`  🧪 简单测试 <-EVE_DATA->:`, eveMatch ? '✅匹配' : '❌不匹配')
          } catch (e) {
            console.log(`  测试失败:`, e)
          }
        }
      }
    } catch (error) {
      console.error(`❌ [Regex] 脚本执行失败: ${script.scriptName}`, error)
      // 继续处理其他脚本，不中断
    }
  }

  return result
}

/**
 * 在提示词中应用正则脚本
 */
export function applyRegexToPrompt(
  prompt: string,
  scripts: RegexScript[] | undefined,
  context?: any
): string {
  if (!scripts) return prompt
  
  // 只应用标记为 promptOnly 的脚本
  const promptScripts = scripts.filter(s => s.promptOnly && !s.disabled)
  return applyRegexScripts(prompt, promptScripts, context)
}

/**
 * 在消息中应用正则脚本
 */
export function applyRegexToMessage(
  message: string,
  scripts: RegexScript[] | undefined,
  context?: any
): string {
  if (!scripts) return message
  
  // 应用非 promptOnly 的脚本
  const messageScripts = scripts.filter(s => !s.promptOnly && !s.disabled)
  return applyRegexScripts(message, messageScripts, context)
}
