import { useState, useEffect } from "react";

const API_BASE = "http://localhost:3000/ubicaciones";

async function obtenerJSON(url) {
    const respuesta = await fetch(url);
    return respuesta.json();
}

// valorInicial (opcional): { idPais, idProvincia, idCanton, idDistrito }
// Se usa para precargar una ubicacion ya guardada (ej: editar cliente existente)
export default function UbicacionCascada({ valorInicial, onSeleccionCompleta }) {
    const [paises, setPaises] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [cantones, setCantones] = useState([]);
    const [distritos, setDistritos] = useState([]);

    const [idPais, setIdPais] = useState("");
    const [idProvincia, setIdProvincia] = useState("");
    const [idCanton, setIdCanton] = useState("");
    const [idDistrito, setIdDistrito] = useState("");

    const [cargando, setCargando] = useState({
        paises: false,
        provincias: false,
        cantones: false,
        distritos: false
    });

    // Carga inicial: paises, y si hay valorInicial, precarga la cadena completa
    useEffect(() => {
        let activo = true;
        async function inicializar() {
            setCargando((prev) => ({ ...prev, paises: true }));
            try {
                const listaPaises = await obtenerJSON(`${API_BASE}/paises`);
                if (!activo) return;
                setPaises(listaPaises);
            } catch (error) {
                console.error("Error al cargar paises:", error);
            } finally {
                if (activo) setCargando((prev) => ({ ...prev, paises: false }));
            }

            if (!valorInicial || !valorInicial.idPais) return;

            setIdPais(String(valorInicial.idPais));
            setCargando((prev) => ({ ...prev, provincias: true }));
            try {
                const listaProvincias = await obtenerJSON(`${API_BASE}/provincias/${valorInicial.idPais}`);
                if (!activo) return;
                setProvincias(listaProvincias);
            } catch (error) {
                console.error("Error al cargar provincias:", error);
            } finally {
                if (activo) setCargando((prev) => ({ ...prev, provincias: false }));
            }

            if (!valorInicial.idProvincia) return;

            setIdProvincia(String(valorInicial.idProvincia));
            setCargando((prev) => ({ ...prev, cantones: true }));
            try {
                const listaCantones = await obtenerJSON(`${API_BASE}/cantones/${valorInicial.idProvincia}`);
                if (!activo) return;
                setCantones(listaCantones);
            } catch (error) {
                console.error("Error al cargar cantones:", error);
            } finally {
                if (activo) setCargando((prev) => ({ ...prev, cantones: false }));
            }

            if (!valorInicial.idCanton) return;

            setIdCanton(String(valorInicial.idCanton));
            setCargando((prev) => ({ ...prev, distritos: true }));
            try {
                const listaDistritos = await obtenerJSON(`${API_BASE}/distritos/${valorInicial.idCanton}`);
                if (!activo) return;
                setDistritos(listaDistritos);
            } catch (error) {
                console.error("Error al cargar distritos:", error);
            } finally {
                if (activo) setCargando((prev) => ({ ...prev, distritos: false }));
            }

            if (valorInicial.idDistrito) setIdDistrito(String(valorInicial.idDistrito));
        }
        inicializar();
        return () => { activo = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Notifica al padre cada vez que cambia algun nivel, incluyendo los nombres
    useEffect(() => {
        if (onSeleccionCompleta) {
            const nombrePais = paises.find((p) => String(p.id_pais) === String(idPais))?.nombre || "";
            const nombreProvincia = provincias.find((p) => String(p.id_provincia) === String(idProvincia))?.nombre || "";
            const nombreCanton = cantones.find((c) => String(c.id_canton) === String(idCanton))?.nombre || "";
            const nombreDistrito = distritos.find((d) => String(d.id_distrito) === String(idDistrito))?.nombre || "";
            onSeleccionCompleta({
                idPais, idProvincia, idCanton, idDistrito,
                nombrePais, nombreProvincia, nombreCanton, nombreDistrito
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idPais, idProvincia, idCanton, idDistrito, paises, provincias, cantones, distritos]);

    // Cambio de pais: refresca solo provincias
    const handleCambioPais = async (e) => {
        const nuevoIdPais = e.target.value;
        setIdPais(nuevoIdPais);
        setIdProvincia(""); setProvincias([]);
        setIdCanton(""); setCantones([]);
        setIdDistrito(""); setDistritos([]);
        if (!nuevoIdPais) return;

        setCargando((prev) => ({ ...prev, provincias: true }));
        try {
            const lista = await obtenerJSON(`${API_BASE}/provincias/${nuevoIdPais}`);
            setProvincias(lista);
        } catch (error) {
            console.error("Error al cargar provincias:", error);
        } finally {
            setCargando((prev) => ({ ...prev, provincias: false }));
        }
    };

    // Cambio de provincia: refresca solo cantones
    const handleCambioProvincia = async (e) => {
        const nuevoIdProvincia = e.target.value;
        setIdProvincia(nuevoIdProvincia);
        setIdCanton(""); setCantones([]);
        setIdDistrito(""); setDistritos([]);
        if (!nuevoIdProvincia) return;

        setCargando((prev) => ({ ...prev, cantones: true }));
        try {
            const lista = await obtenerJSON(`${API_BASE}/cantones/${nuevoIdProvincia}`);
            setCantones(lista);
        } catch (error) {
            console.error("Error al cargar cantones:", error);
        } finally {
            setCargando((prev) => ({ ...prev, cantones: false }));
        }
    };

    // Cambio de canton: refresca solo distritos
    const handleCambioCanton = async (e) => {
        const nuevoIdCanton = e.target.value;
        setIdCanton(nuevoIdCanton);
        setIdDistrito(""); setDistritos([]);
        if (!nuevoIdCanton) return;

        setCargando((prev) => ({ ...prev, distritos: true }));
        try {
            const lista = await obtenerJSON(`${API_BASE}/distritos/${nuevoIdCanton}`);
            setDistritos(lista);
        } catch (error) {
            console.error("Error al cargar distritos:", error);
        } finally {
            setCargando((prev) => ({ ...prev, distritos: false }));
        }
    };

    const handleCambioDistrito = (e) => {
        setIdDistrito(e.target.value);
    };

    return (
        <div className="ubicacion-cascada">
            <div className="row g-3">
                <div className="col-md-6">
                    <label className="form-label fw-semibold">Pais</label>
                    <select
                        className="form-select"
                        value={idPais}
                        onChange={handleCambioPais}
                        disabled={cargando.paises}
                    >
                        <option value="">
                            {cargando.paises ? "Cargando paises..." : "Seleccione un pais"}
                        </option>
                        {paises.map((p) => (
                            <option key={p.id_pais} value={p.id_pais}>{p.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="col-md-6">
                    <label className="form-label fw-semibold">Provincia</label>
                    <select
                        className="form-select"
                        value={idProvincia}
                        onChange={handleCambioProvincia}
                        disabled={!idPais || cargando.provincias}
                    >
                        <option value="">
                            {cargando.provincias ? "Cargando provincias..." : "Seleccione una provincia"}
                        </option>
                        {provincias.map((p) => (
                            <option key={p.id_provincia} value={p.id_provincia}>{p.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="col-md-6">
                    <label className="form-label fw-semibold">Canton</label>
                    <select
                        className="form-select"
                        value={idCanton}
                        onChange={handleCambioCanton}
                        disabled={!idProvincia || cargando.cantones}
                    >
                        <option value="">
                            {cargando.cantones ? "Cargando cantones..." : "Seleccione un canton"}
                        </option>
                        {cantones.map((c) => (
                            <option key={c.id_canton} value={c.id_canton}>{c.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="col-md-6">
                    <label className="form-label fw-semibold">Distrito</label>
                    <select
                        className="form-select"
                        value={idDistrito}
                        onChange={handleCambioDistrito}
                        disabled={!idCanton || cargando.distritos}
                    >
                        <option value="">
                            {cargando.distritos ? "Cargando distritos..." : "Seleccione un distrito"}
                        </option>
                        {distritos.map((d) => (
                            <option key={d.id_distrito} value={d.id_distrito}>{d.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}