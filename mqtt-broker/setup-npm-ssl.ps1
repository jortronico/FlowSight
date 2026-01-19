# Script para configurar npm con certificados SSL
# Soluciona el error: SELF_SIGNED_CERT_IN_CHAIN

Write-Host "🔧 Configurando npm para solucionar error SSL..." -ForegroundColor Cyan
Write-Host ""

# Opción 1: Deshabilitar verificación estricta de SSL (solo desarrollo)
Write-Host "✅ Configurando npm para ignorar certificados SSL..." -ForegroundColor Yellow
npm config set strict-ssl false

Write-Host ""
Write-Host "📦 Intentando instalar dependencias..." -ForegroundColor Yellow
Write-Host ""

# Limpiar caché
npm cache clean --force

# Instalar dependencias
cd mqtt-broker
npm install --no-audit --no-fund

Write-Host ""
Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  NOTA: strict-ssl está deshabilitado solo para desarrollo" -ForegroundColor Yellow
Write-Host "   Para volver a habilitarlo ejecuta:" -ForegroundColor Gray
Write-Host "   npm config set strict-ssl true" -ForegroundColor White
