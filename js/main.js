// Año del footer
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Tema día / noche (el script inline del <head> ya aplicó el inicial)
const root = document.documentElement;
const themeBtn = document.querySelector('.theme-btn');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme, animate) {
  if (animate) {
    root.classList.add('theme-switching');
    clearTimeout(applyTheme.timer);
    applyTheme.timer = setTimeout(() => root.classList.remove('theme-switching'), 300);
  }
  root.setAttribute('data-theme', theme);
  themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche');
}
applyTheme(root.getAttribute('data-theme') || 'light', false);

themeBtn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next, true);
  try { localStorage.setItem('theme', next); } catch (e) { /* almacenamiento bloqueado: solo dura esta visita */ }
});

// Si el usuario no ha elegido, seguir los cambios del sistema
systemDark.addEventListener('change', e => {
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (err) {}
  if (!saved) applyTheme(e.matches ? 'dark' : 'light', true);
});

// Menú móvil (no existe en la página 404)
const btn = document.querySelector('.menu-btn');
const links = document.querySelector('.nav-links');
if (btn && links) {
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú');
  }));
}

// Barras de habilidades: se llenan al llegar a la sección
const skills = document.querySelector('.skills');
if (skills) new IntersectionObserver((entries, obs) => {
  if (entries[0].isIntersecting) { skills.classList.add('visible'); obs.disconnect(); }
}, { threshold: 0.3 }).observe(skills);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canObserve = 'IntersectionObserver' in window;

// Secciones: aparición suave una sola vez al entrar en pantalla
const revealSections = document.querySelectorAll('main > section:not(.hero)');
if (canObserve) {
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  revealSections.forEach(section => revealObs.observe(section));
} else {
  revealSections.forEach(section => section.classList.add('is-visible'));
}

// Línea de tiempo: la línea se dibuja y cada punto se enciende cuando la línea lo alcanza
const journey = document.querySelector('.journey');
const LINE_SECONDS = 1.6; // igual que la transición de .timeline::before en el CSS

function drawTimeline() {
  journey.querySelectorAll('.timeline').forEach(list => {
    const line = getComputedStyle(list, '::before');
    const start = parseFloat(line.top);
    const length = list.clientHeight - start - parseFloat(line.bottom);
    list.querySelectorAll('li').forEach(item => {
      const dot = parseFloat(getComputedStyle(item, '::before').top) + 5.5; // centro del punto de 11px
      const progress = Math.min(Math.max((item.offsetTop + dot - start) / length, 0), 1);
      item.style.setProperty('--dot-delay', (progress * LINE_SECONDS).toFixed(2) + 's');
    });
  });
  journey.classList.add('is-drawn');
}
if (journey) {
  if (canObserve) {
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { drawTimeline(); obs.disconnect(); }
    }, { threshold: 0.3 }).observe(journey);
  } else {
    journey.classList.add('is-drawn');
  }
}

// Botón flotante de WhatsApp: se oculta mientras Contacto está en pantalla (ahí ya hay uno grande)
const waFloat = document.querySelector('.wa-float');
const contacto = document.getElementById('contacto');
if (waFloat && contacto && canObserve) {
  new IntersectionObserver(entries => {
    waFloat.classList.toggle('is-hidden', entries[0].isIntersecting);
  }, { threshold: 0 }).observe(contacto);
}

// Modo noche, solo escritorio: resplandor de vela que sigue al cursor con retraso
if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const candle = document.createElement('div');
  candle.className = 'candle';
  candle.setAttribute('aria-hidden', 'true');
  document.body.appendChild(candle);

  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, frame = 0;
  const follow = () => {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    candle.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(follow) : 0;
  };
  document.addEventListener('mousemove', e => {
    if (root.getAttribute('data-theme') !== 'dark') return;
    tx = e.clientX; ty = e.clientY;
    if (!candle.classList.contains('on')) {
      // Primera aparición: nace bajo el cursor, sin cruzar la pantalla
      x = tx; y = ty;
      candle.classList.add('on');
    }
    if (!frame) frame = requestAnimationFrame(follow);
  });
  document.documentElement.addEventListener('mouseleave', () => candle.classList.remove('on'));
}

// Para los curiosos que abren la consola
console.log(
  '%cNoir%c\n¿Revisando el código? Buen instinto.\n' +
  'Aquí todo está hecho a mano: HTML, CSS y JavaScript, sin frameworks.\n' +
  'Si quieres algo así para tu negocio, escríbeme: https://wa.me/18492674546\n\n' +
  '— Noir, guardián de este portafolio 🐾',
  'font: 700 22px "Cormorant Garamond", Georgia, serif; color: #B08A3E;',
  'font: 13px/1.6 Inter, system-ui, sans-serif;'
);
