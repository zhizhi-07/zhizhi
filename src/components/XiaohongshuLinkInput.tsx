import { useState } from 'react'
import { XiaohongshuNote } from '../types/xiaohongshu'

interface XiaohongshuLinkInputProps {
  onClose: () => void
  onSubmit: (note: XiaohongshuNote) => void
}

const XiaohongshuLinkInput = ({ onClose, onSubmit }: XiaohongshuLinkInputProps) => {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [likes, setLikes] = useState('')
  const [comments, setComments] = useState('')
  const [author, setAuthor] = useState('')
  const [topComments, setTopComments] = useState<{author: string, content: string, likes: number}[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoExtracted, setAutoExtracted] = useState(false)

  // 自动提取小红书信息
  const handleExtract = async () => {
    if (!url.trim()) {
      alert('请先粘贴小红书链接')
      return
    }

    setLoading(true)
    try {
      console.log('🔍 开始提取小红书信息:', url)
      
      const response = await fetch('/.netlify/functions/xiaohongshu-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        throw new Error('提取失败')
      }

      const data = await response.json()
      console.log('✅ 提取成功:', data)

      // 如果需要手动输入
      if (data.needManualInput) {
        alert('自动提取失败，请手动填写信息')
        setLoading(false)
        return
      }

      // 填充表单
      setTitle(data.title || '')
      setDescription(data.description || '')
      setImageUrl(data.coverImage || data.images?.[0] || '')
      setLikes(data.stats?.likes?.toString() || '')
      setComments(data.stats?.comments?.toString() || '')
      setAuthor(data.author?.nickname || '')
      setTopComments(data.topComments || [])
      setAutoExtracted(true)

      alert('✅ 自动提取成功！请检查信息后分享')
    } catch (error) {
      console.error('❌ 提取失败:', error)
      alert('自动提取失败，请手动填写信息')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('请至少填写标题')
      return
    }

    const note: XiaohongshuNote = {
      id: `user_share_${Date.now()}`,
      title: title,
      description: description || title,
      coverImage: imageUrl || 'https://picsum.photos/300/400?random=999',
      images: imageUrl ? [imageUrl] : [],
      author: {
        id: 'real_author',
        nickname: author || '小红书用户',
        avatar: 'https://i.pravatar.cc/150?img=9'
      },
      stats: {
        likes: parseInt(likes) || 0,
        comments: parseInt(comments) || 0,
        collects: parseInt(likes) ? Math.floor(parseInt(likes) * 0.8) : 0
      },
      tags: [],
      url: url || 'https://www.xiaohongshu.com',
      createTime: Date.now(),
      topComments: topComments.length > 0 ? topComments : undefined
    }

    onSubmit(note)
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
      />

      {/* 输入框 */}
      <div className="fixed inset-x-4 top-10 bottom-10 bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">📕 分享小红书笔记</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表单 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
            ✨ 粘贴小红书链接，点击"自动提取"即可！AI会看到完整内容
          </div>

          {/* 链接 + 自动提取按钮 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              小红书链接 *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setAutoExtracted(false)
                }}
                placeholder="粘贴小红书链接..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
              <button
                onClick={handleExtract}
                disabled={!url.trim() || loading}
                className="px-6 py-3 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? '提取中...' : '🔍 自动提取'}
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              支持格式: https://www.xiaohongshu.com/explore/xxxxx
            </div>
          </div>

          {autoExtracted && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              ✅ 信息已自动提取！请检查后点击"分享给AI"
            </div>
          )}

          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="笔记标题"
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="笔记的详细内容..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* 图片 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面图片链接（可选）
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {imageUrl && (
              <div className="mt-2">
                <img 
                  src={imageUrl} 
                  alt="预览" 
                  className="w-32 h-32 object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
                  }}
                />
              </div>
            )}
          </div>

          {/* 作者 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作者昵称
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="作者名字"
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* 数据 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                点赞数
              </label>
              <input
                type="number"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                评论数
              </label>
              <input
                type="number"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* 热门评论 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              热门评论（AI会看到）
            </label>
            
            {/* 已添加的评论列表 */}
            {topComments.length > 0 && (
              <div className="mb-3 space-y-2">
                {topComments.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-xl flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{comment.author}</div>
                      <div className="text-sm text-gray-600 mt-1">{comment.content}</div>
                      <div className="text-xs text-gray-400 mt-1">👍 {comment.likes}</div>
                    </div>
                    <button
                      onClick={() => {
                        setTopComments(topComments.filter((_, i) => i !== index))
                      }}
                      className="text-gray-400 hover:text-red-500 ml-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 添加评论 */}
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="输入一条评论内容...（格式：用户名|评论内容|点赞数）&#10;例如：小明|这个太好了！|520"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                rows={2}
              />
              <button
                onClick={() => {
                  if (!commentInput.trim()) return
                  
                  const parts = commentInput.split('|').map(s => s.trim())
                  if (parts.length === 3) {
                    setTopComments([...topComments, {
                      author: parts[0],
                      content: parts[1],
                      likes: parseInt(parts[2]) || 0
                    }])
                    setCommentInput('')
                  } else {
                    alert('格式错误！请按照：用户名|评论内容|点赞数')
                  }
                }}
                className="mt-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200"
              >
                ➕ 添加评论
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              💡 添加热门评论让AI更好理解这个笔记的反馈
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-full font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-full font-medium"
          >
            分享给AI
          </button>
        </div>
      </div>
    </>
  )
}

export default XiaohongshuLinkInput
