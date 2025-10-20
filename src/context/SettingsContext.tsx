import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SettingsContextType {
  showStatusBar: boolean
  toggleStatusBar: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [showStatusBar, setShowStatusBar] = useState(() => {
    const saved = localStorage.getItem('showStatusBar')
    return saved === null ? true : saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('showStatusBar', showStatusBar.toString())
  }, [showStatusBar])

  const toggleStatusBar = () => {
    setShowStatusBar(prev => !prev)
  }

  return (
    <SettingsContext.Provider value={{ showStatusBar, toggleStatusBar }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

