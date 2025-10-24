import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { SettingsProvider } from './context/SettingsContext'
import { UserProvider } from './context/UserContext'
import { CharacterProvider } from './context/CharacterContext'
import { MomentsProvider } from './context/MomentsContext'
import { ApiProvider } from './context/ApiContext'
import { RedEnvelopeProvider } from './context/RedEnvelopeContext'
import { ThemeProvider } from './context/ThemeContext'
import { BackgroundProvider } from './context/BackgroundContext'
import { AccountingProvider } from './context/AccountingContext'
import { GroupProvider } from './context/GroupContext'
import { GroupRedEnvelopeProvider } from './context/GroupRedEnvelopeContext'
import { MusicPlayerProvider, useMusicPlayer } from './context/MusicPlayerContext'
import DynamicIsland from './components/DynamicIsland'
import './styles/redenvelope.css'
import Layout from './components/Layout'
import MomentsSocialManager from './components/MomentsSocialManager'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineIndicator from './components/OfflineIndicator'
import { initPerformanceMonitor } from './utils/performance'
import ChatList from './pages/ChatList'
import Contacts from './pages/Contacts'
import Discover from './pages/Discover'
import Me from './pages/Me'
import ChatDetail from './pages/ChatDetail'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import UserList from './pages/UserList'
import CreateUser from './pages/CreateUser'
import CreateCharacter from './pages/CreateCharacter'
import ApiConfig from './pages/ApiConfig'
import ApiList from './pages/ApiList'
import AddApi from './pages/AddApi'
import EditApi from './pages/EditApi'
import CharacterDetail from './pages/CharacterDetail'
import EditCharacter from './pages/EditCharacter'
import Moments from './pages/Moments'
import PublishMoment from './pages/PublishMoment'
import SendTransfer from './pages/SendTransfer'
import ChatSettings from './pages/ChatSettings'
import MemoryViewer from './pages/MemoryViewer'
import MemorySummary from './pages/MemorySummary'
import Wallet from './pages/Wallet'
import Services from './pages/Services'
import TransactionHistory from './pages/TransactionHistory'
import CardWallet from './pages/CardWallet'
import CreateIntimatePay from './pages/CreateIntimatePay'
import IntimatePayDetail from './pages/IntimatePayDetail'
import ReceiveIntimatePay from './pages/ReceiveIntimatePay'
import WalletHelp from './pages/WalletHelp'
import Diary from './pages/Diary'
import StreakDetail from './pages/StreakDetail'
import About from './pages/About'
import Accounting from './pages/Accounting'
import AccountingChat from './pages/AccountingChat'
import AddTransaction from './pages/AddTransaction'
import GroupList from './pages/GroupList'
import CreateGroup from './pages/CreateGroup'
import GroupChatDetail from './pages/GroupChatDetail'
import GroupSettings from './pages/GroupSettings'
import ShakeShake from './pages/ShakeShake'
import Live from './pages/Live'
import LiveRoom from './pages/LiveRoom'
import SparkMoments from './pages/SparkMoments'
import MemesLibrary from './pages/MemesLibrary'
import MiniPrograms from './pages/MiniPrograms'
import BubbleStore from './pages/BubbleStore'
import FontCustomizer from './pages/FontCustomizer'
import MusicPlayer from './pages/MusicPlayer'
import UploadSong from './pages/UploadSong'
import GomokuGame from './pages/GomokuGame'
import GameCharacterSelect from './pages/GameCharacterSelect'
import GameList from './pages/GameList'
import UndercoverGame from './pages/UndercoverGame'
import Desktop from './pages/Desktop'
import StoryMode from './pages/StoryMode'
import PromptTemplates from './pages/PromptTemplates'
import WorldBook from './pages/WorldBook'
import EditWorldBook from './pages/EditWorldBook'

// DynamicIsland包装组件
const DynamicIslandWrapper = () => {
  const musicPlayer = useMusicPlayer()
  
  // 只在有歌曲播放时显示灵动岛
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

function App() {
  // 初始化性能监控
  useEffect(() => {
    if (import.meta.env.DEV) {
      initPerformanceMonitor()
      console.log('📊 性能监控已启动')
    }
  }, [])

  // 加载自定义字体
  useEffect(() => {
    const loadCustomFonts = async () => {
      try {
        const savedFonts = localStorage.getItem('custom_fonts')
        if (!savedFonts) return

        const fonts = JSON.parse(savedFonts)
        console.log(`🔄 开始加载 ${fonts.length} 个自定义字体...`)

        // 并行加载所有字体
        const loadPromises = fonts.map(async (font: any) => {
          try {
            // 检查字体是否已存在
            const existingFont = Array.from(document.fonts).find(
              (f: any) => f.family === font.fontFamily
            )
            if (existingFont) {
              console.log(`⚡ 字体已存在: ${font.name}`)
              return true
            }

            const fontFace = new FontFace(font.fontFamily, `url(${font.url})`, {
              display: 'swap'
            })
            await fontFace.load()
            document.fonts.add(fontFace)
            console.log(`✅ 字体加载成功: ${font.name}`)
            return true
          } catch (error) {
            console.error(`❌ 字体加载失败: ${font.name}`, error)
            return false
          }
        })

        await Promise.all(loadPromises)
        
        // 应用当前字体
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
      <BackgroundProvider>
        <ThemeProvider>
          <ApiProvider>
          <UserProvider>
            <CharacterProvider>
              <GroupProvider>
              <GroupRedEnvelopeProvider>
              <MomentsProvider>
                <MomentsSocialManager>
                  <RedEnvelopeProvider>
                    <AccountingProvider>
                    <SettingsProvider>
                      <MusicPlayerProvider>
                        <Router>
                          <OfflineIndicator />
                          <DynamicIslandWrapper />
                <Routes>
                  {/* 桌面首页 */}
                  <Route index element={<Desktop />} />
                  
                  {/* 故事模式 */}
                  <Route path="/story" element={<StoryMode />} />
                  
                  {/* 微信应用 - 带底部导航栏的页面 */}
                  <Route path="/wechat" element={<Layout />}>
                    <Route index element={<ChatList />} />
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="discover" element={<Discover />} />
                    <Route path="me" element={<Me />} />
                  </Route>
                  
                  {/* 微信应用 - 独立页面 */}
                  <Route path="/wechat/settings" element={<Settings />} />
                  <Route path="/wechat/profile" element={<Profile />} />
                  <Route path="/wechat/edit-profile" element={<EditProfile />} />
                  <Route path="/wechat/user-list" element={<UserList />} />
                  <Route path="/wechat/create-user" element={<CreateUser />} />
                  <Route path="/wechat/create-character" element={<CreateCharacter />} />
                  <Route path="/wechat/character/:id" element={<CharacterDetail />} />
                  <Route path="/wechat/edit-character/:id" element={<EditCharacter />} />
                  <Route path="/wechat/api-config" element={<ApiConfig />} />
                  <Route path="/wechat/api-list" element={<ApiList />} />
                  <Route path="/wechat/add-api" element={<AddApi />} />
                  <Route path="/wechat/edit-api/:id" element={<EditApi />} />
            
            {/* 兼容旧路由 - 不带 /wechat 前缀 */}
            <Route path="/create-character" element={<CreateCharacter />} />
            <Route path="/character/:id" element={<CharacterDetail />} />
            <Route path="/edit-character/:id" element={<EditCharacter />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            
            <Route path="/services" element={<Services />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/transaction-history" element={<TransactionHistory />} />
            <Route path="/card-wallet" element={<CardWallet />} />
            <Route path="/intimate-pay/create" element={<CreateIntimatePay />} />
            <Route path="/intimate-pay/detail/:characterId" element={<IntimatePayDetail />} />
            <Route path="/intimate-pay/receive/:characterId/:monthlyLimit" element={<ReceiveIntimatePay />} />
            <Route path="/wallet-help" element={<WalletHelp />} />
            <Route path="/chat/:id" element={<ChatDetail />} />
              <Route path="/moments" element={<Moments />} />
              <Route path="/publish-moment" element={<PublishMoment />} />
              <Route path="/send-transfer" element={<SendTransfer />} />
              <Route path="/chat-settings/:id" element={<ChatSettings />} />
              <Route path="/memory/:id" element={<MemoryViewer />} />
              <Route path="/memory-summary/:id" element={<MemorySummary />} />
              <Route path="/diary/:id" element={<Diary />} />
              <Route path="/streak/:id" element={<StreakDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/accounting" element={<Accounting />} />
              <Route path="/accounting/chat" element={<AccountingChat />} />
              <Route path="/accounting/add" element={<AddTransaction />} />
              <Route path="/group-list" element={<GroupList />} />
              <Route path="/create-group" element={<CreateGroup />} />
              <Route path="/group/:id" element={<GroupChatDetail />} />
              <Route path="/group-settings/:id" element={<GroupSettings />} />
              <Route path="/shake" element={<ShakeShake />} />
              <Route path="/live" element={<Live />} />
              <Route path="/live/:id" element={<LiveRoom />} />
              <Route path="/spark-moments" element={<SparkMoments />} />
              <Route path="/memes-library" element={<MemesLibrary />} />
              <Route path="/mini-programs" element={<MiniPrograms />} />
              <Route path="/bubble-store" element={<BubbleStore />} />
              <Route path="/font-customizer" element={<FontCustomizer />} />
              <Route path="/music-player" element={<MusicPlayer />} />
              <Route path="/upload-song" element={<UploadSong />} />
              <Route path="/gomoku/:id" element={<GomokuGame />} />
              <Route path="/game-select" element={<GameCharacterSelect />} />
              <Route path="/games" element={<GameList />} />
              <Route path="/undercover" element={<UndercoverGame />} />
              <Route path="/prompt-templates" element={<PromptTemplates />} />
              <Route path="/worldbook" element={<WorldBook />} />
              <Route path="/worldbook/create" element={<EditWorldBook />} />
              <Route path="/worldbook/edit/:id" element={<EditWorldBook />} />
                  </Routes>
                </Router>
                      </MusicPlayerProvider>
                    </SettingsProvider>
                    </AccountingProvider>
                  </RedEnvelopeProvider>
                </MomentsSocialManager>
              </MomentsProvider>
              </GroupRedEnvelopeProvider>
              </GroupProvider>
            </CharacterProvider>
          </UserProvider>
          </ApiProvider>
        </ThemeProvider>
      </BackgroundProvider>
    </ErrorBoundary>
  )
}

export default App

