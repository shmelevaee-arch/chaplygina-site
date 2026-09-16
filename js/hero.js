// ?static – без анимации появления (для скриншотов и проверки)
if (new URLSearchParams(location.search).has('static')) document.documentElement.classList.remove('intro');

// Первый экран: подгонка фамилии под ширину, перекат букв в ссылках, появление при загрузке

// 1. Перекат: текст ссылки дублируется, при наведении строка уезжает вверх (CSS .roll)
document.querySelectorAll('[data-roll]').forEach((el) => {
  const text = el.textContent.trim();
  el.textContent = '';
  const roll = document.createElement('span');
  roll.className = 'roll';
  roll.innerHTML = `<span class="roll__inner"><span>${text}</span><span aria-hidden="true">${text}</span></span>`;
  el.prepend(roll);
});

// 2. Фамилия во всю ширину: меряем при 100px и масштабируем под контейнер.
//    Если строк несколько, кегль общий – по самой длинной строке
function fitWordmark() {
  document.querySelectorAll('[data-fit]').forEach((wm) => {
    const box = getComputedStyle(wm.parentElement);
    const target = wm.parentElement.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight);
    wm.style.fontSize = '100px';
    const widest = Math.max(...[...wm.querySelectorAll('.wordmark__line > span')].map((s) => s.getBoundingClientRect().width));
    wm.style.fontSize = `${(100 * target) / widest}px`;
  });
}

// 3. Появление: ждём шрифт, чтобы не было прыжка ширины, затем запускаем анимацию
// 4. Фото подстраивается под текст: верх оффера всегда на верхней губе, а не на носу.
//    Координаты губ – доли кадра hero-tanya.jpg; кадр другой – поменять цифры
const HERO_IMG = { ratio: 1672 / 941, lipsTop: 0.68, focusX: 0.4 };
function alignHeroPhoto() {
  const photo = document.querySelector('.hero__photo');
  const offer = document.querySelector('.hero__offer');
  if (!photo || !offer) return;
  const W = photo.clientWidth, H = photo.clientHeight;
  // offsetTop не учитывает transform: во время появления фото увеличено, а текст сдвинут
  let target = 0;
  for (let el = offer; el && el !== photo.offsetParent; el = el.offsetParent) target += el.offsetTop;
  target -= photo.offsetTop;
  // высота кадра: не меньше «cover» и такая, чтобы губы встали на target и кадр всё ещё закрывал блок
  const h = Math.max(H, W / HERO_IMG.ratio, target / HERO_IMG.lipsTop, (H - target) / (1 - HERO_IMG.lipsTop));
  const w = h * HERO_IMG.ratio;
  const y = Math.min(0, Math.max(H - h, target - HERO_IMG.lipsTop * h));
  const x = Math.min(0, Math.max(W - w, W * 0.5 - HERO_IMG.focusX * w));
  photo.style.backgroundSize = `${w}px ${h}px`;
  photo.style.backgroundPosition = `${x}px ${y}px`;
}

document.fonts.ready.then(() => {
  fitWordmark();
  alignHeroPhoto();
  requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { fitWordmark(); alignHeroPhoto(); }, 100);
});
