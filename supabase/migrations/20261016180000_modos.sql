-- Nuevos modos del test de nivel y del test de hoy.
-- Hay que ejecutar ESTE archivo y confirmarlo antes del siguiente
-- (20261016180000_retencion.sql): Postgres no deja usar un valor de enum
-- en la misma transacción en la que se crea.

alter type modo_test add value if not exists 'nivel';
alter type modo_test add value if not exists 'hoy';
