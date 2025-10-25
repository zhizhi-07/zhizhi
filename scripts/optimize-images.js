/**
 * 图片优化脚本
 * 
 * 功能：
 * 1. 将PNG/JPG图片转换为WebP格式
 * 2. 压缩图片体积
 * 3. 生成多种尺寸的响应式图片
 * 
 * 使用：
 * npm install -D sharp
 * node scripts/optimize-images.js
 */

import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join, extname, basename } from 'path'
import { existsSync } from 'fs'

const PUBLIC_DIR = './public'
const QUALITY = 80
const SIZES = [192, 512, 1024] // 多种尺寸用于响应式图片

// 支持的图片格式
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg']

// 递归获取所有图片文件
async function getAllImages(dir) {
  const images = []
  
  try {
    const files = await readdir(dir)
    
    for (const file of files) {
      const fullPath = join(dir, file)
      const fileStat = await stat(fullPath)
      
      if (fileStat.isDirectory()) {
        // 跳过node_modules等目录
        if (!file.startsWith('.') && file !== 'node_modules') {
          const subImages = await getAllImages(fullPath)
          images.push(...subImages)
        }
      } else {
        const ext = extname(file).toLowerCase()
        if (IMAGE_EXTENSIONS.includes(ext)) {
          images.push(fullPath)
        }
      }
    }
  } catch (error) {
    console.error(`❌ 读取目录失败: ${dir}`, error.message)
  }
  
  return images
}

// 优化单个图片
async function optimizeImage(imagePath) {
  const ext = extname(imagePath)
  const base = basename(imagePath, ext)
  const dir = imagePath.substring(0, imagePath.lastIndexOf('\\'))
  
  let optimized = 0
  let errors = 0
  
  try {
    // 1. 转换为WebP
    const webpPath = join(dir, `${base}.webp`)
    if (!existsSync(webpPath)) {
      await sharp(imagePath)
        .webp({ quality: QUALITY })
        .toFile(webpPath)
      
      const originalSize = (await stat(imagePath)).size
      const webpSize = (await stat(webpPath)).size
      const saved = ((1 - webpSize / originalSize) * 100).toFixed(1)
      
      console.log(`✓ ${base}${ext} -> WebP (节省 ${saved}%)`)
      optimized++
    }
    
    // 2. 如果是icon文件，生成多种尺寸
    if (base.includes('icon')) {
      for (const size of SIZES) {
        const resizedPath = join(dir, `${base}-${size}.webp`)
        if (!existsSync(resizedPath)) {
          await sharp(imagePath)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: QUALITY })
            .toFile(resizedPath)
          
          console.log(`✓ 生成 ${base}-${size}.webp`)
          optimized++
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ 优化失败: ${imagePath}`, error.message)
    errors++
  }
  
  return { optimized, errors }
}

// 主函数
async function main() {
  console.log('🚀 开始优化图片...\n')
  
  if (!existsSync(PUBLIC_DIR)) {
    console.error(`❌ 目录不存在: ${PUBLIC_DIR}`)
    process.exit(1)
  }
  
  const images = await getAllImages(PUBLIC_DIR)
  
  if (images.length === 0) {
    console.log('⚠️  未找到需要优化的图片')
    return
  }
  
  console.log(`📦 找到 ${images.length} 个图片文件\n`)
  
  let totalOptimized = 0
  let totalErrors = 0
  
  for (const image of images) {
    const { optimized, errors } = await optimizeImage(image)
    totalOptimized += optimized
    totalErrors += errors
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`✅ 优化完成！`)
  console.log(`   - 成功: ${totalOptimized} 个文件`)
  if (totalErrors > 0) {
    console.log(`   - 失败: ${totalErrors} 个文件`)
  }
  console.log('='.repeat(50))
}

// 检查sharp是否安装
try {
  await import('sharp')
  main()
} catch (error) {
  console.error('❌ 缺少依赖: sharp')
  console.log('\n请运行以下命令安装：')
  console.log('  npm install -D sharp')
  process.exit(1)
}
