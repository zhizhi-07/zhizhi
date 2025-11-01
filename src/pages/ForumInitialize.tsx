/**
 * ForumInitialize.tsx - 论坛初始化页面
 * 
 * 选择要加入论坛的角色，并进行初始化
 * 
 * @module pages/ForumInitialize
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/CharacterContext'
import { BackIcon, AddIcon } from '../components/Icons'
import { 
  saveForumCharacters,
  saveSelectedCharacterIds,
  getSelectedCharacterIds
} from '../utils/forumAI'
import { getMemesForAI } from '../utils/memeManager'
import { notifyForumInitStart, notifyForumInitProgress, notifyForumInitComplete } from '../utils/forumNotifications'
import '../utils/forumDebug' // 加载调试工具

const ForumInitialize = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  
  const [step, setStep] = useState(1) // 1=选角色, 2=填写兴趣
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // 读取上次选择
    return getSelectedCharacterIds()
  })
  const [interests, setInterests] = useState('') // 用户兴趣
  const [hotTopics, setHotTopics] = useState('') // 热点话题
  const [postStyle, setPostStyle] = useState('轻松') // 帖子风格
  const [initializing, setInitializing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })

  useEffect(() => {
    // 如果没有角色，提示创建
    if (characters.length === 0) {
      // 可以显示提示或直接跳转
    }
  }, [characters])

  /**
   * 切换选择
   */
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  /**
   * 跳过初始化
   */
  const handleSkip = () => {
    // 标记论坛已初始化
    localStorage.setItem('forum_initialized', 'true')
    // 跳转到论坛首页
    navigate('/forum', { replace: true })
  }

  /**
   * 全选/全不选
   */
  const toggleSelectAll = () => {
    if (selectedIds.length === characters.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(characters.map(c => c.id))
    }
  }

  /**
   * 进入下一步（填写兴趣）
   */
  const handleNext = () => {
    if (selectedIds.length === 0) {
      alert('请至少选择一个角色')
      return
    }
    setStep(2)
  }

  /**
   * 开始初始化（方案B：一次性生成）
   */
  const handleInitialize = async () => {
    if (!interests.trim()) {
      alert('请填写你的兴趣爱好')
      return
    }

    const selectedCharacters = characters.filter(c => selectedIds.includes(c.id))
    
    setInitializing(true)
    
    // 显示初始化开始通知
    notifyForumInitStart()
    
    setProgress({ current: 0, total: 3, message: '正在清除旧数据...' })
    
    // 清除旧的帖子和话题数据
    localStorage.removeItem('forum_posts')
    localStorage.removeItem('forum_topics_list')
    localStorage.removeItem('forum_comments')
    
    setProgress({ current: 0, total: 3, message: '正在生成话题和帖子...' })
    notifyForumInitProgress('正在生成话题和帖子...')

    try {
      // 构建AI Prompt（一次性生成所有内容）
      const apiSettings = localStorage.getItem('apiSettings')
      if (!apiSettings) {
        throw new Error('请先配置API')
      }
      
      const settings = JSON.parse(apiSettings)
      
      // 构建prompt - 包含完整的AI角色信息
      const characterInfo = selectedCharacters.map(c => 
        `${c.name}（${c.nickname || c.name}）- 性格：${c.personality || c.description || '未设置'} - 签名：${c.signature || '暂无'}`
      ).join('\n')
      
      // 全部梗库（内置+自定义）
      const allMemes = getMemesForAI()
      
      const prompt = `你是论坛内容生成器。请根据用户信息生成论坛初始内容。

⚠️ 重要规则：
1. 为每个AI角色生成符合其性格的论坛昵称和个性签名
2. AI角色的原始名字（${selectedCharacters.map(c => c.name).join('、')}）保持不变
3. 帖子内容要符合角色性格
4. ${postStyle === '抽象' ? '可以在帖子中自然融入网络梗，让内容更有趣' : ''}

用户兴趣：${interests.trim()}
${hotTopics.trim() ? `热点关注：${hotTopics.trim()}` : ''}
帖子风格：${postStyle}

${postStyle === '抽象' ? `\n常用网络梗库（部分）：\n${allMemes.slice(0, 200)}\n` : ''}

AI角色信息：
${characterInfo}

⚠️ 输出格式要求（非常重要）：
- 每行一条数据，用竖线 | 分隔字段
- 不要添加markdown代码块标记（不要用\`\`\`）
- 不要添加任何解释说明文字
- 直接输出数据行

格式说明：
角色|原名|论坛昵称|个性签名|头像emoji
话题|话题名|话题描述|标签1,标签2
帖子|话题名|作者原名|帖子内容|标签1,标签2
用户|user_id|用户名|头像emoji|个人简介

示例输出（请严格按此格式）：
角色|${selectedCharacters[0]?.name || '小雪'}|雪の物语|喜欢二次元的普通人|❄️
话题|游戏讨论|分享游戏心得和攻略|游戏,娱乐
话题|科技前沿|探讨最新科技动态|科技,AI
话题|美食分享|记录美食生活点滴|美食,生活
帖子|游戏讨论|${selectedCharacters[0]?.name || '小雪'}|今天抽到了喜欢的角色~好开心|游戏
用户|user1|张浩宇|😊|游戏爱好者
用户|user2|李思琪|🌸|美食博主

生成要求：
1. 为每个AI角色生成1条"角色"行（包含论坛昵称和签名）
2. 生成6-8个"话题"行
3. 每个AI角色发2-3条"帖子"行（使用原名作为作者）
4. 生成20-30个"用户"行（NPC用户）
5. 确保每个话题都有5-8条帖子
6. 帖子内容50-150字

⚠️ 再次强调：直接输出数据行，不要有任何其他文字或markdown标记！`

      console.log('🎯 发送prompt:', prompt)
      setProgress({ current: 1, total: 3, message: '正在调用AI生成内容...' })
      
      const response = await fetch(settings.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.9,
          max_tokens: 4000
        })
      })
      
      if (!response.ok) {
        throw new Error('API调用失败')
      }
      
      const data = await response.json()
      let result = data.choices?.[0]?.message?.content || ''
      
      console.log('📦 AI返回原始内容长度:', result.length)
      console.log('📦 AI返回前500字符:', result.substring(0, 500))
      
      // 清理AI返回的内容（去除可能的markdown代码块）
      result = result.replace(/```[\w]*\n?/g, '').trim()
      
      setProgress({ current: 2, total: 3, message: '正在解析生成的内容...' })
      
      // 解析结果
      const lines = result.split('\n').map((l: string) => l.trim()).filter((l: string) => l && !l.startsWith('#'))
      
      const aiCharacters: any[] = [] // AI角色的论坛信息
      const topics: any[] = []
      const posts: any[] = []
      const users: any[] = []
      
      lines.forEach((line: string) => {
        const parts = line.split('|')
        if (parts[0] === '角色' && parts.length >= 5) {
          // 解析AI角色的论坛昵称和签名
          aiCharacters.push({
            originalName: parts[1].trim(),
            forumNickname: parts[2].trim(),
            forumSignature: parts[3].trim(),
            forumAvatar: parts[4].trim()
          })
        } else if (parts[0] === '话题' && parts.length >= 4) {
          topics.push({
            id: `topic_${Date.now()}_${Math.random()}`,
            name: parts[1].trim(),
            description: parts[2].trim(),
            tags: parts[3].split(',').map((t: string) => t.trim()),
            postsCount: 0,
            followersCount: Math.floor(Math.random() * 500) + 100,
            isFollowing: false,
            posts: [],
            users: []
          })
        } else if (parts[0] === '帖子' && parts.length >= 5) {
          posts.push({
            topicName: parts[1].trim(),
            authorName: parts[2].trim(),
            content: parts[3].trim(),
            tags: parts[4].split(',').map(t => t.trim())
          })
        } else if (parts[0] === '用户' && parts.length >= 5) {
          users.push({
            id: parts[1].trim(),
            name: parts[2].trim(),
            avatar: parts[3].trim(),
            bio: parts[4].trim(),
            followers: Math.floor(Math.random() * 500) + 50
          })
        }
      })
      
      console.log('✅ 解析结果:', { 
        aiCharacters: aiCharacters.length, 
        topics: topics.length, 
        posts: posts.length, 
        users: users.length 
      })
      
      // 验证数据
      if (topics.length === 0 || posts.length === 0) {
        console.error('❌ 生成的数据不足:', { topics: topics.length, posts: posts.length })
        console.error('📝 AI原始返回:', result)
        throw new Error(`生成失败：话题${topics.length}个，帖子${posts.length}个。AI返回的格式可能不正确，请重试。`)
      }
      
      // 分配帖子到话题并创建完整结构
      const allForumPosts: any[] = [] // 收集所有帖子用于保存到forumStorage
      
      topics.forEach(topic => {
        const topicPosts = posts.filter(p => p.topicName === topic.name)
        topic.posts = topicPosts.map(p => {
          // 查找作者：先查NPC用户，再查AI角色
          let author = users.find(u => u.name === p.authorName)
          let isAICharacter = false
          
          if (!author) {
            // 检查是否是AI角色
            const aiChar = selectedCharacters.find(c => c.name === p.authorName)
            if (aiChar) {
              const aiInfo = aiCharacters.find(ai => ai.originalName === aiChar.name)
              author = {
                id: aiChar.id,
                name: aiInfo?.forumNickname || aiChar.name,
                avatar: aiInfo?.forumAvatar || aiChar.avatar || '😊',
                bio: aiInfo?.forumSignature || aiChar.signature || ''
              }
              isAICharacter = true
            } else {
              // 默认作者
              author = {
                id: `user_${Math.random()}`,
                name: p.authorName,
                avatar: '😊',
                bio: ''
              }
            }
          }
          
          // 创建帖子对象
          const postObj = {
            id: `post_${Date.now()}_${Math.random()}`,
            authorId: author.id,
            authorName: author.name,
            authorAvatar: author.avatar,
            isVerified: isAICharacter, // AI角色显示认证标记
            content: p.content,
            type: 'text',
            timestamp: Date.now() - Math.random() * 86400000 * 3, // 最近3天
            likeCount: Math.floor(Math.random() * 100) + (isAICharacter ? 50 : 0), // AI角色的帖子更多赞
            commentCount: Math.floor(Math.random() * 50),
            shareCount: Math.floor(Math.random() * 30),
            viewCount: Math.floor(Math.random() * 1000) + 100,
            isLiked: false,
            isFavorited: false,
            tags: p.tags,
            comments: []
          }
          
          allForumPosts.push(postObj)
          return postObj
        })
        topic.postsCount = topic.posts.length
        topic.users = users.slice(0, 15) // 每个话题分配15个用户
      })
      
      // 最终验证
      if (allForumPosts.length === 0) {
        console.error('❌ 没有生成任何帖子！')
        throw new Error('生成失败：没有生成任何帖子，请重试。')
      }
      
      console.log(`💾 准备保存 ${allForumPosts.length} 个帖子到forum_posts`)
      console.log('📊 帖子详情:', allForumPosts.slice(0, 3).map(p => ({
        id: p.id,
        author: p.authorName,
        content: p.content.substring(0, 50)
      })))
      
      // 保存话题列表到localStorage
      localStorage.setItem('forum_topics_list', JSON.stringify(topics))
      
      // 保存帖子到forumStorage
      localStorage.setItem('forum_posts', JSON.stringify(allForumPosts))
      
      // 标记论坛已初始化
      localStorage.setItem('forum_initialized', 'true')
      
      console.log(`✅ 成功保存了 ${allForumPosts.length} 个帖子`)
      
      // 保存角色映射（使用AI生成的论坛昵称和签名）
      const forumProfiles = selectedCharacters.map(c => {
        // 找到AI生成的论坛信息
        const aiInfo = aiCharacters.find(ai => ai.originalName === c.name)
        
        return {
          characterId: c.id,
          originalName: c.name,
          originalAvatar: c.avatar,
          forumName: c.name, // 保持原名
          forumNickname: aiInfo?.forumNickname || c.nickname || c.name,
          forumAvatar: aiInfo?.forumAvatar || '😊',
          forumBio: aiInfo?.forumSignature || c.signature || '',
          forumSignature: aiInfo?.forumSignature || c.signature || '',
          personality: c.personality || c.description || '',
          followersCount: Math.floor(Math.random() * 200) + 50,
          followingCount: Math.floor(Math.random() * 100) + 20,
          influence: 'medium' as const,
          isFollowedByUser: false
        }
      })
      
      console.log('💾 保存论坛角色:', forumProfiles.map(p => `${p.forumName} → ${p.forumNickname}`))
      
      saveForumCharacters(forumProfiles)
      saveSelectedCharacterIds(selectedIds)
      
      setProgress({ current: 3, total: 3, message: '初始化完成！' })
      
      // 显示初始化完成通知
      notifyForumInitComplete()
      
      // 直接跳转到论坛首页（不再需要角色列表页）
      setTimeout(() => {
        navigate('/forum', { replace: true })
      }, 800)
      
    } catch (error) {
      console.error('❌ 初始化失败:', error)
      alert('初始化失败：' + (error as Error).message)
      setInitializing(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f7]">
      {/* 顶部 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {showStatusBar && <StatusBar />}
        
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => step === 2 ? setStep(1) : navigate('/forum/welcome')}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
            disabled={initializing}
          >
            <BackIcon size={22} className="text-gray-800" />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">
            {step === 1 ? '选择角色' : '填写兴趣'}
          </h1>
          <button
            onClick={() => navigate('/create-character')}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
            disabled={initializing || step === 2}
            style={{ opacity: step === 2 ? 0 : 1 }}
          >
            <AddIcon size={20} className="text-[#ff6c00]" />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {step === 1 ? (
          // ========== 第1步：选择角色 ==========
          <>
        {/* 说明 */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 m-4">
          <p className="text-[14px] text-gray-700 leading-relaxed">
            选择要加入论坛的角色，他们将根据自己的性格生成论坛昵称和签名
          </p>  钱钱钱钱钱1·11  







          
        </div>

        {/* 统计和全选 */}
        <div className="flex items-center justify-between px-4 py-3 bg-white mb-2">
          <span className="text-[14px] text-gray-600">
            已选择 <span className="text-[#ff6c00] font-semibold">{selectedIds.length}</span> / {characters.length} 个角色
          </span>
          <button
            onClick={toggleSelectAll}
            className="text-[14px] text-[#ff6c00] active:opacity-60"
            disabled={initializing}
          >
            {selectedIds.length === characters.length ? '全不选' : '全选'}
          </button>
        </div>

        {/* 角色列表 */}
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mb-4 opacity-30">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2"/>
            </svg>
            <p className="text-[14px] mb-4">还没有角色</p>
            <button
              onClick={() => navigate('/create-character')}
              className="px-6 py-2.5 bg-[#ff6c00] text-white rounded-full text-[14px] active:opacity-80"
            >
              创建第一个角色
            </button>
          </div>
        ) : (
          <div className="bg-white">
            {characters.map((character) => {
              const isSelected = selectedIds.includes(character.id)
              
              return (
                <button
                  key={character.id}
                  onClick={() => !initializing && toggleSelect(character.id)}
                  disabled={initializing}
                  className="w-full flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors"
                >
                  {/* 复选框 */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected 
                      ? 'border-[#ff6c00] bg-[#ff6c00]' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* 头像 */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {character.avatar.startsWith('data:') ? (
                      <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {character.avatar}
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[15px] font-medium text-gray-900 truncate">
                      {character.name}
                    </div>
                    <div className="text-[13px] text-gray-500 truncate">
                      {character.signature || character.description.substring(0, 30)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
          </>
        ) : (
          // ========== 第2步：填写兴趣 ==========
          <>
            {/* 说明 */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-4">
              <p className="text-[14px] text-gray-700 leading-relaxed">
                告诉我们你的兴趣，我们将根据你的喜好生成个性化的话题和帖子
              </p>
            </div>

            {/* 表单 */}
            <div className="bg-white p-4 space-y-4">
              <div>
                <label className="block text-[15px] font-medium text-gray-900 mb-2">
                  你的兴趣爱好 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="例如：游戏、科技、美食、旅行"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#ff6c00]"
                  disabled={initializing}
                />
                <p className="text-[12px] text-gray-500 mt-1">用逗号分隔多个兴趣</p>
              </div>

              <div>
                <label className="block text-[15px] font-medium text-gray-900 mb-2">
                  最近关注的热点
                </label>
                <input
                  type="text"
                  value={hotTopics}
                  onChange={(e) => setHotTopics(e.target.value)}
                  placeholder="例如：原神新版本、AI绘画、最新电影"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#ff6c00]"
                  disabled={initializing}
                />
              </div>

              <div>
                <label className="block text-[15px] font-medium text-gray-900 mb-2">
                  帖子风格偏好
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['轻松', '正经', '抽象'].map((style) => (
                    <button
                      key={style}
                      onClick={() => setPostStyle(style)}
                      disabled={initializing}
                      className={`py-2.5 rounded-lg text-[14px] font-medium transition-all ${
                        postStyle === style
                          ? 'bg-[#ff6c00] text-white'
                          : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 已选角色预览 */}
            <div className="bg-white mt-2 p-4">
              <div className="text-[14px] text-gray-600 mb-3">
                已选择 {selectedIds.length} 个角色
              </div>
              <div className="flex flex-wrap gap-2">
                {characters.filter(c => selectedIds.includes(c.id)).map((character) => (
                  <div
                    key={character.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full"
                  >
                    <span className="text-lg">{character.avatar}</span>
                    <span className="text-[13px] text-gray-700">{character.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="p-4 bg-white border-t border-gray-100">
        <button
          onClick={step === 1 ? handleNext : handleInitialize}
          disabled={(step === 1 && selectedIds.length === 0) || (step === 2 && !interests.trim()) || initializing}
          className={`w-full py-3.5 rounded-full text-[16px] font-semibold transition-all ${
            ((step === 1 && selectedIds.length === 0) || (step === 2 && !interests.trim())) || initializing
              ? 'bg-gray-200 text-gray-400'
              : 'bg-gradient-to-r from-[#ff8140] to-[#ff6c00] text-white active:scale-98 shadow-lg'
          }`}
        >
          {initializing ? progress.message : step === 1 ? `下一步 (${selectedIds.length})` : '开始生成论坛'}
        </button>

        {/* 跳过按钮 */}
        {!initializing && (
          <button
            onClick={handleSkip}
            className="w-full mt-3 py-3 text-[14px] text-gray-500 active:opacity-60 transition-opacity"
          >
            跳过，稍后再配置
          </button>
        )}
        
        {/* 进度条 */}
        {initializing && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[12px] text-gray-500 mb-1">
              <span>{progress.current} / {progress.total}</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#ff8140] to-[#ff6c00] transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForumInitialize


