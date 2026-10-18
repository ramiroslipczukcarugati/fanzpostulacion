(function () {
  "use strict";

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasIO = typeof IntersectionObserver !== "undefined";
  // En el artifact de Claude (o abriendo el archivo local) no se permiten iframes externos: solo tarjetas
  const noEmbeds = location.protocol === "file:" || root.dataset.host === "artifact";
  const RED = [255, 49, 49];
  const BLUE = [59, 130, 246];

  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  function hasGsap() { return !!(window.gsap && window.ScrollTrigger); }

  // Ejecuta cb una sola vez cuando el elemento entra en pantalla
  function onEnter(els, cb, margin) {
    if (!hasIO) { els.forEach(cb); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } });
    }, { threshold: 0.01, rootMargin: margin || "0px 0px -8% 0px" });
    els.forEach(el => io.observe(el));
  }

  /* Nav sólida al scrollear + barra de progreso de lectura */
  function initNav() {
    const nav = $("[data-nav]");
    const bar = $("[data-progress]");
    let raf = null;
    function update() {
      raf = null;
      if (nav) nav.classList.toggle("is-scrolled", scrollY > 40);
      if (bar) {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
      }
    }
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* El fondo pasa de rojo (lo que hice) a celeste (lo que haría) entre "IA" y "Qué haría en Fanz" */
  function initAmbient() {
    const amb = $("[data-ambient]");
    const glow = $("[data-cursor-glow]");
    const from = $("#numeros");
    const to = $("#fanz");
    if (!amb || !from || !to) return;
    let raf = null;
    function update() {
      raf = null;
      const start = from.offsetTop + from.offsetHeight * 0.6;
      const end = to.offsetTop;
      const y = scrollY + innerHeight * 0.5;
      const t = Math.max(0, Math.min(1, (y - start) / Math.max(1, end - start)));
      const c = RED.map((v, i) => Math.round(v + (BLUE[i] - v) * t)).join(", ");
      amb.style.setProperty("--amb", c);
      if (glow) glow.style.setProperty("--glow", c);
    }
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* Dos luces en el inicio que siguen el mouse (en touch, derivan solas) */
  function initGlow() {
    const hero = $(".hero");
    const a = $('[data-glow="a"]');
    const b = $('[data-glow="b"]');
    if (!hero || !a || !b) return;
    let w = hero.clientWidth, h = hero.clientHeight;
    let tx = 0.72, ty = 0.18, cx = tx, cy = ty;
    let pointer = false, visible = true, raf = null;

    addEventListener("resize", () => { w = hero.clientWidth; h = hero.clientHeight; });
    if (fineHover) {
      hero.addEventListener("pointermove", e => {
        const r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width;
        ty = (e.clientY - r.top) / r.height;
        pointer = true;
      });
      hero.addEventListener("pointerleave", () => { pointer = false; });
    }
    if (hasIO) {
      new IntersectionObserver(es => {
        visible = es[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
      }).observe(hero);
    }
    const speed = reduced ? 0.00008 : 0.00022;
    function frame(t) {
      raf = null;
      if (!visible) return;
      if (!pointer) {
        tx = 0.62 + Math.sin(t * speed) * 0.25;
        ty = 0.28 + Math.cos(t * speed * 1.3) * 0.18;
      }
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      a.style.transform = "translate3d(" + (cx * w).toFixed(1) + "px," + (cy * h).toFixed(1) + "px,0)";
      b.style.transform = "translate3d(" + ((1 - cx * 0.8) * w).toFixed(1) + "px," + ((0.9 - cy * 0.5) * h).toFixed(1) + "px,0)";
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  /* Contadores: el valor final está en el HTML; se anima al entrar en pantalla */
  function initCountUp() {
    onEnter($$("[data-count]"), el => {
      const finalText = el.textContent;
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || "0", 10);
      if (!isFinite(target)) return;
      const fmt = v => v.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      const dur = 1400;
      const t0 = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = p < 1 ? fmt(target * eased) : finalText;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  function initBars() {
    onEnter($$("[data-bar]"), el => el.classList.add("is-play"));
  }

  /* Video: la tarjeta abre Drive en otra pestaña. Donde se permiten iframes
     (Netlify/Hostinger), se intenta el reproductor de Drive en 9:16; si no carga, queda la tarjeta. */
  function initVideo() {
    const sec = $("[data-video-url]");
    if (!sec || noEmbeds) return;
    const src = sec.dataset.videoEmbed;
    const card = $("[data-video-card]", sec);
    const holder = $("[data-video-frame]", sec);
    const open = $("[data-video-open]", sec);
    if (!src || !card || !holder) return;
    onEnter([sec], () => {
      const frame = document.createElement("iframe");
      frame.src = src;
      frame.title = "Video de postulación de Ramiro Carugati Slipczuk";
      frame.allow = "autoplay; fullscreen";
      frame.allowFullscreen = true;
      holder.classList.add("is-loading");
      holder.hidden = false;
      const giveUp = setTimeout(() => { holder.innerHTML = ""; holder.hidden = true; }, 12000);
      frame.addEventListener("load", () => {
        clearTimeout(giveUp);
        holder.classList.remove("is-loading");
        card.hidden = true;
        if (open) open.hidden = false;
        if (hasGsap()) ScrollTrigger.refresh();
      }, { once: true });
      holder.appendChild(frame);
    }, "600px 0px 600px 0px");
  }

  /* Reel: intenta el embed oficial de Instagram; si no carga, queda la tarjeta */
  function initReel() {
    const fig = $("[data-reel]");
    if (!fig || noEmbeds) return;
    const fallback = $("[data-reel-fallback]", fig);
    const embed = $("[data-reel-embed]", fig);
    onEnter([fig], () => {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.instagram.com/embed.js";
      s.onload = () => {
        try {
          embed.classList.add("is-loading");
          embed.hidden = false;
          if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
        } catch (e) { embed.hidden = true; return; }
        let tries = 0, bound = false;
        const giveUp = setTimeout(() => {
          if (!fallback.hidden) { embed.hidden = true; embed.classList.remove("is-loading"); }
        }, 10000);
        const check = setInterval(() => {
          tries++;
          const frame = $("iframe", embed);
          if (frame && !bound) {
            bound = true;
            clearInterval(check);
            frame.addEventListener("load", () => {
              clearTimeout(giveUp);
              embed.classList.remove("is-loading");
              fallback.hidden = true;
              if (hasGsap()) setTimeout(() => ScrollTrigger.refresh(), 800);
            }, { once: true });
          } else if (tries > 20) {
            clearInterval(check);
          }
        }, 250);
      };
      s.onerror = () => { embed.hidden = true; };
      document.body.appendChild(s);
    }, "400px 0px 400px 0px");
  }

  /* Carrusel del caso real: flechas y puntos (también se desliza con el dedo) */
  function initCarousel() {
    $$("[data-carousel]").forEach(car => {
      const track = $("[data-carousel-track]", car);
      const dots = $$("[data-carousel-dots] i", car);
      const prev = $("[data-carousel-prev]", car);
      const next = $("[data-carousel-next]", car);
      if (!track) return;
      const slides = Array.from(track.children);
      const index = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      const go = i => {
        const n = Math.max(0, Math.min(slides.length - 1, i));
        track.scrollTo({ left: slides[n].offsetLeft - track.offsetLeft, behavior: reduced ? "auto" : "smooth" });
      };
      if (prev) prev.addEventListener("click", () => go(index() - 1));
      if (next) next.addEventListener("click", () => go(index() + 1));
      let raf = null;
      track.addEventListener("scroll", () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const i = index();
          dots.forEach((d, k) => d.classList.toggle("is-on", k === i));
        });
      }, { passive: true });
    });
  }

  /* Tarjetas que se dan vuelta: frente (canal y formato) / dorso (texto) */
  function initFlip() {
    const cards = $$("[data-flip]");
    if (!cards.length) return;
    root.classList.add("flip-ready");
    cards.forEach(card => {
      const btn = $("[data-flip-btn]", card);
      const inner = $(".flip-inner", card);
      const front = $(".flip-front", card);
      const back = $(".flip-back", card);
      // La cara oculta no se puede enfocar ni la lee el lector de pantalla
      const faces = on => {
        if (front) front.inert = on;
        if (back) back.inert = !on;
      };
      faces(false);
      const toggle = () => {
        const on = card.classList.toggle("is-flipped");
        faces(on);
        if (btn) {
          btn.setAttribute("aria-pressed", on ? "true" : "false");
          btn.textContent = on ? "Volver a la escena ↺" : "Ver el texto ↻";
          const label = on ? btn.dataset.labelBack : btn.dataset.labelFront;
          if (label) btn.setAttribute("aria-label", label);
        }
        card.dispatchEvent(new CustomEvent("flipchange", { detail: { flipped: on } }));
      };
      // Botón: clic, toque y teclado (Enter o Espacio, nativo del botón)
      if (btn) btn.addEventListener("click", toggle);
      // Clic o toque en la tarjeta (menos en links y en el botón de pausa)
      if (inner) inner.addEventListener("click", e => { if (!e.target.closest("a, button")) toggle(); });
    });
  }

  /* Copiar mail */
  function initCopy() {
    $$("[data-copy]").forEach(btn => {
      const original = btn.textContent;
      btn.addEventListener("click", () => {
        const text = btn.dataset.copy;
        const done = () => { btn.textContent = "Copiado"; setTimeout(() => { btn.textContent = original; }, 1800); };
        const fallback = () => {
          const el = $("[data-email]");
          if (!el) return;
          const r = document.createRange();
          r.selectNodeContents(el);
          const sel = getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
          btn.textContent = "Seleccionado: copialo";
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else { fallback(); }
      });
    });
  }

  /* ---------- Animaciones con GSAP (si no carga, todo queda visible) ---------- */

  // Título del inicio: se arma letra por letra (respeta <em> y no corta palabras)
  function initHeroChars() {
    const el = $("[data-chars]");
    if (!el || reduced) return;
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    const chars = [];
    const wrap = text => {
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
        const w = document.createElement("span");
        w.className = "w";
        w.setAttribute("aria-hidden", "true");
        Array.from(part).forEach(ch => {
          const c = document.createElement("span");
          c.className = "ch";
          c.textContent = ch;
          w.appendChild(c);
          chars.push(c);
        });
        frag.appendChild(w);
      });
      return frag;
    };
    Array.from(el.childNodes).forEach(node => {
      if (node.nodeType === 3) el.replaceChild(wrap(node.textContent), node);
      else if (node.nodeType === 1) {
        const text = node.textContent;
        node.textContent = "";
        node.appendChild(wrap(text));
      }
    });
    const tw = gsap.from(chars, { y: "0.45em", opacity: 0, rotate: 6, duration: 0.7, ease: "power3.out", stagger: 0.016, delay: 0.1 });
    // Si la pestaña arranca en segundo plano (sin cuadros de animación), el título igual aparece
    setTimeout(() => tw.progress(1), 3200);
  }

  // Revelado escalonado de cada bloque
  function initReveals() {
    const els = $$("[data-reveal]");
    if (!els.length || reduced) return;
    gsap.set(els, { autoAlpha: 0, y: 36 });
    ScrollTrigger.batch(els, {
      start: "top 90%",
      once: true,
      onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.12, overwrite: true })
    });
    // Red de seguridad: a los 6 s, lo que esté en pantalla y siga oculto se muestra
    setTimeout(() => {
      els.forEach(el => {
        if (getComputedStyle(el).visibility === "hidden" && el.getBoundingClientRect().top < innerHeight) {
          gsap.set(el, { autoAlpha: 1, y: 0 });
        }
      });
    }, 6000);
  }

  // Parallax suave en las fotos
  function initParallax() {
    if (reduced) return;
    $$("[data-parallax]").forEach(img => {
      if (img.classList.contains("hero-photo")) {
        if (innerWidth < 960) return;
        gsap.to(img, { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        return;
      }
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  // La división en dos: el bloque "Contenido Fanz" se parte y cada mitad se va a su lado
  function initDuo() {
    const duo = $("[data-duo]");
    if (!duo || reduced) return;
    const a = $(".duo-a", duo);
    const b = $(".duo-b", duo);
    const mm = gsap.matchMedia();
    const build = (vars) => {
      root.classList.add("duo-anim");
      const tl = gsap.timeline({ scrollTrigger: { trigger: duo, start: "top 72%", end: "top 12%", scrub: 0.6 } });
      tl.to(a, Object.assign({ ease: "power2.in", duration: 1 }, vars.a), 0)
        .to(b, Object.assign({ ease: "power2.in", duration: 1 }, vars.b), 0)
        .to([a, b], { autoAlpha: 0, ease: "none", duration: 0.3 }, 0.7);
      return () => root.classList.remove("duo-anim");
    };
    mm.add("(min-width: 720px)", () => build({ a: { xPercent: -62, rotate: -4 }, b: { xPercent: 62, rotate: 4 } }));
    mm.add("(max-width: 719px)", () => build({ a: { yPercent: -70 }, b: { yPercent: 70 } }));
  }

  // Cierre: las dos frases vienen de lados opuestos y se juntan
  function initJoin() {
    const join = $("[data-join]");
    if (!join || reduced) return;
    const a = $(".join-a", join), b = $(".join-b", join), end = $(".join-end", join);
    const mm = gsap.matchMedia();
    const st = { trigger: join, start: "top 92%", end: "top 45%", scrub: 0.6 };
    mm.add("(min-width: 720px)", () => {
      gsap.timeline({ scrollTrigger: st })
        .from(a, { xPercent: -45, opacity: 0.15 }, 0).from(b, { xPercent: 45, opacity: 0.15 }, 0)
        .from(end, { y: 20, opacity: 0 }, 0.3);
    });
    mm.add("(max-width: 719px)", () => {
      gsap.timeline({ scrollTrigger: st })
        .from(a, { y: -40, opacity: 0.15 }, 0).from(b, { y: 40, opacity: 0.15 }, 0)
        .from(end, { y: 20, opacity: 0 }, 0.3);
    });
  }

  // Celulares y placas que se inclinan con el mouse (en touch flotan solos por CSS)
  function initTilt() {
    if (!fineHover || reduced) return;
    $$("[data-tilt]").forEach(el => {
      const host = el.closest(".fmt-card, .brand-card") || el;
      gsap.set(el, { transformPerspective: 800 });
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });
      host.addEventListener("pointermove", e => {
        const r = host.getBoundingClientRect();
        rx(-((e.clientY - r.top) / r.height - 0.5) * 16);
        ry(((e.clientX - r.left) / r.width - 0.5) * 18);
      });
      host.addEventListener("pointerleave", () => { rx(0); ry(0); });
    });
  }

  // Botones magnéticos
  function initMagnetic() {
    if (!fineHover || reduced) return;
    $$("[data-magnetic]").forEach(btn => {
      const x = gsap.quickTo(btn, "x", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
      const y = gsap.quickTo(btn, "y", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
      btn.addEventListener("pointermove", e => {
        const r = btn.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.3);
        y((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener("pointerleave", () => { x(0); y(0); });
    });
  }

  // Brillo que sigue al cursor (solo desktop)
  function initCursorGlow() {
    const glow = $("[data-cursor-glow]");
    if (!glow || !fineHover) return;
    const x = gsap.quickTo(glow, "x", { duration: 0.6, ease: "power3.out" });
    const y = gsap.quickTo(glow, "y", { duration: 0.6, ease: "power3.out" });
    let shown = false;
    addEventListener("pointermove", e => {
      if (!shown) { gsap.set(glow, { x: e.clientX, y: e.clientY }); root.classList.add("has-cursor-glow"); shown = true; }
      x(e.clientX); y(e.clientY);
    }, { passive: true });
    document.addEventListener("pointerleave", () => root.classList.remove("has-cursor-glow"));
    document.addEventListener("pointerenter", () => { if (shown) root.classList.add("has-cursor-glow"); });
  }

  // Sin GSAP: revelado simple que solo desplaza (el contenido nunca queda oculto)
  function initRevealFallback() {
    root.classList.add("reveal-io");
    onEnter($$("[data-reveal]"), el => el.classList.add("is-in"), "0px 0px -2% 0px");
    setTimeout(() => $$("[data-reveal]").forEach(el => el.classList.add("is-in")), 6000);
  }

  function boot() {
    safe(initNav, "initNav");
    safe(initAmbient, "initAmbient");
    safe(initGlow, "initGlow");
    safe(initCountUp, "initCountUp");
    safe(initBars, "initBars");
    safe(initVideo, "initVideo");
    safe(initReel, "initReel");
    safe(initCarousel, "initCarousel");
    safe(initFlip, "initFlip");
    safe(initCopy, "initCopy");

    if (hasGsap()) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      // El tiempo manda: si se pierden cuadros, las animaciones terminan igual a tiempo
      gsap.ticker.lagSmoothing(0);
      safe(initHeroChars, "initHeroChars");
      safe(initReveals, "initReveals");
      safe(initParallax, "initParallax");
      safe(initDuo, "initDuo");
      safe(initJoin, "initJoin");
      safe(initTilt, "initTilt");
      safe(initMagnetic, "initMagnetic");
      safe(initCursorGlow, "initCursorGlow");
      addEventListener("load", () => ScrollTrigger.refresh());
    } else {
      safe(initRevealFallback, "initRevealFallback");
    }
    // El título ya está listo (animado o no): se levanta la espera
    root.classList.remove("anim-wait");
    root.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
