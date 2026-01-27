-- ============================================
-- Script para agregar campos de Tamper y Sirena State
-- Ejecutar este script para agregar los campos necesarios
-- ============================================

USE flowsight_db;

-- Agregar campos de tamper y sirena_state a la tabla home_alarm
-- Nota: Si las columnas ya existen, estos comandos darán error pero no afectarán el funcionamiento

-- Agregar tamper_triggered
ALTER TABLE home_alarm 
ADD COLUMN tamper_triggered BOOLEAN DEFAULT FALSE;

-- Agregar tamper_state
ALTER TABLE home_alarm 
ADD COLUMN tamper_state TINYINT DEFAULT 0 COMMENT '0=OFF, 1=ON';

-- Agregar siren_state
ALTER TABLE home_alarm 
ADD COLUMN siren_state TINYINT DEFAULT 0 COMMENT '0=OFF, 1=ON';

-- Agregar índices para mejor rendimiento
-- (Si ya existen, darán error pero no afectará el funcionamiento)
ALTER TABLE home_alarm 
ADD INDEX idx_tamper (tamper_triggered);

ALTER TABLE home_alarm 
ADD INDEX idx_siren_state (siren_state);

-- Actualizar evento tipo en historial para incluir tamper
ALTER TABLE home_alarm_history 
MODIFY COLUMN event_type ENUM(
  'armed', 
  'disarmed', 
  'triggered', 
  'sensor_triggered', 
  'siren_on', 
  'siren_off', 
  'schedule_executed',
  'tamper_activated',
  'tamper_restored'
) NOT NULL;
