# 批量替换所有页面的 h-screen 为 h-full
$files = Get-ChildItem -Path "D:\Projects\zhizhi\src\pages" -Filter "*.tsx" -File

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'h-screen') {
        $newContent = $content -replace 'className="h-screen', 'className="h-full'
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "已修复: $($file.Name)"
    }
}

Write-Host "`n✅ 所有页面已修复完成！"
