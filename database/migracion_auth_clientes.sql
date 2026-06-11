-- Migración: Agregar autenticación a clientes
-- Ejecutar este script en tu base de datos distribuidora_sm

ALTER TABLE clientes
  ADD COLUMN cedula VARCHAR(20) NULL UNIQUE AFTER nombre,
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER cedula;

-- Nota: La columna telefono deja de ser UNIQUE.
-- Si tienes el constraint UNIQUE en telefono, puedes quitarlo así:
-- ALTER TABLE clientes DROP INDEX telefono;
