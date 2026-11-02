/* Instalación como app de escritorio (PWA) y funcionamiento sin internet. */
(() => {
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sin modo sin conexión */ });
  }

  const btn = document.getElementById('installBtn');
  let prompt = null;

  // iPhone y iPad no tienen botón automático de instalar: se instala con «Agregar a pantalla de inicio».
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const installed = navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  if (ios && !installed) {
    const help = document.getElementById('iosHelp');
    const otherBrowser = /CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
    document.getElementById('iosWhere').textContent = otherBrowser
      ? 'el botón Compartir (cuadrado con flecha hacia arriba) junto a la barra de direcciones'
      : 'el botón Compartir (cuadrado con flecha hacia arriba) en la barra de abajo de Safari';
    btn.classList.remove('hidden');
    btn.addEventListener('click', () => help.showModal());
    document.getElementById('iosClose').addEventListener('click', () => help.close());
    help.addEventListener('click', e => { if (e.target === help) help.close(); });
    return;
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    prompt = e;
    btn.classList.remove('hidden');
  });

  btn.addEventListener('click', async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    prompt = null;
    btn.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => btn.classList.add('hidden'));
})();
