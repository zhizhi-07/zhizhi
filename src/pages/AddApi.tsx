import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useApi } from '../context/ApiContext'
import { fetchModels, testApiConnection } from '../utils/api'
import { setItem, STORAGE_KEYS } from '../utils/storage'
import StatusBar from '../components/StatusBar'
import { BackIcon } from '../components/Icons'

const AddApi = () => {
  const navigate = useNavigate()
  const { addApiConfig } = useApi()

  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    apiKey: '',
    model: '',
    provider: 'custom' as const,
    temperature: 0.7,
    maxTokens: 2000
  })

  const [testing, setTesting] = useState(false)
  const [fetchingModels, setFetchingModels] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [showModelList, setShowModelList] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const providers = [
    { value: 'google', label: 'Google Gemini', example: 'https://generativelanguage.googleapis.com/v1beta' },
    { value: 'openai', label: 'OpenAI', example: 'https://api.openai.com/v1' },
    { value: 'siliconflow', label: 'SiliconFlow', example: 'https://api.siliconflow.cn/v1' },
    { value: 'custom', label: '自定义API', example: 'https://your-api-endpoint.com/v1' },
  ]

  const handleProviderChange = (provider: string) => {
    const selectedProvider = providers.find(p => p.value === provider)
    setFormData({
      ...formData,
      provider: provider as any,
      baseUrl: selectedProvider?.example || ''
    })
    setAvailableModels([])
    setShowModelList(false)
  }

  const handleFetchModels = async () => {
    if (!formData.baseUrl || !formData.apiKey) {
      alert('请先填写API地址和密钥')
      return
    }

    if (fetchingModels) {
      console.warn('⚠️ 正在拉取模型，请勿重复点击')
      return
    }

    setFetchingModels(true)
    console.log('🚀 开始拉取模型列表...')
    setTestResult(null)

    try {
      const models = await fetchModels(formData)
      if (models.length === 0) {
        setTestResult({ success: false, message: '未找到可用模型，请手动输入' })
      } else {
        setAvailableModels(models)
        setShowModelList(true)
        // 自动选择第一个模型
        if (!formData.model && models.length > 0) {
          setFormData({ ...formData, model: models[0] })
        }
        setTestResult({ success: true, message: `成功拉取 ${models.length} 个模型，已自动选择第一个` })
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || '拉取模型失败' })
    } finally {
      setFetchingModels(false)
    }
  }

  const handleSelectModel = (model: string) => {
    setFormData({ ...formData, model })
    setShowModelList(false)
  }

  const handleTest = async () => {
    if (!formData.baseUrl || !formData.apiKey || !formData.model) {
      alert('请先填写完整的API配置')
      return
    }

    // 临时保存到localStorage供测试
    setItem(STORAGE_KEYS.API_SETTINGS, formData)

    setTesting(true)
    setTestResult(null)

    try {
      const success = await testApiConnection()
      if (success) {
        setTestResult({ success: true, message: 'API连接成功' })
      } else {
        setTestResult({ success: false, message: 'API连接失败，请检查配置' })
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'API连接失败' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入API名称')
      return
    }
    if (!formData.baseUrl || !formData.apiKey || !formData.model) {
      alert('请填写完整的API配置')
      return
    }

    addApiConfig(formData)
    // 保存到localStorage供API调用使用
    setItem(STORAGE_KEYS.API_SETTINGS, formData)
    navigate('/api-list')
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f7fa]">
      {/* 状态栏 + 导航栏一体 */}
      <div className="glass-effect border-b border-gray-200/50">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-blue-500 -ml-2 relative z-10"
          >
            <BackIcon size={24} />
          </button>
          <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
            新增API
          </h1>
          <button
            onClick={handleSave}
            className="ios-button text-blue-500 font-medium"
          >
            保存
          </button>
        </div>
      </div>

      {/* 配置表单 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3">
        {/* API名称 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">API名称</span>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如: 我的Gemini API"
              maxLength={30}
              className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* API提供商 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">API提供商</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            {providers.map((provider, index) => (
              <div key={provider.value}>
                <button
                  onClick={() => handleProviderChange(provider.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 ios-button ${
                    index < providers.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className="text-gray-900 font-medium">{provider.label}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.provider === provider.value 
                      ? 'border-primary' 
                      : 'border-gray-300'
                  }`}>
                    {formData.provider === provider.value && (
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* API地址 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">API地址</span>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <input
              type="text"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://api.example.com/v1"
              className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* API密钥 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">API密钥</span>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* 模型名称 */}
        <div className="mb-3">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex-1">
              <span className="text-sm text-gray-600 font-medium">模型名称</span>
            </div>
            <button
              onClick={handleFetchModels}
              disabled={fetchingModels}
              className="ml-2 px-3 py-1.5 bg-primary text-white text-xs rounded-lg ios-button"
            >
              {fetchingModels ? '拉取中...' : '拉取模型'}
            </button>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="选择或输入模型名称"
              className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* 模型列表 */}
        {showModelList && availableModels.length > 0 && (
          <div className="mb-3">
            <div className="px-4 py-2">
              <span className="text-sm text-gray-600 font-medium">选择模型</span>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              {availableModels.map((model, index) => (
                <button
                  key={model}
                  onClick={() => handleSelectModel(model)}
                  className={`w-full flex items-center justify-between px-4 py-3 ios-button text-left ${
                    index < availableModels.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className={`text-sm ${formData.model === model ? 'text-primary font-medium' : 'text-gray-900'}`}>
                    {model}
                  </span>
                  {formData.model === model && (
                    <span className="text-primary text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 高级设置 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">高级设置</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <label className="block text-xs text-gray-500 mb-2">温度 (Temperature)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature ?? 0.7}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-gray-900 font-mono text-sm w-10 text-right">
                  {(formData.temperature ?? 0.7).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="px-4 py-3">
              <label className="block text-xs text-gray-500 mb-2">最大Token数</label>
              <input
                type="number"
                value={formData.maxTokens ?? 2000}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                placeholder="2000"
                className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* 测试按钮 */}
        <div className="mb-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="w-full glass-card rounded-2xl px-4 py-4 text-gray-900 font-medium ios-button"
          >
            {testing ? '测试中...' : '测试API连接'}
          </button>
        </div>

        {/* 测试结果 */}
        {testResult && (
          <div className={`mb-6 glass-card rounded-2xl p-4 ${
            testResult.success ? 'border-green-500 border' : 'border-red-500 border'
          }`}>
            <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddApi

