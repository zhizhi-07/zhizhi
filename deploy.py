import subprocess
import os

os.environ['GIT_PAGER'] = ''

try:
    print("正在添加文件...")
    subprocess.run(['git', 'add', '.'], check=True, shell=True)
    
    print("正在提交...")
    subprocess.run(['git', 'commit', '-m', 'feat: 新增AI足迹功能和更新日志 v1.0.8'], check=True, shell=True)
    
    print("正在推送到远程仓库...")
    subprocess.run(['git', 'push'], check=True, shell=True)
    
    print("✅ 部署成功！")
except Exception as e:
    print(f"❌ 部署失败: {e}")

