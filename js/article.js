// Страница статьи: красная полоса под шапкой показывает, сколько текста прочитано
(() => {
  const bar = document.querySelector('.read-progress');
  const body = document.querySelector('.article-body');
  if (!bar || !body) return;
  const update = () => {
    const r = body.getBoundingClientRect();
    const total = r.height - innerHeight * 0.5;
    const done = Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / total));
    bar.style.transform = `scaleX(${done})`;
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();
