const axios = require("axios");

// Brevo usa una API HTTPS (no SMTP), mucho mas confiable desde servidores
// en la nube como Render — evita los bloqueos/filtros de spam que tenia
// el envio directo por Gmail hacia otros proveedores como Hotmail.
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

const enviarEmail = async ({ to, subject, html }) => {
  if (!process.env.BREVO_API_KEY) {
    console.log("========================================");
    console.log("EMAIL (modo local sin credenciales)");
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Contenido: ${html.replace(/<[^>]+>/g, "")}`);
    console.log("========================================");
    return { ok: true, simulado: true };
  }
  try {
    const inicio = Date.now();
    await axios.post(
      BREVO_URL,
      {
        sender: {
          name: "Distribuidora S.M",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    console.log(`Email enviado a ${to} en ${Date.now() - inicio}ms (Brevo)`);
    return { ok: true };
  } catch (error) {
    console.error("Error enviando email (Brevo):", error.response?.data || error.message);
    return { ok: false, error: error.response?.data || error.message };
  }
};

const enviarTokenRegistro = async ({ email, token }) => {
  return enviarEmail({
    to: email,
    subject: "Verificación de correo — Distribuidora S.M",
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;">
        <h2 style="color:#2d6a4f;">Distribuidora S.M</h2>
        <p>Para completar tu registro, ingresa el siguiente TOKEN de verificación:</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:0.3em;color:#1a3a2a;background:#d8f3dc;padding:20px;text-align:center;border-radius:8px;margin:24px 0;">
          ${token}
        </div>
        <p style="color:#666;">Si no solicitaste este registro, ignora este correo.</p>
      </body></html>
    `,
  });
};

const enviarOTP = async ({ email, nombre, codigo }) => {
  return enviarEmail({
    to: email,
    subject: "Código de verificación — Distribuidora S.M",
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;">
        <h2 style="color:#2d6a4f;">Distribuidora S.M</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu código de verificación es:</p>
        <div style="font-size:2.5rem;font-weight:bold;letter-spacing:0.4em;color:#1a3a2a;background:#d8f3dc;padding:20px;text-align:center;border-radius:8px;margin:24px 0;">
          ${codigo}
        </div>
        <p style="color:#666;">Expira en <strong>1 minuto</strong>.</p>
      </body></html>
    `,
  });
};

const enviarEmailResetPassword = async ({ nombre, email, token }) => {
  const enlace = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
  return enviarEmail({
    to: email,
    subject: "Recuperar contraseña — Distribuidora S.M",
    html: `<p>Hola ${nombre}, <a href="${enlace}">Restablecer contraseña</a>. Expira en 1 hora.</p>`,
  });
};

module.exports = { enviarTokenRegistro, enviarOTP, enviarEmailResetPassword };