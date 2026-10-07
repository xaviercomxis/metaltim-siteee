// Carrossel 3D em anel: miniaturas giram ao redor, a máquina ativa fica no centro.
(() => {
  const root = document.getElementById('fan');
  if (!root) return;
  const stage = document.getElementById('fanStage');
  const ring = document.getElementById('fanRing');
  const center = document.getElementById('fanCenter');
  const srcs = [...document.querySelectorAll('#fanSrc img')].map(i => ({ src: i.getAttribute('src'), alt: i.alt }));
  const n = srcs.length;
  const step = 360 / n;
  const TILT = 38, AUTOPLAY = 2600;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let rotation = 0, radius = 220, shown = 0, timer = null, visible = false, hover = false;

  // monta o anel
  const items = srcs.map((s, i) => {
    const item = document.createElement('div');
    item.className = 'fan__item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fan__thumb';
    btn.setAttribute('aria-label', 'Ver ' + s.alt);
    btn.innerHTML = `<img src="${s.src}" alt="" width="120" height="120">`;
    btn.addEventListener('click', () => {
      // gira pelo caminho mais curto até esta miniatura ficar no centro
      const cur = centerIndex();
      let d = i - cur;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      rotation -= d * step;
      render(); restart();
    });
    item.appendChild(btn);
    ring.appendChild(item);
    return { item, btn };
  });

  const centerIndex = () => {
    const steps = Math.round(rotation / step);
    return ((-steps % n) + n) % n;
  };

  const render = () => {
    items.forEach(({ item, btn }, i) => {
      const a = rotation + step * i;
      item.style.transform = `rotateY(${a}deg)`;
      btn.style.transform = `translateZ(${radius}px) rotateX(${TILT}deg) rotateY(${-a}deg)`;
    });
    const ci = centerIndex();
    if (ci !== shown) {
      shown = ci;
      center.classList.add('swap');
      setTimeout(() => {
        center.src = srcs[ci].src;
        center.alt = srcs[ci].alt;
        center.classList.remove('swap');
      }, 220);
    }
  };

  const resize = () => {
    const w = stage.clientWidth;
    radius = Math.max(100, Math.min(260, w * 0.38));
    root.style.setProperty('--w', w + 'px');
    ring.style.setProperty('--persp', radius * 2.4 + 'px');
    render();
  };
  new ResizeObserver(resize).observe(stage);
  center.alt = srcs[0].alt;
  resize();

  const rotate = dir => { rotation += dir * step; render(); };
  document.getElementById('fanPrev').addEventListener('click', () => { rotate(1); restart(); });
  document.getElementById('fanNext').addEventListener('click', () => { rotate(-1); restart(); });
  root.tabIndex = 0;
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { rotate(1); restart(); }
    if (e.key === 'ArrowRight') { rotate(-1); restart(); }
  });

  // autoplay: pausa no hover e fora da tela
  const start = () => { if (!reduce && !timer) timer = setInterval(() => { if (visible && !hover) rotate(-1); }, AUTOPLAY); };
  const restart = () => { clearInterval(timer); timer = null; start(); };
  root.addEventListener('pointerenter', () => { hover = true; });
  root.addEventListener('pointerleave', () => { hover = false; });
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { threshold: 0.2 }).observe(root);
  start();
})();
