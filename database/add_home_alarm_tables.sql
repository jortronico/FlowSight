-- ============================================
-- Script para agregar tablas de Alarma de Hogar
-- Ejecutar este script si ya tienes la base de datos creada
-- ============================================

USE flowsight_db;

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

-- Alarma de Hogar inicial
INSERT INTO home_alarm (name, status, siren_status, auto_arm_enabled) VALUES
('Alarma Principal', 'disarmed', 'off', FALSE)
ON DUPLICATE KEY UPDATE name = name;

-- Sensores de Alarma de Hogar
INSERT INTO home_alarm_sensors (alarm_id, name, sensor_type, location, is_enabled) VALUES
(1, 'Sensor de Escalera', 'stair', 'Escalera Principal', TRUE),
(1, 'Sensor de Detección Humana 1', 'motion', 'Sala Principal', TRUE)
ON DUPLICATE KEY UPDATE name = name;
