/**
 * ForumVideo.tsx - 论坛视频页面
 * 
 * 视频内容流，类似抖音/快手的竖屏视频列表
 * 
 * @module pages/ForumVideo
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon, SearchIcon, AddIcon } from '../components/Icons'

interface VideoPost {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  title: string
  videoUrl: string
  thumbnail: string
  duration: number
  likeCount: number
  commentCount: number
  shareCount: number
  viewCount: number
  isLiked: boolean
}

const ForumVideo = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [videos, setVideos] = useState<VideoPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 加载视频数据
    loadVideos()
  }, [])

  const loadVideos = () => {
    // 模拟视频数据
    const mockVideos: VideoPost[] = [
      {
        id: '1',
        authorId: 'v1',
        authorName: '视频创作者1',
        authorAvatar: '',
        title: '有趣的视频内容',
        videoUrl: '',
        thumbnail: '',
        duration: 60,
        likeCount: 1200,
        commentCount: 89,
        shareCount: 45,
        viewCount: 8900,
        isLiked: false,
      },
      {
        id: '2',
        authorId: 'v2',
        authorName: '视频创作者2',
        authorAvatar: '',
        title: '精彩瞬间分享',
        videoUrl: '',
        thumbnail: '',
        duration: 45,
        likeCount: 2300,
        commentCount: 156,
        shareCount: 78,
        viewCount: 15600,
        isLiked: false,
      },
    ]
    
    setVideos(mockVideos)
    setLoading(false)
  }

  const formatCount = (count: number): string => {
    if (count < 1000) return count.toString()
    if (count < 10000) return (count / 1000).toFixed(1) + 'k'
    return (count / 10000).toFixed(1) + 'w'
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶部玻璃白色区域 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {showStatusBar && <StatusBar />}
        
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate('/forum')}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
          >
            <BackIcon size={22} className="text-gray-800" />
          </button>

          <h1 className="text-[17px] font-semibold text-gray-900">视频</h1>

          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center active:opacity-60">
              <SearchIcon size={20} className="text-gray-800" />
            </button>
            <button
              onClick={() => navigate('/forum/publish')}
              className="w-9 h-9 flex items-center justify-center active:opacity-60"
            >
              <AddIcon size={20} className="text-[#ff6c00]" />
            </button>
          </div>
        </div>
      </div>

      {/* 视频列表 */}
      <div className="flex-1 overflow-y-auto bg-[#f7f7f7]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-3 border-[#ff6c00] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-2">
            {videos.map(video => (
              <div key={video.id} className="bg-white rounded-lg overflow-hidden">
                {/* 视频封面 */}
                <div className="relative aspect-[9/16] bg-gray-900">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="white" opacity="0.5">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  )}
                  
                  {/* 时长 */}
                  <div className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-white text-[11px]">
                    {formatDuration(video.duration)}
                  </div>
                </div>

                {/* 信息 */}
                <div className="p-2">
                  <div className="text-[13px] text-gray-900 line-clamp-2 mb-1">
                    {video.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{video.authorName}</span>
                    <span>{formatCount(video.viewCount)} 观看</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部导航 */}
      {renderBottomNav()}
    </div>
  )

  function renderBottomNav() {
    return (
      <div className="bg-white border-t border-gray-100 flex items-center justify-around py-2">
        <button 
          onClick={() => navigate('/forum')}
          className="flex flex-col items-center gap-1 py-1 active:opacity-60"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-[11px] text-gray-600">首页</span>
        </button>
        
        <button className="flex flex-col items-center gap-1 py-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#ff6c00]">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <span className="text-[11px] text-[#ff6c00] font-medium">视频</span>
        </button>
        
        <button 
          onClick={() => navigate('/forum/publish')}
          className="flex flex-col items-center -mt-3 active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-[#ff8140] to-[#ff6c00] rounded-full flex items-center justify-center shadow-lg">
            <AddIcon size={24} className="text-white" />
          </div>
        </button>
        
        <button 
          onClick={() => navigate('/forum/notifications')}
          className="flex flex-col items-center gap-1 py-1 active:opacity-60"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[11px] text-gray-600">消息</span>
        </button>
        
        <button 
          onClick={() => navigate('/forum/profile')}
          className="flex flex-col items-center gap-1 py-1 active:opacity-60"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[11px] text-gray-600">我</span>
        </button>
      </div>
    )
  }
}

export default ForumVideo

