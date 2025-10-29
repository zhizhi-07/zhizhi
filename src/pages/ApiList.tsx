import { useNavigate } from 'react-router-dom'
import { BackIcon, AddIcon } from '../components/Icons'
import { useApi } from '../context/ApiContext'
import { setItem, STORAGE_KEYS } from '../utils/storage'
import StatusBar from '../components/StatusBar'

const ApiList = () => {
  const navigate = useNavigate()
  const { apiConfigs, currentApiId, switchApiConfig, deleteApiConfig } = useApi()

  const handleSwitchApi = (apiId: string) => {
    switchApiConfig(apiId)
    const selectedApi = apiConfigs.find(api => api.id === apiId)
    if (selectedApi) {
      // 更新localStorage中的API设置
      setItem(STORAGE_KEYS.API_SETTINGS, {
        baseUrl: selectedApi.baseUrl,
        apiKey: selectedApi.apiKey,
        model: selectedApi.model,
        provider: selectedApi.provider,
        temperature: selectedApi.temperature,
        maxTokens: selectedApi.maxTokens
      })
    }
    navigate(-1)
  }

  const handleDeleteApi = (apiId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要删除这个API配置吗？')) {
      deleteApiConfig(apiId)
    }
  }

  const getProviderLabel = (provider: string) => {
    const labels: { [key: string]: string } = {
      google: 'Google Gemini',
      openai: 'OpenAI',
      siliconflow: 'SiliconFlow',
      claude: 'Claude',
      custom: '自定义'
    }
    return labels[provider] || provider
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
            API管理
          </h1>
          <button
            onClick={() => navigate('/wechat/add-api')}
            className="ios-button text-blue-500"
          >
            <AddIcon size={24} />
          </button>
        </div>
      </div>

      {/* API列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3">
        {apiConfigs.length === 0 ? (
          <div className="empty-state">
            <p className="text-gray-400 text-base">暂无API配置</p>
            <p className="text-gray-400 text-xs mt-2">点击右上角"+"添加API</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {apiConfigs.map(api => {
              const isCurrentApi = currentApiId === api.id

              return (
                <div
                  key={api.id}
                  onClick={() => handleSwitchApi(api.id)}
                  className={`glass-card rounded-2xl p-4 ios-button cursor-pointer ${
                    isCurrentApi ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{api.name}</h3>
                        {isCurrentApi && (
                          <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-full">
                            当前
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">提供商：</span>
                          {getProviderLabel(api.provider)}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">模型：</span>
                          {api.model}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          <span className="font-medium">地址：</span>
                          {api.baseUrl}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      {api.id !== 'default-siliconflow' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/edit-api/${api.id}`)
                            }}
                            className="px-3 py-1 text-xs text-primary ios-button whitespace-nowrap"
                          >
                            编辑
                          </button>
                          {apiConfigs.length > 1 && (
                            <button
                              onClick={(e) => handleDeleteApi(api.id, e)}
                              className="px-3 py-1 text-xs text-red-500 ios-button whitespace-nowrap"
                            >
                              删除
                            </button>
                          )}
                        </>
                      )}
                      {api.id === 'default-siliconflow' && (
                        <span className="text-xs text-gray-400 px-2">内置</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ApiList

