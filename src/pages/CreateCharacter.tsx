import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import { ImageIcon } from '../components/Icons'
import { useCharacter } from '../context/CharacterContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { toPinyin } from '../utils/pinyin'
import { extractCharacterCardFromPNG, convertCharacterCardToInternal } from '../utils/characterCardParser'
import { lorebookManager } from '../utils/lorebookSystem'

const CreateCharacter = () => {
  const navigate = useNavigate()
  const { addCharacter } = useCharacter()
  const { showStatusBar } = useSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const characterCardInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    avatar: '',
    signature: '',
    description: '',
    // Character Card 扩展字段
    personality: '',
    scenario: '',
    firstMessage: '',
    exampleMessages: '',
    systemPrompt: '',
    alternateGreetings: [] as string[],
    characterBook: undefined as any,
    tags: [] as string[],
    creator: ''
  })

  const [avatarPreview, setAvatarPreview] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // 处理头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setIsUploading(true)

    // 读取图片并转换为base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setAvatarPreview(base64String)
      setFormData({ ...formData, avatar: base64String })
      setIsUploading(false)
    }
    reader.onerror = () => {
      alert('图片读取失败')
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // 处理 Character Card PNG 导入
  const handleCharacterCardImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查是否为 PNG 文件
    if (!file.type.includes('png')) {
      alert('请选择 PNG 格式的 Character Card 文件')
      return
    }

    setIsImporting(true)

    try {
      // 提取 Character Card 数据
      const characterCard = await extractCharacterCardFromPNG(file)
      
      if (!characterCard) {
        throw new Error('无法解析 Character Card 数据')
      }
      
      // 同时读取图片作为头像
      const reader = new FileReader()
      reader.onloadend = () => {
        const imageDataUrl = reader.result as string
        
        // 转换为内部格式
        const converted = convertCharacterCardToInternal(characterCard, imageDataUrl)
        
        // 调试：检查世界书数据
        console.log('Character Card 数据:', characterCard)
        console.log('转换后的数据:', converted)
        console.log('世界书数据:', converted.characterBook)
        if (converted.characterBook) {
          console.log('世界书条目数:', converted.characterBook.entries?.length || 0)
        }
        
        // 填充表单
        setFormData({
          name: converted.name,
          username: converted.username,
          avatar: converted.avatar,
          signature: converted.signature,
          description: converted.description,
          personality: converted.personality || '',
          scenario: converted.scenario || '',
          firstMessage: converted.firstMessage || '',
          exampleMessages: converted.exampleMessages || '',
          systemPrompt: converted.systemPrompt || '',
          alternateGreetings: converted.alternateGreetings || [],
          characterBook: converted.characterBook,
          tags: converted.tags || [],
          creator: converted.creator || ''
        })
        
        setAvatarPreview(imageDataUrl)
        setIsImporting(false)
        
        // 如果包含世界书，询问是否导入
        let lorebookImported = false
        if (converted.characterBook && converted.characterBook.entries && converted.characterBook.entries.length > 0) {
          const entryCount = converted.characterBook.entries.length
          const shouldImport = confirm(
            `检测到角色卡包含世界书（${entryCount} 个条目）\n\n是否同时导入到世界书系统？\n\n` +
            `• 点击"确定"：导入世界书并关联到该角色\n` +
            `• 点击"取消"：仅保存在角色数据中`
          )
          
          if (shouldImport) {
            try {
              // 转换为世界书格式
              const lorebookData = {
                name: `${converted.name}的世界书`,
                description: `从 Character Card 导入的世界书`,
                entries: converted.characterBook.entries || [],
                scan_depth: converted.characterBook.scan_depth || 10,
                token_budget: converted.characterBook.token_budget || 2000,
                recursive_scanning: converted.characterBook.recursive_scanning || false,
                is_global: false,
                character_ids: [] // 保存后会自动关联
              }
              
              // 导入世界书
              const importedLorebook = lorebookManager.importLorebook(JSON.stringify(lorebookData))
              if (importedLorebook) {
                lorebookImported = true
                console.log('世界书导入成功:', importedLorebook.name)
              }
            } catch (error) {
              console.error('世界书导入失败:', error)
              alert('世界书导入失败，但角色数据已保留')
            }
          }
        }
        
        // 显示成功提示
        const cardVersion = (characterCard as any).spec === 'chara_card_v2' ? 'V2' : 'V1'
        const lorebookMsg = lorebookImported ? '\n✅ 世界书已导入' : ''
        alert(`✅ 成功导入 Character Card ${cardVersion}!\n\n角色名: ${converted.name}\n创建者: ${converted.creator || '未知'}${lorebookMsg}`)
      }
      
      reader.onerror = () => {
        alert('图片读取失败')
        setIsImporting(false)
      }
      
      reader.readAsDataURL(file)
      
    } catch (error: any) {
      console.error('导入 Character Card 失败:', error)
      alert(`导入失败: ${error.message || '未知错误'}`)
      setIsImporting(false)
    }
    
    // 清空输入，允许重复导入同一文件
    e.target.value = ''
  }

  // 处理名字变化，自动生成微信号
  const handleNameChange = (name: string) => {
    setFormData(prev => {
      // 如果微信号为空或者是自动生成的，则自动更新
      const isAutoGenerated = !prev.username || prev.username.startsWith('wxid_')
      if (isAutoGenerated && name) {
        const pinyin = toPinyin(name)
        return {
          ...prev,
          name,
          username: `wxid_${pinyin || Date.now().toString().slice(-6)}`
        }
      }
      return { ...prev, name }
    })
  }

  const handleCreate = () => {
    if (!formData.name.trim()) {
      alert('请输入角色名字')
      return
    }

    // 如果没有微信号，自动生成
    const username = formData.username || `wxid_${toPinyin(formData.name) || Date.now().toString().slice(-6)}`

    // 如果没有上传头像，使用默认表情
    const avatar = formData.avatar || '🤖'

    try {
      const characterData = {
        name: formData.name,
        username,
        avatar,
        signature: formData.signature || '这个人很懒，什么都没留下',
        description: formData.description,
        // Character Card 扩展字段（只保存非空值）
        personality: formData.personality || undefined,
        scenario: formData.scenario || undefined,
        firstMessage: formData.firstMessage || undefined,
        exampleMessages: formData.exampleMessages || undefined,
        systemPrompt: formData.systemPrompt || undefined,
        alternateGreetings: formData.alternateGreetings.length > 0 ? formData.alternateGreetings : undefined,
        characterBook: formData.characterBook,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        creator: formData.creator || undefined
      }
      
      // 检查数据大小
      let dataSize = 0
      try {
        dataSize = JSON.stringify(characterData).length
        console.log('角色数据大小:', (dataSize / 1024).toFixed(2), 'KB')
      } catch (stringifyError) {
        console.error('JSON序列化失败:', stringifyError)
        throw new Error('角色数据包含无法序列化的内容')
      }
      
      if (dataSize > 5 * 1024 * 1024) { // 5MB
        throw new Error('角色数据过大（超过5MB），请减少内容或移除世界书')
      }
      
      console.log('准备保存角色...')
      addCharacter(characterData)
      console.log('角色保存成功，准备跳转...')
      
      // 使用 setTimeout 确保状态更新完成
      setTimeout(() => {
        navigate('/wechat/contacts')
      }, 100)
    } catch (error: any) {
      console.error('创建角色失败:', error)
      if (error.message) {
        alert(`创建失败：${error.message}`)
      } else if (error.name === 'QuotaExceededError') {
        alert('存储空间不足！请到设置中清理缓存。')
      } else {
        alert('创建失败！请查看控制台了解详情。')
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部：StatusBar + 导航栏一体化 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="ios-button text-gray-700 hover:text-gray-900"
        >
          取消
        </button>
        <h1 className="text-base font-semibold text-gray-900">
          创建角色
        </h1>
        <button
          onClick={handleCreate}
          className="ios-button text-primary font-medium"
        >
          完成
        </button>
        </div>
      </div>

      {/* 创建表单 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3">
        {/* 导入 Character Card - 简洁版 */}
        <div className="mb-3 px-1">
          <input
            ref={characterCardInputRef}
            type="file"
            accept=".png"
            onChange={handleCharacterCardImport}
            className="hidden"
          />
          <button
            onClick={() => characterCardInputRef.current?.click()}
            disabled={isImporting}
            className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 ios-button w-full hover:bg-white/50 transition-all"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">正在导入...</div>
                </div>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-gray-900">导入 Character Card</div>
                  <div className="text-xs text-gray-500">PNG 格式 (V1/V2)</div>
                </div>
              </>
            )}
          </button>
        </div>

        {/* 上传头像 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">角色头像</span>
            <p className="text-xs text-gray-400 mt-1">可选，不上传将使用默认头像。支持 JPG、PNG、GIF 等格式</p>
          </div>
          <div className="glass-card rounded-2xl p-6 flex justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="relative w-32 h-32 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center ios-button overflow-hidden"
            >
              {avatarPreview ? (
                <>
                  <img
                    src={avatarPreview}
                    alt="头像预览"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <span className="text-white opacity-0 hover:opacity-100 text-sm">点击更换</span>
                  </div>
                </>
              ) : (
                <>
                  {isUploading ? (
                    <div className="text-gray-400">上传中...</div>
                  ) : (
                    <>
                      <ImageIcon size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">上传头像</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">角色信息</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <label className="block text-xs text-gray-500 mb-1">角色名字 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="请输入角色名字"
                maxLength={20}
                className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="px-4 py-3 border-b border-gray-100">
              <label className="block text-xs text-gray-500 mb-1">
                角色ID账号
                <span className="text-gray-400 ml-2">（留空自动生成）</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder={`wxid_${toPinyin(formData.name) || 'auto'}`}
                className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="px-4 py-3 border-b border-gray-100">
              <label className="block text-xs text-gray-500 mb-1">个性签名</label>
              <textarea
                value={formData.signature}
                onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                placeholder="显示在用户资料的个性签名"
                maxLength={100}
                className="w-full h-16 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 resize-none"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {formData.signature.length}/100
              </div>
            </div>

            <div className="px-4 py-3">
              <label className="block text-xs text-gray-500 mb-1">AI角色描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述AI角色的背景、性格、说话风格等，用于AI角色扮演（建议详细描述，字数越多AI理解越准确）"
                maxLength={5000}
                className="w-full h-48 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 resize-none"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {formData.description.length}/5000
              </div>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="text-xs text-gray-500 space-y-2">
            <p>• <strong>角色名字：</strong>必填，用于显示在微信界面中</p>
            <p>• <strong>角色ID：</strong>可选，不填写系统会自动根据名字拼音生成</p>
            <p>• <strong>个性签名：</strong>可选，显示在用户资料页</p>
            <p>• <strong>AI角色描述：</strong>可选，描述AI的背景、性格、说话方式等</p>
            <p>• <strong>头像：</strong>可选，不上传将使用默认机器人表情</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCharacter

