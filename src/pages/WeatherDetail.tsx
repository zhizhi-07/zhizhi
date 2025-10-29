import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { BackIcon } from '../components/Icons'
import { useSettings } from '../context/SettingsContext'
import { fetchWeather, type WeatherData } from '../utils/weather'

const WeatherDetail = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCitySelector, setShowCitySelector] = useState(false)
  const [currentCity, setCurrentCity] = useState(() => {
    return localStorage.getItem('weather_city') || 'Beijing'
  })
  const [searchCity, setSearchCity] = useState('')
  const [showCustomMode, setShowCustomMode] = useState(false)
  
  // 自定义天气数据
  const [customWeather, setCustomWeather] = useState(() => {
    const saved = localStorage.getItem('custom_weather_enabled')
    return saved === 'true'
  })
  const [customCity, setCustomCity] = useState('')
  const [customTemp, setCustomTemp] = useState('')
  const [customCondition, setCustomCondition] = useState('晴天')

  // 常用城市列表（快捷选择）
  const popularCities = [
    { name: '北京', value: 'Beijing' },
    { name: '上海', value: 'Shanghai' },
    { name: '广州', value: 'Guangzhou' },
    { name: '深圳', value: 'Shenzhen' },
    { name: '成都', value: 'Chengdu' },
    { name: '杭州', value: 'Hangzhou' },
    { name: '重庆', value: 'Chongqing' },
    { name: '西安', value: 'Xian' },
    { name: '南京', value: 'Nanjing' },
    { name: '武汉', value: 'Wuhan' },
    { name: '天津', value: 'Tianjin' },
    { name: '苏州', value: 'Suzhou' },
    { name: '青岛', value: 'Qingdao' },
    { name: '厦门', value: 'Xiamen' },
    { name: '长沙', value: 'Changsha' },
    { name: '郑州', value: 'Zhengzhou' },
    { name: '济南', value: 'Jinan' },
    { name: '福州', value: 'Fuzhou' },
    { name: '石家庄', value: 'Shijiazhuang' },
    { name: '合肥', value: 'Hefei' },
    { name: '太原', value: 'Taiyuan' },
    { name: '南昌', value: 'Nanchang' },
    { name: '昆明', value: 'Kunming' },
    { name: '乌鲁木齐', value: 'Urumqi' },
    { name: '纽约', value: 'New York' },
    { name: '伦敦', value: 'London' },
    { name: '巴黎', value: 'Paris' },
    { name: '东京', value: 'Tokyo' },
    { name: '首尔', value: 'Seoul' },
    { name: '新加坡', value: 'Singapore' },
    { name: '悉尼', value: 'Sydney' },
    { name: '莫斯科', value: 'Moscow' },
  ]

  const loadWeather = async (city?: string) => {
    try {
      setRefreshing(true)
      const cityToUse = city || currentCity
      const weatherData = await fetchWeather(cityToUse)
      setWeather(weatherData)
      setLoading(false)
      setRefreshing(false)
    } catch (error: any) {
      console.error('获取天气失败:', error)
      setLoading(false)
      setRefreshing(false)
      
      // 显示错误提示
      if (error.message?.includes('404')) {
        alert('找不到该城市 ❌\n\n请检查：\n• 城市名称是否正确\n• 是否输入了完整的城市名\n  如："嘉兴"而不是"嘉"\n• 尝试使用英文名称')
      } else {
        alert('获取天气失败，请检查网络连接或稍后重试')
      }
    }
  }

  // 切换城市
  const handleCityChange = (cityValue: string) => {
    // 验证输入
    if (!cityValue || cityValue.trim().length < 2) {
      alert('城市名称太短，请输入完整的城市名称')
      return
    }
    
    setCurrentCity(cityValue)
    localStorage.setItem('weather_city', cityValue)
    setShowCitySelector(false)
    loadWeather(cityValue)
    // 触发事件，让Desktop也更新
    window.dispatchEvent(new Event('weatherCityChange'))
  }
  
  // 保存自定义天气
  const handleSaveCustom = () => {
    if (!customCity.trim()) {
      alert('请输入城市名称')
      return
    }
    if (!customTemp.trim() || isNaN(Number(customTemp))) {
      alert('请输入有效的温度（数字）')
      return
    }
    
    const customData = {
      city: customCity.trim(),
      temp: customTemp.trim(),
      condition: customCondition
    }
    
    localStorage.setItem('custom_weather_data', JSON.stringify(customData))
    localStorage.setItem('custom_weather_enabled', 'true')
    setCustomWeather(true)
    
    // 应用自定义天气
    setWeather({
      temperature: parseInt(customTemp),
      condition: customCondition,
      conditionCN: customCondition,
      icon: getWeatherIcon(customCondition),
      location: customCity,
      humidity: 60,
      windSpeed: 10,
      airQuality: 'good'
    })
    
    setShowCustomMode(false)
    alert('自定义天气已保存！')
    window.dispatchEvent(new Event('weatherCityChange'))
  }
  
  // 关闭自定义模式
  const handleDisableCustom = () => {
    localStorage.setItem('custom_weather_enabled', 'false')
    setCustomWeather(false)
    loadWeather()
    alert('已切换到真实天气')
    window.dispatchEvent(new Event('weatherCityChange'))
  }

  useEffect(() => {
    // 加载自定义天气设置
    const savedCustom = localStorage.getItem('custom_weather_data')
    if (savedCustom) {
      try {
        const data = JSON.parse(savedCustom)
        setCustomCity(data.city || '')
        setCustomTemp(data.temp || '')
        setCustomCondition(data.condition || '晴天')
      } catch (e) {
        console.error('加载自定义天气失败:', e)
      }
    }
    
    // 如果启用了自定义模式，使用自定义数据
    if (customWeather && savedCustom) {
      try {
        const data = JSON.parse(savedCustom)
        setWeather({
          temperature: parseInt(data.temp) || 25,
          condition: data.condition || '晴天',
          conditionCN: data.condition || '晴天',
          icon: getWeatherIcon(data.condition || '晴天'),
          location: data.city || '自定义',
          humidity: 60,
          windSpeed: 10,
          airQuality: 'good'
        })
        setLoading(false)
      } catch (e) {
        loadWeather()
      }
    } else {
      loadWeather()
    }
  }, [])

  // 获取天气图标
  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase()
    
    // 晴天
    if (lower.includes('clear') || lower.includes('sunny') || lower === '晴天' || lower === '晴') {
      return '☀️'
    }
    
    // 下雨
    if (lower.includes('rain') || lower === '雨' || lower.includes('shower')) {
      if (lower.includes('heavy') || lower === '大雨') return '⛈️'
      if (lower.includes('light') || lower === '小雨') return '🌦️'
      return '🌧️'
    }
    
    // 雷雨
    if (lower.includes('thunder') || lower === '雷阵雨') {
      return '⛈️'
    }
    
    // 多云
    if (lower.includes('cloud') || lower === '多云') {
      if (lower.includes('partly')) return '⛅'
      return '☁️'
    }
    
    // 阴天
    if (lower === '阴' || lower.includes('overcast')) {
      return '☁️'
    }
    
    // 雪
    if (lower.includes('snow') || lower === '雪') {
      if (lower.includes('heavy') || lower === '大雪') return '❄️'
      return '🌨️'
    }
    
    // 雾
    if (lower.includes('fog') || lower.includes('mist') || lower === '雾') {
      return '🌫️'
    }
    
    // 风
    if (lower.includes('wind') || lower === '大风') {
      return '💨'
    }
    
    // 默认
    return '🌤️'
  }

  // 获取空气质量颜色
  const getAirQualityColor = (quality?: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'moderate': return 'bg-yellow-500'
      case 'poor': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // 获取空气质量文字
  const getAirQualityText = (quality?: string) => {
    switch (quality) {
      case 'excellent': return '优'
      case 'good': return '良'
      case 'moderate': return '中'
      case 'poor': return '差'
      default: return '未知'
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f7fa]">
      {/* 顶部：StatusBar + 导航栏一体化 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-gray-700 hover:text-gray-900 -ml-2"
          >
            <BackIcon size={24} />
          </button>
          
          <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
            天气详情
          </h1>
          
          <button
            onClick={() => setShowCustomMode(true)}
            className="text-blue-500 ios-button text-sm"
          >
            {customWeather ? '自定义中' : '自定义'}
          </button>
        </div>
      </div>

      {/* 天气内容 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : weather ? (
          <>
            {/* 主要天气信息卡片 */}
            <div className="glass-card rounded-3xl p-6 mb-4 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-6xl font-extralight text-gray-800 mb-2">
                    {weather.temperature}<span className="text-3xl">°C</span>
                  </div>
                  <div className="text-xl text-gray-600">{weather.conditionCN}</div>
                  <div className="text-sm text-gray-500 mt-1">{weather.location}</div>
                </div>
                <div className="text-7xl">
                  {getWeatherIcon(weather.condition)}
                </div>
              </div>

              {/* 空气质量 */}
              <div className="flex items-center gap-3 p-4 glass-card rounded-xl">
                <div className={`w-12 h-12 rounded-full ${getAirQualityColor(weather.airQuality)} flex items-center justify-center text-white font-bold`}>
                  {getAirQualityText(weather.airQuality)}
                </div>
                <div>
                  <div className="text-sm text-gray-600">空气质量</div>
                  <div className="text-xs text-gray-500 capitalize">{weather.airQuality}</div>
                </div>
              </div>
            </div>

            {/* 详细信息 */}
            <div className="glass-card rounded-2xl p-5 mb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-4">详细信息</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* 湿度 */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">💧</span>
                    <span className="text-xs text-gray-600">湿度</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-800">
                    {weather.humidity}<span className="text-sm">%</span>
                  </div>
                </div>

                {/* 风速 */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">💨</span>
                    <span className="text-xs text-gray-600">风速</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-800">
                    {weather.windSpeed}<span className="text-sm">km/h</span>
                  </div>
                </div>

                {/* 体感温度 */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🌡️</span>
                    <span className="text-xs text-gray-600">体感</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-800">
                    {weather.temperature}<span className="text-sm">°C</span>
                  </div>
                </div>

                {/* 天气状况 */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🌈</span>
                    <span className="text-xs text-gray-600">状况</span>
                  </div>
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {weather.conditionCN}
                  </div>
                </div>
              </div>
            </div>

            {/* 位置信息 */}
            <div className="glass-card rounded-2xl p-5 mb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">位置</h3>
              <div className="flex items-center gap-3">
                <span className="text-3xl">📍</span>
                <div>
                  <div className="text-base text-gray-800 font-medium">{weather.location}</div>
                  <div className="text-xs text-gray-500 mt-1">当前位置</div>
                </div>
              </div>
            </div>

            {/* 更新时间 */}
            <div className="text-center text-xs text-gray-500 mb-4">
              数据来源: wttr.in • 更新于 {new Date().toLocaleTimeString('zh-CN')}
            </div>
          </>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🌦️</div>
            <p className="text-gray-600 mb-4">无法获取天气数据</p>
            <button
              onClick={() => loadWeather()}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl ios-button"
            >
              重试
            </button>
          </div>
        )}
      </div>

      {/* 自定义天气模态框 */}
      {showCustomMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* 顶部 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">自定义天气</h2>
                <button
                  onClick={() => setShowCustomMode(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl ios-button"
                >
                  ×
                </button>
              </div>
            </div>

            {/* 自定义表单 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 城市名称 */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">城市名称</label>
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="例如：北京、我的家乡"
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* 温度 */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">温度 (°C)</label>
                <input
                  type="number"
                  value={customTemp}
                  onChange={(e) => setCustomTemp(e.target.value)}
                  placeholder="例如：25"
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* 天气状况 */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">天气状况</label>
                <div className="grid grid-cols-3 gap-2">
                  {['晴天', '多云', '阴天', '小雨', '中雨', '大雨', '雷阵雨', '小雪', '大雪', '雾', '大风', '其他'].map((cond) => (
                    <button
                      key={cond}
                      onClick={() => setCustomCondition(cond)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        customCondition === cond
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* 预览 */}
              {customCity && customTemp && (
                <div className="glass-card rounded-xl p-4 bg-blue-50">
                  <p className="text-xs text-gray-600 mb-2">预览</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{customTemp}°C</div>
                      <div className="text-sm text-gray-600">{customCondition}</div>
                      <div className="text-xs text-gray-500 mt-1">{customCity}</div>
                    </div>
                    <div className="text-5xl">{getWeatherIcon(customCondition)}</div>
                  </div>
                </div>
              )}

              {/* 按钮 */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSaveCustom}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium ios-button"
                >
                  保存自定义天气
                </button>
                
                {customWeather && (
                  <button
                    onClick={handleDisableCustom}
                    className="w-full py-3 glass-card text-gray-700 rounded-xl font-medium ios-button"
                  >
                    切换到真实天气
                  </button>
                )}
                
                <button
                  onClick={() => setShowCitySelector(true)}
                  className="w-full py-3 glass-card text-blue-600 rounded-xl font-medium ios-button"
                >
                  或者选择真实城市
                </button>
              </div>

              {/* 说明 */}
              <div className="glass-card rounded-xl p-4 bg-yellow-50">
                <p className="text-xs text-gray-600">
                  💡 <span className="font-semibold">使用说明：</span><br/>
                  • 自定义天气会覆盖真实天气数据<br/>
                  • 可以设置任意城市名和温度<br/>
                  • 桌面和详情页都会显示自定义数据<br/>
                  • 随时可以切换回真实天气
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 城市选择器模态框 */}
      {showCitySelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* 顶部 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">选择城市</h2>
                <button
                  onClick={() => {
                    setShowCitySelector(false)
                    setSearchCity('')
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl ios-button"
                >
                  ×
                </button>
              </div>
              
              {/* 搜索框 */}
              <div className="relative">
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="搜索全世界任意城市..."
                  className="w-full px-4 py-3 pr-24 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchCity.trim()) {
                      handleCityChange(searchCity.trim())
                    }
                  }}
                />
                {searchCity && (
                  <button
                    onClick={() => handleCityChange(searchCity.trim())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium ios-button"
                  >
                    搜索
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                💡 请输入<span className="font-semibold text-blue-600">完整</span>的城市名称，如：嘉兴、Jiaxing、New York
              </p>
            </div>

            {/* 常用城市列表 */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">常用城市</h3>
              <div className="grid grid-cols-4 gap-2">
                {popularCities.map((city) => (
                  <button
                    key={city.value}
                    onClick={() => handleCityChange(city.value)}
                    className={`px-3 py-2 rounded-lg ios-button text-xs font-medium transition-all ${
                      currentCity === city.value
                        ? 'bg-blue-500 text-white'
                        : 'glass-card text-gray-700 hover:shadow-md'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeatherDetail
