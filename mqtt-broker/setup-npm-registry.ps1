# Script para configurar registry alternativo de npm
# Soluciona el error: 503 Service Unavailable

Write-Host "🔧 Configurando registry alternativo de npm..." -ForegroundColor Cyan
Write-Host ""

# Opción 1: Usar mirror de Taobao (China - muy rápido y estable)
Write-Host "✅ Configurando registry a mirror de Taobao..." -ForegroundColor Yellow
npm config set registry https://registry.npmmirror.com

Write-Host ""
Write-Host "📦 Limpiando caché..." -ForegroundColor Yellow
npm cache clean --force

Write-Host ""
Write-Host "📥 Instalando dependencias..." -ForegroundColor Yellow
cd mqtt-broker
npm install --no-audit --no-fund --retries=5

Write-Host ""
Write-Host "✅ Instalación completada!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Para volver al registry original:" -ForegroundColor Cyan
Write-Host "   npm config set registry https://registry.npmjs.org/" -ForegroundColor White
