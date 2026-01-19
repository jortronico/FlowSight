# Instalación de Tablas de Alarma de Hogar

## Problema
Si ves el error `Table 'flowsight_db.home_alarm' doesn't exist`, necesitas ejecutar el script SQL para crear las tablas.

## Solución Rápida

### Opción 1: Ejecutar script completo (si es primera vez)
```bash
mysql -u root -p flowsight_db < database/init.sql
```

### Opción 2: Solo agregar tablas de alarma de hogar (recomendado si ya tienes la BD)
```bash
mysql -u root -p flowsight_db < database/add_home_alarm_tables.sql
```

### Opción 3: Desde MySQL Workbench o línea de comandos
1. Conecta a MySQL
2. Selecciona la base de datos: `USE flowsight_db;`
3. Copia y pega el contenido de `database/add_home_alarm_tables.sql`
4. Ejecuta el script

## Verificar que las tablas se crearon

```sql
USE flowsight_db;
SHOW TABLES LIKE 'home_alarm%';
```

Deberías ver:
- `home_alarm`
- `home_alarm_sensors`
- `home_alarm_schedules`
- `home_alarm_history`

## Verificar datos iniciales

```sql
SELECT * FROM home_alarm;
SELECT * FROM home_alarm_sensors;
```
