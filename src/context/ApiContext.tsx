import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const STORAGE_KEYS = {
  API_SETTINGS: 'apiSettings'
}

export interface ApiConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  model: string
  provider: 'google' | 'openai' | 'claude' | 'siliconflow' | 'custom'
  temperature?: number
  maxTokens?: number
  createdAt: string
}

interface ApiContextType {
  apiConfigs: ApiConfig[]
  currentApiId: string | null
  currentApi: ApiConfig | null
  addApiConfig: (config: Omit<ApiConfig, 'id' | 'createdAt'>) => void
  updateApiConfig: (id: string, config: Partial<ApiConfig>) => void
  deleteApiConfig: (id: string) => void
  switchApiConfig: (id: string) => void
}

const ApiContext = createContext<ApiContextType | undefined>(undefined)

// 内置API配置 - HiAPI（主力）
const hiApiConfig: ApiConfig = {
  id: 'default-hiapi',
  name: 'Gemini 2.5 Pro（推荐）',
  baseUrl: 'https://hiapi.online/v1',
  apiKey: 'sk-D3TeNLaMBIYW9QN4AguxWucHo4zTWRhcr4V1EZ3OaVTPSjSB',
  model: 'gemini-2.5-pro',
  provider: 'google',
  temperature: 0.7,
  maxTokens: 2000,
  createdAt: new Date().toISOString()
}

// 内置API配置 - Gemini 反代（你的专属 - Netlify）
const geminiProxyConfig: ApiConfig = {
  id: 'default-gemini-proxy',
  name: 'Gemini 反代（备用）',
  baseUrl: 'https://zhizhi-ai.netlify.app/.netlify/functions/gemini-proxy',
  apiKey: 'not-needed', // Gemini 反代不需要 API Key
  model: 'gemini-2.5-pro',
  provider: 'google',
  temperature: 0.7,
  maxTokens: 2000,
  createdAt: new Date().toISOString()
}

// 内置API配置 - 硅基流动（备用）
const defaultApiConfig: ApiConfig = {
  id: 'default-siliconflow',
  name: '硅基流动（备用）',
  baseUrl: 'https://api.siliconflow.cn/v1',
  apiKey: 'sk-dfyuqxuizfdxqjlbovnaeebcvptbqzzvqcdahtggzrovktmo',
  model: 'deepseek-ai/DeepSeek-V3',
  provider: 'siliconflow',
  temperature: 0.7,
  maxTokens: 2000,
  createdAt: new Date().toISOString()
}

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>(() => {
    const saved = localStorage.getItem('apiConfigs')
    if (saved) {
      const configs = JSON.parse(saved)
      // 过滤掉内置配置，然后添加最新的内置配置
      const otherConfigs = configs.filter((c: ApiConfig) => 
        c.id !== 'default-siliconflow' && c.id !== 'default-gemini-proxy' && c.id !== 'default-hiapi'
      )
      return [hiApiConfig, geminiProxyConfig, defaultApiConfig, ...otherConfigs]
    }
    return [hiApiConfig, geminiProxyConfig, defaultApiConfig]
  })

  const [currentApiId, setCurrentApiId] = useState<string | null>(() => {
    const saved = localStorage.getItem('currentApiId')
    // 默认使用 HiAPI
    return saved || 'default-hiapi'
  })

  useEffect(() => {
    localStorage.setItem('apiConfigs', JSON.stringify(apiConfigs))
  }, [apiConfigs])

  useEffect(() => {
    if (currentApiId) {
      localStorage.setItem('currentApiId', currentApiId)
      // 更新当前API到localStorage供API调用使用
      const currentConfig = apiConfigs.find(api => api.id === currentApiId)
      if (currentConfig) {
        localStorage.setItem(STORAGE_KEYS.API_SETTINGS, JSON.stringify({
          baseUrl: currentConfig.baseUrl,
          apiKey: currentConfig.apiKey,
          model: currentConfig.model,
          provider: currentConfig.provider,
          temperature: currentConfig.temperature,
          maxTokens: currentConfig.maxTokens
        }))
      }
    } else {
      localStorage.removeItem('currentApiId')
    }
  }, [currentApiId, apiConfigs])

  const currentApi = apiConfigs.find(api => api.id === currentApiId) || null

  const addApiConfig = (configData: Omit<ApiConfig, 'id' | 'createdAt'>) => {
    const newConfig: ApiConfig = {
      ...configData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setApiConfigs(prev => [...prev, newConfig])
    setCurrentApiId(newConfig.id)
  }

  const updateApiConfig = (id: string, configData: Partial<ApiConfig>) => {
    setApiConfigs(prev => prev.map(api => api.id === id ? { ...api, ...configData } : api))
  }

  const deleteApiConfig = (id: string) => {
    // 防止删除内置API
    if (id === 'default-siliconflow' || id === 'default-gemini-proxy') {
      alert('内置API配置无法删除')
      return
    }
    
    setApiConfigs(prev => prev.filter(api => api.id !== id))
    if (currentApiId === id) {
      const remaining = apiConfigs.filter(api => api.id !== id)
      setCurrentApiId(remaining.length > 0 ? remaining[0].id : 'default-gemini-proxy')
    }
  }

  const switchApiConfig = (id: string) => {
    setCurrentApiId(id)
  }

  return (
    <ApiContext.Provider value={{ 
      apiConfigs, 
      currentApiId, 
      currentApi, 
      addApiConfig, 
      updateApiConfig, 
      deleteApiConfig, 
      switchApiConfig 
    }}>
      {children}
    </ApiContext.Provider>
  )
}

export const useApi = () => {
  const context = useContext(ApiContext)
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider')
  }
  return context
}

