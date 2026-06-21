// =========================================================================
// Zahtjev za vezu — dossier.
// NASLOVNICA: ogrebi -> pitanje + popis dijelova
// NACRT 001 (zupčanici): posloži zupčanike na osovine da se uhvate
// NACRT 002 (skica): povuci točke na kote i nacrtaj traktor
// NACRT 003 (srce): spoji dvije polovice srca (zadnji, romantični)
// POTVRDA: sklop dovršen
// =========================================================================

const SVGNS = "http://www.w3.org/2000/svg";
const LABELS = { 1: "NASLOVNICA", 2: "NACRT 001", 3: "NACRT 002", 4: "NACRT 003", 5: "POTVRDA" };

// --- mate (srce) ---
const MATE_HINT = 'Povuci „TI" na „JA" i spoji srce 🔧';
const MATE_NEAR = "Skoro… još malo poravnanja 📏";
const MATE_ERRORS = ["Izvan tolerancije. Ponovi mjerenje. 📐", "Spoj nije uspio — fali poravnanje.", "Spojit ćemo se samo savršeno — probaj opet."];
const VIEW = 240, START_X = 74, START_Y = 30, SNAP_TOL = 26, NEAR = 64;
// --- zupčanici ---
const GEARS_VIEW = 320, GEAR_SNAP = 24;
const GEAR_ERR = "Zupčanik je promašio osovinu — primakni ga. ⚙️";
// --- skica traktor ---
const SK_VIEW_W = 300, SK_VIEW_H = 200, SK_TOL = 22;
const SKETCH_ERR = "Točka nije na koti — primakni je bliže.";
const FIX = { rb: [62, 150], rt: [62, 118], fb: [232, 150] }; // fiksne točke karoserije

// --- Elementi ----------------------------------------------------------------
const replay = document.getElementById("replay");
const tbStatus = document.getElementById("tbStatus");
const tbNacrt = document.getElementById("tbNacrt");
const nacrtTag = document.getElementById("nacrtTag");
const next1 = document.getElementById("next1");
const pages = [1, 2, 3, 4, 5].map((n) => document.getElementById("page" + n));
const gearsSvg = document.getElementById("gears");
const statusGears = document.getElementById("statusGears");
const sketchSvg = document.getElementById("sketch");
const sketchPoly = document.getElementById("sketchPoly");
const sketchCount = document.getElementById("sketchCount");
const statusSketch = document.getElementById("statusSketch");
const tractorFixed = document.getElementById("tractorFixed");
const part = document.getElementById("part");
const assembly = document.getElementById("assembly");
const mateStamp = document.getElementById("mateStamp");
const statusMate = document.getElementById("statusMate");

// --- Stanje ------------------------------------------------------------------
let currentPage = 1, rafId = 0;
let snapped = false, tx = START_X, ty = START_Y, dragging = false;
let mPX = 0, mPY = 0, mTX = 0, mTY = 0, mScale = 1, mErr = 0;
let gears = [], gDrag = null, gSeated = 0;
let skPts = [], skDrag = null, skLocked = 0;

function setStatus(el, msg, kind) {
  el.firstChild ? (el.childNodes[0].nodeValue = msg + " ") : (el.textContent = msg);
  el.className = "status flash" + (kind ? " " + kind : "");
  void el.offsetWidth;
  el.classList.add("flash");
}
function showPage(n) {
  currentPage = n;
  pages.forEach((p, i) => p.classList.toggle("active", i === n - 1));
  nacrtTag.textContent = LABELS[n];
  tbNacrt.textContent = n + "/5";
}
function buzz() { if (navigator.vibrate) { try { navigator.vibrate(16); } catch (_) {} } }

// --- Scratch (samo NASLOVNICA) ----------------------------------------------
function makeScratch(canvas, hint, stamp, onReveal) {
  let ctx = null, scratching = false, revealed = false, lastX = 0, lastY = 0, lastSample = 0;
  function draw() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) { if (!revealed) requestAnimationFrame(draw); return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#2c8a6f"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(6,36,29,0.22)"; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = -h; x < w; x += 12) { ctx.moveTo(x, 0); ctx.lineTo(x + h, h); } ctx.stroke();
    ctx.strokeStyle = "rgba(6,36,29,0.6)"; ctx.lineWidth = 2; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-0.14);
    const fs = Math.max(18, Math.min(w * 0.07, 38));
    ctx.font = "600 " + fs + "px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#06241d"; ctx.lineWidth = 3; ctx.strokeStyle = "#06241d";
    const tw = ctx.measureText(stamp).width;
    ctx.strokeRect(-tw / 2 - 16, -fs / 2 - 12, tw + 32, fs + 24); ctx.fillText(stamp, 0, 0); ctx.restore();
  }
  function pos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function scratchTo(x, y) {
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 48; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.fill(); lastX = x; lastY = y;
  }
  function progress() {
    if (!ctx || !canvas.width) return 0;
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0; for (let i = 3; i < d.length; i += 32) if (d[i] === 0) clear++;
    return clear / (d.length / 32);
  }
  function reveal() { if (revealed) return; revealed = true; canvas.classList.add("done"); if (hint) hint.classList.add("gone"); onReveal(); }
  canvas.addEventListener("pointerdown", (e) => {
    if (revealed) return; scratching = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    const p = pos(e); lastX = p.x; lastY = p.y; if (hint) hint.classList.add("gone"); scratchTo(p.x, p.y); e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!scratching || revealed) return; const p = pos(e); scratchTo(p.x, p.y);
    const now = performance.now(); if (now - lastSample > 110) { lastSample = now; if (progress() >= 0.5) reveal(); } e.preventDefault();
  });
  function end() { if (!scratching) return; scratching = false; if (!revealed && progress() >= 0.5) reveal(); }
  window.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
  return { draw, isRevealed: () => revealed, reset(redraw) { revealed = false; scratching = false; canvas.classList.remove("done"); if (hint) hint.classList.remove("gone"); if (redraw) draw(); } };
}
const s1 = makeScratch(document.getElementById("scratch"), document.getElementById("hint"), "POVJERLJIVO", () => next1.classList.add("show"));

// --- NACRT 001: zupčanici ----------------------------------------------------
function cog(cx, cy, ro, ri, teeth) {
  const steps = teeth * 4; let p = "";
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const r = (i % 4 === 0 || i % 4 === 1) ? ro : ri;
    p += (i ? "L" : "M") + (cx + Math.cos(a) * r).toFixed(1) + " " + (cy + Math.sin(a) * r).toFixed(1) + " ";
  }
  return p + "Z";
}
function el(tag, attrs) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
function initGears() {
  const cfg = [
    { hx: 102, hy: 100, sx: 50, sy: 42, dir: 1 },
    { hx: 160, hy: 100, sx: 160, sy: 168, dir: -1 },
    { hx: 218, hy: 100, sx: 270, sy: 42, dir: 1 },
  ];
  const ro = 30, ri = 23;
  gears = cfg.map((c) => {
    gearsSvg.appendChild(el("circle", { class: "gear-ghost", cx: c.hx, cy: c.hy, r: ro }));
    const g = el("g", { class: "gear" });
    const spin = el("g", { class: "gear-spin", transform: "rotate(0 " + c.hx + " " + c.hy + ")" });
    spin.appendChild(el("path", { class: "cog", d: cog(c.hx, c.hy, ro, ri, 10) }));
    spin.appendChild(el("circle", { class: "hub", cx: c.hx, cy: c.hy, r: 8 }));
    g.appendChild(spin);
    const dx = c.sx - c.hx, dy = c.sy - c.hy;
    g.setAttribute("transform", "translate(" + dx + "," + dy + ")");
    gearsSvg.appendChild(g);
    return { g, spin, hx: c.hx, hy: c.hy, sx: c.sx, sy: c.sy, dir: c.dir, dx, dy, seated: false };
  });
}
function setGear(o) { o.g.setAttribute("transform", "translate(" + o.dx + "," + o.dy + ")"); }
gearsSvg.addEventListener("pointerdown", (e) => {
  if (currentPage !== 2) return;
  const node = e.target.closest(".gear"); if (!node) return;
  const o = gears.find((q) => q.g === node); if (!o || o.seated) return;
  gDrag = { o, px: e.clientX, py: e.clientY, dx: o.dx, dy: o.dy, sc: gearsSvg.getBoundingClientRect().width / GEARS_VIEW };
  node.classList.add("grabbing");
  try { node.setPointerCapture(e.pointerId); } catch (_) {}
  e.preventDefault();
});
gearsSvg.addEventListener("pointermove", (e) => {
  if (!gDrag) return;
  const { o, px, py, dx, dy, sc } = gDrag;
  o.dx = dx + (e.clientX - px) / sc; o.dy = dy + (e.clientY - py) / sc; setGear(o); e.preventDefault();
});
function endGear() {
  if (!gDrag) return; const o = gDrag.o; gDrag = null; o.g.classList.remove("grabbing");
  if (Math.hypot(o.dx, o.dy) <= GEAR_SNAP) {
    o.dx = 0; o.dy = 0; setGear(o); o.seated = true; o.g.classList.add("seated"); buzz(); gSeated++;
    if (gSeated >= gears.length) { setStatus(statusGears, "PRIJENOS RADI ✓ — zupčanici se vrte!", "ok"); spinGears(); }
    else setStatus(statusGears, "Zupčanik na osovini ✓ (" + gSeated + "/3)", "ok");
  } else setStatus(statusGears, GEAR_ERR, "warn");
}
gearsSvg.addEventListener("pointerup", endGear);
gearsSvg.addEventListener("pointercancel", endGear);
function spinGears() {
  const t0 = performance.now(), dur = 1500;
  (function s(now) {
    const k = (now - t0) / dur, ang = k * 360;
    gears.forEach((o) => o.spin.setAttribute("transform", "rotate(" + (ang * o.dir).toFixed(1) + " " + o.hx + " " + o.hy + ")"));
    if (now - t0 < dur) rafId = requestAnimationFrame(s); else showPage(3);
  })(t0);
}

// --- NACRT 002: skica traktora ----------------------------------------------
function initSketch() {
  skPts = [...document.querySelectorAll(".spt")].map((e) => ({
    el: e, tx: +e.dataset.tx, ty: +e.dataset.ty, sx: +e.getAttribute("cx"), sy: +e.getAttribute("cy"),
    x: +e.getAttribute("cx"), y: +e.getAttribute("cy"), locked: false,
  }));
  updatePoly();
}
function updatePoly() {
  const p = skPts;
  const pts = [FIX.rb, FIX.rt, [p[0].x, p[0].y], [p[1].x, p[1].y], [p[2].x, p[2].y], [p[3].x, p[3].y], FIX.fb];
  sketchPoly.setAttribute("points", pts.map((a) => a[0] + "," + a[1]).join(" "));
}
sketchSvg.addEventListener("pointerdown", (e) => {
  if (currentPage !== 3) return;
  const node = e.target.closest(".spt"); if (!node) return;
  const p = skPts.find((q) => q.el === node); if (!p || p.locked) return;
  skDrag = p; node.classList.add("grabbing");
  try { node.setPointerCapture(e.pointerId); } catch (_) {}
  e.preventDefault();
});
sketchSvg.addEventListener("pointermove", (e) => {
  if (!skDrag) return;
  const r = sketchSvg.getBoundingClientRect();
  skDrag.x = Math.max(8, Math.min(SK_VIEW_W - 8, (e.clientX - r.left) * (SK_VIEW_W / r.width)));
  skDrag.y = Math.max(8, Math.min(SK_VIEW_H - 8, (e.clientY - r.top) * (SK_VIEW_H / r.height)));
  skDrag.el.setAttribute("cx", skDrag.x); skDrag.el.setAttribute("cy", skDrag.y);
  updatePoly(); e.preventDefault();
});
function endSketch() {
  if (!skDrag) return; const p = skDrag; skDrag = null; p.el.classList.remove("grabbing");
  if (Math.hypot(p.x - p.tx, p.y - p.ty) <= SK_TOL) {
    p.x = p.tx; p.y = p.ty; p.el.setAttribute("cx", p.x); p.el.setAttribute("cy", p.y);
    p.locked = true; p.el.classList.add("locked"); updatePoly(); buzz(); skLocked++;
    sketchCount.textContent = "(" + skLocked + "/4)";
    if (skLocked >= skPts.length) {
      sketchPoly.classList.add("defined"); tractorFixed.classList.add("defined");
      setStatus(statusSketch, "POTPUNO ODREĐENA ✓ — traktor spreman 🚜", "ok");
      sketchCount.textContent = "(4/4)";
      setTimeout(() => showPage(4), 900);
    } else setStatus(statusSketch, "Relacija zaključana ✓", "ok");
  } else setStatus(statusSketch, SKETCH_ERR, "warn");
}
sketchSvg.addEventListener("pointerup", endSketch);
sketchSvg.addEventListener("pointercancel", endSketch);

// --- NACRT 003: spoji srce (zadnji) -----------------------------------------
function setPart(x, y) { tx = x; ty = y; part.setAttribute("transform", "translate(" + x + "," + y + ")"); }
function mdist() { return Math.hypot(tx, ty); }
part.addEventListener("pointerdown", (e) => {
  if (currentPage !== 4 || snapped) return;
  dragging = true; cancelAnimationFrame(rafId); part.classList.add("grabbing");
  try { part.setPointerCapture(e.pointerId); } catch (_) {}
  mScale = assembly.getBoundingClientRect().width / VIEW;
  mPX = e.clientX; mPY = e.clientY; mTX = tx; mTY = ty; e.preventDefault();
});
part.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  setPart(Math.max(-50, Math.min(170, mTX + (e.clientX - mPX) / mScale)), Math.max(-70, Math.min(130, mTY + (e.clientY - mPY) / mScale)));
  if (mdist() < NEAR) setStatus(statusMate, MATE_NEAR, "ok"); e.preventDefault();
});
function endMate() {
  if (!dragging) return; dragging = false; part.classList.remove("grabbing");
  if (mdist() <= SNAP_TOL) animateTo(0, 0, onMate);
  else { setStatus(statusMate, MATE_ERRORS[mErr % MATE_ERRORS.length], "warn"); mErr++; animateTo(START_X, START_Y, null); }
}
part.addEventListener("pointerup", endMate);
part.addEventListener("pointercancel", endMate);
function animateTo(gx, gy, done) {
  cancelAnimationFrame(rafId);
  const sx = tx, sy = ty, dur = 260, t0 = performance.now();
  (function s(now) { const k = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3); setPart(sx + (gx - sx) * e, sy + (gy - sy) * e); if (k < 1) rafId = requestAnimationFrame(s); else if (done) done(); })(t0);
}
function onMate() {
  snapped = true; part.classList.add("snapped"); mateStamp.classList.add("show");
  setStatus(statusMate, "SPOJENO ✓ — srce na okupu!", "ok"); buzz();
  setTimeout(toFinale, 800);
}

// --- POTVRDA -----------------------------------------------------------------
function toFinale() { showPage(5); tbStatus.textContent = "ODOBRENO"; tbStatus.classList.add("approved"); fireConfetti(); }
function fireConfetti() {
  if (typeof confetti !== "function") return;
  const c = ["#46e6a0", "#dff7ec", "#2c8a6f"];
  confetti({ particleCount: 90, spread: 75, angle: 60, origin: { x: 0, y: 0.7 }, colors: c });
  confetti({ particleCount: 90, spread: 75, angle: 120, origin: { x: 1, y: 0.7 }, colors: c });
  let shapes;
  if (typeof confetti.shapeFromText === "function") shapes = [confetti.shapeFromText({ text: "💚", scalar: 2.2 }), confetti.shapeFromText({ text: "⚙️", scalar: 2 }), confetti.shapeFromText({ text: "🚜", scalar: 2 })];
  const end = Date.now() + 1700;
  (function frame() {
    confetti({ particleCount: 4, startVelocity: 24, spread: 360, ticks: 100, origin: { x: Math.random(), y: -0.1 }, scalar: 1.6, colors: c, shapes: shapes || undefined });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// --- Reset -------------------------------------------------------------------
function reset() {
  cancelAnimationFrame(rafId);
  // gears
  gDrag = null; gSeated = 0;
  gears.forEach((o) => { o.dx = o.sx - o.hx; o.dy = o.sy - o.hy; o.seated = false; o.g.classList.remove("seated", "grabbing"); o.spin.setAttribute("transform", "rotate(0 " + o.hx + " " + o.hy + ")"); setGear(o); });
  statusGears.className = "status"; statusGears.textContent = "Posloži zupčanike na osovine da se uhvate ⚙️";
  // sketch
  skDrag = null; skLocked = 0;
  skPts.forEach((p) => { p.x = p.sx; p.y = p.sy; p.locked = false; p.el.setAttribute("cx", p.sx); p.el.setAttribute("cy", p.sy); p.el.classList.remove("locked", "grabbing"); });
  sketchPoly.classList.remove("defined"); tractorFixed.classList.remove("defined"); updatePoly();
  statusSketch.className = "status"; statusSketch.childNodes[0].nodeValue = "Povuci točke na kote i nacrtaj traktor 🚜 ";
  sketchCount.textContent = "(0/4)";
  // heart
  snapped = false; dragging = false; mErr = 0; setPart(START_X, START_Y);
  part.classList.remove("snapped", "grabbing"); mateStamp.classList.remove("show");
  statusMate.className = "status"; statusMate.textContent = MATE_HINT;
  // sheets
  next1.classList.remove("show"); tbStatus.textContent = "U TIJEKU"; tbStatus.classList.remove("approved");
  showPage(1); s1.reset(true);
}
replay.addEventListener("click", reset);
next1.addEventListener("click", () => showPage(2));

// --- Init --------------------------------------------------------------------
initGears();
initSketch();
let resizeT = null;
window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (currentPage === 1 && !s1.isRevealed()) s1.draw(); }, 150); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => s1.draw());
requestAnimationFrame(() => s1.draw());
