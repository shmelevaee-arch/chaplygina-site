// Общий JS страницы: плавный скролл, якоря, появление блоков при прокрутке
const isStatic = new URLSearchParams(location.search).has('static');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (isStatic) document.documentElement.classList.add('static');

// Плавный скролл (Lenis). При «уменьшить движение» – обычный скролл
let lenis = null;
if (!reduceMotion && !isStatic && window.Lenis) {
  lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

// Якоря: плавно доезжаем до раздела с учётом высоты шапки
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    document.documentElement.classList.remove('menu-open');
    if (lenis) lenis.scrollTo(target, { offset: -64 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

// Появление при прокрутке: элемент с data-reveal получает .is-in, когда входит в экран
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in');
    io.unobserve(en.target);
  });
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

// Абзац по буквам (data-letters): текст режется на слова и буквы, дальше анимирует CSS .letters.
// Слово целиком не переносится; читалкам экрана отдаётся обычный текст
if (!isStatic && !reduceMotion) document.querySelectorAll('[data-letters]').forEach((el) => {
  const plain = document.createElement('span');
  plain.className = 'visually-hidden';
  plain.textContent = el.textContent;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  let i = 0;
  el.textContent.split(/( +)/).forEach((part) => {
    if (!part) return;
    if (/^ +$/.test(part)) { visual.append(' '); return; } // обычный пробел – место переноса, неразрывный остаётся внутри слова
    const word = document.createElement('span');
    word.className = 'letters__word';
    for (const ch of part) {
      const c = document.createElement('span');
      c.className = 'letters__char';
      c.style.setProperty('--i', i++);
      c.textContent = ch;
      word.append(c);
    }
    visual.append(word);
  });
  el.replaceChildren(plain, visual);
  el.classList.add('letters');
  io.observe(el);
});

// Шапка получает фон, как только страница прокручена
const header = document.querySelector('.header');
// как у KAFAYA: над фото шапка прозрачная, фон появляется, когда первый экран уехал
const heroEl = document.querySelector('.hero');
const onScroll = () => header && header.classList.toggle('is-scrolled',
  window.scrollY > (heroEl ? heroEl.offsetHeight - header.offsetHeight : 10));
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Точка расширения: модули разделов подписываются сюда
window.site = { lenis, isStatic, reduceMotion };
