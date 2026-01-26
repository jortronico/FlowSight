-- ============================================
-- Script para agregar campos de Tamper y Sirena State
-- Ejecutar este script para agregar los campos necesarios
-- ============================================

USE flowsight_db;

-- Agregar campos de tamper y sirena_state a la tabla home_alarm
ALTER TABLE home_alarm 
ADD COLUMN IF NOT EXISTS tamper_triggered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tamper_state TINYINT DEFAULT 0 COMMENT '0=OFF, 1=ON',
ADD COLUMN IF NOT EXISTS siren_state TINYINT DEFAULT 0 COMMENT '0=OFF, 1=ON';

-- Agregar índices para mejor rendimiento
ALTER TABLE home_alarm 
ADD INDEX IF NOT EXISTS idx_tamper (tamper_triggered),
ADD INDEX IF NOT EXISTS idx_siren_state (siren_state);

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
