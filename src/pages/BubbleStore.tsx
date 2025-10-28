import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const BubbleStore = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [editingPreset, setEditingPreset] = useState<string | null>(null)
  const [userColor, setUserColor] = useState<string>('#95EC69')
  const [aiColor, setAiColor] = useState<string>('#FFFFFF')

  // 气泡预设
  const bubblePresets = [
    {
      id: 'glass',
      name: '高级玻璃',
      description: '毛玻璃效果',
      userCSS: `.message-container.sent .message-bubble {
  background: linear-gradient(135deg, rgba(149, 236, 105, 0.95) 0%, rgba(120, 220, 80, 0.95) 100%) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.6) !important;
  box-shadow: 
    0 8px 32px rgba(149, 236, 105, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1) !important;
  border-radius: 18px !important;
  position: relative !important;
}
.message-container.sent .message-bubble::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 50% !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%) !important;
  border-radius: 18px 18px 0 0 !important;
  pointer-events: none !important;
}`,
      aiCSS: `.message-container.received .message-bubble {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 245, 250, 0.95) 100%) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border: 1.5px solid rgba(200, 200, 220, 0.4) !important;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(0, 0, 0, 0.05) !important;
  border-radius: 18px !important;
  position: relative !important;
}
.message-container.received .message-bubble::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 50% !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%) !important;
  border-radius: 18px 18px 0 0 !important;
  pointer-events: none !important;
}`,
      preview: {
        user: {
          background: 'linear-gradient(135deg, rgba(149, 236, 105, 0.95) 0%, rgba(120, 220, 80, 0.95) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1.5px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 8px 32px rgba(149, 236, 105, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
        },
        ai: {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 245, 250, 0.95) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1.5px solid rgba(200, 200, 220, 0.4)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
        }
      }
    },
    {
      id: 'clay',
      name: '3D粘土',
      description: '立体效果',
      userCSS: `.message-container.sent .message-bubble {
  background: linear-gradient(145deg, #E8F5E9 0%, #C8E6C9 50%, #F1F8E9 100%) !important;
  border-radius: 22px !important;
  box-shadow: 
    0 2px 4px rgba(129, 199, 132, 0.3),
    0 8px 16px rgba(129, 199, 132, 0.25),
    0 16px 32px rgba(100, 180, 100, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.8),
    inset 0 -3px 8px rgba(100, 180, 100, 0.2) !important;
  border: 2px solid rgba(255, 255, 255, 0.7) !important;
  padding: 14px 18px !important;
  position: relative !important;
  transform: translateZ(0) !important;
}
.message-container.sent .message-bubble::after {
  content: '' !important;
  position: absolute !important;
  top: 3px !important;
  left: 3px !important;
  right: 3px !important;
  height: 40% !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%) !important;
  border-radius: 20px 20px 0 0 !important;
  pointer-events: none !important;
}`,
      aiCSS: `.message-container.received .message-bubble {
  background: linear-gradient(145deg, #E3F2FD 0%, #BBDEFB 50%, #E1F5FE 100%) !important;
  border-radius: 22px !important;
  box-shadow: 
    0 2px 4px rgba(100, 181, 246, 0.3),
    0 8px 16px rgba(100, 181, 246, 0.25),
    0 16px 32px rgba(66, 165, 245, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.8),
    inset 0 -3px 8px rgba(66, 165, 245, 0.2) !important;
  border: 2px solid rgba(255, 255, 255, 0.7) !important;
  padding: 14px 18px !important;
  position: relative !important;
  transform: translateZ(0) !important;
}
.message-container.received .message-bubble::after {
  content: '' !important;
  position: absolute !important;
  top: 3px !important;
  left: 3px !important;
  right: 3px !important;
  height: 40% !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%) !important;
  border-radius: 20px 20px 0 0 !important;
  pointer-events: none !important;
}`,
      preview: {
        user: {
          background: 'linear-gradient(145deg, #E8F5E9 0%, #C8E6C9 50%, #F1F8E9 100%)',
          boxShadow: '0 2px 4px rgba(129, 199, 132, 0.3), 0 8px 16px rgba(129, 199, 132, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
          border: '2px solid rgba(255, 255, 255, 0.7)',
          padding: '14px 18px'
        },
        ai: {
          background: 'linear-gradient(145deg, #E3F2FD 0%, #BBDEFB 50%, #E1F5FE 100%)',
          boxShadow: '0 2px 4px rgba(100, 181, 246, 0.3), 0 8px 16px rgba(100, 181, 246, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
          border: '2px solid rgba(255, 255, 255, 0.7)',
          padding: '14px 18px'
        }
      }
    },
    {
      id: 'feather',
      name: '梦幻光晕',
      description: '发光效果',
      userCSS: `.message-container.sent .message-bubble {
  background: 
    radial-gradient(circle at 30% 30%, rgba(255, 240, 248, 1) 0%, transparent 70%),
    linear-gradient(135deg, #FFD6E8 0%, #FFE5F0 50%, #FFF0F8 100%) !important;
  border: 0 !important;
  box-shadow: 
    0 0 1px rgba(255, 182, 217, 0.3),
    0 2px 8px rgba(255, 182, 217, 0.2),
    0 8px 24px rgba(255, 182, 217, 0.3),
    0 16px 48px rgba(255, 150, 200, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.8) !important;
  border-radius: 26px !important;
  padding: 14px 18px !important;
  position: relative !important;
  overflow: visible !important;
}
.message-container.sent .message-bubble::before {
  content: '' !important;
  position: absolute !important;
  inset: -8px !important;
  background: radial-gradient(circle, rgba(255, 182, 217, 0.15) 0%, transparent 70%) !important;
  border-radius: 34px !important;
  pointer-events: none !important;
  z-index: -1 !important;
}`,
      aiCSS: `.message-container.received .message-bubble {
  background: 
    radial-gradient(circle at 30% 30%, rgba(240, 248, 255, 1) 0%, transparent 70%),
    linear-gradient(135deg, #D6E8FF 0%, #E5F5FF 50%, #F0F8FF 100%) !important;
  border: 0 !important;
  box-shadow: 
    0 0 1px rgba(182, 217, 255, 0.3),
    0 2px 8px rgba(182, 217, 255, 0.2),
    0 8px 24px rgba(182, 217, 255, 0.3),
    0 16px 48px rgba(150, 200, 255, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.8) !important;
  border-radius: 26px !important;
  padding: 14px 18px !important;
  position: relative !important;
  overflow: visible !important;
}
.message-container.received .message-bubble::before {
  content: '' !important;
  position: absolute !important;
  inset: -8px !important;
  background: radial-gradient(circle, rgba(182, 217, 255, 0.15) 0%, transparent 70%) !important;
  border-radius: 34px !important;
  pointer-events: none !important;
  z-index: -1 !important;
}`,
      preview: {
        user: {
          background: 'linear-gradient(135deg, #FFD6E8 0%, #FFE5F0 50%, #FFF0F8 100%)',
          boxShadow: '0 0 1px rgba(255, 182, 217, 0.3), 0 2px 8px rgba(255, 182, 217, 0.2), 0 8px 24px rgba(255, 182, 217, 0.3)',
          padding: '14px 18px'
        },
        ai: {
          background: 'linear-gradient(135deg, #D6E8FF 0%, #E5F5FF 50%, #F0F8FF 100%)',
          boxShadow: '0 0 1px rgba(182, 217, 255, 0.3), 0 2px 8px rgba(182, 217, 255, 0.2), 0 8px 24px rgba(182, 217, 255, 0.3)',
          padding: '14px 18px'
        }
      }
    },
    {
      id: 'soft',
      name: '云雾扩散',
      description: '软边界效果',
      userCSS: `.message-container.sent .message-bubble {
  position: relative !important;
  border: 0 !important;
  outline: 0 !important;
  background: 
    radial-gradient(ellipse at center, rgba(255, 248, 225, 0.95) 0%, rgba(255, 245, 225, 0.8) 50%, rgba(255, 240, 220, 0.5) 80%, transparent 100%) !important;
  box-shadow: 
    0 0 0 6px rgba(255, 245, 225, 0.35),
    0 0 0 12px rgba(255, 240, 220, 0.18),
    0 2px 12px rgba(255, 230, 200, 0.25) !important;
  border-radius: 18px !important;
  padding: 14px 18px !important;
  overflow: visible !important;
}`,
      aiCSS: `.message-container.received .message-bubble {
  position: relative !important;
  border: 0 !important;
  outline: 0 !important;
  background: 
    radial-gradient(ellipse at center, rgba(240, 248, 255, 0.95) 0%, rgba(235, 245, 255, 0.8) 50%, rgba(225, 240, 255, 0.5) 80%, transparent 100%) !important;
  box-shadow: 
    0 0 0 6px rgba(240, 248, 255, 0.35),
    0 0 0 12px rgba(225, 240, 255, 0.18),
    0 2px 12px rgba(200, 230, 255, 0.25) !important;
  border-radius: 18px !important;
  padding: 14px 18px !important;
  overflow: visible !important;
}`,
      preview: {
        user: {
          background: 'radial-gradient(ellipse at center, rgba(255, 248, 225, 0.95) 0%, rgba(255, 245, 225, 0.8) 50%, rgba(255, 240, 220, 0.5) 80%, transparent 100%)',
          boxShadow: '0 0 0 6px rgba(255, 245, 225, 0.35), 0 0 0 12px rgba(255, 240, 220, 0.18)',
          padding: '14px 18px',
          borderRadius: '18px'
        },
        ai: {
          background: 'radial-gradient(ellipse at center, rgba(240, 248, 255, 0.95) 0%, rgba(235, 245, 255, 0.8) 50%, rgba(225, 240, 255, 0.5) 80%, transparent 100%)',
          boxShadow: '0 0 0 6px rgba(240, 248, 255, 0.35), 0 0 0 12px rgba(225, 240, 255, 0.18)',
          padding: '14px 18px',
          borderRadius: '18px'
        }
      }
    },
    {
      id: 'water',
      name: '水滴气泡',
      description: '透明效果',
      userCSS: `.message-container.sent .message-bubble {
  background: 
    linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.03) 30%, rgba(149, 236, 105, 0.15) 100%),
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.6) 0%, transparent 40%) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  border-radius: 20px !important;
  padding: 12px 16px !important;
  position: relative !important;
  box-shadow: 
    0 4px 15px rgba(149, 236, 105, 0.08),
    inset 0 1px 3px rgba(255, 255, 255, 0.9),
    inset 0 -2px 4px rgba(149, 236, 105, 0.15) !important;
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
}
.message-container.sent .message-bubble::before {
  content: '' !important;
  position: absolute !important;
  top: 8px !important;
  left: 10px !important;
  width: 20px !important;
  height: 20px !important;
  background: radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.9) 0%, transparent 70%) !important;
  border-radius: 50% !important;
  pointer-events: none !important;
}
.message-container.sent .message-bubble::after {
  content: '' !important;
  position: absolute !important;
  bottom: 10px !important;
  right: 12px !important;
  width: 12px !important;
  height: 12px !important;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.7) 0%, transparent 70%) !important;
  border-radius: 50% !important;
  pointer-events: none !important;
}`,
      aiCSS: `.message-container.received .message-bubble {
  background: 
    linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.03) 30%, rgba(200, 230, 255, 0.15) 100%),
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.6) 0%, transparent 40%) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  border-radius: 20px !important;
  padding: 12px 16px !important;
  position: relative !important;
  box-shadow: 
    0 4px 15px rgba(100, 150, 200, 0.08),
    inset 0 1px 3px rgba(255, 255, 255, 0.9),
    inset 0 -2px 4px rgba(200, 230, 255, 0.15) !important;
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
}
.message-container.received .message-bubble::before {
  content: '' !important;
  position: absolute !important;
  top: 8px !important;
  left: 10px !important;
  width: 20px !important;
  height: 20px !important;
  background: radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.95) 0%, transparent 70%) !important;
  border-radius: 50% !important;
  pointer-events: none !important;
}
.message-container.received .message-bubble::after {
  content: '' !important;
  position: absolute !important;
  bottom: 10px !important;
  right: 12px !important;
  width: 12px !important;
  height: 12px !important;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 70%) !important;
  border-radius: 50% !important;
  pointer-events: none !important;
}`,
      preview: {
        user: {
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.03) 30%, rgba(149, 236, 105, 0.15) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 4px 15px rgba(149, 236, 105, 0.08), inset 0 1px 3px rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          padding: '12px 16px'
        },
        ai: {
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.03) 30%, rgba(200, 230, 255, 0.15) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 4px 15px rgba(100, 150, 200, 0.08), inset 0 1px 3px rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          padding: '12px 16px'
        }
      }
    },
    {
      id: 'glass-dome',
      name: '玻璃罩',
      description: '圆形效果',
      userCSS: `.message-container.sent .message-bubble {
  background: transparent !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 24px !important;
  padding: 14px 20px !important;
  position: relative !important;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(0, 0, 0, 0.05) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  overflow: hidden !important;
}
.message-container.sent .message-bubble::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 50% !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%) !important;
  pointer-events: none !important;
}
.message-container.sent .message-bubble::after {
  content: '' !important;
  position: absolute !important;
  top: 8px !important;
  left: 12px !important;
  width: 50px !important;
  height: 50px !important;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 70%) !important;
  border-radius: 50% !important;
  pointer-events: none !important;
}`,
      aiCSS: `.message-container.received .message-bubble {
  background: transparent !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 24px !important;
  padding: 14px 20px !important;
  position: relative !important;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(0, 0, 0, 0.05) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  overflow: hidden !important;
}
.message-container.received .message-bubble::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 50% !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%) !important;
  pointer-events: none !important;
}
.message-container.received .message-bubble::after {
  content: '' !important;
  position: absolute !important;
  top: 8px !important;
  left: 12px !important;
  width: 50px !important;
  height: 50px !important;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 70%) !important;
  border-radius: 50% !important;
  pointer-events: none !important;
}`,
      preview: {
        user: {
          background: 'transparent',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '14px 20px'
        },
        ai: {
          background: 'transparent',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '14px 20px'
        }
      }
    }
  ]

  // 应用气泡样式（全局）
  const handleApplyBubble = (preset: typeof bubblePresets[0]) => {
    localStorage.setItem('user_bubble_css', preset.userCSS)
    localStorage.setItem('ai_bubble_css', preset.aiCSS)
    setSelectedPreset(preset.id)
    
    // 触发storage事件让其他页面更新
    window.dispatchEvent(new Event('storage'))
    
    alert(`✅ 已应用 ${preset.name}！\n\n所有聊天都会使用这个气泡样式。`)
  }

  // 开始编辑颜色
  const handleEditPreset = (preset: typeof bubblePresets[0]) => {
    setEditingPreset(preset.id)
    
    // 从预设CSS中提取颜色
    const extractColor = (css: string): string => {
      // 尝试提取 background: #颜色
      const hexMatch = css.match(/background:\s*([#][0-9A-Fa-f]{6}|[#][0-9A-Fa-f]{3})/i)
      if (hexMatch) return hexMatch[1]
      
      // 尝试提取 linear-gradient 中的第一个颜色
      const gradientMatch = css.match(/linear-gradient\([^,]+,\s*([#][0-9A-Fa-f]{6})/i)
      if (gradientMatch) return gradientMatch[1]
      
      // 尝试提取 rgba 并转换为 hex（简化版）
      const rgbaMatch = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
      if (rgbaMatch) {
        const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0')
        const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0')
        const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0')
        return `#${r}${g}${b}`
      }
      
      return '#95EC69' // 默认颜色
    }
    
    setUserColor(extractColor(preset.userCSS))
    setAiColor(extractColor(preset.aiCSS))
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingPreset(null)
  }

  // 应用自定义颜色
  const handleApplyColor = () => {
    // 找到当前正在编辑的预设
    const currentPreset = bubblePresets.find(p => p.id === editingPreset)
    if (!currentPreset) return
    
    // 智能替换主色调（只替换第一个出现的主要颜色，保留其他颜色用于渐变和阴影）
    const replaceMainColor = (css: string, newColor: string): string => {
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null
      }
      
      const rgb = hexToRgb(newColor)
      if (!rgb) return css
      
      // 只替换 linear-gradient 和 background 中第一次出现的主要颜色
      let replaced = false
      
      // 替换 linear-gradient 中的第一个 hex 颜色
      css = css.replace(/(linear-gradient\([^)]*?)#[0-9A-Fa-f]{6}/i, (match, prefix) => {
        if (!replaced) {
          replaced = true
          return prefix + newColor
        }
        return match
      })
      
      // 替换 linear-gradient 中的第一个 rgba
      css = css.replace(/(linear-gradient\([^)]*?)rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/i, (match, prefix, r, g, b, a) => {
        if (!replaced) {
          replaced = true
          return `${prefix}rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`
        }
        return match
      })
      
      return css
    }
    
    const customUserCSS = replaceMainColor(currentPreset.userCSS, userColor)
    const customAiCSS = replaceMainColor(currentPreset.aiCSS, aiColor)
    
    localStorage.setItem('user_bubble_css', customUserCSS)
    localStorage.setItem('ai_bubble_css', customAiCSS)
    
    // 触发storage事件让其他页面更新
    window.dispatchEvent(new Event('storage'))
    
    // 立即应用到当前页面
    const styleId = 'custom-bubble-style'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }
    styleElement.textContent = customUserCSS + '\n' + customAiCSS
    
    setEditingPreset(null)
    alert(`✅ 已应用 ${currentPreset.name} 的自定义颜色！\n\n用户气泡: ${userColor}\nAI气泡: ${aiColor}\n\n返回聊天页面即可看到效果`)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="glass-effect px-4 py-3 border-b border-gray-200/50 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center ios-button"
        >
          <span className="text-blue-500 text-xl">‹</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">气泡商店</h1>
        <div className="w-8" />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        {/* 顶部说明 */}
        <div className="glass-card rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">选择你喜欢的气泡样式</h2>
          </div>
          <p className="text-sm text-gray-600">
            点击"应用"按钮，气泡样式会应用到所有聊天（全局设置）
          </p>
        </div>

        {/* 气泡预设列表 */}
        <div className="space-y-4">
          {bubblePresets.map((preset) => (
            <div
              key={preset.id}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {preset.name}
                  </h3>
                  <p className="text-sm text-gray-500">{preset.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPreset(preset)}
                    className="px-3 py-2 rounded-xl font-medium text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleApplyBubble(preset)}
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                      selectedPreset === preset.id
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {selectedPreset === preset.id ? '已应用' : '应用'}
                  </button>
                </div>
              </div>

              {/* 编辑颜色 */}
              {editingPreset === preset.id && (
                <div className="mb-4 space-y-3 bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">用户气泡颜色</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={userColor}
                          onChange={(e) => setUserColor(e.target.value)}
                          className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={userColor}
                          onChange={(e) => setUserColor(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="#95EC69"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">AI气泡颜色</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={aiColor}
                          onChange={(e) => setAiColor(e.target.value)}
                          className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={aiColor}
                          onChange={(e) => setAiColor(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-xl font-medium text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleApplyColor}
                      className="px-4 py-2 rounded-xl font-medium text-sm bg-green-500 text-white hover:bg-green-600 transition-all"
                    >
                      应用颜色
                    </button>
                  </div>
                </div>
              )}

              {/* 预览 */}
              <div className="space-y-3 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl p-4">
                <div className="flex justify-end">
                  <div
                    className="px-3 py-2 rounded-xl text-sm max-w-[70%]"
                    style={editingPreset === preset.id ? {
                      ...preset.preview.user,
                      background: preset.preview.user.background?.includes('gradient') 
                        ? preset.preview.user.background.replace(/#[0-9A-Fa-f]{6}/i, userColor)
                        : userColor
                    } : preset.preview.user}
                  >
                    我的消息
                  </div>
                </div>
                <div className="flex justify-start">
                  <div
                    className="px-3 py-2 rounded-xl text-sm max-w-[70%]"
                    style={editingPreset === preset.id ? {
                      ...preset.preview.ai,
                      background: preset.preview.ai.background?.includes('gradient') 
                        ? preset.preview.ai.background.replace(/#[0-9A-Fa-f]{6}/i, aiColor)
                        : aiColor
                    } : preset.preview.ai}
                  >
                    对方消息
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default BubbleStore
