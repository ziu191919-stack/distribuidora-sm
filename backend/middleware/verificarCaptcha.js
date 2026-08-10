// Middleware de verificacion de reCAPTCHA v2
// Guardar en: backend/middleware/verificarCaptcha.js
// Requiere variable de entorno RECAPTCHA_SECRET_KEY en el .env del backend

const verificarCaptcha = async (req, res, next) => {
  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({ mensaje: "Debe completar el CAPTCHA" });
  }

  try {
    const parametros = new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captchaToken,
    });

    const respuesta = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: parametros,
    });

    const resultado = await respuesta.json();

    if (!resultado.success) {
      return res.status(400).json({ mensaje: "Verificacion de CAPTCHA fallida" });
    }

    next();
  } catch (error) {
    console.error("Error al verificar CAPTCHA:", error);
    return res.status(500).json({ mensaje: "Error al verificar CAPTCHA" });
  }
};

module.exports = verificarCaptcha;