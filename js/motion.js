/* ===== Microinteracciones con Motion (motion.dev) =====
   js/vendor/motion.mjs es Motion 14.3 para JavaScript puro (animate, inView y stagger),
   empaquetado una sola vez con esbuild en un módulo ES (ver NOTAS al final).
   - Entrada suave de lo que aparece al hacer scroll, escalonada si entra junto
     (en cada expediente entran por turno la captura, el texto y la ficha)
   - Barras de habilidades que se llenan al llegar a la sección (scaleX)
   - Expedientes que entran escalonados al usar los filtros de Proyectos
   - Botones, tarjetas y capturas al pasar el mouse o al tocar
   Solo se animan transform y opacity, con duraciones de 200 a 600 ms.
   - Icono del tema que gira al cambiar entre día y noche
   La entrada del inicio sigue en CSS: así se pinta sin esperar a este módulo.
   Con prefers-reduced-motion no se anima nada y todo queda en su estado final.
   Si este módulo no carga, el sitio se ve completo y el hover lo hace el CSS (html:not(.motion)). */
import { animate, inView, stagger } from './vendor/motion.mjs';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

// Mismas curvas que el CSS
const EASE = [0.2, 0.7, 0.2, 1];
const spring = d => ({ type: 'spring', visualDuration: d, bounce: 0.25 });

/* ---------- Entrada al hacer scroll ---------- */
const REVEAL = [
  'main > section:not(.hero) > .wrap > h2',
  '.section-intro',
  '.about .photo', '.about .wrap > div:last-child',
  '.service', '.step', '.expediente > *', '.testimonials-soon',
  '.journey-grid > div', '.skills-grid > div',
  '.contact-direct', '.contact form'
].join(',');

// Lo que entra en el mismo cuadro se anima junto, escalonado
let queue = [];
function reveal(el) {
  if (!queue.length) requestAnimationFrame(() => {
    const batch = queue;
    queue = [];
    animate(batch, { opacity: [0, 1], y: [16, 0] }, { duration: 0.5, ease: EASE, delay: stagger(0.08) });
  });
  queue.push(el);
}

// Entradas que aún esperan a que el elemento llegue a la pantalla (los filtros las cancelan)
const pending = new Map();

function reveals() {
  // Solo lo que empieza debajo de la pantalla: lo visible al cargar no parpadea
  const items = [...document.querySelectorAll(REVEAL)].filter(el => el.getBoundingClientRect().top > innerHeight);
  items.forEach(el => {
    el.style.opacity = '0';
    const stop = inView(el, () => { reveal(el); stop(); pending.delete(el); }, { amount: 0.15 });
    pending.set(el, stop);
  });
}

/* ---------- Barras de habilidades ---------- */
function skillBars() {
  const skills = document.querySelector('.skills');
  if (!skills || skills.getBoundingClientRect().top < innerHeight) return;
  const bars = [...skills.querySelectorAll('.bar i[data-level]')];
  // El ancho lo pone el CSS (--level); aquí solo se escala desde la izquierda, sin recalcular el diseño
  bars.forEach(bar => { bar.style.transform = 'scaleX(0)'; });
  const stop = inView(skills, () => {
    animate(bars, { scaleX: [0, 1] }, { duration: 0.6, ease: EASE, delay: stagger(0.04, { startDelay: 0.15 }) });
    stop();
  }, { amount: 0.3 });
}

/* ---------- Hover y toque ---------- */
// Se delega en el documento: las opciones de Noir se crean después
const PRESS = '.btn, .theme-btn, .menu-btn, .wa-float, .noir-toggle, .noir-option, .noir-back, .socials a';
const LIFT = '.btn-primary, .btn-ghost, .wa-float, .noir-toggle, .shot, .service, .step';
const LIFT_CARD = '.shot, .service, .step';  // las tarjetas suben 4px; los botones, 2px

function interactions() {
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest(PRESS);
    if (!el) return;
    animate(el, { scale: 0.96 }, { duration: 0.2, ease: EASE });
    const up = () => {
      animate(el, { scale: 1 }, spring(0.3));
      el.removeEventListener('pointerleave', up);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointerleave', up);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  });

  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;  // en el celular: solo el toque
  const lift = (e, on) => {
    const el = e.target.closest(LIFT);
    if (!el || el.contains(e.relatedTarget)) return;
    animate(el, { y: on ? (el.matches(LIFT_CARD) ? -4 : -2) : 0 }, spring(0.35));
  };
  document.addEventListener('pointerover', e => lift(e, true));
  document.addEventListener('pointerout', e => lift(e, false));
}

/* ---------- Filtros de Proyectos: los expedientes que quedan entran escalonados ---------- */
// main.js filtra y avisa con el evento proyectos:filtrados
function projectFilter() {
  document.addEventListener('proyectos:filtrados', e => {
    // Si alguna parte no había entrado aún con el scroll, entra ahora con su expediente
    e.detail.forEach(exp => {
      exp.querySelectorAll(':scope > *').forEach(el => {
        if (pending.has(el)) { pending.get(el)(); pending.delete(el); el.style.opacity = ''; }
      });
    });
    animate(e.detail, { opacity: [0, 1], y: [16, 0] }, { duration: 0.45, ease: EASE, delay: stagger(0.06) });
  });
}

/* ---------- Cambio de tema: el icono nuevo entra girando ---------- */
// main.js ya cambió el tema en su propio clic (se registró antes que este módulo)
function themeIcon() {
  const btn = document.querySelector('.theme-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const icon = btn.querySelector(root.getAttribute('data-theme') === 'dark' ? '.icon-sun' : '.icon-moon');
    animate(icon, { rotate: [-90, 0], scale: [0.5, 1], opacity: [0, 1] }, spring(0.4));
  });
}

/* ---------- Arranque ---------- */
if (!reduce) {
  root.classList.add('motion');
  interactions();
  themeIcon();
  projectFilter();
  reveals();
  skillBars();
}

/* NOTAS: para actualizar js/vendor/motion.mjs, en una carpeta aparte:
     npm i motion
     echo 'export { animate, inView, stagger } from "motion";' > entry.mjs
     npx esbuild entry.mjs --bundle --format=esm --minify --outfile=motion.mjs
   y copia motion.mjs a js/vendor/. */
