/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Optimización de imágenes (next/image): permite las fotos del Storage de
  // Supabase y las sirve redimensionadas en AVIF/WebP desde el CDN de Vercel.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
    formats: ["image/avif", "image/webp"],
  },

  // No publicar source maps del cliente en producción: reduce el tamaño/tiempo
  // de build y evita exponer el código original. (Dev sigue con sourcemaps.)
  productionBrowserSourceMaps: false,

  compiler: {
    // En producción, elimina las llamadas a console.* (excepto error/warn) para
    // que no inflen el bundle ni hagan ruido en la consola del cliente.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

module.exports = nextConfig;
