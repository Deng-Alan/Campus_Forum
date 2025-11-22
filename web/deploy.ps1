# Campus Forum - 快速部署脚本

Write-Host "🚀 开始部署到 Vercel..." -ForegroundColor Cyan

# 检查是否安装了 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未安装 Node.js，请先安装：https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js 已安装" -ForegroundColor Green

# 检查是否安装了 Vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "📦 安装 Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "✅ Vercel CLI 已安装" -ForegroundColor Green

# 检查 Git 状态
if (-not (Test-Path .git)) {
    Write-Host "📂 初始化 Git 仓库..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit for Vercel deployment"
    Write-Host "✅ Git 初始化完成" -ForegroundColor Green
} else {
    Write-Host "✅ Git 仓库已存在" -ForegroundColor Green
}

# 测试构建
Write-Host "🔨 测试构建..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败，请检查错误" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 构建成功" -ForegroundColor Green

# 部署到 Vercel
Write-Host "🌐 部署到 Vercel..." -ForegroundColor Cyan
vercel --prod

Write-Host ""
Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "📝 请查看终端中的 URL 访问你的网站" -ForegroundColor Cyan
