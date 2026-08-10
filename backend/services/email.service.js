const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const enviarEmail = async ({ to, subject, html }) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log("========================================");
    console.log("EMAIL (modo local sin credenciales)");
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Contenido: ${html.replace(/<[^>]+>/g, "")}`);
    console.log("========================================");
    return { ok: true, simulado: true };
  }
  try {
    await transporter.sendMail({
      from: `"Distribuidora S.M" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (error) {
    console.error("Error enviando email:", error);
    return { ok: false, error };
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