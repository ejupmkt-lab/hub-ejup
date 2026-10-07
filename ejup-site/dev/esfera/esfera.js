// Esfera da Minerva desenhada em tempo real (WebGL), a partir do vídeo original de abertura e fechamento.
// Fechada: esfera de faixas metálicas escovadas, com frestas douradas acesas por dentro.
// Aberta: as faixas giram em espiral, mostram a face dourada e revelam o núcleo de luz.
// Como é desenhada na resolução da tela, fica nítida em qualquer tamanho e anda a 60 quadros/s.
// Gerado para /minerva/esfera.js com: node dev/esfera/build.mjs

import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, BufferGeometry, BufferAttribute,
  MeshPhysicalMaterial, MeshBasicMaterial, SphereGeometry, PlaneGeometry, ShaderMaterial, PointLight, DirectionalLight,
  CanvasTexture, Color, ACESFilmicToneMapping, SRGBColorSpace, FrontSide, BackSide, AdditiveBlending,
  RepeatWrapping, PMREMGenerator, MathUtils,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const N = 8;            // faixas
const SU = 120;         // divisões ao longo da faixa (polo a polo)
const SV = 12;          // divisões na largura
const TAU = Math.PI * 2;

const suave = (x) => x * x * (3 - 2 * x);
const curva = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2); // entrada e saída macias
const mix = (a, b, t) => a + (b - a) * t;

// textura de metal escovado: riscos finos ao longo da faixa
function escovado() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * c.height, l = 40 + Math.random() * 420, x = Math.random() * c.width;
    const v = 110 + Math.random() * 60;
    g.strokeStyle = `rgba(${v},${v},${v},${0.18 + Math.random() * 0.3})`;
    g.lineWidth = 0.6 + Math.random() * 0.9;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (Math.random() - 0.5) * 0.8); g.stroke();
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// disco de luz voltado para a câmera: núcleo quase branco, borda dourada que some no preto
function brilhoPlano(atras) {
  const m = new ShaderMaterial({
    uniforms: { forca: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float forca; varying vec2 vUv;
      void main(){ float r = length(vUv - 0.5) * 2.0; if (r > 1.0) discard;
        float n = pow(1.0 - r, ${atras ? '2.2' : '3.2'}); float c = pow(1.0 - r, 14.0);
        vec3 cor = mix(vec3(0.94, 0.62, 0.22), vec3(1.0, 0.96, 0.86), c);
        gl_FragColor = vec4(cor * (n * 0.9 + c * 1.6) * forca, 1.0); }`,
    blending: AdditiveBlending, depthWrite: false, depthTest: !atras ? false : true, transparent: true, toneMapped: false,
  });
  return new Mesh(new PlaneGeometry(2, 2), m);
}

export function criarEsfera(canvas, opcoes = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
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
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.38;

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 6.3);

  // luz principal fria do alto à esquerda, contraluz quente à direita
  const key = new DirectionalLight(0xe8eef5, 2.4); key.position.set(-3, 3.5, 4); scene.add(key);
  const rim = new DirectionalLight(0xffc27a, 1.4); rim.position.set(4, -1.5, -2); scene.add(rim);

  const esfera = new Group();
  scene.add(esfera);
  const giro = new Group();       // giro em torno do eixo dos polos
  esfera.add(giro);

  // geometria única com as N faixas; posições recalculadas a cada quadro
  const nv = N * (SU + 1) * (SV + 1);
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
  const idx = [];
  for (let i = 0; i < N; i++) {
    const o = i * (SU + 1) * (SV + 1);
    for (let a = 0; a <= SU; a++) for (let b = 0; b <= SV; b++) {
      const k = o + a * (SV + 1) + b;
      uv[k * 2] = a / SU * 3 + i * 0.37; uv[k * 2 + 1] = b / SV * 0.25 + i * 0.13;
      if (a < SU && b < SV) {
        const p = k, q = k + 1, r = k + SV + 1, s = k + SV + 2;
        idx.push(p, r, q, q, r, s);
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('uv', new BufferAttribute(uv, 2));
  geo.setIndex(idx);

  const risco = escovado();
  const aco = new MeshPhysicalMaterial({
    color: 0x9aa3ad, metalness: 1, roughness: 0.3, side: FrontSide,
    roughnessMap: risco, bumpMap: risco, bumpScale: 0.6,
    anisotropy: 0.85, clearcoat: 0.25, clearcoatRoughness: 0.4,
  });
  const ouro = new MeshPhysicalMaterial({
    color: 0xe0a64e, metalness: 1, roughness: 0.24, side: BackSide,
    roughnessMap: risco, bumpMap: risco, bumpScale: 0.4,
    emissive: 0xf0a040, emissiveIntensity: 0.12, envMapIntensity: 0.4,
  });
  const fora = new Mesh(geo, aco), dentro = new Mesh(geo, ouro);
  giro.add(fora, dentro);

  // núcleo de luz
  const nucleo = new Mesh(new SphereGeometry(0.06, 32, 16), new MeshBasicMaterial({ color: new Color(1.6, 1.35, 1.0) }));
  // brilho do núcleo por cima das faixas (como luz vazando entre elas) e aura suave atrás da esfera
  const halo = brilhoPlano(false), aura = brilhoPlano(true);
  halo.renderOrder = 10; aura.position.z = -1.6;
  scene.add(halo, aura);
  const luz = new PointLight(0xffb85a, 3, 0, 2);
  esfera.add(nucleo, luz);


  // ---------- forma ----------
  const P = [0, 0, 0], C = [0, 0, 0];
  function ponto(out, i, u, v, s, t) {
    const th0 = s * 0.34, th1 = Math.PI - s * 0.08;
    const th = th0 + u * (th1 - th0);
    const larg = mix(0.955, 0.4, s) * TAU / N;
    // espiral: a longitude cresce do polo da frente para trás
    const tw = mix(1.1, 4.6, s) * (th / Math.PI) + s * 0.2 * Math.sin(th * 2 + t * 0.6);
    const phc = i * TAU / N + tw;
    const ph = phc + (v - 0.5) * larg;
    const r = 1 + s * 0.06 * Math.sin(th) + s * 0.03 * Math.sin(th * 3 + i);
    const st = Math.sin(th), ct = Math.cos(th);
    out[0] = r * st * Math.cos(ph); out[1] = r * st * Math.sin(ph); out[2] = r * ct;
    // a faixa gira sobre o próprio eixo como lâmina de turbina, mostrando a face dourada
    const a = s * 0.85 * Math.pow(st, 0.6);
    if (a > 1e-4) {
      C[0] = r * st * Math.cos(phc); C[1] = r * st * Math.sin(phc); C[2] = r * ct;
      const bx = -Math.sin(phc), by = Math.cos(phc);           // direção da largura
      const nl = Math.hypot(C[0], C[1], C[2]) || 1;
      const nx = C[0] / nl, ny = C[1] / nl, nz = C[2] / nl;    // radial
      const dx = out[0] - C[0], dy = out[1] - C[1], dz = out[2] - C[2];
      const d = dx * bx + dy * by;
      const rx = dx - d * bx, ry = dy - d * by, rz = dz;
      const ca = Math.cos(a), sa = Math.sin(a);
      out[0] = C[0] + d * (ca * bx + sa * nx) + rx;
      out[1] = C[1] + d * (ca * by + sa * ny) + ry;
      out[2] = C[2] + d * (sa * nz) + rz;
    }
  }
  let formaS = -1;
  function forma(s, t) {
    // fechada a forma não muda: não recalcula (economiza bateria no celular)
    if (s === 0 && formaS === 0) return;
    formaS = s;
    let k = 0;
    for (let i = 0; i < N; i++) for (let a = 0; a <= SU; a++) {
      const u = a / SU;
      for (let b = 0; b <= SV; b++) {
        ponto(P, i, u, b / SV, s, t);
        pos[k++] = P[0]; pos[k++] = P[1]; pos[k++] = P[2];
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
  let raf = 0, visivel = true, ultimo = 0;

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
    // fechada: eixo dos polos inclinado (faixas na diagonal); aberta: espiral de frente
    esfera.rotation.x = mix(-1.5, -0.32, se) + qy * 0.18 + conversa * 0.06 * Math.sin(t * 0.7);
    esfera.rotation.y = mix(0.25, 0.18, se) + qx * 0.22 + conversa * 0.08 * Math.sin(t * 0.5);
    esfera.rotation.z = mix(0.75, 0.0, se);
    giro.rotation.z = t * 0.12 + se * 1.4;
    const sc = mix(1, 1.08, se) * (1 + conversa * 0.015 * Math.sin(t * 1.3));
    esfera.scale.setScalar(sc);
    // luz de dentro: fraca fechada (só as frestas), forte aberta
    const pulso = 1 + 0.08 * Math.sin(t * 1.7) * se;
    luz.intensity = mix(2, 16, se) * pulso;
    ouro.emissiveIntensity = mix(0.1, 0.32, se);
    nucleo.scale.setScalar(mix(0.25, 1, se) * pulso);
    halo.scale.setScalar(mix(0.3, 1.5, se) * pulso);
    halo.material.uniforms.forca.value = mix(0, 1.5, se * se) * pulso;
    aura.scale.setScalar(mix(2.6, 3.4, se));
    aura.material.uniforms.forca.value = mix(0.05, 0.3, se);
    renderer.render(scene, camera);
    if (opcoes.onFrame) opcoes.onFrame(s);
    pedir();
  }
  function pedir() { if (!raf && visivel && !document.hidden) raf = requestAnimationFrame(quadro); }

  function tamanho() {
    const w = canvas.clientWidth || 600, h = canvas.clientHeight || 600;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
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
  renderer.render(scene, camera);
  pedir();

  return {
    // anima até aberta (1) ou fechada (0); chama fim quando termina
    ir(alvo, ms, aoFim) {
      de = s; para = alvo; t0 = performance.now(); dur = Math.max(1, ms);
      fim = aoFim || (() => {});
      pedir();
    },
    // posição fixa (sem animação), para movimento reduzido
    fixar(alvo) { de = para = s = alvo; fim = null; pedir(); },
    cursor(x, y) { px = x; py = y; },
    conversa(v) { conversaAlvo = v ? 1 : 0; },
    get aberta() { return s; },
  };
}
