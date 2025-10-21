import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon, ImageIcon } from '../components/Icons'
import { useUser } from '../context/UserContext'
import { useMoments } from '../context/MomentsContext'
import { useCharacter } from '../context/CharacterContext'
import { batchAIInteractWithMoment } from '../utils/aiMomentsSocial'

const PublishMoment = () => {
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const { addMoment, likeMoment, addComment } = useMoments()
  const { characters } = useCharacter()
  const [content, setContent] = useState('')
  const [location, setLocation] = useState('')
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [images, setImages] = useState<Array<{id: string, url: string}>>([])
  const [isPublishing, setIsPublishing] = useState(false)

  // 触发AI角色查看朋友圈（批量处理，只调用一次API）
  const triggerAIInteractions = async (momentId: string, momentData: any) => {
    // 获取所有启用了AI朋友圈功能的角色
    const enabledCharacters = characters.filter(char => {
      const enabled = localStorage.getItem(`ai_moments_enabled_${char.id}`)
      return enabled === 'true'
    })

    if (enabledCharacters.length === 0) {
      console.log('📭 没有角色启用AI朋友圈功能')
      return
    }

    console.log(`🎬 批量处理 ${enabledCharacters.length} 个AI角色的决策（只调用1次API）`)
    
    try {
      // 准备所有角色的数据
      const charactersData = enabledCharacters.map(character => {
        const chatMessages = localStorage.getItem(`chat_messages_${character.id}`)
        const recentMessages = chatMessages 
          ? JSON.parse(chatMessages).slice(-10).map((msg: any) => ({
              role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
              content: msg.content
            }))
          : []

        return {
          id: character.id,
          name: character.name,
          description: character.description || '',
          recentMessages
        }
      })

      // 批量调用AI（只调用一次API）
      const results = await batchAIInteractWithMoment(
        charactersData,
        {
          id: momentId,
          userId: momentData.userId,
          userName: momentData.userName,
          userAvatar: momentData.userAvatar,
          content: momentData.content,
          images: momentData.images,
          likes: [],
          comments: [],
          location: momentData.location,
          createdAt: new Date().toISOString()
        }
      )

      // 处理结果
      const existingComments: string[] = []
      
      results.forEach(result => {
        const character = enabledCharacters.find(c => c.id === result.characterId)
        if (!character) return

        console.log(`💭 ${result.characterName} 的决定: ${result.action} ${result.reason || ''}`)

        if (result.action === 'like') {
          console.log(`👍 ${result.characterName} 决定点赞，正在执行...`)
          likeMoment(momentId, result.characterId, result.characterName, character.avatar)
          console.log(`✅ ${result.characterName} 点赞成功！`)
        } else if (result.action === 'comment' && result.comment) {
          // 检查是否与已有评论重复
          const cleanComment = result.comment.replace(/@\S+\s*/g, '').toLowerCase().trim()
          const isDuplicate = existingComments.some(existing => {
            const cleanExisting = existing.replace(/@\S+\s*/g, '').toLowerCase().trim()
            return cleanExisting === cleanComment
          })
          
          if (isDuplicate) {
            console.log(`🔁 ${result.characterName} 的评论与已有评论重复，跳过: ${result.comment}`)
          } else {
            addComment(momentId, result.characterId, result.characterName, character.avatar, result.comment)
            console.log(`💬 ${result.characterName} 评论了: ${result.comment}`)
            existingComments.push(result.comment.toLowerCase().trim())
          }
        } else {
          console.log(`😶 ${result.characterName} 选择跳过`)
        }
      })
    } catch (error) {
      console.error(`❌ 批量AI互动失败:`, error)
    }
  }

  // 处理图片上传
  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length === 0) return
      
      // 最多9张图片
      const remainingSlots = 9 - images.length
      const filesToProcess = files.slice(0, remainingSlots)
      
      filesToProcess.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          alert('图片大小不能超过5MB')
          return
        }
        
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageData = event.target?.result as string
          setImages(prev => [...prev, {
            id: `img_${Date.now()}_${Math.random()}`,
            url: imageData
          }])
        }
        reader.readAsDataURL(file)
      })
    }
    input.click()
  }
  
  // 删除图片
  const handleRemoveImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handlePublish = async () => {
    if (!currentUser || !content.trim()) return
    
    setIsPublishing(true)

    const momentData = {
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: content.trim(),
      images: images,
      location: location.trim() || undefined
    }

    // 生成朋友圈ID
    const momentId = Date.now().toString()
    
    // 添加朋友圈
    addMoment(momentData)

    // 延迟触发AI互动，确保朋友圈已经添加到列表中，并且localStorage已更新
    setTimeout(() => {
      triggerAIInteractions(momentId, momentData)
    }, 500)

    navigate('/moments', { replace: true })
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶部导航栏 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <button 
          onClick={() => navigate('/moments', { replace: true })}
          className="flex items-center gap-2 text-gray-700 ios-button"
        >
          <BackIcon size={20} />
          <span className="text-base">取消</span>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">发表文字</h1>
        <button 
          onClick={handlePublish}
          disabled={!content.trim() || isPublishing}
          className="px-4 py-1.5 rounded-full bg-green-500 text-white text-sm font-medium ios-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing ? '发布中...' : '发表'}
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 bg-gray-50">
        {/* 文字输入 */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="这一刻的想法..."
            className="w-full bg-transparent outline-none resize-none text-base text-gray-800 placeholder-gray-400 leading-relaxed"
            rows={8}
            autoFocus
          />
        </div>

        {/* 图片上传区域 */}
        {images.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              {images.map((image) => (
                <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={image.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <button 
                  onClick={handleImageUpload}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 ios-button hover:border-blue-400 hover:text-blue-400 transition-colors"
                >
                  <div className="text-center">
                    <ImageIcon size={24} className="mx-auto mb-1" />
                    <span className="text-xs">添加</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
        
        {images.length === 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <button 
              onClick={handleImageUpload}
              className="w-full aspect-square max-w-[120px] rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 ios-button hover:border-blue-400 hover:text-blue-400 transition-colors"
            >
              <div className="text-center">
                <ImageIcon size={32} className="mx-auto mb-2" />
                <span className="text-xs">添加图片</span>
              </div>
            </button>
          </div>
        )}

        {/* 功能选项 */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={() => setShowLocationInput(!showLocationInput)}
            className="w-full flex items-center justify-between px-4 py-4 ios-button"
          >
            <span className="text-gray-700 font-medium">所在位置</span>
            <span className="text-gray-400 text-xl">›</span>
          </button>

          {showLocationInput && (
            <div className="px-4 pb-4">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="输入位置信息"
                className="w-full px-4 py-2 rounded-lg bg-gray-50 outline-none text-sm text-gray-800 placeholder-gray-400"
              />
            </div>
          )}

          <div className="border-t border-gray-100" />

          <button className="w-full flex items-center justify-between px-4 py-4 ios-button">
            <span className="text-gray-700 font-medium">提醒谁看</span>
            <span className="text-gray-400 text-xl">›</span>
          </button>

          <div className="border-t border-gray-100" />

          <button className="w-full flex items-center justify-between px-4 py-4 ios-button">
            <span className="text-gray-700 font-medium">谁可以看</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">公开</span>
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PublishMoment

