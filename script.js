(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = false; // movimiento siempre activo
  const fine = matchMedia('(pointer:fine)').matches;

  $('#yr').textContent = new Date().getFullYear();

  /* ---------- Scroll progress + nav ---------- */
  const prog = $('#progress'), nav = $('#nav');
  const onScroll = () => {
    const h = document.documentElement;
    prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100 + '%';
    nav.classList.toggle('scrolled', h.scrollTop > 40);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger'), links = $('#links');
  burger.onclick = () => { burger.classList.toggle('on'); links.classList.toggle('open'); };
  $$('#links a').forEach(a => a.addEventListener('click', () => { burger.classList.remove('on'); links.classList.remove('open'); }));

  /* ---------- Reveal on scroll (stagger inside groups) ---------- */
  $$('.cards,.work,.steps,.values,.packs,.trust,.cta').forEach(g => $$('.reveal,.card,.w', g).forEach((el, i) => el.style.setProperty('--d', i * 0.09 + 's')));
  $$('.card,.w').forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Counters ---------- */
  const fmt = n => n.toLocaleString('es-AR');
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; co.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1800;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 4)));
      el.textContent = (el.dataset.sep ? fmt(v) : v) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => co.observe(el));

  /* ---------- Rotating word w/ scramble ---------- */
  const rot = $('#rot'), words = ['internet', 'el mundo', 'tus clientes', 'otro nivel', 'las redes'];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>';
  let wi = 0;
  const scramble = to => {
    let f = 0; const tot = 22;
    const id = setInterval(() => {
      rot.textContent = [...to].map((c, i) => c === ' ' ? ' ' : (i < f / tot * to.length ? c : chars[Math.random() * chars.length | 0])).join('');
      if (++f > tot) { clearInterval(id); rot.textContent = to; }
    }, 38);
  };
  if (!reduce) setInterval(() => { wi = (wi + 1) % words.length; scramble(words[wi]); }, 3200);

  /* ---------- Tilt + spotlight ---------- */
  if (fine && !reduce) {
    $$('.tilt').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
        el.style.transform = `perspective(900px) rotateY(${(px - .5) * 12}deg) rotateX(${(.5 - py) * 12}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => el.style.transform = '');
    });
    /* magnetic buttons */
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      el.addEventListener('mouseleave', () => el.style.transform = '');
    });
  }

  /* ---------- Portfolio filters ---------- */
  $$('#filters button').forEach(b => b.onclick = () => {
    $$('#filters button').forEach(x => x.classList.remove('on')); b.classList.add('on');
    $$('.w').forEach(w => {
      const show = b.dataset.f === 'all' || w.dataset.c === b.dataset.f;
      if (show) { w.hidden = false; requestAnimationFrame(() => w.classList.remove('hide')); }
      else { w.classList.add('hide'); setTimeout(() => { if (w.classList.contains('hide')) w.hidden = true; }, 350); }
    });
  });

  /* ---------- Pack buttons preselect service ---------- */
  $$('[data-pack]').forEach(b => b.addEventListener('click', () => { const s = $('#svc'); [...s.options].forEach(o => { if (o.text === b.dataset.pack) s.value = o.value || o.text; }); }));

  /* ---------- Form → WhatsApp ---------- */
  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const msg = `Hola Grupo Syntra! Soy ${f.get('n')}. Me interesa: ${f.get('s')}.${f.get('m') ? ' ' + f.get('m') : ''}`;
    open('https://wa.me/5493446698000?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });

  /* ---------- Particle network canvas ---------- */
  const cv = $('#bg'), g = cv.getContext('2d'); let W, H, P = [], mouse = { x: -999, y: -999 };
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => {
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(110, Math.floor(W * H / 15000));
    P = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .6 }));
  };
  addEventListener('resize', size); size();
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  const draw = () => {
    g.clearRect(0, 0, W, H);
    for (const p of P) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 140) { p.x += dx / d * 1.6; p.y += dy / d * 1.6; }
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fillStyle = 'rgba(0,212,255,.8)'; g.shadowColor = '#00d4ff'; g.shadowBlur = 8; g.fill();
    }
    g.shadowBlur = 0;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y);
      if (d < 120) { g.strokeStyle = `rgba(40,160,255,${(1 - d / 120) * .35})`; g.lineWidth = .7; g.beginPath(); g.moveTo(P[i].x, P[i].y); g.lineTo(P[j].x, P[j].y); g.stroke(); }
    }
    if (!reduce) requestAnimationFrame(draw);
  };
  draw();
})();
