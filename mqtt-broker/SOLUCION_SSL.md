# 🔧 Solución: Error SELF_SIGNED_CERT_IN_CHAIN

## ❌ Problema
```
npm error code SELF_SIGNED_CERT_IN_CHAIN
npm error request to https://registry.npmjs.org/aedes failed, 
reason: self-signed certificate in certificate chain
```

## ✅ Solución 1: Deshabilitar verificación SSL (Desarrollo)

```bash
npm config set strict-ssl false
```

Luego instala:
```bash
cd mqtt-broker
npm install
```

## ✅ Solución 2: Configurar proxy (Si usas proxy corporativo)

```bash
# Si tienes proxy HTTP
npm config set proxy http://proxy-server:port
npm config set https-proxy http://proxy-server:port

# Si el proxy requiere autenticación
npm config set proxy http://usuario:password@proxy-server:port
npm config set https-proxy http://usuario:password@proxy-server:port
```

## ✅ Solución 3: Usar registry HTTP (temporal)

```bash
npm config set registry http://registry.npmjs.org/
npm install
npm config set registry https://registry.npmjs.org/  # Volver a HTTPS después
```

## ✅ Solución 4: Configurar certificados CA

Si tienes el certificado CA de tu empresa:

```bash
npm config set cafile "C:\ruta\al\certificado.crt"
```

## 🔄 Para volver a la configuración normal después:

```bash
npm config set strict-ssl true
```

## ⚠️ Importante

- `strict-ssl false` solo debe usarse en desarrollo
- En producción, configura correctamente los certificados
- Si estás en una red corporativa, pregunta a tu administrador sobre el proxy
