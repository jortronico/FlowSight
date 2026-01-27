#!/bin/bash

# Script para generar certificados SSL para MQTT TLS
# Uso: ./generar-certificados.sh

echo "🔐 Generando certificados SSL para MQTT TLS..."

# Crear carpeta de certificados
mkdir -p certs
cd certs

# Generar clave privada del servidor
echo "📝 Generando clave privada..."
openssl genrsa -out server-key.pem 2048

# Generar certificado autofirmado
echo "📝 Generando certificado autofirmado..."
openssl req -new -x509 -days 365 -key server-key.pem -out server-cert.pem \
  -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=FlowSight/CN=44.221.95.191"

# Generar certificado CA (opcional)
echo "📝 Generando certificado CA..."
openssl genrsa -out ca-key.pem 2048
openssl req -new -x509 -days 365 -key ca-key.pem -out ca-cert.pem \
  -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=FlowSight/CN=FlowSight CA"

# Configurar permisos
chmod 600 server-key.pem
chmod 644 server-cert.pem
chmod 644 ca-cert.pem

echo "✅ Certificados generados exitosamente!"
echo ""
echo "📁 Archivos creados:"
echo "   - certs/server-key.pem"
echo "   - certs/server-cert.pem"
echo "   - certs/ca-cert.pem"
echo ""
echo "🔒 Permisos configurados correctamente"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - No compartas server-key.pem"
echo "   - No commitees los certificados al repositorio"
echo "   - Para producción, usa certificados de una CA confiable"
