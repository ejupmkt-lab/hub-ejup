/* Caderno de obra · interações */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* ---------- marcas de caneta: injeta o SVG ---------- */
  const SHAPES = {
    circ: { vb: '0 0 100 60', d: 'M 12 36 C 4 18, 30 2, 55 3 C 82 4, 100 18, 98 33 C 96 50, 72 59, 48 58 C 22 57, 2 48, 4 34 C 5 29, 6 27, 7 26' },
    under: { vb: '0 0 100 12', d: 'M 2 7 C 25 5, 45 9, 65 6 S 90 8, 99 5' },
    strike: { vb: '0 0 100 20', d: 'M 1 12 C 30 8, 60 11, 99 6' },
  };
  $$('.circ, .under, .strike').forEach(el => {
    if (el.querySelector('svg')) return;
    const kind = el.classList.contains('circ') ? 'circ' : el.classList.contains('under') ? 'under' : 'strike';
    const s = SHAPES[kind];
    el.insertAdjacentHTML('beforeend', `<svg viewBox="${s.vb}" preserveAspectRatio="none" aria-hidden="true"><path d="${s.d}" pathLength="1"></path></svg>`);
  });

  /* ---------- capítulos, progresso, navegação ---------- */
  const caps = $$('.cap');
  const nav = $('#obraNav');
  caps.forEach((c, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${c.id}" title="${c.dataset.title}" aria-label="${c.dataset.title}"></a>`;
    nav.appendChild(li);
  });
  const navLinks = $$('#obraNav a');
  const fill = $('#obraFill'), pct = $('#obraPct');
  let current = 0;

  function onScroll() {
    const h = document.documentElement;
    const p = Math.min(1, Math.max(0, h.scrollTop / (h.scrollHeight - h.clientHeight)));
    fill.style.width = (p * 100) + '%';
    pct.textContent = Math.round(p * 100) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const i = caps.indexOf(e.target);
      if (e.isIntersecting) {
        current = i;
        navLinks.forEach((a, k) => { a.classList.toggle('is-on', k === i); if (k < i) a.classList.add('is-done'); });
        e.target.classList.add('is-seen');
        $$('[data-draw]', e.target).forEach((d, k) => setTimeout(() => d.classList.add('is-drawn'), 250 + k * 220));
        $$('[data-stagger]', e.target).forEach(s => s.classList.add('is-in'));
        $$('[data-bars]', e.target).forEach(b => b.classList.add('is-on'));
        if (e.target.id === 'visao') setTimeout(() => $('#timeline').classList.add('is-drawn'), 300);
      }
    });
  }, { threshold: 0.35 });
  caps.forEach(c => io.observe(c));

  // sub-observador para blocos dentro de capítulos longos
  const io2 = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); $$('[data-draw]', e.target).forEach(d => d.classList.add('is-drawn')); }
  }), { threshold: 0.25 });
  $$('[data-stagger], .challenge, .rule').forEach(el => io2.observe(el));

  addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight' && !e.target.closest('.track')) { e.preventDefault(); caps[Math.min(caps.length - 1, current + 1)].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
    if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft' && !e.target.closest('.track')) { e.preventDefault(); caps[Math.max(0, current - 1)].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  });

  /* ---------- carimbos ---------- */
  const stamps = new Set(JSON.parse(localStorage.getItem('rp-stamps') || '[]'));
  function renderStamps() {
    $$('[data-stamp]').forEach(s => s.classList.toggle('is-on', stamps.has(+s.dataset.stamp)));
    $('#stampCount').textContent = stamps.size;
    const t = $('#doneTitle'), d = $('#doneText');
    if (stamps.size === 3) { t.textContent = 'Obra carimbada'; d.textContent = 'Você conectou a estrutura, achou a palavra certa e passou pelo protocolo. Este caderno agora é seu também.'; }
    else if (stamps.size > 0) { t.textContent = 'Obra em andamento'; d.textContent = `${stamps.size} de 3 carimbos. Os desafios estão nos capítulos “Desafio 1”, “Direção” e “Desafio 3”.`; }
  }
  function award(n) {
    if (stamps.has(n)) return;
    stamps.add(n); localStorage.setItem('rp-stamps', JSON.stringify([...stamps])); renderStamps();
    const btn = $('#stampsBtn'); btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12) rotate(-3deg)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'ease-out' });
  }
  renderStamps();
  $('#stampsBtn').addEventListener('click', () => $('#manifesto').scrollIntoView({ behavior: 'smooth' }));

  /* ---------- cards arquétipos ---------- */
  $$('.card').forEach(c => c.addEventListener('click', () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true')));

  /* ---------- desafio 1: conectar ---------- */
  const board = $('#board'), nodes = $$('[data-node]'), hint = $('#boardHint');
  nodes.forEach(n => n.classList.add('is-float'));
  const order = [];
  function nodeCenter(n) {
    const b = board.getBoundingClientRect(), r = n.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - b.left) / b.width * 1000, y: (r.top + r.height / 2 - b.top) / b.height * 600 };
  }
  nodes.forEach(n => n.addEventListener('click', () => {
    if (n.classList.contains('is-on')) return;
    n.classList.add('is-on'); n.classList.remove('is-float'); order.push(n);
    hint.textContent = `${order.length} de 4 conectados`;
    if (order.length > 1) {
      const a = nodeCenter(order[order.length - 2]), b = nodeCenter(n);
      const mx = (a.x + b.x) / 2 + (Math.random() * 80 - 40), my = (a.y + b.y) / 2 + (Math.random() * 60 - 30);
      const p = $('#l' + (order.length - 1)); p.setAttribute('d', `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`); requestAnimationFrame(() => p.classList.add('is-drawn'));
    }
    if (order.length === 4) {
      const a = nodeCenter(n), b = nodeCenter(order[0]);
      const p = $('#l4'); p.setAttribute('d', `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2 + 30} ${(a.y + b.y) / 2 - 40} ${b.x} ${b.y}`); requestAnimationFrame(() => p.classList.add('is-drawn'));
      setTimeout(() => { board.classList.add('is-done'); hint.textContent = 'estrutura conectada'; award(1); }, 900);
    }
  }));

  /* ---------- desafio 2: circule ---------- */
  const fb = $('#sentenceFeedback');
  $$('#sentence [data-w]').forEach(w => w.addEventListener('click', () => {
    if ($('#sentence .is-right')) return;
    if (w.hasAttribute('data-right')) {
      w.classList.add('is-right'); fb.textContent = 'Essa. Sem o “não”, a frase vira elogio. Com ele, vira diagnóstico.'; fb.classList.add('is-ok'); award(2);
    } else {
      w.classList.remove('is-wrong'); void w.offsetWidth; w.classList.add('is-wrong');
      fb.textContent = w.textContent === 'negócio' || w.textContent === 'ideia' ? 'Quase. Essa é o assunto, e não a virada. Qual palavra inverte o sentido?' : 'Ainda não. Procure a palavra que, se sumir, muda tudo.';
      fb.classList.remove('is-ok');
    }
  }));

  /* ---------- carrossel ---------- */
  const track = $('#track'), slides = $$('.slide', track), densEls = $$('#dens span');
  function setActive(i) {
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    densEls.forEach((d, k) => d.classList.toggle('is-on', k === i));
    $$('[data-draw]', slides[i]).forEach(d => d.classList.add('is-drawn'));
  }
  const sio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio > .6) setActive(slides.indexOf(e.target)); }), { root: track, threshold: [.6] });
  slides.forEach(s => sio.observe(s));
  function go(dir) { const i = slides.findIndex(s => s.classList.contains('is-active')); const n = Math.max(0, Math.min(slides.length - 1, i + dir)); slides[n].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }); }
  $('#prevSlide').addEventListener('click', () => go(-1)); $('#nextSlide').addEventListener('click', () => go(1));
  setActive(0);

  /* ---------- legenda queimada: digitação ---------- */
  const caps3 = ['quem vende hora perde com isso', 'o modelo estava errado, o trabalho seguia bom', 'a segunda versão veio de uma conversa'];
  const capEl = $('#caption'); let ci = 0;
  function typeNext() {
    if (reduce) return;
    ci = (ci + 1) % caps3.length; const txt = caps3[ci]; let k = 0; capEl.textContent = '';
    const t = setInterval(() => { capEl.textContent = txt.slice(0, ++k); if (k >= txt.length) { clearInterval(t); setTimeout(typeNext, 3200); } }, 38);
  }
  setTimeout(typeNext, 3500);

  /* ---------- desafio 3: quiz ---------- */
  const quiz = $('#quiz'), qCards = $$('.quiz__card', quiz), why = $('#quizWhy'), count = $('#quizCount');
  let qi = 0, score = 0, locked = false;
  function answer(ans) {
    if (locked || qi >= qCards.length) return; locked = true;
    const card = qCards[qi], ok = card.dataset.answer === ans;
    if (ok) score++;
    const stampEl = document.createElement('span'); stampEl.className = 'stampmark' + (ans === 'nao' ? ' stampmark--no' : ''); stampEl.textContent = ans === 'sim' ? 'pode publicar' : 'volta pra mesa'; card.appendChild(stampEl); requestAnimationFrame(() => stampEl.classList.add('is-on'));
    why.textContent = (ok ? 'Certo. ' : 'Aqui a marca decide diferente. ') + card.dataset.why;
    why.className = 'quiz__why ' + (ok ? 'is-ok' : 'is-bad');
    setTimeout(() => {
      card.classList.remove('is-active'); card.classList.add('is-out'); qi++;
      if (qi < qCards.length) { qCards[qi].classList.add('is-active'); count.textContent = `${qi + 1} / ${qCards.length}`; locked = false; }
      else {
        quiz.classList.add('is-done');
        const r = $('#quizResult');
        r.innerHTML = `<span class="cap__num">resultado</span><h3>${score} de ${qCards.length} decisões iguais às do manual</h3><p>${score >= 6 ? 'Você já pensa como o protocolo: lastro antes da afirmação, pessoa antes do personagem.' : score >= 4 ? 'Boa base. Reveja as regras de exposição pessoal e de números sem fonte.' : 'Vale reler o capítulo de protocolo: provar antes de proclamar, vida pessoal só quando ilumina, nada de frase de coach.'}</p>`;
        why.textContent = ''; award(3);
      }
    }, 2200);
  }
  $('#ansYes').addEventListener('click', () => answer('sim')); $('#ansNo').addEventListener('click', () => answer('nao'));

  /* ---------- cursor caneta ---------- */
  const pen = $('#pen');
  if (matchMedia('(hover:hover)').matches && !reduce) {
    let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; pen.classList.add('is-on'); pen.classList.toggle('is-big', !!e.target.closest('a,button,.card,.node,.tile,.kit li')); });
    (function loop() { x += (tx - x) * .22; y += (ty - y) * .22; pen.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
    addEventListener('mouseleave', () => pen.classList.remove('is-on'));
  }

  /* ---------- GSAP: parallax e entradas (progressivo) ---------- */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    $$('[data-parallax]').forEach(el => {
      const target = el.querySelector('img, svg'); if (!target) return;
      gsap.to(target, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: el.closest('.cap') || el, start: 'top top', end: 'bottom top', scrub: true } });
    });
    gsap.from('.hero__line', { yPercent: 60, opacity: 0, duration: 1.1, stagger: .12, ease: 'power3.out', delay: .2 });
    gsap.from('.hero__sub, .hero__cta, .tape--hero', { y: 20, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out', delay: .7 });
    $$('.cap__head').forEach(h => gsap.from(h.children, { y: 26, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 80%' } }));
    gsap.to('.timeline__line path', { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 75%', end: 'bottom 45%', scrub: true } });
    $$('.tile').forEach((t, i) => gsap.from(t, { y: 30, opacity: 0, duration: .8, delay: (i % 4) * .08, ease: 'power3.out', scrollTrigger: { trigger: t, start: 'top 88%' } }));
    gsap.from('.manif__l, .manif__big', { y: 18, opacity: 0, duration: .9, stagger: .18, ease: 'power3.out', scrollTrigger: { trigger: '.manif', start: 'top 70%' } });
    $$('.clip').forEach(c => gsap.from(c, { rotate: 6, y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 85%' } }));
  }
})();
