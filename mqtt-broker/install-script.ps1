# Script PowerShell para instalar dependencias del MQTT Broker
# Uso: .\install-script.ps1

Write-Host "🚀 Instalando dependencias del MQTT Broker..." -ForegroundColor Cyan
Write-Host ""

# Limpiar caché
Write-Host "📦 Limpiando caché de npm..." -ForegroundColor Yellow
npm cache clean --force

# Eliminar node_modules si existe
if (Test-Path node_modules) {
    Write-Host "🗑️  Eliminando node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules
}

# Eliminar package-lock.json si existe
if (Test-Path package-lock.json) {
    Write-Host "🗑️  Eliminando package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force package-lock.json
}

Write-Host ""
Write-Host "📥 Instalando paquetes..." -ForegroundColor Yellow
Write-Host ""

# Instalar paquetes uno por uno
Write-Host "  1/5 Instalando dotenv..." -ForegroundColor Gray
npm install dotenv@^16.3.1 --save --silent

Write-Host "  2/5 Instalando ws..." -ForegroundColor Gray
npm install ws@^8.16.0 --save --silent

Write-Host "  3/5 Instalando aedes (puede tardar)..." -ForegroundColor Gray
npm install aedes@^0.50.1 --save --no-audit --no-fund

Write-Host "  4/5 Instalando aedes-persistence..." -ForegroundColor Gray
npm install aedes-persistence@^9.0.0 --save --no-audit --no-fund

Write-Host "  5/5 Instalando nodemon..." -ForegroundColor Gray
npm install nodemon@^3.0.2 --save-dev --silent

Write-Host ""
Write-Host "✅ Instalación completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar el broker:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
