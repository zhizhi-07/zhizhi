import { ReactNode } from 'react'
import { useMomentsSocial } from '../hooks/useMomentsSocial'

// 朋友圈社交管理器组件
// 用于监听朋友圈评论变化并触发AI互动
const MomentsSocialManager = ({ children }: { children: ReactNode }) => {
  // 启用朋友圈社交功能
  useMomentsSocial()
  
  return <>{children}</>
}

export default MomentsSocialManager
