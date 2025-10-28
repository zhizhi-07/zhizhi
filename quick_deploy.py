#!/usr/bin/env python3
import subprocess
import sys
import os

os.chdir(r'C:\Users\cl\Desktop\雾')

try:
    print("🚀 开始部署...")
    
    # Git add
    result = subprocess.run(['git', 'add', '.'], 
                          capture_output=True, 
                          text=True,
                          env={**os.environ, 'GIT_PAGER': ''})
    if result.returncode != 0:
        print(f"❌ git add 失败: {result.stderr}")
        sys.exit(1)
    print("✅ 文件已添加")
    
    # Git commit
    result = subprocess.run(['git', 'commit', '-m', 'feat: 新增AI足迹功能和更新日志 v1.0.8\n\n- 修复Cloudflare Pages部署配置'],
                          capture_output=True,
                          text=True,
                          env={**os.environ, 'GIT_PAGER': ''})
    if result.returncode != 0 and 'nothing to commit' not in result.stdout:
        print(f"⚠️ git commit: {result.stdout}")
    else:
        print("✅ 提交成功")
    
    # Git push
    result = subprocess.run(['git', 'push'],
                          capture_output=True,
                          text=True,
                          env={**os.environ, 'GIT_PAGER': ''})
    if result.returncode != 0:
        print(f"❌ git push 失败: {result.stderr}")
        sys.exit(1)
    
    print("✅ 推送成功！")
    print("🎉 部署完成，GitHub Actions正在构建...")
    
except Exception as e:
    print(f"❌ 部署失败: {e}")
    sys.exit(1)

