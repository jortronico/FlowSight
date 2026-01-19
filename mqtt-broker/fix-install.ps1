# Script para solucionar problemas de instalación
# 1. Cambia a registry alternativo
# 2. Limpia node_modules con permisos
# 3. Reinstala dependencias

Write-Host "🔧 Solucionando problemas de instalación..." -ForegroundColor Cyan
Write-Host ""

# Paso 1: Cambiar registry
Write-Host "1️⃣  Configurando registry alternativo..." -ForegroundColor Yellow
npm config set registry https://registry.npmmirror.com
npm config set strict-ssl false

# Paso 2: Limpiar caché
Write-Host "2️⃣  Limpiando caché..." -ForegroundColor Yellow
npm cache clean --force

# Paso 3: Cerrar procesos que puedan estar bloqueando archivos
Write-Host "3️⃣  Verificando procesos de Node..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Paso 4: Eliminar node_modules con retry
Write-Host "4️⃣  Eliminando node_modules (puede tardar)..." -ForegroundColor Yellow
$nodeModulesPath = Join-Path $PSScriptRoot "node_modules"
if (Test-Path $nodeModulesPath) {
    # Intentar varias veces
    for ($i = 1; $i -le 3; $i++) {
        try {
            Remove-Item -Path $nodeModulesPath -Recurse -Force -ErrorAction Stop
            Write-Host "   ✅ Eliminado exitosamente" -ForegroundColor Green
            break
        } catch {
            Write-Host "   ⚠️  Intento $i fallido, esperando..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            if ($i -eq 3) {
                Write-Host "   ❌ No se pudo eliminar. Cierra VSCode/IDE y ejecuta este script de nuevo." -ForegroundColor Red
                Write-Host "   O elimina manualmente la carpeta: $nodeModulesPath" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "   ℹ️  No existe node_modules" -ForegroundColor Gray
}

# Paso 5: Eliminar package-lock.json
$lockPath = Join-Path $PSScriptRoot "package-lock.json"
if (Test-Path $lockPath) {
    Remove-Item -Path $lockPath -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ package-lock.json eliminado" -ForegroundColor Green
}

# Paso 6: Instalar
Write-Host ""
Write-Host "5️⃣  Instalando dependencias..." -ForegroundColor Yellow
npm install --no-audit --no-fund --retries=10 --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

Write-Host ""
Write-Host "✅ Proceso completado!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Para volver al registry original:" -ForegroundColor Cyan
Write-Host "   npm config set registry https://registry.npmjs.org/" -ForegroundColor White
