#!/bin/bash
# Script para configurar acceso a MySQL en Ubuntu
# Soluciona el problema de autenticación auth_socket

echo "🔧 Configurando acceso a MySQL para FlowSight..."
echo ""

# Leer variables del .env
if [ ! -f .env ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "   Ejecuta primero: node create-env.js"
    exit 1
fi

source .env

DB_USER=${DB_USER:-flowsight_user}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-flowsight_db}

echo "📝 Configuración:"
echo "   Usuario MySQL: $DB_USER"
echo "   Base de datos: $DB_NAME"
echo ""

if [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  DB_PASSWORD no está configurado en .env"
    echo "   Generando contraseña aleatoria..."
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    echo "   Contraseña generada: $DB_PASSWORD"
    echo ""
    echo "💡 Actualiza tu .env con: DB_PASSWORD=$DB_PASSWORD"
    echo ""
fi

echo "📋 Ejecuta estos comandos en MySQL (como root con sudo):"
echo ""
echo "sudo mysql << EOF"
echo "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
echo "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
echo "FLUSH PRIVILEGES;"
echo "SELECT user, host, plugin FROM mysql.user WHERE user='$DB_USER';"
echo "EOF"
echo ""
echo "📝 Luego actualiza tu .env:"
echo "   DB_USER=$DB_USER"
echo "   DB_PASSWORD=$DB_PASSWORD"
echo ""
