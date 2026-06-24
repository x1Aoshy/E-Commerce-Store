/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#15191c",
          soft: "#3a4145",
          muted: "#6b7280",
        },
        accent: {
          50: "#f0faf6",
          100: "#dcf3e9",
          200: "#bce6d4",
          300: "#8fd3b8",
          400: "#57b894",
          500: "#2f9d77",
          600: "#1f7d5f",
          700: "#1a634c",
          800: "#17503e",
          900: "#144234",
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
        soft: "0 1px 2px rgba(21,25,28,0.04), 0 8px 24px rgba(21,25,28,0.06)",
        card: "0 1px 3px rgba(21,25,28,0.06), 0 12px 32px rgba(21,25,28,0.05)",
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
