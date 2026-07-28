/** @type {import('tailwindcss').Config} */

// ============================================================================
// SISTEMA DE DISEÑO · "CARBON & 24K"
// ----------------------------------------------------------------------------
// Dirección: tienda deportiva editorial. Tipografía de póster condensada, mucho
// contraste, geometría RECTA (cero radio) para lo estructural y PÍLDORAS para
// lo interactivo secundario. Ese contraste duro/blando es la firma de la marca.
//
// Los colores viven en variables CSS (globals.css) para que el tema claro sea
// una inversión de tokens y no una reescritura de clases.
// ============================================================================

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // --- Tokens semánticos (cambian con el tema) -----------------------
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)", // texto principal
          soft: "rgb(var(--c-ink-soft) / <alpha-value>)",
          muted: "rgb(var(--c-ink-muted) / <alpha-value>)",
        },
        night: "rgb(var(--c-night) / <alpha-value>)", // fondo de página
        surface: {
          DEFAULT: "rgb(var(--c-surface) / <alpha-value>)", // tarjetas
          soft: "rgb(var(--c-surface-soft) / <alpha-value>)", // elevado / hover
        },
        line: "rgb(var(--c-line) / <alpha-value>)", // bordes y reglas
        fill: "rgb(var(--c-fill) / <alpha-value>)", // rellenos sutiles

        // --- ORO 24K · marca, precio, premium ------------------------------
        // Más saturado y luminoso que el dorado anterior: se lee como metal,
        // no como mostaza. Es el color de la MARCA, no el de la urgencia.
        accent: {
          50: "#fef9e8",
          100: "#fcefc0",
          200: "#f9e08a",
          300: "#f6ce4e",
          400: "#f0b92a",
          500: "#db9e13",
          600: "#b27c0c",
          700: "#8a5e0d",
          800: "#664611",
          900: "#4a3311",
        },

        // --- BRASA · urgencia: ofertas, contadores, "últimas unidades" ------
        // El color que EMPUJA. Nunca decora: si aparece, hay algo que perder.
        ember: {
          100: "#ffe3d6",
          200: "#ffc0a3",
          300: "#ff9a6b",
          400: "#ff6b35",
          500: "#f04e1e",
          600: "#c93a12",
          700: "#9c2c0e",
        },

        // --- VERDE · confianza: stock, WhatsApp, confirmaciones ------------
        green: {
          200: "#a7f3cd",
          300: "#5fe0a0",
          400: "#25d366", // verde WhatsApp exacto
          500: "#1eb955",
          600: "#128c7e",
          700: "#0b6e45",
        },
      },

      fontFamily: {
        // Texto e interfaz: Manrope (geométrica, cifras excelentes para precios).
        sans: [
          "var(--font-manrope)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Titulares de póster: Anton (condensada, atlética). Se usa a propósito,
        // no por defecto — los h1/h2 del panel admin siguen en Manrope.
        display: ["var(--font-anton)", "Impact", "Haettenschweiler", "sans-serif"],
        // Micro-etiquetas técnicas (lote, SKU, "PROTEÍNA 24G"): sabor laboratorio.
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      letterSpacing: {
        headline: "-0.02em",
        widest2: "0.22em",
      },

      // Escala de opacidad al 1%: el sistema se apoya en hairlines y velos muy
      // finos (border-line/12, bg-night/92…) y la escala por defecto de
      // Tailwind salta de 10 a 20, que es demasiado grueso para eso. JIT sólo
      // emite las clases que realmente se usan, así que no infla el CSS.
      opacity: Object.fromEntries(
        Array.from({ length: 101 }, (_, i) => [i, String(i / 100)])
      ),

      maxWidth: {
        content: "1280px",
        prose2: "68ch",
      },

      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / 0.30), 0 10px 30px rgb(0 0 0 / 0.22)",
        card: "0 2px 8px rgb(0 0 0 / 0.35), 0 24px 60px rgb(0 0 0 / 0.35)",
        // Sombra "dura" tipo cartel serigrafiado: la firma brutalista.
        hard: "6px 6px 0 0 rgb(var(--c-line) / 0.9)",
        "hard-sm": "3px 3px 0 0 rgb(var(--c-line) / 0.9)",
        glow: "0 0 0 1px rgb(240 185 42 / 0.35), 0 12px 40px -8px rgb(240 185 42 / 0.45)",
      },

      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.5)", opacity: "0.4" },
          "60%": { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "cart-bump": {
          "0%, 100%": { transform: "scale(1) rotate(0deg)" },
          "30%": { transform: "scale(1.18) rotate(-7deg)" },
          "60%": { transform: "scale(0.94) rotate(5deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(-6px)" },
          "50%": { transform: "translateY(8px)" },
        },

        // --- Motion nueva -------------------------------------------------
        // Cinta infinita: se duplica el contenido y se desplaza media pista.
        marquee: {
          from: { transform: "translate3d(0,0,0)" },
          to: { transform: "translate3d(-50%,0,0)" },
        },
        // Zoom lentísimo tipo documental: da vida "de video" a una foto fija.
        "ken-burns": {
          "0%": { transform: "scale(1) translate3d(0,0,0)" },
          "50%": { transform: "scale(1.09) translate3d(-1.5%,-1%,0)" },
          "100%": { transform: "scale(1) translate3d(0,0,0)" },
        },
        // Barrido de luz sobre botones y tarjetas (metal pulido).
        sheen: {
          "0%": { transform: "translateX(-120%) skewX(-18deg)" },
          "100%": { transform: "translateX(220%) skewX(-18deg)" },
        },
        // Línea de escaneo que recorre el hero: sensación de metraje en vivo.
        scan: {
          "0%": { transform: "translateY(-10%)", opacity: "0" },
          "12%": { opacity: "0.5" },
          "88%": { opacity: "0.5" },
          "100%": { transform: "translateY(110%)", opacity: "0" },
        },
        // Anillo que se expande (punto de "en vivo" / stock).
        "pulse-ring": {
          "0%": { transform: "scale(0.7)", opacity: "0.8" },
          "80%, 100%": { transform: "scale(2.4)", opacity: "0" },
        },
        // Degradado que se desplaza: fondo "vivo" sin video.
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        // Deriva lenta de una masa de luz (capa de ambiente del hero).
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(4%,-3%,0) scale(1.08)" },
          "66%": { transform: "translate3d(-3%,4%,0) scale(0.96)" },
        },
        // Entrada de titular por palabras (máscara que sube).
        "word-up": {
          from: { transform: "translateY(110%) rotate(3deg)", opacity: "0" },
          to: { transform: "translateY(0) rotate(0)", opacity: "1" },
        },
        // Contador / dígitos que cambian.
        "digit-in": {
          from: { transform: "translateY(60%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        // Barra de progreso que se llena (envío gratis).
        "bar-fill": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        // Rebote sutil de flecha (scroll hint).
        "nudge-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(6px)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        // Parpadeo de neón muy leve para el badge "EN VIVO".
        flicker: {
          "0%, 100%": { opacity: "1" },
          "45%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },

      animation: {
        "fade-in": "fade-in 0.5s ease forwards",
        "slide-in": "slide-in 0.28s cubic-bezier(0.22,1,0.36,1) forwards",
        pop: "pop 0.32s cubic-bezier(0.22,1,0.36,1)",
        "scale-in": "scale-in 0.24s ease forwards",
        "cart-bump": "cart-bump 0.45s ease",
        float: "float 6s ease-in-out infinite",

        marquee: "marquee var(--marquee-duration, 32s) linear infinite",
        "ken-burns": "ken-burns 22s ease-in-out infinite",
        sheen: "sheen 1.1s ease-out",
        scan: "scan 5.5s linear infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.22,1,0.36,1) infinite",
        "gradient-pan": "gradient-pan 14s ease infinite",
        drift: "drift 24s ease-in-out infinite",
        "word-up": "word-up 0.8s cubic-bezier(0.22,1,0.36,1) both",
        "digit-in": "digit-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "bar-fill": "bar-fill 0.9s cubic-bezier(0.22,1,0.36,1) both",
        "nudge-y": "nudge-y 1.8s ease-in-out infinite",
        "spin-slow": "spin-slow 18s linear infinite",
        flicker: "flicker 3.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
