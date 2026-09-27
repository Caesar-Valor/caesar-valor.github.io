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

// Botones flotantes: se ocultan mientras Contacto está en pantalla (ahí ya hay un WhatsApp grande),
// salvo si el panel de Noir está abierto
const floatGroup = document.querySelector('.float-group');
const contacto = document.getElementById('contacto');
let contactoVisible = false;

function updateFloatGroup() {
  if (floatGroup) floatGroup.classList.toggle('is-hidden', contactoVisible && !noirIsOpen());
}
if (floatGroup && contacto && canObserve) {
  new IntersectionObserver(entries => {
    contactoVisible = entries[0].isIntersecting;
    updateFloatGroup();
  }, { threshold: 0 }).observe(contacto);
}

/* ===== Asistente de Noir =====
   Hoy es un menú guiado por pasos. Para pasar a un chat con IA más adelante:
   - NOIR_STEPS, renderNoirStep() y runNoirOption() son lo único que cambia (se
     sustituyen por un campo de texto que envíe los mensajes al backend y pinte
     las respuestas como burbujas .noir-msg).
   - Abrir, cerrar, foco, Esc y el globito de saludo no dependen de los pasos. */
const NOIR_WHATSAPP = '18492674546';
const NOIR_HINT_KEY = 'noir-hint-shown';  // sessionStorage: el saludo sale una vez por sesión
const NOIR_HINT_DELAY = 6000;
const NOIR_FIRST_STEP = 'inicio';

// Cada paso: mensaje de Noir, opciones y, si no es el primero, botón "Volver".
// Cada opción: texto del botón, acción que ejecuta runNoirOption() y, opcional, una etiqueta (badge).
const NOIR_STEPS = {
  inicio: {
    message: 'Hola, soy Noir. Estoy aquí para ayudarte. ¿Qué necesitas?',
    options: [
      { label: 'Quiero digitalizar mi negocio', action: 'step', target: 'digitalizar' },
      { label: 'Tengo un proyecto en mente', action: 'whatsapp', text: 'Hola César, vi tu portafolio y tengo un proyecto en mente que quisiera contarte.' },
      { label: 'Pedir una cotización', action: 'whatsapp', text: 'Hola César, quisiera una cotización para un proyecto.' },
      { label: 'Ver proyectos', action: 'section', target: 'proyectos' },
      { label: 'Escribir un correo', action: 'email' }
    ]
  },
  digitalizar: {
    message: '¡Genial! ¿Qué tipo de solución buscas?',
    back: NOIR_FIRST_STEP,
    options: [
      { label: 'Página web o menú digital', action: 'whatsapp', text: 'Hola César, vi tu portafolio y me interesa una página web o menú digital para mi negocio.' },
      { label: 'Sistema de ventas e inventario', action: 'whatsapp', text: 'Hola César, vi tu portafolio y me interesa un sistema para controlar las ventas y el inventario de mi negocio.' },
      { label: 'Base de datos o automatización', action: 'whatsapp', text: 'Hola César, vi tu portafolio y me interesa organizar la información de mi negocio o automatizar procesos.' },
      { label: 'Revisión de seguridad', badge: 'Próximamente', action: 'whatsapp', text: 'Hola César, vi tu portafolio y me interesa una revisión de seguridad para mi negocio cuando esté disponible.' }
    ]
  }
};

const noirToggle = document.querySelector('.noir-toggle');
const noirPanel = document.getElementById('noir-panel');
const noirHint = document.querySelector('.noir-hint');

function noirIsOpen() {
  return !!noirPanel && !noirPanel.hidden;
}

// El correo se arma aquí para que no aparezca completo en el HTML
function noirEmail() {
  return ['cesarvalenzuela1997', 'gmail.com'].join('@');
}

// Botón de correo de Contacto: oculto en el HTML, se completa y se muestra aquí
const contactEmail = document.querySelector('.contact-email');
if (contactEmail) {
  contactEmail.href = 'mailto:' + noirEmail();
  contactEmail.hidden = false;
}

function openWhatsApp(text) {
  const url = 'https://wa.me/' + NOIR_WHATSAPP + '?text=' + encodeURIComponent(text);
  window.open(url, '_blank', 'noopener');
}

// Ejecuta la acción de una opción del menú
function runNoirOption(option) {
  if (option.action === 'step') {
    renderNoirStep(option.target, true);
  } else if (option.action === 'whatsapp') {
    openWhatsApp(option.text);
  } else if (option.action === 'section') {
    closeNoir(false);
    location.hash = option.target;  // mismo desplazamiento que los enlaces del menú
  } else if (option.action === 'email') {
    location.href = 'mailto:' + noirEmail();
  }
}

// Crea un botón de opción: texto, etiqueta opcional y flecha
function createNoirOption(option) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'noir-option';

  const label = document.createElement('span');
  label.className = 'noir-option-label';
  label.textContent = option.label;
  if (option.badge) {
    const badge = document.createElement('span');
    badge.className = 'noir-badge';
    badge.textContent = option.badge;
    label.append(' ', badge);
  }
  button.appendChild(label);
  button.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>');
  button.addEventListener('click', () => runNoirOption(option));
  return button;
}

// Pinta un paso: mensaje de Noir, sus opciones y el botón "Volver" si corresponde.
// moveFocus: al cambiar de paso, el foco va a la primera opción del nuevo paso.
function renderNoirStep(stepId, moveFocus) {
  const step = NOIR_STEPS[stepId];
  const body = noirPanel.querySelector('.noir-body');
  const list = noirPanel.querySelector('.noir-options');

  noirPanel.dataset.step = stepId;
  noirPanel.querySelector('.noir-msg').textContent = step.message;
  list.replaceChildren(...step.options.map(createNoirOption));

  if (step.back) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'noir-back';
    back.textContent = '← Volver';
    back.addEventListener('click', () => renderNoirStep(step.back, true));
    list.appendChild(back);
  }

  // Transición suave: se reinicia la animación de entrada del contenido (el CSS la desactiva con reduced motion)
  body.classList.remove('is-changing');
  void body.offsetWidth;
  body.classList.add('is-changing');
  body.scrollTop = 0;

  if (moveFocus) list.querySelector('.noir-option').focus();
}

// Recuerda en la sesión que el saludo ya salió (si el almacenamiento está bloqueado, no pasa nada)
function markNoirHintShown() {
  try { sessionStorage.setItem(NOIR_HINT_KEY, '1'); } catch (e) {}
}
function noirHintWasShown() {
  try { return sessionStorage.getItem(NOIR_HINT_KEY) === '1'; } catch (e) { return false; }
}

function hideNoirHint() {
  if (noirHint) noirHint.hidden = true;
}

// Globito "Hola, soy Noir": solo la primera vez de la sesión; nunca abre el panel por su cuenta
function scheduleNoirHint() {
  if (!noirHint || noirHintWasShown()) return;
  setTimeout(() => {
    if (noirIsOpen() || noirHintWasShown()) return;
    noirHint.hidden = false;
    markNoirHintShown();
  }, NOIR_HINT_DELAY);
  noirHint.querySelector('.noir-hint-close').addEventListener('click', () => {
    hideNoirHint();
    noirToggle.focus();
  });
}

function openNoir() {
  hideNoirHint();
  markNoirHintShown();
  noirPanel.hidden = false;
  noirPanel.classList.add('is-open');
  updateFloatGroup();
  noirToggle.setAttribute('aria-expanded', 'true');
  noirPanel.querySelector('.noir-option').focus();
}

// returnFocus: al cerrar con X o Esc el foco vuelve a las patitas
function closeNoir(returnFocus) {
  if (!noirIsOpen()) return;
  noirPanel.hidden = true;
  noirPanel.classList.remove('is-open');
  noirToggle.setAttribute('aria-expanded', 'false');
  renderNoirStep(NOIR_FIRST_STEP, false);  // la próxima vez empieza desde el primer paso
  updateFloatGroup();
  if (returnFocus) noirToggle.focus();
}

function initNoir() {
  if (!noirToggle || !noirPanel) return;
  renderNoirStep(NOIR_FIRST_STEP, false);
  noirToggle.hidden = false;

  noirToggle.addEventListener('click', () => (noirIsOpen() ? closeNoir(true) : openNoir()));
  noirPanel.querySelector('.noir-close').addEventListener('click', () => closeNoir(true));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && noirIsOpen()) closeNoir(true);
  });
  // Clic fuera del panel: se cierra sin mover el foco
  document.addEventListener('pointerdown', e => {
    if (noirIsOpen() && !noirPanel.contains(e.target) && !noirToggle.contains(e.target)) closeNoir(false);
  });

  scheduleNoirHint();
}
initNoir();

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
  'Si quieres algo así para tu negocio, escribe al: +1 849-267-4546\n\n' +
  '— Noir, guardián de este portafolio 🐾',
  'font: 700 22px "Cormorant Garamond", Georgia, serif; color: #B08A3E;',
  'font: 13px/1.6 Inter, system-ui, sans-serif;'
);
