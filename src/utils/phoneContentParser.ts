import { AIPhoneContent } from './aiPhoneGenerator'

// 解析文本格式的手机内容
export const parsePhoneContent = (text: string, characterId: string, characterName: string): AIPhoneContent => {
  const sections = text.split('===').filter(s => s.trim())
  
  const result: AIPhoneContent = {
    characterId,
    characterName,
    generatedAt: Date.now(),
    contacts: [],
    wechatChats: [],
    browserHistory: [],
    taobaoOrders: [],
    alipayBills: [],
    photos: [],
    notes: [],
    musicPlaylist: [],
    footprints: []
  }

  sections.forEach(section => {
    const lines = section.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return

    const type = lines[0].trim()
    // 过滤掉标题行、示例行、提示行和空行
    const dataLines = lines.slice(1).filter(l => {
      const trimmed = l.trim()
      return trimmed && 
        !trimmed.startsWith('姓名') && 
        !trimmed.startsWith('标题') && 
        !trimmed.startsWith('聊天') && 
        !trimmed.startsWith('商品') && 
        !trimmed.startsWith('描述') && 
        !trimmed.startsWith('歌曲') && 
        !trimmed.startsWith('地点') &&
        !trimmed.includes('|||示例') &&
        !trimmed.includes('继续生成') &&
        !trimmed.includes('(') && 
        !trimmed.includes('）')
    })

    switch (type) {
      case '通讯录':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 4) {
            result.contacts.push({
              name: parts[0].trim(),
              phone: parts[1].trim(),
              relation: parts[2].trim(),
              notes: parts[3].trim()
            })
          }
        })
        break

      case '微信聊天':
        let currentChat: any = null
        dataLines.forEach(line => {
          const trimmedLine = line.trim()
          if (trimmedLine.startsWith('对话：')) {
            if (currentChat) {
              const parts = trimmedLine.substring(3).split('|||')
              if (parts.length >= 3) {
                currentChat.messages.push({
                  content: parts[1].trim(),
                  isSelf: parts[0].trim() === 'self',
                  time: parts[2].trim(),
                  type: 'text'
                })
              }
            }
          } else {
            const parts = trimmedLine.split('|||')
            if (parts.length >= 4) {
              // 保存上一个聊天
              if (currentChat && currentChat.messages.length > 0) {
                result.wechatChats.push(currentChat)
              }
              // 创建新聊天
              currentChat = {
                name: parts[0].trim(),
                lastMessage: parts[1].trim(),
                time: parts[2].trim(),
                unread: parseInt(parts[3]) || 0,
                messages: []
              }
            }
          }
        })
        // 保存最后一个聊天（只有有消息的才保存）
        if (currentChat && currentChat.messages.length > 0) {
          result.wechatChats.push(currentChat)
        }
        break

      case '浏览器历史':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 4) {
            result.browserHistory.push({
              title: parts[0].trim(),
              url: parts[1].trim(),
              time: parts[2].trim(),
              reason: parts[3].trim()
            })
          }
        })
        break

      case '淘宝订单':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 5) {
            result.taobaoOrders.push({
              title: parts[0].trim(),
              price: parts[1].trim(),
              status: parts[2].trim(),
              reason: parts[3].trim(),
              thought: parts[4].trim()
            })
          }
        })
        break

      case '支付宝账单':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 5) {
            result.alipayBills.push({
              title: parts[0].trim(),
              amount: parts[1].trim(),
              type: parts[2].trim().includes('收入') ? 'income' : 'expense',
              time: parts[3].trim(),
              reason: parts[4].trim()
            })
          }
        })
        break

      case '相册':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 3) {
            result.photos.push({
              description: parts[0].trim(),
              location: parts[1].trim(),
              time: parts[2].trim()
            })
          }
        })
        break

      case '备忘录':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 3) {
            result.notes.push({
              title: parts[0].trim(),
              content: parts[1].trim(),
              time: parts[2].trim()
            })
          }
        })
        break

      case '音乐播放列表':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 3) {
            result.musicPlaylist.push({
              title: parts[0].trim(),
              artist: parts[1].trim(),
              mood: parts[2].trim()
            })
          }
        })
        break

      case '足迹':
        dataLines.forEach(line => {
          const parts = line.split('|||')
          if (parts.length >= 7) {
            result.footprints.push({
              location: parts[0].trim(),
              address: parts[1].trim(),
              time: parts[2].trim(),
              duration: parts[3].trim(),
              activity: parts[4].trim(),
              mood: parts[5].trim(),
              companion: parts[6].trim()
            })
          }
        })
        break
    }
  })

  return result
}
