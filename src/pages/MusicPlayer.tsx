import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useUser } from '../context/UserContext'
import { useCharacter } from '../context/CharacterContext'
import { useMusicPlayer } from '../context/MusicPlayerContext'

interface Song {
  id: number
  title: string
  artist: string
  album: string
  duration: number
  cover: string
  audioUrl?: string
  lyrics?: string
  lyricsUrl?: string
}

const MusicPlayer = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { currentUser } = useUser()
  const { characters } = useCharacter()
  const musicPlayer = useMusicPlayer()
  
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showListeners, setShowListeners] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [invitedCharacters, setInvitedCharacters] = useState<any[]>([])
  const [rotation, setRotation] = useState(0)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)
  const [customBackground, setCustomBackground] = useState<string>('')
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image')
  
  // 使用用户创建的角色作为可邀请列表
  const onlineListeners = characters
  
  // 邀请角色听歌
  const inviteCharacter = (character: any) => {
    if (!invitedCharacters.find(c => c.id === character.id)) {
      setInvitedCharacters([...invitedCharacters, character])
    }
    setShowInviteModal(false)
  }

  // 处理背景上传
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCustomBackground(url)
      
      // 判断文件类型
      if (file.type.startsWith('video/')) {
        setBackgroundType('video')
      } else {
        setBackgroundType('image')
      }
      
      // 保存到 localStorage
      localStorage.setItem('musicPlayerBackground', url)
      localStorage.setItem('musicPlayerBackgroundType', file.type.startsWith('video/') ? 'video' : 'image')
    }
  }

  // 加载保存的背景
  useEffect(() => {
    const savedBg = localStorage.getItem('musicPlayerBackground')
    const savedType = localStorage.getItem('musicPlayerBackgroundType') as 'image' | 'video'
    if (savedBg) {
      setCustomBackground(savedBg)
      setBackgroundType(savedType || 'image')
    }
  }, [])

  // 统一的音乐封面 - 使用音乐图标
  const musicCover = new URL('../assets/music-icon.png', import.meta.url).href

  // 默认示例歌曲列表（带歌词文件路径）
  const defaultSongs: Song[] = [
    {
      id: 1,
      title: '罗生门（Follow）',
      artist: '梨冻紧, Wiz_H张子豪',
      album: '罗生门',
      duration: 245,
      cover: musicCover,
      audioUrl: '/songs/罗生门（Follow） - 梨冻紧,Wiz_H张子豪.mp3',
      lyricsUrl: '/songs/罗生门（Follow） - 梨冻紧,Wiz_H张子豪.lrc'
    },
    {
      id: 2,
      title: '浴室',
      artist: 'deca joins',
      album: '浴室',
      duration: 220,
      cover: musicCover,
      audioUrl: '/songs/浴室 - deca joins.mp3',
      lyricsUrl: '/songs/浴室.lrc'
    },
    {
      id: 3,
      title: '特别的人',
      artist: '方大同',
      album: '特别的人',
      duration: 258,
      cover: musicCover,
      audioUrl: '/songs/特别的人 - 方大同.mp3',
      lyricsUrl: '/songs/特别的人 - 方大同.lrc'
    },
    {
      id: 4,
      title: '情人',
      artist: '蔡徐坤',
      album: '情人',
      duration: 186,
      cover: musicCover,
      audioUrl: '/songs/情人.mp3',
      lyricsUrl: '/songs/情人-蔡徐坤.lrc'
    },
    {
      id: 5,
      title: '舍得',
      artist: '王唯旖',
      album: '舍得',
      duration: 241,
      cover: musicCover,
      audioUrl: '/songs/舍得-王唯旖.mp3',
      lyricsUrl: '/songs/舍得-王唯旖.lrc'
    },
    {
      id: 6,
      title: '如果爱忘了 (live)',
      artist: '单依纯, 汪苏泷',
      album: '如果爱忘了',
      duration: 245,
      cover: musicCover,
      audioUrl: '/songs/如果爱忘了 (live).mp3',
      lyricsUrl: '/songs/如果爱忘了 (live)_原文歌词.lrc'
    }
  ]

  // 从localStorage加载自定义歌曲
  const customSongs = JSON.parse(localStorage.getItem('customSongs') || '[]')
  
  // 合并默认歌曲和自定义歌曲
  const playlist: Song[] = [...customSongs, ...defaultSongs]

  // 加载歌词文件
  useEffect(() => {
    const loadLyrics = async () => {
      const loadedSongs = await Promise.all(
        defaultSongs.map(async (song) => {
          if (song.lyricsUrl && !song.lyrics) {
            try {
              const response = await fetch(song.lyricsUrl)
              if (response.ok) {
                const lyricsText = await response.text()
                return { ...song, lyrics: lyricsText }
              }
            } catch (error) {
              console.log(`无法加载歌词: ${song.lyricsUrl}`)
            }
          }
          return song
        })
      )
      
      // 更新播放列表
      musicPlayer.setPlaylist([...customSongs, ...loadedSongs])
    }
    
    loadLyrics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 初始化全局播放器
  useEffect(() => {
    if (playlist.length > 0 && !musicPlayer.currentSong) {
      musicPlayer.setPlaylist(playlist)
      musicPlayer.setCurrentSong(playlist[0], 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 使用全局播放器的状态
  const currentSong = musicPlayer.currentSong || playlist[0] || {
    id: 0,
    title: '暂无歌曲',
    artist: '请上传歌曲',
    album: '',
    duration: 0,
    cover: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23999" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="60" fill="%23fff"%3E🎵%3C/text%3E%3C/svg%3E'
  }
  const isPlaying = musicPlayer.isPlaying
  const currentTime = musicPlayer.currentTime
  const duration = musicPlayer.duration
  const currentSongIndex = musicPlayer.currentIndex

  // 解析LRC格式歌词，保留时间信息
  const parseLyricsWithTime = (lyricsText?: string): Array<{ time: number; text: string }> => {
    if (!lyricsText) return []
    
    return lyricsText
      .split('\n')
      .map(line => {
        // 匹配 [mm:ss.xx] 格式
        const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/)
        if (match) {
          const minutes = parseInt(match[1])
          const seconds = parseInt(match[2])
          const milliseconds = parseInt(match[3])
          const text = match[4].trim()
          const time = minutes * 60 + seconds + milliseconds / 1000
          
          return { time, text }
        }
        return null
      })
      .filter((item): item is { time: number; text: string } => {
        if (!item || !item.text) return false
        const text = item.text
        // 过滤元数据
        if (text.includes('作词') || text.includes('作曲')) return false
        if (text.includes('编曲') || text.includes('制作')) return false
        if (text.includes('混音') || text.includes('录音')) return false
        if (text.includes('母带') || text.includes('监制')) return false
        if (text.includes('发行') || text.includes('企划')) return false
        if (text.includes('封面') || text.includes('钢琴')) return false
        if (text.includes('吉他') || text.includes('贝斯')) return false
        if (text.includes('鼓') || text.includes('弦乐')) return false
        if (text.includes('No Label Crew')) return false
        if (text.includes('本歌曲来自') || text.includes('营销推广')) return false
        if (text.includes('青云') || text.includes('LAB')) return false
        return true
      })
      .sort((a, b) => a.time - b.time)
  }

  // 获取解析后的歌词（带时间）
  const lyricsWithTime = currentSong?.lyrics ? parseLyricsWithTime(currentSong.lyrics) : []
  
  // 只获取歌词文本用于显示
  const parsedLyrics = lyricsWithTime.map(item => item.text)

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 播放/暂停
  const togglePlay = () => {
    musicPlayer.togglePlay()
  }

  // 上一曲
  const playPrevious = () => {
    musicPlayer.previous()
  }

  // 下一曲
  const playNext = () => {
    musicPlayer.next()
  }

  // 进度条拖动
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    musicPlayer.seek(time)
  }

  // 选择歌曲
  const selectSong = (index: number) => {
    musicPlayer.setCurrentSong(playlist[index], index)
    musicPlayer.play()
    setShowPlaylist(false)
  }

  // 唱片旋转动画
  useEffect(() => {
    let animationFrame: number
    if (isPlaying) {
      const rotate = () => {
        setRotation(prev => (prev + 0.5) % 360)
        animationFrame = requestAnimationFrame(rotate)
      }
      animationFrame = requestAnimationFrame(rotate)
    }
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isPlaying])

  // 歌词根据LRC时间轴精确同步
  useEffect(() => {
    if (lyricsWithTime.length > 0) {
      // 找到当前时间对应的歌词索引
      let index = 0
      for (let i = 0; i < lyricsWithTime.length; i++) {
        if (currentTime >= lyricsWithTime[i].time) {
          index = i
        } else {
          break
        }
      }
      setCurrentLyricIndex(index)
    }
  }, [currentTime, lyricsWithTime])

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-white">
      {showStatusBar && <StatusBar />}
      
      {/* 背景和毛玻璃层 - 不覆盖状态栏 */}
      <div className={`absolute inset-0 ${showStatusBar ? 'top-[44px]' : 'top-0'}`}>
        {/* 自定义背景 */}
        {customBackground && (
          backgroundType === 'video' ? (
            <video
              src={customBackground}
              autoPlay
              loop
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${customBackground})` }}
            />
          )
        )}
        
        {/* 默认渐变背景 */}
        {!customBackground && (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" />
        )}
        
        {/* 毛玻璃遮罩 */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30" />
      </div>
      
      {/* 顶部导航栏 */}
      <div className="relative z-10 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center ios-button"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-sm font-medium text-gray-700">正在播放</h1>
        <div className="flex items-center gap-2">
          {/* 上传背景按钮 */}
          <label className="w-10 h-10 flex items-center justify-center ios-button cursor-pointer">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zM9 10l12-3" />
            </svg>
          </label>
          <button
            onClick={() => navigate('/upload-song')}
            className="w-10 h-10 flex items-center justify-center ios-button"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="w-10 h-10 flex items-center justify-center ios-button"
          >
            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 播放列表弹窗 */}
      {showPlaylist && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowPlaylist(false)}
        >
          <div 
            className="w-full bg-white rounded-t-3xl max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">播放列表</h2>
                <button
                  onClick={() => setShowPlaylist(false)}
                  className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {playlist.map((song, index) => (
                <div
                  key={song.id}
                  onClick={() => selectSong(index)}
                  className={`flex items-center gap-3 p-4 border-b border-gray-50 ios-button ${
                    index === currentSongIndex ? 'bg-red-50' : ''
                  }`}
                >
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className={`font-medium ${index === currentSongIndex ? 'text-red-500' : 'text-gray-900'}`}>
                      {song.title}
                    </div>
                    <div className="text-sm text-gray-500">{song.artist}</div>
                  </div>
                  {index === currentSongIndex && isPlaying && (
                    <div className="flex gap-1 items-end">
                      <div className="w-1 h-3 bg-red-500 rounded animate-pulse"></div>
                      <div className="w-1 h-4 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-2 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start p-4 pt-4 overflow-y-auto">
        {/* 听歌状态 */}
        <div className="mb-4 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-3">
            {/* 用户头像 */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg border-2 border-white">
              <img
                src={currentUser?.avatar || 'https://i.pravatar.cc/150?img=68'}
                alt="我"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {/* 邀请的角色头像 */}
            {invitedCharacters.map((character) => (
              <div key={character.id} className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-lg border-2 border-white">
                <img
                  src={character.avatar}
                  alt={character.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 font-medium">
            {invitedCharacters.length > 0 
              ? `与 ${invitedCharacters.map(c => c.name).join('、')} 一起听歌` 
              : '点击邀请按钮邀请好友一起听歌'}
          </p>
        </div>

        {/* 唱片封面和歌词容器 */}
        <div className="relative mb-8 mt-12 w-48 h-48 flex items-center justify-center">
          {/* 唱片盘 */}
          <div 
            className={`absolute transition-opacity duration-500 ${showLyrics ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            onClick={() => setShowLyrics(true)}
          >
            <div className="relative w-48 h-48">
              {/* 唱片外圈 - 玻璃效果 */}
              <div 
                className="w-48 h-48 rounded-full backdrop-blur-md bg-white/20 shadow-2xl flex items-center justify-center cursor-pointer border-2 border-white/30"
                style={{ transform: `rotate(${rotation}deg)`, transition: isPlaying ? 'none' : 'transform 0.5s' }}
              >
                {/* 唱片封面 */}
                <div className="w-[170px] h-[170px] rounded-full overflow-hidden shadow-inner bg-white flex items-center justify-center">
                  <img
                    src={currentSong.cover}
                    alt={currentSong.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('封面加载失败:', currentSong.cover)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 歌词显示 */}
          <div 
            className={`absolute transition-opacity duration-500 ${showLyrics ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setShowLyrics(false)}
          >
            <div className="w-48 h-48 flex items-center justify-center cursor-pointer">
              {parsedLyrics.length > 0 ? (
                <div className="w-full h-full overflow-hidden flex items-center">
                  <div className="w-full text-center space-y-2 px-4">
                    {/* 显示当前歌词前后各2行 */}
                    {Array.from({ length: 5 }, (_, i) => {
                      const lyricIndex = currentLyricIndex - 2 + i
                      const line = parsedLyrics[lyricIndex] || ''
                      const isCurrent = i === 2
                      
                      return (
                        <p 
                          key={i} 
                          className={`text-sm transition-all duration-300 ${
                            isCurrent ? 'text-gray-900 font-bold text-base scale-110' : 'text-gray-400 text-xs'
                          }`}
                        >
                          {line || '\u00A0'}
                        </p>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <p className="text-sm">暂无歌词</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 歌曲信息和操作 */}
        <div className="w-full max-w-md mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{currentSong.title}</h2>
              <p className="text-gray-600 text-base">{currentSong.artist}</p>
            </div>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="w-10 h-10 flex items-center justify-center ios-button"
            >
              <svg className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
          
          {/* 好友一起听 */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <button
              onClick={() => setShowListeners(!showListeners)}
              className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2 ios-button"
            >
              <div className="flex -space-x-2">
                {/* 用户自己的头像 */}
                <img
                  src={currentUser?.avatar || 'https://i.pravatar.cc/150?img=68'}
                  alt="我"
                  className="w-7 h-7 rounded-full border-2 border-white"
                />
                {/* 好友头像 */}
                {onlineListeners.slice(0, 2).map((listener) => (
                  <img
                    key={listener.id}
                    src={listener.avatar}
                    alt={listener.name}
                    className="w-7 h-7 rounded-full border-2 border-white"
                  />
                ))}
              </div>
              <span className="text-gray-700 text-sm font-medium">
                {onlineListeners.length + 1} 人在听
              </span>
            </button>
            
            {/* 邀请好友按钮 */}
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1 bg-red-500 text-white rounded-full px-4 py-2 ios-button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">邀请</span>
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full max-w-md mb-5">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #EF4444 0%, #EF4444 ${(currentTime / duration) * 100}%, #E5E7EB ${(currentTime / duration) * 100}%, #E5E7EB 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || currentSong.duration)}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-8 mb-6">
          {/* 上一曲 */}
          <button
            onClick={playPrevious}
            className="w-12 h-12 flex items-center justify-center ios-button hover:scale-110 transition-transform"
          >
            <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          {/* 播放/暂停 */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg ios-button hover:scale-110 transition-transform"
          >
            {isPlaying ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* 下一曲 */}
          <button
            onClick={playNext}
            className="w-12 h-12 flex items-center justify-center ios-button hover:scale-110 transition-transform"
          >
            <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>

      </div>
      
      {/* 好友一起听弹窗 */}
      {showListeners && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowListeners(false)}
        >
          <div 
            className="w-full bg-white rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">正在一起听</h2>
              <button
                onClick={() => setShowListeners(false)}
                className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {/* 用户自己 */}
              <div className="flex items-center gap-3">
                <img
                  src={currentUser?.avatar || 'https://i.pravatar.cc/150?img=68'}
                  alt="我"
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">{currentUser?.name || '我'}</div>
                  <div className="text-gray-500 text-sm">正在收听</div>
                </div>
                <div className="flex gap-1 items-end">
                  <div className="w-1 h-4 bg-red-500 rounded animate-pulse"></div>
                  <div className="w-1 h-3 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-5 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
              {/* 好友列表 */}
              {onlineListeners.map((listener) => (
                <div key={listener.id} className="flex items-center gap-3">
                  <img
                    src={listener.avatar}
                    alt={listener.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium">{listener.name}</div>
                    <div className="text-gray-500 text-sm">正在收听</div>
                  </div>
                  <div className="flex gap-1 items-end">
                    <div className="w-1 h-4 bg-red-500 rounded animate-pulse"></div>
                    <div className="w-1 h-3 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-5 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 邀请角色听歌弹窗 */}
      {showInviteModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">邀请一起听歌</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
              <div className="space-y-3">
                {/* 这里会显示角色列表 */}
                {onlineListeners.map((character) => (
                  <div
                    key={character.id}
                    onClick={() => inviteCharacter(character)}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg ios-button"
                  >
                    <img
                      src={character.avatar}
                      alt={character.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium">{character.name}</div>
                      <div className="text-sm text-gray-500">点击邀请</div>
                    </div>
                    {invitedCharacters.find(c => c.id === character.id) && (
                      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #EF4444;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #EF4444;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(1.1);
            opacity: 0;
          }
        }

        .animate-ping {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  )
}

export default MusicPlayer
