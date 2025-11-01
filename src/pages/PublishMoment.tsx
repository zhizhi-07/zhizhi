import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon, ImageIcon } from '../components/Icons'
import { useUser } from '../context/UserContext'
import { useMoments } from '../context/MomentsContext'
import { useCharacter } from '../context/CharacterContext'

const PublishMoment = () => {
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const { addMoment } = useMoments()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  const [content, setContent] = useState('')
  const [location, setLocation] = useState('')
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [images, setImages] = useState<Array<{id: string, url: string}>>([])
  const [isPublishing, setIsPublishing] = useState(false)
  
  // 提醒谁看
  const [showRemindSelector, setShowRemindSelector] = useState(false)
  const [remindUsers, setRemindUsers] = useState<string[]>([])
  
  // 谁可以看
  const [showVisibilitySelector, setShowVisibilitySelector] = useState(false)
  const [visibility, setVisibility] = useState<'public' | 'private' | 'partial'>('public')
  const [visibleTo, setVisibleTo] = useState<string[]>([])

  // 旧的AI互动系统已删除，现在由AI社交总监（useMomentsSocial）统一处理

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
      location: location.trim() || undefined,
      visibility: visibility,
      visibleTo: visibility === 'partial' ? visibleTo : [],
      remindUsers: remindUsers
    }

    // 生成朋友圈ID
    const momentId = Date.now().toString()
    
    // 添加朋友圈
    addMoment(momentData)
    
    // 给被提醒的用户发送通知
    if (remindUsers.length > 0) {
      remindUsers.forEach(userId => {
        const character = characters.find(c => c.id === userId)
        if (character) {
          const chatMessages = localStorage.getItem(`chat_messages_${userId}`)
          const messages = chatMessages ? JSON.parse(chatMessages) : []
          
          const remindMessage = {
            id: Date.now() + Math.random(),
            type: 'system',
            content: `💬 ${currentUser.name} 提醒你查看Ta的朋友圈`,
            time: new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            timestamp: Date.now(),
            messageType: 'system',
            isHidden: false
          }
          
          messages.push(remindMessage)
          localStorage.setItem(`chat_messages_${userId}`, JSON.stringify(messages))
          console.log(`📬 已向 ${character.name} 发送朋友圈提醒`)
        }
      })
    }

    // 为每个启用AI朋友圈的角色添加聊天记录
    characters.forEach(character => {
      const enabled = localStorage.getItem(`ai_moments_enabled_${character.id}`)
      if (enabled === 'true') {
        const chatMessages = localStorage.getItem(`chat_messages_${character.id}`)
        const messages = chatMessages ? JSON.parse(chatMessages) : []
        
        // 构建朋友圈消息内容
        let momentContent = `📸 你发布了朋友圈：${content.trim()}`
        if (images.length > 0) {
          momentContent += ` [${images.length}张图片]`
        }
        if (location.trim()) {
          momentContent += ` 📍${location.trim()}`
        }
        
        // 添加系统消息到聊天记录
        const systemMessage = {
          id: Date.now() + Math.random(),
          type: 'system',
          content: momentContent,
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'system',
          isHidden: false
        }
        
        messages.push(systemMessage)
        localStorage.setItem(`chat_messages_${character.id}`, JSON.stringify(messages))
        console.log(`💾 朋友圈已同步到与 ${character.name} 的聊天记录`)
      }
    })

    // AI互动现在由AI社交总监系统（useMomentsSocial）统一处理
    console.log('✅ 朋友圈已发布，AI社交总监将自动安排互动')

    navigate('/moments', { replace: true })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {showStatusBar && <StatusBar />}
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

          <button 
            onClick={() => setShowRemindSelector(true)}
            className="w-full flex items-center justify-between px-4 py-4 ios-button"
          >
            <span className="text-gray-700 font-medium">提醒谁看</span>
            <div className="flex items-center gap-2">
              {remindUsers.length > 0 && (
                <span className="text-gray-400 text-sm">{remindUsers.length}人</span>
              )}
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </button>

          <div className="border-t border-gray-100" />

          <button 
            onClick={() => setShowVisibilitySelector(true)}
            className="w-full flex items-center justify-between px-4 py-4 ios-button"
          >
            <span className="text-gray-700 font-medium">谁可以看</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">
                {visibility === 'public' ? '公开' : visibility === 'private' ? '私密' : `${visibleTo.length}人可见`}
              </span>
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </button>
        </div>
      </div>

      {/* 提醒谁看选择器 */}
      {showRemindSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowRemindSelector(false)}>
          <div 
            className="bg-white w-full rounded-t-3xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">提醒谁看</h2>
              <button 
                onClick={() => setShowRemindSelector(false)}
                className="text-blue-500 font-medium ios-button"
              >
                完成
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {characters.map((character) => {
                const isSelected = remindUsers.includes(character.id)
                return (
                  <button
                    key={character.id}
                    onClick={() => {
                      if (isSelected) {
                        setRemindUsers(prev => prev.filter(id => id !== character.id))
                      } else {
                        setRemindUsers(prev => [...prev, character.id])
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl ios-button transition-colors"
                  >
                    <img 
                      src={character.avatar} 
                      alt={character.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 text-left">
                      <div className="text-base font-medium text-gray-900">{character.name}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <span className="text-white text-sm">✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 谁可以看选择器 */}
      {showVisibilitySelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowVisibilitySelector(false)}>
          <div 
            className="bg-white w-full rounded-t-3xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">谁可以看</h2>
              <button 
                onClick={() => setShowVisibilitySelector(false)}
                className="text-blue-500 font-medium ios-button"
              >
                完成
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* 可见性选项 */}
              <div className="p-4 space-y-2">
                <button
                  onClick={() => {
                    setVisibility('public')
                    setVisibleTo([])
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 ios-button transition-colors"
                >
                  <span className="text-base text-gray-900">公开</span>
                  {visibility === 'public' && <span className="text-green-500 text-lg">✓</span>}
                </button>
                <button
                  onClick={() => {
                    setVisibility('private')
                    setVisibleTo([])
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 ios-button transition-colors"
                >
                  <span className="text-base text-gray-900">私密</span>
                  {visibility === 'private' && <span className="text-green-500 text-lg">✓</span>}
                </button>
                <button
                  onClick={() => {
                    if (visibility !== 'partial') {
                      setVisibility('partial')
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 ios-button transition-colors"
                >
                  <span className="text-base text-gray-900">部分可见</span>
                  {visibility === 'partial' && <span className="text-green-500 text-lg">✓</span>}
                </button>
              </div>

              {/* 部分可见时显示用户选择 */}
              {visibility === 'partial' && (
                <div className="border-t border-gray-100 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">选择可见用户</h3>
                  {characters.map((character) => {
                    const isSelected = visibleTo.includes(character.id)
                    return (
                      <button
                        key={character.id}
                        onClick={() => {
                          if (isSelected) {
                            setVisibleTo(prev => prev.filter(id => id !== character.id))
                          } else {
                            setVisibleTo(prev => [...prev, character.id])
                          }
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl ios-button transition-colors"
                      >
                        <img 
                          src={character.avatar} 
                          alt={character.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900">{character.name}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublishMoment

