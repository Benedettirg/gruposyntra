/* Mantarraya 3D nadando (Three.js) + órbita lenta de los elementos */
(() => {
  const box = document.getElementById('heroVisual');
  const cv = document.getElementById('manta3d');
  if (!box || !cv) return;
  const reduce = false; // movimiento siempre activo
  const orbiters = [...box.querySelectorAll('.chip, .device')];

  /* ---------- Órbita (funciona aunque falle Three.js) ---------- */
  const cfg = [ // [ángulo inicial, radio X, radio Y, velocidad]
    [0.0, .50, .20, 1], [1.05, .50, .20, 1], [2.1, .50, .20, 1], [3.15, .50, .20, 1],
    [4.2, .50, .20, 1], [5.25, .50, .20, 1]
  ];
  const order = ['.laptop', '.phone', '.c1', '.c2', '.c3', '.c4'];
  const items = order.map((s, i) => ({ el: box.querySelector(s), a: cfg[i][0] + i * 0.0 })).filter(o => o.el);
  const spread = items.length ? (Math.PI * 2) / items.length : 0;
  const placeOrbit = t => {
    const w = box.clientWidth, h = box.clientHeight;
    items.forEach((o, i) => {
      const ang = i * spread + t * 0.16;           // giro lento (~40 s por vuelta)
      const ring = (i % 2 ? 1 : 0.86);
      const x = Math.cos(ang) * Math.max(10, w * 0.5 - o.el.offsetWidth * 0.5 * 1.05) * ring;
      const y = Math.sin(ang) * h * 0.2 * ring + Math.sin(t * 0.9 + i) * 6 + h * 0.08;
      const d = (Math.sin(ang) + 1) / 2;           // 0 = al fondo, 1 = adelante
      const sc = 0.72 + d * 0.36;
      o.el.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) scale(${sc})`;
      o.el.style.opacity = 0.45 + d * 0.55;
      o.el.style.zIndex = d > 0.5 ? 6 : 1;
      o.el.style.filter = d > 0.5 ? 'none' : 'blur(.6px)';
    });
  };

  /* ---------- Three.js ---------- */
  let renderer, scene, camera, group, geo, orig, pos, N, mouse = { x: 0, y: 0 };
  const T3 = window.THREE;
  const build = () => {
    renderer = new T3.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    scene = new T3.Scene();
    camera = new T3.PerspectiveCamera(38, 1, .1, 100);
    camera.position.set(0, 7.5, 14); camera.lookAt(0, 0, 0);

    scene.add(new T3.AmbientLight(0x6fa8ff, .9));
    const l1 = new T3.PointLight(0x00d4ff, 2.2, 60); l1.position.set(-6, 9, 6); scene.add(l1);
    const l2 = new T3.PointLight(0x4a6bff, 1.6, 60); l2.position.set(7, -4, 8); scene.add(l2);
    const l3 = new T3.DirectionalLight(0xffffff, .8); l3.position.set(0, 10, 3); scene.add(l3);

    const g = new T3.PlaneGeometry(1, 1, 72, 54);
    pos = g.attributes.position; N = pos.count; orig = new Float32Array(N * 4); // x0,t,u,z0
    const col = new Float32Array(N * 3), cA = new T3.Color(0xe6f9ff), cB = new T3.Color(0x1b8bff), cT = new T3.Color(0x0a4aa8), c = new T3.Color();
    for (let i = 0; i < N; i++) {
      const u = pos.getX(i) * 2, t = pos.getY(i) + 0.5;           // u:[-1,1], t:[0,1] (nariz→cola)
      const s = Math.min(1, Math.max(0, (t - 0.33) / 0.67));
      const wing = t < 0.33 ? 5.2 * Math.pow(Math.sin(t / 0.33 * Math.PI / 2), 1.6) : 5.2 * Math.pow(1 - s, 2.3);
      const body = Math.max(0.06, 0.55 * Math.pow(1 - s * 0.95, 0.7) * (t > 0.7 ? (1 - (t - 0.7) / 0.3) * .6 + .2 : 1));
      const w = Math.max(wing, body);
      const x0 = u * w;
      const z0 = t * 7.4 - 2.2 + Math.abs(x0) * 0.16;            // puntas hacia atrás
      orig[i * 4] = x0; orig[i * 4 + 1] = t; orig[i * 4 + 2] = u; orig[i * 4 + 3] = z0;
      c.copy(cA).lerp(cB, Math.pow(Math.abs(u), 1.4) * 0.85);
      if (t > 0.6) c.lerp(cT, (t - 0.6) / 0.4 * 0.8);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T3.BufferAttribute(col, 3));
    geo = g;
    const mat = new T3.MeshPhongMaterial({ vertexColors: true, shininess: 90, specular: 0x88ddff, emissive: 0x06306a, emissiveIntensity: .8, side: T3.DoubleSide, transparent: true, opacity: .96 });
    const mesh = new T3.Mesh(g, mat);
    const wire = new T3.Mesh(g, new T3.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: .06 }));
    group = new T3.Group(); mesh.position.z = -1.4; wire.position.z = -1.4;
    group.add(mesh, wire); scene.add(group);
    document.getElementById('mantaFallback')?.classList.add('off');
    cv.classList.add('on');
  };

  const resize = () => {
    if (!renderer) return;
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const s = Math.min(0.9, (w / h) * 0.82); group.scale.setScalar(s);
  };

  const swim = T => {
    const sp = 2.3;
    for (let i = 0; i < N; i++) {
      const x0 = orig[i * 4], t = orig[i * 4 + 1], z0 = orig[i * 4 + 3], ax = Math.abs(x0);
      const flap = Math.sin(T * sp - ax * 0.5) * Math.pow(ax / 5.2, 1.4) * 1.55 + ax * 0.06;
      const bump = 0.55 * Math.exp(-x0 * x0 / 1.7) * Math.exp(-Math.pow(t - 0.24, 2) / 0.035);
      const und = Math.sin(T * sp - t * 5.5) * 0.2 * t;
      const tail = Math.max(0, t - 0.4);
      const sway = Math.sin(T * sp - t * 6.5) * 0.9 * tail * tail * 2.2;
      pos.setXYZ(i, x0 + sway, flap + bump + und, z0);
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
    group.position.y = Math.sin(T * sp * 0.5) * 0.35;
    group.rotation.y = Math.sin(T * 0.45) * 0.4 + mouse.x * 0.35;
    group.rotation.z = Math.sin(T * 0.45 + 1) * 0.12;
    group.rotation.x = -0.1 + mouse.y * 0.15 + Math.sin(T * sp * 0.5) * 0.04;
  };

  addEventListener('mousemove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });

  let visible = true, t0 = performance.now();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(box);
  new ResizeObserver(resize).observe(box);

  if (T3) { try { build(); resize(); } catch (e) { renderer = null; } }

  const loop = now => {
    const T = (now - t0) / 1000;
    if (visible) {
      placeOrbit(T);
      if (renderer) { swim(T); renderer.render(scene, camera); }
    }
    if (!reduce) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
