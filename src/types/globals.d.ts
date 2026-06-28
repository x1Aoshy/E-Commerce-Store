// Declaraciones ambientales para importaciones de efecto secundario que
// TypeScript no resuelve por sí solo (hojas de estilo globales, etc.).
// No cambia el runtime: sólo silencia el chequeo de tipos del import de CSS.

declare module "*.css";
