BEGIN;

CREATE TABLE IF NOT EXISTS adjuntos_examen (
    id_examenesaux integer PRIMARY KEY REFERENCES examenes_auxiliares(id_examenesaux) ON DELETE CASCADE,
    nombre varchar(255) NOT NULL UNIQUE,
    contenido bytea NOT NULL
);

CREATE TABLE IF NOT EXISTS intentos_login (
    dni_hash char(64) PRIMARY KEY,
    intentos smallint NOT NULL,
    actualizado timestamp with time zone NOT NULL,
    bloqueado_hasta timestamp with time zone
);

-- Inicio de sesión por correo electrónico
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email varchar(254);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email ON usuarios (lower(email));

COMMIT;
