import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React生态系统
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            // 其他第三方库
            return 'vendor'
          }
          // 工具类
          if (id.includes('src/utils')) {
            return 'utils'
          }
          // 上下文providers
          if (id.includes('src/context')) {
            return 'context'
          }
          // 页面组件按需加载
          if (id.includes('src/pages')) {
            return 'pages'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 压缩优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true
      }
    }
  }
})



