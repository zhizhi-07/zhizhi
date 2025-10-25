// 情侣空间工具函数

export interface CoupleSpaceRelation {
  id: string
  userId: string
  characterId: string
  characterName: string
  characterAvatar?: string
  status: 'pending' | 'active' | 'rejected' | 'ended'
  createdAt: number
  acceptedAt?: number
  endedAt?: number
}

const STORAGE_KEY = 'couple_space_relation'
const PRIVACY_KEY = 'couple_space_privacy' // 'public' | 'private'

// 获取当前情侣空间关系
export const getCoupleSpaceRelation = (): CoupleSpaceRelation | null => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return null
  
  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

// 保存情侣空间关系
const saveCoupleSpaceRelation = (relation: CoupleSpaceRelation | null): void => {
  if (relation) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(relation))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// 创建情侣空间邀请
export const createCoupleSpaceInvite = (
  userId: string,
  characterId: string,
  characterName: string,
  characterAvatar?: string
): CoupleSpaceRelation | null => {
  // 检查是否已有活跃的情侣空间
  const existing = getCoupleSpaceRelation()
  if (existing && (existing.status === 'pending' || existing.status === 'active')) {
    console.log('已存在活跃的情侣空间关系')
    return null
  }

  const relation: CoupleSpaceRelation = {
    id: Date.now().toString(),
    userId,
    characterId,
    characterName,
    characterAvatar,
    status: 'pending',
    createdAt: Date.now()
  }

  saveCoupleSpaceRelation(relation)
  return relation
}

// 接受情侣空间邀请
export const acceptCoupleSpaceInvite = (characterId: string): boolean => {
  const relation = getCoupleSpaceRelation()
  
  if (!relation) {
    console.log('没有找到邀请')
    return false
  }

  if (relation.characterId !== characterId) {
    console.log('角色ID不匹配')
    return false
  }

  if (relation.status !== 'pending') {
    console.log('邀请状态不是pending')
    return false
  }

  relation.status = 'active'
  relation.acceptedAt = Date.now()
  saveCoupleSpaceRelation(relation)
  
  console.log('情侣空间已激活')
  return true
}

// 拒绝情侣空间邀请
export const rejectCoupleSpaceInvite = (characterId: string): boolean => {
  const relation = getCoupleSpaceRelation()
  
  if (!relation) {
    console.log('没有找到邀请')
    return false
  }

  if (relation.characterId !== characterId) {
    console.log('角色ID不匹配')
    return false
  }

  if (relation.status !== 'pending') {
    console.log('邀请状态不是pending')
    return false
  }

  relation.status = 'rejected'
  saveCoupleSpaceRelation(relation)
  
  console.log('已拒绝情侣空间邀请')
  return true
}

// 结束情侣空间关系
export const endCoupleSpaceRelation = (): boolean => {
  const relation = getCoupleSpaceRelation()
  
  if (!relation || relation.status !== 'active') {
    console.log('没有活跃的情侣空间')
    return false
  }

  relation.status = 'ended'
  relation.endedAt = Date.now()
  saveCoupleSpaceRelation(relation)
  
  console.log('情侣空间已结束')
  return true
}

// 检查是否有与指定角色的活跃情侣空间
export const hasActiveCoupleSpace = (characterId: string): boolean => {
  const relation = getCoupleSpaceRelation()
  const isActive = !!(relation && relation.characterId === characterId && relation.status === 'active')
  console.log('🔍 hasActiveCoupleSpace检查:', { 
    characterId, 
    relation, 
    isActive,
    relationCharId: relation?.characterId,
    relationStatus: relation?.status
  })
  return isActive
}

// 检查是否有待处理的邀请
export const hasPendingInvite = (characterId?: string): boolean => {
  const relation = getCoupleSpaceRelation()
  if (!relation || relation.status !== 'pending') return false
  
  if (characterId) {
    return relation.characterId === characterId
  }
  
  return true
}

// 设置情侣空间隐私模式
export const setCoupleSpacePrivacy = (mode: 'public' | 'private'): void => {
  localStorage.setItem(PRIVACY_KEY, mode)
  console.log('💑 情侣空间隐私设置已更新:', mode === 'public' ? '公开' : '私密')
}

// 获取情侣空间隐私模式
export const getCoupleSpacePrivacy = (): 'public' | 'private' => {
  const saved = localStorage.getItem(PRIVACY_KEY)
  return (saved === 'private' ? 'private' : 'public') as 'public' | 'private'
}

// 检查是否可以向某人发送情侣空间邀请（考虑隐私设置）
export const canSendCoupleSpaceInvite = (): boolean => {
  const relation = getCoupleSpaceRelation()
  
  // 如果没有情侣空间关系，可以发送
  if (!relation) return true
  
  // 如果有pending、active或rejected状态的关系，不能发送
  if (relation.status === 'pending' || relation.status === 'active' || relation.status === 'rejected') {
    return false
  }
  
  return true
}

// 检查对方是否公开了情侣空间状态（用于AI判断是否显示"对方已有情侣空间"）
// 注意：这个函数只能检查当前用户的设置，AI的设置由AI自己管理
export const isUserCoupleSpacePublic = (): boolean => {
  const relation = getCoupleSpaceRelation()
  if (!relation || relation.status === 'ended') return false
  
  const privacy = getCoupleSpacePrivacy()
  return privacy === 'public'
}
