import { createContext, useContext, useState, ReactNode } from 'react'

export interface RedEnvelope {
  id: string
  amount: number
  blessing: string
  status: 'pending' | 'claimed' | 'expired'
  sender: 'user' | 'ai'
  createdAt: number
  claimedBy: string | null
  claimedAt: number | null
}

interface RedEnvelopeContextType {
  getRedEnvelope: (characterId: string, redEnvelopeId: string) => RedEnvelope | undefined
  saveRedEnvelope: (characterId: string, redEnvelope: RedEnvelope) => void
  updateRedEnvelope: (characterId: string, redEnvelopeId: string, updates: Partial<RedEnvelope>) => boolean
  getPendingRedEnvelopes: (characterId: string) => RedEnvelope[]
}

const RedEnvelopeContext = createContext<RedEnvelopeContextType | undefined>(undefined)

const RED_ENVELOPE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时

export const RedEnvelopeProvider = ({ children }: { children: ReactNode }) => {
  const [, setUpdateTrigger] = useState(0)

  const getRedEnvelope = (characterId: string, redEnvelopeId: string): RedEnvelope | undefined => {
    const key = `redEnvelopes_${characterId}`
    const envelopes = JSON.parse(localStorage.getItem(key) || '[]')
    return envelopes.find((e: RedEnvelope) => e.id === redEnvelopeId)
  }

  const saveRedEnvelope = (characterId: string, redEnvelope: RedEnvelope) => {
    const key = `redEnvelopes_${characterId}`
    const envelopes = JSON.parse(localStorage.getItem(key) || '[]')
    envelopes.push(redEnvelope)
    localStorage.setItem(key, JSON.stringify(envelopes))
    setUpdateTrigger(prev => prev + 1)
  }

  const updateRedEnvelope = (characterId: string, redEnvelopeId: string, updates: Partial<RedEnvelope>): boolean => {
    const key = `redEnvelopes_${characterId}`
    const envelopes = JSON.parse(localStorage.getItem(key) || '[]')
    const index = envelopes.findIndex((e: RedEnvelope) => e.id === redEnvelopeId)
    
    if (index !== -1) {
      envelopes[index] = { ...envelopes[index], ...updates }
      localStorage.setItem(key, JSON.stringify(envelopes))
      setUpdateTrigger(prev => prev + 1)
      return true
    }
    return false
  }

  const getPendingRedEnvelopes = (characterId: string): RedEnvelope[] => {
    const key = `redEnvelopes_${characterId}`
    const envelopes = JSON.parse(localStorage.getItem(key) || '[]')
    const now = Date.now()
    
    return envelopes.filter((e: RedEnvelope) => 
      e.sender === 'user' && 
      e.status === 'pending' && 
      (now - e.createdAt) < RED_ENVELOPE_EXPIRY
    )
  }

  const value = {
    getRedEnvelope,
    saveRedEnvelope,
    updateRedEnvelope,
    getPendingRedEnvelopes
  }

  return (
    <RedEnvelopeContext.Provider value={value}>
      {children}
    </RedEnvelopeContext.Provider>
  )
}

export const useRedEnvelope = () => {
  const context = useContext(RedEnvelopeContext)
  if (!context) {
    throw new Error('useRedEnvelope must be used within RedEnvelopeProvider')
  }
  return context
}

export const generateRedEnvelopeId = () => {
  return `re_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
}

export const isRedEnvelopeExpired = (redEnvelope: RedEnvelope) => {
  return Date.now() > (redEnvelope.createdAt + RED_ENVELOPE_EXPIRY)
}
