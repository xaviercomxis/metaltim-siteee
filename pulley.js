// Polia Micro V 3D interativa (three.js). Arraste para girar em qualquer direção.
(() => {
  const wrap = document.getElementById('viewer');
  const canvas = document.getElementById('pulley3d');
  if (!wrap || !canvas || !window.THREE) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 5.2);

  // ambiente de estúdio (painéis de luz) para o reflexo do metal
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x2a2627, side: THREE.BackSide })));
  const panel = (w, h, x, y, z, c, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  panel(10, 3, 0, 8, 2, 0xffffff, 3);      // topo
  panel(3, 10, -8, 1, 2, 0xffffff, 1.800); // esquerda
  panel(3, 8, 8, 0, 3, 0xffe9e0, 2.500);   // direita (quente)
  panel(12, 2, 0, -8, 0, 0xae1f23, 0.55); // base com um toque da marca
  panel(8, 4, 0, 0, -9, 0xffffff, 1.500);  // fundo
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.02).texture;

  // perfil da polia (raio, y): furo -> face -> canais Micro V -> face -> furo
  const R = 1.0, W = 0.62, bore = 0.32, ribs = 6, base = 0.9, top = 0.95;
  const pitch = (2 * 0.5) / ribs;
  const prof = [[bore + 0.03, -W], [bore, -W + 0.03]];
  prof.push([bore, -W + 0.03], [R - 0.04, -W], [R, -W + 0.04], [R, -0.5], [top, -0.5]);
  for (let i = 0; i < ribs; i++) {
    const y0 = -0.5 + i * pitch;
    prof.push([top, y0 + 0.012], [base, y0 + pitch / 2], [top, y0 + pitch - 0.012]);
  }
  prof.push([top, 0.5], [R, 0.5], [R, W - 0.04], [R - 0.04, W], [bore + 0.03, W], [bore, W - 0.03], [bore, -W + 0.03]);

  const mat = new THREE.MeshStandardMaterial({ color: 0xc4c9cf, metalness: 1, roughness: 0.34, envMapIntensity: 0.9 });
  const pulley = new THREE.Group();
  for (let i = 0; i < prof.length - 1; i++) {
    const a = prof[i], b = prof[i + 1];
    if (a[0] === b[0] && a[1] === b[1]) continue;
    const g = new THREE.LatheGeometry([new THREE.Vector2(a[0], a[1]), new THREE.Vector2(b[0], b[1])], 160);
    pulley.add(new THREE.Mesh(g, mat));
  }
  // parafuso de fixação no cubo
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 24),
    new THREE.MeshStandardMaterial({ color: 0x393536, metalness: 0.9, roughness: 0.4 }));
  hub.position.set(0, 0, 0); hub.visible = false;
  pulley.add(hub);

  const holder = new THREE.Group();
  holder.add(pulley);
  holder.scale.setScalar(1.02);
  scene.add(holder);

  // posição inicial: eixo inclinado para mostrar canais e face
  let rx = 0.9, ry = 0.5, vx = 0, vy = reduce ? 0 : 0.004;
  const idleVy = vy;
  let dragging = false, lx = 0, ly = 0, lastT = 0;

  const resize = () => {
    const s = wrap.clientWidth;
    renderer.setSize(s, s, false);
  };
  new ResizeObserver(resize).observe(wrap);
  resize();

  wrap.addEventListener('pointerdown', e => {
    dragging = true; lx = e.clientX; ly = e.clientY;
    wrap.classList.add('drag', 'touched');
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    ry += dx * 0.01; rx += dy * 0.01;
    vy = dx * 0.01; vx = dy * 0.01;
  });
  const end = () => { dragging = false; wrap.classList.remove('drag'); };
  wrap.addEventListener('pointerup', end);
  wrap.addEventListener('pointercancel', end);
  // teclado: acessibilidade
  wrap.tabIndex = 0;
  wrap.addEventListener('keydown', e => {
    const k = { ArrowLeft: [0, -.25], ArrowRight: [0, .25], ArrowUp: [-.25, 0], ArrowDown: [.25, 0] }[e.key];
    if (k) { rx += k[0]; ry += k[1]; e.preventDefault(); wrap.classList.add('touched'); }
  });

  let visible = false;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(wrap);

  const loop = () => {
    requestAnimationFrame(loop);
    if (!visible) return;
    if (!dragging) {
      // inércia, depois volta ao giro suave
      ry += vy; rx += vx;
      vx *= 0.94; vy += (idleVy - vy) * 0.03;
      if (Math.abs(vx) < 0.0002) vx = 0;
    }
    // Euler XYZ: gira em torno do próprio eixo (ry) e depois inclina (rx)
    holder.rotation.set(rx, ry, 0, 'XYZ');
    renderer.render(scene, camera);
  };
  loop();
})();
