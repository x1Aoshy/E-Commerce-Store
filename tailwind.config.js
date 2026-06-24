/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Tema OSCURO premium. `ink` ahora es el TEXTO (claro), así la mayoría
        // de las clases existentes (text-ink, border-ink/x, bg-ink/5...) se
        // invierten solas y quedan correctas sobre fondo oscuro.
        ink: {
          DEFAULT: "#e9ebec",
          soft: "#a6adb1",
          muted: "#6f777c",
        },
        night: "#0a0c0d", // fondo de página (casi negro)
        surface: {
          DEFAULT: "#14181a", // tarjetas / paneles
          soft: "#1b2125", // elevado / hover
        },
        accent: {
          50: "#e7fdef",
          100: "#c4f8d9",
          200: "#8ff0b6",
          300: "#54e58f",
          400: "#2bd673",
          500: "#17bd60",
          600: "#119d50",
          700: "#0f7d41",
          800: "#0d6035",
          900: "#0a4a2a",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
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
      },
      animation: {
        "fade-in": "fade-in 0.5s ease forwards",
        "slide-in": "slide-in 0.28s cubic-bezier(0.22,1,0.36,1) forwards",
        pop: "pop 0.32s cubic-bezier(0.22,1,0.36,1)",
        "scale-in": "scale-in 0.24s ease forwards",
      },
    },
  },
  plugins: [],
};
