-- 001_init.sql — esquema inicial.
--
-- Cubre las cuatro fases desde el principio (ver CLAUDE.md): solo se usan
-- tiendas / auditorias / auditoria_fuentes / hallazgos / evidencias en Fase 1,
-- pero el resto queda definido para no migrar después.
--
-- Convenciones:
--   - Timestamps: texto ISO-8601 UTC con sufijo Z.
--   - Booleanos: INTEGER 0/1.
--   - Campos con conjunto cerrado de valores: CHECK, no tablas de catálogo.
--   - JSON: texto plano en columnas marcadas como _json.

-- ---------------------------------------------------------------------------
-- Tiendas
-- ---------------------------------------------------------------------------

CREATE TABLE tiendas (
  id                   INTEGER PRIMARY KEY,
  -- Clave de deduplicación: minúsculas, sin protocolo, sin "www.", sin barra final.
  dominio              TEXT NOT NULL UNIQUE,
  url_inicio           TEXT NOT NULL,
  nombre               TEXT,
  plataforma           TEXT NOT NULL DEFAULT 'no_determinado'
                         CHECK (plataforma IN ('shopify','woocommerce','prestashop','magento','bigcommerce','wix','squarespace','otra','no_determinado')),
  plataforma_confianza TEXT NOT NULL DEFAULT 'no_determinado'
                         CHECK (plataforma_confianza IN ('alta','media','baja','no_determinado')),
  pais                 TEXT,
  idioma               TEXT,
  creado_en            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actualizado_en       TEXT
);

-- Señales de descubrimiento (Fase 2). Clave/valor a propósito: todavía no sé
-- qué señales van a servir, y no quiero congelar columnas por adelantado.
CREATE TABLE senales (
  id          INTEGER PRIMARY KEY,
  tienda_id   INTEGER NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  clave       TEXT NOT NULL,          -- p.ej. 'productos_total', 'meta_ads_activos'
  valor       TEXT,
  fuente      TEXT NOT NULL,          -- p.ej. 'products_json', 'meta_ads_library'
  obtenido_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (tienda_id, clave, fuente)
);

-- ---------------------------------------------------------------------------
-- Auditorías (Fase 1)
-- ---------------------------------------------------------------------------

CREATE TABLE auditorias (
  id              INTEGER PRIMARY KEY,
  tienda_id       INTEGER NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  url_auditada    TEXT NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'en_curso'
                    CHECK (estado IN ('en_curso','completada','fallida')),
  -- Versión del auditor que produjo esta auditoría. Sin esto no se puede
  -- comparar una auditoría vieja con una nueva al recalibrar.
  version_auditor TEXT NOT NULL,
  user_agent      TEXT,
  dir_salida      TEXT,               -- relativo a la raíz de salidas
  informe_ruta    TEXT,               -- relativo a dir_salida
  iniciada_en     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  finalizada_en   TEXT,
  error           TEXT,
  notas           TEXT
);

CREATE INDEX idx_auditorias_tienda ON auditorias(tienda_id, iniciada_en DESC);

-- Estado por fuente externa. Es lo que permite degradar con elegancia: si PSI
-- o Anthropic fallan, la auditoría sigue y el informe puede decir qué falta y
-- por qué, en vez de callarse.
CREATE TABLE auditoria_fuentes (
  id           INTEGER PRIMARY KEY,
  auditoria_id INTEGER NOT NULL REFERENCES auditorias(id) ON DELETE CASCADE,
  fuente       TEXT NOT NULL
                 CHECK (fuente IN ('robots','playwright','axe','psi','anthropic')),
  estado       TEXT NOT NULL
                 CHECK (estado IN ('ok','degradada','fallida','omitida')),
  error        TEXT,
  duracion_ms  INTEGER,
  registrado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (auditoria_id, fuente),
  -- Si algo no fue bien, quiero saber qué pasó.
  CHECK (estado = 'ok' OR error IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- Hallazgos
-- ---------------------------------------------------------------------------

CREATE TABLE hallazgos (
  id                    INTEGER PRIMARY KEY,
  auditoria_id          INTEGER NOT NULL REFERENCES auditorias(id) ON DELETE CASCADE,

  -- El catálogo de checks vive en código (versionado en git), no en una tabla.
  -- Aquí se guarda solo la referencia, para poder releer un informe viejo
  -- sabiendo con qué versión de la regla se generó.
  check_id              TEXT NOT NULL,
  check_version         TEXT NOT NULL,

  categoria             TEXT NOT NULL
                          CHECK (categoria IN ('ux','ui','conversion','rendimiento','accesibilidad','confianza')),

  -- 'no_determinado' es de primera clase: un check que no pudo concluir NO es
  -- lo mismo que un check que concluyó que no hay problema.
  estado                TEXT NOT NULL
                          CHECK (estado IN ('detectado','descartado','no_determinado')),
  motivo_no_determinado TEXT,

  confianza             TEXT NOT NULL
                          CHECK (confianza IN ('alta','media','baja')),
  origen                TEXT NOT NULL
                          CHECK (origen IN ('heuristica','axe','psi','llm','manual')),
  severidad             TEXT
                          CHECK (severidad IS NULL OR severidad IN ('alta','media','baja')),

  titulo                TEXT NOT NULL,
  detalle               TEXT,
  recomendacion         TEXT,
  valor_medido_json     TEXT,
  url                   TEXT,
  viewport              TEXT
                          CHECK (viewport IS NULL OR viewport IN ('movil','escritorio')),

  -- Puerta contra falsos positivos delante de un cliente. Un hallazgo solo
  -- puede marcarse publicable si está detectado y con confianza alta o media.
  publicable            INTEGER NOT NULL DEFAULT 0
                          CHECK (publicable IN (0,1)),

  creado_en             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (estado <> 'no_determinado' OR motivo_no_determinado IS NOT NULL),
  CHECK (publicable = 0 OR (estado = 'detectado' AND confianza IN ('alta','media')))
);

CREATE INDEX idx_hallazgos_auditoria ON hallazgos(auditoria_id, categoria, estado);
CREATE INDEX idx_hallazgos_check     ON hallazgos(check_id);

CREATE TABLE evidencias (
  id          INTEGER PRIMARY KEY,
  hallazgo_id INTEGER NOT NULL REFERENCES hallazgos(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL
                CHECK (tipo IN ('captura','recorte','anotacion','html','metrica')),
  ruta        TEXT,          -- relativa a auditorias.dir_salida
  selector    TEXT,          -- selector CSS del elemento señalado, si lo hay
  caja_json   TEXT,          -- {"x":…, "y":…, "ancho":…, "alto":…} en px CSS
  viewport    TEXT
                CHECK (viewport IS NULL OR viewport IN ('movil','escritorio')),
  nota        TEXT,
  orden       INTEGER NOT NULL DEFAULT 0,
  creado_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  -- Una evidencia sin fichero ni valor no es evidencia.
  CHECK (ruta IS NOT NULL OR nota IS NOT NULL)
);

CREATE INDEX idx_evidencias_hallazgo ON evidencias(hallazgo_id, orden);

-- ---------------------------------------------------------------------------
-- Contactos (Fase 3)
--
-- Las restricciones legales de CLAUDE.md se codifican aquí, no solo en la
-- capa de aplicación: buzón corporativo o no se contacta, y fuente + fecha
-- de obtención siempre registradas (trazabilidad LSSI).
-- ---------------------------------------------------------------------------

CREATE TABLE contactos (
  id            INTEGER PRIMARY KEY,
  tienda_id     INTEGER NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,          -- minúsculas
  tipo          TEXT NOT NULL
                  CHECK (tipo IN ('generico','nominal','no_determinado')),
  fuente_url    TEXT NOT NULL,
  fuente_tipo   TEXT NOT NULL
                  CHECK (fuente_tipo IN ('aviso_legal','pagina_contacto','pie_pagina','otra')),
  obtenido_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  apto_contacto INTEGER NOT NULL DEFAULT 0
                  CHECK (apto_contacto IN (0,1)),
  notas         TEXT,
  UNIQUE (tienda_id, email),
  -- Nominal o dudoso => nunca contactable. Es dato personal.
  CHECK (apto_contacto = 0 OR tipo = 'generico')
);

CREATE INDEX idx_contactos_email ON contactos(email);

-- Lista de supresión: permanente y de aplicación inmediata. No se borra nunca
-- de esta tabla; una baja retirada seguiría siendo una baja.
CREATE TABLE supresiones (
  id        INTEGER PRIMARY KEY,
  valor     TEXT NOT NULL UNIQUE,       -- email completo o dominio, minúsculas
  ambito    TEXT NOT NULL CHECK (ambito IN ('email','dominio')),
  motivo    TEXT NOT NULL CHECK (motivo IN ('baja','queja','rebote_duro','manual')),
  origen    TEXT,                       -- de dónde salió la baja
  creado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------------------------------------------------------------
-- Envíos y respuestas (Fase 3)
--
-- El envío lo hace un proveedor externo (Instantly / Smartlead). Aquí solo se
-- registra qué se mandó, a quién, con qué auditoría detrás y qué contestaron.
-- ---------------------------------------------------------------------------

CREATE TABLE envios (
  id                   INTEGER PRIMARY KEY,
  contacto_id          INTEGER NOT NULL REFERENCES contactos(id) ON DELETE RESTRICT,
  auditoria_id         INTEGER REFERENCES auditorias(id) ON DELETE SET NULL,
  proveedor            TEXT NOT NULL CHECK (proveedor IN ('instantly','smartlead')),
  proveedor_campana_id TEXT,
  proveedor_mensaje_id TEXT,
  asunto               TEXT NOT NULL,
  cuerpo               TEXT NOT NULL,
  revisado_por_humano  INTEGER NOT NULL DEFAULT 0
                         CHECK (revisado_por_humano IN (0,1)),
  estado               TEXT NOT NULL DEFAULT 'borrador'
                         CHECK (estado IN ('borrador','aprobado','enviado','rebotado','fallido')),
  creado_en            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  enviado_en           TEXT,
  error                TEXT,
  -- Nada sale sin que yo lo haya leído. Si esto estorba dentro de 500 emails,
  -- se relaja entonces, no antes.
  CHECK (estado IN ('borrador','fallido') OR revisado_por_humano = 1)
);

CREATE INDEX idx_envios_contacto ON envios(contacto_id, creado_en DESC);

CREATE TABLE respuestas (
  id                      INTEGER PRIMARY KEY,
  envio_id                INTEGER NOT NULL REFERENCES envios(id) ON DELETE CASCADE,
  recibido_en             TEXT NOT NULL,
  remitente               TEXT,
  cuerpo                  TEXT,
  clasificacion           TEXT NOT NULL DEFAULT 'no_determinado'
                            CHECK (clasificacion IN ('interesado','no_interesado','baja','fuera_oficina','rebote','otro','no_determinado')),
  clasificacion_confianza TEXT
                            CHECK (clasificacion_confianza IS NULL OR clasificacion_confianza IN ('alta','media','baja')),
  revisado_por_humano     INTEGER NOT NULL DEFAULT 0
                            CHECK (revisado_por_humano IN (0,1)),
  creado_en               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_respuestas_envio ON respuestas(envio_id);
