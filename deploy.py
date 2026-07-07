import os
import shutil
import subprocess

def run(cmd, cwd=None):
    print(f'Running: {cmd}')
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if res.returncode != 0:
        raise Exception(f'Command failed: {cmd}')

# 1. Build
run('npm run build')

# 2. Setup deploy dir
deploy_dir = r'D:\OneDrive\Bridge stuff\uganda_bms_deploy'
if os.path.exists(deploy_dir):
    try:
        shutil.rmtree(deploy_dir)
    except:
        pass

if not os.path.exists(deploy_dir):
    os.makedirs(deploy_dir)

# 3. Init git and checkout gh-pages
run('git init', cwd=deploy_dir)
run('git checkout -b gh-pages', cwd=deploy_dir)

# 4. Copy dist contents
dist_dir = r'D:\OneDrive\Bridge stuff\uganda_bms\dist'
for item in os.listdir(dist_dir):
    s = os.path.join(dist_dir, item)
    d = os.path.join(deploy_dir, item)
    if os.path.isdir(s):
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

# 5. Add remote and push
remote_url = 'https://github.com/priscananjehe1996/uganda_bms.git'
run(f'git remote add origin {remote_url}', cwd=deploy_dir)
run('git add .', cwd=deploy_dir)
run('git commit -m "Deploy to gh-pages"', cwd=deploy_dir)
run('git push origin gh-pages --force', cwd=deploy_dir)
