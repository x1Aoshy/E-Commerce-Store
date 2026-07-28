"use client";

// "Vuelo al carrito": al agregar un producto, un fantasma de su foto sale
// volando hacia el ícono del carrito. Es la confirmación más honesta que
// existe en un ecommerce — el cliente VE a dónde fue lo que agregó, así que
// no vuelve a tocar el botón dudando si funcionó.
//
// Implementación deliberadamente barata: se clona el nodo una sola vez, se
// anima con transform/opacity (compositor puro) y se destruye al terminar.
// Nada de librerías ni de estado en React.

const CART_ANCHOR = "[data-cart-anchor]";

export function flyToCart(sourceEl: HTMLElement | null | undefined) {
  if (typeof window === "undefined" || !sourceEl) return;

  // Si el usuario pidió menos movimiento, no hay vuelo. La animación del
  // contador del header ya le confirma la acción.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const target = document.querySelector(CART_ANCHOR) as HTMLElement | null;
  if (!target) return;

  const from = sourceEl.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width === 0 || from.height === 0) return;

  const ghost = sourceEl.cloneNode(true) as HTMLElement;
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.position = "fixed";
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;
  ghost.style.margin = "0";
  ghost.style.zIndex = "60";
  ghost.style.pointerEvents = "none";
  ghost.style.borderRadius = "0";
  ghost.style.objectFit = "cover";
  ghost.style.willChange = "transform, opacity";

  // Delta hasta el centro del ícono del carrito.
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  ghost.style.setProperty("--fly-x", `${dx}px`);
  ghost.style.setProperty("--fly-y", `${dy}px`);
  ghost.style.animation = "fly-to-cart 720ms cubic-bezier(0.55, 0, 0.35, 1) forwards";

  document.body.appendChild(ghost);

  const cleanup = () => ghost.remove();
  ghost.addEventListener("animationend", cleanup, { once: true });
  // Red de seguridad: si la pestaña se oculta, `animationend` puede no llegar.
  setTimeout(cleanup, 1200);
}
