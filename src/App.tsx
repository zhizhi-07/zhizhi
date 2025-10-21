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

function App() {
  // 初始化性能监控
  useEffect(() => {
    if (import.meta.env.DEV) {
      initPerformanceMonitor()
      console.log('📊 性能监控已启动')
    }
  }, [])

  return (
    <ErrorBoundary>
      <BackgroundProvider>
        <ThemeProvider>
          <ApiProvider>
          <UserProvider>
            <CharacterProvider>
              <MomentsProvider>
                <MomentsSocialManager>
                  <RedEnvelopeProvider>
                    <AccountingProvider>
                    <SettingsProvider>
                      <OfflineIndicator />
                      <Router>
                <Routes>
                  <Route path="/" element={<Layout />}>
                  <Route index element={<ChatList />} />
                  <Route path="contacts" element={<Contacts />} />
                  <Route path="discover" element={<Discover />} />
                  <Route path="me" element={<Me />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="edit-profile" element={<EditProfile />} />
                  <Route path="user-list" element={<UserList />} />
                  <Route path="create-user" element={<CreateUser />} />
                  <Route path="create-character" element={<CreateCharacter />} />
                  <Route path="character/:id" element={<CharacterDetail />} />
                  <Route path="edit-character/:id" element={<EditCharacter />} />
                  <Route path="api-config" element={<ApiConfig />} />
                  <Route path="api-list" element={<ApiList />} />
                  <Route path="add-api" element={<AddApi />} />
                  <Route path="edit-api/:id" element={<EditApi />} />
                </Route>
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
                  </Routes>
                </Router>
                    </SettingsProvider>
                    </AccountingProvider>
                  </RedEnvelopeProvider>
                </MomentsSocialManager>
              </MomentsProvider>
            </CharacterProvider>
          </UserProvider>
          </ApiProvider>
        </ThemeProvider>
      </BackgroundProvider>
    </ErrorBoundary>
  )
}

export default App

