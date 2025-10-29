import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { BackIcon } from '../components/Icons'
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage'
import { testApiConnection, ApiSettings, fetchModels } from '../utils/api'
import StatusBar from '../components/StatusBar'

const ApiConfig = () => {
  const navigate = useNavigate()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [fetchingModels, setFetchingModels] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [showModelList, setShowModelList] = useState(false)

  const [settings, setSettings] = useState<ApiSettings>(() => {
    return getItem<ApiSettings>(STORAGE_KEYS.API_SETTINGS, {
      baseUrl: '',
      apiKey: '',
      model: '',
      provider: 'custom',
      temperature: 0.7,
      maxTokens: 2000
    })
  })

  const providers = [
    { value: 'google', label: 'Google Gemini', example: 'https://generativelanguage.googleapis.com/v1beta' },
    { value: 'openai', label: 'OpenAI', example: 'https://api.openai.com/v1' },
    { value: 'siliconflow', label: 'SiliconFlow', example: 'https://api.siliconflow.cn/v1' },
    { value: 'custom', label: '自定义API', example: 'https://your-api-endpoint.com/v1' },
  ]

  const handleSave = () => {
    if (!settings.baseUrl || !settings.apiKey || !settings.model) {
      alert('请填写完整的API配置')
      return
    }
    setItem(STORAGE_KEYS.API_SETTINGS, settings)
    setTestResult(null)
    alert('API配置已保存')
  }

  const handleTest = async () => {
    if (!settings.baseUrl || !settings.apiKey || !settings.model) {
      alert('请先填写API配置')
      return
    }

    // 防止重复请求
    if (testing) {
      console.warn('⚠️ 正在测试连接，请勿重复点击')
      return
    }

    // 先保存配置
    setItem(STORAGE_KEYS.API_SETTINGS, settings)

    setTesting(true)
    setTestResult(null)
    console.log('🚀 开始测试API连接...')

    try {
      const success = await testApiConnection()
      console.log('✅ 测试结果:', success)
      if (success) {
        setTestResult({ success: true, message: 'API连接成功' })
      } else {
        setTestResult({ success: false, message: 'API连接失败，请检查配置' })
      }
    } catch (error: any) {
      console.error('❌ 测试失败:', error)
      setTestResult({ success: false, message: error.message || 'API连接失败' })
    } finally {
      setTesting(false)
      console.log('🏁 测试完成')
    }
  }

  const handleProviderChange = (provider: string) => {
    const selectedProvider = providers.find(p => p.value === provider)
    setSettings({
      ...settings,
      provider: provider as any,
      baseUrl: selectedProvider?.example || ''
    })
    setAvailableModels([])
    setShowModelList(false)
  }

  const handleFetchModels = async () => {
    if (!settings.baseUrl || !settings.apiKey) {
      alert('请先填写API地址和密钥')
      return
    }

    // 防止重复请求
    if (fetchingModels) {
      console.warn('⚠️ 正在拉取模型，请勿重复点击')
      return
    }

    setFetchingModels(true)
    setTestResult(null)
    console.log('🚀 开始拉取模型列表...')

    try {
      const models = await fetchModels(settings)
      console.log('✅ 拉取模型成功:', models)
      if (models.length === 0) {
        setTestResult({ success: false, message: '未找到可用模型，请手动输入' })
      } else {
        setAvailableModels(models)
        setShowModelList(true)
        setTestResult({ success: true, message: `成功拉取 ${models.length} 个模型` })
      }
    } catch (error: any) {
      console.error('❌ 拉取模型失败:', error)
      setTestResult({ success: false, message: error.message || '拉取模型失败' })
    } finally {
      setFetchingModels(false)
      console.log('🏁 拉取模型完成')
    }
  }

  const handleSelectModel = (model: string) => {
    setSettings({ ...settings, model })
    setShowModelList(false)
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
            API配置
          </h1>
          <button
            onClick={handleSave}
            className="ios-button text-blue-500 font-medium"
          >
            保存
          </button>
        </div>
      </div>

      {/* 配置内容 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3">
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
                    settings.provider === provider.value 
                      ? 'border-primary' 
                      : 'border-gray-300'
                  }`}>
                    {settings.provider === provider.value && (
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* API基础URL */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">API地址</span>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
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
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
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
              <p className="text-xs text-gray-400 mt-1">
                {settings.provider === 'google' && '例如: gemini-1.5-flash, gemini-1.5-pro'}
                {settings.provider === 'openai' && '例如: gpt-3.5-turbo, gpt-4'}
                {settings.provider === 'siliconflow' && '例如: Qwen/Qwen2-7B-Instruct'}
                {settings.provider === 'custom' && '请输入您的模型名称'}
              </p>
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
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              placeholder={
                settings.provider === 'google' ? 'gemini-1.5-flash' :
                settings.provider === 'openai' ? 'gpt-3.5-turbo' :
                'model-name'
              }
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
                  <span className={`text-sm ${settings.model === model ? 'text-primary font-medium' : 'text-gray-900'}`}>
                    {model}
                  </span>
                  {settings.model === model && (
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
                  value={settings.temperature ?? 0.7}
                  onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-gray-900 font-mono text-sm w-10 text-right">
                  {(settings.temperature ?? 0.7).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="px-4 py-3">
              <label className="block text-xs text-gray-500 mb-2">最大Token数</label>
              <input
                type="number"
                value={settings.maxTokens ?? 2000}
                onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
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
          <div className={`mb-3 glass-card rounded-2xl p-4 ${
            testResult.success ? 'border-green-500 border' : 'border-red-500 border'
          }`}>
            <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.message}
            </p>
          </div>
        )}

        {/* 配置说明 */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="text-xs text-gray-500 space-y-2">
            <p className="font-semibold text-gray-700 mb-2">配置说明：</p>
            <p>1. 选择您的API提供商</p>
            <p>2. 填写API地址（系统会自动选择）</p>
            <p>3. 填写您的API密钥</p>
            <p>4. 输入模型名称</p>
            <p>5. 点击"测试API连接"验证配置</p>
            <p>6. 测试成功后点击"保存"</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiConfig

