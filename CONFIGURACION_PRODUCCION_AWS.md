# Configuración para Producción en AWS EC2

## Problema: Error de Conexión al Loguearse

Si al intentar loguearte obtienes "error de conexión", sigue estos pasos:

## 1. Configurar Variables de Entorno del Backend

Edita `backend/.env` y asegúrate de tener:

```env
# CORS - URL del Panel Web (ajusta según tu dominio)
ALLOWED_ORIGIN=https://alarma.puntopedido.com.ar

# API REST Configuration
API_PORT=3001
API_HOST=0.0.0.0
```

**Importante:** El `ALLOWED_ORIGIN` debe coincidir EXACTAMENTE con el dominio desde donde se accede al frontend (con o sin www, con o sin .ar, etc.)

## 2. Configurar Variables de Entorno del Frontend

Crea un archivo `.env` en `web-admin/`:

```bash
cd web-admin
cp .env.example .env
```

Edita `web-admin/.env`:

```env
# URL completa de la API Backend
VITE_API_URL=https://alarma.puntopedido.com.ar/api
```

**Nota:** Si tu API está en un puerto diferente o subdominio, ajusta la URL:
- Si la API está en el mismo dominio pero puerto 3001: `https://alarma.puntopedido.com.ar:3001/api`
- Si la API está en un subdominio: `https://api.alarma.puntopedido.com.ar/api`

## 3. Reconstruir el Frontend

Después de cambiar las variables de entorno, debes reconstruir:

```bash
cd web-admin
npm run build
```

## 4. Configurar Nginx (Reverse Proxy)

Si usas Nginx como reverse proxy, configura algo así:

```nginx
# Frontend (React/Vite)
server {
    listen 80;
    server_name alarma.puntopedido.com.ar;
    
    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name alarma.puntopedido.com.ar;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Servir el frontend
    root /var/www/alarma-web/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy para la API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket para Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 5. Verificar Configuración

### Verificar que el Backend está corriendo:

```bash
curl http://localhost:3001/api/health
```

Debería responder:
```json
{"status":"ok","timestamp":"...","service":"FlowSight API"}
```

### Verificar desde el navegador:

Abre la consola del navegador (F12) y verifica:
1. Que no haya errores de CORS
2. Que las peticiones a `/api/auth/login` se estén haciendo correctamente
3. Revisa la pestaña Network para ver el estado de las peticiones

### Verificar CORS:

El backend debe permitir el origen exacto. Verifica en los logs del backend que muestre:
```
Origen permitido (CORS): https://alarma.puntopedido.com.ar
```

## 6. Problemas Comunes

### Error: "Network Error" o "CORS Error"

- Verifica que `ALLOWED_ORIGIN` en `backend/.env` coincida EXACTAMENTE con la URL del frontend
- Verifica que el backend esté corriendo
- Verifica que el puerto 3001 esté abierto en el Security Group de AWS

### Error: "Connection refused"

- Verifica que el backend esté corriendo: `pm2 list` o `systemctl status alarma-api`
- Verifica que el puerto esté abierto: `netstat -tulpn | grep 3001`
- Verifica el Security Group de AWS EC2

### Error: "401 Unauthorized"

- Verifica que el usuario admin exista: `node check-admin.js`
- Verifica las credenciales: `admin@flowsight.com` / `admin123`

## 7. Comandos Útiles

```bash
# Ver logs del backend
pm2 logs alarma-api
# o
journalctl -u alarma-api -f

# Reiniciar backend
pm2 restart alarma-api
# o
systemctl restart alarma-api

# Verificar conexión a la API
curl -X POST https://alarma.puntopedido.com.ar/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowsight.com","password":"admin123"}'

# Verificar que el frontend tiene la variable de entorno
# En el navegador, consola: console.log(import.meta.env.VITE_API_URL)
```

## 8. Estructura de Archivos en el Servidor

```
/var/www/
├── alarma-api/          # Backend Node.js
│   ├── .env
│   ├── src/
│   └── ...
├── alarma-web/          # Frontend (build)
│   └── dist/
│       ├── index.html
│       └── assets/
└── nginx/
    └── sites-available/
        └── alarma
```

## 9. Checklist de Configuración

- [ ] Backend corriendo en puerto 3001
- [ ] Frontend construido con `npm run build`
- [ ] Variables de entorno configuradas en backend/.env
- [ ] Variables de entorno configuradas en web-admin/.env
- [ ] Nginx configurado como reverse proxy
- [ ] SSL/HTTPS configurado
- [ ] Security Group de AWS permite puertos 80, 443, 3001
- [ ] CORS configurado correctamente
- [ ] Usuario admin existe en la base de datos
- [ ] MySQL accesible desde el backend
