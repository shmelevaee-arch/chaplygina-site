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
document.fonts.ready.then(() => {
  fitWordmark();
  requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitWordmark, 100);
});
