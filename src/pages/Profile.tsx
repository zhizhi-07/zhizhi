import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { BackIcon, ImageIcon } from '../components/Icons'
import { useUser } from '../context/UserContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const Profile = () => {
  const navigate = useNavigate()
  const { currentUser, updateUser } = useUser()
  const { showStatusBar } = useSettings()
  
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editingField === 'signature' && textareaRef.current) {
      textareaRef.current.focus()
    } else if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingField])

  if (!currentUser) return null

  const isCustomAvatar = currentUser.avatar && currentUser.avatar.startsWith('data:image')

  const handleStartEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue)
  }

  const handleSave = (field: string) => {
    if (editValue.trim()) {
      updateUser(currentUser.id, { [field]: editValue })
    }
    setEditingField(null)
    setEditValue('')
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && field !== 'signature') {
      handleSave(field)
    } else if (e.key === 'Escape') {
      handleCancel()
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
          className="ios-button text-gray-700 hover:text-gray-900 -ml-2"
        >
          <BackIcon size={24} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
          个人信息
        </h1>
        <div className="w-6"></div>
        </div>
      </div>

      {/* 个人信息内容 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3">
        {/* 头像 */}
        <div className="mb-3">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div 
              onClick={() => navigate('/edit-profile', { state: { field: 'avatar' } })}
              className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer"
            >
              <span className="text-gray-900 font-medium">头像</span>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center shadow-lg overflow-hidden">
                  {isCustomAvatar && currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-gray-400" />
                  )}
                </div>
                <span className="text-gray-400 text-xl">›</span>
              </div>
            </div>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="mb-3">
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* 名字 */}
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">名字</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  {editingField === 'name' ? (
                    <>
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'name')}
                        maxLength={20}
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 text-right"
                        placeholder="请输入名字"
                      />
                      <button
                        onClick={handleCancel}
                        className="text-sm text-gray-500 ios-button whitespace-nowrap"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleSave('name')}
                        className="text-sm text-primary font-medium ios-button whitespace-nowrap"
                      >
                        保存
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => handleStartEdit('name', currentUser.name)}
                      className="text-gray-600 ios-button cursor-pointer"
                    >
                      {currentUser.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 网名 */}
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">网名</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  {editingField === 'nickname' ? (
                    <>
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'nickname')}
                        maxLength={20}
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 text-right"
                        placeholder="请输入网名"
                      />
                      <button
                        onClick={handleCancel}
                        className="text-sm text-gray-500 ios-button whitespace-nowrap"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleSave('nickname')}
                        className="text-sm text-primary font-medium ios-button whitespace-nowrap"
                      >
                        保存
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => handleStartEdit('nickname', currentUser.nickname || '')}
                      className="text-gray-600 ios-button cursor-pointer"
                    >
                      {currentUser.nickname || '未设置'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 微信号 */}
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">微信号</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  {editingField === 'username' ? (
                    <>
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'username')}
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 text-right"
                        placeholder="请输入微信号"
                      />
                      <button
                        onClick={handleCancel}
                        className="text-sm text-gray-500 ios-button whitespace-nowrap"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleSave('username')}
                        className="text-sm text-primary font-medium ios-button whitespace-nowrap"
                      >
                        保存
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => handleStartEdit('username', currentUser.username)}
                      className="text-gray-500 ios-button cursor-pointer"
                    >
                      {currentUser.username}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 个性签名 */}
            <div className="px-4 py-4">
              <div className="flex items-start justify-between">
                <span className="text-gray-900 font-medium pt-1">个性签名</span>
                <div className="flex-1 ml-4">
                  {editingField === 'signature' ? (
                    <div>
                      <textarea
                        ref={textareaRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        maxLength={100}
                        className="w-full h-20 bg-transparent border-none outline-none text-gray-900 resize-none"
                        placeholder="填写个性签名"
                      />
                      <div className="flex gap-2 justify-end mt-2">
                        <button
                          onClick={handleCancel}
                          className="text-sm text-gray-500 ios-button"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleSave('signature')}
                          className="text-sm text-primary font-medium ios-button"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleStartEdit('signature', currentUser.signature)}
                      className="text-gray-600 ios-button cursor-pointer min-h-[24px]"
                    >
                      {currentUser.signature}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 更多信息 */}
        <div className="mb-3">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer border-b border-gray-100">
              <span className="text-gray-900 font-medium">地区</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">未设置</span>
                <span className="text-gray-400 text-xl">›</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer">
              <span className="text-gray-900 font-medium">更多</span>
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </div>
        </div>

        {/* 切换账号 */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/user-list')}
            className="w-full glass-card rounded-2xl px-4 py-4 text-primary font-medium ios-button"
          >
            切换账号
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile

