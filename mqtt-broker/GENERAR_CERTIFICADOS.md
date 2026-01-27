# Generar Certificados SSL para MQTT TLS

## 🔐 Generar Certificados Autofirmados

### Opción 1: Script Automático (Recomendado)

```bash
# Crear carpeta para certificados
mkdir -p certs
cd certs

# Generar clave privada
openssl genrsa -out server-key.pem 2048

# Generar certificado autofirmado (válido por 365 días)
openssl req -new -x509 -days 365 -key server-key.pem -out server-cert.pem \
  -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=FlowSight/CN=44.221.95.191"

# Generar certificado CA (opcional)
openssl genrsa -out ca-key.pem 2048
openssl req -new -x509 -days 365 -key ca-key.pem -out ca-cert.pem \
  -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=FlowSight/CN=FlowSight CA"
```

### Opción 2: Certificados con Let's Encrypt

Si tienes un dominio apuntando a la IP:

```bash
# Instalar certbot
sudo apt-get install certbot

# Generar certificados
sudo certbot certonly --standalone -d tu-dominio.com

# Copiar certificados
cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem certs/server-key.pem
cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem certs/server-cert.pem
```

## 📁 Estructura de Carpetas

```
mqtt-broker/
├── certs/
│   ├── server-key.pem      # Clave privada del servidor
│   ├── server-cert.pem     # Certificado del servidor
│   └── ca-cert.pem         # Certificado CA (opcional)
└── src/
    └── index.js
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en `mqtt-broker/`:

```bash
# Puertos
MQTT_PORT=1883
MQTT_TLS_PORT=8883
MQTT_WS_PORT=8083

# Habilitar TLS
MQTT_USE_TLS=true

# Rutas de certificados (opcional, usa rutas por defecto si no se especifican)
TLS_KEY_PATH=./certs/server-key.pem
TLS_CERT_PATH=./certs/server-cert.pem
TLS_CA_PATH=./certs/ca-cert.pem

# Autenticación
MQTT_USERNAME=flowsight
MQTT_PASSWORD=mqtt_password

# Contraseñas por dispositivo (opcional)
DEVICE_001_PASSWORD=password_dispositivo_1
SENSOR_ESCALERA_PASSWORD=password_sensor_escalera
SENSOR_SALA_PASSWORD=password_sensor_sala

# Entorno
NODE_ENV=production
```

## ✅ Verificar Certificados

```bash
# Verificar certificado
openssl x509 -in certs/server-cert.pem -text -noout

# Probar conexión TLS
openssl s_client -connect 44.221.95.191:8883 -showcerts
```

## 🔒 Seguridad

### Para Producción

1. **Usa certificados de una CA confiable** (Let's Encrypt, etc.)
2. **Protege las claves privadas** con permisos restrictivos:
   ```bash
   chmod 600 certs/server-key.pem
   ```
3. **No commitees los certificados** al repositorio
4. **Rota los certificados** periódicamente

### Permisos Recomendados

```bash
chmod 600 certs/server-key.pem
chmod 644 certs/server-cert.pem
chmod 644 certs/ca-cert.pem
```

## 📚 Referencias

- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Node.js TLS](https://nodejs.org/api/tls.html)
