import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBackground } from '../context/BackgroundContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { getCouplePhotos, type CoupleAlbumPhoto } from '../utils/coupleSpaceContentUtils'

const CoupleAlbum = () => {
  const navigate = useNavigate()
  const { background, getBackgroundStyle } = useBackground()
  const { showStatusBar } = useSettings()
  const [photos, setPhotos] = useState<CoupleAlbumPhoto[]>([])

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = () => {
    const allPhotos = getCouplePhotos()
    setPhotos(allPhotos)
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return '今天'
    } else if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
    }
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0" style={getBackgroundStyle()} />
      <div className="relative z-10 h-full flex flex-col">
        {/* 顶部栏 */}
        <div className={`sticky top-0 z-50 ${background ? 'glass-dark' : 'glass-effect'}`}>
          {showStatusBar && <StatusBar />}
          <div className="flex items-center justify-between px-5 py-4">
            <button 
              onClick={() => navigate(-1)}
              className="text-blue-500 ios-button"
            >
              返回
            </button>
            <h1 className="text-lg font-semibold text-gray-900">相册</h1>
            <button className="text-blue-500 ios-button">
              上传
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-6">
          {photos.length === 0 ? (
            /* 空状态 */
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="w-full max-w-md">
                <div className="glass-card rounded-3xl p-8 text-center space-y-6 shadow-xl border border-white/20">
                  <div className="w-24 h-24 mx-auto rounded-full glass-card flex items-center justify-center shadow-lg border border-white/30">
                    <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">暂无照片</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      在聊天中让AI用 [相册:描述] 分享照片
                      <br />
                      记录每一个甜蜜时刻
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 照片列表 */
            <div className="space-y-4 pb-6">
              {photos.map(photo => (
                <div key={photo.id} className="glass-card rounded-2xl p-4 border border-white/20 shadow-lg">
                  <div className="flex items-start space-x-3">
                    {/* 头像 */}
                    <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center flex-shrink-0 border border-white/30">
                      <span className="text-sm font-bold text-gray-700">{photo.characterName[0]}</span>
                    </div>
                    
                    {/* 内容 */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{photo.characterName}</span>
                        <span className="text-xs text-gray-500">{formatTime(photo.timestamp)}</span>
                      </div>
                      
                      {/* 照片描述 */}
                      <div className="glass-card rounded-xl p-3 border border-white/20 bg-white/50">
                        <div className="flex items-start space-x-2">
                          <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-700 leading-relaxed">{photo.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CoupleAlbum
