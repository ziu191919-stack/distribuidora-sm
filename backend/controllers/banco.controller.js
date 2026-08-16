// controllers/banco.controller.js
//
// Antes: este controller le hacia una peticion HTTP a una API de Python
// aparte (Banco_API, puerto 8010) para validar tarjetas y SINPE.
// Esa separacion era un requisito especifico de la Semana 9 (12 APIs).
// Ahora, para que el pago funcione de forma simple y confiable en
// produccion, la misma logica vive directo aqui en Node — sin depender
// de otro servicio externo que haya que desplegar y mantener aparte.

// ---------- "Base de datos" simulada de tarjetas y cuentas SINPE ----------
const TARJETAS = {
  "4123456789012345": { titular: "Juan Pérez Rodríguez", vencimiento: "12/28", cvv: "123", saldo: 500000 },
  "5123456789012345": { titular: "María Gómez Vargas",   vencimiento: "06/27", cvv: "456", saldo: 300000 },
  "4111111111111111": { titular: "Carlos Solano Mora",   vencimiento: "03/29", cvv: "789", saldo: 10 },
  "5111111111111118": { titular: "Ana Jiménez Castro",   vencimiento: "09/26", cvv: "321", saldo: 5 },
};

const CUENTAS_SINPE = {
  "88887777": { titular: "Juan Pérez Rodríguez", saldo: 200000 },
  "88886666": { titular: "María Gómez Vargas",   saldo: 150000 },
  "88885555": { titular: "Carlos Solano Mora",   saldo: 3 },
};

function identificarTipoTarjeta(numero) {
  if (numero.startsWith("4")) return "Visa";
  if (numero.startsWith("5")) return "Mastercard";
  return "Desconocida";
}

// ---------- Tarjeta ----------
function postValidarTarjeta(req, res) {
  const { numero_tarjeta, fecha_vencimiento, cvv, monto } = req.body;

  if (!numero_tarjeta || !fecha_vencimiento || !cvv || !monto) {
    return res.status(400).json({ mensaje: "Faltan datos de la tarjeta" });
  }

  if (numero_tarjeta.length !== 16 || !/^\d+$/.test(numero_tarjeta)) {
    return res.json({
      existe: false,
      fondos_suficientes: false,
      aprobado: false,
      mensaje: "El número de tarjeta debe tener 16 dígitos.",
    });
  }

  const tipo = identificarTipoTarjeta(numero_tarjeta);
  const tarjeta = TARJETAS[numero_tarjeta];

  if (!tarjeta) {
    return res.json({
      existe: false,
      tipo_tarjeta: tipo,
      fondos_suficientes: false,
      aprobado: false,
      mensaje: "La tarjeta no existe en el sistema del banco.",
    });
  }

  const fondosSuficientes = tarjeta.saldo >= Number(monto);

  return res.json({
    existe: true,
    tipo_tarjeta: tipo,
    fondos_suficientes: fondosSuficientes,
    aprobado: fondosSuficientes,
    mensaje: fondosSuficientes ? "Pago aprobado." : "Fondos insuficientes en la tarjeta.",
    saldo_disponible: tarjeta.saldo,
  });
}

// ---------- SINPE ----------
function postValidarSinpe(req, res) {
  const { telefono, monto } = req.body;

  if (!telefono || !monto) {
    return res.status(400).json({ mensaje: "Faltan datos de SINPE" });
  }

  if (telefono.length !== 8 || !/^\d+$/.test(telefono)) {
    return res.json({
      existe: false,
      fondos_suficientes: false,
      aprobado: false,
      mensaje: "El número de teléfono debe tener 8 dígitos.",
    });
  }

  const cuenta = CUENTAS_SINPE[telefono];

  if (!cuenta) {
    return res.json({
      existe: false,
      fondos_suficientes: false,
      aprobado: false,
      mensaje: "El número no está asociado a ninguna cuenta bancaria.",
    });
  }

  const fondosSuficientes = cuenta.saldo >= Number(monto);

  return res.json({
    existe: true,
    fondos_suficientes: fondosSuficientes,
    aprobado: fondosSuficientes,
    mensaje: fondosSuficientes ? "Pago aprobado." : "Fondos insuficientes en la cuenta.",
    saldo_disponible: cuenta.saldo,
  });
}

module.exports = { postValidarTarjeta, postValidarSinpe };