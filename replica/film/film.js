// "Una Conversación": deterministic motion film. render(t) draws the frame at time t (seconds).
'use strict';
const W = 1920, H = 1080, FPS = 30, DURATION = 68.5;
const T = window.T;

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const p = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = k => 1 - Math.pow(1 - k, 3);
const ei = k => k * k * k;
const eio = k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const sio = k => -(Math.cos(Math.PI * k) - 1) / 2;
const back = (k, s = 1.7) => { const c = s + 1; return 1 + c * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- dom helpers ----------
const $ = id => document.getElementById(id);
function el(parent, html) { const d = document.createElement('div'); d.innerHTML = html.trim(); const n = d.firstChild; parent.appendChild(n); return n; }
function st(e, o) { for (const k in o) e.style[k] = o[k]; }
function vis(e, on) { e.style.display = on ? '' : 'none'; return on; }
const blur = b => (b > 0.15 ? `blur(${b.toFixed(2)}px)` : 'none');
const blink = t => (Math.floor(t * 2.2) % 2 === 0 ? 1 : 0);
const caret = (op = 1) => `<span class="caret" style="opacity:${op}"></span>`;
function typed(s, t, t0, t1) { return s.slice(0, Math.round(s.length * p(t, t0, t1))); }
function typing(t, t0, t1) { return t >= t0 && t <= t1 + 0.05; }

// ---------- palette ----------
const C = {
  ink: '#070B16', orange: '#E07A55', writer: '#FFB547', art: '#FF5C8A', anim: '#3FE0A5',
  comp: '#9B7BFF', sound: '#C8F05A', edit: '#5CC8FF', render: '#FFD86B', red: '#e2474f',
};
const ROLE_COLORS = [C.writer, C.art, C.anim, C.comp, C.sound, C.edit, C.render];
const ROLE_START = [18, 22, 26, 30, 34, 38, 44];
const ARROW = c => `<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// shot boundaries (matches the editor timeline inside the film)
const SHOTS = [6, 6, 6, 4, 4, 4, 4, 4, 6, 6, 10, 8.5];
const SHOT_COLORS = ['#8b90a0', '#e0505a', '#c8664c', C.writer, C.art, C.anim, C.comp, C.sound, C.edit, C.render, 'rainbow', '#d6d1c6'];

// thumbnails rendered in a first pass (see render.mjs)
const THUMBS = ['hook', 'oldway', 'turn', 'writer', 'art', 'animator', 'composer', 'sound', 'editor'];
const THUMB_TIMES = { hook: 5.6, oldway: 11.3, turn: 17.0, writer: 21.3, art: 25.0, animator: 28.9, composer: 32.6, sound: 37.0, editor: 41.0 };
const thumbSrc = n => `thumbs/${n}.jpg`;

let S; // stage

// =====================================================================
// BUILD
// =====================================================================
function build() {
  S = $('stage');
  const L = id => el(S, `<div id="${id}" class="layer"></div>`);

  L('bgDark');
  el(S, `<div id="glow" class="layer"></div>`);
  const stars = el(S, `<canvas id="stars" class="layer" width="2200" height="1300" style="left:-140px;top:-110px;width:2200px;height:1300px"></canvas>`);
  drawStars(stars);
  L('cream');

  buildAct1();
  buildWriter();
  buildArt();
  buildAnimator();
  buildComposer();
  buildSound();
  buildEditor();
  buildRender();
  buildClimax();
  buildResolve();

  el(S, `<div id="redv" class="layer" style="background:radial-gradient(ellipse 70% 65% at 50% 50%,transparent 35%,rgba(170,20,30,.75) 100%)"></div>`);
  el(S, `<div id="vign" class="layer"></div>`);
  el(S, `<div id="flare" class="abs" style="left:960px;top:500px;width:1800px;height:1800px;border-radius:50%;background:radial-gradient(circle,#fff 0%,#fffaf0 6%,rgba(255,240,205,.85) 16%,rgba(255,214,140,.35) 36%,rgba(255,200,120,0) 62%)"></div>`);
  el(S, `<div id="flash" class="layer" style="background:radial-gradient(ellipse 60% 55% at 50% 50%,#fffaf0 0%,#f8efdc 60%,#efe6d4 100%)"></div>`);
  buildHud();
  el(S, `<div id="grain" class="layer"></div>`);
}

function drawStars(cv) {
  const g = cv.getContext('2d'), r = rng(7);
  for (let i = 0; i < 260; i++) {
    const x = r() * cv.width, y = r() * cv.height, s = r() < .9 ? r() * 1.3 + .4 : r() * 2 + 1.2;
    g.globalAlpha = .15 + r() * .55;
    g.fillStyle = r() < .2 ? '#ffd9b0' : '#cfd8ff';
    g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
  }
}

// ---------- HUD ----------
function buildHud() {
  const h = el(S, `<div id="hud" class="layer"></div>`);
  el(h, `<div class="bar" style="top:0;height:135px"></div>`);
  el(h, `<div class="bar" style="top:942px;height:138px"></div>`);
  el(h, `<div class="hud" style="left:62px;top:56px"><span id="hdot" class="hdot"></span><span id="hclock"></span></div>`);
  el(h, `<div id="hroles" class="hud" style="right:66px;top:56px"></div>`);
  el(h, `<div id="hstatus" class="hud" style="left:62px;top:998px;letter-spacing:.06em;color:#d8dbe4"></div>`);
  const nav = el(h, `<div id="hnav" class="hud" style="right:66px;top:998px;font-size:17px"></div>`);
  T.hud.nav.forEach((n, i) => el(nav, `<span id="hn${i}"><i></i>${esc(n)}</span>`));
}

function clockText(t) {
  let m = t < 17.47 ? 127 : 140 + (t - 19) * 8.5;
  if (t >= 59) m = 402;
  m = Math.floor(m);
  const hh = Math.floor(m / 60), mm = m % 60;
  return `${hh}:${String(mm).padStart(2, '0')} AM`;
}

function updateHud(t) {
  const h = $('hud');
  if (!vis(h, t < 49.6)) return;
  h.style.opacity = 1 - p(t, 48.55, 49.0);
  $('hclock').textContent = clockText(t);
  $('hdot').style.background = blink(t * .5) ? C.orange : '#3a3f4f';
  const n = ROLE_START.filter(s => t >= s).length;
  $('hroles').textContent = `${T.hud.roles_label} ${n} / 7`;
  const s = T.hud.status;
  const status =
    t < 1.8 ? '' : t < 15 ? s.new : t < 16 ? s.thinking : t < 18 ? s.yes : t < 22 ? s.writer : t < 26 ? s.art :
    t < 30 ? s.animator : t < 34 ? s.composer : t < 38 ? s.sound : t < 44 ? s.editor : t < 48 ? s.render : s.render_done;
  $('hstatus').textContent = status ? `›  ${status}` : '';
  for (let i = 0; i < 7; i++) {
    const on = t >= ROLE_START[i], e = $('hn' + i);
    e.style.color = on ? ROLE_COLORS[i] : '#6b7083';
    e.firstChild.style.background = on ? ROLE_COLORS[i] : '#4a4f60';
    e.firstChild.style.boxShadow = on ? `0 0 8px ${ROLE_COLORS[i]}` : 'none';
  }
}

// =====================================================================
// ACT 1: hook / old way / turn  (0 – 18 s)
// =====================================================================
const BOX = { y: 470, h: 124, charW: 40 * 0.6 };
const boxW = s => Math.max(1000, s.length * BOX.charW + 210);
let ZO = { x: 1000, y: 640 }; // zoom-through point (last word of the answer)

function buildAct1() {
  const a = el(S, `<div id="a1" class="layer"></div>`);
  // windows layer (screen space)
  const wl = el(a, `<div id="wins" class="layer"></div>`);
  buildWindows(wl);
  // camera world
  const w = el(a, `<div id="w1" class="layer"></div>`);
  el(w, `<div id="bigclock" class="abs serif" style="font-weight:300;font-size:166px;line-height:1;color:#c3cadc;white-space:nowrap;text-shadow:0 0 30px rgba(150,175,235,.15)">${esc(T.hud.clock_start)}</div>`);
  el(w, `<div id="box1" class="box"><div id="box1t" class="boxtxt" style="font-size:40px"></div><div id="send1" class="send" style="right:28px;top:30px;width:64px;height:64px">${ARROW('#2a140c')}</div></div>`);
  const comet = id => el(w, `<div id="${id}" class="abs" style="height:3px;width:96px;border-radius:2px;background:linear-gradient(90deg,rgba(255,255,255,0),#fff 70%);box-shadow:0 0 10px #fff,0 0 26px rgba(200,220,255,.85)"></div>`);
  comet('comet1'); comet('comet2');
  el(w, `<div id="lonecaret" class="abs" style="font:400 40px Plex;color:#dfe2ea"></div>`);
  el(w, `<div id="bubble1" class="abs mono" style="font-size:31px;color:#c9ccd8;white-space:nowrap;text-align:right"></div>`);
  el(w, `<div id="dots1" class="abs mono" style="font-size:22px;color:#8a90a6;letter-spacing:.3em"></div>`);
  // the answer
  el(a, `<div id="yesline" class="abs" style="left:400px;top:548px;width:1520px;height:1.5px;transform-origin:0 50%;background:linear-gradient(90deg,rgba(255,200,165,.95),rgba(255,190,150,.6) 40%,rgba(255,190,150,0))"></div>`);
  el(a, `<div id="yeslbl" class="abs mono" style="left:413px;top:304px;font-weight:600;font-size:18px;letter-spacing:.3em;color:#de8e6b">${esc(T.turn.claude_label)}</div>`);
  el(a, `<div id="yesbig" class="abs serif" style="left:398px;top:347px;font-weight:400;font-size:250px;line-height:1;color:#f4b28c;text-shadow:0 0 34px rgba(240,140,90,.5),0 0 90px rgba(230,120,80,.25);white-space:nowrap">${esc(T.turn.answer_big)}</div>`);
  el(a, `<div id="yesline2" class="abs serif" style="left:410px;top:612px;font-weight:400;font-size:68px;line-height:1;color:#f1e9de;white-space:pre"></div>`);
}

function buildWindows(wl) {
  const r = rng(11);
  const ow = T.oldway;
  const win = (id, x, y, w, h, inner, extra = '') => el(wl, `<div id="${id}" class="win" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra}">${inner}</div>`);
  // timeline window
  let rows = '';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) rows += `<div class="gbar" style="left:${80 + j * 200 + r() * 30}px;top:${92 + i * 52}px;width:${120 + r() * 60}px;height:34px"></div>`;
  let ticks = ''; for (let i = 0; i < 26; i++) ticks += `<div class="abs" style="left:${70 + i * 24}px;top:58px;width:1px;height:${i % 5 ? 8 : 14}px;background:#5a627c"></div>`;
  win('w_tl', 215, 178, 700, 345, `<div class="wdots">● ● ●</div><div class="abs" style="left:112px;top:12px;font-size:23px;color:#c3c8d6">${esc(ow.timeline_title)}</div>${ticks}${rows}
    <div class="tag" style="left:208px;top:92px">${esc(ow.media_offline)}</div><div class="tag" style="left:445px;top:144px">${esc(ow.media_offline)}</div><div class="tag" style="left:105px;top:250px">${esc(ow.media_offline)}</div>
    <div class="abs" style="left:432px;top:48px;width:2px;height:290px;background:#e8ecf5"></div><div class="abs" style="left:425px;top:42px;width:16px;height:16px;background:#e8ecf5;border-radius:3px"></div>`);
  win('w_err', 1070, 160, 760, 150, `<div class="abs" style="left:30px;top:34px;width:46px;height:46px;border-radius:50%;border:3px solid ${C.red};color:${C.red};font:700 28px/40px Plex;text-align:center">!</div>
    <div class="abs" style="left:100px;top:38px;font:600 29px Plex;color:#e6e9f0;white-space:nowrap">${esc(ow.plugin_error)} <span style="font-weight:400;font-size:23px;color:#7e86a0">${esc(ow.plugin_code)}</span></div>
    <div class="gbar" style="left:440px;top:108px;width:150px;height:24px"></div><div class="gbar" style="left:610px;top:108px;width:120px;height:24px"></div>`);
  win('w_bell', 1072, 268, 440, 100, `<svg class="abs" style="left:30px;top:26px" width="44" height="48" viewBox="0 0 24 26"><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z M10 21a2 2 0 0 0 4 0" fill="none" stroke="#e6e9f0" stroke-width="1.8" stroke-linejoin="round"/></svg>
    <div id="bellnum" class="abs" style="left:96px;top:24px;height:52px;min-width:90px;padding:0 18px;border-radius:26px;background:#e8484f;color:#fff;font:600 30px/52px Plex;text-align:center;box-shadow:0 0 18px rgba(232,72,79,.5)"></div>
    <div class="abs" style="left:226px;top:30px;font:500 30px Plex;color:#dfe3ec">${esc(ow.unread)}</div>`, 'border-radius:50px');
  let cal = ''; for (let i = 0; i < 18; i++) cal += `<div class="abs" style="left:${30 + (i % 6) * 62}px;top:${100 + Math.floor(i / 6) * 50}px;width:48px;height:38px;border-radius:6px;background:rgba(120,130,170,${.12 + r() * .12})"></div>`;
  win('w_dead', 1525, 330, 540, 270, `<div class="abs" style="left:0;top:0;width:100%;height:7px;background:${C.red}"></div><div class="abs" style="left:30px;top:36px;font:600 27px Plex;color:#e6e9f0;letter-spacing:.06em;white-space:nowrap">${esc(ow.deadline)}</div>${cal}
    <div class="abs" style="left:278px;top:104px;width:42px;height:34px;border:2.5px solid #e6e9f0;border-radius:6px"></div>`);
  let wave = ''; for (let i = 0; i < 40; i++) { const hh = 10 + Math.abs(Math.sin(i * .7)) * 50 * r(); wave += `<div class="abs" style="left:${24 + i * 7}px;top:${90 - hh / 2}px;width:3px;height:${hh}px;background:#9aa2bd;border-radius:2px"></div>`; }
  win('w_lic', 1150, 640, 340, 230, `<div class="wdots">● ● ●</div>${wave}<div class="abs" style="left:24px;top:150px;font:500 21px Plex;color:#d5d9e3;white-space:nowrap"><svg width="18" height="20" viewBox="0 0 18 20" style="vertical-align:-2px;margin-right:8px"><rect x="2" y="8" width="14" height="11" rx="2" fill="none" stroke="#d5d9e3" stroke-width="1.8"/><path d="M5 8V5a4 4 0 0 1 8 0v3" fill="none" stroke="#d5d9e3" stroke-width="1.8"/></svg>${esc(ow.license)}</div>`);
  const inv = (id, x, y, txt) => win(id, x, y, 520, 200, `<div class="lbl abs" style="left:30px;top:30px">${esc(ow.invoice_label)}</div><div class="abs" style="left:30px;top:76px;font:500 30px Plex;color:#e3e6ee;white-space:nowrap">${esc(txt)}</div><div class="gbar" style="left:30px;top:140px;width:340px;height:10px;opacity:.6"></div>`);
  inv('w_inv1', 70, 650, ow.invoices[0]);
  win('w_rend', 560, 690, 520, 210, `<div class="wdots">● ● ●</div><div class="abs" style="left:34px;top:70px;font:500 26px Plex;color:#e3e6ee">${esc(ow.rendering)}</div><div class="abs" style="left:34px;top:130px;width:450px;height:12px;border-radius:6px;background:rgba(255,255,255,.08)"><div id="rendfill" style="height:100%;width:99%;border-radius:6px;background:#dfe4f0"></div></div>`);
  inv('w_inv2', 20, 296, ow.invoices[1]);
  inv('w_inv3', 520, 760, ow.invoices[2]);
  inv('w_inv4', 1440, 645, ow.invoices[3]);
  el(wl, `<div id="w_total" class="abs" style="left:235px;top:665px;padding:24px 44px;border:7px solid #f3f4f8;outline:2px solid #f3f4f8;outline-offset:6px;background:#0d111c;font:600 74px Plex;color:#f6f7fb;white-space:nowrap;letter-spacing:.02em;box-shadow:0 30px 60px rgba(0,0,0,.6)">${esc(ow.total)}</div>`);
  el(wl, `<div id="w_fail" class="win" style="left:330px;top:360px;width:840px;height:250px;border:1.5px solid rgba(226,71,79,.6);box-shadow:0 0 60px rgba(226,71,79,.35),0 30px 60px rgba(0,0,0,.6)"><div class="wdots">● ● ●</div>
    <div class="abs" style="left:46px;top:84px;width:58px;height:58px;border-radius:50%;border:3.5px solid #ff4d57;color:#ff4d57;font:600 38px/50px Plex;text-align:center">✕</div>
    <div class="abs" style="left:128px;top:86px;font:600 44px Plex;letter-spacing:.14em;color:#ff4d57;white-space:nowrap;text-shadow:0 0 18px rgba(255,77,87,.5)">${esc(ow.render_failed)}</div>
    <div class="abs" style="left:46px;top:185px;width:740px;height:10px;border-radius:5px;background:rgba(255,255,255,.08)"><div style="width:84%;height:100%;border-radius:5px;background:#ff4d57;box-shadow:0 0 14px #ff4d57"></div></div></div>`);
}

const WIN_IN = { w_tl: 6.0, w_err: 6.65, w_lic: 6.95, w_bell: 7.4, w_dead: 7.75, w_inv1: 7.95, w_rend: 8.15, w_inv2: 8.7, w_inv3: 9.0, w_inv4: 9.1 };

function updateAct1(t) {
  const a = $('a1');
  if (!vis(a, t < 18.0)) return;

  const hook = T.hook.typed, turn = T.turn.typed;
  // ---- camera ----
  let cam = lerp(1, 1.035, p(t, 0, 6));
  cam = lerp(cam, 0.8, eo(p(t, 6.0, 7.6)));
  cam = lerp(cam, 0.77, p(t, 7.6, 12));
  cam = lerp(cam, 1.0, eio(p(t, 12.0, 12.9)));
  let shake = 0;
  if (t > 9.4 && t < 12.2) shake = (t < 10.5 ? 9 * Math.exp(-(t - 9.4) * 7) : 0) + (t > 10.5 ? 6 * Math.exp(-(t - 10.5) * 3) + 1.5 : 0);
  const r = rng(Math.floor(t * 30));
  const sx = (r() - .5) * 2 * shake, sy = (r() - .5) * 2 * shake;
  const w1 = $('w1');
  st(w1, { transformOrigin: '960px 540px', transform: `translate(${sx}px,${sy}px) scale(${cam})` });
  // zoom-through into the last word of the answer
  const z = ei(p(t, 17.25, 17.9));
  st(a, { transformOrigin: `${ZO.x}px ${ZO.y}px`, transform: `scale(${1 + z * 1.1})`, filter: blur(z * 14), opacity: 1 - z });

  // ---- input box: the outline draws itself, then fills ----
  const wHook = boxW(hook), wTurn = boxW(turn);
  const bw = lerp(wHook, wTurn, eio(p(t, 12.3, 12.9)));
  const bx = 960 - bw / 2, by = BOX.y;
  const grow = eo(p(t, 1.45, 2.0));
  const curW = lerp(150, bw, grow);
  const box = $('box1');
  const dimAns = eo(p(t, 15.95, 16.5));
  const fill = p(t, 1.85, 2.35);
  st(box, {
    left: bx + 'px', top: by + 'px', width: curW + 'px', height: BOX.h + 'px', opacity: (t >= 1.45 ? 1 : 0) * (1 - dimAns * .8),
    background: `rgba(16,22,38,${(.78 * fill).toFixed(3)})`, borderColor: `rgba(220,228,248,${lerp(.9, .3, p(t, 1.95, 2.6)).toFixed(3)})`, filter: blur(dimAns * 5),
  });
  const sk = p(t, 1.95, 2.25);
  st($('send1'), { opacity: clamp(sk * 2), transform: `scale(${back(sk, 2)})` });
  const cometOn = t >= 1.45 && t < 2.25, cOp = 1 - p(t, 1.95, 2.25);
  [['comet1', by - 1], ['comet2', by + BOX.h - 2]].forEach(([id, y]) => { const c = $(id); vis(c, cometOn); st(c, { left: (bx + curW - 96) + 'px', top: y + 'px', opacity: cOp }); });
  // big clock
  const ck = $('bigclock');
  const ckIn = eo(p(t, 0.1, 0.9));
  st(ck, { left: (bx + 42) + 'px', top: (by - 220) + 'px', opacity: ckIn * (1 - p(t, 5.8, 6.4)) * .88, filter: blur((1 - ckIn) * 10 + p(t, 5.8, 6.4) * 8), transform: `translateY(${-p(t, 5.8, 6.4) * 30}px)` });
  // lone caret before the box appears
  const lc = $('lonecaret');
  vis(lc, t < 1.5);
  st(lc, { left: (bx + 38) + 'px', top: (by + 34) + 'px' });
  lc.innerHTML = caret(blink(t));

  // text in box
  let txt = '';
  if (t < 12.3) txt = typed(hook, t, 2.0, 5.4);
  else if (t < 12.8) txt = hook.slice(0, Math.round(hook.length * (1 - p(t, 12.3, 12.75))));
  else if (t < 14.55) txt = typed(turn, t, 12.9, 14.2);
  const typingNow = typing(t, 2.0, 5.4) || typing(t, 12.3, 14.2);
  $('box1t').innerHTML = esc(txt) + caret(typingNow ? 1 : blink(t));

  // sent bubble + thinking dots
  const b1 = $('bubble1'), d1 = $('dots1');
  const sendK = eo(p(t, 14.55, 15.0));
  vis(b1, t >= 14.55); vis(d1, t >= 14.8 && t < 16.05);
  if (t >= 14.55) {
    st(b1, { right: (1920 - (bx + bw - 6)) + 'px', top: lerp(by + 40, by - 82, sendK) + 'px', opacity: sendK * (1 - dimAns * .75), filter: blur(dimAns * 4) });
    b1.textContent = turn;
    const ph = (t - 14.8) * 3;
    d1.innerHTML = [0, 1, 2].map(i => `<span style="opacity:${.3 + .7 * Math.max(0, Math.sin(ph * Math.PI - i * .8))}">•</span>`).join('');
    st(d1, { right: (1920 - (bx + bw - 6)) + 'px', top: (by - 34) + 'px', opacity: p(t, 14.8, 15.0) * (1 - p(t, 15.85, 16.05)) });
  }

  // ---- old-way windows ----
  const wl = $('wins');
  const rack = eio(p(t, 12.0, 12.8));
  st(wl, { transformOrigin: '960px 540px', transform: `translate(${sx * 1.4}px,${sy * 1.4}px) scale(${lerp(1, 1.04, p(t, 6, 12)) + rack * .1})`, filter: blur(rack * 16), opacity: 1 - rack * .65 - p(t, 14, 15.2) * .35 });
  vis(wl, t > 5.9 && t < 15.3);
  for (const id in WIN_IN) {
    const t0 = WIN_IN[id], k = p(t, t0, t0 + 0.32), e = $(id);
    if (!vis(e, t >= t0)) continue;
    const bk = back(k, 1.4);
    const cx = parseFloat(e.style.left) + parseFloat(e.style.width) / 2 - 960;
    const drift = (t - t0) * 0.018;
    st(e, { opacity: clamp(k * 1.6), filter: blur((1 - k) * 12), transform: `translate(${cx * drift}px,0) scale(${lerp(1.3, 1, bk)})` });
  }
  $('bellnum').textContent = Math.round(lerp(T.oldway.unread_from, T.oldway.unread_to, ei(p(t, 7.6, 9.3))));
  $('rendfill').style.opacity = .7 + .3 * Math.sin(t * 9);
  const tot = $('w_total');
  if (vis(tot, t >= 9.4)) {
    const k = p(t, 9.4, 9.62);
    st(tot, { opacity: clamp(k * 2), filter: blur((1 - k) * 16), transform: `rotate(-4deg) scale(${lerp(2.6, 1, eo(k)) + (k >= 1 ? .03 * Math.exp(-(t - 9.62) * 12) : 0)})` });
  }
  const f = $('w_fail');
  if (vis(f, t >= 10.5)) {
    const k = p(t, 10.5, 10.8);
    const flick = t < 11 ? (Math.floor(t * 24) % 3 === 0 ? .55 : 1) : 1;
    st(f, { opacity: clamp(k * 1.5) * flick, transform: `scale(${lerp(.85, 1, back(k, 2))})` });
  }

  // ---- the answer ----
  const yk = eo(p(t, 16.0, 16.45));
  const yb = $('yesbig'), yl = $('yeslbl'), yln = $('yesline'), y2 = $('yesline2');
  vis(yb, t >= 15.95); vis(yl, t >= 15.95); vis(yln, t >= 15.95 && t < 17.1); vis(y2, t >= 16.25);
  st(yb, { opacity: yk, transform: `translateY(${(1 - yk) * 24}px)`, filter: blur((1 - yk) * 18) });
  st(yl, { opacity: eo(p(t, 15.95, 16.3)) * .9 });
  st(yln, { opacity: yk * (1 - p(t, 16.55, 17.0)), transform: `scaleX(${eo(p(t, 15.95, 16.5))})` });
  const ans = T.turn.answer_line, cut = ans.lastIndexOf(' ') + 1;
  const s2 = typed(ans, t, 16.3, 17.15);
  const head = s2.slice(0, Math.min(s2.length, cut)), tail = s2.length > cut ? s2.slice(cut) : '';
  y2.innerHTML = esc(head) + (tail ? `<span style="color:#ec9a6f;text-shadow:0 0 20px rgba(236,154,111,.45)">${esc(tail)}</span>` : '') + (t < 17.2 ? caret(typing(t, 16.3, 17.15) ? 1 : blink(t)) : '');
}

function measureZO() {
  const y2 = $('yesline2');
  y2.style.display = '';
  y2.innerHTML = esc(T.turn.answer_line);
  ZO = { x: y2.offsetLeft + y2.offsetWidth - 150, y: y2.offsetTop + 40 };
  y2.innerHTML = '';
}

// warm/cool glow behind everything (dark acts)
function updateGlow(t) {
  const g = $('glow');
  let col = '60,90,190', a = .22;
  if (t >= 6 && t < 12.2) { col = '200,40,50'; a = .12 + p(t, 9.4, 11) * .25; }
  else if (t >= 15.9 && t < 18) { col = '233,133,92'; a = .45 * eo(p(t, 15.9, 16.6)); }
  else if (t >= 18) { const i = Math.min(6, ROLE_START.filter(s => t >= s).length - 1); const hx = ROLE_COLORS[i]; col = [1, 3, 5].map(j => parseInt(hx.slice(j, j + 2), 16)).join(','); a = .2; }
  g.style.background = `radial-gradient(ellipse 70% 55% at 50% 82%,rgba(${col},${a}) 0%,transparent 70%)`;
  const s = $('stars');
  st(s, { transform: `translate(${-t * 6}px,${-t * 1.5}px)`, opacity: t < 49.5 ? .9 : 0 });
}

// =====================================================================
// ROLE SCENES
// =====================================================================
function titleBlock(parent, id, idx, lines, side, color, top = 215, size = 112) {
  const pos = side === 'right' ? 'right:112px;text-align:right' : 'left:110px';
  el(parent, `<div id="${id}i" class="ridx" style="${pos};top:${top - 52}px;color:${color};opacity:.75">${side === 'right' ? '— ' + idx : idx + ' —'}</div>`);
  lines.forEach((ln, i) => el(parent, `<div id="${id}t${i}" class="rtitle" style="${pos};top:${top + i * size * 1.08}px;font-size:${size}px;color:${color};text-shadow:0 0 34px ${color}88">${esc(ln)}</div>`));
}
function titleUpdate(id, t, t0, n = 1) {
  const ki = eo(p(t, t0, t0 + .45));
  st($(id + 'i'), { opacity: ki * .75 });
  for (let i = 0; i < n; i++) {
    const k = eo(p(t, t0 + .08 + i * .1, t0 + .7 + i * .1));
    st($(id + 't' + i), { opacity: k, transform: `translateY(${(1 - k) * 26}px)`, filter: blur((1 - k) * 12) });
  }
}
// standard whip transition in/out for role scenes
function roleIO(e, t, a, b, o = {}) {
  const on = t > a - 0.2 && t < b + 0.06;
  if (!vis(e, on)) return false;
  const kin = o.inFn ? o.inFn(t) : eo(p(t, a - 0.15, a + 0.4));
  const kout = o.noOut ? 0 : ei(p(t, b - 0.42, b + 0.04));
  const x = (1 - kin) * 260 - kout * 260;
  const bl = (1 - kin) * 16 + kout * 18;
  const sc = (o.scale ? o.scale(t) : 1) * (o.inScale ? lerp(o.inScale, 1, kin) : 1) * (o.outScale ? lerp(1, o.outScale, kout) : 1);
  st(e, { opacity: kin * (1 - kout), filter: blur(bl), transform: `translateX(${o.inScale ? 0 : x}px) scale(${sc})`, transformOrigin: o.origin || '960px 540px' });
  return true;
}

// ---------- 04 Writer ----------
const WR_ZOOM = { x: 760, y: 560 };
function buildWriter() {
  const s = el(S, `<div id="sW" class="layer persp" style="perspective-origin:50% 40%"></div>`);
  const wrap = el(s, `<div id="pwrap" class="layer p3d"></div>`);
  el(wrap, `<div class="abs" style="left:330px;top:228px;width:1120px;height:760px;border-radius:16px;border:1px solid rgba(255,181,71,.25);background:rgba(18,20,34,.75)"></div>`);
  const paper = el(wrap, `<div id="paper"></div>`);
  const lines = [
    ['fade', 'amber', ''], ['slug', '', ''], ['action', '', ''], ['gap', '', 'min-height:24px'],
    ['char1', '', 'padding-left:270px;font-weight:700'], ['line1', '', 'padding-left:150px'], ['gap2', '', 'min-height:24px'],
    ['char2', '', 'padding-left:270px'], ['line2', '', 'padding-left:150px'], ['cut', 'amber', 'text-align:right;margin-top:26px'],
  ];
  lines.forEach(([k, cls, sty]) => el(paper, `<div id="pw_${k}" class="ln ${cls}" style="${sty}"></div>`));
  const tb = el(s, `<div id="tWbox" class="layer"></div>`);
  titleBlock(tb, 'tW', T.roles.writer.index, [T.roles.writer.title], 'right', '#f4c064', 238, 124);
}
function updateWriter(t) {
  const s = $('sW');
  if (!vis(s, t > 17.4 && t < 21.8)) return;
  const kin = eo(p(t, 17.45, 18.15));
  st(s, { transformOrigin: `${ZO.x}px ${ZO.y}px`, transform: `scale(${lerp(.55, 1, kin)})`, opacity: kin, filter: blur((1 - kin) * 10) });
  const out = ei(p(t, 21.15, 21.75));
  st($('pwrap'), { transformOrigin: `${WR_ZOOM.x}px ${WR_ZOOM.y}px`, transform: `scale(${(1 + .04 * p(t, 18, 21.2)) * lerp(1, 1.9, out)}) rotateX(24deg) rotateZ(-9deg)`, filter: blur(out * 14), opacity: 1 - out });
  st($('tWbox'), { transform: `translateY(${-eio(p(t, 21.15, 21.65)) * 240}px)`, opacity: 1 - p(t, 21.3, 21.65) });
  const w = T.writer;
  const seq = [
    ['fade', w.fade_in, 17.75, 18.0], ['slug', w.slug, 18.0, 18.5], ['action', w.action, 18.5, 19.05],
    ['char1', w.char_1, 19.1, 19.3], ['line1', w.line_1, 19.3, 19.75], ['line2', w.line_2, 20.05, 20.6], ['cut', w.cut_to, 20.75, 20.95],
  ];
  for (const [k, txt, a, b] of seq) {
    const on = typing(t, a, b);
    $('pw_' + k).innerHTML = esc(typed(txt, t, a, b)) + (on ? caret(1) : '');
  }
  const c2 = $('pw_char2');
  const kc = back(p(t, 19.8, 20.0), 2);
  c2.innerHTML = t >= 19.8 ? `<span class="pill" style="transform:scale(${kc});display:inline-block">${esc(w.char_2)}</span>` : '';
  titleUpdate('tW', t, 18.0);
}

// ---------- 05 Art Director ----------
const SW_HEX = ['#070B16', '#E07A55', '#FFB547', '#FF5C8A', '#3FE0A5', '#9B7BFF', '#C8F05A', '#5CC8FF', '#FFD86B'];
const ART_WHEEL = { x: 300, y: 300 };          // board coords
const ART_WHEEL_SCREEN = { x: 1005, y: 468 };  // where that lands on screen
function buildArt() {
  const s = el(S, `<div id="sA" class="layer persp"></div>`);
  const lines = T.roles.art.title_lines || [T.roles.art.title];
  titleBlock(s, 'tA', T.roles.art.index, lines, 'left', C.art, 250, 120);
  const b = el(s, `<div id="board" class="abs p3d" style="left:700px;top:165px;width:1090px;height:730px"></div>`);
  st(b, { transform: 'rotateY(-14deg) rotateX(4deg)' });
  el(b, `<div id="bframe" class="abs" style="left:0;top:0;width:1090px;height:730px;border-radius:24px;border:1.5px solid rgba(255,92,138,.45);background:rgba(14,14,28,.55);box-shadow:0 0 50px rgba(255,92,138,.12)"></div>`);
  const a = T.art;
  const card = (id, x, y, w, h, inner) => el(b, `<div id="${id}" class="card" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="pd"></div>${inner}</div>`);
  card('ac0', 40, 45, 300, 440, `<div class="abs" style="left:0;width:100%;top:70px;text-align:center;font:400 190px/1 Fraunces;color:#f4f2f6">${esc(a.font_sample)}</div><div class="abs" style="left:22px;right:22px;bottom:70px;height:2px;background:linear-gradient(90deg,#FF5C8A,transparent)"></div><div class="cl" style="color:#e9e3ea">${esc(a.font_display)}</div>`);
  card('ac1', 365, 65, 220, 200, `<div class="abs" style="left:30px;top:40px;width:160px;height:90px;border-radius:50%;background:radial-gradient(ellipse at 60% 50%,#dfe6f5 0%,#5a6278 35%,transparent 70%);filter:blur(4px)"></div><div class="cl">${esc(a.moods[0])}</div>`);
  card('ac2', 365, 285, 220, 200, `<div class="abs" style="left:14px;right:14px;top:34px;height:110px;border-radius:8px;background:linear-gradient(180deg,#181631 0%,#3c2052 55%,#ff5c8a 120%)"></div><div class="cl">${esc(a.moods[1])}</div>`);
  card('ac3', 610, 85, 235, 400, `<div class="abs" style="left:20px;top:80px;width:195px;height:195px;border-radius:50%;background:radial-gradient(circle,#ffe0c0 0%,#ff8a4c 25%,rgba(224,80,60,.35) 55%,transparent 72%)"></div><div class="cl">${esc(a.moods[2])}</div>`);
  card('ac4', 870, 105, 185, 215, `<div class="abs" style="left:16px;right:16px;top:34px;height:120px;border-radius:6px;background:radial-gradient(ellipse at 45% 45%,#fff3d8 0%,#cfe0f0 55%,#9cc3e6 100%)"></div><div class="cl" style="font-size:16px">${esc(a.moods[3])}</div>`);
  card('ac5', 860, 345, 200, 140, `<div class="abs" style="left:18px;top:52px;font:500 22px Plex;color:#e9e3ea;white-space:nowrap">${esc(a.font_mono)}</div><div class="abs" style="left:18px;top:92px;width:20px;height:3px;background:#FF5C8A"></div>`);
  el(b, `<div id="birth" class="abs" style="width:100px;height:100px;border-radius:50%;border:2px solid #ffb547;box-shadow:0 0 30px rgba(255,181,71,.6),inset 0 0 20px rgba(255,181,71,.4)"></div>`);
  SW_HEX.forEach((h, i) => {
    el(b, `<div id="sw${i}" class="sw" style="background:radial-gradient(circle at 35% 30%,#ffffff55,transparent 45%),${h};box-shadow:0 0 22px ${h}88${i === 0 ? ',inset 0 0 0 2px #2a2f44' : ''}"></div>`);
    el(b, `<div id="swl${i}" class="swl" style="color:#e6dde3">${h}</div>`);
  });
  el(b, `<div id="selector" class="abs" style="width:120px;height:120px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 20px rgba(255,255,255,.6)"></div>`);
  el(b, `<div id="wheel" class="abs" style="width:240px;height:240px;border-radius:50%;background:conic-gradient(#ff5c8a,#ffb547,#c8f05a,#3fe0a5,#5cc8ff,#9b7bff,#ff5c8a);-webkit-mask:radial-gradient(circle,transparent 58%,#000 60%);mask:radial-gradient(circle,transparent 58%,#000 60%);box-shadow:0 0 40px rgba(255,255,255,.2)"></div>`);
  el(b, `<div id="pick" class="abs" style="border-radius:50%"></div>`);
  el(S, `<div id="handoff" class="abs" style="width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#c9ffe9,#3FE0A5 60%);box-shadow:0 0 18px #3FE0A5,0 0 44px #3FE0A5"></div>`);
}
function swRow(i) { return { x: 52 + i * 112 + 46, y: 550 + 46 }; }
function updateArt(t) {
  const s = $('sA');
  const on = vis(s, t > 21.4 && t < 26.0);
  const ho = $('handoff');
  vis(ho, t > 25.4 && t < 26.02);
  if (t > 25.4 && t < 26.02) {
    const k = eio(p(t, 25.55, 25.95));
    st(ho, { left: (lerp(ART_WHEEL_SCREEN.x, AN_BALL_SCREEN.x, k) - 25) + 'px', top: (lerp(ART_WHEEL_SCREEN.y, AN_BALL_SCREEN.y, k) - 25) + 'px', opacity: 1 });
  }
  if (!on) return;
  const out = ei(p(t, 25.45, 25.95));
  st(s, { opacity: 1 - out, filter: blur(out * 16), transform: `scale(${(1 + .05 * p(t, 22, 25.4)) * (1 + out * .06)})`, transformOrigin: '960px 540px' });
  titleUpdate('tA', t, 21.95, (T.roles.art.title_lines || [1]).length);
  // board frame flies in from the right
  const bf = eo(p(t, 22.25, 22.75));
  st($('bframe'), { opacity: bf, transform: `translateX(${(1 - bf) * 340}px)` });
  [22.35, 22.55, 22.7, 22.85, 23.0, 23.65].forEach((t0, i) => {
    const k = p(t, t0, t0 + .35);
    st($('ac' + i), { opacity: clamp(k * 1.5), transform: `translateX(${(1 - eo(k)) * 120}px) scale(${lerp(.85, 1, back(k, 1.5))})` });
  });
  // birth ring
  const bk = p(t, 21.45, 21.9);
  const brt = $('birth');
  vis(brt, t > 21.45 && t < 21.95);
  st(brt, { left: (256 - 50) + 'px', top: (382 - 50) + 'px', transform: `scale(${lerp(.2, 1.6, eo(bk))})`, opacity: Math.sin(bk * Math.PI) });
  // ring centre/radius/size: screen-centred ring, then wraps around the Aa card
  const mv = eio(p(t, 22.2, 22.8));
  const cx = lerp(256, 215, mv), cy = lerp(382, 345, mv), R = lerp(270, 235, mv), sz = lerp(1.4, 1.08, mv);
  for (let i = 0; i < 9; i++) {
    const born = eo(p(t, 21.55 + i * .03, 22.0 + i * .03));
    const ang = -Math.PI / 2 + i * (Math.PI * 2 / 9) + Math.max(0, t - 21.9) * .25;
    const rx = cx + Math.cos(ang) * R * born, ry = cy + Math.sin(ang) * R * born;
    const row = swRow(i);
    const k = back(p(t, 23.2 + i * .045, 23.62 + i * .045), 1.2), kk = clamp(k);
    let x = lerp(rx, row.x, k), y = lerp(ry, row.y, k), sc = lerp(sz, 1, kk) * born;
    if (i === 3) sc *= 1 + .25 * Math.sin(p(t, 24.85, 25.25) * Math.PI);
    st($('sw' + i), { left: (x - 46) + 'px', top: (y - 46) + 'px', transform: `scale(${sc})`, opacity: born });
    st($('swl' + i), { left: x + 'px', top: (y + 46 * sc + 12) + 'px', transform: 'translateX(-50%)', opacity: eo(p(t, 21.85 + i * .02, 22.15 + i * .02)), fontSize: lerp(19, 15, kk) + 'px' });
  }
  // colour wheel, selector and the picked colour
  const wk = p(t, 24.45, 24.8), wo = p(t, 25.55, 25.85);
  const wh = $('wheel');
  vis(wh, t > 24.45 && t < 25.9);
  st(wh, { left: (ART_WHEEL.x - 120) + 'px', top: (ART_WHEEL.y - 120) + 'px', transform: `scale(${back(wk, 1.8) * (1 - wo * .3)}) rotate(${(t - 24.45) * 120}deg)`, opacity: 1 - wo });
  const sel = $('selector');
  vis(sel, t > 24.55 && t < 25.05);
  const a2 = swRow(2), a3 = swRow(3), sk = eio(p(t, 24.7, 24.88));
  st(sel, { left: (lerp(a2.x, a3.x, sk) - 60) + 'px', top: (a2.y - 60) + 'px', opacity: p(t, 24.55, 24.65) * (1 - p(t, 24.95, 25.05)), transform: `scale(${lerp(.9, 1, p(t, 24.55, 24.7))})` });
  const pk = $('pick');
  vis(pk, t > 25.0 && t < 25.45);
  const fk = eio(p(t, 25.0, 25.25)), ck = p(t, 25.25, 25.45);
  const d = lerp(92, 50, fk);
  const col = mixHex('#FF5C8A', '#3FE0A5', ck);
  st(pk, { left: (lerp(a3.x, ART_WHEEL.x, fk) - d / 2) + 'px', top: (lerp(a3.y, ART_WHEEL.y, fk) - d / 2) + 'px', width: d + 'px', height: d + 'px', background: col, boxShadow: `0 0 20px ${col},0 0 44px ${col}` });
}
function mixHex(a, b, k) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`;
}

// ---------- 06 Animator ----------
const AN = { x0: 90, x1: 1380, yb: 470, yt: 120 };
const AN_BALL_SCREEN = { x: 845, y: 628 };
const expoIO = u => (u <= 0 ? 0 : u >= 1 ? 1 : u < .5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2);
function buildAnimator() {
  const s = el(S, `<div id="sN" class="layer persp"></div>`);
  titleBlock(s, 'tN', T.roles.animator.index, [T.roles.animator.title], 'right', C.anim, 230, 116);
  el(s, `<div id="anTracks"><div class="abs" style="left:150px;top:282px;width:300px;height:5px;border-radius:3px;background:#e9a24c;opacity:.7"></div><div class="abs" style="left:190px;top:300px;width:200px;height:5px;border-radius:3px;background:#e2557a;opacity:.6"></div><div class="abs" style="left:230px;top:318px;width:160px;height:5px;border-radius:3px;background:#3FE0A5;opacity:.5"></div></div>`);
  const pnl = el(s, `<div id="anp" class="abs" style="left:110px;top:330px;width:1520px;height:610px"></div>`);
  let grid = '';
  for (let i = 0; i <= 12; i++) grid += `<line x1="${AN.x0 + i * (AN.x1 - AN.x0) / 12}" y1="70" x2="${AN.x0 + i * (AN.x1 - AN.x0) / 12}" y2="${AN.yb + 20}" stroke="rgba(63,224,165,.08)"/>`;
  for (let j = 0; j <= 6; j++) grid += `<line x1="${AN.x0}" y1="${70 + j * 70}" x2="${AN.x1}" y2="${70 + j * 70}" stroke="rgba(63,224,165,.08)"/>`;
  let ruler = '';
  for (let i = 0; i <= 40; i++) { const x = AN.x0 + i * (AN.x1 - AN.x0) / 40; ruler += `<line x1="${x}" y1="520" x2="${x}" y2="${i % 10 ? 527 : 536}" stroke="rgba(200,230,220,.45)"/>`; if (i % 10 === 0) ruler += `<text x="${x}" y="510" fill="rgba(200,230,220,.55)" font-family="Plex" font-size="17" text-anchor="middle">${i}</text>`; }
  pnl.innerHTML = `<div id="anFrame" class="abs" style="left:0;top:0;width:1520px;height:610px;border-radius:20px;border:1.5px solid rgba(63,224,165,.45);background:rgba(8,22,22,.55);box-shadow:0 0 50px rgba(63,224,165,.12)"></div>
    <svg width="1520" height="610" style="position:absolute;left:0;top:0;overflow:visible"><g id="anGrid">${grid}<line x1="${AN.x0}" y1="530" x2="${AN.x1}" y2="530" stroke="rgba(200,230,220,.35)"/>${ruler}</g>
    <g id="anHandles"></g>
    <path id="anCurve" fill="none" stroke="#3FE0A5" stroke-width="4" style="filter:drop-shadow(0 0 8px #3FE0A5)"/>
    <g id="anMarks"></g><g id="anTrail"></g>
    <line id="anPlay" y1="80" y2="545" stroke="#e6fff4" stroke-width="1.5" opacity=".8"/><path id="anPlayHead" fill="#e6fff4"/>
    <circle id="anBall" r="24" fill="#7dffd0" style="filter:drop-shadow(0 0 18px #3FE0A5) drop-shadow(0 0 40px #3FE0A5)"/>
    <g id="anDiam"></g></svg>
    <div id="anLabel" class="abs mono" style="left:${AN.x0}px;top:22px;padding:5px 16px;border-radius:7px;background:rgba(63,224,165,.12);border:1px solid rgba(63,224,165,.35);font-size:19px;color:#b9ffe4;white-space:nowrap"></div>
    <svg id="anCursor" width="34" height="40" viewBox="0 0 17 20" style="position:absolute;left:0;top:0"><path d="M1 1l13 10-6 1 3 6-3 1-3-6-4 4z" fill="#fff" stroke="#111" stroke-width="1"/></svg>`;
  st(pnl, { transformOrigin: '50% 60%' });
  el(S, `<div id="anLine" class="abs" style="left:0;width:1920px;height:4px;border-radius:2px"></div>`);
}
function anBallU(t) {
  if (t < 26.05) return .5;
  if (t < 26.15) return lerp(.5, 0, eio(p(t, 26.05, 26.15)));
  if (t < 26.45) return p(t, 26.15, 26.45);
  if (t < 27.62) return 1;
  if (t < 27.66) return 0;
  if (t < 28.0) return eio(p(t, 27.66, 28.0));
  if (t < 28.3) return 1;
  if (t < 28.75) return p(t, 28.3, 28.75);
  if (t < 29.0) return 1;
  return lerp(1, .45, eio(p(t, 29.0, 29.5)));
}
function updateAnimator(t) {
  const s = $('sN'), line = $('anLine');
  const on = vis(s, t > 25.5 && t < 30.0);
  // the flattened curve becomes a full-width line that hands over to the composer
  const lOn = t > 29.3 && t < 30.25;
  vis(line, lOn);
  if (lOn) {
    const lk = eo(p(t, 29.3, 29.7)), mk = eio(p(t, 29.5, 29.85));
    const col = mixHex('#3FE0A5', '#9B7BFF', p(t, 29.5, 29.9));
    st(line, { top: lerp(626, 800, mk) + 'px', transform: `scaleX(${lerp(.62, 1, lk)})`, background: `linear-gradient(90deg,transparent,${col} 15%,${col} 85%,transparent)`, boxShadow: `0 0 14px ${col}`, opacity: p(t, 29.3, 29.4) * (1 - p(t, 29.9, 30.25)) });
  }
  if (!on) return;
  const kin = eo(p(t, 25.55, 26.0));
  const out = p(t, 29.45, 29.95);
  st(s, { opacity: kin * (1 - out), filter: blur((1 - kin) * 10 + out * 8) });
  titleUpdate('tN', t, 26.1);
  const m1 = eio(p(t, 27.3, 27.6)), m2 = eio(p(t, 28.05, 28.3)), m3 = eio(p(t, 29.0, 29.4));
  const V = u => lerp(lerp(lerp(u, expoIO(u), m1), back(u, 1.7), m2), .5, m3);
  const X = u => AN.x0 + u * (AN.x1 - AN.x0), Y = v => AN.yb - v * (AN.yb - AN.yt);
  let d = '';
  for (let i = 0; i <= 100; i++) { const u = i / 100; d += (i ? 'L' : 'M') + X(u).toFixed(1) + ' ' + Y(V(u)).toFixed(1); }
  $('anCurve').setAttribute('d', d);
  $('anLabel').innerHTML = `● ${esc(m2 > .5 ? T.animator.ease_b : m1 > .5 ? (T.animator.ease_mid || 'expo.inOut') : T.animator.ease_a)}`;
  // panel flattens at the end
  const fl = m3;
  $('anp').style.transform = `rotateX(${lerp(20, 0, fl)}deg) rotateZ(${lerp(-1, 0, fl)}deg)`;
  const fade = 1 - p(t, 29.15, 29.5);
  ['anFrame', 'anGrid', 'anLabel', 'anDiam', 'anTracks'].forEach(id => { $(id).style.opacity = fade; });
  // keyframes
  let mk = `<rect x="${X(0) - 9}" y="${Y(V(0)) - 9}" width="18" height="18" fill="#3FE0A5"/><rect x="${X(1) - 9}" y="${Y(V(1)) - 9}" width="18" height="18" fill="#3FE0A5"/>`;
  [.35, .7].forEach(u => { mk += `<circle cx="${X(u)}" cy="${Y(V(u))}" r="7" fill="#0b1a18" stroke="#c8ffe9" stroke-width="2" opacity="${(1 - m1 * (1 - m2)) * fade}"/>`; });
  $('anMarks').innerHTML = mk;
  // bezier handles (expo, then dragged into back.out)
  const hOp = Math.min(m1 > 0 ? 1 : 0, 1 - p(t, 28.45, 28.7));
  let hd = '';
  if (hOp > 0) {
    const h1x = lerp(X(.75), X(.3), m2), h1y = lerp(Y(0), Y(1.35), m2);
    const h2x = lerp(X(.15), X(1), m2), h2y = Y(V(1));
    const g1x = lerp(X(0), h1x, m1), g1y = lerp(Y(0), h1y, m1), g2x = lerp(X(1), h2x, m1);
    hd = `<line x1="${X(0)}" y1="${Y(V(0))}" x2="${g1x}" y2="${g1y}" stroke="rgba(230,255,245,.75)" stroke-width="1.6"/><circle cx="${g1x}" cy="${g1y}" r="7" fill="#0b1a18" stroke="#e6fff4" stroke-width="2"/>`;
    if (m2 < .98) hd += `<line x1="${X(1)}" y1="${h2y}" x2="${g2x}" y2="${h2y}" stroke="rgba(230,255,245,.75)" stroke-width="1.6"/><circle cx="${g2x}" cy="${h2y}" r="7" fill="#0b1a18" stroke="#e6fff4" stroke-width="2"/>`;
  }
  $('anHandles').innerHTML = hd;
  $('anHandles').setAttribute('opacity', hOp);
  // ball + trail
  const u = anBallU(t);
  const bx = X(u), by = Y(V(u));
  const ball = $('anBall');
  ball.setAttribute('cx', bx); ball.setAttribute('cy', by); ball.setAttribute('opacity', t >= 25.98 ? 1 : 0);
  $('anPlay').setAttribute('x1', bx); $('anPlay').setAttribute('x2', bx); $('anPlay').setAttribute('opacity', .8 * fade);
  $('anPlayHead').setAttribute('d', `M${bx - 8} 530 L${bx + 8} 530 L${bx} 542 Z`);
  let tr = '';
  for (let k = 1; k <= 7; k++) {
    const uu = anBallU(t - k * .028);
    if (Math.abs(uu - u) < .004) continue;
    tr += `<circle cx="${X(uu)}" cy="${Y(V(uu))}" r="${21 - k * 1.8}" fill="#3FE0A5" opacity="${.34 - k * .04}"/>`;
  }
  $('anTrail').innerHTML = tr;
  let dm = '';
  [0, .33, .66, 1].forEach(uu => { const lit = u >= uu - .001 && t > 26.15; dm += `<rect x="${X(uu) - 9}" y="561" width="18" height="18" transform="rotate(45 ${X(uu)} 570)" fill="${lit ? '#3FE0A5' : 'none'}" stroke="#3FE0A5" stroke-width="2" opacity="${lit ? 1 : .5}"/>`; });
  $('anDiam').innerHTML = dm;
  // the cursor that edits the curve
  const cur = $('anCursor');
  const cOn = t > 27.0 && t < 28.5;
  vis(cur, cOn);
  if (cOn) {
    let cx, cy;
    if (t < 27.3) { const k = eo(p(t, 27.0, 27.3)); cx = lerp(X(.45), X(.3), k); cy = lerp(Y(-.05) + 60, Y(0), k); }
    else if (t < 28.05) { const k = m1; cx = lerp(X(.3), X(.75), k); cy = Y(0); }
    else { cx = lerp(X(.75), X(.3), m2); cy = lerp(Y(0), Y(1.35), m2); }
    st(cur, { left: (cx - 3) + 'px', top: (cy - 2) + 'px', opacity: p(t, 27.0, 27.1) * (1 - p(t, 28.35, 28.5)) });
  }
}

// ---------- 07 Composer ----------
const NOTES = (() => {
  const r = rng(42), n = [];
  const mel = [7, 5, 4, 5, 7, 8, 7, 5, 4, 2, 4, 5, 7, 9, 8, 7];
  for (let i = 0; i < 16; i++) n.push({ s: i * 2, l: r() < .3 ? 3 : 2, row: mel[i] });
  for (let i = 0; i < 4; i++) n.push({ s: i * 8, l: 7, row: 13 + (i % 2) });
  for (let i = 0; i < 8; i++) n.push({ s: i * 4 + 1, l: 1, row: 10 + Math.floor(r() * 2) });
  return n;
})();
const WAVE_N = 700;
function buildComposer() {
  const s = el(S, `<div id="sC" class="layer persp"></div>`);
  titleBlock(s, 'tC', T.roles.composer.index, [T.roles.composer.title], 'left', C.comp, 230, 116);
  const pnl = el(s, `<div id="cpp" class="abs" style="left:140px;top:340px;width:1530px;height:330px;border-radius:16px;border:1.5px solid rgba(155,123,255,.45);background:rgba(16,12,32,.6);overflow:hidden;box-shadow:0 0 50px rgba(155,123,255,.15)"></div>`);
  const black = i => [1, 3, 6, 8, 10].includes(i % 12);
  let keys = '';
  for (let i = 0; i < 16; i++) keys += `<div class="abs" style="left:0;top:${40 + i * 18}px;width:${black(i) ? 70 : 110}px;height:16px;background:${black(i) ? '#3a3352' : '#cfc8e6'};opacity:.75"></div><div id="kh${i}" class="abs" style="left:0;top:${40 + i * 18}px;width:118px;height:16px;background:#fff;box-shadow:0 0 14px #c9b6ff;opacity:0"></div>`;
  let grid = '';
  for (let i = 0; i <= 32; i++) grid += `<div class="abs" style="left:${130 + i * 43}px;top:30px;width:1px;height:300px;background:rgba(155,123,255,${i % 8 ? .08 : .3})"></div>`;
  pnl.innerHTML = `${keys}${grid}<div class="abs mono" style="right:24px;top:8px;font-size:16px;color:#cfc3ff;letter-spacing:.06em">● ${esc(T.composer.meta)}</div><div id="cpNotes"></div><div id="cpPlay" class="abs" style="top:28px;width:2px;height:300px;background:#efe9ff;box-shadow:0 0 10px #fff"></div>`;
  const notes = pnl.querySelector('#cpNotes');
  NOTES.forEach((n, i) => el(notes, `<div id="cn${i}" class="abs" style="left:${130 + n.s * 43}px;top:${40 + n.row * 18}px;width:${n.l * 43 - 4}px;height:14px;border-radius:3px;background:#9B7BFF;transform-origin:left center"></div>`));
  pnl.style.transform = 'rotateX(30deg) rotateY(-9deg)';
  const r = rng(5);
  let bars = '';
  for (let i = 0; i < WAVE_N; i++) {
    const ph = i / WAVE_N, beat = Math.exp(-((i % 44) / 44) * 3), cres = .3 + .7 * ph;
    const a = (.12 + .88 * beat * cres) * (.45 + r() * .55);
    bars += `<rect x="${i * 2}" y="${110 - a * 100}" width="1.3" height="${a * 200}" fill="#b49bff"/>`;
  }
  el(s, `<div class="abs" style="left:270px;top:799px;width:1400px;height:1.5px;background:rgba(170,150,255,.45)"></div>`);
  el(s, `<div id="cpWave" class="abs" style="left:270px;top:690px;width:1400px;height:220px;overflow:hidden"><svg width="1400" height="220" style="filter:drop-shadow(0 0 8px #9B7BFF)">${bars}</svg></div>`);
  el(s, `<div id="cpWaveLine" class="abs" style="top:690px;width:2px;height:220px;background:#f2edff;box-shadow:0 0 12px #fff"></div>`);
  el(s, `<div id="cpDot" class="abs" style="top:795px;width:10px;height:10px;border-radius:50%;background:#fff;box-shadow:0 0 12px #fff"></div>`);
  // lime glyph that hands over to the sound designer
  let g = '';
  [26, 44, 34, 52, 30, 40, 22].forEach((h, i) => g += `<div class="abs" style="left:${i * 12}px;top:${(60 - h) / 2}px;width:5px;height:${h}px;border-radius:2px;background:#C8F05A;box-shadow:0 0 10px #C8F05A"></div>`);
  el(S, `<div id="snapGlyph" class="abs" style="left:918px;top:640px;width:84px;height:60px">${g}<div class="abs" style="left:38px;top:-260px;width:4px;height:580px;background:linear-gradient(180deg,transparent,rgba(200,240,90,.0) 20%,rgba(230,220,255,.85) 50%,rgba(200,240,90,0) 80%,transparent)"></div></div>`);
}
function updateComposer(t) {
  const s = $('sC'), gl = $('snapGlyph');
  const gOn = t > 33.25 && t < 34.05;
  vis(gl, gOn);
  if (gOn) st(gl, { opacity: eo(p(t, 33.25, 33.45)) * (1 - p(t, 33.8, 34.05)), transform: `scale(${lerp(.6, 1.15, eo(p(t, 33.25, 33.7)))}) scaleY(${lerp(.3, 1, eo(p(t, 33.25, 33.45)))})` });
  if (!vis(s, t > 29.55 && t < 33.85)) return;
  const kin = eo(p(t, 29.6, 30.05));
  const zk = ei(p(t, 33.15, 33.8));
  st(s, { opacity: kin * (1 - p(t, 33.5, 33.8)), filter: blur((1 - kin) * 8 + p(t, 33.4, 33.8) * 12), transformOrigin: '1560px 800px', transform: `scale(${lerp(1, 3.2, zk)})` });
  const pk = eo(p(t, 29.75, 30.15));
  st($('cpp'), { opacity: pk, transform: `translateY(${(1 - pk) * 40}px) rotateX(30deg) rotateY(-9deg)` });
  titleUpdate('tC', t, 30.1);
  const ph = p(t, 29.95, 33.2);
  const step = ph * 32;
  $('cpPlay').style.left = (130 + step * 43) + 'px';
  const rowHit = new Array(16).fill(0);
  NOTES.forEach((n, i) => {
    const age = step - n.s;
    const k = eo(clamp(age / 1.0));
    const flash = age >= 0 ? Math.exp(-age * 1.6) : 0;
    if (age >= 0 && age < n.l) rowHit[n.row] = Math.max(rowHit[n.row], 1 - age / n.l);
    st($('cn' + i), { opacity: age > 0 ? 1 : 0, transform: `scaleX(${k})`, background: mixHex('#9B7BFF', '#f1ebff', flash * .8), boxShadow: `0 0 ${8 + flash * 22}px rgba(190,170,255,${.5 + flash * .5})` });
  });
  rowHit.forEach((h, i) => { $('kh' + i).style.opacity = h * .85; });
  const ww = ph * 1400;
  $('cpWave').style.width = Math.max(0, ww) + 'px';
  st($('cpWaveLine'), { left: (270 + ww) + 'px', opacity: ph > 0 && ph < 1 ? 1 : 0 });
  st($('cpDot'), { left: (265 + ww) + 'px', opacity: ph > 0 ? 1 : 0 });
}

// ---------- 08 Sound designer ----------
const PADS = [ // label index, x, y, w, h, wave kind, trigger
  [0, 180, 285, 390, 230, 'impact', 33.65], [1, 595, 285, 330, 105, 'swell', 33.85], [2, 595, 410, 330, 105, 'clicks', 34.25],
  [3, 950, 410, 240, 105, 'pop', 34.6], [4, 180, 540, 540, 235, 'glitch', 35.45], [5, 745, 540, 250, 235, 'snap', 35.9],
  [6, 1020, 540, 250, 235, 'chime', 36.45], [7, 1295, 540, 340, 235, 'sub', 36.85],
];
function wavePath(kind, w, h, r) {
  const mid = h / 2 + 12; let d = '';
  if (kind === 'impact') { for (let i = 0; i < 150; i++) { const x = 20 + i * (w - 50) / 150, a = Math.exp(-i / 38) * (h * .38) * (.4 + r() * .6); d += `M${x} ${mid - a}L${x} ${mid + a}`; } }
  if (kind === 'swell') { for (let i = 0; i < 90; i++) { const x = 20 + i * (w - 50) / 90, a = Math.exp(-Math.pow((i - 45) / 18, 2)) * (h * .3) * (.6 + r() * .4); d += `M${x} ${mid - a}L${x} ${mid + a}`; } }
  if (kind === 'clicks') { for (let i = 0; i < 8; i++) { const x = 30 + i * (w - 70) / 7; d += `M${x} ${mid - 14}L${x} ${mid + 14}M${x + 6} ${mid - 5}L${x + 14} ${mid}L${x + 6} ${mid + 5}`; } d += `M20 ${mid}L${w - 30} ${mid}`; }
  if (kind === 'pop') { d += `M20 ${mid}L60 ${mid}M60 ${mid - 18}L60 ${mid + 18}M64 ${mid - 9}L64 ${mid + 9}L${w - 30} ${mid}`; }
  if (kind === 'glitch') { for (let i = 0; i < 24; i++) { const x = 20 + i * (w - 60) / 24, a = (i > 8 && i < 13 ? .1 : .3 + r() * .7) * h * .38; d += `M${x} ${mid - a}h${(w - 60) / 24 - 3}v${a * 2}h${-((w - 60) / 24 - 3)}z`; } }
  if (kind === 'snap') { d += `M30 ${mid}L${w - 30} ${mid}M${w / 2} ${mid - h * .38}L${w / 2} ${mid + h * .38}M${w / 2 - 14} ${mid - 30}L${w / 2 + 14} ${mid - 30}`; }
  if (kind === 'chime') { for (let i = 0; i <= 120; i++) { const x = 20 + i * (w - 50) / 120, a = Math.exp(-i / 40) * h * .36 * Math.sin(i * .9); d += (i ? 'L' : 'M') + x + ' ' + (mid + a); } }
  if (kind === 'sub') {
    const N = 80, top = [], bot = [];
    for (let i = 0; i <= N; i++) { const x = 24 + i * (w - 60) / N, a = (.55 + .45 * Math.sin(i * .32)) * h * .3 * Math.sin(Math.PI * i / N) ** .4; top.push(`${x} ${mid - a}`); bot.unshift(`${x} ${mid + a}`); }
    d = `M${top.join('L')}L${bot.join('L')}Z`;
  }
  return d;
}
function buildSound() {
  const s = el(S, `<div id="sS" class="layer persp"></div>`);
  const pn = el(s, `<div id="sdp" class="layer p3d"></div>`);
  pn.style.transform = 'rotateY(-9deg) rotateX(5deg)';
  const r = rng(9);
  [[950, 285, 240, 105], [1215, 285, 420, 230]].forEach(([x, y, w, h], i) => el(pn, `<div id="emp${i}" class="pad" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`));
  PADS.forEach(([li, x, y, w, h, kind], i) => {
    el(pn, `<div id="slot${i}" class="pad" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:rgba(14,18,16,.5)"></div>`);
    const filled = kind === 'glitch' || kind === 'sub';
    el(pn, `<div id="pad${i}" class="pad" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="pl">${esc(T.sound.sfx_names[li] || '')}</div>
      <svg width="${w}" height="${h}"><g id="pw${i}"><path d="${wavePath(kind, w, h, r)}" fill="${filled ? '#C8F05A' : 'none'}" fill-opacity="${kind === 'sub' ? .85 : 1}" stroke="#C8F05A" stroke-width="${kind === 'impact' ? 2 : 2.4}" stroke-linecap="round" style="filter:drop-shadow(0 0 6px #C8F05A)"/></g></svg>
      <div id="pm${i}" class="meter"></div></div>`);
    let parts = '';
    for (let k = 0; k < 9; k++) parts += `<div id="pp${i}_${k}" class="abs" style="width:5px;height:5px;border-radius:50%;background:#e4ff9c;box-shadow:0 0 8px #C8F05A"></div>`;
    el(pn, `<div id="ppw${i}" class="abs" style="left:${x + w / 2}px;top:${y + h / 2}px">${parts}</div>`);
  });
  let strip = `<div class="abs" style="left:0;top:0;width:100%;height:100%;border-radius:10px;border:1.3px solid rgba(200,240,90,.3);background:rgba(14,18,16,.8)"></div>`;
  PADS.forEach((pd, i) => strip += `<div id="ss${i}" class="abs" style="left:${30 + i * 178}px;top:10px;width:${110 + r() * 60}px;height:44px;border-radius:8px;background:radial-gradient(ellipse,rgba(200,240,90,.85),rgba(200,240,90,.15) 60%,transparent 75%)"></div>`);
  for (let i = 0; i < 10; i++) strip += `<div class="abs" style="left:${980 + i * 12}px;top:12px;width:3px;height:40px;background:#e8ffc0"></div>`;
  el(pn, `<div id="sstrip" class="abs" style="left:180px;top:800px;width:1460px;height:64px">${strip}</div>`);
  titleBlock(s, 'tS', T.roles.sound.index, [T.roles.sound.title], 'right', C.sound, 230, 104);
}
const PART = (() => { const r = rng(21), a = []; for (let i = 0; i < 9; i++) a.push([(r() - .5) * 2, (r() - .5) * 2, .6 + r() * .6]); return a; })();
function updateSound(t) {
  const s = $('sS');
  if (!vis(s, t > 33.5 && t < 37.75)) return;
  const kin = eo(p(t, 33.55, 33.9)), out = ei(p(t, 37.25, 37.7));
  st(s, { opacity: kin * (1 - out), filter: blur((1 - kin) * 8 + out * 12), transformOrigin: '960px 560px', transform: `scale(${lerp(1.15, 1, kin) * (1 + .04 * p(t, 34, 37.2)) * lerp(1, .42, out)})` });
  titleUpdate('tS', t, 34.3);
  [0, 1].forEach(i => { $('emp' + i).style.opacity = .45 * eo(p(t, 33.7, 34.1)); });
  PADS.forEach((pd, i) => {
    const t0 = pd[6], [, x, y, w, h] = pd;
    const k = p(t, t0, t0 + .3), age = t - t0, hit = age >= 0 ? Math.exp(-age * 3) : 0;
    $('slot' + i).style.opacity = .5 * eo(p(t, 33.7, 34.1)) * (age >= 0 ? 0 : 1);
    const e = $('pad' + i);
    st(e, { opacity: age >= 0 ? clamp(k * 2.5) : 0, borderColor: `rgba(200,240,90,${.45 + hit * .55})`, boxShadow: `0 0 ${10 + hit * 46}px rgba(200,240,90,${.15 + hit * .55})`, background: `rgba(${Math.round(14 + hit * 34)},${Math.round(18 + hit * 46)},16,.86)`, transform: `scale(${lerp(1.12, 1, back(k, 1.6))})` });
    $('pw' + i).style.clipPath = `inset(0 ${100 - eo(p(t, t0 + .05, t0 + .4)) * 100}% 0 0)`;
    st($('pm' + i), { height: (8 + hit * 70 + (age >= 0 ? 10 : 0)) + 'px' });
    st($('ss' + i), { opacity: eo(p(t, t0, t0 + .25)) });
    const pOn = age >= 0 && age < .9;
    vis($('ppw' + i), pOn);
    if (pOn) PART.forEach(([dx, dy, sp], j) => st($(`pp${i}_${j}`), { left: (dx * w * (.35 + age * .5 * sp)) + 'px', top: (dy * h * .4 - age * 70 * sp) + 'px', opacity: 1 - age / .9 }));
  });
}

// ---------- 09 Editor ----------
const ED = { x0: 150, x1: 1640, pps: (1640 - 150) / 68.5 };
function buildEditor() {
  const s = el(S, `<div id="sE" class="layer persp"></div>`);
  titleBlock(s, 'tE', T.roles.editor.index, [T.roles.editor.title], 'left', C.edit, 230);
  el(s, `<div id="tc" class="abs mono" style="right:112px;top:240px;font-weight:500;font-size:60px;color:#eef3fb;white-space:nowrap;text-shadow:0 0 18px rgba(92,200,255,.4)"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#5CC8FF;box-shadow:0 0 12px #5CC8FF;vertical-align:12px;margin-right:22px"></span><span id="tct"></span></div>`);
  const pn = el(s, `<div id="edp" class="abs" style="left:110px;top:400px;width:1720px;height:450px;border-radius:18px;border:1.5px solid rgba(92,200,255,.4);background:rgba(10,18,32,.6);box-shadow:0 0 50px rgba(92,200,255,.12)"></div>`);
  pn.style.transform = 'rotateX(26deg)';
  let h = `<div class="abs" style="left:20px;top:14px;color:#5CC8FF;font-size:16px;letter-spacing:4px">● <span style="color:#3b4660">● ●</span></div>`;
  for (let i = 0; i <= 34; i++) h += `<div class="abs" style="left:${ED.x0 + i * (ED.x1 - ED.x0) / 34}px;top:46px;width:1px;height:${i % 5 ? 7 : 14}px;background:#6f7b96"></div>`;
  ['V3', 'V2', 'V1', 'A1', 'A2', 'A3'].forEach((n, i) => h += `<div class="trk" style="left:50px;top:${[70, 104, 162, 262, 322, 382][i]}px">${n}</div>`);
  h += `<div class="abs" style="left:${ED.x0 + 10}px;top:72px;width:${50 * ED.pps}px;height:20px;border-radius:10px;background:rgba(140,150,180,.22)"></div>`;
  const bounds = []; let acc = 0; SHOTS.forEach(d => { bounds.push(acc); acc += d; });
  for (let i = 3; i < 10; i++) h += `<div id="v2_${i}" class="abs" style="left:${ED.x0 + bounds[i] * ED.pps + 12}px;top:106px;width:${SHOTS[i] * ED.pps - 24}px;height:20px;border-radius:10px;background:${SHOT_COLORS[i]};opacity:.75"></div>`;
  h += `<div id="clips" class="abs" style="left:0;top:142px;width:100%;height:80px"></div>`;
  const r = rng(3);
  let a1 = '', a2 = '', a3 = '';
  for (let i = 0; i < 300; i++) { const x = i * 5, a = (6 + 18 * (i / 300) * (.4 + r() * .6)) * (i > 225 && i < 260 ? 1.6 : 1); a1 += `<rect x="${x}" y="${25 - a / 2}" width="3" height="${a}" fill="#9B7BFF" opacity=".8"/>`; }
  for (let i = 0; i < 120; i++) { const x = 140 + i * 9 + r() * 4; if (x > 1240) break; a2 += `<rect x="${x}" y="14" width="2" height="22" fill="#C8F05A"/>`; }
  [190, 330, 470, 1220, 1440].forEach(x => a2 += `<rect x="${x}" y="6" width="12" height="38" fill="#C8F05A"/>`);
  for (let i = 0; i < 300; i++) a3 += `<rect x="${i * 5}" y="${20 - r() * 4}" width="3" height="${2 + r() * 8}" fill="#9aa3b8" opacity=".5"/>`;
  h += `<div id="aTracks"><div class="abs" style="left:${ED.x0}px;top:252px;width:${ED.x1 - ED.x0 + 70}px;height:50px;border-radius:10px;background:rgba(155,123,255,.13);border:1px solid rgba(155,123,255,.3)"><svg width="1560" height="50">${a1}</svg><span class="abs mono" style="left:12px;top:12px;font-size:17px;color:#b9a7ff">${esc(T.editor.tracks[0])}</span></div>
    <div class="abs" style="left:${ED.x0 - 8}px;top:312px;width:${ED.x1 - ED.x0 + 80}px;height:50px;border-radius:10px;background:rgba(200,240,90,.12);border:1px solid rgba(200,240,90,.3)"><svg width="1560" height="50">${a2}<line x1="0" y1="25" x2="1560" y2="25" stroke="#C8F05A" stroke-opacity=".5"/></svg><span class="abs mono" style="left:12px;top:12px;font-size:17px;color:#dff5a0">${esc(T.editor.tracks[1])}</span></div>
    <div class="abs" style="left:${ED.x0 - 16}px;top:372px;width:${ED.x1 - ED.x0 + 90}px;height:44px;border-radius:10px;background:rgba(160,170,190,.08);border:1px solid rgba(160,170,190,.2)"><svg width="1560" height="44">${a3}</svg><span class="abs mono" style="left:12px;top:10px;font-size:17px;color:#9aa3b8">${esc(T.editor.tracks[2])}</span></div></div>`;
  h += `<div id="edPlay" class="abs" style="top:36px;width:2px;height:400px;background:#f4f8ff;box-shadow:0 0 10px #fff"><div class="abs" style="left:-8px;top:-4px;width:18px;height:14px;background:#5CC8FF;clip-path:polygon(0 0,100% 0,50% 100%)"></div></div>`;
  pn.innerHTML = h;
  const cl = pn.querySelector('#clips');
  SHOTS.forEach((d, i) => {
    const col = SHOT_COLORS[i], rb = col === 'rainbow';
    const bg = rb ? 'linear-gradient(90deg,#e0505a55,#FFB54755,#3FE0A555,#5CC8FF55,#9B7BFF55)' : `${col}38`;
    el(cl, `<div id="clip${i}" class="clip" style="left:${ED.x0 + bounds[i] * ED.pps + 2}px;width:${d * ED.pps - 4}px;background:${bg};border:1.5px solid ${rb ? '#FFD86B' : col};border-bottom:4px solid ${rb ? '#9B7BFF' : col};color:#eef1f8">
      ${String(i + 1).padStart(2, '0')} ${esc(T.editor.clips[i])}<br><span style="color:${rb ? '#FFD86B' : col}">${esc(T.editor.durations ? T.editor.durations[i] : d.toFixed(1) + 's')}</span></div>`);
  });
  // final cut line
  let ticks = '';
  acc = 0; SHOTS.forEach((d, i) => { const x = acc / 68.5 * 1000; ticks += `<div class="abs" style="left:${x}px;top:-12px;width:3px;height:26px;border-radius:2px;background:${SHOT_COLORS[i] === 'rainbow' ? '#FFD86B' : SHOT_COLORS[i]}"></div>`; acc += d; });
  ticks += `<div class="abs" style="left:1000px;top:-12px;width:3px;height:26px;background:#d6d1c6"></div>`;
  el(s, `<div id="fcut" class="abs" style="left:460px;top:600px;width:1000px;height:2px"><div class="abs" style="left:0;top:0;width:100%;height:2px;background:rgba(160,180,210,.35)"></div><div id="fcutFill" class="abs" style="left:0;top:-2px;height:6px;border-radius:3px;background:linear-gradient(90deg,#5CC8FF,#9B7BFF,#FFD86B);box-shadow:0 0 18px #5CC8FF"></div>${ticks}
    <div id="fcutLbl" class="abs mono" style="left:0;width:100%;top:-80px;text-align:center;font-size:22px;letter-spacing:.3em;color:#7fd6ff;white-space:nowrap">${esc(T.editor.final_cut)}</div></div>`);
}
const tcFmt = f => { f = Math.round(f); const fr = f % 30, sec = Math.floor(f / 30) % 60, mn = Math.floor(f / 1800); return `00:${String(mn).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(fr).padStart(2, '0')}`; };
function updateEditor(t) {
  const s = $('sE');
  if (!vis(s, t > 37.4 && t < 43.8)) return;
  const kin = eo(p(t, 37.45, 37.8)), ez = ei(p(t, 43.3, 43.75));
  st(s, { opacity: kin * (1 - ez), filter: blur((1 - kin) * 6 + ez * 10), transformOrigin: '960px 600px', transform: `scale(${1 + ez * .6})` });
  titleUpdate('tE', t, 38.15);
  const pn = $('edp');
  // starts zoomed into the "sound" clip and pulls back to the whole timeline
  let acc = 0; for (let i = 0; i < 7; i++) acc += SHOTS[i];
  const ox = ED.x0 + (acc + SHOTS[7] / 2) * ED.pps, oy = 181;
  const z = eio(p(t, 37.5, 39.1));
  const col = eio(p(t, 41.9, 42.35));
  st(pn, { transformOrigin: `${ox}px ${oy}px`, transform: `rotateX(${lerp(8, 22, z)}deg) scale(${lerp(3.4, 1, z) * lerp(1, 0.9, col)}) scaleY(${lerp(1, .03, col)})`, opacity: 1 - col });
  SHOTS.forEach((d, i) => { st($('clip' + i), { opacity: 1, transform: 'none' }); });
  $('clip7').style.boxShadow = `0 0 ${36 * (1 - p(t, 37.6, 38.8))}px rgba(200,240,90,${.9 * (1 - p(t, 37.6, 38.8))})`;
  for (let i = 3; i < 10; i++) $('v2_' + i).style.opacity = .75 * p(t, 38.0 + i * .04, 38.3 + i * .04);
  $('aTracks').style.opacity = eo(p(t, 38.0, 38.7));
  // playhead + timecode
  let f;
  if (t < 38.6) f = 0; else if (t < 39.4) f = eio(p(t, 38.6, 39.4)) * 1552; else f = lerp(1552, 2055, p(t, 39.4, 42.0));
  $('edPlay').style.left = (ED.x0 + (f / 30) * ED.pps) + 'px';
  $('edPlay').style.opacity = t > 38.5 ? 1 : 0;
  $('tct').textContent = tcFmt(f);
  const tk = eo(p(t, 38.55, 38.9));
  st($('tc'), { opacity: tk, filter: blur((1 - tk) * 8) });
  const fc = $('fcut');
  vis(fc, t > 42.0);
  const fk = eo(p(t, 42.05, 42.45));
  st(fc, { opacity: fk, transform: `scaleX(${lerp(1.6, 1, fk)})` });
  $('fcutFill').style.width = (eio(p(t, 42.45, 43.0)) * 100) + '%';
  st($('fcutLbl'), { opacity: eo(p(t, 42.25, 42.6)), transform: `translateY(${(1 - eo(p(t, 42.25, 42.6))) * 12}px)` });
}

// ---------- 10 Render ----------
const RG = { left: 330, top: 300, cw: 190, ch: 107, gap: 16 };
function buildRender() {
  const s = el(S, `<div id="sR" class="layer persp"></div>`);
  titleBlock(s, 'tR', T.roles.render.index, [T.roles.render.title], 'right', C.render, 230);
  const g = el(s, `<div id="rgrid" class="abs" style="left:${RG.left}px;top:${RG.top}px;width:${6 * (RG.cw + RG.gap) + 24}px;height:${3 * (RG.ch + RG.gap) + 24}px;border-radius:16px;border:1.5px solid rgba(255,216,107,.35);background:rgba(20,18,12,.55);box-shadow:0 0 50px rgba(255,216,107,.12)"></div>`);
  g.style.transform = 'rotateX(30deg)';
  for (let i = 0; i < 18; i++) {
    const n = THUMBS[Math.floor(i * THUMBS.length / 18)];
    el(g, `<div id="rc${i}" class="cell" style="left:${12 + (i % 6) * (RG.cw + RG.gap)}px;top:${12 + Math.floor(i / 6) * (RG.ch + RG.gap)}px"><img id="rci${i}" src="${thumbSrc(n)}"><div id="rcf${i}" class="fl"></div></div>`);
  }
  el(s, `<div class="abs mono" style="left:${RG.left + 10}px;top:770px;font-size:38px;color:#8d92a3;white-space:nowrap">${esc(T.render.frame_label)} <span id="rfn" style="color:#f4f1e8"></span> / ${T.render.frames_total}</div>`);
  el(s, `<div id="rpct" class="abs mono" style="right:${1920 - (RG.left + 1250)}px;top:770px;font-size:38px;color:#FFD86B;text-align:right"></div>`);
  el(s, `<div class="abs" style="left:${RG.left + 10}px;top:832px;width:1240px;height:5px;border-radius:3px;background:rgba(255,255,255,.08)"><div id="rbar" style="height:100%;border-radius:3px;background:linear-gradient(90deg,#e8a33c,#FFD86B);box-shadow:0 0 14px #FFD86B"></div></div>`);
  el(s, `<div class="abs mono" style="left:${RG.left + 10}px;top:856px;font-size:17px;color:#6f7484;letter-spacing:.06em">${esc(T.render.specs)}</div>`);
}
const RF = { t0: 43.6, t1: 47.6, pw: 2.2 };
function renderFrames(t) { return Math.round(1 + (T.render.frames_total - 1) * Math.pow(p(t, RF.t0, RF.t1), RF.pw)); }
function updateRender(t) {
  const s = $('sR');
  if (!vis(s, t > 43.4 && t < 49.5)) return;
  const kin = eo(p(t, 43.45, 43.85));
  st(s, { opacity: kin, filter: blur((1 - kin) * 8), transformOrigin: '960px 540px', transform: `scale(${lerp(1.25, 1, kin) * lerp(1, 1.04, p(t, 44, 49))})` });
  const gk = eo(p(t, 43.65, 44.05));
  st($('rgrid'), { opacity: gk, transform: `rotateX(30deg) scale(${lerp(.92, 1, gk)})` });
  titleUpdate('tR', t, 44.05);
  const fr = renderFrames(t), tot = T.render.frames_total;
  $('rfn').textContent = String(fr).padStart(4, '0');
  $('rpct').textContent = Math.floor(fr / tot * 100) + '%';
  $('rbar').style.width = (fr / tot * 100) + '%';
  for (let i = 0; i < 18; i++) {
    const tDone = RF.t0 + (RF.t1 - RF.t0) * Math.pow((i + 1) / 18, 1 / RF.pw);
    const done = t >= tDone;
    $('rci' + i).style.opacity = done ? 1 : 0;
    $('rcf' + i).style.opacity = done ? Math.max(0, 1 - (t - tDone) / .55) : 0;
    $('rc' + i).style.boxShadow = done && t - tDone < .5 ? '0 0 24px rgba(255,236,190,.8)' : 'none';
  }
}

// =====================================================================
// ACT 3: climax / resolve (cream)
// =====================================================================
const CLIMAX = () => [
  { n: 'hook', t: 49.55, label: '', col: C.orange },
  { n: 'oldway', t: 50.1, label: T.climax.tag_oldway, col: '#e0505a' },
  { n: 'turn', t: 50.65, label: T.climax.tag_message, col: C.orange },
  { n: 'writer', t: 51.15, label: T.climax.tag_roles[0], col: C.writer },
  { n: 'art', t: 51.6, label: T.climax.tag_roles[1], col: C.art },
  { n: 'animator', t: 52.05, label: T.climax.tag_roles[2], col: C.anim },
  { n: 'composer', t: 52.5, label: T.climax.tag_roles[3], col: C.comp },
  { n: 'sound', t: 52.95, label: T.climax.tag_roles[4], col: C.sound },
];
const CREDITS = [ // role key, dot x, dot y, line end x, y, appear
  ['writer', 360, 330, 450, 470, 55.3], ['art', 430, 790, 520, 625, 55.75], ['animator', 690, 265, 760, 470, 56.2],
  ['composer', 900, 840, 940, 625, 56.65], ['sound', 1010, 300, 1050, 470, 57.1], ['editor', 1360, 790, 1320, 625, 57.55], ['render', 1440, 300, 1440, 470, 58.0],
];
function buildClimax() {
  const s = el(S, `<div id="sX" class="layer persp"></div>`);
  for (let i = 0; i < 10; i++) el(s, `<div id="oc${i}" class="ocard"><img src="${thumbSrc(THUMBS[i % 9])}"></div>`);
  el(s, `<div id="xglow" class="abs" style="left:460px;top:330px;width:1000px;height:420px;border-radius:50%;background:radial-gradient(ellipse,rgba(255,226,150,.55),transparent 70%)"></div>`);
  el(s, `<div id="xtitle" class="abs" style="left:0;width:1920px;top:445px;text-align:center;font:300 160px/1 Fraunces,serif;color:#16161d;letter-spacing:-.012em;white-space:nowrap">${esc(T.climax.title)}</div>`);
  CLIMAX().forEach((c, i) => {
    el(s, `<div id="bc${i}" class="bigcard"><img src="${thumbSrc(c.n)}"></div>`);
    el(s, `<div id="bct${i}" class="ctag" style="color:${c.col}">${c.label ? `<i style="background:${c.col}"></i>${esc(c.label)}` : ''}</div>`);
  });
  let rings = ''; ROLE_COLORS.forEach((c, i) => rings += `<circle id="ring${i}" cx="960" cy="540" fill="none" stroke="${c}" stroke-width="7"/>`);
  el(s, `<svg id="rings" class="layer" width="1920" height="1080">${rings}</svg>`);
  let lines = '';
  CREDITS.forEach(([k, x, y, lx, ly], i) => lines += `<line id="crl${i}" x1="${x}" y1="${y}" x2="${lx}" y2="${ly}" stroke="rgba(50,50,60,.38)" stroke-width="1.3"/>`);
  el(s, `<svg id="crLines" class="layer" width="1920" height="1080">${lines}</svg>`);
  CREDITS.forEach(([k, x, y], i) => el(s, `<div id="cr${i}" class="credit" style="left:${x - 6}px;top:${y - 24}px"><i style="background:${ROLE_COLORS[i]};box-shadow:0 0 8px ${ROLE_COLORS[i]}"></i>${esc(T.roles[k].title)}</div>`));
}
function updateClimax(t) {
  const s = $('sX');
  if (!vis(s, t > 49.4 && t < 60.2)) return;
  const fadeAll = eio(p(t, 58.7, 59.7));
  st(s, { opacity: 1 - fadeAll, filter: blur(fadeAll * 12) });
  const list = CLIMAX();
  list.forEach((c, i) => {
    const a = c.t, nxt = i + 1 < list.length ? list[i + 1].t : 53.35;
    const e = $('bc' + i), tg = $('bct' + i);
    const on = t > a - .05 && t < nxt + .4;
    vis(e, on); vis(tg, on);
    if (!on) return;
    const kin = eo(p(t, a, a + .2)), kout = ei(p(t, nxt, nxt + .28));
    const last = i === list.length - 1;
    let x = lerp(900, 0, kin) - (last ? 0 : kout * 980), sc = 1, b = (1 - kin) * 22 + (last ? 0 : kout * 18), op = clamp(kin * 1.5) * (last ? 1 : 1 - kout * .8);
    if (last) { const sk = eio(p(t, 53.3, 53.55)); sc = lerp(1, .32, sk); op *= 1 - p(t, 53.45, 53.6); }
    if (i === 0) { op = eo(p(t, 49.5, 49.9)) * (1 - kout); x = -kout * 980; b = (1 - op) * 10 + kout * 18; }
    const cx = 960 - 575 + x, cy = 520 - 323;
    st(e, { left: cx + 'px', top: cy + 'px', opacity: op, filter: blur(b), transform: `rotateY(-9deg) rotateX(4deg) rotateZ(-1.5deg) scale(${sc * lerp(1.06, 1, kin)})`, zIndex: 10 + i });
    st(tg, { left: (cx + 18) + 'px', top: (cy + 670) + 'px', opacity: op * eo(p(t, a + .1, a + .3)), transform: `scale(${sc})`, zIndex: 10 + i });
  });
  // rings collapse
  const rk = p(t, 52.95, 53.4);
  const rg = $('rings');
  vis(rg, t > 52.95 && t < 53.5);
  ROLE_COLORS.forEach((c, i) => { const rr = Math.max(1, lerp(1150 - i * 40, 40 + i * 14, eio(rk))); const ri = $('ring' + i); ri.setAttribute('r', rr); ri.setAttribute('opacity', (1 - p(t, 53.38, 53.5)) * .95); });
  // orbit cards + title
  const ok = eo(p(t, 53.4, 54.0));
  for (let i = 0; i < 10; i++) {
    const ang = i / 10 * Math.PI * 2 + (t - 53.4) * .03 - Math.PI / 2 + .3;
    const x = 960 + Math.cos(ang) * 960 * lerp(.2, 1, ok), y = 540 + Math.sin(ang) * 485 * lerp(.2, 1, ok);
    const e = $('oc' + i);
    vis(e, t > 53.35);
    st(e, { left: (x - 150) + 'px', top: (y - 85) + 'px', opacity: ok * .92, filter: blur(2.6 + (1 - ok) * 8), transform: `rotate(${(i % 3 - 1) * 4}deg) scale(${lerp(.4, 1, ok)})` });
  }
  const tk = eo(p(t, 53.5, 54.2));
  vis($('xtitle'), t > 53.45); vis($('xglow'), t > 53.45);
  st($('xtitle'), { opacity: tk, filter: blur((1 - tk) * 14), transform: `scale(${lerp(1.08, 1, tk)})`, letterSpacing: lerp(.04, -.012, tk) + 'em' });
  $('xglow').style.opacity = tk;
  CREDITS.forEach(([k, x, y, lx, ly, a], i) => {
    const kl = eio(p(t, a, a + .4)), kt = eo(p(t, a + .1, a + .45));
    const l = $('crl' + i);
    l.setAttribute('x2', lerp(x, lx, kl)); l.setAttribute('y2', lerp(y, ly, kl)); l.setAttribute('opacity', kl > 0 ? 1 : 0);
    st($('cr' + i), { opacity: kt, transform: `translateY(${(1 - kt) * 10}px)` });
  });
}

function buildResolve() {
  const s = el(S, `<div id="sZ" class="layer persp"></div>`);
  const R = T.resolve;
  const chat = el(s, `<div id="chat"></div>`);
  chat.innerHTML = `<div class="abs mono" style="left:0;width:100%;top:44px;text-align:center;font-size:18px;color:#8a8579;letter-spacing:.12em">${esc(T.hud.clock_end)}</div>
    <div class="bub" style="top:92px">${esc(R.bubble_1)}</div><div class="bub" style="top:166px">${esc(R.bubble_2)}</div>
    <div class="abs serif" style="left:52px;top:244px;font-weight:300;font-size:38px;color:#2b2925;white-space:nowrap"><span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:#E07A55;vertical-align:8px;margin-right:18px"></span>${esc(R.reply)}</div>
    <div id="chips" class="abs" style="left:52px;top:322px;width:900px"></div>`;
  R.files.forEach((f, i) => el(chat.querySelector('#chips'), `<span id="chip${i}" class="chip"><i style="background:${ROLE_COLORS[i]}"></i>${esc(f)}</span>`));
  el(s, `<div id="box2" class="abs" style="left:375px;top:800px;width:1170px;height:112px;border-radius:22px;background:#f8f2e6;box-shadow:0 12px 34px rgba(80,60,30,.12);border:1px solid rgba(0,0,0,.04)"><div id="box2c" class="abs" style="left:40px;top:30px;font:400 40px Plex;color:#2b2925"></div><div class="send" style="right:24px;top:22px;width:68px;height:68px">${ARROW('#2a140c')}</div></div>`);
  const words = (line, id, top) => `<div id="${id}" class="abs serif" style="left:164px;top:${top}px;font-weight:400;font-size:118px;line-height:1;color:#141319;white-space:nowrap;transform-origin:0 0">${line.split(' ').map((w, j) => `<span id="${id}w${j}" style="display:inline-block">${esc(w)}</span>`).join(' ')}</div>`;
  el(s, words(R.tagline[0], 'tag1', 330));
  el(s, words(R.tagline[1], 'tag2', 453));
  el(s, `<div id="ztitle" class="abs" style="left:158px;top:438px;font:300 128px/1 Fraunces,serif;color:#15151c;white-space:nowrap;letter-spacing:-.012em">${esc(R.title)}</div>`);
  el(s, `<div id="zsig" class="abs mono" style="left:166px;top:604px;font-size:18px;letter-spacing:.2em;color:#3a3833;white-space:nowrap">${esc(R.signature)}</div>`);
}
function updateResolve(t) {
  const s = $('sZ');
  if (!vis(s, t > 59.4)) return;
  const ci = eo(p(t, 59.45, 59.95)), rise = eo(p(t, 59.55, 60.9));
  const cb = eio(p(t, 61.45, 62.0));
  st($('chat'), { opacity: ci * (1 - cb * .55), filter: blur((1 - ci) * 10 + cb * 7), transform: `translateY(${lerp(270, 0, rise)}px) rotateX(7deg) rotateY(-4deg) rotateZ(1deg)` });
  T.resolve.files.forEach((f, i) => { const k = p(t, 60.15 + i * .1, 60.45 + i * .1); st($('chip' + i), { opacity: k, transform: `scale(${lerp(.8, 1, back(k, 2))})`, display: 'inline-block' }); });
  st($('box2'), { opacity: eo(p(t, 59.5, 60.2)), transform: `translateY(${(1 - eo(p(t, 59.5, 60.2))) * 20}px)` });
  $('box2c').innerHTML = caret(blink(t));
  const sh = eio(p(t, 64.6, 65.4));
  [['tag1', 61.55, 330, 215, 0], ['tag2', 62.35, 453, 263, 1]].forEach(([id, a, y0, y1, li]) => {
    st($(id), { top: lerp(y0, y1, sh) + 'px', transform: `scale(${lerp(1, .39, sh)})` });
    T.resolve.tagline[li].split(' ').forEach((w, j) => {
      const k = eo(p(t, a + j * .1, a + j * .1 + .32));
      st($(`${id}w${j}`), { opacity: k, filter: blur((1 - k) * 10), transform: `translateY(${(1 - k) * 14}px)` });
    });
  });
  const tk = eo(p(t, 65.4, 66.1));
  st($('ztitle'), { opacity: tk, filter: blur((1 - tk) * 12), transform: `translateY(${(1 - tk) * 20}px)` });
  const gk = eo(p(t, 65.9, 66.5));
  st($('zsig'), { opacity: gk, transform: `translateY(${(1 - gk) * 10}px)` });
}

// =====================================================================
function render(t) {
  const dark = t < 49.6;
  $('bgDark').style.display = dark ? '' : 'none';
  vis($('glow'), dark);
  vis($('stars'), dark);
  vis($('cream'), t > 48.8);
  updateGlow(t);
  updateAct1(t);
  updateWriter(t);
  updateArt(t);
  updateAnimator(t);
  updateComposer(t);
  updateSound(t);
  updateEditor(t);
  updateRender(t);
  // flare
  const fl = $('flare');
  const fk = eo(p(t, 47.95, 48.9));
  vis(fl, t > 47.9 && t < 49.7);
  st(fl, { transform: `translate(-50%,-50%) scale(${.05 + fk * 1.6})`, opacity: Math.min(1, fk * 3) });
  st(fl, { opacity: Math.min(1, fk * 3) * (1 - p(t, 49.2, 49.7)) });
  updateClimax(t);
  updateResolve(t);
  // red alarm vignette (old way)
  const rv = clamp(p(t, 10.5, 11.0) * (t < 11.2 ? (Math.floor(t * 20) % 2 ? .7 : 1) : 1)) * (1 - p(t, 12.0, 12.6)) + p(t, 9.4, 9.5) * (1 - p(t, 9.5, 10)) * .4;
  st($('redv'), { opacity: rv * .8, display: rv > 0.01 ? '' : 'none' });
  $('vign').style.opacity = dark ? 1 : .35;
  // flash into act 3
  const fi = eio(p(t, 48.55, 49.25)), fo = eo(p(t, 49.55, 50.15));
  st($('flash'), { opacity: fi * (1 - fo), display: fi * (1 - fo) > 0 ? '' : 'none' });
  updateHud(t);
  const r = rng(Math.floor(t * FPS) + 1);
  $('grain').style.backgroundPosition = `${Math.floor(r() * 300)}px ${Math.floor(r() * 300)}px`;
  $('grain').style.opacity = dark ? .08 : .05;
}

window.FILM = { render, DURATION, FPS, THUMB_TIMES };
build();
window.FILM.ready = (async () => {
  await document.fonts.ready;
  await Promise.all(['300 40px Fraunces', '400 40px Fraunces', 'italic 300 40px Fraunces', 'italic 400 40px Fraunces', '400 40px Plex', '500 40px Plex', '600 40px Plex', '400 40px Courier', '700 40px Courier'].map(f => document.fonts.load(f)));
  await Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
  document.querySelectorAll('#stage *').forEach(e => { if (getComputedStyle(e).fontFamily.includes('Fraunces')) e.style.fontVariationSettings = '"opsz" 144, "SOFT" 0, "WONK" 0'; });
  measureZO();
  render(0);
  return true;
})();
