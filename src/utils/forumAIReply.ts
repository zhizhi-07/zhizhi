/**
 * 论坛AI回复生成器
 * 
 * 处理@角色的智能回复功能
 * 包括楼中楼对话
 * 
 * @module utils/forumAIReply
 */

import { getForumCharacters } from './forumAI'
import * as forumStorage from './forumStorage'
import type { ForumComment } from '../types/forum'
import { getMemesForAI } from './memeManager'

/**
 * 解析文本中的@提及
 */
export function parseMentions(content: string): string[] {
  const mentionRegex = /@([\u4e00-\u9fa5a-zA-Z0-9_]+)/g
  const mentions: string[] = []
  let match
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }
  
  return mentions
}

/**
 * 获取角色最近的聊天记录
 */
function getCharacterRecentMessages(characterId: string): string[] {
  const messages = localStorage.getItem(`chat_${characterId}`)
  if (!messages) return []
  
  try {
    const parsed = JSON.parse(messages)
    // 取最近10条消息
    return parsed.slice(-10).map((msg: any) => 
      `${msg.isUser ? '用户' : '角色'}：${msg.text}`
    )
  } catch {
    return []
  }
}

/**
 * 生成角色回复（一次API调用生成多条楼中楼对话）
 */
export async function generateCharacterReplies(
  characterName: string,
  postContent: string,
  mentionContext: string,
  existingComments: ForumComment[] = []
): Promise<string[]> {
  try {
    // 找到角色信息
    const forumCharacters = getForumCharacters()
    const character = forumCharacters.find(c => c.originalName === characterName)
    
    if (!character) {
      console.log('未找到角色:', characterName)
      return []
    }

    // 获取API配置
    const apiSettings = localStorage.getItem('apiSettings')
    if (!apiSettings) {
      console.error('未配置API')
      return []
    }

    const settings = JSON.parse(apiSettings)

    // 获取角色最近聊天记录
    const recentMessages = getCharacterRecentMessages(character.characterId)
    const chatHistory = recentMessages.length > 0 
      ? `\n\n${characterName}最近的对话记录：\n${recentMessages.join('\n')}`
      : ''

    // 构建楼中楼对话上下文
    let conversationContext = ''
    if (existingComments.length > 0) {
      conversationContext = '\n\n当前帖子的评论对话：\n' + 
        existingComments.slice(-5).map(c => 
          `${c.authorName}：${c.content}`
        ).join('\n')
    }

    // 全部梗库（内置+自定义）
    const allMemes = getMemesForAI()

    // 构造prompt - 一次生成2-3条楼中楼回复
    const prompt = `你正在扮演论坛用户"${character.forumNickname || characterName}"。

角色信息：
- 原名：${characterName}
- 论坛昵称：${character.forumNickname}
- 个性签名：${character.forumSignature}
- 性格：${character.personality}${chatHistory}${conversationContext}

当前帖子内容：
${postContent}

用户@了你：
${mentionContext}

网络梗库（1200+条，可自然使用让回复更有趣）：
${allMemes}

请以${character.forumNickname}的身份生成2-3条楼中楼回复。要求：
1. 每条回复单独一行
2. 回复要符合${characterName}的性格特点
3. 每条回复20-80字，自然简短
4. 可以使用emoji表情和网络梗
5. 基于聊天记录中的了解进行回复
6. 第一条是对@的直接回复，后续是补充或继续话题
7. 只输出回复内容，每行一条，不要序号或前缀

示例格式：
好啊！我也在玩这个游戏~
不过我还是新手，能带带我吗？
我最喜欢的角色是可莉！

回复：`

    console.log('🤖 生成角色楼中楼回复:', characterName)

    const response = await fetch(settings.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      throw new Error('API调用失败')
    }

    const data = await response.json()
    const replyText = data.choices?.[0]?.message?.content?.trim() || ''
    
    // 解析多条回复
    const replies = replyText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line && !line.match(/^[\d\-\*\.]+/)) // 过滤空行和序号
      .slice(0, 3) // 最多3条

    console.log('✅ 角色楼中楼回复生成:', replies)
    return replies

  } catch (error) {
    console.error('生成角色回复失败:', error)
    return []
  }
}

/**
 * 处理@提及并生成角色回复
 */
export async function handleMentions(
  postId: string,
  commentContent: string,
  commentAuthorId: string = 'currentUser',
  commentAuthorName: string = '我',
  parentCommentId?: string
): Promise<void> {
  const mentions = parseMentions(commentContent)
  if (mentions.length === 0) return

  console.log('📢 检测到@提及:', mentions)

  // 获取帖子内容
  const post = forumStorage.getPostById(postId)
  if (!post) return

  // 获取现有评论（用于楼中楼上下文）
  const existingComments = forumStorage.getPostComments(postId)

  // 为每个被@的角色生成回复
  for (const mentionedName of mentions) {
    // 延迟1-3秒模拟思考时间
    const delay = Math.random() * 2000 + 1000
    
    setTimeout(async () => {
      const replies = await generateCharacterReplies(
        mentionedName,
        post.content,
        commentContent,
        existingComments
      )

      if (replies.length > 0) {
        // 角色发表评论
        const forumCharacters = getForumCharacters()
        const character = forumCharacters.find(c => c.originalName === mentionedName)
        
        if (character) {
          let lastCommentId = parentCommentId
          
          // 依次发布多条回复，形成楼中楼
          for (let i = 0; i < replies.length; i++) {
            const reply = replies[i]
            
            // 每条之间间隔2-4秒
            const replyDelay = i === 0 ? 0 : Math.random() * 2000 + 2000
            
            setTimeout(() => {
              const characterComment = forumStorage.addComment({
                postId: postId,
                content: reply,
                authorId: character.characterId,
                authorName: character.forumNickname || character.originalName,
                authorAvatar: character.forumAvatar || character.originalAvatar || '😊',
                replyTo: lastCommentId,
                replyToUser: i === 0 ? commentAuthorName : (character.forumNickname || character.originalName),
                replyToUserId: i === 0 ? commentAuthorId : character.characterId,
                likeCount: Math.floor(Math.random() * 20),
                isLiked: false
              })

              // 给用户发送回复通知（仅第一条）
              if (i === 0 && commentAuthorId === 'currentUser') {
                forumStorage.addNotification({
                  type: 'comment',
                  fromUserId: character.characterId,
                  fromUserName: character.forumNickname || character.originalName,
                  fromUserAvatar: character.forumAvatar,
                  postId: postId,
                  commentId: characterComment.id,
                  content: `回复了你：${reply.substring(0, 20)}${reply.length > 20 ? '...' : ''}`,
                  isRead: false
                })
              }

              // 更新lastCommentId用于下一条回复
              lastCommentId = characterComment.id
              
              console.log(`💬 ${character.forumNickname} 楼中楼 ${i + 1}/${replies.length}:`, reply)
            }, replyDelay)
          }
        }
      }
    }, delay)
  }
}

// 注：楼中楼对话已在generateCharacterReplies中一次性生成，无需此函数

/**
 * 插入@提及到输入框
 */
export function insertMention(inputValue: string, cursorPos: number, mentionName: string): {
  newValue: string
  newCursorPos: number
} {
  const beforeCursor = inputValue.slice(0, cursorPos)
  const afterCursor = inputValue.slice(cursorPos)
  
  // 查找最后一个@的位置
  const lastAtIndex = beforeCursor.lastIndexOf('@')
  
  if (lastAtIndex !== -1) {
    // 替换@及其后面的文字
    const beforeAt = inputValue.slice(0, lastAtIndex)
    const mention = `@${mentionName} `
    const newValue = beforeAt + mention + afterCursor
    const newCursorPos = (beforeAt + mention).length
    
    return { newValue, newCursorPos }
  } else {
    // 在当前位置插入@
    const mention = `@${mentionName} `
    const newValue = beforeCursor + mention + afterCursor
    const newCursorPos = (beforeCursor + mention).length
    
    return { newValue, newCursorPos }
  }
}
