import { ReactNode } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider } from './ThemeContext'
import { BackgroundProvider } from './BackgroundContext'
import { SettingsProvider } from './SettingsContext'
import { ApiProvider } from './ApiContext'
import { ContactsProvider } from './ContactsContext'
import { MomentsProvider } from './MomentsContext'
import { RedEnvelopeProvider } from './RedEnvelopeContext'
import { AccountingProvider } from './AccountingContext'
import { GroupProvider } from './GroupContext'
import { GroupRedEnvelopeProvider } from './GroupRedEnvelopeContext'
import { ForumProvider } from './ForumContext'
import { MusicPlayerProvider } from './MusicPlayerContext'
import { AILifeProvider } from './AILifeContext'
import { CallProvider } from './CallContext'

/**
 * 应用全局 Provider 组合组件
 * 
 * 优化说明:
 * 1. 统一管理所有 Context Provider，避免在 App.tsx 中嵌套过深
 * 2. 按照依赖关系组织 Provider 顺序
 * 3. 便于后续优化和维护
 * 
 * Provider 层级说明:
 * - 第1层: 主题和背景（UI基础）
 * - 第2层: 设置和API（配置层）
 * - 第3层: 联系人（用户+角色）
 * - 第4层: 社交功能（朋友圈、论坛）
 * - 第5层: 支付功能（红包、转账、记账）
 * - 第6层: 群聊功能
 * - 第7层: AI生命周期和通话
 * - 第8层: 音乐播放器
 * - 第9层: 路由
 */
export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <BackgroundProvider>
        <SettingsProvider>
          <ApiProvider>
            <ContactsProvider>
              <MomentsProvider>
                <ForumProvider>
                  <RedEnvelopeProvider>
                    <AccountingProvider>
                      <GroupProvider>
                        <GroupRedEnvelopeProvider>
                          <AILifeProvider>
                            <CallProvider>
                              <MusicPlayerProvider>
                                <Router basename={import.meta.env.BASE_URL || "/"}>
                                  {children}
                                </Router>
                              </MusicPlayerProvider>
                            </CallProvider>
                          </AILifeProvider>
                        </GroupRedEnvelopeProvider>
                      </GroupProvider>
                    </AccountingProvider>
                  </RedEnvelopeProvider>
                </ForumProvider>
              </MomentsProvider>
            </ContactsProvider>
          </ApiProvider>
        </SettingsProvider>
      </BackgroundProvider>
    </ThemeProvider>
  )
}

/**
 * 优化后的 Provider 结构对比:
 * 
 * 优化前 (13层):
 * ThemeProvider
 *   BackgroundProvider
 *     SettingsProvider
 *       ApiProvider
 *         UserProvider
 *           CharacterProvider
 *             AILifeProvider
 *               MomentsProvider
 *                 RedEnvelopeProvider
 *                   AccountingProvider
 *                     GroupProvider
 *                       GroupRedEnvelopeProvider
 *                         ForumProvider
 * 
 * 优化后 (11层):
 * ThemeProvider
 *   BackgroundProvider
 *     SettingsProvider
 *       ApiProvider
 *         ContactsProvider (合并 User + Character)
 *           MomentsProvider
 *             ForumProvider
 *               RedEnvelopeProvider
 *                 AccountingProvider
 *                   GroupProvider
 *                     GroupRedEnvelopeProvider
 * 
 * 改进:
 * - 减少了2层嵌套
 * - 更清晰的层级关系
 * - 便于后续进一步优化
 */

