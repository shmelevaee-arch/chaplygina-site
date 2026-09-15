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

// ----- 04 Образование: счётчики от нуля при появлении -----
(() => {
  const nums = document.querySelectorAll('[data-count]');
  if (!nums.length) return;
  const fmt = (n) => n.toLocaleString('ru-RU'); // неразрывный пробел между разрядами
  nums.forEach((el) => (el.textContent = fmt(+el.dataset.count)));
  if (window.site?.isStatic || window.site?.reduceMotion) return;
  nums.forEach((el) => (el.textContent = '0'));
  const run = (el) => {
    const end = +el.dataset.count, dur = 1600, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(end * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((ens) => ens.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }), { threshold: 0.6 });
  nums.forEach((el) => io.observe(el));
})();

// ----- 04 Список документов: показать все -----
(() => {
  const btn = document.querySelector('[data-docs-toggle]');
  if (!btn) return;
  const list = document.getElementById(btn.getAttribute('aria-controls'));
  const total = list.children.length;
  btn.addEventListener('click', () => {
    const open = list.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? 'Свернуть' : `Показать все ${total}`;
  });
})();

// ----- Модальное окно: сканы документов (data-modal-img) и курсы (data-modal-tpl) -----
(() => {
  const modal = document.getElementById('modal');
  if (!modal) return;
  const title = modal.querySelector('.modal__title'), body = modal.querySelector('.modal__body');
  let opener = null;
  const open = (t, html) => {
    title.textContent = t; body.innerHTML = html;
    window.site?.lenis?.stop();          // иначе фон под окном прокручивается
    modal.showModal();
  };
  modal.addEventListener('close', () => { window.site?.lenis?.start(); opener?.focus(); });
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-modal-close]')) modal.close(); });
  document.addEventListener('click', (e) => {
    const img = e.target.closest('[data-modal-img]');
    const tpl = e.target.closest('[data-modal-tpl]');
    if (img) { opener = img; open(img.dataset.modalTitle, `<img src="${img.dataset.modalImg}" alt="Скан: ${img.dataset.modalTitle}">`); }
    if (tpl) { opener = tpl; const t = document.getElementById(tpl.dataset.modalTpl); open(t.dataset.title, t.innerHTML); }
  });
})();

// ----- 05 Истории: стрелки, свайп, клавиши -----
(() => {
  const root = document.querySelector('.stories');
  if (!root) return;
  const slides = [...root.querySelectorAll('.stories__slide')];
  const counter = root.querySelector('[data-current]');
  let i = 0;
  const go = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => { s.hidden = k !== i; s.classList.toggle('is-active', k === i); });
    counter.textContent = String(i + 1).padStart(2, '0');
  };
  root.querySelector('[data-prev]').addEventListener('click', () => go(i - 1));
  root.querySelector('[data-next]').addEventListener('click', () => go(i + 1));
  root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); });
  let x0 = null;
  const box = root.querySelector('.stories__slides');
  box.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  box.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
    x0 = null;
  });
})();

// ----- Мобильное меню -----
(() => {
  const burger = document.querySelector('.header__burger');
  const menu = document.getElementById('menu');
  if (!burger || !menu) return;
  const html = document.documentElement;
  const set = (open) => {
    html.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.setAttribute('aria-hidden', !open);
    open ? window.site?.lenis?.stop() : window.site?.lenis?.start();
  };
  burger.setAttribute('aria-controls', 'menu');
  burger.addEventListener('click', () => set(!html.classList.contains('menu-open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
})();
