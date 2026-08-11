import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import RecaptchaWidget from "../components/RecaptchaWidget";
import "../App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API = `${API_BASE}/auth/clientes`;

function Login() {
  const navigate = useNavigate();

  // Paso: 1=usuario+pwd, 2=elegir2FA, 3=otp propio, 4=google auth
  const [paso, setPaso]         = useState(1);
  const [usuario, setUsuario]   = useState("");
  const [password, setPassword] = useState("");
  const [verPwd, setVerPwd]     = useState(false);
  const [error, setError]       = useState("");
  const [intentosRestantes, setIntentosRestantes] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [segundosCuenta, setSegundosCuenta] = useState(0);
  const cuentaRef = useRef(null);
  const [cargando, setCargando] = useState(false);

  const [datosCliente, setDatosCliente] = useState(null);

  // CAPTCHA
  const [captchaToken, setCaptchaToken] = useState("");
  const recaptchaRef = useRef(null);

  // OTP propio
  const [codigoOTP, setCodigoOTP]       = useState("");      // código generado, mostrado en pantalla
  const [inputCodigo, setInputCodigo]   = useState("");      // lo que escribe el usuario
  const [segundosOTP, setSegundosOTP]   = useState(0);
  const [otpExpirado, setOtpExpirado]   = useState(false);
  const timerRef = useRef(null);

  // Google Auth
  const [inputTotp, setInputTotp] = useState("");

  // ── Countdown bloqueo temporal ───────────────────────────────────────────────
  useEffect(() => {
    // Al montar, revisar si hay bloqueo guardado
    const hasta = localStorage.getItem("bloqueado_hasta");
    if (hasta) {
      const restantes = Math.ceil((new Date(hasta) - new Date()) / 1000);
      if (restantes > 0) {
        setBloqueado(true);
        setSegundosCuenta(restantes);
      } else {
        localStorage.removeItem("bloqueado_hasta");
      }
    }
  }, []);

  useEffect(() => {
    if (segundosCuenta > 0) {
      cuentaRef.current = setTimeout(() => setSegundosCuenta(s => s - 1), 1000);
    } else if (bloqueado && segundosCuenta === 0) {
      setBloqueado(false);
      setError("");
      localStorage.removeItem("bloqueado_hasta");
    }
    return () => clearTimeout(cuentaRef.current);
  }, [segundosCuenta, bloqueado]);

  // ── Countdown OTP ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (segundosOTP > 0) {
      timerRef.current = setTimeout(() => setSegundosOTP(s => s - 1), 1000);
    } else if (codigoOTP) {
      setOtpExpirado(true);
    }
    return () => clearTimeout(timerRef.current);
  }, [segundosOTP, codigoOTP]);

  // ── PASO 1: login ─────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!usuario.trim() || !password) { setError("Usuario y contraseña son requeridos"); return; }
    if (!captchaToken) { setError("Completa el CAPTCHA para continuar"); return; }
    setCargando(true);
    try {
      const r = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password, captchaToken }),
      });
      const d = await r.json();
      if (!r.ok) {
        recaptchaRef.current?.reset();
        const match = d.mensaje && d.mensaje.match(/Intentos restantes: (\d+)/);
        if (match) {
          setIntentosRestantes(parseInt(match[1]));
          setError("");
        } else {
          setIntentosRestantes(null);
          setError(d.mensaje || "Credenciales incorrectas");
        }
        if (r.status === 403 && d.bloqueado) {
          setBloqueado(true);
          setSegundosCuenta(d.segundosRestantes || 120);
          if (d.bloqueado_hasta) localStorage.setItem("bloqueado_hasta", d.bloqueado_hasta);
          setError("");
        }
        setCargando(false);
        return;
      }
      setIntentosRestantes(null);
      setBloqueado(false);
      localStorage.removeItem("bloqueado_hasta");

      if (!d.requiere2fa) {
        localStorage.setItem("token_cliente", d.token);
        localStorage.setItem("cliente", JSON.stringify(d.cliente));
        navigate("/");
        return;
      }

      setDatosCliente({ cliente_id: d.cliente_id, nombre: d.nombre, tiene_totp: d.tiene_totp });
      setPaso(2);
    } catch {
      recaptchaRef.current?.reset();
      setError("No se pudo conectar con el servidor");
    }
    setCargando(false);
  };

  // ── PASO 2: elegir OTP propio ─────────────────────────────────────────────
  const elegirOTP = async () => {
    setError("");
    setCargando(true);
    try {
      const r = await fetch(`${API}/otp/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: datosCliente.cliente_id }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.mensaje); setCargando(false); return; }
      setCodigoOTP(d.codigo);
      setInputCodigo("");
      setOtpExpirado(false);
      setSegundosOTP(60);
      setPaso(3);
    } catch { setError("No se pudo generar el código"); }
    setCargando(false);
  };

  const regenerarOTP = async () => {
    setError("");
    setOtpExpirado(false);
    setCodigoOTP("");
    setInputCodigo("");
    setCargando(true);
    try {
      const r = await fetch(`${API}/otp/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: datosCliente.cliente_id }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.mensaje); setCargando(false); return; }
      setCodigoOTP(d.codigo);
      setSegundosOTP(60);
    } catch { setError("No se pudo generar el código"); }
    setCargando(false);
  };

  // ── PASO 2: elegir Google Auth ────────────────────────────────────────────
  const elegirTOTP = () => {
    setError("");
    setInputTotp("");
    setPaso(4);
  };

  // ── Verificar OTP propio ──────────────────────────────────────────────────
  const verificarOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!inputCodigo.trim()) { setError("Ingresa el código"); return; }
    setCargando(true);
    try {
      const r = await fetch(`${API}/otp/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: datosCliente.cliente_id, codigo: inputCodigo }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.mensaje); setCargando(false); return; }
      localStorage.setItem("token_cliente", d.token);
      localStorage.setItem("cliente", JSON.stringify(d.cliente));
      navigate("/");
    } catch { setError("No se pudo verificar el código"); }
    setCargando(false);
  };

  // ── Verificar Google Auth ─────────────────────────────────────────────────
  const verificarTOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!inputTotp.trim()) { setError("Ingresa el código"); return; }
    setCargando(true);
    try {
      const r = await fetch(`${API}/totp/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: datosCliente.cliente_id, codigo: inputTotp }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.mensaje); setCargando(false); return; }
      localStorage.setItem("token_cliente", d.token);
      localStorage.setItem("cliente", JSON.stringify(d.cliente));
      navigate("/");
    } catch { setError("No se pudo verificar el código"); }
    setCargando(false);
  };

  // ════════════════════════════════════════════════════════
  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* PASO 1 — Usuario y contraseña */}
        {paso === 1 && (
          <>
            <div className="auth-logo"><i className="bi bi-droplet-fill"></i></div>
            <h2 className="auth-titulo">Bienvenido</h2>
            <p className="auth-sub">Distribuidora S.M — Inicia sesión</p>

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Usuario</label>
                <input type="text" className="form-control"
                  placeholder="Ej: juan.perez"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value.replace(/\s/g, ""))}
                  autoComplete="username" required />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Contraseña</label>
                <div className="input-group">
                  <input
                    type={verPwd ? "text" : "password"}
                    className="form-control"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password" required
                  />
                  <button type="button" className="btn btn-outline-secondary"
                    onClick={() => setVerPwd(!verPwd)}>
                    <i className={`bi bi-eye${verPwd ? "-slash" : ""}`}></i>
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <RecaptchaWidget ref={recaptchaRef} onToken={setCaptchaToken} />
              </div>

              {bloqueado && (
                <div className="alert alert-danger py-3 mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-lock-fill"></i>
                    <strong>Cuenta bloqueada temporalmente</strong>
                  </div>
                  <div className="bloqueo-timer">
                    <div className="bloqueo-timer-circulo">
                      <span className="bloqueo-timer-num">
                        {Math.floor(segundosCuenta / 60)}:{String(segundosCuenta % 60).padStart(2, "0")}
                      </span>
                    </div>
                    <span className="bloqueo-timer-texto">Espera para volver a intentarlo</span>
                  </div>
                </div>
              )}

              {!bloqueado && intentosRestantes !== null && (
                <div className="alert alert-warning py-2 mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>
                  Usuario o contraseña incorrectos.
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span style={{ fontSize: "0.85rem" }}>Intentos restantes:</span>
                    {[...Array(3)].map((_, i) => (
                      <span key={i} style={{
                        width: "14px", height: "14px", borderRadius: "50%",
                        background: i < intentosRestantes ? "#ffc107" : "#dc3545",
                        display: "inline-block", border: "1px solid rgba(0,0,0,0.1)"
                      }} />
                    ))}
                    <strong>{intentosRestantes}</strong>
                  </div>
                </div>
              )}

              {!bloqueado && intentosRestantes === null && error && (
                <div className="alert alert-danger py-2 mb-3">
                  <i className="bi bi-x-circle me-2"></i>{error}
                </div>
              )}

              <button type="submit" className="btn btn-success w-100 py-2 fw-semibold" disabled={cargando || bloqueado}>
                {cargando
                  ? <span className="spinner-border spinner-border-sm me-2"></span>
                  : <i className="bi bi-box-arrow-in-right me-2"></i>}
                Iniciar sesión
              </button>
            </form>

            <div className="text-center mt-3 d-flex flex-column gap-1">
              <Link to="/olvide-password" className="text-success small fw-semibold">
                ¿Olvidaste tu contraseña?
              </Link>
              <Link to="/recuperar-usuario" className="text-success small fw-semibold">
                ¿Olvidaste tu usuario?
              </Link>
            </div>

            <hr className="my-4" />
            <p className="text-center text-muted mb-2">¿No tienes cuenta?</p>
            <Link to="/registro" className="btn btn-outline-success w-100">Crear cuenta</Link>
          </>
        )}

        {/* PASO 2 — Elegir método 2FA */}
        {paso === 2 && (
          <>
            <div className="auth-logo auth-logo--bienvenida">
              <i className="bi bi-shield-lock-fill"></i>
            </div>
            <h2 className="auth-titulo auth-titulo--bienvenida">Verificación</h2>
            <p className="auth-sub auth-sub--bienvenida">
              Hola <span className="auth-nombre-pill">{datosCliente?.nombre}</span>, elige cómo verificar tu identidad
            </p>

            {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

            <div className="d-flex flex-column gap-3 mt-2">
              <button className="btn-2fa-opcion" onClick={elegirOTP} disabled={cargando}>
                <div className="btn-2fa-icono">
                  <i className="bi bi-phone-fill"></i>
                </div>
                <div>
                  <div className="btn-2fa-titulo">OTP — Distribuidora S.M</div>
                  <div className="btn-2fa-sub">Genera un código de un solo uso directamente en la app</div>
                </div>
                <i className="bi bi-chevron-right ms-auto"></i>
              </button>

              {datosCliente?.tiene_totp ? (
                <button className="btn-2fa-opcion" onClick={elegirTOTP} disabled={cargando}>
                  <div className="btn-2fa-icono" style={{ background: "#e8f5e9" }}>
                    <i className="bi bi-google" style={{ color: "#2d6a4f" }}></i>
                  </div>
                  <div>
                    <div className="btn-2fa-titulo">Google Authenticator</div>
                    <div className="btn-2fa-sub">Usa el código generado por tu app de Google</div>
                  </div>
                  <i className="bi bi-chevron-right ms-auto"></i>
                </button>
              ) : (
                <div className="btn-2fa-opcion btn-2fa-desactivado">
                  <div className="btn-2fa-icono" style={{ background: "#f0f0f0" }}>
                    <i className="bi bi-google" style={{ color: "#adb5bd" }}></i>
                  </div>
                  <div>
                    <div className="btn-2fa-titulo" style={{ color: "#adb5bd" }}>Google Authenticator</div>
                    <div className="btn-2fa-sub">
                      No configurado — actívalo desde{" "}
                      <span style={{ color: "#40916c", fontWeight: 600 }}>Mi Cuenta</span>
                    </div>
                  </div>
                  <i className="bi bi-lock ms-auto" style={{ color: "#adb5bd" }}></i>
                </div>
              )}
            </div>

            <button className="btn btn-outline-secondary w-100 mt-4"
              onClick={() => { setPaso(1); setError(""); setDatosCliente(null); }}>
              <i className="bi bi-arrow-left me-2"></i>Volver
            </button>
          </>
        )}

        {/* PASO 3 — OTP propio (mostrado en pantalla) */}
        {paso === 3 && (
          <>
            <div className="auth-logo"><i className="bi bi-phone-fill"></i></div>
            <h2 className="auth-titulo">Código OTP</h2>
            <p className="auth-sub">Tu código de verificación de Distribuidora S.M</p>

            {/* Código generado visible en pantalla */}
            <div className="otp-display-box">
              {otpExpirado ? (
                <div className="otp-expirado">Código expirado</div>
              ) : (
                <>
                  <div className="otp-codigo">{codigoOTP}</div>
                  <div className="otp-timer">
                    <i className="bi bi-clock me-1"></i>
                    Expira en {segundosOTP}s
                  </div>
                </>
              )}
            </div>

            {otpExpirado ? (
              <button className="btn btn-success w-100 py-2 fw-semibold mb-3" onClick={regenerarOTP} disabled={cargando}>
                <i className="bi bi-arrow-repeat me-2"></i>Generar nuevo código
              </button>
            ) : (
              <form onSubmit={verificarOTP}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Ingresa el código</label>
                  <input
                    type="text"
                    className="form-control text-center fw-bold"
                    placeholder="000000"
                    value={inputCodigo}
                    onChange={(e) => setInputCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    style={{ letterSpacing: "0.4em", fontSize: "1.8rem" }}
                    autoFocus
                  />
                </div>

                {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

                <button type="submit" className="btn btn-success w-100 py-2 fw-semibold mb-2" disabled={cargando}>
                  {cargando
                    ? <span className="spinner-border spinner-border-sm me-2"></span>
                    : <i className="bi bi-check-lg me-2"></i>}
                  Verificar
                </button>
              </form>
            )}

            <button className="btn btn-outline-secondary w-100"
              onClick={() => { setPaso(2); setError(""); setCodigoOTP(""); setInputCodigo(""); clearTimeout(timerRef.current); }}>
              <i className="bi bi-arrow-left me-2"></i>Elegir otro método
            </button>
          </>
        )}

        {/* PASO 4 — Google Authenticator */}
        {paso === 4 && (
          <>
            <div className="auth-logo" style={{ background: "rgba(46,125,50,0.08)" }}>
              <i className="bi bi-google" style={{ color: "#2d6a4f" }}></i>
            </div>
            <h2 className="auth-titulo">Google Authenticator</h2>
            <p className="auth-sub">
              Ingresa el código de 6 dígitos de tu app Google Authenticator
            </p>

            <form onSubmit={verificarTOTP}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control text-center fw-bold"
                  placeholder="000000"
                  value={inputTotp}
                  onChange={(e) => setInputTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  style={{ letterSpacing: "0.4em", fontSize: "1.8rem" }}
                  autoFocus
                />
              </div>

              {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

              <button type="submit" className="btn btn-success w-100 py-2 fw-semibold mb-2" disabled={cargando}>
                {cargando
                  ? <span className="spinner-border spinner-border-sm me-2"></span>
                  : <i className="bi bi-check-lg me-2"></i>}
                Verificar
              </button>
            </form>

            <button className="btn btn-outline-secondary w-100"
              onClick={() => { setPaso(2); setError(""); setInputTotp(""); }}>
              <i className="bi bi-arrow-left me-2"></i>Elegir otro método
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default Login;