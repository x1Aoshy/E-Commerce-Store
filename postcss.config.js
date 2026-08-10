// Tailwind v4 se conecta a PostCSS por su propio paquete (`@tailwindcss/postcss`)
// en vez de por `tailwindcss` directamente. Autoprefixer ya no va: v4 lo lleva
// dentro (usa Lightning CSS), y dejarlo duplicaba trabajo sobre el mismo CSS.
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
