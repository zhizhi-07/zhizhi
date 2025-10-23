import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

interface SongForm {
  title: string
  artist: string
  album: string
  cover: string
  audioFile: File | null
  lyrics: string
}

const UploadSong = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  
  const [form, setForm] = useState<SongForm>({
    title: '',
    artist: '',
    album: '',
    cover: '',
    audioFile: null,
    lyrics: ''
  })
  
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [audioPreview, setAudioPreview] = useState<string>('')
  const [lyricsFileName, setLyricsFileName] = useState<string>('')

  // 处理封面上传
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
        setForm({ ...form, cover: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  // 处理音频上传
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAudioPreview(url)
      setForm({ ...form, audioFile: file })
    }
  }

  // 处理歌词文件上传
  const handleLyricsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLyricsFileName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setForm({ ...form, lyrics: text })
      }
      reader.readAsText(file)
    }
  }

  // 保存歌曲
  const handleSave = () => {
    if (!form.title || !form.artist || !form.audioFile) {
      alert('请填写歌曲名称、艺术家并上传音频文件')
      return
    }

    // 获取现有歌曲列表
    const existingSongs = JSON.parse(localStorage.getItem('customSongs') || '[]')
    
    // 创建新歌曲对象
    const newSong = {
      id: Date.now(),
      title: form.title,
      artist: form.artist,
      album: form.album || '未知专辑',
      cover: form.cover || 'https://via.placeholder.com/300',
      audioUrl: audioPreview,
      lyrics: form.lyrics,
      duration: 0, // 需要通过音频元素获取
      isCustom: true
    }

    // 保存到 localStorage
    existingSongs.push(newSong)
    localStorage.setItem('customSongs', JSON.stringify(existingSongs))

    alert('歌曲上传成功！')
    navigate('/music-player')
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center ios-button"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">上传歌曲</h1>
        <button
          onClick={handleSave}
          className="text-red-500 font-medium text-base"
        >
          保存
        </button>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 封面上传 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            专辑封面
          </label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {coverPreview ? (
                <img src={coverPreview} alt="封面预览" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
              <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-center cursor-pointer hover:bg-gray-200">
                选择图片
              </div>
            </label>
          </div>
        </div>

        {/* 歌曲信息 */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              歌曲名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="请输入歌曲名称"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              艺术家 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.artist}
              onChange={(e) => setForm({ ...form, artist: e.target.value })}
              placeholder="请输入艺术家名称"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              专辑名称
            </label>
            <input
              type="text"
              value={form.album}
              onChange={(e) => setForm({ ...form, album: e.target.value })}
              placeholder="请输入专辑名称（可选）"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* 音频文件上传 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            音频文件 <span className="text-red-500">*</span>
          </label>
          <label className="block">
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 hover:bg-red-50">
              {form.audioFile ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  <span className="text-gray-700 font-medium">{form.audioFile.name}</span>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600">点击上传音频文件</p>
                  <p className="text-sm text-gray-400 mt-1">支持 MP3、WAV、OGG 等格式</p>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* 歌词输入 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            歌词（可选）
          </label>
          
          {/* 上传歌词文件 */}
          <div className="mb-3">
            <input
              type="file"
              accept=".lrc,.txt"
              onChange={handleLyricsUpload}
              className="hidden"
              id="lyricsFileInput"
            />
            <label
              htmlFor="lyricsFileInput"
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm">
                {lyricsFileName || '上传歌词文件 (.lrc/.txt)'}
              </span>
            </label>
          </div>

          {/* 手动输入歌词 */}
          <div className="text-xs text-gray-500 mb-2">或手动输入歌词：</div>
          <textarea
            value={form.lyrics}
            onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
            placeholder="请输入歌词，每行一句"
            rows={8}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            提示：每行输入一句歌词，播放时会自动滚动显示
          </p>
        </div>

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">上传说明</p>
              <ul className="space-y-1 text-blue-600">
                <li>• 歌曲名称和艺术家为必填项</li>
                <li>• 必须上传音频文件才能保存</li>
                <li>• 封面图片和歌词为可选项</li>
                <li>• 上传的歌曲会保存在本地</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadSong
