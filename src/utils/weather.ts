// 天气API工具

export interface WeatherData {
  temperature: number
  condition: string
  conditionCN: string
  icon: string
  location: string
  humidity: number
  windSpeed: number
  airQuality?: string
}

// 天气状况映射（中英文）
const weatherConditionMap: { [key: string]: { cn: string; icon: string } } = {
  'clear': { cn: '晴朗', icon: '☀️' },
  'sunny': { cn: '晴天', icon: '☀️' },
  'partly cloudy': { cn: '多云', icon: '⛅' },
  'cloudy': { cn: '阴天', icon: '☁️' },
  'overcast': { cn: '阴', icon: '☁️' },
  'mist': { cn: '薄雾', icon: '🌫️' },
  'fog': { cn: '雾', icon: '🌫️' },
  'rain': { cn: '雨', icon: '🌧️' },
  'light rain': { cn: '小雨', icon: '🌦️' },
  'moderate rain': { cn: '中雨', icon: '🌧️' },
  'heavy rain': { cn: '大雨', icon: '⛈️' },
  'shower': { cn: '阵雨', icon: '🌦️' },
  'thunderstorm': { cn: '雷阵雨', icon: '⛈️' },
  'snow': { cn: '雪', icon: '🌨️' },
  'light snow': { cn: '小雪', icon: '🌨️' },
  'heavy snow': { cn: '大雪', icon: '❄️' },
  'sleet': { cn: '雨夹雪', icon: '🌨️' }
}

// 获取天气状况的中文和图标
const getWeatherInfo = (condition: string) => {
  const lowerCondition = condition.toLowerCase()
  
  for (const [key, value] of Object.entries(weatherConditionMap)) {
    if (lowerCondition.includes(key)) {
      return value
    }
  }
  
  return { cn: condition, icon: '🌤️' }
}

// 使用wttr.in API获取天气（无需API key）
export const fetchWeather = async (city: string = 'Beijing'): Promise<WeatherData> => {
  try {
    // 默认使用北京，如果用户想用其他城市可以修改
    const cityToUse = city === 'auto' ? 'Beijing' : city
    
    // 使用wttr.in的JSON格式API，lang=zh获取中文
    const response = await fetch(`https://wttr.in/${cityToUse}?format=j1&lang=zh-cn`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const current = data.current_condition[0]
    const location = data.nearest_area[0]
    
    const temp = parseInt(current.temp_C)
    // 优先使用中文天气描述
    const condition = current.lang_zh_cn?.[0]?.value || current.weatherDesc[0].value
    const weatherInfo = getWeatherInfo(condition)
    
    // 获取中文地名 - 优化提取逻辑
    let locationName = cityToUse // 默认使用用户输入的城市名
    
    // 尝试多个来源获取中文地名
    const sources = [
      location.areaName,
      location.region, 
      location.country
    ]
    
    for (const source of sources) {
      if (source && source.length > 0) {
        // 优先查找中文
        const chineseName = source.find((item: any) => 
          /[\u4e00-\u9fa5]/.test(item.value) // 包含中文字符
        )
        if (chineseName) {
          locationName = chineseName.value
          break
        }
      }
    }
    
    // 如果还是没有中文，尝试使用输入的城市名（如果是中文）
    if (!locationName || !/[\u4e00-\u9fa5]/.test(locationName)) {
      if (/[\u4e00-\u9fa5]/.test(cityToUse)) {
        locationName = cityToUse
      }
    }
    
    return {
      temperature: temp,
      condition: condition,
      conditionCN: weatherInfo.cn,
      icon: weatherInfo.icon,
      location: locationName,
      humidity: parseInt(current.humidity),
      windSpeed: parseInt(current.windspeedKmph),
      airQuality: getAirQualityText(parseInt(current.FeelsLikeC))
    }
  } catch (error) {
    console.error('获取天气失败:', error)
    throw error
  }
}

// 使用高德天气API（备用方案，需要城市代码）
export const fetchWeatherGaode = async (city: string = '北京'): Promise<WeatherData> => {
  try {
    // 注意：这需要高德API key，这里只是示例
    const apiKey = 'YOUR_GAODE_API_KEY'
    const response = await fetch(
      `https://restapi.amap.com/v3/weather/weatherInfo?city=${encodeURIComponent(city)}&key=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status === '1' && data.lives && data.lives.length > 0) {
      const live = data.lives[0]
      const weatherInfo = getWeatherInfo(live.weather)
      
      return {
        temperature: parseInt(live.temperature),
        condition: live.weather,
        conditionCN: live.weather,
        icon: weatherInfo.icon,
        location: live.city,
        humidity: parseInt(live.humidity),
        windSpeed: 0,
        airQuality: 'good'
      }
    }
    
    throw new Error('天气数据格式错误')
  } catch (error) {
    console.error('获取天气失败:', error)
    throw error
  }
}

// 空气质量评级
const getAirQualityText = (feelsLike: number): string => {
  const diff = Math.abs(feelsLike)
  if (diff < 25) return 'excellent'
  if (diff < 30) return 'good'
  if (diff < 35) return 'moderate'
  return 'poor'
}

// 获取位置信息（使用浏览器定位）
export const getCurrentLocation = (): Promise<{ lat: number; lon: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位'))
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      },
      {
        timeout: 10000,
        maximumAge: 600000 // 10分钟缓存
      }
    )
  })
}

// 根据经纬度获取天气
export const fetchWeatherByCoords = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await fetch(`https://wttr.in/${lat},${lon}?format=j1&lang=zh`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const current = data.current_condition[0]
    const location = data.nearest_area[0]
    
    const temp = parseInt(current.temp_C)
    const condition = current.weatherDesc[0].value
    const weatherInfo = getWeatherInfo(condition)
    
    return {
      temperature: temp,
      condition: condition,
      conditionCN: weatherInfo.cn,
      icon: weatherInfo.icon,
      location: location.areaName[0].value || location.region[0].value,
      humidity: parseInt(current.humidity),
      windSpeed: parseInt(current.windspeedKmph),
      airQuality: getAirQualityText(parseInt(current.FeelsLikeC))
    }
  } catch (error) {
    console.error('获取天气失败:', error)
    throw error
  }
}
