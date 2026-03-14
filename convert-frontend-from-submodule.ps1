# Convert frontend from Git submodule to normal folder so it can be committed.
# Run from repo root: C:\Users\veips\yerbamate
# Usage: .\convert-frontend-from-submodule.ps1

Set-Location $PSScriptRoot

# 1. Remove frontend from Git index (stops treating it as submodule). Folder stays on disk.
git rm --cached frontend 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "If 'fatal: not a submodule', run: git rm -r --cached frontend"
    git rm -r --cached frontend 2>$null
}

# 2. Remove frontend's own .git so it's no longer a separate repo
if (Test-Path "frontend\.git") {
    Remove-Item -Recurse -Force "frontend\.git"
    Write-Host "Removed frontend\.git"
}

# 3. Add frontend as normal files
git add frontend/

# 4. Show status
git status
Write-Host ""
Write-Host "Next: git commit -m `"Convert frontend from submodule to regular folder`""
Write-Host "      git push origin main"
