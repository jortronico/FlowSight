# Solución: Error "Ruta no encontrada"

## Problema

Al intentar hacer login, obtienes:
```json
{"success":false,"message":"Ruta no encontrada"}
```

## Causa

El error "Ruta no encontrada" significa que la petición está llegando al backend, pero la ruta no coincide. Esto generalmente ocurre porque:

1. **Nginx está reescribiendo la URL incorrectamente** - Cuando usas `proxy_pass http://localhost:3001` sin incluir `/api`, Nginx pasa la ruta completa `/api/auth/login` al backend, pero el backend espera que la ruta ya incluya `/api`.

2. **La configuración de `proxy_pass` es incorrecta** - Dependiendo de si incluyes o no el path en `proxy_pass`, Nginx se comporta diferente.

## Solución

### Opción 1: Incluir `/api` en proxy_pass (RECOMENDADO)

```nginx
location /api {
    # Incluir /api para que Nginx pase la ruta completa
    proxy_pass http://localhost:3001/api;
    
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Manejar OPTIONS
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        return 204;
    }
}
```

**Cómo funciona:**
- Petición: `https://alarma.puntopedido.com.ar/api/auth/login`
- Nginx captura: `/api/auth/login`
- Nginx reenvía a: `http://localhost:3001/api/auth/login` ✅

### Opción 2: Reescribir la ruta (ALTERNATIVA)

Si prefieres no incluir `/api` en `proxy_pass`, necesitas reescribir:

```nginx
location /api {
    # Sin /api en proxy_pass, pero reescribir
    rewrite ^/api/(.*) /api/$1 break;
    proxy_pass http://localhost:3001;
    
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Verificación

### 1. Probar directamente al backend

```bash
# Debe funcionar
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowsight.com","password":"admin123"}'
```

### 2. Verificar qué ruta está recibiendo el backend

Agrega un log temporal en `backend/src/index.js` antes de las rutas:

```javascript
app.use((req, res, next) => {
  console.log('Ruta recibida:', req.method, req.path, req.url);
  next();
});
```

Luego revisa los logs:
```bash
pm2 logs alarma-api
```

Deberías ver algo como:
```
Ruta recibida: POST /api/auth/login /api/auth/login
```

Si ves `/auth/login` en lugar de `/api/auth/login`, entonces Nginx está removiendo `/api`.

### 3. Probar a través de Nginx

```bash
# Desde el servidor
curl -X POST https://alarma.puntopedido.com.ar/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowsight.com","password":"admin123"}'
```

## Comportamiento de proxy_pass en Nginx

**Regla importante:**
- `location /api` + `proxy_pass http://localhost:3001` → Pasa `/api/auth/login` completo
- `location /api` + `proxy_pass http://localhost:3001/api` → Pasa `/api/auth/login` completo
- `location /api/` + `proxy_pass http://localhost:3001/` → Pasa solo `/auth/login` (remueve `/api`)

## Configuración Final Recomendada

```nginx
location /api {
    proxy_pass http://localhost:3001/api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # OPTIONS preflight
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        return 204;
    }
}
```

## Aplicar Cambios

```bash
# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx

# Verificar logs
sudo tail -f /var/log/nginx/alarma-error.log
```

## Checklist

- [ ] `proxy_pass` incluye `/api` o reescribe correctamente
- [ ] Nginx recargado después de cambios
- [ ] Backend recibe la ruta completa `/api/auth/login`
- [ ] Prueba directa al backend funciona
- [ ] Prueba a través de Nginx funciona
