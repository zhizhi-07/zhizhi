/**
 * ForumCreateTopic.tsx - 创建话题页面
 * 
 * 用户创建话题，AI生成完整的讨论区
 * 
 * @module pages/ForumCreateTopic
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { generateTopicContent } from '../utils/forumAI'

const ForumCreateTopic = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [topicName, setTopicName] = useState('')
  const [topicDesc, setTopicDesc] = useState('')

  const handleCreate = async () => {
    if (!topicName.trim()) {
      alert('请输入话题名称')
      return
    }

    if (!topicDesc.trim()) {
      alert('请输入话题介绍')
      return
    }

    // 创建任务ID
    const taskId = `topic_gen_${Date.now()}`
    const task = {
      id: taskId,
      topicName: topicName.trim(),
      topicDesc: topicDesc.trim(),
      status: 'generating',
      startTime: Date.now()
    }
    
    // 保存任务到localStorage
    localStorage.setItem('forum_generating_task', JSON.stringify(task))
    
    // 立即返回话题列表，后台生成
    alert('话题创建成功！\nAI正在后台生成内容，你可以先去做其他事情\n生成完成后会自动显示在话题列表中')
    navigate('/forum/topics')
    
    // 后台生成（不阻塞UI）
    try {
      // 一次API调用生成完整的讨论区
      const result = await generateTopicContent(topicName.trim(), topicDesc.trim())
      
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
      
      // 更新任务状态为完成
      const completedTask = { ...task, status: 'completed', topicId: newTopic.id }
      localStorage.setItem('forum_generating_task', JSON.stringify(completedTask))
      
      console.log('✅ 话题生成完成:', newTopic.name)
      
    } catch (error) {
      console.error('❌ 创建话题失败:', error)
      
      // 更新任务状态为失败
      const failedTask = { ...task, status: 'failed', error: (error as Error).message }
      localStorage.setItem('forum_generating_task', JSON.stringify(failedTask))
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
            className="text-[15px] text-gray-700 active:opacity-60"
          >
            取消
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">创建话题</h1>
          <button
            onClick={handleCreate}
            disabled={!topicName.trim() || !topicDesc.trim()}
            className={`px-4 py-1.5 rounded-full text-[14px] font-medium ${
              !topicName.trim() || !topicDesc.trim()
                ? 'bg-gray-200 text-gray-400'
                : 'bg-[#ff6c00] text-white active:opacity-80'
            }`}
          >
            创建
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
          />
          <div className="flex items-center justify-between mt-1 text-[12px] text-gray-400">
            <span>AI会根据介绍生成相关讨论</span>
            <span>{topicDesc.length}/200</span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ForumCreateTopic


