import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API = `${API_BASE}/auth/clientes`;
const API_TSE = `${API_BASE}/tse`;

const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const REGEX_USUARIO  = /^[a-zA-Z0-9._]{3,30}$/;

function CheckItem({ ok, texto }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem",
      color: ok ? "#2d6a4f" : "#6c757d", marginBottom: "2px" }}>
      <i className={`bi bi-${ok ? "check-circle-fill" : "x-circle"}`}
        style={{ color: ok ? "#40916c" : "#adb5bd", fontSize: "0.9rem" }}></i>
      {texto}
    </div>
  );
}

function Registro() {
  const navigate = useNavigate();

  // Paso: 1=política, 2=correo+token, 3=formulario, 4=éxito
  // TEMPORAL: puesto en 3 para saltar la verificación de correo (mientras se arregla el envío de emails con Brevo).
  // RECORDATORIO PENDIENTE: volver a poner useState(1) antes de la defensa / uso real,
  // y terminar de migrar services/email.service.js de Gmail a Brevo (BREVO_API_KEY, BREVO_SENDER_EMAIL).
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [tokenEnviado, setTokenEnviado] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [tokenExpirado, setTokenExpirado] = useState(false);
  const [reenviarDisponible, setReenviarDisponible] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  // Formulario
  const [nombre, setNombre]       = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cedula, setCedula]       = useState("");
  const [telefono, setTelefono]   = useState("");
  const [direccion, setDireccion] = useState("");
  const [usuario, setUsuario]     = useState("");
  const [usuarioEstado, setUsuarioEstado] = useState(null);
  const [password, setPassword]   = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPwd, setVerPwd]       = useState(false);
  const [verConf, setVerConf]     = useState(false);

  const [consultandoTSE, setConsultandoTSE] = useState(false);
  const [mensajeTSE, setMensajeTSE] = useState("");
  const [tipoMensajeTSE, setTipoMensajeTSE] = useState("");

  const [preguntas, setPreguntas] = useState([]);
  const [seleccion, setSeleccion] = useState([
    { pregunta_id: "", respuesta: "" },
    { pregunta_id: "", respuesta: "" },
    { pregunta_id: "", respuesta: "" },
  ]);

  const [error, setError]       = useState("");
  const [cargando, setCargando] = useState(false);

  const timerRef = useRef(null);
  const usuarioTimerRef = useRef(null);
  const cedulaTimerRef = useRef(null);

  const pwd = password;
  const checks = {
    longitud:  pwd.length >= 8,
    mayuscula: /[A-Z]/.test(pwd),
    minuscula: /[a-z]/.test(pwd),
    numero:    /[0-9]/.test(pwd),
    simbolo:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  };

  useEffect(() => {
    fetch(`${API}/preguntas`)
      .then(r => r.json())
      .then(data => setPreguntas(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (segundosRestantes > 0) {
      timerRef.current = setTimeout(() => setSegundosRestantes(s => s - 1), 1000);
    } else if (tokenEnviado) {
      setReenviarDisponible(true);
    }
    return () => clearTimeout(timerRef.current);
  }, [segundosRestantes, tokenEnviado]);

  useEffect(() => {
    if (!usuario) { setUsuarioEstado(null); return; }
    if (!REGEX_USUARIO.test(usuario)) { setUsuarioEstado("invalido"); return; }
    setUsuarioEstado("verificando");
    clearTimeout(usuarioTimerRef.current);
    usuarioTimerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API}/verificar-usuario/${usuario}`);
        const d = await r.json();
        setUsuarioEstado(d.disponible ? "disponible" : "no_disponible");
      } catch { setUsuarioEstado(null); }
    }, 600);
    return () => clearTimeout(usuarioTimerRef.current);
  }, [usuario]);

  const handleAceptarPolitica = () => setPaso(2);

  const handleEnviarToken = async () => {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un correo electrónico válido");
      return;
    }
    setCargando(true);
    try {
      const r = await fetch(`${API}/token-registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.mensaje); setCargando(false); return; }
      setTokenEnviado(true);
      setReenviarDisponible(false);
      setSegundosRestantes(60);
      setTokenError("");
      setTokenExpirado(false);
    } catch { setError("No se pudo conectar con el servidor"); }
    setCargando(false);
  };

  const handleVerificarToken = async () => {
    setTokenError("");
    if (!token.trim()) { setTokenError("Ingresa el TOKEN"); return; }
    setCargando(true);
    try {
      const r = await fetch(`${API}/verificar-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: token.toUpperCase() }),
      });
      const d = await r.json();
      if (!r.ok) {
        setTokenExpirado(!!d.expirado);
        setTokenError(d.mensaje);
        setCargando(false);
        return;
      }
      setPaso(3);
    } catch { setTokenError("No se pudo conectar con el servidor"); }
    setCargando(false);
  };

  const consultarCedulaTSE = async () => {
    const cedulaLimpia = cedula.trim();

    if (!cedulaLimpia) {
      setMensajeTSE("Ingresá tu cédula antes de consultar.");
      setTipoMensajeTSE("error");
      return;
    }

    setConsultandoTSE(true);
    setMensajeTSE("");

    try {
      const r = await fetch(`${API_TSE}/consulta-cedula/${cedulaLimpia}`);
      const d = await r.json();

      if (d.encontrada) {
        setNombre(d.persona.nombre);
        setApellidos(`${d.persona.primer_apellido} ${d.persona.segundo_apellido}`);
        setMensajeTSE("Cédula encontrada. Nombre y apellidos autocompletados.");
        setTipoMensajeTSE("exito");
      } else {
        setMensajeTSE("Cédula no encontrada en el padrón. Completá tu nombre y apellidos manualmente.");
        setTipoMensajeTSE("advertencia");
      }
    } catch {
      setMensajeTSE("No se pudo conectar con el servicio del TSE. Completá tus datos manualmente.");
      setTipoMensajeTSE("error");
    }
    setConsultandoTSE(false);
  };

  useEffect(() => {
    clearTimeout(cedulaTimerRef.current);
    if (cedula.trim().length !== 9) return;
    cedulaTimerRef.current = setTimeout(() => {
      consultarCedulaTSE();
    }, 400);
    return () => clearTimeout(cedulaTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cedula]);

  const handleRegistro = async () => {
    setError("");
    if (!nombre.trim() || !apellidos.trim()) { setError("Nombre y apellidos son requeridos"); return; }
    if (!/^\d{9,12}$/.test(cedula)) { setError("La cédula debe tener entre 9 y 12 números"); return; }
    if (!/^\d{8}$/.test(telefono)) { setError("El teléfono debe tener 8 dígitos"); return; }
    if (!REGEX_USUARIO.test(usuario)) { setError("El usuario no cumple la política"); return; }
    if (usuarioEstado !== "disponible") { setError("Verifica la disponibilidad del usuario"); return; }
    if (!REGEX_PASSWORD.test(password)) { setError("La contraseña no cumple todos los requisitos"); return; }
    if (password !== confirmar) { setError("Las contraseñas no coinciden"); return; }

    const ids = seleccion.map(s => s.pregunta_id);
    if (ids.some(id => !id)) { setError("Selecciona las 3 preguntas de seguridad"); return; }
    if (new Set(ids).size !== 3) { setError("No puedes repetir preguntas de seguridad"); return; }
    if (seleccion.some(s => !s.respuesta.trim() || s.respuesta.trim().length < 2)) {
      setError("Todas las respuestas de seguridad son requeridas"); return;
    }

    setCargando(true);
    try {
      const r = await fetch(`${API}/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, apellidos, email, usuario, cedula, telefono, direccion, password,
          preguntas: seleccion.map(s => ({ pregunta_id: parseInt(s.pregunta_id), respuesta: s.respuesta })),
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.mensaje || "Error al registrarse"); setCargando(false); return; }
      localStorage.setItem("token_cliente", d.token);
      localStorage.setItem("cliente", JSON.stringify(d.cliente));
      setPaso(4);
    } catch { setError("No se pudo conectar con el servidor"); }
    setCargando(false);
  };

  const preguntasDisponibles = (idx) =>
    preguntas.filter(p => !seleccion.some((s, i) => i !== idx && s.pregunta_id === String(p.id)));

  const actualizarSeleccion = (idx, campo, valor) => {
    const nueva = [...seleccion];
    nueva[idx] = { ...nueva[idx], [campo]: valor };
    setSeleccion(nueva);
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "520px" }}>

        {paso === 1 && (
          <>
            <div className="auth-logo"><i className="bi bi-shield-check-fill"></i></div>
            <h2 className="auth-titulo">Política de Privacidad</h2>
            <p className="auth-sub">Lee y acepta antes de continuar</p>
            <div className="politica-scroll">
              <p><strong>Distribuidora S.M</strong> recopila tus datos personales (nombre, cédula, correo, teléfono y dirección) con el único propósito de gestionar tus pedidos y brindarte un servicio de calidad.</p>
              <p>Tus datos <strong>no serán compartidos</strong> con terceros sin tu consentimiento. La información es almacenada de forma segura y protegida mediante mecanismos de cifrado.</p>
              <p>Tienes derecho a <strong>acceder, rectificar y eliminar</strong> tu información en cualquier momento contactándonos directamente.</p>
              <p>Al continuar con el registro, aceptas el tratamiento de tus datos conforme a esta política.</p>
            </div>
            <button className="btn btn-success w-100 py-2 fw-semibold mt-3" onClick={handleAceptarPolitica}>
              <i className="bi bi-check-circle-fill me-2"></i>Acepto y continuar
            </button>
            <hr className="my-4" />
            <Link to="/login" className="btn btn-outline-success w-100">Ya tengo cuenta</Link>
          </>
        )}

        {paso === 2 && (
          <>
            <div className="auth-logo"><i className="bi bi-envelope-check-fill"></i></div>
            <h2 className="auth-titulo">Verificar correo</h2>
            <p className="auth-sub">Ingresa tu correo para recibir el TOKEN de verificación</p>

            <div className="mb-3">
              <label className="form-label fw-semibold">Correo electrónico</label>
              <div className="input-group">
                <input
                  type="email" className="form-control"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setTokenEnviado(false); setToken(""); }}
                  disabled={tokenEnviado && !reenviarDisponible}
                />
                <button
                  className="btn btn-success"
                  onClick={handleEnviarToken}
                  disabled={cargando || (tokenEnviado && !reenviarDisponible)}
                >
                  {cargando ? <span className="spinner-border spinner-border-sm"></span>
                    : tokenEnviado ? (reenviarDisponible ? "Reenviar" : `${segundosRestantes}s`) : "Enviar TOKEN"}
                </button>
              </div>
              {tokenEnviado && !reenviarDisponible && (
                <small className="text-muted">Puedes reenviar en {segundosRestantes} segundos</small>
              )}
            </div>

            {tokenEnviado && (
              <div className="mb-3">
                <label className="form-label fw-semibold">TOKEN de verificación</label>
                <input
                  type="text" className="form-control text-center fw-bold"
                  placeholder="Ej: A3F7C2"
                  value={token}
                  onChange={(e) => { setToken(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setTokenError(""); setTokenExpirado(false); }}
                  maxLength={6}
                  style={{ letterSpacing: "0.3em", fontSize: "1.3rem" }}
                />
              </div>
            )}

            {tokenError && (
              <div className="alert alert-danger py-2 mb-3">
                {tokenError}
                {tokenExpirado && reenviarDisponible && (
                  <div className="mt-1">
                    <button className="btn btn-sm btn-outline-danger" onClick={handleEnviarToken}>
                      Reenviar TOKEN
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

            {tokenEnviado && (
              <button className="btn btn-success w-100 py-2 fw-semibold mb-2" onClick={handleVerificarToken} disabled={cargando}>
                {cargando ? <span className="spinner-border spinner-border-sm me-2"></span>
                  : <i className="bi bi-check-lg me-2"></i>}
                Verificar TOKEN
              </button>
            )}

            <Link to="/login" className="btn btn-outline-secondary w-100">
              <i className="bi bi-arrow-left me-2"></i>Volver al login
            </Link>
          </>
        )}

        {paso === 3 && (
          <>
            <div className="auth-logo"><i className="bi bi-person-plus-fill"></i></div>
            <h2 className="auth-titulo">Crear cuenta</h2>
            <p className="auth-sub">Correo verificado: <strong>{email}</strong></p>

            <div className="registro-seccion-titulo">Datos personales</div>

            <div className="mb-2">
              <label className="form-label fw-semibold">Cédula</label>
              <small className="text-muted d-block mb-1">
                Escribí tu número de cédula (9 dígitos) y buscaremos tus datos automáticamente.
              </small>
              <div className="input-group">
                <input type="text" className="form-control" placeholder="Ej: 101053316"
                  value={cedula} onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                  maxLength={12}
                  inputMode="numeric"
                  autoFocus />
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={consultarCedulaTSE}
                  disabled={consultandoTSE}
                  title="Buscar de nuevo"
                >
                  {consultandoTSE
                    ? <span className="spinner-border spinner-border-sm"></span>
                    : <i className="bi bi-arrow-repeat"></i>}
                </button>
              </div>
              {consultandoTSE && (
                <small className="text-success d-block mt-1">
                  <span className="spinner-border spinner-border-sm me-1" style={{ width: "0.7rem", height: "0.7rem" }}></span>
                  Buscando tus datos...
                </small>
              )}
              {mensajeTSE && (
                <small className={
                  tipoMensajeTSE === "exito" ? "text-success" :
                  tipoMensajeTSE === "advertencia" ? "text-warning" :
                  "text-danger"
                }>
                  {mensajeTSE}
                </small>
              )}
            </div>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <label className="form-label fw-semibold">Nombre</label>
                <input type="text" className="form-control" placeholder="Tu nombre"
                  value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">Apellidos</label>
                <input type="text" className="form-control" placeholder="Tus apellidos"
                  value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
              </div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <label className="form-label fw-semibold">Teléfono</label>
                <input type="text" className="form-control" placeholder="88001234"
                  value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                  maxLength={8} />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">Dirección de entrega</label>
                <input type="text" className="form-control" placeholder="Provincia, cantón, señas"
                  value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>
            </div>

            <div className="registro-seccion-titulo mt-3">Acceso</div>

            <div className="mb-2">
              <label className="form-label fw-semibold">Usuario</label>
              <div className="input-group">
                <input type="text" className={`form-control ${
                    usuarioEstado === "disponible" ? "is-valid" :
                    usuarioEstado === "no_disponible" || usuarioEstado === "invalido" ? "is-invalid" : ""
                  }`}
                  placeholder="Ej: juan.perez"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value.replace(/\s/g, ""))}
                  maxLength={30}
                />
                {usuarioEstado === "verificando" && (
                  <span className="input-group-text">
                    <span className="spinner-border spinner-border-sm"></span>
                  </span>
                )}
              </div>
              {usuarioEstado === "disponible" && <div className="valid-feedback d-block"><i className="bi bi-check-circle-fill me-1"></i>Usuario disponible</div>}
              {usuarioEstado === "no_disponible" && <div className="invalid-feedback d-block"><i className="bi bi-x-circle me-1"></i>Usuario no disponible</div>}
              {usuarioEstado === "invalido" && <div className="invalid-feedback d-block">3–30 caracteres, solo letras, números, puntos o guiones bajos</div>}
              {!usuarioEstado && <small className="text-muted">3–30 caracteres, sin espacios (ej: juan.perez)</small>}
            </div>

            <div className="mb-1">
              <label className="form-label fw-semibold">Contraseña</label>
              <div className="input-group">
                <input type={verPwd ? "text" : "password"} className="form-control"
                  placeholder="Mínimo 8 caracteres"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setVerPwd(!verPwd)}>
                  <i className={`bi bi-eye${verPwd ? "-slash" : ""}`}></i>
                </button>
              </div>
            </div>

            <div className="pwd-checks mb-2">
              <CheckItem ok={checks.longitud}  texto="Mínimo 8 caracteres" />
              <CheckItem ok={checks.mayuscula} texto="Al menos una mayúscula" />
              <CheckItem ok={checks.minuscula} texto="Al menos una minúscula" />
              <CheckItem ok={checks.numero}    texto="Al menos un número" />
              <CheckItem ok={checks.simbolo}   texto="Al menos un símbolo (!@#$...)" />
            </div>

            <div className="mb-2">
              <label className="form-label fw-semibold">Confirmar contraseña</label>
              <div className="input-group">
                <input type={verConf ? "text" : "password"} className="form-control"
                  placeholder="Repite tu contraseña"
                  value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setVerConf(!verConf)}>
                  <i className={`bi bi-eye${verConf ? "-slash" : ""}`}></i>
                </button>
              </div>
              {confirmar && (
                <small className={password === confirmar ? "text-success" : "text-danger"}>
                  <i className={`bi bi-${password === confirmar ? "check-circle-fill" : "x-circle"} me-1`}></i>
                  {password === confirmar ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                </small>
              )}
            </div>

            <div className="registro-seccion-titulo mt-3">Preguntas de seguridad</div>
            <p style={{ fontSize: "0.82rem", color: "#6c757d", marginBottom: "12px" }}>
              Selecciona 3 preguntas diferentes y escribe tu respuesta para cada una.
            </p>

            {[0, 1, 2].map((idx) => (
              <div key={idx} className="mb-3 pregunta-seguridad-bloque">
                <label className="form-label fw-semibold">Pregunta {idx + 1}</label>
                <select className="form-select mb-1"
                  value={seleccion[idx].pregunta_id}
                  onChange={(e) => actualizarSeleccion(idx, "pregunta_id", e.target.value)}>
                  <option value="">Selecciona una pregunta...</option>
                  {preguntasDisponibles(idx).map(p => (
                    <option key={p.id} value={p.id}>{p.pregunta}</option>
                  ))}
                </select>
                <input type="text" className="form-control"
                  placeholder="Tu respuesta"
                  value={seleccion[idx].respuesta}
                  onChange={(e) => actualizarSeleccion(idx, "respuesta", e.target.value)} />
              </div>
            ))}

            {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

            <button className="btn btn-success w-100 py-2 fw-semibold" onClick={handleRegistro} disabled={cargando}>
              {cargando
                ? <span className="spinner-border spinner-border-sm me-2"></span>
                : <i className="bi bi-person-check-fill me-2"></i>}
              Crear cuenta
            </button>
          </>
        )}

        {paso === 4 && (
          <div className="text-center">
            <div style={{ fontSize: "4rem", color: "#40916c", marginBottom: "1rem" }}>
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h2 className="auth-titulo">Cuenta creada</h2>
            <p className="auth-sub">Bienvenido a Distribuidora S.M</p>
            <button className="btn btn-success w-100 py-2 fw-semibold" onClick={() => navigate("/")}>
              <i className="bi bi-house-fill me-2"></i>Ir al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Registro;