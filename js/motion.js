/* ===== Microinteracciones con Motion (motion.dev) =====
   js/vendor/motion.mjs es Motion 14.3 para JavaScript puro (animate, inView y stagger),
   empaquetado una sola vez con esbuild en un módulo ES (ver NOTAS al final).
   - Entrada suave de lo que aparece al hacer scroll, escalonada si entra junto
   - Barras de habilidades que se llenan al llegar a la sección
   - Expedientes que entran escalonados al usar los filtros de Proyectos
   - Botones y capturas al pasar el mouse o al tocar
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
  '.service', '.step', '.expediente', '.testimonials-soon',
  '.journey-grid > div', '.skills-grid > div',
  '.contact-direct', '.contact form'
].join(',');

// Lo que entra en el mismo cuadro se anima junto, escalonado
let queue = [];
function reveal(el) {
  if (!queue.length) requestAnimationFrame(() => {
    const batch = queue;
    queue = [];
    animate(batch, { opacity: [0, 1], y: [24, 0] }, { duration: 0.7, ease: EASE, delay: stagger(0.08) });
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
  bars.forEach(bar => { bar.style.width = '0%'; });
  const stop = inView(skills, () => {
    bars.forEach((bar, i) => {
      animate(bar, { width: ['0%', bar.dataset.level + '%'] }, { duration: 1.2, ease: EASE, delay: 0.2 + i * 0.06 })
        .then(() => { bar.style.width = ''; });  // vuelve a mandar el CSS (--level)
    });
    stop();
  }, { amount: 0.3 });
}

/* ---------- Hover y toque ---------- */
// Se delega en el documento: las opciones de Noir se crean después
const PRESS = '.btn, .theme-btn, .menu-btn, .wa-float, .noir-toggle, .noir-option, .noir-back, .socials a';
const LIFT = '.btn-primary, .wa-float, .noir-toggle, .shot';

function interactions() {
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest(PRESS);
    if (!el) return;
    animate(el, { scale: 0.96 }, { duration: 0.12, ease: EASE });
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
    animate(el, { y: on ? (el.matches('.shot') ? -4 : -2) : 0 }, spring(0.35));
  };
  document.addEventListener('pointerover', e => lift(e, true));
  document.addEventListener('pointerout', e => lift(e, false));
}

/* ---------- Filtros de Proyectos: los expedientes que quedan entran escalonados ---------- */
// main.js filtra y avisa con el evento proyectos:filtrados
function projectFilter() {
  document.addEventListener('proyectos:filtrados', e => {
    // Si alguno no había entrado aún con el scroll, no se repite su entrada después
    e.detail.forEach(el => {
      if (pending.has(el)) { pending.get(el)(); pending.delete(el); }
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
