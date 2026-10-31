/* Instalación como app de escritorio (PWA) y funcionamiento sin internet. */
(() => {
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sin modo sin conexión */ });
  }

  const btn = document.getElementById('installBtn');
  let prompt = null;

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
