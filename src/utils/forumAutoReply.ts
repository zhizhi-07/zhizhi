/**
 * 论坛自动回复系统
 * 
 * 用户发帖后自动触发AI角色互动
 * 包括评论、楼中楼、私信等
 * 
 * @module utils/forumAutoReply
 */

import { getForumCharacters } from './forumAI'
import * as forumStorage from './forumStorage'
import { getMemesForAI } from './memeManager'
import type { ForumPost } from '../types/forum'

/**
 * 获取角色最近聊天记录
 */
function getCharacterRecentMessages(characterId: string): string[] {
  const messages = localStorage.getItem(`chat_${characterId}`)
  if (!messages) return []
  
  try {
    const parsed = JSON.parse(messages)
    return parsed.slice(-10).map((msg: any) => 
      `${msg.isUser ? '用户' : '角色'}：${msg.text}`
    )
  } catch {
    return []
  }
}

/**
 * 生成AI角色评论（一次生成2-3条楼中楼）
 */
async function generateCharacterComments(
  character: any,
  postContent: string,
  existingComments: any[] = []
): Promise<string[]> {
  try {
    const apiSettings = localStorage.getItem('apiSettings')
    if (!apiSettings) return []
    const settings = JSON.parse(apiSettings)

    // 获取角色最近聊天记录
    const recentMessages = getCharacterRecentMessages(character.characterId)
    const chatHistory = recentMessages.length > 0 
      ? `\n\n${character.originalName}最近的对话记录：\n${recentMessages.join('\n')}`
      : ''

    // 构建已有评论上下文
    let conversationContext = ''
    if (existingComments.length > 0) {
      conversationContext = '\n\n当前帖子的其他评论：\n' + 
        existingComments.slice(-5).map(c => 
          `${c.authorName}：${c.content}`
        ).join('\n')
    }

    // 全部梗库（内置+自定义）
    const allMemes = getMemesForAI()

    const prompt = `你正在扮演论坛用户"${character.forumNickname || character.originalName}"。

角色信息：
- 原名：${character.originalName}
- 论坛昵称：${character.forumNickname}
- 个性签名：${character.forumSignature}
- 性格：${character.personality}${chatHistory}${conversationContext}

帖子内容：
${postContent}

网络梗库（可自然使用）：
${allMemes}

请以${character.forumNickname}的身份生成2-3条楼中楼评论。要求：
1. 每条评论单独一行
2. 符合${character.originalName}的性格
3. 每条20-80字，自然简短
4. 可以使用emoji和网络梗
5. 第一条是对帖子的直接评论，后续是补充或继续话题
6. 可以调侃、吐槽、挂人、支持等各种态度
7. 只输出评论内容，每行一条，不要序号

示例：
这个观点我觉得有点问题诶🤔
不是我说，这种情况下应该...
哈哈哈笑死，真的很抽象

评论：`

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

    if (!response.ok) return []

    const data = await response.json()
    const replyText = data.choices?.[0]?.message?.content?.trim() || ''
    
    const replies = replyText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line && !line.match(/^[\d\-\*\.]+/))
      .slice(0, 3)

    return replies

  } catch (error) {
    console.error('生成角色评论失败:', error)
    return []
  }
}

/**
 * 生成私信内容
 */
async function generateDirectMessage(
  character: any,
  postContent: string
): Promise<string | null> {
  try {
    const apiSettings = localStorage.getItem('apiSettings')
    if (!apiSettings) return null
    const settings = JSON.parse(apiSettings)

    const recentMessages = getCharacterRecentMessages(character.characterId)
    const chatHistory = recentMessages.length > 0 
      ? `\n\n${character.originalName}最近的对话记录：\n${recentMessages.join('\n')}`
      : ''

    const prompt = `你正在扮演论坛用户"${character.forumNickname || character.originalName}"。

角色信息：
- 原名：${character.originalName}
- 论坛昵称：${character.forumNickname}
- 性格：${character.personality}${chatHistory}

用户刚发布了一条帖子：
${postContent}

你看到这条帖子后，想给用户发私信。请生成一条私信内容：
1. 30-60字
2. 符合角色性格
3. 可以是想认识、讨论、吐槽、求助等
4. 自然友好
5. 只输出私信内容

私信：`

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
        max_tokens: 150
      })
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() || null

  } catch (error) {
    console.error('生成私信失败:', error)
    return null
  }
}

/**
 * 处理用户发帖后的自动互动
 */
export async function handlePostInteractions(post: ForumPost): Promise<void> {
  console.log('🎭 开始处理帖子互动:', post.id)
  
  const forumCharacters = getForumCharacters()
  if (forumCharacters.length === 0) {
    console.log('❌ 没有论坛角色')
    return
  }

  // 随机选择1-3个角色参与互动
  const participantCount = Math.min(
    Math.floor(Math.random() * 3) + 1,
    forumCharacters.length
  )
  const participants = forumCharacters
    .sort(() => Math.random() - 0.5)
    .slice(0, participantCount)

  console.log(`👥 选择了 ${participantCount} 个角色参与: ${participants.map(p => p.forumNickname).join('、')}`)

  // 延迟2-5秒后开始互动
  setTimeout(async () => {
    for (let i = 0; i < participants.length; i++) {
      const character = participants[i]
      
      // 每个角色间隔3-6秒
      const delay = i * (Math.random() * 3000 + 3000)
      
      setTimeout(async () => {
        // 获取当前评论（用于楼中楼上下文）
        const existingComments = forumStorage.getPostComments(post.id)
        
        // 生成评论
        const comments = await generateCharacterComments(
          character,
          post.content,
          existingComments
        )

        if (comments.length > 0) {
          let lastCommentId: string | undefined = undefined
          
          // 依次发布评论
          for (let j = 0; j < comments.length; j++) {
            const comment = comments[j]
            
            // 每条评论间隔2-4秒
            const commentDelay = j === 0 ? 0 : Math.random() * 2000 + 2000
            
            setTimeout(() => {
              const newComment = forumStorage.addComment({
                postId: post.id,
                content: comment,
                authorId: character.characterId,
                authorName: character.forumNickname || character.originalName,
                authorAvatar: character.forumAvatar || character.originalAvatar || '😊',
                replyTo: lastCommentId,
                replyToUser: j === 0 ? post.authorName : (character.forumNickname || character.originalName),
                replyToUserId: j === 0 ? post.authorId : character.characterId,
                likeCount: Math.floor(Math.random() * 20),
                isLiked: false
              })

              // 给用户发送评论通知
              if (j === 0 && post.authorId === 'currentUser') {
                forumStorage.addNotification({
                  type: 'comment',
                  fromUserId: character.characterId,
                  fromUserName: character.forumNickname || character.originalName,
                  fromUserAvatar: character.forumAvatar,
                  postId: post.id,
                  commentId: newComment.id,
                  content: `评论了你的帖子：${comment.substring(0, 20)}${comment.length > 20 ? '...' : ''}`,
                  isRead: false
                })
              }

              lastCommentId = newComment.id
              
              console.log(`💬 ${character.forumNickname} 评论 ${j + 1}/${comments.length}:`, comment)
            }, commentDelay)
          }
        }

        // 20%概率发私信
        if (Math.random() < 0.2 && post.authorId === 'currentUser') {
          setTimeout(async () => {
            const dmContent = await generateDirectMessage(character, post.content)
            
            if (dmContent) {
              forumStorage.addDirectMessage({
                fromUserId: character.characterId,
                fromUserName: character.forumNickname || character.originalName,
                fromUserAvatar: character.forumAvatar || character.originalAvatar || '😊',
                toUserId: 'currentUser',
                content: dmContent,
                timestamp: Date.now(),
                isRead: false
              })

              console.log(`💌 ${character.forumNickname} 发送私信:`, dmContent)
            }
          }, Math.random() * 5000 + 3000)
        }
      }, delay)
    }
  }, Math.random() * 3000 + 2000)
}
