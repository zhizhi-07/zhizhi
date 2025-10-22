/**
 * AI响应智能解析器
 * 将AI的自然语言输出转换为标准格式
 */

export interface ParsedAIResponse {
  cleanText: string
  actions: {
    redEnvelope?: { amount: number; blessing: string }
    transfer?: { amount: number; message: string }
    photo?: { description: string }
    voice?: { text: string }
    location?: { name: string; address: string }
    recall?: boolean
    quote?: { messageId: string }
  }
}

/**
 * 智能解析AI的自然语言输出
 */
export function parseAIResponse(aiResponse: string): ParsedAIResponse {
  let cleanText = aiResponse
  const actions: ParsedAIResponse['actions'] = {}

  // 🔴 最优先：清理状态标记，避免被误识别为其他内容
  cleanText = cleanText.replace(/\[状态:[^\]]+\]/g, '')
  cleanText = cleanText.replace(/\[状态:[\s\S]*?\]/g, '')

  // 1. 优先匹配标准格式（向后兼容）
  const standardRedEnvelope = aiResponse.match(/\[红包:(\d+\.?\d*):(.+?)\]/)
  if (standardRedEnvelope) {
    let amount = parseFloat(standardRedEnvelope[1])
    if (amount > 200) amount = 200
    actions.redEnvelope = {
      amount,
      blessing: standardRedEnvelope[2]
    }
    cleanText = cleanText.replace(/\[红包:\d+\.?\d*:.+?\]/g, '')
  }
  // 2. 智能识别自然语言红包
  else {
    const naturalRedEnvelope = aiResponse.match(/(?:给你|发你|发个|送你)(?:个)?红包[，,]?\s*(\d+\.?\d*)\s*(?:块|元)?/i)
    if (naturalRedEnvelope) {
      let amount = parseFloat(naturalRedEnvelope[1])
      if (amount > 200) amount = 200
      // 尝试提取祝福语（红包前后的文字）
      const blessingMatch = aiResponse.match(/(.{0,20})(?:给你|发你|发个|送你)(?:个)?红包/)
      const blessing = blessingMatch ? blessingMatch[1].trim() || '恭喜发财' : '恭喜发财'
      actions.redEnvelope = { amount, blessing }
      cleanText = cleanText.replace(/(?:给你|发你|发个|送你)(?:个)?红包[，,]?\s*\d+\.?\d*\s*(?:块|元)?/gi, '')
    }
  }

  // 3. 转账识别（标准格式）
  const standardTransfer = aiResponse.match(/\[转账:(\d+\.?\d*):(.+?)\]/)
  if (standardTransfer) {
    actions.transfer = {
      amount: parseFloat(standardTransfer[1]),
      message: standardTransfer[2]
    }
    cleanText = cleanText.replace(/\[转账:\d+\.?\d*:.+?\]/g, '')
  }
  // 4. 转账识别（自然语言）
  else {
    const naturalTransfer = aiResponse.match(/(?:转|转账|给你转)(?:你)?\s*(\d+\.?\d*)\s*(?:块|元)/i)
    if (naturalTransfer) {
      const amount = parseFloat(naturalTransfer[1])
      // 提取说明（转账前后的文字）
      const messageMatch = aiResponse.match(/(.{0,20})(?:转|转账|给你转)/)
      const message = messageMatch ? messageMatch[1].trim() || '转账' : '转账'
      actions.transfer = { amount, message }
      cleanText = cleanText.replace(/(?:转|转账|给你转)(?:你)?\s*\d+\.?\d*\s*(?:块|元)/gi, '')
    }
  }

  // 5. 照片识别（标准格式）
  const standardPhoto = aiResponse.match(/\[照片:(.+?)\]/)
  if (standardPhoto) {
    actions.photo = { description: standardPhoto[1] }
    cleanText = cleanText.replace(/\[照片:.+?\]/g, '')
  }
  // 6. 照片识别（自然语言）
  else {
    if (/(?:给你|发你|发个|看|拍|照片)/i.test(aiResponse)) {
      const photoMatch = aiResponse.match(/(?:给你|发你|发个|看|拍)(?:张|个)?(?:照片|图)/i)
      if (photoMatch) {
        // 尝试提取描述
        const descMatch = aiResponse.match(/(?:照片|图)[，,]?\s*(.{0,50})/)
        const description = descMatch ? descMatch[1].trim() : '一张照片'
        actions.photo = { description }
        cleanText = cleanText.replace(/(?:给你|发你|发个|看|拍)(?:张|个)?(?:照片|图)/gi, '')
      }
    }
  }

  // 7. 语音识别（标准格式）
  const standardVoice = aiResponse.match(/\[语音:(.+?)\]/)
  if (standardVoice) {
    actions.voice = { text: standardVoice[1] }
    cleanText = cleanText.replace(/\[语音:.+?\]/g, '')
  }
  // 8. 语音识别（自然语言）
  else {
    if (/(?:给你|发你|发个|语音)/i.test(aiResponse)) {
      const voiceMatch = aiResponse.match(/(?:给你|发你|发个)(?:条)?语音/i)
      if (voiceMatch) {
        // 语音内容就是整句话
        const text = cleanText.replace(/(?:给你|发你|发个)(?:条)?语音[，,]?\s*/gi, '').trim()
        actions.voice = { text }
        cleanText = cleanText.replace(/(?:给你|发你|发个)(?:条)?语音/gi, '')
      }
    }
  }

  // 9. 位置识别（标准格式）
  const standardLocation = aiResponse.match(/\[位置:(.+?):(.+?)\]/)
  if (standardLocation) {
    actions.location = {
      name: standardLocation[1],
      address: standardLocation[2]
    }
    cleanText = cleanText.replace(/\[位置:.+?:.+?\]/g, '')
  }
  // 10. 位置识别（自然语言）- 更严格的匹配
  else {
    // 只匹配明确的位置表达，避免误判
    const locationMatch = aiResponse.match(/(?:我在|我现在在|位置在)\s*([^\n]{2,30})/i)
    if (locationMatch) {
      const name = locationMatch[1].trim()
      // 排除一些明显不是位置的内容
      if (!name.includes('|') && !name.includes('状态') && !name.includes('[')) {
        actions.location = {
          name,
          address: name
        }
        cleanText = cleanText.replace(/(?:我在|我现在在|位置在)\s*[^\n]{2,30}/gi, '')
      }
    }
  }

  // 11. 撤回识别 - 只识别明确的撤回标记
  if (/\[撤回消息\]/i.test(aiResponse)) {
    actions.recall = true
    cleanText = cleanText.replace(/\[撤回消息\]/gi, '')
  }

  // 12. 引用识别（保持标准格式）
  const quoteMatch = aiResponse.match(/\[引用:(\d+)\]/)
  if (quoteMatch) {
    actions.quote = { messageId: quoteMatch[1] }
    cleanText = cleanText.replace(/\[引用:\d+\]/g, '')
  }

  // 清理多余空白
  cleanText = cleanText.replace(/\n\s*\n/g, '\n').trim()

  return {
    cleanText,
    actions
  }
}

/**
 * 将解析后的actions转换为标准格式（供现有代码使用）
 */
export function actionsToStandardFormat(actions: ParsedAIResponse['actions']): string {
  const parts: string[] = []

  if (actions.redEnvelope) {
    parts.push(`[红包:${actions.redEnvelope.amount}:${actions.redEnvelope.blessing}]`)
  }
  if (actions.transfer) {
    parts.push(`[转账:${actions.transfer.amount}:${actions.transfer.message}]`)
  }
  if (actions.photo) {
    parts.push(`[照片:${actions.photo.description}]`)
  }
  if (actions.voice) {
    parts.push(`[语音:${actions.voice.text}]`)
  }
  if (actions.location) {
    parts.push(`[位置:${actions.location.name}:${actions.location.address}]`)
  }
  if (actions.recall) {
    parts.push(`[撤回消息]`)
  }
  if (actions.quote) {
    parts.push(`[引用:${actions.quote.messageId}]`)
  }

  return parts.join(' ')
}
