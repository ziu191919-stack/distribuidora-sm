import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_TSE = `${API_BASE}/tse`;

function DemoTSE() {
  const navigate = useNavigate();
  const [cedula, setCedula] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  const consultar = async () => {
    const cedulaLimpia = cedula.trim();
    if (!cedulaLimpia) {
      setError("Ingresá un número de cédula.");
      return;
    }
    setConsultando(true);
    setError("");
    setResultado(null);
    try {
      const r = await fetch(`${API_TSE}/consulta-cedula/${cedulaLimpia}`);
      const d = await r.json();
      setResultado(d);
    } catch {
      setError("No se pudo conectar con el servicio del TSE.");
    }
    setConsultando(false);
  };

  return (
    <>
      <Navbar />
      <div className="container py-4" style={{ maxWidth: "600px" }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="btn-volver" onClick={() => navigate("/")}>
            <i className="bi bi-arrow-left"></i> Inicio
          </button>
          <h1 className="fw-bold mb-0" style={{ fontSize: "1.5rem", color: "#1a3a2a" }}>
            <i className="bi bi-person-vcard-fill me-2"></i>Demo — Consulta TSE
          </h1>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "16px" }}>
          <div className="card-header text-white fw-semibold"
            style={{ background: "#1a3a2a", borderRadius: "16px 16px 0 0" }}>
            <i className="bi bi-info-circle-fill me-2"></i>
            Simulación del servicio del Tribunal Supremo de Elecciones
          </div>
          <div className="card-body">
            <p className="text-muted small mb-3">
              Ingresá un número de cédula real de Costa Rica (sin guiones). Si existe en el
              padrón, se autocompletan los datos. Si no existe, se indica que debe ingresarse
              manualmente — así funciona en el formulario de registro real.
            </p>

            <label className="form-label fw-semibold">Número de cédula</label>
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Ej: 101053316"
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && consultar()}
                disabled={consultando}
              />
              <button className="btn btn-success" onClick={consultar} disabled={consultando}>
                {consultando
                  ? <span className="spinner-border spinner-border-sm"></span>
                  : <><i className="bi bi-search me-1"></i>Consultar</>}
              </button>
            </div>

            {error && (
              <div className="alert alert-danger py-2">
                <i className="bi bi-x-circle me-2"></i>{error}
              </div>
            )}

            {resultado && resultado.encontrada && (
              <div className="alert alert-success">
                <div className="fw-bold mb-2">
                  <i className="bi bi-check-circle-fill me-2"></i>Cédula encontrada
                </div>
                <div className="row g-2">
                  <div className="col-6"><small className="text-muted d-block">Nombre</small>{resultado.persona.nombre}</div>
                  <div className="col-6"><small className="text-muted d-block">1er Apellido</small>{resultado.persona.primer_apellido}</div>
                  <div className="col-6"><small className="text-muted d-block">2do Apellido</small>{resultado.persona.segundo_apellido}</div>
                  <div className="col-6"><small className="text-muted d-block">Código electoral</small>{resultado.persona.codigo_electoral}</div>
                  <div className="col-6"><small className="text-muted d-block">Junta</small>{resultado.persona.junta}</div>
                  <div className="col-6"><small className="text-muted d-block">Vence cédula</small>{resultado.persona.fecha_caducidad_cedula}</div>
                </div>
              </div>
            )}

            {resultado && !resultado.encontrada && (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {resultado.mensaje}
              </div>
            )}
          </div>
        </div>

        <p className="text-muted text-center small">
          Este servicio consulta el padrón real del TSE (3.7M+ registros), descargado de
          <a href="https://www.tse.go.cr" target="_blank" rel="noreferrer"> tse.go.cr</a>,
          e importado a una base de datos independiente que simula el web service oficial.
        </p>
      </div>
    </>
  );
}

export default DemoTSE;