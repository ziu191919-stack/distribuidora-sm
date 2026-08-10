const API = "http://localhost:3000/auth/clientes";

export const ACCIONES = {
  REALIZAR_PEDIDO:       19,
  CANCELAR_PEDIDO:       20,
  VER_HISTORIAL_PEDIDOS: 21,
  AGREGAR_AL_CARRITO:    22,
  VACIAR_CARRITO:        23,
  VER_DETALLE_PRODUCTO:  24,
  VER_CATALOGO:          25,
  FILTRAR_CATEGORIA:     26,
  VER_FACTURA:           27,
  ACTUALIZAR_CARRITO:    28,
};

export const registrar = async (accion_id, detalle = null) => {
  try {
    const clienteData = localStorage.getItem("cliente");
    const token = localStorage.getItem("token_cliente");
    if (!clienteData || !token) return;
    const cliente = JSON.parse(clienteData);
    await fetch(`${API}/registrar-accion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cliente_id: cliente.id, accion_id, detalle }),
    });
  } catch (e) { /* silencioso */ }
};