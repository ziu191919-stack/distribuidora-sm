"""
TSE API (simulado)
Simula el servicio del Tribunal Supremo de Elecciones de Costa Rica:
consulta una cedula y, si existe, devuelve nombre y apellidos.
Si no existe, el frontend debe permitir el ingreso manual de esos datos.

Ejecutar:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8009

Documentacion Swagger: http://localhost:8009/docs
"""

import sqlite3
from contextlib import closing
from pathlib import Path

from fastapi import FastAPI, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from pydantic import BaseModel

DB_PATH = Path(__file__).parent / "tse.db"
API_KEY = "tse-2026-secret"

app = FastAPI(
    title="TSE API (simulado)",
    description="Simulacion del Tribunal Supremo de Elecciones - consulta de cedula",
    version="1.0.0",
)

api_key_header = APIKeyHeader(name="X-API-Key")


def verificar_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key invalida o no proporcionada",
        )
    return api_key


class Persona(BaseModel):
    cedula: str
    nombre: str
    primer_apellido: str
    segundo_apellido: str
    codigo_electoral: str
    fecha_caducidad_cedula: str
    junta: str


class ConsultaCedulaResponse(BaseModel):
    encontrada: bool
    persona: Persona | None = None
    mensaje: str


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def inicializar_tabla():
    """
    Solo crea la tabla si no existe. La poblacion de datos (incluyendo
    el padron sintetico de ~5 millones de registros) se hace una sola
    vez con el script aparte: generar_padron.py
    """
    with closing(get_db()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS personas (
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


inicializar_tabla()


@app.get("/", tags=["Info"])
def info():
    return {"servicio": "TSE API (simulado)", "estado": "activo"}


@app.get(
    "/consulta-cedula/{cedula}",
    response_model=ConsultaCedulaResponse,
    tags=["Consulta"],
)
def consultar_cedula(cedula: str, api_key: str = Security(verificar_api_key)):
    """
    Consulta una cedula. Si existe, devuelve nombre y apellidos para
    autocompletar el formulario. Si no existe, indica que debe
    ingresarse manualmente (no lanza error 404, porque el flujo normal
    de la app es permitir el registro manual en ese caso).
    """
    with closing(get_db()) as conn:
        fila = conn.execute(
            "SELECT * FROM personas WHERE cedula = ?", (cedula,)
        ).fetchone()

        if fila is None:
            return ConsultaCedulaResponse(
                encontrada=False,
                persona=None,
                mensaje="Cédula no encontrada en el padrón. Ingrese los datos manualmente.",
            )

        return ConsultaCedulaResponse(
            encontrada=True,
            persona=Persona(**dict(fila)),
            mensaje="Cédula encontrada. Datos autocompletados.",
        )