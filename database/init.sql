-- ============================================
-- FlowSight Database Schema
-- Sistema IoT para control de alarmas y válvulas
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS flowsight_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE flowsight_db;

-- ============================================
-- Tabla de Usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'operator', 'viewer') DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ============================================
-- Tabla de Dispositivos
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type ENUM('controller', 'sensor', 'actuator', 'gateway') NOT NULL,
    location VARCHAR(255),
    description TEXT,
    firmware_version VARCHAR(50),
    status ENUM('online', 'offline', 'error', 'maintenance') DEFAULT 'offline',
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_serial (serial_number),
    INDEX idx_status (status),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- ============================================
-- Tabla de Alarmas
-- ============================================
CREATE TABLE IF NOT EXISTS alarms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id INT,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('active', 'acknowledged', 'resolved') DEFAULT 'active',
    value DECIMAL(10, 2),
    threshold DECIMAL(10, 2),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by INT NULL,
    acknowledged_at TIMESTAMP NULL,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_device (device_id),
    INDEX idx_triggered (triggered_at)
) ENGINE=InnoDB;

-- ============================================
-- Tabla de Válvulas
-- ============================================
CREATE TABLE IF NOT EXISTS valves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type ENUM('on_off', 'proportional', 'modulating') DEFAULT 'on_off',
    status ENUM('open', 'closed', 'partial', 'error', 'unknown') DEFAULT 'closed',
    current_position DECIMAL(5, 2) DEFAULT 0,
    target_position DECIMAL(5, 2) DEFAULT 0,
    min_position DECIMAL(5, 2) DEFAULT 0,
    max_position DECIMAL(5, 2) DEFAULT 100,
    last_commanded_by INT NULL,
    last_commanded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (last_commanded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_device (device_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================
-- Historial de Válvulas
-- ============================================
CREATE TABLE IF NOT EXISTS valve_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    valve_id INT NOT NULL,
    position DECIMAL(5, 2) NOT NULL,
    commanded_by INT,
    commanded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (valve_id) REFERENCES valves(id) ON DELETE CASCADE,
    FOREIGN KEY (commanded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_valve (valve_id),
    INDEX idx_commanded_at (commanded_at)
) ENGINE=InnoDB;

-- ============================================
-- Tabla de Telemetría (para datos históricos)
-- ============================================
CREATE TABLE IF NOT EXISTS telemetry (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    device_id INT NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_device_metric (device_id, metric_name),
    INDEX idx_recorded (recorded_at)
) ENGINE=InnoDB;

-- ============================================
-- Tabla de Logs de Sistema
-- ============================================
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    level ENUM('debug', 'info', 'warning', 'error', 'critical') DEFAULT 'info',
    source VARCHAR(100),
    message TEXT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_level (level),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- Tabla de Configuración del Sistema
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (config_key)
) ENGINE=InnoDB;

-- ============================================
-- Tabla de Alarma de Hogar
-- ============================================
CREATE TABLE IF NOT EXISTS home_alarm (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL DEFAULT 'Alarma Principal',
    status ENUM('armed', 'disarmed', 'triggered', 'arming', 'disarming') DEFAULT 'disarmed',
    siren_status ENUM('off', 'on', 'manual') DEFAULT 'off',
    last_armed_by INT NULL,
    last_armed_at TIMESTAMP NULL,
    last_disarmed_by INT NULL,
    last_disarmed_at TIMESTAMP NULL,
    triggered_at TIMESTAMP NULL,
    auto_arm_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (last_armed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (last_disarmed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================
-- Tabla de Sensores de Alarma de Hogar
-- ============================================
CREATE TABLE IF NOT EXISTS home_alarm_sensors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alarm_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    sensor_type ENUM('motion', 'door', 'window', 'stair', 'other') NOT NULL,
    location VARCHAR(255),
    is_enabled BOOLEAN DEFAULT TRUE,
    is_triggered BOOLEAN DEFAULT FALSE,
    last_triggered_at TIMESTAMP NULL,
    last_seen TIMESTAMP NULL,
    battery_level INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (alarm_id) REFERENCES home_alarm(id) ON DELETE CASCADE,
    INDEX idx_alarm (alarm_id),
    INDEX idx_enabled (is_enabled),
    INDEX idx_triggered (is_triggered)
) ENGINE=InnoDB;

-- ============================================
-- Tabla de Horarios Automáticos de Alarma
-- ============================================
CREATE TABLE IF NOT EXISTS home_alarm_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alarm_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    action ENUM('arm', 'disarm') NOT NULL,
    days_of_week VARCHAR(20) NOT NULL COMMENT '1=Monday, 7=Sunday, ejemplo: "1,2,3,4,5" para lunes-viernes',
    time TIME NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    last_executed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (alarm_id) REFERENCES home_alarm(id) ON DELETE CASCADE,
    INDEX idx_alarm (alarm_id),
    INDEX idx_enabled (is_enabled),
    INDEX idx_time (time)
) ENGINE=InnoDB;

-- ============================================
-- Historial de Eventos de Alarma de Hogar
-- ============================================
CREATE TABLE IF NOT EXISTS home_alarm_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    alarm_id INT NOT NULL,
    event_type ENUM('armed', 'disarmed', 'triggered', 'sensor_triggered', 'siren_on', 'siren_off', 'schedule_executed') NOT NULL,
    sensor_id INT NULL,
    user_id INT NULL,
    message TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alarm_id) REFERENCES home_alarm(id) ON DELETE CASCADE,
    FOREIGN KEY (sensor_id) REFERENCES home_alarm_sensors(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_alarm (alarm_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- Datos iniciales
-- ============================================

-- Usuario administrador por defecto (password: admin123)
INSERT INTO users (email, password, name, role, is_active) VALUES 
('admin@flowsight.com', '$2a$10$rQnM8r6DPL9Xj.5HfT8Xh.Yd4VwWFZ5h8mQVK9gvFYd9W2gX6Kqmi', 'Administrador', 'admin', TRUE),
('operator@flowsight.com', '$2a$10$rQnM8r6DPL9Xj.5HfT8Xh.Yd4VwWFZ5h8mQVK9gvFYd9W2gX6Kqmi', 'Operador', 'operator', TRUE);

-- Configuraciones iniciales
INSERT INTO system_config (config_key, config_value, description) VALUES
('alarm_sound_enabled', 'true', 'Habilitar sonido de alarmas'),
('alarm_email_notifications', 'true', 'Enviar notificaciones por email'),
('device_offline_threshold', '300', 'Segundos para considerar dispositivo offline'),
('telemetry_retention_days', '90', 'Días de retención de telemetría');

-- Dispositivos de ejemplo
INSERT INTO devices (serial_number, name, type, location, description, status) VALUES
('DEV-001', 'Controlador Principal', 'controller', 'Sala de Control', 'Controlador principal del sistema', 'online'),
('DEV-002', 'Gateway IoT Norte', 'gateway', 'Edificio Norte', 'Gateway para sensores del edificio norte', 'online'),
('DEV-003', 'Sensor de Presión 1', 'sensor', 'Tubería Principal', 'Sensor de presión línea principal', 'online');

-- Válvulas de ejemplo
INSERT INTO valves (device_id, name, description, type, status, current_position) VALUES
(1, 'Válvula Principal', 'Válvula de control principal del sistema', 'proportional', 'closed', 0),
(1, 'Válvula de Bypass', 'Válvula de bypass para mantenimiento', 'on_off', 'closed', 0),
(2, 'Válvula Norte-1', 'Control de flujo edificio norte', 'modulating', 'partial', 45);

-- Alarmas de ejemplo
INSERT INTO alarms (device_id, type, message, priority, status, value, threshold) VALUES
(3, 'high_pressure', 'Presión alta detectada en línea principal', 'high', 'active', 8.5, 8.0),
(1, 'communication', 'Pérdida momentánea de comunicación', 'low', 'resolved', NULL, NULL);

-- Alarma de Hogar inicial
INSERT INTO home_alarm (name, status, siren_status, auto_arm_enabled) VALUES
('Alarma Principal', 'disarmed', 'off', FALSE);

-- Sensores de Alarma de Hogar
INSERT INTO home_alarm_sensors (alarm_id, name, sensor_type, location, is_enabled) VALUES
(1, 'Sensor de Escalera', 'stair', 'Escalera Principal', TRUE),
(1, 'Sensor de Detección Humana 1', 'motion', 'Sala Principal', TRUE);

DELIMITER //

-- ============================================
-- Procedimiento para limpiar telemetría antigua
-- ============================================
CREATE PROCEDURE IF NOT EXISTS cleanup_old_telemetry()
BEGIN
    DECLARE retention_days INT DEFAULT 90;
    
    SELECT CAST(config_value AS UNSIGNED) INTO retention_days 
    FROM system_config 
    WHERE config_key = 'telemetry_retention_days';
    
    DELETE FROM telemetry 
    WHERE recorded_at < DATE_SUB(NOW(), INTERVAL retention_days DAY);
    
    INSERT INTO system_logs (level, source, message) 
    VALUES ('info', 'cleanup_job', CONCAT('Telemetría anterior a ', retention_days, ' días eliminada'));
END //

-- ============================================
-- Procedimiento para marcar dispositivos offline
-- ============================================
CREATE PROCEDURE IF NOT EXISTS check_offline_devices()
BEGIN
    DECLARE threshold_seconds INT DEFAULT 300;
    
    SELECT CAST(config_value AS UNSIGNED) INTO threshold_seconds 
    FROM system_config 
    WHERE config_key = 'device_offline_threshold';
    
    UPDATE devices 
    SET status = 'offline' 
    WHERE status = 'online' 
    AND last_seen < DATE_SUB(NOW(), INTERVAL threshold_seconds SECOND);
END //

DELIMITER ;

-- ============================================
-- Eventos programados
-- ============================================
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS evt_cleanup_telemetry
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL cleanup_old_telemetry();

CREATE EVENT IF NOT EXISTS evt_check_offline
ON SCHEDULE EVERY 1 MINUTE
DO CALL check_offline_devices();

