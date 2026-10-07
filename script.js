(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const header = $('#header');
  const bar = $('.progress');
  const bg = $('[data-parallax]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // scroll: header, progress, parallax
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();


  // hero: parallax do mouse + partículas de refrigerante
  const hero = $('.hero');
  let mx = 0, my = 0, tx = 0, ty = 0;
  if (!reduce) {
    hero.addEventListener('pointermove', e => {
      mx = (e.clientX / innerWidth - 0.5) * -30;
      my = (e.clientY / innerHeight - 0.5) * -20;
    });
    const fx = $('#fx'), ctx = fx.getContext('2d');
    let W, H, dots = [];
    const size = () => {
      const r = devicePixelRatio > 1 ? 2 : 1;
      W = fx.width = hero.clientWidth * r; H = fx.height = hero.clientHeight * r;
      dots = Array.from({ length: Math.round(W / 22) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: (Math.random() * 1.8 + .6) * r, s: (Math.random() * .5 + .15) * r,
        a: Math.random() * .5 + .2, p: Math.random() * 6.28
      }));
    };
    size(); addEventListener('resize', size);
    let on = true;
    new IntersectionObserver(e => { on = e[0].isIntersecting; }).observe(hero);
    const draw = t => {
      requestAnimationFrame(draw);
      if (!on) return;
      tx += (mx - tx) * .06; ty += (my - ty) * .06;
      bg.style.transform = `translate3d(${tx}px,${ty + scrollY * .25}px,0)`;
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) {
        d.y += d.s; d.x += Math.sin(t / 1600 + d.p) * .25;
        if (d.y > H + 6) { d.y = -6; d.x = Math.random() * W; }
        ctx.globalAlpha = d.a * (.6 + .4 * Math.sin(t / 700 + d.p));
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
      }
    };
    requestAnimationFrame(draw);
  }

  // mobile menu
  const burger = $('#burger');
  const setMenu = open => {
    header.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => setMenu(!header.classList.contains('open')));
  $$('#nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // counters
  const count = el => {
    const end = +el.dataset.count;
    if (reduce) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { count(e.target); co.unobserve(e.target); }
  }), { threshold: 0.6 });
  $$('[data-count]').forEach(el => co.observe(el));

  // marquee: duplicate logos for a seamless loop
  const track = $('.marquee__track');
  if (track) track.innerHTML += track.innerHTML;

  // form -> WhatsApp
  const form = $('#form'), msg = $('#formMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (!d.nome.trim() || !d.contato.trim() || !d.msg.trim()) {
      msg.textContent = 'Preencha todos os campos.';
      return;
    }
    msg.textContent = '';
    const text = `Olá, Metaltim! Sou ${d.nome} (${d.contato}).\n\n${d.msg}`;
    open(`https://wa.me/5547991596994?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });

  $('#year').textContent = new Date().getFullYear();
})();
