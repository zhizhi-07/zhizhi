/**
 * 论坛调试工具
 * 
 * 用于检查和诊断论坛数据问题
 */

/**
 * 检查论坛数据完整性
 */
export function checkForumData(): void {
  console.group('🔍 论坛数据检查')
  
  // 检查初始化状态
  const isInitialized = localStorage.getItem('forum_initialized')
  console.log('✅ 初始化状态:', isInitialized)
  
  // 检查帖子数据
  const postsStr = localStorage.getItem('forum_posts')
  if (postsStr) {
    try {
      const posts = JSON.parse(postsStr)
      console.log('📝 帖子数量:', posts.length)
      console.log('📝 帖子示例:', posts.slice(0, 3).map((p: any) => ({
        id: p.id,
        author: p.authorName,
        content: p.content?.substring(0, 50) + '...'
      })))
    } catch (e) {
      console.error('❌ 帖子数据解析失败:', e)
    }
  } else {
    console.warn('⚠️ 没有找到帖子数据')
  }
  
  // 检查话题数据
  const topicsStr = localStorage.getItem('forum_topics_list')
  if (topicsStr) {
    try {
      const topics = JSON.parse(topicsStr)
      console.log('🏷️ 话题数量:', topics.length)
      console.log('🏷️ 话题列表:', topics.map((t: any) => t.name))
    } catch (e) {
      console.error('❌ 话题数据解析失败:', e)
    }
  } else {
    console.warn('⚠️ 没有找到话题数据')
  }
  
  // 检查角色数据
  const charactersStr = localStorage.getItem('forum_characters')
  if (charactersStr) {
    try {
      const characters = JSON.parse(charactersStr)
      console.log('👤 角色数量:', characters.length)
      console.log('👤 角色列表:', characters.map((c: any) => c.forumName))
    } catch (e) {
      console.error('❌ 角色数据解析失败:', e)
    }
  } else {
    console.warn('⚠️ 没有找到角色数据')
  }
  
  console.groupEnd()
}

/**
 * 清除所有论坛数据
 */
export function clearForumData(): void {
  const keys = [
    'forum_initialized',
    'forum_posts',
    'forum_topics_list',
    'forum_characters',
    'forum_selected_characters',
    'forum_comments',
    'forum_drafts',
    'forum_favorites',
    'forum_likes',
    'forum_following_topics',
    'forum_following_users',
    'forum_notifications',
  ]
  
  keys.forEach(key => localStorage.removeItem(key))
  console.log('🗑️ 已清除所有论坛数据')
}

/**
 * 导出论坛数据为JSON（用于调试）
 */
export function exportForumData(): string {
  const data: any = {}
  
  const keys = [
    'forum_initialized',
    'forum_posts',
    'forum_topics_list',
    'forum_characters',
    'forum_selected_characters',
  ]
  
  keys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        data[key] = JSON.parse(value)
      } catch {
        data[key] = value
      }
    }
  })
  
  return JSON.stringify(data, null, 2)
}

// 在浏览器控制台中可用的全局调试函数
if (typeof window !== 'undefined') {
  (window as any).forumDebug = {
    check: checkForumData,
    clear: clearForumData,
    export: exportForumData,
  }
  
  console.log('💡 论坛调试工具已加载，在控制台输入以下命令使用：')
  console.log('  forumDebug.check()  - 检查数据')
  console.log('  forumDebug.clear()  - 清除数据')
  console.log('  forumDebug.export() - 导出数据')
}
