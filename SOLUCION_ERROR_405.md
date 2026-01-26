# Solución: Error 405 Method Not Allowed

## Problema

Al intentar hacer login, obtienes:
```
POST https://alarma.puntopedido.com.ar/api/auth/login
405 Method Not Allowed
```

## Causa

El error 405 generalmente ocurre porque:
1. Nginx no está pasando correctamente los métodos HTTP (especialmente POST)
2. La configuración del proxy no maneja correctamente las peticiones OPTIONS (preflight)
3. El proxy_pass tiene una configuración incorrecta

## Solución

### 1. Actualizar Configuración de Nginx

Usa el archivo `nginx-config-alarma.conf` que se creó, o actualiza tu configuración actual:

**Ubicación del archivo:** `/etc/nginx/sites-available/alarma`

**Puntos críticos a verificar:**

```nginx
location /api {
    # IMPORTANTE: Sin trailing slash
    proxy_pass http://localhost:3001;
    
    # Permitir todos los métodos HTTP
    proxy_method POST;
    proxy_method GET;
    proxy_method PUT;
    proxy_method DELETE;
    proxy_method OPTIONS;
    
    # Headers necesarios
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Manejar OPTIONS (preflight)
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        return 204;
    }
}
```

### 2. Verificar que el Backend esté Corriendo

```bash
# Verificar que el backend responde
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowsight.com","password":"admin123"}'
```

Si esto funciona, el problema está en Nginx. Si no funciona, el problema está en el backend.

### 3. Aplicar la Nueva Configuración

```bash
# Probar la configuración de Nginx
sudo nginx -t

# Si está correcta, recargar Nginx
sudo systemctl reload nginx
# o
sudo service nginx reload
```

### 4. Verificar Logs

```bash
# Logs de Nginx
sudo tail -f /var/log/nginx/alarma-error.log
sudo tail -f /var/log/nginx/alarma-access.log

# Logs del backend
pm2 logs alarma-api
# o
journalctl -u alarma-api -f
```

### 5. Verificar desde el Navegador

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Network
3. Intenta hacer login
4. Revisa la petición `/api/auth/login`:
   - **Request Method:** Debe ser `POST`
   - **Status Code:** Debe ser 200 o 401 (no 405)
   - **Request Headers:** Debe incluir `Content-Type: application/json`
   - **Response Headers:** Debe incluir headers CORS si hay error

## Configuración Alternativa (Más Simple)

Si la configuración anterior no funciona, prueba esta versión más simple:

```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Permitir todos los métodos
    proxy_method $request_method;
}
```

## Verificación Rápida

Ejecuta estos comandos para diagnosticar:

```bash
# 1. Verificar que Nginx está corriendo
sudo systemctl status nginx

# 2. Verificar que el backend está corriendo
pm2 list
# o
systemctl status alarma-api

# 3. Probar conexión directa al backend
curl http://localhost:3001/api/health

# 4. Probar login directo al backend
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowsight.com","password":"admin123"}'

# 5. Probar a través de Nginx (desde el servidor)
curl -X POST https://alarma.puntopedido.com.ar/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowsight.com","password":"admin123"}'
```

## Problemas Comunes

### Si el backend responde directamente pero no a través de Nginx:

- Verifica que `proxy_pass` no tenga trailing slash: `http://localhost:3001` (correcto) vs `http://localhost:3001/` (incorrecto)
- Verifica que el método HTTP se está pasando correctamente
- Revisa los logs de Nginx para ver qué está bloqueando

### Si obtienes 502 Bad Gateway:

- El backend no está corriendo o no está escuchando en el puerto 3001
- Verifica: `netstat -tulpn | grep 3001`

### Si obtienes 404 Not Found:

- La ruta `/api` no está siendo capturada correctamente
- Verifica que la configuración de Nginx esté activa: `ls -la /etc/nginx/sites-enabled/`

## Checklist

- [ ] Nginx configurado correctamente
- [ ] `nginx -t` pasa sin errores
- [ ] Nginx recargado después de cambios
- [ ] Backend corriendo en puerto 3001
- [ ] Backend responde a `curl http://localhost:3001/api/health`
- [ ] Backend responde a login directo
- [ ] Nginx proxy funciona para `/api`
- [ ] CORS configurado correctamente
- [ ] Métodos HTTP permitidos (GET, POST, PUT, DELETE, OPTIONS)
