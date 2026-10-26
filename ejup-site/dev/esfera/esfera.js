// Esfera da Minerva desenhada em tempo real (WebGL), a partir do vídeo original de abertura e fechamento.
// Por fora: faixas de metal polido, com espessura e bordas que pegam luz, refletindo um estúdio.
// Por dentro: uma esfera de energia (plasma dourado em movimento) que vaza pelas frestas quando
// fechada e se revela quando as faixas giram em espiral e abrem.
// Desenhada na resolução da tela: nítida em qualquer tamanho, a 60 quadros/s.
// Gerado para /minerva/esfera.js com: node dev/esfera/build.mjs

import {
  WebGLRenderer, WebGLRenderTarget, HalfFloatType, Scene, PerspectiveCamera, Group, Mesh, BufferGeometry, BufferAttribute,
  MeshPhysicalMaterial, MeshBasicMaterial, SphereGeometry, PlaneGeometry, ShaderMaterial, PointLight, DirectionalLight,
  CanvasTexture, Color, Vector2, ACESFilmicToneMapping, SRGBColorSpace, DoubleSide, BackSide, AdditiveBlending,
  RepeatWrapping, PMREMGenerator,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const N = 8;            // faixas
const SU = 140;         // divisões ao longo da faixa (polo a polo)
const SV = 14;          // divisões na largura
const L = 2 * (SV + 1); // pontos no contorno da seção (face de fora + face de dentro)
const ESP = 0.024;      // espessura da chapa
const TAU = Math.PI * 2;

const suave = (x) => x * x * (3 - 2 * x);
const curva = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2); // entrada e saída macias
const mix = (a, b, t) => a + (b - a) * t;

// textura de metal: microrriscos finos ao longo da faixa (quase invisíveis; só quebram o reflexo)
function riscos() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 1800; i++) {
    const y = Math.random() * c.height, l = 60 + Math.random() * 500, x = Math.random() * c.width;
    const v = 120 + Math.random() * 120;
    g.strokeStyle = `rgba(${v},${v},${v},${0.15 + Math.random() * 0.25})`;
    g.lineWidth = 0.5 + Math.random() * 0.8;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (Math.random() - 0.5) * 0.6); g.stroke();
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// estúdio de fotografia para o metal refletir: fundo preto, softbox em cima, recortes laterais
function estudio() {
  const s = new Scene();
  s.background = new Color(0x000000);
  const caixa = (w, h, x, y, z, forca, cor = 0xffffff) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(cor).multiplyScalar(forca), side: DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  caixa(7, 3.2, 0, 6, 1.5, 4);                 // softbox principal, de cima
  caixa(1.1, 7, -6, 0.5, 2, 2.6);              // recorte frio à esquerda
  caixa(1.1, 7, 6, -0.5, -0.5, 2.2, 0xffd49a); // recorte quente à direita
  caixa(4, 2, -2.5, 2, 6, 1.1);                // luz de frente, suave
  caixa(9, 2, 0, -6, 0, 0.18);                 // rebatimento do chão
  // cúpula cinza bem fraca: o metal nunca reflete preto absoluto
  const cupula = new Mesh(new SphereGeometry(20, 32, 16), new MeshBasicMaterial({ color: new Color(0x8a9099).multiplyScalar(0.09), side: BackSide }));
  s.add(cupula);
  return s;
}

// esfera de energia: plasma dourado com filamentos que se movem, centro quase branco
const ENERGIA = {
  vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV;
    void main(){ vP = position; vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float t; uniform float forca; uniform float abre;
    varying vec3 vP; varying vec3 vN; varying vec3 vV;
    float h(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
    float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
    void main(){
      vec3 p = normalize(vP);
      vec3 q = p * 3.2 + vec3(0.0, t * 0.22, t * 0.08);
      float w = fbm(q + 1.8 * vec3(fbm(q * 1.3 - t * 0.12), fbm(q * 1.3 + 4.1 + t * 0.1), 0.0));
      float fil = pow(smoothstep(0.4, 0.88, w), 2.0);           // filamentos de energia
      float raio = pow(smoothstep(0.55, 0.85, w), 3.0);         // veios mais quentes
      float frente = max(dot(normalize(vN), normalize(vV)), 0.0);
      float centro = pow(frente, 5.0);                          // miolo voltado para quem olha
      float borda = pow(1.0 - frente, 2.5);
      vec3 ambar = vec3(1.0, 0.32, 0.03), ouro = vec3(1.0, 0.58, 0.12), branco = vec3(1.0, 0.86, 0.6);
      float miolo = pow(frente, 14.0);                           // luz de dentro atravessando
      vec3 c = ambar * 0.03 + ambar * fil * 0.8 + ouro * fil * 0.6 + branco * raio * 2.6 + ouro * centro * 0.3 + branco * miolo * (0.6 + 1.6 * abre) + ambar * borda * 0.6;
      gl_FragColor = vec4(c * forca, 1.0);
    }`,
};

// brilho do núcleo por cima das faixas, como luz vazando entre elas
function brilhoPlano() {
  const m = new ShaderMaterial({
    uniforms: { forca: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float forca; varying vec2 vUv;
      void main(){ float r = length(vUv - 0.5) * 2.0; if (r > 1.0) discard;
        float a = atan(vUv.y - 0.5, vUv.x - 0.5);
        float raios = 0.55 + 0.45 * pow(abs(sin(a * 9.0)) * abs(sin(a * 5.0 + 1.3)), 0.6);
        float n = pow(1.0 - r, 3.2) * raios; float c = pow(1.0 - r, 22.0);
        vec3 cor = mix(vec3(1.0, 0.58, 0.16), vec3(1.0, 0.97, 0.88), c);
        gl_FragColor = vec4(cor * (n * 1.1 + c * 5.0) * forca, 1.0); }`,
    blending: AdditiveBlending, depthWrite: false, depthTest: false, transparent: true,
  });
  return new Mesh(new PlaneGeometry(2, 2), m);
}

// a luz (e o brilho em volta) termina antes da borda do quadro: o fundo fica preto puro
const MASCARA = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); float r = length(vUv - 0.5) * 2.0;
      gl_FragColor = vec4(c.rgb * (1.0 - smoothstep(0.78, 0.98, r)), 1.0); }`,
};

export function criarEsfera(canvas, opcoes = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  if (!renderer.getContext()) return null;
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(estudio(), 0.02).texture;

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 6.3);

  const key = new DirectionalLight(0xffffff, 1.2); key.position.set(-3, 4, 4); scene.add(key);

  const esfera = new Group();
  scene.add(esfera);
  const giro = new Group();       // giro em torno do eixo dos polos
  esfera.add(giro);

  // ---------- faixas com espessura: o contorno da seção vai pela face de fora e volta pela de dentro ----------
  const nv = N * (SU + 1) * L;
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
  const idxAco = [], idxOuro = [];
  for (let i = 0; i < N; i++) {
    const o = i * (SU + 1) * L;
    for (let a = 0; a <= SU; a++) for (let j = 0; j < L; j++) {
      const k = o + a * L + j, fora = j <= SV;
      const v = fora ? j / SV : (L - 1 - j) / SV;
      uv[k * 2] = a / SU * 3 + i * 0.37; uv[k * 2 + 1] = v * 0.25 + i * 0.13;
      if (a < SU) {
        const j2 = (j + 1) % L;
        const p = k, q = o + a * L + j2, r = k + L, s = o + (a + 1) * L + j2;
        (j < SV ? idxAco : idxOuro).push(p, r, q, q, r, s);
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('uv', new BufferAttribute(uv, 2));
  geo.setIndex(idxAco.concat(idxOuro));
  geo.addGroup(0, idxAco.length, 0);
  geo.addGroup(idxAco.length, idxOuro.length, 1);

  const risco = riscos();
  // aço escovado escuro (grafite quente), riscos bem visíveis
  const aco = new MeshPhysicalMaterial({
    color: 0x7a7c80, metalness: 1, roughness: 0.36, side: DoubleSide,
    roughnessMap: risco, bumpMap: risco, bumpScale: 0.5,
    anisotropy: 0.9, envMapIntensity: 1.1,
  });
  // ouro por dentro: acende com a energia (mais forte quando abre)
  const ouro = new MeshPhysicalMaterial({
    color: 0xf2b45a, metalness: 1, roughness: 0.24, side: DoubleSide, envMapIntensity: 1.2,
    roughnessMap: risco, bumpMap: risco, bumpScale: 0.3,
    emissive: 0xff9a2e, emissiveIntensity: 0.6,
  });
  giro.add(new Mesh(geo, [aco, ouro]));

  // energia por dentro
  const energiaMat = new ShaderMaterial({ uniforms: { t: { value: 0 }, forca: { value: 1 }, abre: { value: 0 } }, ...ENERGIA });
  const energia = new Mesh(new SphereGeometry(0.55, 96, 64), energiaMat);
  // a luz da energia ilumina a face dourada das faixas
  const luz = new PointLight(0xffa850, 2, 0, 2);
  esfera.add(energia, luz);
  const halo = brilhoPlano();
  halo.renderOrder = 10;
  scene.add(halo);

  const alvo = new WebGLRenderTarget(512, 512, { type: HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, alvo);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(512, 512), 0.4, 0.12, 2.0);
  composer.addPass(bloom);
  composer.addPass(new ShaderPass(MASCARA));
  composer.addPass(new OutputPass());

  // ---------- forma ----------
  const P = [0, 0, 0], NR = [0, 0, 0];
  // ponto da face de fora (out) e direção para dentro da chapa (nr)
  function ponto(out, nr, i, u, v, s, t) {
    const th0 = s * 0.24, th1 = Math.PI - s * 0.04;
    const th = th0 + u * (th1 - th0);
    const larg = mix(0.962, 0.72, s) * TAU / N;
    // espiral: a longitude cresce do polo da frente para trás
    const tw = mix(1.9, 5.2, s) * (th / Math.PI) + s * 0.2 * Math.sin(th * 2 + t * 0.6);
    const phc = i * TAU / N + tw;
    const ph = phc + (v - 0.5) * larg;
    // aberta como rosa: a metade da frente se abre para fora, a de trás se recolhe atrás dela
    const frenteK = Math.sin(Math.min(th, Math.PI / 2) * 1.0), trasK = suave(Math.max(0, (th - Math.PI / 2) / (Math.PI / 2)));
    const r = 1 + s * 0.22 * frenteK * Math.sin(th) - s * 0.3 * trasK + s * 0.03 * Math.sin(th * 3 + i);
    const st = Math.sin(th), ct = Math.cos(th);
    out[0] = r * st * Math.cos(ph); out[1] = r * st * Math.sin(ph); out[2] = r * ct;
    const l0 = Math.hypot(out[0], out[1], out[2]) || 1;
    nr[0] = out[0] / l0; nr[1] = out[1] / l0; nr[2] = out[2] / l0;
    // a faixa gira sobre o próprio eixo como lâmina de turbina, mostrando a face dourada
    const a = s * 0.28 * Math.pow(st, 0.8);
    if (a > 1e-4) {
      const cx = r * st * Math.cos(phc), cy = r * st * Math.sin(phc), cz = r * ct;
      const bx = -Math.sin(phc), by = Math.cos(phc);           // direção da largura
      const nl = Math.hypot(cx, cy, cz) || 1;
      const nx = cx / nl, ny = cy / nl, nz = cz / nl;          // radial
      const dx = out[0] - cx, dy = out[1] - cy, dz = out[2] - cz;
      const d = dx * bx + dy * by;
      const rx = dx - d * bx, ry = dy - d * by, rz = dz;
      const ca = Math.cos(a), sa = Math.sin(a);
      out[0] = cx + d * (ca * bx + sa * nx) + rx;
      out[1] = cy + d * (ca * by + sa * ny) + ry;
      out[2] = cz + d * (sa * nz) + rz;
      // a normal gira junto
      const mx = ca * nx - sa * bx, my = ca * ny - sa * by, mz = ca * nz;
      const ml = Math.hypot(mx, my, mz) || 1;
      nr[0] = mx / ml; nr[1] = my / ml; nr[2] = mz / ml;
    }
  }
  let formaS = -1;
  function forma(s, t) {
    // fechada a forma não muda: não recalcula (economiza bateria no celular)
    if (s === 0 && formaS === 0) return;
    formaS = s;
    for (let i = 0; i < N; i++) {
      const o = i * (SU + 1) * L;
      for (let a = 0; a <= SU; a++) {
        const u = a / SU;
        for (let b = 0; b <= SV; b++) {
          ponto(P, NR, i, u, b / SV, s, t);
          const kf = (o + a * L + b) * 3, kd = (o + a * L + (L - 1 - b)) * 3;
          pos[kf] = P[0]; pos[kf + 1] = P[1]; pos[kf + 2] = P[2];
          pos[kd] = P[0] - NR[0] * ESP; pos[kd + 1] = P[1] - NR[1] * ESP; pos[kd + 2] = P[2] - NR[2] * ESP;
        }
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  }

  // ---------- estado ----------
  let s = 0, de = 0, para = 0, t0 = 0, dur = 1, fim = null;
  let px = 0, py = 0, qx = 0, qy = 0;
  let conversa = 0, conversaAlvo = 0;
  const relogio = performance.now();
  let raf = 0, visivel = true;

  function quadro(agora) {
    raf = 0;
    const t = (agora - relogio) / 1000;
    if (para !== de || fim) {
      const k = Math.min(1, (agora - t0) / dur);
      s = mix(de, para, curva(k));
      if (k >= 1) { de = para; s = para; const f = fim; fim = null; f && f(); }
    }
    qx += (px - qx) * 0.05; qy += (py - qy) * 0.05;
    conversa += (conversaAlvo - conversa) * 0.03;
    const se = suave(s);
    forma(s, t);
    // fechada: eixo dos polos inclinado (faixas na diagonal); aberta: espiral quase de frente
    esfera.rotation.x = mix(-1.35, -0.12, se) + qy * 0.18 + conversa * 0.06 * Math.sin(t * 0.7);
    esfera.rotation.y = mix(0.25, 0.18, se) + qx * 0.22 + conversa * 0.08 * Math.sin(t * 0.5);
    esfera.rotation.z = mix(0.95, 0.0, se);
    giro.rotation.z = t * 0.12 + se * 1.4;
    esfera.scale.setScalar(mix(1, 1.08, se) * (1 + conversa * 0.015 * Math.sin(t * 1.3)));
    const pulso = 1 + 0.07 * Math.sin(t * 1.7);
    energiaMat.uniforms.t.value = t;
    energiaMat.uniforms.forca.value = mix(1.0, 2.2, se) * pulso;
    energiaMat.uniforms.abre.value = se;
    energia.rotation.y = t * 0.15;
    ouro.emissiveIntensity = mix(0.45, 0.22, se) * pulso;
    luz.intensity = mix(1.5, 7, se) * pulso;
    halo.scale.setScalar(mix(0.3, 0.75, se) * pulso);
    halo.material.uniforms.forca.value = mix(0, 1.0, se * se) * pulso;
    bloom.strength = mix(0.35, 0.3, se);
    if (opcoes.semBrilho) renderer.render(scene, camera); else composer.render();
    if (opcoes.onFrame) opcoes.onFrame(s);
    pedir();
  }
  function pedir() { if (!raf && visivel && !document.hidden) raf = requestAnimationFrame(quadro); }

  function tamanho() {
    const w = canvas.clientWidth || 600, h = canvas.clientHeight || 600;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  tamanho();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(tamanho) : null;
  ro && ro.observe(canvas);
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { visivel = es[0].isIntersecting; pedir(); }) : null;
  io && io.observe(canvas);
  document.addEventListener('visibilitychange', pedir);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); opcoes.onPerda && opcoes.onPerda(); });

  forma(0, 0);
  pedir();

  return {
    // anima até aberta (1) ou fechada (0); chama aoFim quando termina
    ir(alvoS, ms, aoFim) {
      de = s; para = alvoS; t0 = performance.now(); dur = Math.max(1, ms);
      fim = aoFim || (() => {});
      pedir();
    },
    // posição fixa (sem animação)
    fixar(alvoS) { de = para = s = alvoS; fim = null; pedir(); },
    cursor(x, y) { px = x; py = y; },
    conversa(v) { conversaAlvo = v ? 1 : 0; },
    get aberta() { return s; },
  };
}
