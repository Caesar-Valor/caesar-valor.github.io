// Aplica el tema antes de pintar para evitar parpadeos.
// Se carga en el <head> sin defer ni async: tiene que ejecutarse antes de que se muestre la página.
(function () {
  var t;
  try { t = localStorage.getItem('theme'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', t);
  // Con JS activo, las animaciones de entrada pueden ocultar contenido hasta mostrarlo
  document.documentElement.classList.add('js');
})();
