/**
 * 优化所有图片 - 包括public和src/assets
 */

import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join, extname, basename, dirname } from 'path'
import { existsSync } from 'fs'

// 目录列表
const DIRECTORIES = ['./public', './src/assets']
const QUALITY = 80
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg']

// 递归获取所有图片
async function getAllImages(dir) {
  const images = []
  
  try {
    const files = await readdir(dir)
    
    for (const file of files) {
      const fullPath = join(dir, file)
      const fileStat = await stat(fullPath)
      
      if (fileStat.isDirectory()) {
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
  const dir = dirname(imagePath)
  
  try {
    const webpPath = join(dir, `${base}.webp`)
    
    // 检查是否已存在WebP
    if (existsSync(webpPath)) {
      return { skipped: true, saved: 0 }
    }
    
    // 转换为WebP
    await sharp(imagePath)
      .webp({ quality: QUALITY })
      .toFile(webpPath)
    
    const originalSize = (await stat(imagePath)).size
    const webpSize = (await stat(webpPath)).size
    const saved = ((1 - webpSize / originalSize) * 100).toFixed(1)
    
    console.log(`✓ ${base}${ext} -> WebP (节省 ${saved}%)`)
    
    return { 
      skipped: false, 
      saved: parseFloat(saved),
      originalSize,
      webpSize 
    }
    
  } catch (error) {
    console.error(`❌ 优化失败: ${imagePath}`, error.message)
    return { error: true }
  }
}

// 主函数
async function main() {
  console.log('🚀 开始优化所有图片...\n')
  
  let totalImages = 0
  let totalOptimized = 0
  let totalSkipped = 0
  let totalErrors = 0
  let totalOriginalSize = 0
  let totalWebpSize = 0
  
  for (const dir of DIRECTORIES) {
    if (!existsSync(dir)) {
      console.log(`⚠️  目录不存在，跳过: ${dir}\n`)
      continue
    }
    
    console.log(`📁 处理目录: ${dir}`)
    const images = await getAllImages(dir)
    totalImages += images.length
    
    if (images.length === 0) {
      console.log(`   未找到图片\n`)
      continue
    }
    
    console.log(`   找到 ${images.length} 个图片\n`)
    
    for (const image of images) {
      const result = await optimizeImage(image)
      
      if (result.error) {
        totalErrors++
      } else if (result.skipped) {
        totalSkipped++
      } else {
        totalOptimized++
        totalOriginalSize += result.originalSize
        totalWebpSize += result.webpSize
      }
    }
    
    console.log()
  }
  
  // 输出总结
  console.log('='.repeat(60))
  console.log('✅ 优化完成！\n')
  console.log(`📊 统计信息：`)
  console.log(`   - 总图片数: ${totalImages}`)
  console.log(`   - 已优化: ${totalOptimized}`)
  console.log(`   - 已跳过: ${totalSkipped}`)
  if (totalErrors > 0) {
    console.log(`   - 失败: ${totalErrors}`)
  }
  
  if (totalOptimized > 0) {
    const totalSavedBytes = totalOriginalSize - totalWebpSize
    const totalSavedMB = (totalSavedBytes / 1024 / 1024).toFixed(2)
    const totalSavedPercent = ((totalSavedBytes / totalOriginalSize) * 100).toFixed(1)
    
    console.log(`\n💾 节省空间：`)
    console.log(`   - 原始大小: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   - WebP大小: ${(totalWebpSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   - 节省: ${totalSavedMB} MB (${totalSavedPercent}%)`)
  }
  
  console.log('='.repeat(60))
}

// 执行
main().catch(console.error)
