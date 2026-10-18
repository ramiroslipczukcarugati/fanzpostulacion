/* Escenas animadas de "La voz de los founders" (solo esta sección).
   Cada tarjeta tiene un loop de ~10 s armado con GSAP sobre el SVG inline.
   - Corren solo cuando la tarjeta está en pantalla y mostrando el frente.
   - Barra de progreso del loop y botón de pausa.
   - Al dar vuelta la tarjeta, el personaje principal saluda.
   - Con prefers-reduced-motion: cada escena queda quieta en su mejor momento.
   - Sin GSAP: queda el SVG estático (ya está dibujado en ese mejor momento). */
(function () {
  "use strict";

  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const RED = "#ff3131", BLUE = "#3b82f6", GREY = "#5b5b66";
  const LOOP = 10;

  function safe(fn, name) { try { return fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  // ---------- ayudas para personajes ----------
  function parts(svg, id) {
    const g = svg.querySelector("#" + id);
    const p = {
      g,
      armL: g.querySelector(".arm-l"), armR: g.querySelector(".arm-r"),
      legL: g.querySelector(".leg-l"), legR: g.querySelector(".leg-r"),
      eyes: g.querySelectorAll(".eye"), smile: g.querySelector(".smile"), talk: g.querySelector(".talk"),
      head: g.querySelector(".head"), torso: g.querySelector(".torso")
    };
    gsap.set([p.armL, p.armR], { transformOrigin: "50% 8%" });
    gsap.set([p.legL, p.legR], { transformOrigin: "50% 0%" });
    gsap.set(p.eyes, { transformOrigin: "50% 50%" });
    gsap.set(p.talk, { transformOrigin: "50% 50%" });
    gsap.set(p.head, { transformOrigin: "50% 100%" });
    return p;
  }

  function walk(tl, c, at, dur, steps) {
    const d = dur / steps;
    for (let i = 0; i < steps; i++) {
      const s = i % 2 ? 1 : -1;
      tl.to(c.legL, { rotation: 18 * s, duration: d, ease: "sine.inOut" }, at + i * d)
        .to(c.legR, { rotation: -18 * s, duration: d, ease: "sine.inOut" }, at + i * d)
        .to(c.torso, { y: -1.5, duration: d / 2, yoyo: true, repeat: 1, ease: "sine.inOut" }, at + i * d);
    }
    tl.to([c.legL, c.legR], { rotation: 0, duration: 0.15 }, at + dur);
  }

  function blink(tl, c, times) {
    times.forEach(t => tl.to(c.eyes, { scaleY: 0.1, duration: 0.07, yoyo: true, repeat: 1, ease: "none" }, t));
  }

  function talk(tl, c, from, to) {
    tl.set(c.smile, { opacity: 0 }, from).set(c.talk, { opacity: 1 }, from);
    const shapes = [0.35, 1.1, 0.6, 1.25, 0.45, 0.9, 1.15, 0.5];
    let k = 0;
    for (let t = from; t < to - 0.1; t += 0.16) {
      tl.to(c.talk, { scaleY: shapes[k++ % shapes.length], duration: 0.08, ease: "none" }, t);
    }
    tl.to(c.talk, { scaleY: 1, duration: 0.05 }, to - 0.05)
      .set(c.talk, { opacity: 0 }, to).set(c.smile, { opacity: 1 }, to);
  }

  function parallax(tl, svg, amounts) {
    Object.keys(amounts).forEach(sel => {
      const el = svg.querySelector(sel);
      if (!el) return;
      tl.to(el, { x: amounts[sel], duration: LOOP / 2, ease: "sine.inOut" }, 0)
        .to(el, { x: 0, duration: LOOP / 2, ease: "sine.inOut" }, LOOP / 2);
    });
  }

  function curtain(tl, svg) {
    const c = svg.querySelector(".curtain");
    tl.fromTo(c, { opacity: 1 }, { opacity: 0, duration: 0.35, ease: "none", immediateRender: false }, 0)
      .fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "none", immediateRender: false }, LOOP - 0.4);
  }

  function waver(arm, dir) {
    return () => {
      if (reduced || !arm) return;
      const prev = gsap.getProperty(arm, "rotation");
      gsap.timeline()
        .to(arm, { rotation: dir * 150, duration: 0.18, ease: "power2.out" })
        .to(arm, { rotation: dir * 122, duration: 0.11, yoyo: true, repeat: 3, ease: "sine.inOut" })
        .to(arm, { rotation: prev, duration: 0.2, ease: "power2.inOut" });
    };
  }

  // ---------- Escena 1: post de LinkedIn (hito) ----------
  function scene1(svg) {
    const $ = s => svg.querySelector(s), $$ = s => svg.querySelectorAll(s);
    const ceo = parts(svg, "s1-ceo");
    const tl = gsap.timeline({ paused: true });
    curtain(tl, svg);
    const T0 = 0.001;
    tl.set(ceo.g, { x: -30, y: 250 }, T0)
      .set(ceo.armR, { rotation: -8 }, T0)
      .set(ceo.armL, { rotation: 0 }, T0)
      .set($(".hmug"), { opacity: 1 }, T0)
      .set($(".dmug"), { opacity: 0 }, T0)
      .set($(".steam"), { opacity: 0 }, T0)
      .set($(".cone"), { opacity: 0 }, T0)
      .set($(".bulb"), { opacity: 0.15 }, T0)
      .set($(".lscreen"), { opacity: 0.12 }, T0)
      .set($(".screen-lines"), { opacity: 0 }, T0)
      .set($(".think"), { opacity: 0 }, T0)
      .set($$(".trail"), { scale: 0, transformOrigin: "50% 50%" }, T0)
      .set($(".cloud"), { scale: 0, transformOrigin: "30% 90%" }, T0)
      .set($$(".tbar"), { scaleY: 0, transformOrigin: "50% 100%" }, T0)
      .set($(".x3"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, T0)
      .set($$(".tp"), { opacity: 0, y: 6 }, T0)
      .set($(".lpost"), { opacity: 0, y: 10, x: 0, rotation: 0, scale: 1, transformOrigin: "50% 50%" }, T0)
      .set($$(".pline"), { scaleX: 0, transformOrigin: "0% 50%" }, T0)
      .set($(".pcursor"), { x: 0, y: 0, opacity: 1 }, T0)
      .set($(".pbtn"), { scale: 1, transformOrigin: "50% 50%" }, T0)
      .set($(".reacts"), { opacity: 1 }, T0)
      .set($$(".rx"), { scale: 0, opacity: 0, transformOrigin: "50% 50%" }, T0)
      .set($(".notif"), { opacity: 0, y: -40 }, T0);

    // 1) entra con la taza, se sienta, se prende la lámpara
    walk(tl, ceo, 0.2, 1.6, 6);
    tl.to(ceo.g, { x: 262, duration: 1.6, ease: "none" }, 0.2)
      .to(ceo.armL, { rotation: 12, duration: 0.27, yoyo: true, repeat: 5, ease: "sine.inOut" }, 0.2)
      .to(ceo.g, { y: 252, duration: 0.3, ease: "power2.out" }, 1.9)
      .set($(".hmug"), { opacity: 0 }, 2.05)
      .fromTo($(".dmug"), { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.2, immediateRender: false }, 2.05)
      .to(ceo.armR, { rotation: 4, duration: 0.25 }, 2.05)
      .to($(".bulb"), { opacity: 1, duration: 0.08 }, 2.25)
      .to($(".cone"), { keyframes: [{ opacity: 0.6, duration: 0.06 }, { opacity: 0.1, duration: 0.06 }, { opacity: 1, duration: 0.1 }] }, 2.25)
      .to($(".lscreen"), { opacity: 0.9, duration: 0.25 }, 2.4)
      .to($(".screen-lines"), { opacity: 0.55, duration: 0.25 }, 2.5)
      .to($(".steam"), { opacity: 0.5, duration: 0.4 }, 2.5)
      .to($(".steam"), { y: -3, duration: 1.2, yoyo: true, repeat: 5, ease: "sine.inOut" }, 2.5);

    // 2) escribe; globo con el gráfico que se multiplica por 3 y el equipo de 15
    for (let t = 2.45, i = 0; t < 4.5; t += 0.15, i++) {
      tl.to(ceo.armL, { rotation: i % 2 ? 44 : 36, duration: 0.15, ease: "sine.inOut" }, t);
    }
    tl.to(ceo.armL, { rotation: 40, duration: 0.15 }, 4.5)
      .set($(".think"), { opacity: 1 }, 2.55)
      .to($$(".trail"), { scale: 1, duration: 0.2, stagger: 0.12, ease: "back.out(2)" }, 2.55)
      .to($(".cloud"), { scale: 1, duration: 0.45, ease: "back.out(1.6)" }, 2.8)
      .to($$(".tbar"), { scaleY: 0.34, duration: 0.25, stagger: 0.08 }, 3.05)
      .to($$(".tbar"), { scaleY: 1, duration: 0.45, ease: "back.out(1.4)" }, 3.45)
      .to($(".x3"), { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.5)" }, 3.6)
      .to($$(".tp"), { opacity: 1, y: 0, duration: 0.18, stagger: 0.035 }, 3.8)
      .to($(".think"), { opacity: 0, duration: 0.3 }, 4.6)
      .to($(".cloud"), { scale: 0.85, duration: 0.3 }, 4.6);

    // 3) el post se arma línea por línea, cursor que titila, "Publicar"
    tl.to($(".lpost"), { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 4.75);
    const widths = [112, 100, 110, 70];
    widths.forEach((w, i) => {
      const t = 5.0 + i * 0.35;
      tl.set($(".pcursor"), { x: 0, y: i * 10 }, t)
        .to($$(".pline")[i], { scaleX: 1, duration: 0.3, ease: "none" }, t)
        .to($(".pcursor"), { x: w, duration: 0.3, ease: "none" }, t);
    });
    tl.to($(".pcursor"), { opacity: 0, duration: 0.08, yoyo: true, repeat: 3, ease: "steps(1)" }, 6.4)
      .to($(".pbtn"), { scale: 0.88, duration: 0.09, yoyo: true, repeat: 1 }, 6.45);

    // 4) el post sale volando; reacciones genéricas y comentarios (sin números)
    tl.to($(".lpost"), { y: -170, rotation: -10, scale: 0.6, opacity: 0, duration: 0.6, ease: "power2.in" }, 6.7)
      .to($$(".rx"), { scale: 1, opacity: 1, duration: 0.35, stagger: 0.08, ease: "back.out(2.2)" }, 6.9)
      .to($$(".rx"), { y: "-=24", opacity: 0, duration: 0.5, stagger: 0.05, ease: "power1.in" }, 7.65)
      .set($$(".rx"), { y: "+=24" }, 8.4);

    // 5) "Mensaje nuevo": festeja
    tl.to($(".notif"), { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.8)" }, 7.9)
      .to(ceo.armL, { rotation: 150, duration: 0.25, ease: "back.out(2)" }, 8.05)
      .to(ceo.armR, { rotation: -150, duration: 0.25, ease: "back.out(2)" }, 8.05)
      .to(ceo.g, { y: 240, duration: 0.18, yoyo: true, repeat: 3, ease: "power1.out" }, 8.1);
    talk(tl, ceo, 8.05, 8.95);
    tl.to([ceo.armL], { rotation: 0, duration: 0.25 }, 9.0)
      .to([ceo.armR], { rotation: -8, duration: 0.25 }, 9.0)
      .to($(".notif"), { opacity: 0, y: -20, duration: 0.3 }, 9.3);

    blink(tl, ceo, [1.0, 3.95, 6.9, 9.15]);
    tl.to($$(".star"), { opacity: 0.25, duration: 0.4, stagger: 0.3, yoyo: true, repeat: 1 }, 0.4)
      .to($$(".star"), { opacity: 0.25, duration: 0.4, stagger: 0.3, yoyo: true, repeat: 1 }, 6.0);
    parallax(tl, svg, { ".city": -7, ".layer-fg": -10 });
    return { tl, hero: 4.35, wave: waver(ceo.armR, -1) };
  }

  // ---------- Escena 2: hilo de X (por qué marca blanca) ----------
  function scene2(svg) {
    const $ = s => svg.querySelector(s), $$ = s => svg.querySelectorAll(s);
    const walker = parts(svg, "s2-walker");
    const guests = ["s2-p1", "s2-p2", "s2-p3"].map(id => parts(svg, id));
    const world = $(".world");
    const tl = gsap.timeline({ paused: true });
    curtain(tl, svg);
    const T0 = 0.001;
    tl.set(walker.g, { x: -30 }, T0)
      .set(walker.armR, { rotation: 0 }, T0)
      .set(world, { scale: 1, svgOrigin: "150 200" }, T0)
      .set($(".bigphone"), { opacity: 0, scale: 0.85, transformOrigin: "50% 50%" }, T0)
      .set($$(".tw"), { opacity: 0, y: 12 }, T0)
      .set($$(".paint, .paint2"), { scaleX: 0, transformOrigin: "0% 50%" }, T0)
      .set($(".coin"), { x: 0, y: 0, scale: 1, opacity: 1, transformOrigin: "50% 50%" }, T0)
      .set($(".barfill"), { scaleX: 0.3, transformOrigin: "0% 50%" }, T0)
      .set($(".p30"), { opacity: 1 }, T0).set($(".p70"), { opacity: 0 }, T0)
      .set($(".tick"), { strokeDashoffset: 48 }, T0)
      .set($$(".tdot"), { attr: { fill: GREY } }, T0);
    const starts = [-60, -100, -140];
    guests.forEach((g, i) => tl.set(g.g, { x: starts[i], opacity: 1, scale: [0.95, 0.9, 0.95][i] }, T0));

    // 1) camina por la calle con el celular
    walk(tl, walker, 0.15, 1.75, 6);
    tl.to(walker.g, { x: 112, duration: 1.75, ease: "none" }, 0.15)
      .to(walker.armL, { rotation: 14, duration: 0.29, yoyo: true, repeat: 5, ease: "sine.inOut" }, 0.15)
      .to(walker.armR, { rotation: -60, duration: 0.35, ease: "power2.out" }, 1.95)
      .to($(".pscreen"), { opacity: 0.5, duration: 0.2, yoyo: true, repeat: 3 }, 2.0);

    // 2) zoom al celular: el hilo tweet por tweet
    tl.to(world, { scale: 2.7, svgOrigin: "150 200", duration: 0.7, ease: "power2.inOut" }, 2.1)
      .to($(".bigphone"), { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }, 2.55);
    const tw = i => $(".tw" + i);
    const show = (i, t, hold) => {
      tl.to(tw(i), { opacity: 1, y: 0, duration: 0.2 }, t)
        .set($$(".tdot")[i - 1], { attr: { fill: BLUE } }, t)
        .to(tw(i), { opacity: 0, y: -12, duration: 0.18 }, t + hold)
        .set($$(".tdot")[i - 1], { attr: { fill: GREY } }, t + hold + 0.18);
    };
    show(1, 3.0, 0.85);
    show(2, 3.95, 0.92);
    tl.to($(".paint"), { scaleX: 1, duration: 0.4, ease: "power2.inOut" }, 4.2)
      .to($(".paint2"), { scaleX: 1, duration: 0.3, ease: "power2.inOut" }, 4.45);
    show(3, 4.97, 0.88);
    tl.to($(".coin"), { keyframes: { x: [0, 40, 83], y: [0, -16, 41], ease: "none" }, duration: 0.55, ease: "power1.inOut" }, 5.1)
      .to($(".coin"), { scale: 0.4, opacity: 0, duration: 0.15 }, 5.6);
    show(4, 5.95, 0.9);
    tl.to($(".barfill"), { scaleX: 0.72, duration: 0.55, ease: "power2.out" }, 6.1)
      .set($(".p30"), { opacity: 0 }, 6.45).set($(".p70"), { opacity: 1 }, 6.45);
    tl.to(tw(5), { opacity: 1, y: 0, duration: 0.2 }, 6.95)
      .set($$(".tdot")[4], { attr: { fill: BLUE } }, 6.95)
      .to($(".tick"), { strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }, 7.05)
      .to(tw(5), { opacity: 0, duration: 0.2 }, 7.55)
      .set($$(".tdot")[4], { attr: { fill: GREY } }, 7.75);

    // 3) zoom afuera: la gente entra al teatro con sus entradas
    tl.to($(".bigphone"), { opacity: 0, scale: 0.9, duration: 0.3 }, 7.55)
      .to(world, { scale: 1, svgOrigin: "150 200", duration: 0.6, ease: "power2.inOut" }, 7.65)
      .to(walker.armR, { rotation: -20, duration: 0.3 }, 7.9);
    const doors = [214, 230, 292];
    guests.forEach((g, i) => {
      const at = 7.95 + i * 0.22, dur = 1.15;
      walk(tl, g, at, dur, 5);
      tl.to(g.g, { x: doors[i], duration: dur, ease: "none" }, at)
        .to(g.g, { opacity: 0, duration: 0.25 }, at + dur);
    });
    tl.to($$(".bulb"), { opacity: 0.3, duration: 0.2, stagger: 0.03, yoyo: true, repeat: 1 }, 0.4)
      .to($$(".bulb"), { opacity: 0.3, duration: 0.15, stagger: { each: 0.02, yoyo: true, repeat: 3 } }, 8.0);
    blink(tl, walker, [1.0, 8.4, 9.3]);
    guests.forEach((g, i) => blink(tl, g, [8.6 + i * 0.2]));
    parallax(tl, svg, { ".layer-bg": -6 });
    tl.fromTo($(".dashes"), { x: 0 }, { x: -46, duration: LOOP, ease: "none", immediateRender: false }, 0);
    return { tl, hero: 8.75, wave: waver(walker.armL, 1) };
  }

  // ---------- Escena 3: guion hablado (lanzamiento de Fanz AI) ----------
  function scene3(svg) {
    const $ = s => svg.querySelector(s), $$ = s => svg.querySelectorAll(s);
    const cto = parts(svg, "s3-cto");
    const op = parts(svg, "s3-op");
    const tl = gsap.timeline({ paused: true });
    curtain(tl, svg);
    const T0 = 0.001;
    tl.set($(".rec"), { opacity: 0 }, T0)
      .set($(".recdot"), { opacity: 1 }, T0)
      .set($(".prompt"), { opacity: 0, x: 10 }, T0)
      .set($(".phl"), { y: 0 }, T0)
      .set($(".ai"), { opacity: 0, scale: 0.9, transformOrigin: "50% 50%" }, T0)
      .set($$(".chip"), { opacity: 0, scale: 0.6, transformOrigin: "0% 50%" }, T0)
      .set($$(".spark"), { scale: 0, rotation: 0, transformOrigin: "50% 50%" }, T0)
      .set($(".clap"), { opacity: 0, y: 20, scale: 0.8, transformOrigin: "50% 50%" }, T0)
      .set($(".clap-arm"), { rotation: -28, transformOrigin: "0% 100%" }, T0)
      .set($(".cut"), { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" }, T0)
      .set([cto.armL, cto.armR, op.armR], { rotation: 0 }, T0);

    // 1) set: claqueta "TOMA 1" que se cierra
    tl.to($(".clap"), { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, 0.2)
      .to($(".clap-arm"), { rotation: 0, duration: 0.12, ease: "power4.in" }, 0.85)
      .to($(".clap"), { x: 3, duration: 0.04, yoyo: true, repeat: 3 }, 0.97)
      .to($(".clap"), { opacity: 0, y: -30, duration: 0.3 }, 1.2);

    // 2) REC y habla a cámara
    tl.to($(".rec"), { opacity: 1, duration: 0.1 }, 1.5)
      .to($(".recdot"), { opacity: 0.2, duration: 0.25, yoyo: true, repeat: 25, ease: "steps(1)" }, 1.55);
    talk(tl, cto, 1.7, 8.1);
    tl.to(cto.armR, { rotation: -40, duration: 0.3, ease: "power2.out" }, 2.0)
      .to(cto.armR, { rotation: -8, duration: 0.3 }, 2.8)
      .to(cto.armL, { rotation: 34, duration: 0.3, ease: "power2.out" }, 3.4)
      .to(cto.armL, { rotation: 6, duration: 0.3 }, 4.2)
      .to(cto.armR, { rotation: -62, duration: 0.3, ease: "power2.out" }, 5.0)
      .to(cto.armR, { rotation: -10, duration: 0.3 }, 6.2)
      .to(cto.armL, { rotation: 28, duration: 0.3 }, 6.8)
      .to(cto.armL, { rotation: 0, duration: 0.3 }, 7.6)
      .to(cto.head, { rotation: 3, duration: 0.5, yoyo: true, repeat: 11, ease: "sine.inOut" }, 1.8);

    // 3) teleprompter al ritmo de lo que dice
    tl.to($(".prompt"), { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }, 2.3);
    [2.6, 3.4, 4.2, 5.0, 5.8].forEach((t, i) => tl.to($(".phl"), { y: i * 13, duration: 0.2, ease: "power1.inOut" }, t));

    // 4) panel Fanz AI con 4 chips y destellos
    tl.to($(".ai"), { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.5)" }, 5.1)
      .to($$(".chip"), { opacity: 1, scale: 1, duration: 0.3, stagger: 0.32, ease: "back.out(2)" }, 5.4);
    $$(".spark").forEach((s, i) => {
      tl.to(s, { scale: 1, rotation: 90, duration: 0.25, ease: "back.out(3)" }, 5.45 + i * 0.32)
        .to(s, { scale: 0, rotation: 180, duration: 0.25 }, 5.95 + i * 0.32);
    });

    // 5) "¡Corte!": el camarógrafo levanta el pulgar
    tl.to($(".cut"), { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.2)" }, 8.15)
      .to($(".rec"), { opacity: 0, duration: 0.1 }, 8.15)
      .to([$(".ai"), $(".prompt")], { opacity: 0, duration: 0.3 }, 8.3)
      .to(op.armR, { rotation: -165, duration: 0.3, ease: "back.out(2)" }, 8.35)
      .to(op.head, { rotation: -6, duration: 0.2, yoyo: true, repeat: 1 }, 8.4)
      .to($(".cut"), { opacity: 0, duration: 0.3 }, 9.2)
      .to(op.armR, { rotation: 0, duration: 0.3 }, 9.25);

    blink(tl, cto, [1.2, 4.6, 7.9]);
    blink(tl, op, [3.0, 6.3, 9.0]);
    tl.to($(".ring circle:nth-child(2)"), { opacity: 0.6, duration: 0.6, yoyo: true, repeat: 1 }, 2.0);
    parallax(tl, svg, { ".layer-bg": -6, ".camera": -9 });
    return { tl, hero: 7.4, wave: waver(cto.armL, 1) };
  }

  const builders = { 1: scene1, 2: scene2, 3: scene3 };

  function boot() {
    const cards = Array.from(document.querySelectorAll("[data-scene-card]"));
    if (!cards.length || !window.gsap) return;
    root.classList.add(reduced ? "scenes-static" : "scenes-ready");

    cards.forEach(card => safe(() => {
      const n = card.dataset.sceneCard;
      const svg = card.querySelector(".scene-svg");
      const bar = card.querySelector("[data-scene-bar]");
      const btn = card.querySelector("[data-scene-pause]");
      const built = builders[n] && builders[n](svg);
      if (!built) return;
      const { tl, hero, wave } = built;
      tl.eventCallback("onUpdate", () => { if (bar) bar.style.transform = "scaleX(" + tl.progress().toFixed(4) + ")"; });
      tl.eventCallback("onComplete", () => tl.restart());

      if (reduced) {
        // Quieta en su momento más lindo; giro instantáneo (CSS)
        tl.progress(hero / tl.duration()).pause();
        return;
      }

      const state = { visible: false, flipped: false, userPaused: false, waving: false };
      const sync = () => {
        const run = state.visible && !state.flipped && !state.userPaused && !state.waving;
        if (run) tl.play(); else tl.pause();
      };

      if (btn) {
        btn.addEventListener("click", e => {
          e.stopPropagation();
          state.userPaused = !state.userPaused;
          btn.setAttribute("aria-pressed", state.userPaused ? "true" : "false");
          btn.setAttribute("aria-label", state.userPaused ? "Reanudar la animación" : "Pausar la animación");
          sync();
        });
      }

      card.addEventListener("flipchange", e => {
        state.flipped = !!(e.detail && e.detail.flipped);
        state.waving = true;
        tl.pause();
        wave();
        setTimeout(() => { state.waving = false; sync(); }, 900);
      });

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(entries => {
          entries.forEach(en => { state.visible = en.isIntersecting; sync(); });
        }, { threshold: 0.25 }).observe(card);
      } else {
        state.visible = true; sync();
      }
    }, "scene" + card.dataset.sceneCard));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
