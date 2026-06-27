/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Tokens semánticos manejados por variables CSS (ver globals.css), para
        // alternar entre tema OSCURO (por defecto) y CLARO sin reescribir las
        // clases. `<alpha-value>` conserva la opacidad (text-ink/70, bg-night/55…).
        // `ink` es el TEXTO; `night` el fondo de página.
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          soft: "rgb(var(--c-ink-soft) / <alpha-value>)",
          muted: "rgb(var(--c-ink-muted) / <alpha-value>)",
        },
        night: "rgb(var(--c-night) / <alpha-value>)", // fondo de página
        surface: {
          DEFAULT: "rgb(var(--c-surface) / <alpha-value>)", // tarjetas / paneles
          soft: "rgb(var(--c-surface-soft) / <alpha-value>)", // elevado / hover
        },
        // Líneas/bordes y rellenos sutiles que se invierten con el tema: en
        // oscuro son blancos (como antes); en claro, casi negros. Reemplazan a
        // border-white/x, bg-white/x, divide-white/x y ring-white/x.
        line: "rgb(var(--c-line) / <alpha-value>)",
        fill: "rgb(var(--c-fill) / <alpha-value>)",
        accent: {
          50: "#fbf5e3",
          100: "#f6e9bd",
          200: "#efd886",
          300: "#e7c454",
          400: "#dab23a",
          500: "#c99a2b",
          600: "#a87e22",
          700: "#86631d",
          800: "#6a4e1b",
          900: "#564019",
        },
        green: {
          300: "#5cc99a",
          400: "#3fae7a",
          500: "#2f9d77",
          600: "#1f7d5f",
          700: "#1a634c",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-nunito)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Títulos: serif suave y natural.
        display: ["var(--font-fraunces)", "Georgia", "Cambria", "serif"],
      },
      maxWidth: {
        content: "1180px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.30)",
        card: "0 2px 6px rgba(0,0,0,0.45), 0 18px 44px rgba(0,0,0,0.40)",
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
      },
      animation: {
        "fade-in": "fade-in 0.5s ease forwards",
        "slide-in": "slide-in 0.28s cubic-bezier(0.22,1,0.36,1) forwards",
        pop: "pop 0.32s cubic-bezier(0.22,1,0.36,1)",
        "scale-in": "scale-in 0.24s ease forwards",
        "cart-bump": "cart-bump 0.45s ease",
      },
    },
  },
  plugins: [],
};
