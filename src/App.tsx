/**
 * App.tsx 路由懒加载优化示例
 * 
 * 使用说明：
 * 1. 将此文件重命名为 App.tsx（备份原文件）
 * 2. 所有大型页面组件将按需加载
 * 3. 首屏加载性能将显著提升
 * 
 * 性能提升预期：
 * - 首屏JS包大小减少约60-70%
 * - 首次加载时间减少约40-50%
 * - LCP (Largest Contentful Paint) 改善明显
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { SettingsProvider } from './context/SettingsContext'
import { UserProvider } from './context/UserContext'
import { CharacterProvider } from './context/CharacterContext'
import { MomentsProvider } from './context/MomentsContext'
import './utils/clearAvatarCache' // 导入清理工具，使其在控制台可用
import { ApiProvider } from './context/ApiContext'
import { RedEnvelopeProvider } from './context/RedEnvelopeContext'
import { ThemeProvider } from './context/ThemeContext'
import { BackgroundProvider } from './context/BackgroundContext'
import { AccountingProvider } from './context/AccountingContext'
import { GroupProvider } from './context/GroupContext'
import { GroupRedEnvelopeProvider } from './context/GroupRedEnvelopeContext'
import { MusicPlayerProvider, useMusicPlayer } from './context/MusicPlayerContext'
import { AILifeProvider } from './context/AILifeContext'
import { ForumProvider } from './context/ForumContext'
import DynamicIsland from './components/DynamicIsland'
import './styles/redenvelope.css'
import Layout from './components/Layout'
import MomentsSocialManager from './components/MomentsSocialManager'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineIndicator from './components/OfflineIndicator'
import { initPerformanceMonitor } from './utils/performance'

// 通用加载组件
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600">加载中...</p>
    </div>
  </div>
)

// 核心页面 - 直接导入（首屏需要）
import ChatList from './pages/ChatList'
import Contacts from './pages/Contacts'
import Discover from './pages/Discover'
import Me from './pages/Me'

// 懒加载重试函数
const lazyWithRetry = (componentImport: () => Promise<any>) => {
  return lazy(() => 
    componentImport().catch((error) => {
      console.error('懒加载失败，尝试重新加载:', error)
      // 重试一次
      return componentImport().catch((retryError) => {
        console.error('重试失败:', retryError)
        throw retryError
      })
    })
  )
}

// 高频页面 - 懒加载但优先级高
const ChatDetail = lazyWithRetry(() => import('./pages/ChatDetail'))
const Moments = lazyWithRetry(() => import('./pages/Moments'))
const Settings = lazyWithRetry(() => import('./pages/Settings'))

// 中频页面 - 懒加载（关键页面使用重试）
const Profile = lazy(() => import('./pages/Profile'))
const ChatSettings = lazy(() => import('./pages/ChatSettings'))
const CreateCharacter = lazyWithRetry(() => import('./pages/CreateCharacter'))
const EditCharacter = lazy(() => import('./pages/EditCharacter'))
const CharacterDetail = lazy(() => import('./pages/CharacterDetail'))

// API配置页面
const ApiConfig = lazy(() => import('./pages/ApiConfig'))
const ApiList = lazy(() => import('./pages/ApiList'))
const AddApi = lazy(() => import('./pages/AddApi'))
const EditApi = lazy(() => import('./pages/EditApi'))

// 用户管理
const EditProfile = lazy(() => import('./pages/EditProfile'))
const UserList = lazy(() => import('./pages/UserList'))
const CreateUser = lazy(() => import('./pages/CreateUser'))

// 朋友圈相关
const PublishMoment = lazy(() => import('./pages/PublishMoment'))
const MomentNotifications = lazy(() => import('./pages/MomentNotifications'))

// 钱包相关
const Wallet = lazy(() => import('./pages/Wallet'))
const SendTransfer = lazy(() => import('./pages/SendTransfer'))
const Services = lazy(() => import('./pages/Services'))
const TransactionHistory = lazy(() => import('./pages/TransactionHistory'))
const CardWallet = lazy(() => import('./pages/CardWallet'))
const CreateIntimatePay = lazy(() => import('./pages/CreateIntimatePay'))
const IntimatePayDetail = lazy(() => import('./pages/IntimatePayDetail'))
const ReceiveIntimatePay = lazy(() => import('./pages/ReceiveIntimatePay'))
const WalletHelp = lazy(() => import('./pages/WalletHelp'))

// 记忆系统
const MemoryViewer = lazy(() => import('./pages/MemoryViewer'))
const MemorySummary = lazy(() => import('./pages/MemorySummary'))
const MemoryCleanup = lazy(() => import('./pages/MemoryCleanup'))

// 日记和火花
const Diary = lazy(() => import('./pages/Diary'))
const StreakDetail = lazy(() => import('./pages/StreakDetail'))
const SparkMoments = lazy(() => import('./pages/SparkMoments'))

// 记账功能
const Accounting = lazy(() => import('./pages/Accounting'))
const AccountingChat = lazy(() => import('./pages/AccountingChat'))
const AddTransaction = lazy(() => import('./pages/AddTransaction'))

// 群聊功能
const GroupList = lazy(() => import('./pages/GroupList'))
const CreateGroup = lazy(() => import('./pages/CreateGroup'))
const GroupChatDetail = lazy(() => import('./pages/GroupChatDetail'))
const GroupSettings = lazy(() => import('./pages/GroupSettings'))

// 特殊功能
const ShakeShake = lazy(() => import('./pages/ShakeShake'))
const Live = lazy(() => import('./pages/Live'))
const LiveRoom = lazy(() => import('./pages/LiveRoom'))
const CoupleSpace = lazy(() => import('./pages/CoupleSpace'))
const CoupleAlbum = lazy(() => import('./pages/CoupleAlbum'))
const CoupleAnniversary = lazy(() => import('./pages/CoupleAnniversary'))
const CoupleMessageBoard = lazy(() => import('./pages/CoupleMessageBoard'))
const CalendarView = lazy(() => import('./pages/CalendarView'))
const AIFootprint = lazy(() => import('./pages/AIFootprint'))

// 表情包和自定义
const MemesLibrary = lazy(() => import('./pages/MemesLibrary'))
const BubbleStore = lazy(() => import('./pages/BubbleStore'))
const FontCustomizer = lazy(() => import('./pages/FontCustomizer'))
const IconCustomizer = lazy(() => import('./pages/IconCustomizer'))
const BackgroundCustomizer = lazy(() => import('./pages/BackgroundCustomizer'))
const WeatherDetail = lazy(() => import('./pages/WeatherDetail'))

// 音乐播放器
const MusicPlayer = lazy(() => import('./pages/MusicPlayer'))
const UploadSong = lazy(() => import('./pages/UploadSong'))

// AI手机查看
const AIPhoneSelect = lazy(() => import('./pages/AIPhoneSelect'))
const MusicSearch = lazy(() => import('./pages/MusicSearch'))
const MusicTogetherChat = lazy(() => import('./pages/MusicTogetherChat'))
const MusicInviteDemo = lazy(() => import('./pages/MusicInviteDemo'))

// 游戏
const GomokuGame = lazy(() => import('./pages/GomokuGame'))
const GameCharacterSelect = lazy(() => import('./pages/GameCharacterSelect'))
const GameList = lazy(() => import('./pages/GameList'))
const UndercoverGame = lazy(() => import('./pages/UndercoverGame'))

// 其他
const Desktop = lazy(() => import('./pages/Desktop'))
const StoryMode = lazy(() => import('./pages/StoryMode'))
const WorldBook = lazy(() => import('./pages/WorldBook'))
const EditWorldBook = lazy(() => import('./pages/EditWorldBook'))
const PresetManager = lazy(() => import('./pages/PresetManager'))
const OfflineChat = lazy(() => import('./pages/OfflineChat'))
const Customize = lazy(() => import('./pages/Customize'))
const StatusBarCustomize = lazy(() => import('./pages/StatusBarCustomize'))
const LifeSettings = lazy(() => import('./pages/LifeSettings'))
const StorageMigration = lazy(() => import('./pages/StorageMigration'))
const MiniPrograms = lazy(() => import('./pages/MiniPrograms'))
const SettingsNew = lazy(() => import('./pages/SettingsNew'))
const About = lazy(() => import('./pages/About'))

// 论坛功能
const Forum = lazy(() => import('./pages/Forum'))
const ForumWelcome = lazy(() => import('./pages/ForumWelcome'))
const ForumInitialize = lazy(() => import('./pages/ForumInitialize'))
const ForumCharacterList = lazy(() => import('./pages/ForumCharacterList'))
const ForumPublish = lazy(() => import('./pages/ForumPublish'))
const ForumPostDetail = lazy(() => import('./pages/ForumPostDetail'))
const ForumSearch = lazy(() => import('./pages/ForumSearch'))
const ForumTopics = lazy(() => import('./pages/ForumTopics'))
const ForumCreateTopic = lazy(() => import('./pages/ForumCreateTopic'))
const ForumTopicDetail = lazy(() => import('./pages/ForumTopicDetail'))
const ForumNotifications = lazy(() => import('./pages/ForumNotifications'))
const ForumProfile = lazy(() => import('./pages/ForumProfile'))
const ForumUserProfile = lazy(() => import('./pages/ForumUserProfile'))
const ForumMemeManager = lazy(() => import('./pages/ForumMemeManager'))

// DynamicIsland包装组件
const DynamicIslandWrapper = () => {
  const musicPlayer = useMusicPlayer()
  
  if (!musicPlayer.currentSong) return null
  
  return (
    <DynamicIsland
      isPlaying={musicPlayer.isPlaying}
      currentSong={musicPlayer.currentSong}
      onPlayPause={musicPlayer.togglePlay}
      onNext={musicPlayer.next}
      onPrevious={musicPlayer.previous}
      currentTime={musicPlayer.currentTime}
      duration={musicPlayer.duration}
    />
  )
}

// 加载包装器组件
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  </ErrorBoundary>
)

function App() {
  // 初始化性能监控
  useEffect(() => {
    if (import.meta.env.DEV) {
      initPerformanceMonitor()
      console.log('📊 性能监控已启动')
    }
  }, [])

  // 加载自定义字体 - 优化版
  useEffect(() => {
    const loadCustomFonts = async () => {
      try {
        const savedFonts = localStorage.getItem('custom_fonts')
        if (!savedFonts) return

        const fonts = JSON.parse(savedFonts)
        console.log(`🔄 开始加载 ${fonts.length} 个自定义字体...`)

        const loadedFonts = new Set<string>()
        
        document.fonts.forEach((font: any) => {
          if (font.family) {
            loadedFonts.add(font.family)
          }
        })

        const loadPromises = fonts.map(async (font: any) => {
          try {
            if (loadedFonts.has(font.fontFamily)) {
              console.log(`⚡ 字体已存在，跳过: ${font.name}`)
              return true
            }

            const fontFace = new FontFace(font.fontFamily, `url(${font.url})`, {
              display: 'swap'
            })
            await fontFace.load()
            document.fonts.add(fontFace)
            loadedFonts.add(font.fontFamily)
            console.log(`✅ 字体加载成功: ${font.name}`)
            return true
          } catch (error) {
            console.error(`❌ 字体加载失败: ${font.name}`, error)
            return false
          }
        })

        await Promise.all(loadPromises)
        
        const currentFontValue = localStorage.getItem('chat_font_family_value')
        const currentFontId = localStorage.getItem('chat_font_family')
        if (currentFontValue && currentFontId !== 'system') {
          document.documentElement.style.setProperty('--chat-font-family', currentFontValue)
          console.log(`✅ 已应用字体: ${currentFontValue}`)
        }
        
        console.log(`✅ 所有字体加载完成`)
      } catch (error) {
        console.error('字体加载失败:', error)
      }
    }

    loadCustomFonts()
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BackgroundProvider>
          <SettingsProvider>
            <ApiProvider>
              <UserProvider>
                <CharacterProvider>
                  <AILifeProvider>
                    <MomentsProvider>
                      <RedEnvelopeProvider>
                      <AccountingProvider>
                        <GroupProvider>
                          <GroupRedEnvelopeProvider>
                            <ForumProvider>
                            <MusicPlayerProvider>
                              <Router basename="/zhizhi">
                                <OfflineIndicator />
                                <DynamicIslandWrapper />
                                <MomentsSocialManager>
                                <Routes>
                                  <Route path="/wechat" element={<Layout />}>
                                    <Route index element={<ChatList />} />
                                    <Route path="contacts" element={<Contacts />} />
                                    <Route path="discover" element={<Discover />} />
                                    <Route path="me" element={<Me />} />
                                  </Route>
                                  
                                  {/* 懒加载路由 */}
                                  <Route path="/chat/:id" element={<PageWrapper><ChatDetail /></PageWrapper>} />
                                  <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
                                  <Route path="/settings-new" element={<PageWrapper><SettingsNew /></PageWrapper>} />
                                  <Route path="/profile/:id" element={<PageWrapper><Profile /></PageWrapper>} />
                                  <Route path="/edit-profile" element={<PageWrapper><EditProfile /></PageWrapper>} />
                                  <Route path="/users" element={<PageWrapper><UserList /></PageWrapper>} />
                                  <Route path="/create-user" element={<PageWrapper><CreateUser /></PageWrapper>} />
                                  <Route path="/create-character" element={<PageWrapper><CreateCharacter /></PageWrapper>} />
                                  <Route path="/api-config" element={<PageWrapper><ApiConfig /></PageWrapper>} />
                                  <Route path="/api-list" element={<PageWrapper><ApiList /></PageWrapper>} />
                                  <Route path="/add-api" element={<PageWrapper><AddApi /></PageWrapper>} />
                                  <Route path="/edit-api/:id" element={<PageWrapper><EditApi /></PageWrapper>} />
                                  {/* 兼容带 /wechat 前缀的 API 路由 */}
                                  <Route path="/wechat/api-config" element={<PageWrapper><ApiConfig /></PageWrapper>} />
                                  <Route path="/wechat/api-list" element={<PageWrapper><ApiList /></PageWrapper>} />
                                  <Route path="/wechat/add-api" element={<PageWrapper><AddApi /></PageWrapper>} />
                                  <Route path="/wechat/edit-api/:id" element={<PageWrapper><EditApi /></PageWrapper>} />
                                  <Route path="/character/:id" element={<PageWrapper><CharacterDetail /></PageWrapper>} />
                                  <Route path="/edit-character/:id" element={<PageWrapper><EditCharacter /></PageWrapper>} />
                                  <Route path="/moments" element={<PageWrapper><Moments /></PageWrapper>} />
                                  <Route path="/publish-moment" element={<PageWrapper><PublishMoment /></PageWrapper>} />
                                  <Route path="/moment-notifications" element={<PageWrapper><MomentNotifications /></PageWrapper>} />
                                  {/* 兼容带 /wechat 前缀的朋友圈路由 */}
                                  <Route path="/wechat/moments" element={<PageWrapper><Moments /></PageWrapper>} />
                                  <Route path="/send-transfer/:id" element={<PageWrapper><SendTransfer /></PageWrapper>} />
                                  <Route path="/chat-settings/:id" element={<PageWrapper><ChatSettings /></PageWrapper>} />
                                  <Route path="/memory/:characterId" element={<PageWrapper><MemoryViewer /></PageWrapper>} />
                                  <Route path="/memory-summary/:characterId" element={<PageWrapper><MemorySummary /></PageWrapper>} />
                                  <Route path="/wallet" element={<PageWrapper><Wallet /></PageWrapper>} />
                                  <Route path="/services" element={<PageWrapper><Services /></PageWrapper>} />
                                  <Route path="/transaction-history" element={<PageWrapper><TransactionHistory /></PageWrapper>} />
                                  <Route path="/card-wallet" element={<PageWrapper><CardWallet /></PageWrapper>} />
                                  <Route path="/create-intimate-pay/:characterId" element={<PageWrapper><CreateIntimatePay /></PageWrapper>} />
                                  <Route path="/intimate-pay/:characterId" element={<PageWrapper><IntimatePayDetail /></PageWrapper>} />
                                  <Route path="/intimate-pay/receive/:characterId/:amount" element={<PageWrapper><ReceiveIntimatePay /></PageWrapper>} />
                                  <Route path="/wallet-help" element={<PageWrapper><WalletHelp /></PageWrapper>} />
                                  <Route path="/diary/:characterId" element={<PageWrapper><Diary /></PageWrapper>} />
                                  <Route path="/streak/:characterId" element={<PageWrapper><StreakDetail /></PageWrapper>} />
                                  <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
                                  <Route path="/accounting" element={<PageWrapper><Accounting /></PageWrapper>} />
                                  <Route path="/accounting-chat" element={<PageWrapper><AccountingChat /></PageWrapper>} />
                                  <Route path="/add-transaction" element={<PageWrapper><AddTransaction /></PageWrapper>} />
                                  <Route path="/groups" element={<PageWrapper><GroupList /></PageWrapper>} />
                                  <Route path="/create-group" element={<PageWrapper><CreateGroup /></PageWrapper>} />
                                  <Route path="/group/:id" element={<PageWrapper><GroupChatDetail /></PageWrapper>} />
                                  <Route path="/group-settings/:id" element={<PageWrapper><GroupSettings /></PageWrapper>} />
                                  <Route path="/shake-shake" element={<PageWrapper><ShakeShake /></PageWrapper>} />
                                  <Route path="/live" element={<PageWrapper><Live /></PageWrapper>} />
                                  <Route path="/live-room/:id" element={<PageWrapper><LiveRoom /></PageWrapper>} />
                                  <Route path="/couple-space" element={<PageWrapper><CoupleSpace /></PageWrapper>} />
                                  <Route path="/couple-space/:characterId" element={<PageWrapper><CoupleSpace /></PageWrapper>} />
                                  <Route path="/couple-album" element={<PageWrapper><CoupleAlbum /></PageWrapper>} />
                                  <Route path="/couple-anniversary" element={<PageWrapper><CoupleAnniversary /></PageWrapper>} />
                                  <Route path="/couple-message-board" element={<PageWrapper><CoupleMessageBoard /></PageWrapper>} />
                                  <Route path="/calendar" element={<PageWrapper><CalendarView /></PageWrapper>} />
                                  <Route path="/ai-footprint" element={<PageWrapper><AIFootprint /></PageWrapper>} />
                                  <Route path="/ai-footprint/:characterId" element={<PageWrapper><AIFootprint /></PageWrapper>} />
                                  <Route path="/life-settings/:characterId" element={<PageWrapper><LifeSettings /></PageWrapper>} />
                                  <Route path="/spark-moments" element={<PageWrapper><SparkMoments /></PageWrapper>} />
                                  <Route path="/memes-library" element={<PageWrapper><MemesLibrary /></PageWrapper>} />
                                  <Route path="/mini-programs" element={<PageWrapper><MiniPrograms /></PageWrapper>} />
                                  <Route path="/bubble-store" element={<PageWrapper><BubbleStore /></PageWrapper>} />
                                  <Route path="/font-customizer" element={<PageWrapper><FontCustomizer /></PageWrapper>} />
                                  <Route path="/icon-customizer" element={<PageWrapper><IconCustomizer /></PageWrapper>} />
                                  <Route path="/background-customizer" element={<PageWrapper><BackgroundCustomizer /></PageWrapper>} />
                                  <Route path="/weather-detail" element={<PageWrapper><WeatherDetail /></PageWrapper>} />
                                  <Route path="/music-player" element={<PageWrapper><MusicPlayer /></PageWrapper>} />
                                  <Route path="/upload-song" element={<PageWrapper><UploadSong /></PageWrapper>} />
                                  <Route path="/music-search" element={<PageWrapper><MusicSearch /></PageWrapper>} />
                                  <Route path="/music-together-chat" element={<PageWrapper><MusicTogetherChat /></PageWrapper>} />
                                  <Route path="/music-invite-demo" element={<PageWrapper><MusicInviteDemo /></PageWrapper>} />
                                  <Route path="/game/gomoku/:characterId" element={<PageWrapper><GomokuGame /></PageWrapper>} />
                                  <Route path="/game/character-select" element={<PageWrapper><GameCharacterSelect /></PageWrapper>} />
                                  <Route path="/game-list" element={<PageWrapper><GameList /></PageWrapper>} />
                                  <Route path="/game/undercover/:groupId" element={<PageWrapper><UndercoverGame /></PageWrapper>} />
                                  <Route path="/desktop" element={<PageWrapper><Desktop /></PageWrapper>} />
                                  <Route path="/story-mode/:characterId" element={<PageWrapper><StoryMode /></PageWrapper>} />
                                  <Route path="/preset" element={<PageWrapper><PresetManager /></PageWrapper>} />
                                  <Route path="/offline-chat" element={<PageWrapper><OfflineChat /></PageWrapper>} />
                                  <Route path="/customize" element={<PageWrapper><Customize /></PageWrapper>} />
                                  <Route path="/statusbar-customize" element={<PageWrapper><StatusBarCustomize /></PageWrapper>} />
                                  <Route path="/worldbook" element={<PageWrapper><WorldBook /></PageWrapper>} />
                                  <Route path="/world-book" element={<PageWrapper><WorldBook /></PageWrapper>} />
                                  <Route path="/edit-world-book/:id" element={<PageWrapper><EditWorldBook /></PageWrapper>} />
                                  <Route path="/memory-cleanup" element={<PageWrapper><MemoryCleanup /></PageWrapper>} />
                                  <Route path="/storage-migration" element={<PageWrapper><StorageMigration /></PageWrapper>} />
                                  <Route path="/ai-phone-select" element={<PageWrapper><AIPhoneSelect /></PageWrapper>} />
                                  
                                  {/* 论坛功能 */}
                                  <Route path="/forum" element={<PageWrapper><Forum /></PageWrapper>} />
                                  <Route path="/forum/welcome" element={<PageWrapper><ForumWelcome /></PageWrapper>} />
                                  <Route path="/forum/initialize" element={<PageWrapper><ForumInitialize /></PageWrapper>} />
                                  <Route path="/forum/character-list" element={<PageWrapper><ForumCharacterList /></PageWrapper>} />
                                  <Route path="/forum/publish" element={<PageWrapper><ForumPublish /></PageWrapper>} />
                                  <Route path="/forum/post/:id" element={<PageWrapper><ForumPostDetail /></PageWrapper>} />
                                  <Route path="/forum/search" element={<PageWrapper><ForumSearch /></PageWrapper>} />
                                  <Route path="/forum/topics" element={<PageWrapper><ForumTopics /></PageWrapper>} />
                                  <Route path="/forum/create-topic" element={<PageWrapper><ForumCreateTopic /></PageWrapper>} />
                                  <Route path="/forum/topic/:id" element={<PageWrapper><ForumTopicDetail /></PageWrapper>} />
                                  <Route path="/forum/notifications" element={<PageWrapper><ForumNotifications /></PageWrapper>} />
                                  <Route path="/forum/profile" element={<PageWrapper><ForumProfile /></PageWrapper>} />
                                  <Route path="/forum/user/:userId" element={<PageWrapper><ForumUserProfile /></PageWrapper>} />
                                  <Route path="/forum/memes" element={<PageWrapper><ForumMemeManager /></PageWrapper>} />
                                  
                                  <Route path="/" element={<PageWrapper><Desktop /></PageWrapper>} />
                                </Routes>
                                </MomentsSocialManager>
                              </Router>
                            </MusicPlayerProvider>
                            </ForumProvider>
                          </GroupRedEnvelopeProvider>
                        </GroupProvider>
                      </AccountingProvider>
                      </RedEnvelopeProvider>
                    </MomentsProvider>
                  </AILifeProvider>
                </CharacterProvider>
              </UserProvider>
            </ApiProvider>
          </SettingsProvider>
        </BackgroundProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
