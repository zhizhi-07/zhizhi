import { useEffect, useRef } from 'react'

interface ElectricBorderCardProps {
  children: React.ReactNode
}

const ElectricBorderCard = ({ children }: ElectricBorderCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    const container = containerRef.current
    const content = contentRef.current
    if (!canvas || !maskCanvas || !container || !content) return

    const ctx = canvas.getContext('2d', { alpha: true })
    const maskCtx = maskCanvas.getContext('2d', { alpha: true })
    if (!ctx || !maskCtx) return

    let animationId: number
    let time = 0

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.scale(dpr, dpr)
      
      maskCanvas.width = rect.width * dpr
      maskCanvas.height = rect.height * dpr
      maskCanvas.style.width = `${rect.width}px`
      maskCanvas.style.height = `${rect.height}px`
      maskCtx.scale(dpr, dpr)
    }
    updateCanvasSize()

    // 生成不规则的边框路径点
    const generateElectricPath = (width: number, height: number, time: number) => {
      const points: { x: number; y: number }[] = []
      const segments = 200 // 路径点数量
      const borderRadius = 16
      const amplitude = 3 // 波动幅度
      const frequency = 0.05 // 波动频率

      // 计算总周长
      const perimeter = 2 * (width + height) - 8 * borderRadius + 2 * Math.PI * borderRadius

      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const distance = t * perimeter
        let x = 0, y = 0
        let normalX = 0, normalY = 0

        // 根据距离计算基础位置
        if (distance < width - 2 * borderRadius) {
          // 顶边
          x = borderRadius + distance
          y = 0
          normalX = 0
          normalY = -1
        } else if (distance < width - 2 * borderRadius + Math.PI * borderRadius / 2) {
          // 右上角
          const angle = (distance - (width - 2 * borderRadius)) / borderRadius
          x = width - borderRadius + borderRadius * Math.sin(angle)
          y = borderRadius - borderRadius * Math.cos(angle)
          normalX = Math.sin(angle)
          normalY = -Math.cos(angle)
        } else if (distance < width + height - 4 * borderRadius + Math.PI * borderRadius / 2) {
          // 右边
          x = width
          y = borderRadius + (distance - (width - 2 * borderRadius + Math.PI * borderRadius / 2))
          normalX = 1
          normalY = 0
        } else if (distance < width + height - 4 * borderRadius + Math.PI * borderRadius) {
          // 右下角
          const angle = (distance - (width + height - 4 * borderRadius + Math.PI * borderRadius / 2)) / borderRadius
          x = width - borderRadius + borderRadius * Math.cos(angle)
          y = height - borderRadius + borderRadius * Math.sin(angle)
          normalX = Math.cos(angle)
          normalY = Math.sin(angle)
        } else if (distance < 2 * width + height - 6 * borderRadius + Math.PI * borderRadius) {
          // 底边
          x = width - borderRadius - (distance - (width + height - 4 * borderRadius + Math.PI * borderRadius))
          y = height
          normalX = 0
          normalY = 1
        } else if (distance < 2 * width + height - 6 * borderRadius + Math.PI * borderRadius * 1.5) {
          // 左下角
          const angle = (distance - (2 * width + height - 6 * borderRadius + Math.PI * borderRadius)) / borderRadius
          x = borderRadius - borderRadius * Math.sin(angle)
          y = height - borderRadius + borderRadius * Math.cos(angle)
          normalX = -Math.sin(angle)
          normalY = Math.cos(angle)
        } else if (distance < 2 * width + 2 * height - 8 * borderRadius + Math.PI * borderRadius * 1.5) {
          // 左边
          x = 0
          y = height - borderRadius - (distance - (2 * width + height - 6 * borderRadius + Math.PI * borderRadius * 1.5))
          normalX = -1
          normalY = 0
        } else {
          // 左上角
          const angle = (distance - (2 * width + 2 * height - 8 * borderRadius + Math.PI * borderRadius * 1.5)) / borderRadius
          x = borderRadius - borderRadius * Math.cos(angle)
          y = borderRadius - borderRadius * Math.sin(angle)
          normalX = -Math.cos(angle)
          normalY = -Math.sin(angle)
        }

        // 添加不规则波动
        const noise = Math.sin(distance * frequency + time * 0.05) * amplitude +
                     Math.sin(distance * frequency * 2.3 + time * 0.07) * amplitude * 0.5 +
                     Math.sin(distance * frequency * 4.7 + time * 0.03) * amplitude * 0.3
        
        x += normalX * noise
        y += normalY * noise

        points.push({ x, y })
      }

      return points
    }

    const drawElectricBorder = () => {
      const width = canvas.width / (window.devicePixelRatio || 1)
      const height = canvas.height / (window.devicePixelRatio || 1)

      ctx.clearRect(0, 0, width, height)
      maskCtx.clearRect(0, 0, width, height)

      const points = generateElectricPath(width, height, time)

      // 绘制遮罩（使内容区域也是不规则的）
      maskCtx.save()
      maskCtx.beginPath()
      points.forEach((point, i) => {
        if (i === 0) {
          maskCtx.moveTo(point.x, point.y)
        } else {
          maskCtx.lineTo(point.x, point.y)
        }
      })
      maskCtx.closePath()
      maskCtx.fillStyle = 'black'
      maskCtx.fill()
      maskCtx.restore()

      // 更新内容区域的遮罩
      if (content) {
        const maskDataUrl = maskCanvas.toDataURL()
        content.style.webkitMaskImage = `url(${maskDataUrl})`
        content.style.maskImage = `url(${maskDataUrl})`
        content.style.webkitMaskSize = '100% 100%'
        content.style.maskSize = '100% 100%'
      }

      // 绘制玻璃毛玻璃效果边框
      ctx.save()
      
      // 绘制路径
      ctx.beginPath()
      points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.closePath()

      // 外层白色高光（模拟玻璃反光）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 3
      ctx.shadowBlur = 15
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
      ctx.stroke()

      // 内层半透明白色（玻璃主体）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 8
      ctx.shadowBlur = 0
      ctx.stroke()

      // 最外层淡淡的模糊（毛玻璃扩散效果）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 12
      ctx.shadowBlur = 20
      ctx.shadowColor = 'rgba(255, 255, 255, 0.3)'
      ctx.stroke()

      ctx.restore()

      time += 1
      animationId = requestAnimationFrame(drawElectricBorder)
    }

    drawElectricBorder()

    const handleResize = () => {
      updateCanvasSize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* 边框 canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2 }}
      />
      {/* 遮罩 canvas - 隐藏但用于生成遮罩 */}
      <canvas
        ref={maskCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ display: 'none' }}
      />
      {/* 内容区域 */}
      <div 
        ref={contentRef}
        className="relative" 
        style={{ 
          zIndex: 1
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default ElectricBorderCard
