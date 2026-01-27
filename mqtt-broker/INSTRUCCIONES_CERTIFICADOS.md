# Instrucciones para Generar Certificados SSL

## 🎯 Objetivo

Generar certificados SSL para habilitar MQTT sobre TLS (puerto 8883) en el broker.

## 📋 Requisitos Previos

### Windows

1. **OpenSSL** - Descarga desde:
   - https://slproweb.com/products/Win32OpenSSL.html
   - O instala con Chocolatey: `choco install openssl`
   - O usa Git Bash (viene con OpenSSL)

2. **Verificar instalación:**
   ```powershell
   openssl version
   ```

### Linux/Mac

OpenSSL generalmente viene preinstalado. Verifica con:
```bash
openssl version
```

## 🚀 Método Rápido (Recomendado)

### Windows

```powershell
cd mqtt-broker
.\generar-certificados.ps1
```

### Linux/Mac

```bash
cd mqtt-broker
chmod +x generar-certificados.sh
./generar-certificados.sh
```

## 🔧 Método Manual

### 1. Crear carpeta de certificados

```bash
cd mqtt-broker
mkdir -p certs
cd certs
```

### 2. Generar clave privada (2048 bits)

```bash
openssl genrsa -out server-key.pem 2048
```

### 3. Generar certificado autofirmado

```bash
openssl req -new -x509 -days 365 -key server-key.pem -out server-cert.pem \
  -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=FlowSight/CN=44.221.95.191"
```

**Parámetros:**
- `-days 365`: Válido por 1 año
- `-subj`: Información del certificado
  - `C=AR`: País (Argentina)
  - `CN=44.221.95.191`: Common Name (IP del servidor)

### 4. Configurar permisos

**Linux/Mac:**
```bash
chmod 600 server-key.pem  # Solo lectura para el propietario
chmod 644 server-cert.pem # Lectura para todos
```

**Windows:**
```powershell
icacls server-key.pem /inheritance:r /grant:r "$env:USERNAME:(R)"
```

## ✅ Verificación

### Verificar que los archivos existen

```bash
ls -la certs/
# Deberías ver:
# server-key.pem
# server-cert.pem
```

### Verificar contenido del certificado

```bash
openssl x509 -in certs/server-cert.pem -text -noout
```

### Probar conexión TLS

```bash
openssl s_client -connect 44.221.95.191:8883 -showcerts
```

## 📁 Estructura Final

```
mqtt-broker/
├── certs/
│   ├── server-key.pem      # Clave privada (NO compartir)
│   └── server-cert.pem     # Certificado público
├── src/
│   └── index.js
└── package.json
```

## 🔒 Seguridad

### ⚠️ Importante

1. **NO compartas `server-key.pem`** - Es la clave privada
2. **NO commitees los certificados** al repositorio Git
3. **Protege los permisos** - Solo el servidor debe leer la clave
4. **Rota los certificados** periódicamente (cada año)

### Agregar a .gitignore

```bash
# mqtt-broker/.gitignore
certs/*.pem
certs/*.key
*.pem
*.key
```

## 🚀 Iniciar el Broker

Después de generar los certificados:

```bash
cd mqtt-broker
npm start
```

Deberías ver:

```
🚀 MQTT TCP (sin TLS) escuchando en puerto 1883
🔒 MQTT TLS escuchando en puerto 8883
   Certificado: ./certs/server-cert.pem
   Clave: ./certs/server-key.pem
```

## 🐛 Solución de Problemas

### Error: "openssl: command not found"

**Windows:**
- Instala OpenSSL o usa Git Bash
- Agrega OpenSSL al PATH

**Linux:**
```bash
sudo apt-get install openssl  # Debian/Ubuntu
sudo yum install openssl       # CentOS/RHEL
```

### Error: "Permission denied"

**Linux/Mac:**
```bash
chmod 600 certs/server-key.pem
```

**Windows:**
```powershell
icacls certs\server-key.pem /inheritance:r /grant:r "$env:USERNAME:(R)"
```

### Error: "Certificados no encontrados"

- Verifica que los archivos estén en `mqtt-broker/certs/`
- Verifica las rutas en `.env` o `index.js`
- Verifica permisos de lectura

## 📚 Próximos Pasos

1. ✅ Generar certificados
2. ✅ Configurar `.env` con `MQTT_USE_TLS=true`
3. ✅ Iniciar el broker
4. ✅ Verificar que escucha en puerto 8883
5. ✅ Probar conexión desde el firmware ESP32

## 🔄 Renovar Certificados

Cuando expiren (después de 365 días):

```bash
cd mqtt-broker/certs
# Regenerar con los mismos comandos
openssl genrsa -out server-key.pem 2048
openssl req -new -x509 -days 365 -key server-key.pem -out server-cert.pem \
  -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=FlowSight/CN=44.221.95.191"
```
