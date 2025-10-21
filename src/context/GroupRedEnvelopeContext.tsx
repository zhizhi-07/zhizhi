import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { generateRandomPackets, findLuckiestUser } from '../utils/groupRedEnvelopeAlgorithm'

export interface GroupRedEnvelope {
  id: string
  groupId: string
  senderId: string
  senderName: string
  senderAvatar: string
  amount: number
  count: number
  message: string
  timestamp: number
  status: 'active' | 'expired' | 'finished'
  packets: number[]
  received: {
    [userId: string]: {
      amount: number
      timestamp: number
      userName: string
      userAvatar: string
    }
  }
}

interface GroupRedEnvelopeContextType {
  redEnvelopes: GroupRedEnvelope[]
  createRedEnvelope: (groupId: string, senderId: string, senderName: string, senderAvatar: string, amount: number, count: number, message: string) => string
  receiveRedEnvelope: (redEnvelopeId: string, userId: string, userName: string, userAvatar: string) => number | null
  getRedEnvelope: (redEnvelopeId: string) => GroupRedEnvelope | undefined
  getGroupRedEnvelopes: (groupId: string) => GroupRedEnvelope[]
  hasReceived: (redEnvelopeId: string, userId: string) => boolean
}

const GroupRedEnvelopeContext = createContext<GroupRedEnvelopeContextType | undefined>(undefined)

export const GroupRedEnvelopeProvider = ({ children }: { children: ReactNode }) => {
  const [redEnvelopes, setRedEnvelopes] = useState<GroupRedEnvelope[]>(() => {
    const saved = localStorage.getItem('group_red_envelopes')
    return saved ? JSON.parse(saved) : []
  })

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem('group_red_envelopes', JSON.stringify(redEnvelopes))
  }, [redEnvelopes])

  // 创建红包
  const createRedEnvelope = (
    groupId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    amount: number,
    count: number,
    message: string
  ): string => {
    const packets = generateRandomPackets(amount, count)
    
    const newRedEnvelope: GroupRedEnvelope = {
      id: `group_red_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId,
      senderId,
      senderName,
      senderAvatar,
      amount,
      count,
      message,
      timestamp: Date.now(),
      status: 'active',
      packets,
      received: {}
    }

    setRedEnvelopes(prev => [newRedEnvelope, ...prev])
    return newRedEnvelope.id
  }

  // 领取红包
  const receiveRedEnvelope = (
    redEnvelopeId: string,
    userId: string,
    userName: string,
    userAvatar: string
  ): number | null => {
    let receivedAmount: number | null = null

    setRedEnvelopes(prev => prev.map(envelope => {
      if (envelope.id !== redEnvelopeId) return envelope

      // 已经领取过
      if (envelope.received[userId]) {
        return envelope
      }

      // 红包已抢完或过期
      if (envelope.status !== 'active') {
        return envelope
      }

      // 找到第一个未领取的红包
      const receivedCount = Object.keys(envelope.received).length
      if (receivedCount >= envelope.packets.length) {
        return { ...envelope, status: 'finished' as const }
      }

      const amount = envelope.packets[receivedCount]
      receivedAmount = amount

      const newReceived = {
        ...envelope.received,
        [userId]: {
          amount,
          timestamp: Date.now(),
          userName,
          userAvatar
        }
      }

      const newReceivedCount = Object.keys(newReceived).length
      const newStatus = newReceivedCount >= envelope.packets.length ? 'finished' as const : 'active' as const

      return {
        ...envelope,
        received: newReceived,
        status: newStatus
      }
    }))

    return receivedAmount
  }

  // 获取单个红包
  const getRedEnvelope = (redEnvelopeId: string) => {
    return redEnvelopes.find(e => e.id === redEnvelopeId)
  }

  // 获取群的所有红包
  const getGroupRedEnvelopes = (groupId: string) => {
    return redEnvelopes.filter(e => e.groupId === groupId)
  }

  // 检查是否已领取
  const hasReceived = (redEnvelopeId: string, userId: string) => {
    const envelope = redEnvelopes.find(e => e.id === redEnvelopeId)
    return envelope ? !!envelope.received[userId] : false
  }

  return (
    <GroupRedEnvelopeContext.Provider
      value={{
        redEnvelopes,
        createRedEnvelope,
        receiveRedEnvelope,
        getRedEnvelope,
        getGroupRedEnvelopes,
        hasReceived
      }}
    >
      {children}
    </GroupRedEnvelopeContext.Provider>
  )
}

export const useGroupRedEnvelope = () => {
  const context = useContext(GroupRedEnvelopeContext)
  if (!context) {
    throw new Error('useGroupRedEnvelope must be used within GroupRedEnvelopeProvider')
  }
  return context
}
