# Seguridad del Sistema de Alarma de Hogar

## Medidas de Seguridad Implementadas

### 1. Autenticación por Token JWT
- **Todas las rutas** requieren un token JWT válido en el header `Authorization: Bearer <token>`
- El token se genera después de un login exitoso
- El token contiene el `userId` y se verifica contra la base de datos

### 2. Autorización por Roles
- **Rutas críticas restringidas a ADMIN únicamente:**
  - `POST /api/home-alarm/arm` - Activar alarma
  - `POST /api/home-alarm/disarm` - Desactivar alarma
  - `POST /api/home-alarm/siren/activate` - Activar sirena
  - `POST /api/home-alarm/siren/deactivate` - Desactivar sirena
  - `PUT /api/home-alarm/sensors/:id/toggle` - Modificar sensores
  - `POST /api/home-alarm/schedules` - Crear horarios
  - `PUT /api/home-alarm/schedules/:id` - Modificar horarios
  - `DELETE /api/home-alarm/schedules/:id` - Eliminar horarios
  - `PUT /api/home-alarm/auto-arm` - Configurar activación automática

- **Rutas disponibles para todos los usuarios autenticados:**
  - `GET /api/home-alarm/status` - Ver estado (read-only)
  - `GET /api/home-alarm/sensors` - Ver sensores (read-only)
  - `GET /api/home-alarm/schedules` - Ver horarios (read-only)
  - `GET /api/home-alarm/history` - Ver historial (read-only)

### 3. Logging de Seguridad
Todas las acciones críticas se registran en `system_logs` con:
- Tipo de evento de seguridad
- ID y email del usuario
- Dirección IP
- Timestamp
- Detalles del evento

Eventos registrados:
- `ALARM_ARMED` - Alarma activada
- `ALARM_DISARMED` - Alarma desactivada
- `SIREN_ACTIVATED_MANUAL` - Sirena activada manualmente
- `UNAUTHORIZED_ALARM_ARM_ATTEMPT` - Intento no autorizado de activar
- `UNAUTHORIZED_ALARM_DISARM_ATTEMPT` - Intento no autorizado de desactivar
- `UNAUTHORIZED_SIREN_ACTIVATION_ATTEMPT` - Intento no autorizado de activar sirena

### 4. Validación en Múltiples Capas

#### Nivel de Middleware (auth.middleware.js)
```javascript
// Verifica token JWT
authMiddleware: Valida que el token sea válido y el usuario exista
adminMiddleware: Verifica que req.user.role === 'admin'
```

#### Nivel de Controlador (homeAlarm.controller.js)
```javascript
// Validación adicional antes de ejecutar acción
if (userRole !== 'admin') {
  // Registra intento no autorizado
  // Retorna error 403
}
```

### 5. Protección de MQTT

**IMPORTANTE:** El sistema de alarma NO recibe comandos desde MQTT. Todos los comandos vienen exclusivamente a través de:
- API REST autenticada (HTTPS en producción)
- Validación de token JWT
- Validación de rol de usuario

MQTT solo se usa para:
- Recibir alarmas de sensores IoT (lectura)
- Recibir estados de dispositivos (lectura)
- NO se publican comandos de control de alarma a través de MQTT

### 6. Encriptación de Comunicación

#### Desarrollo
- HTTP estándar (no encriptado)
- Los tokens JWT están firmados pero no encriptados

#### Producción (Recomendado)
1. **HTTPS/TLS**: Usar SSL/TLS para todas las comunicaciones
2. **Secrets en variables de entorno**: 
   ```env
   JWT_SECRET=<secret_fuerte_y_aleatorio>
   ```
3. **Validar origen de requests**: Implementar CORS estricto
4. **Rate limiting**: Limitar intentos de login y comandos

### 7. Auditoría Completa

Todas las acciones se registran en `home_alarm_history` con:
- Tipo de evento
- Usuario que ejecutó la acción
- Timestamp
- Mensaje descriptivo
- Metadata adicional

## Configuración Recomendada para Producción

### Variables de Entorno
```env
# Token secreto fuerte (generar con: openssl rand -base64 32)
JWT_SECRET=<secret_muy_fuerte>

# Configuración SSL
SSL_CERT=/path/to/cert.pem
SSL_KEY=/path/to/key.pem
```

### Headers de Seguridad
```javascript
// Ya implementado con helmet()
app.use(helmet());
```

### Rate Limiting (Recomendado agregar)
```javascript
const rateLimit = require('express-rate-limit');

const alarmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana
  message: 'Demasiados intentos, por favor intente más tarde'
});

router.post('/arm', alarmLimiter, adminMiddleware, homeAlarmController.arm);
```

## Verificación de Seguridad

### Consultar intentos no autorizados
```sql
SELECT * FROM system_logs 
WHERE source = 'security' 
AND level = 'warning'
ORDER BY created_at DESC;
```

### Consultar historial de acciones
```sql
SELECT h.*, u.name as user_name, u.email
FROM home_alarm_history h
LEFT JOIN users u ON h.user_id = u.id
ORDER BY h.created_at DESC
LIMIT 50;
```

## Resumen

✅ **Autenticación**: JWT tokens obligatorios  
✅ **Autorización**: Solo admin puede activar/desactivar  
✅ **Logging**: Todos los eventos críticos registrados  
✅ **Validación**: Doble validación (middleware + controller)  
✅ **MQTT**: No recibe comandos de control (solo lectura)  
⚠️ **HTTPS**: Requerido para producción  
⚠️ **Rate Limiting**: Recomendado agregar
