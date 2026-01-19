# Solución para npm install que no termina

## Método 1: Limpiar caché y reinstalar

```bash
cd mqtt-broker

# Limpiar caché de npm
npm cache clean --force

# Eliminar node_modules si existe
rm -rf node_modules
# En Windows PowerShell:
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Eliminar package-lock.json
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Reinstalar
npm install
```

## Método 2: Instalar con timeout aumentado

```bash
npm install --timeout=60000
```

## Método 3: Instalar paquetes uno por uno

```bash
npm install aedes --save
npm install aedes-persistence --save
npm install ws --save
npm install dotenv --save
```

## Método 4: Usar yarn (alternativa más rápida)

```bash
# Instalar yarn si no lo tienes
npm install -g yarn

# Usar yarn en lugar de npm
yarn install
```
