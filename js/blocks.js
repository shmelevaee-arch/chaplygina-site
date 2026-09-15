// Интерактив разделов. Каждый модуль сам проверяет, есть ли его раздел на странице

// ----- 02 С чем я работаю: автосмена направлений, клик и стрелки, пауза при наведении -----
(() => {
  const root = document.querySelector('.dirs');
  if (!root) return;
  const tabs = [...root.querySelectorAll('.dirs__tab')];
  const panels = [...root.querySelectorAll('.dirs__list')];
  const layers = [...root.querySelectorAll('.dirs__layer')];
  const CYCLE = 6000;
  let current = 0, timer = null;
  root.style.setProperty('--cycle', `${CYCLE}ms`);

  function show(i) {
    current = i;
    tabs.forEach((t, n) => {
      const on = n === i;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      // перезапуск полоски прогресса
      const bar = t.querySelector('.dirs__bar'); bar.style.animation = 'none'; bar.offsetWidth; bar.style.animation = '';
    });
    panels.forEach((p, n) => { p.hidden = n !== i; p.querySelectorAll('li').forEach((li, k) => li.style.setProperty('--i', k)); });
    layers.forEach((l, n) => l.classList.toggle('is-active', n === i));
  }
  const next = () => show((current + 1) % tabs.length);
  const start = () => { stop(); if (!window.site?.reduceMotion && !window.site?.isStatic) timer = setInterval(next, CYCLE); };
  const stop = () => clearInterval(timer);

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { show(i); start(); });
    t.addEventListener('keydown', (e) => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const d = ['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : -1;
      const n = (current + d + tabs.length) % tabs.length;
      show(n); tabs[n].focus(); start();
    });
  });
  // пока человек читает список – не переключаем
  root.addEventListener('mouseenter', () => { stop(); root.classList.add('is-paused'); });
  root.addEventListener('mouseleave', () => { root.classList.remove('is-paused'); show(current); start(); });

  // крутим только когда раздел на экране
  new IntersectionObserver(([en]) => (en.isIntersecting ? (show(current), start()) : stop()), { threshold: 0.3 }).observe(root);
  show(0);
})();
