/**
 * HTML渲染器组件
 * 智能检测内容类型，选择合适的渲染方式
 * - 简单HTML: 使用dangerouslySetInnerHTML
 * - 交互式HTML（含script/完整页面）: 使用iframe
 */

interface HtmlRendererProps {
  content: string
  className?: string
}

const HtmlRenderer = ({ content, className = '' }: HtmlRendererProps) => {
  // 移除markdown代码块标记（如果有）
  let cleanContent = content
  if (content.startsWith('```')) {
    // 移除开头的 ```html 或 ``` 和结尾的 ```
    cleanContent = content
      .replace(/^```[a-z]*\n?/i, '')  // 移除开头的 ```html 或 ```
      .replace(/\n?```$/, '')          // 移除结尾的 ```
  }
  
  // 检测是否是完整的HTML文档（包含DOCTYPE、script等）
  const isFullHtmlDocument = 
    cleanContent.includes('<!DOCTYPE') || 
    cleanContent.includes('<html') ||
    cleanContent.includes('<script') ||
    cleanContent.includes('onclick=') ||
    cleanContent.includes('addEventListener')

  if (isFullHtmlDocument) {
    // 使用iframe渲染完整的交互式HTML
    return (
      <iframe
        srcDoc={cleanContent}
        className={`w-full border-0 rounded-lg ${className}`}
        style={{ 
          minHeight: '500px',
          height: 'auto'
        }}
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="HTML Content"
        onLoad={(e) => {
          // 自动调整iframe高度以适应内容
          const iframe = e.currentTarget
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
            if (iframeDoc) {
              const height = iframeDoc.documentElement.scrollHeight
              iframe.style.height = `${height}px`
            }
          } catch (err) {
            // 忽略跨域错误
            console.log('无法自动调整iframe高度')
          }
        }}
      />
    )
  }

  // 简单HTML片段，直接渲染
  return (
    <div 
      className={`whitespace-pre-wrap break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanContent }}
    />
  )
}

export default HtmlRenderer
