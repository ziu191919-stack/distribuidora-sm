import { useState } from "react";

function ClienteModal({ cliente, cerrarModal, guardarCliente }) {
  const [nombre, setNombre] = useState(cliente?.nombre || "");
  const [cedula, setCedula] = useState(cliente?.cedula || "");
  const [email, setEmail] = useState(cliente?.email || "");
  const [telefono, setTelefono] = useState(cliente?.telefono || "");
  const [direccion, setDireccion] = useState(cliente?.direccion || "");
  const [esMayorista, setEsMayorista] = useState(cliente?.es_mayorista || 0);

  const guardar = () => {
    if (!nombre.trim() || !telefono.trim()) {
      alert("Nombre y teléfono son obligatorios");
      return;
    }
    if (telefono.replace(/\D/g, "").length !== 8) {
      alert("El teléfono debe tener 8 dígitos");
      return;
    }
    if (cedula && !/^\d{9,12}$/.test(cedula)) {
      alert("La cédula debe tener entre 9 y 12 números");
      return;
    }
    guardarCliente({
      id: cliente?.id,
      nombre,
      cedula: cedula || null,
      email: email || null,
      telefono,
      direccion,
      es_mayorista: esMayorista,
    });
  };

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1040 }}
        onClick={cerrarModal}
      />
      <div
        className="position-fixed top-50 start-50 translate-middle"
        style={{ zIndex: 1050, width: "95%", maxWidth: "600px" }}
      >
        <div className="card shadow-lg border-0">
          <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-person-gear me-2"></i>Editar Cliente
            </h5>
            <button className="btn-close btn-close-white" onClick={cerrarModal} />
          </div>

          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Nombre completo</label>
                <input type="text" className="form-control"
                  value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Cédula</label>
                <input type="text" className="form-control"
                  placeholder="Ej: 123456789"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                  maxLength={12}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Teléfono</label>
                <input type="text" className="form-control"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                  maxLength={8}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Email</label>
                <input type="email" className="form-control"
                  placeholder="correo@ejemplo.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Dirección</label>
                <input type="text" className="form-control"
                  value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>

              <div className="col-12">
                <div className="form-check form-switch mt-1">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="esMayoristaSwitch"
                    checked={esMayorista === 1}
                    onChange={(e) => setEsMayorista(e.target.checked ? 1 : 0)}
                    style={{ width: "48px", height: "24px" }}
                  />
                  <label className="form-check-label ms-2 fw-semibold" htmlFor="esMayoristaSwitch">
                    Cliente mayorista
                  </label>
                </div>
                <small className="text-muted">
                  Los mayoristas reciben precio especial en pedidos de 50+ unidades
                </small>
              </div>
            </div>
          </div>

          <div className="card-footer text-end">
            <button className="btn btn-secondary me-2" onClick={cerrarModal}>Cancelar</button>
            <button className="btn btn-success" onClick={guardar}>
              <i className="bi bi-check-circle-fill me-1"></i>Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ClienteModal;
