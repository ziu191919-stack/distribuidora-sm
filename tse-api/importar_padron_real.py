"""
importar_padron_real.py
Importa el PADRON_COMPLETO.txt real, descargado directamente del sitio
oficial del TSE (https://www.tse.go.cr), a la base de datos SQLite
que consulta la API simulada.

Formato del archivo (segun Leame.txt del propio TSE), separado por comas
con cada campo relleno de espacios hasta su ancho fijo:

    CEDULA (9), CODELEC (6), FECHACADUC (8), JUNTA (5),
    NOMBRE (30), 1.APELLIDO (26), 2.APELLIDO (26)

Ejecutar UNA SOLA VEZ (tarda menos de un minuto):
    python importar_padron_real.py

Requisitos:
    - Tener PADRON_COMPLETO.txt en la misma carpeta que este script
      (el archivo que descargaste del TSE, ya descomprimido del zip)
"""

import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).parent / "tse.db"
ARCHIVO_PADRON = Path(__file__).parent / "PADRON_COMPLETO.txt"
TAMANO_LOTE = 50_000


def crear_tabla(conn):
    conn.execute("DROP TABLE IF EXISTS personas")
    conn.execute(
        """
        CREATE TABLE personas (
            cedula TEXT PRIMARY KEY,
            codigo_electoral TEXT,
            fecha_caducidad_cedula TEXT,
            junta TEXT,
            nombre TEXT NOT NULL,
            primer_apellido TEXT NOT NULL,
            segundo_apellido TEXT NOT NULL
        )
        """
    )
    conn.commit()


def parsear_linea(linea: str):
    """
    Cada linea viene separada por comas, con los campos de texto
    rellenos de espacios hasta su ancho fijo. Solo hace falta separar
    por coma y quitar los espacios sobrantes (strip).
    """
    campos = linea.rstrip("\r\n").split(",")
    if len(campos) != 7:
        return None  # linea con formato inesperado, se ignora

    cedula, codelec, fechacaduc, junta, nombre, apellido1, apellido2 = campos
    return (
        cedula.strip(),
        codelec.strip(),
        fechacaduc.strip(),
        junta.strip(),
        nombre.strip(),
        apellido1.strip(),
        apellido2.strip(),
    )


def importar():
    if not ARCHIVO_PADRON.exists():
        print(f"ERROR: no encuentro '{ARCHIVO_PADRON.name}' en esta carpeta.")
        print("Descomprimí el zip del TSE aquí y volvé a correr el script.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA synchronous = OFF")
    conn.execute("PRAGMA journal_mode = MEMORY")

    crear_tabla(conn)

    inicio = time.time()
    lote = []
    total_insertados = 0
    lineas_ignoradas = 0

    # Se lee el archivo linea por linea (streaming), NUNCA cargando
    # los 442 MB completos en memoria de una sola vez.
    with open(ARCHIVO_PADRON, "r", encoding="latin-1") as archivo:
        for linea in archivo:
            fila = parsear_linea(linea)
            if fila is None:
                lineas_ignoradas += 1
                continue

            lote.append(fila)

            if len(lote) >= TAMANO_LOTE:
                conn.executemany(
                    """INSERT OR IGNORE INTO personas
                       (cedula, codigo_electoral, fecha_caducidad_cedula, junta,
                        nombre, primer_apellido, segundo_apellido)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    lote,
                )
                conn.commit()
                total_insertados += len(lote)
                lote.clear()
                transcurrido = time.time() - inicio
                print(f"  {total_insertados:,} registros importados... ({transcurrido:.1f}s)")

    if lote:
        conn.executemany(
            """INSERT OR IGNORE INTO personas
               (cedula, codigo_electoral, fecha_caducidad_cedula, junta,
                nombre, primer_apellido, segundo_apellido)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            lote,
        )
        conn.commit()
        total_insertados += len(lote)

    conn.execute("CREATE INDEX IF NOT EXISTS idx_cedula ON personas(cedula)")
    conn.commit()

    total_transcurrido = time.time() - inicio
    print(f"\nListo: {total_insertados:,} personas importadas en {total_transcurrido:.1f} segundos.")
    if lineas_ignoradas:
        print(f"({lineas_ignoradas} líneas con formato inesperado fueron ignoradas)")

    conn.close()


if __name__ == "__main__":
    importar()