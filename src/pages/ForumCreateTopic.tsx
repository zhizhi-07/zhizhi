/**
 * ForumCreateTopic.tsx - 创建话题页面
 * 
 * 用户创建话题，AI生成完整的讨论区
 * 
 * @module pages/ForumCreateTopic
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon } from '../components/Icons'
import { generateTopicContent } from '../utils/forumAI'

const ForumCreateTopic = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [topicName, setTopicName] = useState('')
  const [topicDesc, setTopicDesc] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')

  const handleCreate = async () => {
    if (!topicName.trim()) {
      alert('请输入话题名称')
      return
    }

    if (!topicDesc.trim()) {
      alert('请输入话题介绍')
      return
    }

    try {
      setGenerating(true)
      setProgress('AI正在为话题生成内容...')

      // 一次API调用生成完整的讨论区
      const result = await generateTopicContent(topicName.trim(), topicDesc.trim())

      setProgress('保存话题数据...')
      
      // 保存话题和内容
      const topics = JSON.parse(localStorage.getItem('forum_topics_list') || '[]')
      const newTopic = {
        id: `topic_${Date.now()}`,
        name: topicName.trim(),
        description: topicDesc.trim(),
        cover: '',
        postsCount: result.posts.length,
        followersCount: Math.floor(Math.random() * 5000) + 1000,
        isFollowing: true,
        isHot: true,
        createdAt: Date.now(),
        users: result.users,
        posts: result.posts
      }
      
      topics.unshift(newTopic)
      localStorage.setItem('forum_topics_list', JSON.stringify(topics))

      setProgress('完成！')
      
      // 跳转到话题详情页
      setTimeout(() => {
        navigate(`/forum/topic/${newTopic.id}`)
      }, 500)
      
    } catch (error) {
      console.error('创建话题失败:', error)
      alert('创建失败：' + (error as Error).message)
      setGenerating(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶部 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {showStatusBar && <StatusBar />}
        
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            disabled={generating}
            className="text-[15px] text-gray-700 active:opacity-60"
          >
            取消
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">创建话题</h1>
          <button
            onClick={handleCreate}
            disabled={generating || !topicName.trim() || !topicDesc.trim()}
            className={`px-4 py-1.5 rounded-full text-[14px] font-medium ${
              generating || !topicName.trim() || !topicDesc.trim()
                ? 'bg-gray-200 text-gray-400'
                : 'bg-[#ff6c00] text-white active:opacity-80'
            }`}
          >
            {generating ? '生成中...' : '创建'}
          </button>
        </div>
      </div>

      {/* 表单 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 话题名称 */}
        <div className="mb-6">
          <label className="block text-[14px] text-gray-700 font-medium mb-2">
            话题名称
          </label>
          <input
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            maxLength={20}
            placeholder="例如：AI技术讨论、美食分享、游戏攻略"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#ff6c00]"
            disabled={generating}
          />
          <div className="flex items-center justify-between mt-1 text-[12px] text-gray-400">
            <span>话题名称会显示为 #{topicName || '话题名称'}</span>
            <span>{topicName.length}/20</span>
          </div>
        </div>

        {/* 话题介绍 */}
        <div className="mb-6">
          <label className="block text-[14px] text-gray-700 font-medium mb-2">
            话题介绍
          </label>
          <textarea
            value={topicDesc}
            onChange={(e) => setTopicDesc(e.target.value)}
            maxLength={200}
            rows={4}
            placeholder="简单介绍这个话题的内容和讨论方向..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#ff6c00] resize-none"
            disabled={generating}
          />
          <div className="flex items-center justify-between mt-1 text-[12px] text-gray-400">
            <span>AI会根据介绍生成相关讨论</span>
            <span>{topicDesc.length}/200</span>
          </div>
        </div>

        {/* 提示 */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-[13px] text-gray-700 leading-relaxed">
            💡 <span className="font-medium">AI将会生成：</span><br/>
            • 10-15条围绕话题的帖子<br/>
            • 每条帖子下3-8条评论<br/>
            • 评论之间的回复互动<br/>
            • 虚拟用户（NPC）信息<br/>
            • 点赞和互动数据
          </p>
        </div>
      </div>

      {/* 生成进度 */}
      {generating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-[#ff6c00] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[15px] text-gray-900 font-medium mb-2">
                {progress}
              </p>
              <p className="text-[13px] text-gray-500 text-center">
                AI正在创建话题讨论区<br/>
                这可能需要10-30秒...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ForumCreateTopic


