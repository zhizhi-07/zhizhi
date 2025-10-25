/**
 * 自动更新代码中的图片引用：.png -> .webp
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises'
import { join, extname } from 'path'

const SRC_DIR = './src'
const EXTENSIONS_TO_PROCESS = ['.ts', '.tsx', '.js', '.jsx']

// 排除的目录
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build']

// 递归获取所有文件
async function getAllFiles(dir) {
  const files = []
  
  try {
    const items = await readdir(dir)
    
    for (const item of items) {
      const fullPath = join(dir, item)
      
      // 跳过排除的目录
      if (EXCLUDE_DIRS.includes(item)) continue
      
      const fileStat = await stat(fullPath)
      
      if (fileStat.isDirectory()) {
        const subFiles = await getAllFiles(fullPath)
        files.push(...subFiles)
      } else {
        const ext = extname(item)
        if (EXTENSIONS_TO_PROCESS.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  } catch (error) {
    console.error(`❌ 读取目录失败: ${dir}`, error.message)
  }
  
  return files
}

// 更新文件中的图片引用
async function updateImageReferences(filePath) {
  try {
    let content = await readFile(filePath, 'utf-8')
    const originalContent = content
    
    // 匹配模式：
    // 1. import xxx from './path/to/image.png'
    // 2. import xxx from '../assets/image.png'
    // 3. src="./image.png" 或 src='./image.png' 或 src={image.png}
    
    // 只替换本地资源（以 . 或 / 开头），不替换外部URL
    const patterns = [
      // Import语句中的PNG
      /(from\s+['"]\.{1,2}[^'"]*?)\.png(['"])/g,
      // src属性中的PNG
      /((?:src|href|background|backgroundImage)\s*[:=]\s*['"`]\.{1,2}[^'"`]*?)\.png(['"`])/g,
      // require()中的PNG
      /(require\s*\(\s*['"]\.{1,2}[^'"]*?)\.png(['"])/g,
    ]
    
    let changeCount = 0
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        changeCount += matches.length
      }
      content = content.replace(pattern, '$1.webp$2')
    })
    
    // 如果有更改，写回文件
    if (content !== originalContent) {
      await writeFile(filePath, content, 'utf-8')
      return { changed: true, count: changeCount }
    }
    
    return { changed: false, count: 0 }
    
  } catch (error) {
    console.error(`❌ 处理文件失败: ${filePath}`, error.message)
    return { error: true }
  }
}

// 主函数
async function main() {
  console.log('🚀 开始更新图片引用...\n')
  
  const files = await getAllFiles(SRC_DIR)
  console.log(`📦 找到 ${files.length} 个源文件\n`)
  
  let totalChanged = 0
  let totalReferences = 0
  const changedFiles = []
  
  for (const file of files) {
    const result = await updateImageReferences(file)
    
    if (result.changed) {
      totalChanged++
      totalReferences += result.count
      changedFiles.push({ file, count: result.count })
      console.log(`✓ ${file} (${result.count} 处更改)`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ 更新完成！\n')
  console.log(`📊 统计信息：`)
  console.log(`   - 总文件数: ${files.length}`)
  console.log(`   - 已更新: ${totalChanged} 个文件`)
  console.log(`   - 总更改: ${totalReferences} 处引用`)
  
  if (changedFiles.length > 0) {
    console.log(`\n📝 已更新的文件：`)
    changedFiles.forEach(({ file, count }) => {
      console.log(`   - ${file} (${count}处)`)
    })
  }
  
  console.log('='.repeat(60))
  
  console.log('\n💡 提示：')
  console.log('   请运行 npm run dev 测试应用是否正常工作')
  console.log('   如有问题，可以从Git恢复原文件')
}

// 执行
main().catch(console.error)
