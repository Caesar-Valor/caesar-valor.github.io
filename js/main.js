// Año del footer
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Tema día / noche (el script inline del <head> ya aplicó el inicial)
const root = document.documentElement;
const themeBtn = document.querySelector('.theme-btn');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme, animate) {
  const set = () => {
    root.setAttribute('data-theme', theme);
    themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche');
  };
  // Fundido entre la página vieja y la nueva (el CSS fija la duración). Sin soporte o con
  // "reducir movimiento", el tema cambia al instante
  if (animate && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(set);
  } else {
    set();
  }
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

// La entrada de las secciones y las barras de habilidades las anima js/motion.js
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canObserve = 'IntersectionObserver' in window;

// Línea de tiempo: la línea se dibuja y cada punto se enciende cuando la línea lo alcanza
const journey = document.querySelector('.journey');
const LINE_SECONDS = 0.6; // igual que la transición de .timeline::before en el CSS

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

// Proyectos: filtros por tipo. Cada expediente lleva sus tipos en data-cat ("web personal").
// Sin JavaScript los filtros siguen ocultos y se ven todos los proyectos.
const filtros = document.querySelector('.filtros');
if (filtros) {
  const expedientes = [...document.querySelectorAll('.expediente')];
  const filtroBtns = [...filtros.querySelectorAll('.filtro')];
  const filtroEstado = document.querySelector('.filtros-estado');
  const coincide = (exp, filtro) => filtro === 'todos' || exp.dataset.cat.split(' ').includes(filtro);

  filtroBtns.forEach(b => {
    b.querySelector('.filtro-n').textContent = expedientes.filter(exp => coincide(exp, b.dataset.filtro)).length;
    b.addEventListener('click', () => aplicarFiltro(b.dataset.filtro));
  });

  function aplicarFiltro(filtro) {
    filtroBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.filtro === filtro));
    expedientes.forEach(exp => { exp.hidden = !coincide(exp, filtro); });
    // Lado alterno y último sin borde, contando solo los visibles
    const visibles = expedientes.filter(exp => !exp.hidden);
    visibles.forEach((exp, i) => {
      exp.classList.toggle('flip', i % 2 === 1);
      exp.classList.toggle('is-last', i === visibles.length - 1);
    });
    filtroEstado.textContent = 'Mostrando ' + visibles.length + (visibles.length === 1 ? ' proyecto' : ' proyectos');
    document.dispatchEvent(new CustomEvent('proyectos:filtrados', { detail: visibles }));  // js/motion.js los anima
  }
  filtros.hidden = false;
}

// Galería de capturas: cada miniatura es un enlace a la imagen grande (funciona sin JavaScript);
// aquí se abre en el visor (<dialog>), con flechas para pasar y Esc o clic fuera para cerrar
const visor = document.querySelector('.visor');
if (visor && typeof visor.showModal === 'function') {
  const visorImg = visor.querySelector('.visor-img');
  const visorTexto = visor.querySelector('.visor-texto');
  const visorCuenta = visor.querySelector('.visor-cuenta');
  let items = [];
  let actual = 0;
  let opener = null;

  function mostrar(i) {
    actual = (i + items.length) % items.length;
    const item = items[actual];
    const alt = item.querySelector('img').alt;
    // Medidas reales antes de cargar: el visor no salta al cambiar de imagen
    visorImg.width = item.dataset.w;
    visorImg.height = item.dataset.h;
    visorImg.src = item.href;
    visorImg.alt = alt;
    visorTexto.textContent = alt;
    visorCuenta.textContent = (actual + 1) + ' / ' + items.length;
  }

  document.querySelectorAll('.galeria').forEach(galeria => {
    const propios = [...galeria.querySelectorAll('.galeria-item')];
    propios.forEach((item, i) => {
      item.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;  // abrir en pestaña nueva sigue funcionando
        e.preventDefault();
        items = propios;
        opener = item;
        mostrar(i);
        visor.classList.toggle('visor-una', items.length === 1);
        visor.showModal();
        visor.querySelector('.visor-cerrar').focus();
      });
    });
  });

  visor.addEventListener('click', e => {
    const paso = e.target.closest('[data-paso]');
    if (paso) mostrar(actual + Number(paso.dataset.paso));
    else if (e.target.closest('.visor-cerrar') || e.target === visor) visor.close();  // e.target === visor: clic en el fondo
  });
  visor.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') mostrar(actual - 1);
    if (e.key === 'ArrowRight') mostrar(actual + 1);
  });
  // Al cerrar (botón, clic fuera o Esc) el foco vuelve a la miniatura que lo abrió
  visor.addEventListener('close', () => {
    visorImg.src = 'data:,';
    if (opener) opener.focus();
  });
}

// Repositorios privados: el botón parece el de GitHub, pero abre a Noir con el libro y la llave.
// Cuenta los intentos por repositorio en la sesión; desde el tercero, Noir pierde la paciencia.
const noirLlave = document.querySelector('.noir-llave');
if (noirLlave && typeof noirLlave.showModal === 'function') {
  const LLAVE_KEY = 'noir-llave-intentos';  // sessionStorage: { repo: intentos }
  const LLAVE_INSISTE = 3;
  const llaveTexto = noirLlave.querySelector('.noir-llave-texto');
  const DUENOS = {
    cliente: 'pertenece a un cliente de Cesar',
    empresa: 'pertenece a la empresa donde Cesar hizo su pasantía',
  };
  let intentos = {};
  try { intentos = JSON.parse(sessionStorage.getItem(LLAVE_KEY)) || {}; } catch (e) {}
  let llaveOpener = null;

  document.querySelectorAll('.repo-privado').forEach(b => {
    b.hidden = false;
    b.nextElementSibling.hidden = true;  // la etiqueta .codigo-privado queda solo para quien no tiene JavaScript
    b.addEventListener('click', () => {
      const repo = b.dataset.repo;
      intentos[repo] = (intentos[repo] || 0) + 1;
      try { sessionStorage.setItem(LLAVE_KEY, JSON.stringify(intentos)); } catch (e) {}
      llaveTexto.textContent = intentos[repo] >= LLAVE_INSISTE
        ? 'Por más que lo intentes, no podrás abrirlo. La llave la tengo yo… y no pienso soltarla.'
        : 'Este expediente lo guardo bajo llave. El código ' + DUENOS[b.dataset.dueno] + ', y sus secretos no son míos para contarlos.';
      llaveOpener = b;
      noirLlave.showModal();
      noirLlave.querySelector('.noir-llave-ok').focus();
    });
  });

  noirLlave.addEventListener('click', e => {
    // Clic en el fondo: el destino es el propio <dialog> y el punto cae fuera de su caja
    const r = noirLlave.getBoundingClientRect();
    const fuera = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (e.target.closest('.noir-llave-ok') || (e.target === noirLlave && fuera)) noirLlave.close();
  });
  noirLlave.addEventListener('close', () => { if (llaveOpener) llaveOpener.focus(); });
}

/* ===== Asistente de Noir =====
   Menú guiado por pasos y, si NOIR_API tiene la URL del Worker (noir-worker/),
   un chat con IA debajo. Al escribir el primer mensaje, el menú se cambia por
   atajos (WhatsApp y Ver proyectos). Si el Worker falla, el chat se oculta y
   vuelve el menú de siempre.
   - Abrir, cerrar, foco, Esc y el globito de saludo no dependen de los pasos. */
const NOIR_API = 'https://noir.noir-worker.workers.dev';  // debe caber en connect-src de la CSP
const NOIR_TIMEOUT = 20000;
const NOIR_MAX_HISTORY = 8;  // últimos mensajes que se envían (el Worker acepta hasta 12 y 16 KB)
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
  noirPanel.querySelector('.noir-step-msg').textContent = step.message;
  list.replaceChildren(...step.options.map(createNoirOption));

  if (step.back) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'noir-back';
    back.textContent = '← Volver';
    back.addEventListener('click', () => renderNoirStep(step.back, true));
    list.appendChild(back);
  }

  // Transición suave: se reinicia la animación de entrada del contenido (el CSS la desactiva con reduced motion).
  // Solo con el panel abierto: leer offsetWidth obliga a calcular el diseño de toda la página,
  // y al cargar (panel cerrado) eso retrasaba el primer pintado útil
  if (noirIsOpen()) {
    body.classList.remove('is-changing');
    void body.offsetWidth;
    body.classList.add('is-changing');
  }
  body.scrollTop = 0;

  if (moveFocus) list.querySelector('.noir-option').focus();
}

/* --- Chat con IA --- */
const NOIR_SHORTCUTS = [
  { label: 'Escribir por WhatsApp', action: 'whatsapp', text: 'Hola César, vi tu portafolio y quisiera hablar contigo sobre un proyecto.' },
  { label: 'Ver proyectos', action: 'section', target: 'proyectos' }
];
const noirHistory = [];  // { role: 'user' | 'assistant', content } solo en memoria
let noirBusy = false;
let noirFootText = '';  // pie original, para volver a él si el chat se apaga

function noirChatting() {
  return noirHistory.length > 0;
}

// Añade una burbuja al registro (siempre con textContent) y baja hasta ella
function addNoirBubble(text, fromUser) {
  const bubble = document.createElement('p');
  bubble.className = fromUser ? 'noir-msg is-user' : 'noir-msg';
  bubble.textContent = text;
  noirPanel.querySelector('.noir-log').appendChild(bubble);
  scrollNoirToEnd();
  return bubble;
}

function scrollNoirToEnd() {
  const body = noirPanel.querySelector('.noir-body');
  body.scrollTo({ top: body.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
}

// "Noir está escribiendo": tres puntos que el lector de pantalla no lee
function showNoirTyping() {
  const typing = document.createElement('p');
  typing.className = 'noir-msg noir-typing';
  typing.setAttribute('aria-hidden', 'true');
  typing.append(document.createElement('span'), document.createElement('span'), document.createElement('span'));
  noirPanel.querySelector('.noir-log').appendChild(typing);
  scrollNoirToEnd();
  return typing;
}

// Pide la respuesta al Worker; cualquier fallo (red, límite, modelo, tiempo) lanza un error
async function fetchNoirReply() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NOIR_TIMEOUT);
  try {
    const res = await fetch(NOIR_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: noirHistory.slice(-NOIR_MAX_HISTORY) }),
      signal: controller.signal
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || typeof data.reply !== 'string') throw new Error(data.error || 'http ' + res.status);
    return data.reply;
  } finally {
    clearTimeout(timer);
  }
}

// El Worker no responde: se apaga el chat y vuelve el menú por pasos
function disableNoirChat(reason) {
  const form = noirPanel.querySelector('.noir-form');
  const rateLimited = reason === 'rate';
  addNoirBubble(rateLimited
    ? 'Recibí muchos mensajes seguidos. Espera un minuto o escríbele a Cesar por WhatsApp.'
    : 'Ahora mismo no puedo responder. Escríbele a Cesar por WhatsApp y te contesta en menos de 24 horas.', false);
  if (rateLimited) return;
  form.hidden = true;
  noirPanel.classList.remove('has-chat');
  noirPanel.querySelector('.noir-foot').textContent = noirFootText;
  noirPanel.querySelector('.noir-options').classList.remove('is-shortcuts');
  renderNoirStep(NOIR_FIRST_STEP, false);
  scrollNoirToEnd();
}

async function sendNoirMessage(text) {
  const form = noirPanel.querySelector('.noir-form');
  const input = form.querySelector('.noir-input');

  if (!noirChatting()) {
    // Primer mensaje: el menú por pasos se cambia por los atajos
    noirPanel.querySelector('.noir-options').replaceChildren(...NOIR_SHORTCUTS.map(createNoirOption));
    noirPanel.querySelector('.noir-options').classList.add('is-shortcuts');
  }
  addNoirBubble(text, true);
  noirHistory.push({ role: 'user', content: text });

  noirBusy = true;
  input.value = '';
  form.querySelector('.noir-send').disabled = true;
  noirPanel.querySelector('.noir-log').setAttribute('aria-busy', 'true');
  const typing = showNoirTyping();

  try {
    const reply = await fetchNoirReply();
    typing.remove();
    noirHistory.push({ role: 'assistant', content: reply });
    addNoirBubble(reply, false);
  } catch (e) {
    typing.remove();
    noirHistory.pop();  // el mensaje sin respuesta no se reenvía
    disableNoirChat(e.message);
  } finally {
    noirBusy = false;
    form.querySelector('.noir-send').disabled = false;
    noirPanel.querySelector('.noir-log').removeAttribute('aria-busy');
    if (noirIsOpen()) (form.hidden ? noirPanel.querySelector('.noir-option') : input).focus();
  }
}

function initNoirChat() {
  const form = noirPanel.querySelector('.noir-form');
  if (!NOIR_API || !form || typeof fetch !== 'function') return;
  form.hidden = false;
  noirPanel.classList.add('has-chat');
  noirFootText = noirPanel.querySelector('.noir-foot').textContent;
  noirPanel.querySelector('.noir-foot').textContent = 'Noir usa IA y puede equivocarse. Cesar responde por WhatsApp en menos de 24 horas.';

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = form.querySelector('.noir-input').value.trim();
    if (text && !noirBusy) sendNoirMessage(text);
  });
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
  // Con una conversación en curso, el foco vuelve al campo de texto
  const input = noirPanel.querySelector('.noir-input');
  if (noirChatting() && input && !input.closest('form').hidden) input.focus();
  else noirPanel.querySelector('.noir-option').focus();
}

// returnFocus: al cerrar con X o Esc el foco vuelve a las patitas
function closeNoir(returnFocus) {
  if (!noirIsOpen()) return;
  noirPanel.hidden = true;
  noirPanel.classList.remove('is-open');
  noirToggle.setAttribute('aria-expanded', 'false');
  // La próxima vez empieza desde el primer paso; la conversación con IA se conserva
  if (!noirChatting() || !noirPanel.classList.contains('has-chat')) renderNoirStep(NOIR_FIRST_STEP, false);
  updateFloatGroup();
  if (returnFocus) noirToggle.focus();
}

function initNoir() {
  if (!noirToggle || !noirPanel) return;
  renderNoirStep(NOIR_FIRST_STEP, false);
  initNoirChat();
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
