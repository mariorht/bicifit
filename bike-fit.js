/* ===== CONSTANTES ===== */
const RC        = 410;   // chainstay
const HT_LEN    = 90;    // head‑tube
const WHEEL_R   = 335;   // radio rueda
const SPACER_MM = 5;     // espaciador estándar
const s         = 0.3;   // px / mm (zoom)

/* ===== BINDINGS ===== */
const ids = [
  "stack","reach","seatTube","saddleHeight",
  "ca","ha","barHeight","barLength","stemLength"
];
const state = {};
ids.forEach(id=>{
  const el = document.getElementById(id);
  state[id] = +el.value;
  el.addEventListener("input",e=>{ state[id] = +e.target.value || 0; draw(); });
});

const canvas = document.getElementById("preview");
const ctx    = canvas.getContext("2d");
const out    = document.getElementById("calc");

/* helpers */
const rad = d => d*Math.PI/180;
function line(a,b){ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
function dot(p){ ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill(); }
function label(t,p,dx=6,dy=-6){
  ctx.fillStyle="#000"; ctx.font="12px sans-serif";
  ctx.fillText(t,p.x+dx,p.y+dy);
  ctx.fillStyle="#1976d2";
}

/* ===== DIBUJO PRINCIPAL ===== */
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#1976d2";
  ctx.fillStyle   = "#1976d2";

  /* --- puntos base --- */
  const bb   = { x: canvas.width/2, y: canvas.height-120 };
  const ca   = rad(state.ca);
  const ha   = rad(state.ha);
  const rearAxle = { x: bb.x - RC*s, y: bb.y };

  const seatTop = {
    x: bb.x - state.seatTube*Math.cos(ca)*s,
    y: bb.y - state.seatTube*Math.sin(ca)*s
  };
  const saddle = {
    x: bb.x - state.saddleHeight*Math.cos(ca)*s,
    y: bb.y - state.saddleHeight*Math.sin(ca)*s
  };

  const headTop = { x: bb.x + state.reach*s, y: bb.y - state.stack*s };
  const headBot = {
    x: headTop.x + HT_LEN*Math.cos(ha)*s,
    y: headTop.y + HT_LEN*Math.sin(ha)*s
  };

  /* rueda delantera alineada */
  const forkLen_px = (bb.y - headBot.y) / Math.sin(ha);
  const frontAxle  = { x: headBot.x + forkLen_px*Math.cos(ha), y: bb.y };

  /* ---------- MANILLAR drop ---------- */
  const uHT = { x: Math.cos(ha), y: Math.sin(ha) };          // unitario eje dirección
  const spacerShift = state.barHeight;                       // mm espaciadores

  const clamp = {                                           // centro de la potencia
    x: headTop.x + state.stemLength*s - spacerShift*uHT.x*s,
    y: headTop.y                 - spacerShift*uHT.y*s
  };

  /* secciones: hood (40 mm), reach (user), drop (110 mm), tail (20 mm atrás) */
  const hood  = 40*s;
  const reach = state.barLength*s;          // avance adicional recto
  const drop  = 110*s;

  const hoodEnd  = { x: clamp.x + hood,        y: clamp.y };
  const curveEnd = { x: hoodEnd.x + reach,     y: hoodEnd.y + drop };
  const tailEnd  = { x: curveEnd.x - 20*s,     y: curveEnd.y };
  const spacerTop = {
    x: headTop.x - spacerShift * uHT.x * s,
    y: headTop.y - spacerShift * uHT.y * s
  };
  /* potencia */
  line(headTop, spacerTop);
  line(spacerTop, clamp);

  /* tramo hood */
  line(clamp, hoodEnd);

  /* curva (cuadrática) */
  ctx.beginPath();
  ctx.moveTo(hoodEnd.x, hoodEnd.y);
  ctx.quadraticCurveTo(
    hoodEnd.x + reach*0.5, hoodEnd.y + drop*0.5,
    curveEnd.x, curveEnd.y
  );
  ctx.stroke();

  /* cola */
  line(curveEnd, tailEnd);

  /* nodo & leyenda */
  dot(clamp);
  label("Handlebar",{x:clamp.x+8,y:clamp.y-8});

  /* ---------- CUADRO ---------- */
  line(rearAxle, bb);         // chainstay
  line(bb, headBot);          // down‑tube
  line(headBot, frontAxle);   // fork
  line(headBot, headTop);     // head‑tube
  line(headTop, seatTop);     // top‑tube
  line(seatTop, rearAxle);    // seat‑stay
  line(bb, seatTop);          // seat‑tube
  line(seatTop, saddle);      // tija
  line({x:saddle.x-15,y:saddle.y},{x:saddle.x+15,y:saddle.y}); // sillín
  [bb,rearAxle,frontAxle,seatTop,headTop,headBot,saddle].forEach(dot);

  /* ruedas guía */
  ctx.setLineDash([4,6]);
  ctx.beginPath(); ctx.arc(rearAxle.x,rearAxle.y,WHEEL_R*s,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(frontAxle.x,frontAxle.y,WHEEL_R*s,0,Math.PI*2); ctx.stroke();
  ctx.setLineDash([]);

  /* ----- cálculo potencia / espaciadores ----- */
  const dx_mm = (clamp.x - headTop.x) / s;
  const dy_mm = (headTop.y - clamp.y) / s;      // positivo = sube
  const stemLenReal = Math.round(Math.hypot(dx_mm, dy_mm));
  const stemAngle   = Math.round(Math.atan2(dy_mm, dx_mm) * 180/Math.PI);
  const spacers     = Math.ceil(Math.max(0, dy_mm) / SPACER_MM);

  out.textContent =
    `Stem (user): ${state.stemLength} mm  —  Stem (real): ${stemLenReal} mm  |  Angle: ${stemAngle}°  |  Spacers: ${spacers}`;
}

draw();
