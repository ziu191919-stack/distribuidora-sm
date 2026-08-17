import { useState, useEffect } from "react";

const SLIDES = [
  {
    imagen: "/onboarding-1.png",
    titulo: "Todo lo que necesitás, a un click",
    texto: "Amplia variedad de productos de limpieza y desinfección a los mejores precios de Costa Rica.",
  },
  {
    imagen: "/onboarding-2.png",
    titulo: "Precio mayorista para tu negocio",
    texto: "¿Pedís 50 unidades o más? Accedé a precios especiales pensados para comercios y negocios.",
  },
  {
    imagen: "/onboarding-3.png",
    titulo: "Te lo llevamos hasta la puerta",
    texto: "Entrega directa a tu casa o negocio, sin filas ni complicaciones.",
  },
];

const CLAVE_LOCALSTORAGE = "onboarding_visto";

function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [slideActual, setSlideActual] = useState(0);

  useEffect(() => {
    const yaVisto = localStorage.getItem(CLAVE_LOCALSTORAGE) === "true";
    if (!yaVisto) setVisible(true);
  }, []);

  const cerrar = () => {
    localStorage.setItem(CLAVE_LOCALSTORAGE, "true");
    setVisible(false);
  };

  const siguiente = () => {
    if (slideActual < SLIDES.length - 1) {
      setSlideActual((s) => s + 1);
    } else {
      cerrar();
    }
  };

  if (!visible) return null;

  const slide = SLIDES[slideActual];
  const esUltimo = slideActual === SLIDES.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "linear-gradient(135deg, #1a3a2a 0%, #2d6a4f 55%, #3fb6c9 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
    >
      <button
        onClick={cerrar}
        aria-label="Saltar introducción"
        style={{
          position: "absolute",
          top: "1.5rem",
          right: "1.5rem",
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.35)",
          color: "#ffffff",
          padding: "8px 18px",
          borderRadius: "100px",
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Saltar
      </button>

      <div
        key={slideActual}
        style={{
          textAlign: "center",
          maxWidth: "420px",
          animation: "onboardingFade 0.4s ease-out",
        }}
      >
        <div
          style={{
            width: "220px",
            height: "220px",
            borderRadius: "24px",
            background: "rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2rem",
            overflow: "hidden",
          }}
        >
          <img
            src={slide.imagen}
            alt={slide.titulo}
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: "12px" }}
          />
        </div>

        <h2 style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.7rem", marginBottom: "1rem" }}>
          {slide.titulo}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem", lineHeight: 1.6 }}>
          {slide.texto}
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", margin: "2.5rem 0" }}>
        {SLIDES.map((_, i) => (
          <span
            key={i}
            style={{
              width: i === slideActual ? "24px" : "8px",
              height: "8px",
              borderRadius: "100px",
              background: i === slideActual ? "#ffffff" : "rgba(255,255,255,0.4)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      <button
        onClick={siguiente}
        style={{
          background: "#ffffff",
          color: "#1a3a2a",
          border: "none",
          padding: "14px 40px",
          borderRadius: "100px",
          fontSize: "1rem",
          fontWeight: 700,
          cursor: "pointer",
          minWidth: "200px",
        }}
      >
        {esUltimo ? "Comenzar" : "Siguiente"}
        {!esUltimo && <i className="bi bi-arrow-right ms-2"></i>}
      </button>

      <style>{`
        @keyframes onboardingFade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Onboarding;