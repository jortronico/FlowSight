-- ============================================
-- Tabla para comandos pendientes a dispositivos
-- ============================================

USE flowsight_db;

CREATE TABLE IF NOT EXISTS device_commands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(100) NOT NULL,
    command VARCHAR(50) NOT NULL,
    value TEXT,
    status ENUM('pending', 'sent', 'executed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    executed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    metadata JSON,
    INDEX idx_device (device_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;
