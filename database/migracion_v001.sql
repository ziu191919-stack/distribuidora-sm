-- ============================================================
-- MIGRACIÓN v0.0.1 — Distribuidora S.M
-- Ejecutar en phpMyAdmin sobre distribuidora_sm
-- ============================================================

USE distribuidora_sm;

-- Tabla para tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `cliente_id` int(10) UNSIGNED NOT NULL,
  `token` varchar(128) NOT NULL,
  `expira_en` datetime NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cliente` (`cliente_id`),
  KEY `fk_reset_cliente` (`cliente_id`),
  CONSTRAINT `fk_reset_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Verificación
SELECT 'Tabla password_reset_tokens creada correctamente' AS resultado;
DESCRIBE password_reset_tokens;
