import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// AI状态类型
export interface AIStatus {
  location: string
  activity: string
  isOnline: boolean
  battery: number
  isCharging: boolean
  screenOn: boolean
  currentApp: string
  mood: string
  steps: number
  isSleeping: boolean
  weather: string
}

// 轨迹点
export interface TrackPoint {
  id: string
  time: string
  location: string
  duration: number
  activity: string
}

// AI日程
interface Schedule {
  time: string
  activity: string
  location: string
}

interface AILifeContextType {
  getAIStatus: (characterId: string) => AIStatus
  getTodayTrack: (characterId: string) => TrackPoint[]
  updateAIStatus: (characterId: string, status: Partial<AIStatus>) => void
  shouldAIReply: (characterId: string) => { canReply: boolean; reason?: string; delaySeconds?: number }
}

const AILifeContext = createContext<AILifeContextType | undefined>(undefined)

export const useAILife = () => {
  const context = useContext(AILifeContext)
  if (!context) {
    throw new Error('useAILife must be used within AILifeProvider')
  }
  return context
}

// 默认日程表（可以根据角色定制）
const defaultSchedule: Schedule[] = [
  { time: '07:30', activity: '起床', location: '家' },
  { time: '08:00', activity: '洗漱吃早餐', location: '家' },
  { time: '08:50', activity: '出门上班', location: '地铁站' },
  { time: '09:15', activity: '到达公司', location: '公司' },
  { time: '12:00', activity: '午餐', location: '附近餐厅' },
  { time: '12:45', activity: '回到公司', location: '公司' },
  { time: '15:00', activity: '下午茶', location: '星巴克' },
  { time: '15:30', activity: '回到公司', location: '公司' },
  { time: '18:00', activity: '下班', location: '公司' },
  { time: '18:30', activity: '回家路上', location: '地铁上' },
  { time: '19:00', activity: '到家', location: '家' },
  { time: '19:30', activity: '做饭', location: '家' },
  { time: '20:30', activity: '休息娱乐', location: '家' },
  { time: '23:00', activity: '洗漱准备睡觉', location: '家' },
  { time: '23:30', activity: '睡觉', location: '家' },
]

// 根据时间获取当前应该的状态
const getCurrentScheduledActivity = (): Schedule => {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  // 找到最近的活动
  let currentActivity = defaultSchedule[0]
  for (let i = 0; i < defaultSchedule.length; i++) {
    const [hours, minutes] = defaultSchedule[i].time.split(':').map(Number)
    const activityMinutes = hours * 60 + minutes
    
    if (currentMinutes >= activityMinutes) {
      currentActivity = defaultSchedule[i]
    } else {
      break
    }
  }
  
  return currentActivity
}

// 生成今日轨迹
const generateTodayTrack = (): TrackPoint[] => {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const track: TrackPoint[] = []
  
  for (let i = 0; i < defaultSchedule.length; i++) {
    const schedule = defaultSchedule[i]
    const [hours, minutes] = schedule.time.split(':').map(Number)
    const activityMinutes = hours * 60 + minutes
    
    // 只添加已经发生的活动
    if (activityMinutes <= currentMinutes) {
      // 计算停留时长
      let duration = 0
      if (i < defaultSchedule.length - 1) {
        const [nextHours, nextMinutes] = defaultSchedule[i + 1].time.split(':').map(Number)
        const nextActivityMinutes = nextHours * 60 + nextMinutes
        duration = Math.min(nextActivityMinutes - activityMinutes, currentMinutes - activityMinutes)
      } else {
        duration = currentMinutes - activityMinutes
      }
      
      track.push({
        id: String(i),
        time: schedule.time,
        location: schedule.location,
        duration,
        activity: schedule.activity
      })
    }
  }
  
  return track
}

// 计算电量（随时间消耗）
const calculateBattery = (): number => {
  const now = new Date()
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
  
  // 假设早上7点充满电，到晚上11点剩余20%
  // 16小时消耗80%，每分钟约0.083%
  const minutesSinceFullCharge = minutesSinceMidnight - 7 * 60
  const batteryDrain = (minutesSinceFullCharge / (16 * 60)) * 80
  
  return Math.max(20, Math.min(100, 100 - batteryDrain))
}

// 计算步数（随时间增加）
const calculateSteps = (): number => {
  const now = new Date()
  const hour = now.getHours()
  
  // 根据时间段估算步数
  if (hour < 8) return Math.floor(Math.random() * 500)
  if (hour < 12) return Math.floor(2000 + Math.random() * 1000) // 上班通勤
  if (hour < 14) return Math.floor(3000 + Math.random() * 1000) // 午餐
  if (hour < 18) return Math.floor(4000 + Math.random() * 1000) // 下午
  if (hour < 20) return Math.floor(6000 + Math.random() * 2000) // 下班回家
  return Math.floor(7000 + Math.random() * 3000) // 晚上
}

// 判断是否在睡觉
const isCurrentlySleeping = (): boolean => {
  const hour = new Date().getHours()
  return hour >= 23 || hour < 7
}

// 获取心情（根据时间和活动）
const getMood = (activity: string): string => {
  const hour = new Date().getHours()
  
  if (activity === '睡觉') return '睡梦中...'
  if (hour < 9) return '刚起床，有点困'
  if (activity === '午餐') return '饿了，吃饭真开心'
  if (activity === '下午茶') return '喝杯咖啡提提神~'
  if (hour >= 18 && hour < 20) return '终于下班了！'
  if (hour >= 20) return '放松的晚上~'
  
  return '心情不错'
}

// 获取天气（简化版，实际可接入天气API）
const getWeather = (): string => {
  const weathers = ['晴天☀️', '多云⛅', '小雨🌧️']
  return weathers[new Date().getDate() % weathers.length]
}

export const AILifeProvider = ({ children }: { children: ReactNode }) => {
  const [aiStatuses, setAiStatuses] = useState<Record<string, AIStatus>>({})

  // 初始化或更新AI状态
  const updateAIStatusForCharacter = (characterId: string) => {
    const currentActivity = getCurrentScheduledActivity()
    const battery = calculateBattery()
    const steps = calculateSteps()
    const isSleeping = isCurrentlySleeping()
    const mood = getMood(currentActivity.activity)
    const weather = getWeather()
    
    setAiStatuses(prev => ({
      ...prev,
      [characterId]: {
        location: currentActivity.location,
        activity: currentActivity.activity,
        isOnline: !isSleeping,
        battery: Math.round(battery),
        isCharging: battery < 30 || new Date().getHours() >= 23,
        screenOn: !isSleeping && Math.random() > 0.3, // 70%概率屏幕亮着
        currentApp: isSleeping ? '无' : ['微信', '抖音', '小红书', '哔哩哔哩'][Math.floor(Math.random() * 4)],
        mood,
        steps,
        isSleeping,
        weather
      }
    }))
  }

  // 定时更新所有AI状态（每分钟）
  useEffect(() => {
    const interval = setInterval(() => {
      // 获取所有角色ID并更新状态
      const characterIds = Object.keys(aiStatuses)
      if (characterIds.length === 0) {
        // 如果还没有任何角色，尝试从localStorage获取
        const chatList = localStorage.getItem('chatList')
        if (chatList) {
          const chats = JSON.parse(chatList)
          chats.forEach((chat: any) => {
            if (chat.id) {
              updateAIStatusForCharacter(chat.id)
            }
          })
        }
      } else {
        characterIds.forEach(updateAIStatusForCharacter)
      }
    }, 60000) // 每分钟更新

    return () => clearInterval(interval)
  }, [aiStatuses])

  const getAIStatus = (characterId: string): AIStatus => {
    if (!aiStatuses[characterId]) {
      updateAIStatusForCharacter(characterId)
    }
    return aiStatuses[characterId] || {
      location: '家',
      activity: '休息中',
      isOnline: true,
      battery: 50,
      isCharging: false,
      screenOn: true,
      currentApp: '微信',
      mood: '心情不错',
      steps: 0,
      isSleeping: false,
      weather: '晴天☀️'
    }
  }

  const getTodayTrack = (characterId: string): TrackPoint[] => {
    return generateTodayTrack()
  }

  const updateAIStatus = (characterId: string, status: Partial<AIStatus>) => {
    setAiStatuses(prev => ({
      ...prev,
      [characterId]: {
        ...getAIStatus(characterId),
        ...status
      }
    }))
  }

  // 判断AI是否应该回复（根据状态）
  const shouldAIReply = (characterId: string): { canReply: boolean; reason?: string; delaySeconds?: number } => {
    const status = getAIStatus(characterId)
    
    // 睡觉时不回复
    if (status.isSleeping) {
      return { canReply: false, reason: '对方正在睡觉，可能看不到消息' }
    }
    
    // 电量低于5%可能看不到
    if (status.battery < 5) {
      return { canReply: false, reason: '对方手机快没电了，可能已关机' }
    }
    
    // 屏幕息屏时延迟回复
    if (!status.screenOn) {
      return { canReply: true, delaySeconds: 5 + Math.random() * 10, reason: '对方手机息屏，稍后回复' }
    }
    
    // 在使用其他APP时延迟回复
    if (status.currentApp !== '微信') {
      return { canReply: true, delaySeconds: 3 + Math.random() * 7, reason: `对方在${status.currentApp}，稍后回复` }
    }
    
    // 特定活动延迟
    if (status.activity === '开会') {
      return { canReply: true, delaySeconds: 30 + Math.random() * 60, reason: '对方在开会，可能较晚回复' }
    }
    
    if (status.activity === '洗澡') {
      return { canReply: false, reason: '对方在洗澡，暂时看不到消息' }
    }
    
    if (status.activity === '地铁上' || status.activity === '通勤中') {
      return { canReply: true, delaySeconds: 10 + Math.random() * 20, reason: '对方在路上，信号可能不好' }
    }
    
    // 正常回复
    return { canReply: true, delaySeconds: 1 + Math.random() * 3 }
  }

  return (
    <AILifeContext.Provider value={{ getAIStatus, getTodayTrack, updateAIStatus, shouldAIReply }}>
      {children}
    </AILifeContext.Provider>
  )
}

