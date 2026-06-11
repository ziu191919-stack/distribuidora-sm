const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const enviarEmailResetPassword = async ({ nombre, email, token }) => {
  const enlace = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;

  // Desarrollo local sin Resend
  if (!process.env.RESEND_API_KEY) {
    console.log("========================================");
    console.log("EMAIL DE RESET (modo local sin API key)");
    console.log(`Para: ${email}`);
    console.log(`Enlace: ${enlace}`);
    console.log("========================================");

    return {
      ok: true,
      simulado: true,
      enlace,
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "Distribuidora S.M <noreply@distribuidorasm.com>",
      to: email,
      subject: "Recuperar contraseña - Distribuidora S.M",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <h2>Hola, ${nombre}</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>
            <a href="${enlace}">
              Restablecer contraseña
            </a>
          </p>
          <p>Este enlace expira en 1 hora.</p>
        </body>
        </html>
      `,
    });

    if (error) throw error;

    return {
      ok: true,
      data,
    };
  } catch (error) {
    console.error("Error enviando email:", error);

    return {
      ok: false,
      error,
    };
  }
};

module.exports = { enviarEmailResetPassword };