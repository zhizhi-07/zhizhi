/**
 * ForumCharacterList.tsx - 论坛角色列表页
 * 
 * 展示初始化后的角色，可以选择关注
 * 
 * @module pages/ForumCharacterList
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { getForumCharacters, saveForumCharacters } from '../utils/forumAI'
import type { ForumCharacterProfile } from '../utils/forumAI'

const ForumCharacterList = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [profiles, setProfiles] = useState<ForumCharacterProfile[]>([])
  const [followedCount, setFollowedCount] = useState(0)

  useEffect(() => {
    const characters = getForumCharacters()
    if (characters.length === 0) {
      // 没有初始化数据，返回初始化页
      navigate('/forum/initialize', { replace: true })
      return
    }
    setProfiles(characters)
    setFollowedCount(characters.filter(c => c.isFollowedByUser).length)
  }, [navigate])

  /**
   * 切换关注
   */
  const toggleFollow = (characterId: string) => {
    const newProfiles = profiles.map(p => {
      if (p.characterId === characterId) {
        return {
          ...p,
          isFollowedByUser: !p.isFollowedByUser
        }
      }
      return p
    })
    
    setProfiles(newProfiles)
    saveForumCharacters(newProfiles)
    setFollowedCount(newProfiles.filter(c => c.isFollowedByUser).length)
  }

  /**
   * 格式化粉丝数
   */
  const formatCount = (count: number): string => {
    if (count < 1000) return count.toString()
    if (count < 10000) return (count / 1000).toFixed(1) + 'k'
    return (count / 10000).toFixed(1) + 'w'
  }

  /**
   * 进入论坛
   */
  const handleEnter = () => {
    navigate('/forum', { replace: true })
  }

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f7]">
      {/* 顶部 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {showStatusBar && <StatusBar />}
        
        <div className="px-4 py-2.5 flex items-center justify-center">
          <h1 className="text-[17px] font-semibold text-gray-900">论坛角色</h1>
        </div>
      </div>

      {/* 提示卡片 */}
      <div className="bg-white m-4 p-4 rounded-xl shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
              初始化成功！
            </h3>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              {profiles.length} 个角色已准备就绪。你可以选择关注感兴趣的角色，也可以稍后再关注。
            </p>
          </div>
        </div>
      </div>

      {/* 统计 */}
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-[14px] text-gray-600">
          共 {profiles.length} 个角色
        </span>
        <span className="text-[14px] text-gray-600">
          已关注 <span className="text-[#ff6c00] font-semibold">{followedCount}</span> 个
        </span>
      </div>

      {/* 角色列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white">
          {profiles.map((profile) => (
            <div
              key={profile.characterId}
              className="flex items-start gap-3 p-4 border-b border-gray-50"
            >
              {/* 头像 */}
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {profile.originalAvatar.startsWith('data:') ? (
                  <img src={profile.originalAvatar} alt={profile.forumName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {profile.originalAvatar}
                  </div>
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[16px] font-semibold text-gray-900">
                    {profile.forumName}
                  </span>
                  {/* 影响力标识 */}
                  {profile.influence === 'high' && (
                    <svg width="14" height="14" viewBox="0 0 16 16" className="text-[#ff8200]">
                      <path d="M8 0L10 5L16 6L12 10L13 16L8 13L3 16L4 10L0 6L6 5L8 0Z" fill="currentColor"/>
                    </svg>
                  )}
                </div>
                
                <p className="text-[13px] text-gray-600 mb-2 line-clamp-2">
                  {profile.forumBio}
                </p>
                
                <div className="flex items-center gap-3 text-[12px] text-gray-400">
                  <span>👥 {formatCount(profile.followersCount)} 粉丝</span>
                  <span>· {formatCount(profile.followingCount)} 关注</span>
                </div>
              </div>

              {/* 关注按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFollow(profile.characterId)
                }}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all flex-shrink-0 ${
                  profile.isFollowedByUser
                    ? 'bg-gray-100 text-gray-600 border border-gray-200'
                    : 'bg-[#ff6c00] text-white active:opacity-80'
                }`}
              >
                {profile.isFollowedByUser ? '已关注' : '关注'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="p-4 bg-white border-t border-gray-100">
        <button
          onClick={handleEnter}
          className="w-full py-3.5 bg-gradient-to-r from-[#ff8140] to-[#ff6c00] text-white rounded-full text-[16px] font-semibold active:scale-98 transition-transform shadow-lg"
        >
          开始探索论坛
        </button>
        
        <button
          onClick={() => navigate('/forum/initialize')}
          className="w-full py-2.5 text-[14px] text-gray-600 mt-2 active:opacity-60"
        >
          重新选择角色
        </button>
      </div>
    </div>
  )
}

export default ForumCharacterList


