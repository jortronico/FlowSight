# Generar Certificados SSL - Guía Rápida

## 🚀 Opción 1: Script Automático (Windows)

```powershell
cd mqtt-broker
.\generar-certificados.ps1
```

## 🚀 Opción 2: Script Automático (Linux/Mac)

```bash
cd mqtt-broker
chmod +x generar-certificados.sh
./generar-certificados.sh
```

## 🔧 Opción 3: Manual (Cualquier SO)

### Paso 1: Crear carpeta

```bash
cd mqtt-broker
mkdir -p certs
cd certs
```

### Paso 2: Generar clave privada

```bash
openssl genrsa -out server-key.pem 2048
```

### Paso 3: Generar certificado autofirmado

```bash
openssl req -new -x509 -days 365 -key server-key.pem -out server-cert.pem \
  -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=FlowSight/CN=44.221.95.191"
```

### Paso 4: Configurar permisos

**Linux/Mac:**
```bash
chmod 600 server-key.pem
chmod 644 server-cert.pem
```

**Windows:**
```powershell
icacls server-key.pem /inheritance:r /grant:r "$env:USERNAME:(R)"
```

## ✅ Verificar

Después de generar, deberías tener:

```
mqtt-broker/
└── certs/
    ├── server-key.pem      (clave privada)
    └── server-cert.pem     (certificado)
```

## 🔍 Verificar Certificado

```bash
openssl x509 -in certs/server-cert.pem -text -noout
```

## 📝 Notas

- Los certificados autofirmados son para desarrollo
- Para producción, usa Let's Encrypt o una CA confiable
- El certificado es válido por 365 días
- El CN (Common Name) debe coincidir con la IP o dominio del servidor
