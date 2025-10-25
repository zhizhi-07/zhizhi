/**
 * 生成PWA图标
 * 从app-icon.webp生成各种尺寸的PNG图标
 */

import sharp from 'sharp'
import { existsSync } from 'fs'

const SOURCE_IMAGE = './src/assets/app-icon.webp'
const OUTPUT_DIR = './public'

// 需要生成的图标尺寸
const ICON_SIZES = [
  { name: 'icon-192.png', size: 192, description: 'PWA标准图标' },
  { name: 'icon-512.png', size: 512, description: 'PWA高清图标' },
  { name: 'icon-chat.png', size: 96, description: '聊天快捷方式图标' },
  { name: 'icon-moments.png', size: 96, description: '朋友圈快捷方式图标' },
  { name: 'apple-touch-icon.png', size: 180, description: 'Apple触摸图标' },
  { name: 'favicon.png', size: 32, description: '网站图标' },
  { name: 'favicon-16x16.png', size: 16, description: '小尺寸网站图标' },
]

async function generateIcons() {
  console.log('🚀 开始生成PWA图标...\n')
  
  // 检查源文件是否存在
  if (!existsSync(SOURCE_IMAGE)) {
    console.error(`❌ 源图片不存在: ${SOURCE_IMAGE}`)
    console.log('提示: 请确保 src/assets/app-icon.webp 存在')
    process.exit(1)
  }
  
  let successCount = 0
  let errorCount = 0
  
  for (const icon of ICON_SIZES) {
    try {
      const outputPath = `${OUTPUT_DIR}/${icon.name}`
      
      await sharp(SOURCE_IMAGE)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png({ quality: 100 })
        .toFile(outputPath)
      
      console.log(`✓ ${icon.name} (${icon.size}x${icon.size}) - ${icon.description}`)
      successCount++
      
    } catch (error) {
      console.error(`❌ 生成失败: ${icon.name}`, error.message)
      errorCount++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ 图标生成完成！\n')
  console.log(`📊 统计：`)
  console.log(`   - 成功: ${successCount} 个`)
  if (errorCount > 0) {
    console.log(`   - 失败: ${errorCount} 个`)
  }
  console.log('='.repeat(60))
  
  console.log('\n💡 下一步：')
  console.log('   1. 检查 public/ 目录下的图标文件')
  console.log('   2. 运行 npm run build 测试')
  console.log('   3. 测试PWA安装功能')
}

// 执行
generateIcons().catch(console.error)
