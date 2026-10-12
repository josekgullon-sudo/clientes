-- Valores nuevos del enum. Van en su propia migración: Postgres no deja usar
-- un valor de enum en la misma transacción en la que se crea.

alter type modo_test add value if not exists 'leccion';
alter type modo_test add value if not exists 'repaso';
alter type modo_test add value if not exists 'salto';
