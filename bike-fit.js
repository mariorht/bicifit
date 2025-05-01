const ids = [
  'stack','reach','seatTube','saddleHeight','ca','ha',
  'barHeight','barLength','stemLength',
  'RC','HT_LEN','WHEEL_R','SPACER_MM',
  'CRANK_LEN',
  'THIGH_L','SHIN_L',  "TORSO_L",  "upperArm", "lowerArm", "elbowAngle","HEAD_R"
  ,'s'
];
const state = {};
ids.forEach(id => {
  const el = document.getElementById(id);
  state[id] = +el.value;
  el.addEventListener('input', e => { state[id] = +e.target.value || 0; draw(); });
});

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
const out = document.getElementById('calc');

let crankAngle = 0, spinning = false;
document.getElementById('togglePedals').addEventListener('click', () => {
  spinning = !spinning;
  if (spinning) requestAnimationFrame(animate);
});
function animate() {
  if (spinning) {
    crankAngle += 0.05;
    draw();
    requestAnimationFrame(animate);
  }
}

function rad(d) { return d * Math.PI / 180; }
function line(a, b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
function dot(p) { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); }
function circleIntersections(A, rA, B, rB) {
  const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
  if (d > rA + rB || d < Math.abs(rA - rB) || d === 0) return null;
  const a = (rA*rA - rB*rB + d*d) / (2*d);
  const h = Math.sqrt(Math.max(0, rA*rA - a*a));
  const xm = A.x + a * dx / d, ym = A.y + a * dy / d;
  const rx = -dy * (h / d), ry = dx * (h / d);
  return [{x: xm + rx, y: ym + ry}, {x: xm - rx, y: ym - ry}];
}

function draw() {
  // Cargamos valores dinámicos
  const RC          = state.RC;
  const HT_LEN      = state.HT_LEN;
  const WHEEL_R     = state.WHEEL_R;
  const SPACER_MM   = state.SPACER_MM;
  const CRANK_LEN   = state.CRANK_LEN;
  const THIGH_L     = state.THIGH_L;
  const SHIN_L      = state.SHIN_L;
  const TORSO_L     = state.TORSO_L;
  const upperArm    = state.upperArm;
  const lowerArm    = state.lowerArm;
  const HEAD_R      = state.HEAD_R;
  const s           = state.s;
  // Ángulo de codo en grados editado por el usuario
  const manualAngleRad = rad(state.elbowAngle);

  // Limpiamos el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth   = 2;
  ctx.strokeStyle = '#1976d2';
  ctx.fillStyle   = '#1976d2';

  // ===== Geometría de la bici =====
  const bb    = { x: canvas.width/2, y: canvas.height - 120 };
  const ca    = rad(state.ca), ha = rad(state.ha);

  const rearAxle = { x: bb.x - RC * s, y: bb.y };
  const seatTop  = {
    x: bb.x - state.seatTube     * Math.cos(ca) * s,
    y: bb.y - state.seatTube     * Math.sin(ca) * s
  };
  const saddle   = {
    x: bb.x - state.saddleHeight * Math.cos(ca) * s,
    y: bb.y - state.saddleHeight * Math.sin(ca) * s
  };
  const headTop  = { x: bb.x + state.reach * s,       y: bb.y - state.stack * s };
  const headBot  = {
    x: headTop.x + HT_LEN * Math.cos(ha) * s,
    y: headTop.y + HT_LEN * Math.sin(ha) * s
  };
  const forkPx    = (bb.y - headBot.y) / Math.sin(ha);
  const frontAxle = { x: headBot.x + forkPx * Math.cos(ha), y: bb.y };

  // Manillar
  const uHT         = { x: Math.cos(ha), y: Math.sin(ha) };
  const spacerShift = state.barHeight;
  const spacerTop   = {
    x: headTop.x - spacerShift * uHT.x * s,
    y: headTop.y - spacerShift * uHT.y * s
  };
  const clamp     = {
    x: headTop.x + state.stemLength * s - spacerShift * uHT.x * s,
    y: headTop.y - spacerShift * uHT.y * s
  };
  const hood      = 40 * s;
  const reachBar  = state.barLength * s;
  const drop      = 110 * s;
  const hoodEnd   = { x: clamp.x + hood,             y: clamp.y };
  const curveEnd  = { x: hoodEnd.x + reachBar,       y: hoodEnd.y + drop };
  const tailEnd   = { x: curveEnd.x - 20 * s,        y: curveEnd.y };

  line(headTop, spacerTop);
  line(spacerTop, clamp);
  line(clamp, hoodEnd);
  ctx.beginPath();
    ctx.moveTo(hoodEnd.x, hoodEnd.y);
    ctx.quadraticCurveTo(
      hoodEnd.x + reachBar*0.5,
      hoodEnd.y + drop*0.5,
      curveEnd.x, curveEnd.y
    );
  ctx.stroke();
  line(curveEnd, tailEnd);
  dot(clamp);

  // Cuadro
  line(rearAxle, bb);
  line(bb, headBot);
  line(headBot, frontAxle);
  line(headBot, headTop);
  line(headTop, seatTop);
  line(seatTop, rearAxle);
  line(bb, seatTop);
  line(seatTop, saddle);
  line({ x: saddle.x-15, y: saddle.y }, { x: saddle.x+15, y: saddle.y });
  [bb, rearAxle, frontAxle, seatTop, headTop, headBot, saddle].forEach(dot);

  // Ruedas guía
  ctx.setLineDash([4,6]);
  ctx.beginPath(); ctx.arc(rearAxle.x, rearAxle.y, WHEEL_R*s, 0, 2*Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(frontAxle.x, frontAxle.y, WHEEL_R*s, 0, 2*Math.PI); ctx.stroke();
  ctx.setLineDash([]);

  // Cranks & Pedals
  const crankPx = CRANK_LEN * s;
  const pedalR  = {
    x: bb.x + crankPx * Math.cos(crankAngle),
    y: bb.y + crankPx * Math.sin(crankAngle)
  };
  const pedalL  = {
    x: bb.x + crankPx * Math.cos(crankAngle + Math.PI),
    y: bb.y + crankPx * Math.sin(crankAngle + Math.PI)
  };
  line(bb, pedalR);
  line(bb, pedalL);
  dot(pedalR);
  dot(pedalL);

  // ===== Ciclista: pierna =====
  ctx.strokeStyle = '#d32f2f';
  ctx.fillStyle   = '#d32f2f';
  let knee = { x:(saddle.x+pedalR.x)/2, y:(saddle.y+pedalR.y)/2 };
  const kints = circleIntersections(saddle, THIGH_L*s, pedalR, SHIN_L*s);
  if (kints) knee = kints[0].x > saddle.x ? kints[0] : kints[1];
  line(saddle, knee);
  line(knee, pedalR);
  dot(knee);

  // ===== Ciclista: torso + brazo con ángulo manual =====
  // Longitudes en px
  const L_torso = TORSO_L * s;
  const L1      = upperArm  * s;
  const L2      = lowerArm  * s;
  // Distancia entre hombro y muñeca según ley de cosenos
  const D       = Math.sqrt(
    L1*L1 + L2*L2 - 2*L1*L2*Math.cos(manualAngleRad)
  );


  // Hallamos hombro como intersección entre:
  //  - círculo centro saddle radio L_torso
  //  - círculo centro hoodEnd radio D
  let shoulder = { x:(saddle.x+hoodEnd.x)/2, y:(saddle.y+hoodEnd.y)/2 };
  const shInts = circleIntersections(saddle, L_torso, hoodEnd, D);
  if (shInts) {
    // elegimos la solución más abajo (y mayor) para agachar el pecho
    shoulder = shInts[0].y > shInts[1].y ? shInts[1] : shInts[0];
  }
  // torso
  line(saddle, shoulder);
  dot(shoulder);

  // Hallamos codo como intersección entre:
  //  - círculo centro shoulder radio L1
  //  - círculo centro hoodEnd radio L2
  let elbow = { x:(shoulder.x+hoodEnd.x)/2, y:(shoulder.y+hoodEnd.y)/2 };
  const eInts = circleIntersections(shoulder, L1, hoodEnd, L2);
  if (eInts) {
    // elegimos la solución por debajo del hombro
    elbow = eInts.find(e => e.y > shoulder.y) || eInts[0];
  }
  // dibujo de brazo
  line(shoulder, elbow);
  dot(elbow);
  line(elbow, hoodEnd);
  dot(hoodEnd);

  // Cabeza
  ctx.beginPath();
    ctx.arc(
      shoulder.x,
      shoulder.y - HEAD_R*s,
      HEAD_R*s,
      0, 2*Math.PI
    );
  ctx.stroke();

  // ==== Ángulo en el codo (decorativo) ====
  // const v1 = { x: shoulder.x - elbow.x, y: shoulder.y - elbow.y };
  // const v2 = { x: hoodEnd.x  - elbow.x, y: hoodEnd.y  - elbow.y };
  // const dotp = v1.x*v2.x + v1.y*v2.y;
  // const angleRad = Math.acos(Math.min(1, Math.max(-1, dotp/(Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y)))));
  // const angleDeg = Math.round(angleRad * 180/Math.PI);
  // const arcR = 20 * s;
  // const a1 = Math.atan2(v1.y, v1.x);
  // const a2 = Math.atan2(v2.y, v2.x);
  // ctx.strokeStyle = '#d32f2f';
  // ctx.beginPath(); ctx.arc(elbow.x, elbow.y, arcR, a1, a2); ctx.stroke();
  // ctx.fillStyle = '#000';
  // ctx.font = '14px sans-serif';
  // let delta = a2 - a1; if (delta < 0) delta += 2*Math.PI;
  // const mid = a1 + delta/2;
  // ctx.fillText(
  //   `${angleDeg}°`,
  //   elbow.x + (arcR+10)*Math.cos(mid),
  //   elbow.y + (arcR+10)*Math.sin(mid)
  // );

  // // ==== Cálculo stem & espaciadores ====
  // ctx.strokeStyle = '#1976d2';
  // const dx_mm    = (clamp.x - headTop.x) / s;
  // const dy_mm    = (headTop.y - clamp.y) / s;
  // const stemReal = Math.round(Math.hypot(dx_mm, dy_mm));
  // const stemAng  = Math.round(Math.atan2(dy_mm, dx_mm) * 180/Math.PI);
  // const spacers  = Math.ceil(Math.max(0, dy_mm) / SPACER_MM);
  // out.textContent =
  //   `Stem (user): ${state.stemLength} mm — Stem (real): ${stemReal} mm | ` +
  //   `Angle: ${stemAng}° | Spacers: ${spacers}`;
}


draw();