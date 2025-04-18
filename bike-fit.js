/* =====  constantes fijas (que no dependen del stack) ===== */
const RC       = 410;  // Chainstay (mm)
const HT_LEN   = 90;  // Head‑tube length (mm)
const WHEEL_R  = 335;  // Radio rueda (mm)
const s        = 0.3;  // px / mm  (zoom)

/* =====  controles ===== */
const ids = ["stack","reach","seatTube","saddleHeight","ca","ha"];
const state = {};
ids.forEach(id=>{
  const el = document.getElementById(id);
  state[id] = +el.value;
  el.addEventListener("input",e=>{ state[id] = +e.target.value || 0; draw(); });
});

const canvas = document.getElementById("preview");
const ctx    = canvas.getContext("2d");

/* helpers */
const rad = d => d*Math.PI/180;
const mid = (a,b) => ({x:(a.x+b.x)/2, y:(a.y+b.y)/2});
function line(a,b){ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
function dot(p){ ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill(); }
function label(txt,p,dx=6,dy=-6){
  ctx.fillStyle="#000"; ctx.font="12px sans-serif";
  ctx.fillText(txt,p.x+dx,p.y+dy);
  ctx.fillStyle="#1976d2";
}

/* ===== dibujo ===== */
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.lineWidth=2; ctx.strokeStyle="#1976d2"; ctx.fillStyle="#1976d2";

  /* anclaje Bottom Bracket */
  const bb = {x:canvas.width/2, y:canvas.height-120};

  /* eje trasero */
  const rearAxle = {x:bb.x-RC*s, y:bb.y};

  /* seat‑tube y sillín */
  const ca = rad(state.ca);
  const seatTop = {
    x: bb.x - state.seatTube*Math.cos(ca)*s,
    y: bb.y - state.seatTube*Math.sin(ca)*s
  };
  const saddle = {
    x: bb.x - state.saddleHeight*Math.cos(ca)*s,
    y: bb.y - state.saddleHeight*Math.sin(ca)*s
  };

  /* head‑tube top (stack / reach) */
  const headTop = {
    x: bb.x + state.reach*s,
    y: bb.y - state.stack*s
  };

  /* head‑tube bottom */
  const ha = rad(state.ha);
  const headBot = {
    x: headTop.x + HT_LEN*Math.cos(ha)*s,
    y: headTop.y + HT_LEN*Math.sin(ha)*s
  };

  /* ===  fork length variable para mantener eje delantero horizontal  === */
  const deltaY_px  = bb.y - headBot.y;          // lo que falta bajar hasta el suelo
  const forkLen_px = deltaY_px / Math.sin(ha);  // proyectado sobre HA
  const frontAxle = {
    x: headBot.x + forkLen_px*Math.cos(ha),
    y: bb.y                                         // mismo nivel que la rueda trasera
  };

  /* ----- cuadro y horquilla ----- */
  line(rearAxle, bb);          // chainstay
  line(bb, headBot);           // down‑tube
  line(headBot, frontAxle);    // fork (longitud variable)
  line(headBot, headTop);      // head‑tube
  line(headTop, seatTop);      // top‑tube
  line(seatTop, rearAxle);     // seat‑stay
  line(bb, seatTop);           // seat‑tube
  line(seatTop, saddle);       // tija
  line({x:saddle.x-15,y:saddle.y},{x:saddle.x+15,y:saddle.y}); // sillín

  /* nodos */
  [bb,rearAxle,frontAxle,seatTop,headTop,headBot,saddle].forEach(dot);

/* ruedas guía — cada arco en su propio path */
ctx.beginPath();
ctx.arc(rearAxle.x,  rearAxle.y,  WHEEL_R * s, 0, Math.PI * 2);
ctx.stroke();

ctx.beginPath();
ctx.arc(frontAxle.x, frontAxle.y, WHEEL_R * s, 0, Math.PI * 2);
ctx.stroke();

ctx.setLineDash([]);   // restablece estilo para el resto del dibujo


  /* leyendas */
  label("Seat Tube",   mid(bb,seatTop));
  label("Head Tube",   mid(headTop,headBot));
  label("Fork",        mid(headBot,frontAxle));
  label("Saddle",      {x:saddle.x+18,y:saddle.y});
}

draw();
