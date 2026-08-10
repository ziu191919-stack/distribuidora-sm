const conexion = require("../config/db");
const { registrarAuditoriaAdmin, ACCIONES: ACCIONES_ADMIN } = require("../services/auditoria.admin.service");
const { registrarAuditoriaCliente, ACCIONES_CLIENTE } = require("../services/auditoria.cliente.service");
const otpauth = require("otpauth");
const QRCode = require("qrcode");

const getAdminId = (req) => {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return null;
    const jwtLib = require("jsonwebtoken");
    const payload = jwtLib.verify(token, process.env.JWT_SECRET_ADMIN || "distribuidora_sm_admin_secret_2024");
    return payload.id || null;
  } catch { return null; }
};
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { enviarTokenRegistro, enviarOTP } = require("../services/email.service");

const JWT_SECRET = process.env.JWT_SECRET_CLIENTES || "distribuidora_sm_clientes_secret_2024";

// Cantidad de contraseñas anteriores que no se pueden reutilizar
const LIMITE_HISTORIAL_PASSWORD = 3;

// Auditoría manejada por auditoria.cliente.service.js

// ─── HISTORIAL DE CONTRASEÑAS ────────────────────────────────────────────────
// Verifica si la contraseña en texto plano coincide con alguna de las últimas
// N contraseñas usadas por el cliente. callback(err, coincide)
const passwordFueUsadaAntes = (cliente_id, passwordPlano, callback) => {
  conexion.query(
    `SELECT contrasena_hash FROM historial_contrasenas
     WHERE cliente_id = ?
     ORDER BY id DESC
     LIMIT ?`,
    [cliente_id, LIMITE_HISTORIAL_PASSWORD],
    (err, rows) => {
      if (err) return callback(err);
      const coincide = rows.some(r => bcrypt.compareSync(passwordPlano, r.contrasena_hash));
      callback(null, coincide);
    }
  );
};

// Guarda un nuevo hash en el historial y elimina los registros más antiguos
// que excedan el límite (mantiene solo las últimas N).
const guardarEnHistorialPassword = (cliente_id, hash) => {
  conexion.query(
    "INSERT INTO historial_contrasenas (cliente_id, contrasena_hash) VALUES (?, ?)",
    [cliente_id, hash],
    (err) => {
      if (err) return console.error("Error guardando historial de contraseña:", err);
      conexion.query(
        `DELETE FROM historial_contrasenas
         WHERE cliente_id = ?
         AND id NOT IN (
           SELECT id FROM (
             SELECT id FROM historial_contrasenas
             WHERE cliente_id = ?
             ORDER BY id DESC
             LIMIT ?
           ) AS ultimas
         )`,
        [cliente_id, cliente_id, LIMITE_HISTORIAL_PASSWORD],
        (err2) => { if (err2) console.error("Error limpiando historial de contraseña:", err2); }
      );
    }
  );
};

// ─── PASO 1: Enviar TOKEN al correo ──────────────────────────────────────────
const enviarTokenDeRegistro = async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ mensaje: "Correo electrónico inválido" });

  // Verificar que el correo no esté ya registrado
  conexion.query("SELECT id FROM clientes WHERE email = ? AND activo = 1", [email], async (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length > 0)
      return res.status(409).json({ mensaje: "Este correo ya tiene una cuenta registrada" });

    // Generar token de 6 dígitos (alfanumérico mayúsculas)
    const token = crypto.randomBytes(3).toString("hex").toUpperCase();
    const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    conexion.query(
      `INSERT INTO token_registro (email, token, expira_en, usado)
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE token = ?, expira_en = ?, usado = 0`,
      [email, token, expira, token, expira],
      async (err2) => {
        if (err2) return res.status(500).json(err2);
        await enviarTokenRegistro({ email, token });
        res.json({ mensaje: "TOKEN enviado al correo" });
      }
    );
  });
};

// ─── PASO 2: Verificar TOKEN ─────────────────────────────────────────────────
const verificarTokenRegistro = (req, res) => {
  const { email, token } = req.body;
  if (!email || !token)
    return res.status(400).json({ mensaje: "Email y token requeridos" });

  conexion.query(
    "SELECT id, expira_en, usado FROM token_registro WHERE email = ? AND token = ?",
    [email, token.toUpperCase()],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0)
        return res.status(400).json({ mensaje: "TOKEN incorrecto", expirado: false });

      const reg = rows[0];
      if (reg.usado)
        return res.status(400).json({ mensaje: "TOKEN ya utilizado", expirado: false });
      if (new Date() > new Date(reg.expira_en)) {
        registrarAuditoriaCliente(null, ACCIONES_CLIENTE.TOKEN_EXPIRADO, req);
        return res.status(400).json({ mensaje: "TOKEN expirado", expirado: true });
      }

      // Marcar como usado
      conexion.query("UPDATE token_registro SET usado = 1 WHERE id = ?", [reg.id]);
      // Buscar cliente por email para auditoría (puede no existir aún)
      conexion.query("SELECT id FROM clientes WHERE email = ?", [email], (errC, rowsC) => {
        const cid = rowsC && rowsC.length > 0 ? rowsC[0].id : null;
        registrarAuditoriaCliente(cid, ACCIONES_CLIENTE.VERIFICACION_TOKEN, req);
      });
      res.json({ ok: true, mensaje: "TOKEN verificado correctamente" });
    }
  );
};

// ─── Verificar disponibilidad de usuario ─────────────────────────────────────
const verificarUsuario = (req, res) => {
  const { usuario } = req.params;
  if (!usuario || !/^[a-zA-Z0-9._]{3,30}$/.test(usuario))
    return res.status(400).json({ disponible: false, mensaje: "Usuario inválido" });

  conexion.query(
    "SELECT id FROM clientes WHERE usuario = ?",
    [usuario],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length > 0)
        return res.json({ disponible: false, mensaje: "Usuario no disponible" });
      res.json({ disponible: true, mensaje: "Usuario disponible" });
    }
  );
};

// ─── PASO 3: Registro completo ────────────────────────────────────────────────
const registrarCliente = async (req, res) => {
  const { nombre, apellidos, email, usuario, cedula, telefono, direccion, password, preguntas } = req.body;

  // Validaciones básicas
  if (!nombre || !apellidos || !email || !usuario || !cedula || !telefono || !password || !preguntas)
    return res.status(400).json({ mensaje: "Todos los campos son requeridos" });

  if (!/^\d{9,12}$/.test(cedula))
    return res.status(400).json({ mensaje: "La cédula debe tener entre 9 y 12 números" });

  if (!/^\d{8}$/.test(telefono))
    return res.status(400).json({ mensaje: "El teléfono debe tener 8 dígitos" });

  if (!/^[a-zA-Z0-9._]{3,30}$/.test(usuario))
    return res.status(400).json({ mensaje: "El usuario no cumple la política requerida" });

  const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!REGEX_PASSWORD.test(password))
    return res.status(400).json({ mensaje: "La contraseña no cumple los requisitos de seguridad" });

  if (!Array.isArray(preguntas) || preguntas.length !== 3)
    return res.status(400).json({ mensaje: "Se requieren exactamente 3 preguntas de seguridad" });

  for (const p of preguntas) {
    if (!p.pregunta_id || !p.respuesta || p.respuesta.trim().length < 2)
      return res.status(400).json({ mensaje: "Todas las preguntas deben tener respuesta" });
  }

  // Verificar unicidad
  conexion.query(
    "SELECT id FROM clientes WHERE cedula = ? OR email = ? OR usuario = ?",
    [cedula, email, usuario],
    async (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length > 0) {
        // Identificar cuál duplicado
        conexion.query("SELECT cedula, email, usuario FROM clientes WHERE cedula = ? OR email = ? OR usuario = ?",
          [cedula, email, usuario], (e2, r2) => {
            if (e2 || r2.length === 0) return res.status(409).json({ mensaje: "Datos ya registrados" });
            const dup = r2[0];
            if (dup.cedula === cedula) return res.status(409).json({ mensaje: "Ya existe una cuenta con esa cédula" });
            if (dup.email === email) return res.status(409).json({ mensaje: "Ya existe una cuenta con ese correo" });
            if (dup.usuario === usuario) return res.status(409).json({ mensaje: "Usuario no disponible" });
          });
        return;
      }

      const nombreCompleto = `${nombre.trim()} ${apellidos.trim()}`;
      const hash = bcrypt.hashSync(password, 10);

      const sql = `INSERT INTO clientes (nombre, cedula, usuario, email, telefono, direccion, password_hash, activo)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 1)`;
      conexion.query(sql, [nombreCompleto, cedula, usuario, email, telefono, direccion || "", hash], (err2, resultado) => {
        if (err2) return res.status(500).json(err2);

        const clienteId = resultado.insertId;

        // Guardar las 3 respuestas de seguridad (en texto plano por ahora, bcrypt al final)
        const valores = preguntas.map(p => [clienteId, p.pregunta_id, p.respuesta.trim().toLowerCase()]);
        conexion.query(
          "INSERT INTO respuestas_seguridad (cliente_id, pregunta_id, respuesta_hash) VALUES ?",
          [valores],
          (err3) => {
            if (err3) console.error("Error guardando preguntas:", err3);
          }
        );

        // Guardar la contraseña inicial en el historial
        guardarEnHistorialPassword(clienteId, hash);

        registrarAuditoriaCliente(clienteId, ACCIONES_CLIENTE.REGISTRO_CUENTA, req);

        const token = jwt.sign({ id: clienteId, usuario, nombre: nombreCompleto }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({
          mensaje: "Cuenta creada correctamente",
          token,
          cliente: { id: clienteId, nombre: nombreCompleto, cedula, usuario, email, telefono, direccion: direccion || "" }
        });
      });
    }
  );
};

// ─── LOGIN: paso 1 (usuario + password) ──────────────────────────────────────
const loginCliente = (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password)
    return res.status(400).json({ mensaje: "Usuario y contraseña requeridos" });

  conexion.query(
    `SELECT id, nombre, cedula, usuario, email, telefono, direccion, password_hash,
            intentos_fallidos, bloqueado, bloqueado_hasta, twofa_activo, totp_secret
     FROM clientes WHERE usuario = ? AND activo = 1`,
    [usuario],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0) {
        registrarAuditoriaCliente(null, ACCIONES_CLIENTE.LOGIN_INCORRECTO, req);
        return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
      }

      const cliente = rows[0];

      // Verificar bloqueo temporal
      if (cliente.bloqueado_hasta) {
        const ahora = new Date();
        const hastaDate = new Date(cliente.bloqueado_hasta);
        if (ahora < hastaDate) {
          const segundosRestantes = Math.ceil((hastaDate - ahora) / 1000);
          registrarAuditoriaCliente(cliente.id, ACCIONES_CLIENTE.LOGIN_CUENTA_BLOQUEADA, req);
          return res.status(403).json({
            mensaje: "Cuenta bloqueada temporalmente",
            bloqueado: true,
            segundosRestantes,
            bloqueado_hasta: hastaDate.toISOString(),
          });
        } else {
          // Bloqueo expiró — limpiar
          conexion.query("UPDATE clientes SET bloqueado = 0, bloqueado_hasta = NULL, intentos_fallidos = 0 WHERE id = ?", [cliente.id]);
          cliente.bloqueado = 0;
          cliente.bloqueado_hasta = null;
          cliente.intentos_fallidos = 0;
        }
      }

      if (!cliente.password_hash)
        return res.status(401).json({ mensaje: "Esta cuenta no tiene contraseña configurada" });

      if (!bcrypt.compareSync(password, cliente.password_hash)) {
        const nuevosIntentos = (cliente.intentos_fallidos || 0) + 1;
        const bloquear = nuevosIntentos >= 3;

        if (bloquear) {
          const bloqueadoHasta = new Date(Date.now() + 2 * 60 * 1000); // 2 minutos
          conexion.query(
            "UPDATE clientes SET intentos_fallidos = ?, bloqueado = 1, bloqueado_hasta = ? WHERE id = ?",
            [nuevosIntentos, bloqueadoHasta, cliente.id]
          );
          registrarAuditoriaCliente(cliente.id, ACCIONES_CLIENTE.LOGIN_INCORRECTO, req);
          registrarAuditoriaCliente(cliente.id, ACCIONES_CLIENTE.CUENTA_BLOQUEADA, req);
          return res.status(403).json({
            mensaje: "Cuenta bloqueada temporalmente",
            bloqueado: true,
            segundosRestantes: 120,
            bloqueado_hasta: bloqueadoHasta.toISOString(),
          });
        }

        conexion.query(
          "UPDATE clientes SET intentos_fallidos = ? WHERE id = ?",
          [nuevosIntentos, cliente.id]
        );

        registrarAuditoriaCliente(cliente.id, ACCIONES_CLIENTE.LOGIN_INCORRECTO, req);

        const restantes = 3 - nuevosIntentos;
        return res.status(401).json({
          mensaje: `Usuario o contraseña incorrectos. Intentos restantes: ${restantes}`
        });
      }

      // Credenciales correctas — resetear intentos y bloqueo
      conexion.query("UPDATE clientes SET intentos_fallidos = 0, bloqueado = 0, bloqueado_hasta = NULL WHERE id = ?", [cliente.id]);

      // Si 2FA desactivado, entrar directo
      if (!cliente.twofa_activo) {
        registrarAuditoriaCliente(cliente.id, ACCIONES_CLIENTE.LOGIN_CORRECTO, req);
        const token = jwt.sign({ id: cliente.id, usuario: cliente.usuario, nombre: cliente.nombre }, JWT_SECRET, { expiresIn: "7d" });
        return res.json({
          mensaje: "Login exitoso",
          requiere2fa: false,
          token,
          cliente: { id: cliente.id, nombre: cliente.nombre, cedula: cliente.cedula, usuario: cliente.usuario, email: cliente.email, telefono: cliente.telefono, direccion: cliente.direccion }
        });
      }

      // Requiere 2FA — devolver que se elija método
      res.json({
        requiere2fa: true,
        cliente_id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        tiene_totp: !!cliente.totp_secret,
      });
    }
  );
};

// ─── OTP: generar y enviar ────────────────────────────────────────────────────
const generarOTP = (req, res) => {
  const { cliente_id } = req.body;
  if (!cliente_id) return res.status(400).json({ mensaje: "cliente_id requerido" });

  conexion.query("SELECT id FROM clientes WHERE id = ? AND activo = 1", [cliente_id], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = new Date(Date.now() + 60 * 1000); // 1 minuto

    conexion.query(
      "INSERT INTO otp (cliente_id, codigo, expira_en, usado) VALUES (?, ?, ?, 0)",
      [cliente_id, codigo, expira],
      (err2) => {
        if (err2) return res.status(500).json(err2);
        // El código se devuelve directamente — se muestra en pantalla dentro de la app
        res.json({ codigo, expira_en: expira });
      }
    );
  });
};

// ─── OTP: verificar ──────────────────────────────────────────────────────────
const verificarOTP = (req, res) => {
  const { cliente_id, codigo } = req.body;
  if (!cliente_id || !codigo)
    return res.status(400).json({ mensaje: "cliente_id y código requeridos" });

  conexion.query(
    `SELECT id, expira_en, usado FROM otp
     WHERE cliente_id = ? AND codigo = ? AND usado = 0
     ORDER BY id DESC LIMIT 1`,
    [cliente_id, codigo],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      if (rows.length === 0) {
        registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.OTP_INCORRECTO, req);
        return res.status(400).json({ mensaje: "Código incorrecto" });
      }

      const otp = rows[0];
      if (new Date() > new Date(otp.expira_en)) {
        registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.OTP_INCORRECTO, req);
        return res.status(400).json({ mensaje: "Código expirado", expirado: true });
      }

      conexion.query("UPDATE otp SET usado = 1 WHERE id = ?", [otp.id]);

      conexion.query(
        "SELECT id, nombre, cedula, usuario, email, telefono, direccion FROM clientes WHERE id = ?",
        [cliente_id],
        (err2, rows2) => {
          if (err2) return res.status(500).json(err2);
          const cliente = rows2[0];
          registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.OTP_CORRECTO, req);
          registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.LOGIN_CORRECTO, req);
          const token = jwt.sign({ id: cliente.id, usuario: cliente.usuario, nombre: cliente.nombre }, JWT_SECRET, { expiresIn: "7d" });
          res.json({
            mensaje: "Verificación exitosa",
            token,
            cliente: { id: cliente.id, nombre: cliente.nombre, cedula: cliente.cedula, usuario: cliente.usuario, email: cliente.email, telefono: cliente.telefono, direccion: cliente.direccion }
          });
        }
      );
    }
  );
};

// ─── RECUPERAR CONTRASEÑA (por preguntas de seguridad) ───────────────────────
const buscarClienteRecuperar = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ mensaje: "Correo requerido" });

  conexion.query(
    `SELECT c.id, c.nombre, c.pregunta_fallida_id,
            rs.pregunta_id, ps.pregunta
     FROM clientes c
     JOIN respuestas_seguridad rs ON rs.cliente_id = c.id
     JOIN preguntas_seguridad ps ON ps.id = rs.pregunta_id
     WHERE c.email = ? AND c.activo = 1`,
    [email],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0)
        return res.status(404).json({ mensaje: "No se encontró una cuenta con ese correo" });

      const cliente_id = rows[0].id;
      const nombre = rows[0].nombre;
      const pregunta_fallida_id = rows[0].pregunta_fallida_id;

      // Si hay pregunta fallida anterior, usar esa; si no, elegir aleatoria
      let fila;
      if (pregunta_fallida_id) {
        fila = rows.find(r => r.pregunta_id === pregunta_fallida_id) || rows[Math.floor(Math.random() * rows.length)];
      } else {
        fila = rows[Math.floor(Math.random() * rows.length)];
      }

      res.json({
        cliente_id,
        nombre,
        pregunta_id: fila.pregunta_id,
        pregunta: fila.pregunta,
      });
    }
  );
};

const verificarRespuestaRecuperar = (req, res) => {
  const { cliente_id, pregunta_id, respuesta } = req.body;
  if (!cliente_id || !pregunta_id || !respuesta)
    return res.status(400).json({ mensaje: "Datos incompletos" });

  conexion.query(
    "SELECT respuesta_hash FROM respuestas_seguridad WHERE cliente_id = ? AND pregunta_id = ?",
    [cliente_id, pregunta_id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0)
        return res.status(400).json({ mensaje: "Pregunta no encontrada" });

      const correcta = respuesta.trim().toLowerCase() === rows[0].respuesta_hash.toLowerCase();

      if (!correcta) {
        // Guardar la pregunta fallida para la próxima vez
        conexion.query("UPDATE clientes SET pregunta_fallida_id = ? WHERE id = ?", [pregunta_id, cliente_id]);
        registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.PREGUNTA_INCORRECTA, req);
        return res.status(400).json({ mensaje: "Respuesta incorrecta" });
      }

      // Limpiar pregunta fallida
      conexion.query("UPDATE clientes SET pregunta_fallida_id = NULL WHERE id = ?", [cliente_id]);
      res.json({ ok: true });
    }
  );
};

const cambiarPassword = (req, res) => {
  const { cliente_id, password } = req.body;
  if (!cliente_id || !password) return res.status(400).json({ mensaje: "Datos incompletos" });

  const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!REGEX_PASSWORD.test(password))
    return res.status(400).json({ mensaje: "La contraseña no cumple los requisitos de seguridad" });

  // Verificar que no coincida con las últimas contraseñas usadas
  passwordFueUsadaAntes(cliente_id, password, (errHist, coincide) => {
    if (errHist) return res.status(500).json(errHist);
    if (coincide)
      return res.status(400).json({
        mensaje: `No podés reutilizar ninguna de tus últimas ${LIMITE_HISTORIAL_PASSWORD} contraseñas`
      });

    const hash = bcrypt.hashSync(password, 10);
    conexion.query(
      "UPDATE clientes SET password_hash = ?, bloqueado = 0, bloqueado_hasta = NULL, intentos_fallidos = 0 WHERE id = ?",
      [hash, cliente_id],
      (err) => {
        if (err) return res.status(500).json(err);
        guardarEnHistorialPassword(cliente_id, hash);
        registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.CAMBIO_PASSWORD, req);
        res.json({ mensaje: "Contraseña actualizada correctamente" });
      }
    );
  });
};

// ─── RECUPERAR USUARIO ────────────────────────────────────────────────────────
const buscarClienteUsuario = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ mensaje: "Correo requerido" });

  conexion.query(
    `SELECT c.id, c.nombre, c.usuario, c.pregunta_fallida_id,
            rs.pregunta_id, ps.pregunta
     FROM clientes c
     JOIN respuestas_seguridad rs ON rs.cliente_id = c.id
     JOIN preguntas_seguridad ps ON ps.id = rs.pregunta_id
     WHERE c.email = ? AND c.activo = 1`,
    [email],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0)
        return res.status(404).json({ mensaje: "No se encontró una cuenta con ese correo" });

      const pregunta_fallida_id = rows[0].pregunta_fallida_id;
      let fila;
      if (pregunta_fallida_id) {
        fila = rows.find(r => r.pregunta_id === pregunta_fallida_id) || rows[Math.floor(Math.random() * rows.length)];
      } else {
        fila = rows[Math.floor(Math.random() * rows.length)];
      }

      res.json({
        cliente_id: rows[0].id,
        nombre: rows[0].nombre,
        pregunta_id: fila.pregunta_id,
        pregunta: fila.pregunta,
      });
    }
  );
};

const revelarUsuario = (req, res) => {
  const { cliente_id, pregunta_id, respuesta } = req.body;
  if (!cliente_id || !pregunta_id || !respuesta)
    return res.status(400).json({ mensaje: "Datos incompletos" });

  conexion.query(
    "SELECT respuesta_hash FROM respuestas_seguridad WHERE cliente_id = ? AND pregunta_id = ?",
    [cliente_id, pregunta_id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0) return res.status(400).json({ mensaje: "Pregunta no encontrada" });

      if (respuesta.trim().toLowerCase() !== rows[0].respuesta_hash.toLowerCase()) {
        conexion.query("UPDATE clientes SET pregunta_fallida_id = ? WHERE id = ?", [pregunta_id, cliente_id]);
        registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.PREGUNTA_INCORRECTA, req);
        return res.status(400).json({ mensaje: "Respuesta incorrecta" });
      }

      conexion.query("SELECT usuario FROM clientes WHERE id = ?", [cliente_id], (err2, r2) => {
        if (err2) return res.status(500).json(err2);
        const u = r2[0].usuario || "";
        // Generar pista: solo primera y última letra visible (j******z)
        let pista = u;
        if (u.length > 2) {
          pista = u.slice(0, 1) + "*".repeat(u.length - 2) + u.slice(-1);
        } else {
          pista = "*".repeat(u.length);
        }
        registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.RECUPERACION_USUARIO, req);
        conexion.query("UPDATE clientes SET pregunta_fallida_id = NULL WHERE id = ?", [cliente_id]);
        res.json({ pista, cliente_id });
      });
    }
  );
};

const cambiarUsuario = (req, res) => {
  const { cliente_id, usuario } = req.body;
  if (!cliente_id || !usuario) return res.status(400).json({ mensaje: "Datos incompletos" });

  if (!/^[a-zA-Z0-9._]{3,30}$/.test(usuario))
    return res.status(400).json({ mensaje: "El usuario no cumple la política requerida" });

  conexion.query(
    "SELECT id FROM clientes WHERE usuario = ? AND id != ?",
    [usuario, cliente_id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length > 0) return res.status(409).json({ mensaje: "Usuario no disponible" });

      conexion.query("UPDATE clientes SET usuario = ? WHERE id = ?", [usuario, cliente_id], (err2) => {
        if (err2) return res.status(500).json(err2);
        registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.CAMBIO_USUARIO, req);
        res.json({ mensaje: "Usuario actualizado correctamente" });
      });
    }
  );
};

// ─── REGISTRAR ACCIÓN CLIENTE (desde frontend) ───────────────────────────────
const registrarAccionCliente = (req, res) => {
  const { cliente_id, accion_id, detalle } = req.body;
  if (!cliente_id || !accion_id) return res.status(400).json({ mensaje: "Datos incompletos" });
  registrarAuditoriaCliente(cliente_id, accion_id, req, detalle || null);
  res.json({ ok: true });
};

// ─── CERRAR SESIÓN CLIENTE ───────────────────────────────────────────────────
const cerrarSesionCliente = (req, res) => {
  const { cliente_id } = req.body;
  if (cliente_id) registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.CIERRE_SESION, req);
  res.json({ mensaje: "Sesión cerrada" });
};

// ─── PERFIL ───────────────────────────────────────────────────────────────────
const miPerfil = (req, res) => {
  conexion.query(
    "SELECT id, nombre, cedula, usuario, email, telefono, direccion FROM clientes WHERE id = ? AND activo = 1",
    [req.clienteId],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
      res.json(rows[0]);
    }
  );
};

// ─── TOTP: generar secret y QR ───────────────────────────────────────────────
const generarTOTPSecret = (req, res) => {
  const { cliente_id } = req.body;
  if (!cliente_id) return res.status(400).json({ mensaje: "cliente_id requerido" });

  conexion.query("SELECT id, nombre, email FROM clientes WHERE id = ? AND activo = 1", [cliente_id], async (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });

    const cliente = rows[0];

    // Generar secret aleatorio
    const totp = new otpauth.TOTP({
      issuer: "Distribuidora S.M",
      label: cliente.email || cliente.nombre,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const secret = totp.secret.base32;
    const otpauthUrl = totp.toString();

    // Generar QR como base64
    try {
      const qrBase64 = await QRCode.toDataURL(otpauthUrl);
      res.json({ secret, qr: qrBase64 });
    } catch (e) {
      res.status(500).json({ mensaje: "Error generando QR" });
    }
  });
};

// ─── TOTP: confirmar y guardar secret ────────────────────────────────────────
const confirmarTOTP = (req, res) => {
  const { cliente_id, secret, codigo } = req.body;
  if (!cliente_id || !secret || !codigo)
    return res.status(400).json({ mensaje: "Datos incompletos" });

  // Verificar que el código ingresado es válido con el secret
  const totp = new otpauth.TOTP({
    issuer: "Distribuidora S.M",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: otpauth.Secret.fromBase32(secret),
  });

  const delta = totp.validate({ token: codigo, window: 1 });

  if (delta === null)
    return res.status(400).json({ mensaje: "Código incorrecto. Vuelve a escanear el QR e intenta de nuevo." });

  // Guardar secret en BD
  conexion.query(
    "UPDATE clientes SET totp_secret = ? WHERE id = ?",
    [secret, cliente_id],
    (err) => {
      if (err) return res.status(500).json(err);
      registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.ACTIVAR_2FA, req);
      res.json({ ok: true, mensaje: "Google Authenticator configurado correctamente" });
    }
  );
};

// ─── TOTP: verificar en login ─────────────────────────────────────────────────
const verificarTOTP = (req, res) => {
  const { cliente_id, codigo } = req.body;
  if (!cliente_id || !codigo)
    return res.status(400).json({ mensaje: "Datos incompletos" });

  conexion.query(
    "SELECT id, nombre, cedula, usuario, email, telefono, direccion, totp_secret FROM clientes WHERE id = ? AND activo = 1",
    [cliente_id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });

      const cliente = rows[0];
      if (!cliente.totp_secret)
        return res.status(400).json({ mensaje: "Google Authenticator no está configurado para esta cuenta" });

      const totp = new otpauth.TOTP({
        issuer: "Distribuidora S.M",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: otpauth.Secret.fromBase32(cliente.totp_secret),
      });

      const delta = totp.validate({ token: codigo, window: 1 });

      if (delta === null) {
        registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.OTP_INCORRECTO, req);
        return res.status(400).json({ mensaje: "Código incorrecto" });
      }

      registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.OTP_CORRECTO, req);
      registrarAuditoriaCliente(cliente_id, ACCIONES_CLIENTE.LOGIN_CORRECTO, req);

      const token = jwt.sign(
        { id: cliente.id, usuario: cliente.usuario, nombre: cliente.nombre },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({
        mensaje: "Verificación exitosa",
        token,
        cliente: {
          id: cliente.id, nombre: cliente.nombre, cedula: cliente.cedula,
          usuario: cliente.usuario, email: cliente.email,
          telefono: cliente.telefono, direccion: cliente.direccion
        }
      });
    }
  );
};

// ─── ADMIN: desactivar 2FA de un cliente ─────────────────────────────────────
const adminDesactivar2FA = (req, res) => {
  const { id } = req.params;
  conexion.query(
    "UPDATE clientes SET twofa_activo = 0 WHERE id = ?",
    [id],
    (err) => {
      if (err) return res.status(500).json(err);
      registrarAuditoriaCliente(id, ACCIONES_CLIENTE.DESACTIVAR_2FA, req);
      const adminId = getAdminId(req);
      if (adminId) registrarAuditoriaAdmin(adminId, ACCIONES_ADMIN.DESACTIVAR_2FA_CLIENTE, req, `Cliente ID: ${id}`);
      res.json({ mensaje: "Doble autenticación desactivada" });
    }
  );
};

// ─── ADMIN: activar 2FA de un cliente ────────────────────────────────────────
const adminActivar2FA = (req, res) => {
  const { id } = req.params;
  conexion.query(
    "UPDATE clientes SET twofa_activo = 1 WHERE id = ?",
    [id],
    (err) => {
      if (err) return res.status(500).json(err);
      registrarAuditoriaCliente(id, ACCIONES_CLIENTE.ACTIVAR_2FA, req);
      const adminId = getAdminId(req);
      if (adminId) registrarAuditoriaAdmin(adminId, ACCIONES_ADMIN.ACTIVAR_2FA_CLIENTE, req, `Cliente ID: ${id}`);
      res.json({ mensaje: "Doble autenticación activada" });
    }
  );
};

// ─── ADMIN: resetear Google Authenticator ────────────────────────────────────
const adminResetearTOTP = (req, res) => {
  const { id } = req.params;
  conexion.query(
    "UPDATE clientes SET totp_secret = NULL WHERE id = ?",
    [id],
    (err) => {
      if (err) return res.status(500).json(err);
      const adminId = getAdminId(req);
      if (adminId) registrarAuditoriaAdmin(adminId, ACCIONES_ADMIN.RESETEAR_GOOGLE_AUTH, req, `Cliente ID: ${id}`);
      res.json({ mensaje: "Google Authenticator reseteado. El cliente puede volver a configurarlo." });
    }
  );
};

// ─── TOTP: consultar si ya está configurado ───────────────────────────────────
const estadoTOTP = (req, res) => {
  const { cliente_id } = req.query;
  if (!cliente_id) return res.status(400).json({ mensaje: "cliente_id requerido" });

  conexion.query(
    "SELECT totp_secret FROM clientes WHERE id = ? AND activo = 1",
    [cliente_id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
      res.json({ configurado: !!rows[0].totp_secret });
    }
  );
};

// ─── Obtener preguntas del sistema ────────────────────────────────────────────
const obtenerPreguntas = (req, res) => {
  conexion.query("SELECT id, pregunta FROM preguntas_seguridad WHERE activo = 1", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

module.exports = {
  adminDesactivar2FA,
  adminActivar2FA,
  adminResetearTOTP,
  estadoTOTP,
  generarTOTPSecret,
  confirmarTOTP,
  verificarTOTP,
  enviarTokenDeRegistro,
  verificarTokenRegistro,
  verificarUsuario,
  registrarCliente,
  loginCliente,
  generarOTP,
  verificarOTP,
  buscarClienteRecuperar,
  verificarRespuestaRecuperar,
  cambiarPassword,
  buscarClienteUsuario,
  revelarUsuario,
  cambiarUsuario,
  miPerfil,
  obtenerPreguntas,
  registrarAccionCliente,
  cerrarSesionCliente,
};