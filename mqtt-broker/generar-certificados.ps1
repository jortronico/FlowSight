# Script PowerShell para generar certificados SSL para MQTT TLS
# Uso: .\generar-certificados.ps1

Write-Host "🔐 Generando certificados SSL para MQTT TLS..." -ForegroundColor Cyan

# Crear carpeta de certificados
$certsDir = Join-Path $PSScriptRoot "certs"
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir | Out-Null
    Write-Host "✅ Carpeta certs/ creada" -ForegroundColor Green
}

# Verificar si OpenSSL está instalado
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $opensslPath) {
    Write-Host "❌ OpenSSL no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para instalar OpenSSL en Windows:" -ForegroundColor Yellow
    Write-Host "1. Descarga desde: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor White
    Write-Host "2. O instala con Chocolatey: choco install openssl" -ForegroundColor White
    Write-Host "3. O instala con Git Bash (viene con OpenSSL)" -ForegroundColor White
    exit 1
}

Set-Location $certsDir

# Generar clave privada del servidor
Write-Host "📝 Generando clave privada (server-key.pem)..." -ForegroundColor Yellow
& openssl genrsa -out server-key.pem 2048
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error generando clave privada" -ForegroundColor Red
    exit 1
}

# Generar certificado autofirmado
Write-Host "📝 Generando certificado autofirmado (server-cert.pem)..." -ForegroundColor Yellow
& openssl req -new -x509 -days 365 -key server-key.pem -out server-cert.pem `
    -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=FlowSight/CN=44.221.95.191"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error generando certificado" -ForegroundColor Red
    exit 1
}

# Generar certificado CA (opcional)
Write-Host "📝 Generando certificado CA (ca-cert.pem)..." -ForegroundColor Yellow
& openssl genrsa -out ca-key.pem 2048
if ($LASTEXITCODE -eq 0) {
    & openssl req -new -x509 -days 365 -key ca-key.pem -out ca-cert.pem `
        -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=FlowSight/CN=FlowSight CA"
}

# Configurar permisos (Windows)
Write-Host "🔒 Configurando permisos..." -ForegroundColor Yellow
icacls server-key.pem /inheritance:r /grant:r "$env:USERNAME:(R)" | Out-Null

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "✅ Certificados generados exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Archivos creados en certs/:" -ForegroundColor Cyan
Write-Host "   - server-key.pem (clave privada)" -ForegroundColor White
Write-Host "   - server-cert.pem (certificado del servidor)" -ForegroundColor White
Write-Host "   - ca-cert.pem (certificado CA, opcional)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - NO compartas server-key.pem" -ForegroundColor White
Write-Host "   - NO commitees los certificados al repositorio" -ForegroundColor White
Write-Host "   - Para producción, usa certificados de una CA confiable" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ahora puedes iniciar el broker con: npm start" -ForegroundColor Green
